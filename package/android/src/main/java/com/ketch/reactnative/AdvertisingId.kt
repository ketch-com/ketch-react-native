package com.ketch.reactnative

import android.content.Context
import android.util.Log
import androidx.annotation.VisibleForTesting
import com.google.android.gms.ads.identifier.AdvertisingIdClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async

/**
 * The `nativeResolve` key for the Android advertising ID (AAID).
 */
internal const val KEY_AAID = "ketch_aaid"

private const val GMS_AD_ID_CLIENT_CLASS =
    "com.google.android.gms.ads.identifier.AdvertisingIdClient"

private const val ZEROED_AAID = "00000000-0000-0000-0000-000000000000"

/**
 * Reads the platform advertising ID. Returns null when unavailable or when the user has limited
 * ad tracking — a zeroed ID must never be treated as a value.
 */
internal interface AaidReader {
    fun read(context: Context): String?
}

/**
 * isLimitAdTrackingEnabled is the documented signal, but some devices hand back the zeroed
 * placeholder without setting it, so the literal value is checked too.
 */
internal fun mapAaid(id: String?, isLimitAdTrackingEnabled: Boolean): String? =
    if (isLimitAdTrackingEnabled || id == ZEROED_AAID) null else id

internal object GmsAaidReader : AaidReader {
    private val TAG = GmsAaidReader::class.java.simpleName

    override fun read(context: Context): String? = try {
        val info = AdvertisingIdClient.getAdvertisingIdInfo(context)
        mapAaid(info.id, info.isLimitAdTrackingEnabled)
    } catch (ex: Throwable) {
        // Throwable, not Exception: also guards NoClassDefFoundError, in case only part of the
        // compileOnly artifact is present at runtime despite the Class.forName gate passing.
        Log.e(TAG, "AAID read failed", ex)
        null
    }
}

/**
 * In-memory, process-lifetime cache for the AAID. Never persisted, so a device-level ad ID reset
 * is picked up on the next process launch.
 */
internal object AaidResolver {
    @VisibleForTesting
    internal var reader: AaidReader = GmsAaidReader

    @VisibleForTesting
    internal var isAvailable: () -> Boolean = ::isAaidClassAvailable

    @VisibleForTesting
    internal var scope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private var cached: Deferred<String?>? = null

    /**
     * Returns the AAID, starting (and caching) the resolve on first call. Concurrent callers
     * coalesce onto the same in-flight resolve rather than each binding to Play Services.
     */
    suspend fun resolve(context: Context): String? {
        val appContext = context.applicationContext ?: context
        val deferred = synchronized(this) {
            cached ?: scope.async {
                if (!isAvailable()) null else reader.read(appContext)
            }.also { cached = it }
        }
        return deferred.await()
    }

    @VisibleForTesting
    internal fun resetForTesting() {
        synchronized(this) { cached = null }
        reader = GmsAaidReader
        isAvailable = ::isAaidClassAvailable
        scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    }
}

private fun isAaidClassAvailable(): Boolean = try {
    Class.forName(GMS_AD_ID_CLIENT_CLASS)
    true
} catch (_: ClassNotFoundException) {
    false
}
