# The `Collections.synchronizedList()` Trap Behind a Flaky Test

In a project I work on, we had a repository responsible for storing incoming WebSocket messages. To make it thread-safe with minimal effort, the storage backing that repository was implemented as a simple wrapper:

```java
private final List<Message> messages = Collections.synchronizedList(new ArrayList<>());
```

It looked correct at first glance. Adding a message and reading messages by index both went through synchronized methods, so no two threads could corrupt the underlying array at the same time.

## Where It Broke

The repository wasn't only used through single `add()`/`get()` calls. In one of our tests, several threads pushed messages into the repository concurrently while the test iterated over the whole list to assert on its contents:

```java
for (Message message : repository.getAll()) {
    // assertions on message
}
```

`getAll()` simply returned the underlying `messages` list, still backed by `Collections.synchronizedList()`. Most of the time the test passed, but from time to time on CI it turned flaky, failing with a `ConcurrentModificationException` thrown mid-iteration. Locally it almost never reproduced, since the timing window where a write and an iteration overlap is narrow. Under CI load, with threads scheduled less predictably, it surfaced often enough to be annoying.

## Root Cause

The mistake was assuming that "synchronized list" means "safe to iterate". It doesn't. The [official Javadoc for `Collections.synchronizedList()`](https://docs.oracle.com/javase/8/docs/api/java/util/Collections.html#synchronizedList-java.util.List-) is explicit about this:

> It is imperative that the user manually synchronize on the returned list when iterating over it:
>
> ```java
> List list = Collections.synchronizedList(new ArrayList());
>     ...
> synchronized (list) {
>     Iterator i = list.iterator(); // Must be in synchronized block
>     while (i.hasNext())
>         foo(i.next());
> }
> ```
>
> Failure to follow this advice may result in non-deterministic behavior.

`Collections.synchronizedList()` only wraps individual method calls (`add`, `get`, `size`) in a lock. Its `iterator()` method just returns the backing list's own iterator, unguarded, so `hasNext()`/`next()` calls made on it never synchronize on anything. The backing `ArrayList` iterator is fail-fast: it remembers the list's modification count at creation time and checks it on every `next()` call. If another thread adds or removes an element while the iteration is in progress, that check fails and `next()` throws `ConcurrentModificationException`.

Wrapping every iteration in `synchronized (messages) { ... }` as the Javadoc suggests would have fixed the flakiness, but it relies on every caller remembering to synchronize on the right object every time it iterates. That's easy to get right once and forget about later as the code evolves.

## The Fix: `CopyOnWriteArrayList`

Given our access pattern, messages added concurrently from multiple threads while readers frequently iterate over the whole collection, we replaced the storage with `CopyOnWriteArrayList`:

```java
private final List<Message> messages = new CopyOnWriteArrayList<>();
```

`CopyOnWriteArrayList` takes the opposite trade-off from `synchronizedList()`. Every `add()`/`remove()` copies the entire underlying array and atomically swaps the reference, so writes are more expensive. In exchange, an iterator obtained from it operates on a fixed snapshot of the array taken at the moment it was created. Concurrent additions or removals from other threads never affect that snapshot, so `ConcurrentModificationException` becomes structurally impossible and no manual `synchronized` block around the loop is needed.

Producers keep adding messages concurrently while the test iterates over a stable snapshot, and the flakiness disappeared entirely.

## Takeaway

`Collections.synchronizedList()` only makes individual operations atomic, not iteration. If your code iterates over such a list from multiple threads, you either synchronize manually on every iteration, or pick a collection built for that access pattern, like `CopyOnWriteArrayList` for frequent reads and rare writes.
