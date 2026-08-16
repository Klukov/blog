# One User, Many Sessions: A Thread-Safe Map of Lists

Some notifications can't wait for a poll. We needed them pushed the moment they happen, so we used server-sent events instead. We run multiple pods, and a state change can originate on any of them, so it's broadcast over RabbitMQ: every pod receives it and tries to push it to the affected user. Whichever pod actually holds that user's connection succeeds; the others simply have nothing to do.

## One Key, Many Connections

That's the easy part. It gets harder because a single pod can hold more than one open connection for the same user at once — phone in one hand, desktop tab open at work, both happening to land on the same instance. One event, and one pod might have to push it out over several connections.

The obvious storage is `user -> connection`. That breaks the moment a second session lands on the same pod. It has to be `user -> list of connections`.

`ConcurrentHashMap` makes the map itself safe to read and write from multiple threads. It says nothing about the *value* stored under each key. If that value is a plain `List`, mutating it concurrently — one thread adding a new session, another removing a closed one, a third iterating it to broadcast an event — is a race condition, regardless of how "concurrent" the map is.

We needed three operations to be safe at once:

- add a single connection when a session opens,
- remove a single connection when a session closes,
- read a stable snapshot of the list to push an event to every open connection on this pod.

And once a user's last session on this pod closes, the key shouldn't linger in the map with an empty list forever — that's a slow memory leak.

## ConcurrentAddRemoveListInMap

[`ConcurrentAddRemoveListInMap<K, E>`](https://github.com/Klukov/klukov-utils/blob/main/src/main/java/org/klukov/utils/structures/ConcurrentAddRemoveListInMap.java) wraps a `ConcurrentHashMap<K, Collection<E>>` and handles all three operations atomically at the map-bucket level:

```java
public class ConcurrentAddRemoveListInMap<K, E> {

    private final Map<K, Collection<E>> storage = new ConcurrentHashMap<>();
    private final Supplier<? extends Collection<E>> collectionSupplier;

    public void add(K key, E value) {
        storage.compute(key, (k, collection) -> {
            if (collection == null) {
                collection = collectionSupplier.get();
            }
            collection.add(value);
            return collection;
        });
    }

    public void remove(K key, E value) {
        storage.computeIfPresent(key, (k, collection) -> {
            collection.remove(value);
            return collection.isEmpty() ? null : collection;
        });
    }

    public List<E> getCopyOfElements(K key) {
        var collection = storage.get(key);
        return collection == null ? Collections.emptyList() : List.copyOf(collection);
    }
}
```

Two details do all the work here:

- **`compute` / `computeIfPresent`** run their lambda atomically per key. Two threads touching the *same* user never interleave; two threads touching *different* users never block each other.
- **`remove` returning `null`** when the collection is empty tells `ConcurrentHashMap` to drop the key entirely. No manual cleanup, no leftover empty lists.
- **`getCopyOfElements`** always returns `List.copyOf(collection)` — a snapshot, not a live view — so iterating it to broadcast an event is safe even while another thread is adding or removing sessions at the same time.

## Throughput vs. Consistency

The underlying collection isn't hardcoded — it's supplied by the caller, and the class ships two ready-made factories:

| Factory | Backing collection | Trade-off |
|---|---|---|
| `highConcurrentListInMap()` | `ConcurrentLinkedQueue` | Fastest under heavy churn, but a snapshot can — in rare interleavings — reflect a state that never truly existed at any single point in time. |
| `consistentConcurrentListInMap()` | `CopyOnWriteArrayList` | Every snapshot is a real, consistent copy. Cost scales with list length on every add/remove. |

For our SSE case, the choice was easy. A user rarely has more than a couple of sessions open, so the copy-on-write cost is negligible, while getting a wrong or half-updated snapshot means a real event silently missing a real connection. We use `consistentConcurrentListInMap()`. The high-throughput variant is there for cases with large, fast-changing lists where an occasional inconsistent read is an acceptable trade for speed.

## Links

- Full library: [klukov-utils](https://github.com/Klukov/klukov-utils)
- [`ConcurrentAddRemoveListInMap.java`](https://github.com/Klukov/klukov-utils/blob/main/src/main/java/org/klukov/utils/structures/ConcurrentAddRemoveListInMap.java)


