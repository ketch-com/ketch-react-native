package com.ketch.reactnative

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class KetchAdIdentifiersModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun getName(): String = "KetchAdIdentifiers"

    @ReactMethod
    fun getAaid(promise: Promise) {
        scope.launch {
            promise.resolve(AaidResolver.resolve(reactApplicationContext))
        }
    }
}
