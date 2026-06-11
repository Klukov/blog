# Dynamic Lock Management: Concurrency by ID

During a live-coding interview, I was tasked with the following concurrency problem: ensure that only one task with a given ID runs at a time in a single-instance, multi-threaded environment. The resulting code is a perfect example of how to handle dynamic lock management without memory leaks.

## The Problem

Tasks sharing the same identifier (`ID`) must execute sequentially. Tasks with different IDs must be running concurrently.

A naive approach `ConcurrentHashMap<ID, Object>` to hold locks causes memory leaks, as the map grows indefinitely. We need a way to allocate locks dynamically when an ID arrives and clean them up safely when no longer in use.

## The Solution

By combining `ConcurrentHashMap` with reference counting via `AtomicInteger`, we can achieve fine-grained, self-cleaning locks.

You can find the full source code [here on GitHub](https://github.com/Klukov/klukov-utils/blob/main/src/main/java/org/klukov/utils/processing/ConcurrentProcessor.java).

```java
package org.klukov.utils.processing;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Supplier;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ConcurrentProcessor<ID> {

    private final ConcurrentHashMap<ID, AtomicInteger> LOCK_MAP = new ConcurrentHashMap<>();

    public void process(ID id, Runnable runnable) {
        process(
                id,
                () -> {
                    runnable.run();
                    return null;
                });
    }

    public <T> T process(ID id, Supplier<T> supplier) {
        log.debug("Incoming request with id = {}", id);
        
        var lock = LOCK_MAP.compute(id, (key, value) -> createOrIncrement(value));
        log.debug("Acquired lock for id = {}", id);
        
        synchronized (lock) {
            log.debug("Processing id = {}", id);
            try {
                return supplier.get();
            } finally {
                log.debug("Finished processing with id = {}", id);
                LOCK_MAP.computeIfPresent(id, (key, value) -> decrement(value).orElse(null));
                log.debug("Lock removed with id = {}", id);
            }
        }
    }

    @NonNull private AtomicInteger createOrIncrement(AtomicInteger value) {
        return value == null ? new AtomicInteger(1) : increment(value);
    }

    @NonNull private AtomicInteger increment(@NonNull AtomicInteger value) {
        value.incrementAndGet();
        return value;
    }

    private Optional<AtomicInteger> decrement(@NonNull AtomicInteger value) {
        var current = value.decrementAndGet();
        if (current < 1) {
            return Optional.empty();
        }
        return Optional.of(value);
    }
}
```

## How It Works

The implementation avoids race conditions and memory leaks through three mechanisms:

### 1. Atomic Map Operations
`ConcurrentHashMap.compute()` and `computeIfPresent()` guarantee that the lambda executes atomically for a specific key. This prevents race conditions when multiple threads request a lock for the same ID simultaneously.

### 2. Reference Counting
We use `AtomicInteger` as both the monitor for the `synchronized` block and a reference counter. It tracks exactly how many threads are waiting for or actively holding the lock.

### 3. Safe Cleanup
In the `finally` block, `computeIfPresent` locks the map bucket. If the reference count drops to zero (`decrement` returns `Optional.empty()`, mapped to `null`), the `ConcurrentHashMap` safely removes the entry. The lock is destroyed only when no threads are queued up to use it.

By keeping the state minimal and leveraging atomic map operations, this pattern efficiently handles entity-based ordering while maintaining high global throughput.

---

*P.S. While I passed the technical round (though ultimately didn't align with HR), it was one of the most educational live-coding tasks I've ever received.*
