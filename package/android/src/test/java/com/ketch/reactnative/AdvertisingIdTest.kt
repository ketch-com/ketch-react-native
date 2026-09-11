@file:OptIn(ExperimentalCoroutinesApi::class)

package com.ketch.reactnative

import android.content.Context
import android.content.ContextWrapper
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

class MapAaidTest {
    @Test
    fun realId_notLimited_returnsTheId() {
        assertEquals("real-id", mapAaid("real-id", isLimitAdTrackingEnabled = false))
    }

    @Test
    fun realId_limited_returnsNull() {
        assertNull(mapAaid("real-id", isLimitAdTrackingEnabled = true))
    }

    @Test
    fun zeroedId_notLimited_returnsNull() {
        assertNull(
            mapAaid("00000000-0000-0000-0000-000000000000", isLimitAdTrackingEnabled = false)
        )
    }

    @Test
    fun zeroedId_limited_returnsNull() {
        assertNull(
            mapAaid("00000000-0000-0000-0000-000000000000", isLimitAdTrackingEnabled = true)
        )
    }

    @Test
    fun nullId_returnsNull() {
        assertNull(mapAaid(null, isLimitAdTrackingEnabled = false))
    }
}

// getApplicationContext() is overridden directly so no inherited Android framework method is
// ever invoked on this fake.
private val fakeContext: Context = object : ContextWrapper(null) {
    override fun getApplicationContext(): Context = this
}

private class CountingReader(private val result: String?) : AaidReader {
    val callCount = AtomicInteger(0)

    override fun read(context: Context): String? {
        callCount.incrementAndGet()
        return result
    }
}

class AaidResolverTest {
    @Before
    fun setUp() {
        AaidResolver.resetForTesting()
    }

    @After
    fun tearDown() {
        AaidResolver.resetForTesting()
    }

    @Test
    fun dependencyAbsent_alwaysReturnsNull_readerNeverCalled() = runTest {
        val reader = CountingReader("some-id")
        AaidResolver.reader = reader
        AaidResolver.isAvailable = { false }
        AaidResolver.scope = CoroutineScope(StandardTestDispatcher(testScheduler))

        assertNull(AaidResolver.resolve(fakeContext))
        assertNull(AaidResolver.resolve(fakeContext))
        assertEquals(0, reader.callCount.get())
    }

    @Test
    fun limitAdTrackingEnabled_resolvesToNull() = runTest {
        val reader = CountingReader(result = null)
        AaidResolver.reader = reader
        AaidResolver.isAvailable = { true }
        AaidResolver.scope = CoroutineScope(StandardTestDispatcher(testScheduler))

        assertNull(AaidResolver.resolve(fakeContext))
        assertEquals(1, reader.callCount.get())
    }

    @Test
    fun limitAdTrackingDisabled_resolvesToTheId() = runTest {
        val reader = CountingReader(result = "the-aaid")
        AaidResolver.reader = reader
        AaidResolver.isAvailable = { true }
        AaidResolver.scope = CoroutineScope(StandardTestDispatcher(testScheduler))

        assertEquals("the-aaid", AaidResolver.resolve(fakeContext))
        assertEquals(1, reader.callCount.get())
    }

    @Test
    fun resolveComplete_cachedValueReturnedWithoutRereading() = runTest {
        val reader = CountingReader(result = "the-aaid")
        AaidResolver.reader = reader
        AaidResolver.isAvailable = { true }
        AaidResolver.scope = CoroutineScope(StandardTestDispatcher(testScheduler))

        assertEquals("the-aaid", AaidResolver.resolve(fakeContext))
        assertEquals("the-aaid", AaidResolver.resolve(fakeContext))
        assertEquals("the-aaid", AaidResolver.resolve(fakeContext))
        assertEquals(1, reader.callCount.get())
    }

    @Test
    fun freshProcessState_readsAgain() = runTest {
        val firstReader = CountingReader(result = "the-aaid")
        AaidResolver.reader = firstReader
        AaidResolver.isAvailable = { true }
        AaidResolver.scope = CoroutineScope(StandardTestDispatcher(testScheduler))
        assertEquals("the-aaid", AaidResolver.resolve(fakeContext))

        // Simulates a new process launch: a fresh AaidResolver has no carried-over cache, so a
        // device-level ad ID reset (which this in-memory-only design never persists past) is
        // picked up on the very next resolve.
        AaidResolver.resetForTesting()
        val secondReader = CountingReader(result = "a-new-aaid-after-reset")
        AaidResolver.reader = secondReader
        AaidResolver.isAvailable = { true }
        AaidResolver.scope = CoroutineScope(StandardTestDispatcher(testScheduler))

        assertEquals("a-new-aaid-after-reset", AaidResolver.resolve(fakeContext))
        assertEquals(1, secondReader.callCount.get())
    }
}
