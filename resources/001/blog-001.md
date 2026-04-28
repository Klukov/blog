# The Hidden State: Concurrency Issues in a Singleton Bean

Early in my career, I encountered a subtle bug in a legacy repository that caused intermittent errors for users down the line. The root cause was hidden within a 500-line service class, in a section of logic responsible for saving a user's process to the database, which seemed entirely trivial at first glance.

The issue boiled down to a fundamental misunderstanding of how Spring manages bean lifecycles and state.

## The Problematic Code

The system required users to later verify their identity during login by providing 4 randomly selected digits from their PESEL number (a Polish national identification number consisting of 11 digits). To prepare for this, when saving the initial process to the database, the service shuffled a list of indices (0 to 10), took the first 4, and persisted them. 

Here is a simplified version of the code. The actual class was much larger, which made this specific variable easy to overlook.

```java
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class PeselVerificationService {

    // Shared mutable state in a singleton bean.
    private final List<Integer> peselIndices = Arrays.asList(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

    public List<Integer> drawVerificationIndices() {
        // Mutates the same list instance for every request.
        Collections.shuffle(peselIndices);
        
        return peselIndices.subList(0, 4).stream()
                // The stream iterates over a subList view backed by peselIndices.
                // Concurrent shuffle can change the elements visible through that view.
                .sorted()
                .toList();
    }
}
```

## Why It Failed

The failure stems from two interconnected issues: Spring's bean lifecycle and a misunderstanding of how Java's `subList` works.

### 1. Spring Lifecycle: The Singleton Trap
In Spring, beans annotated with `@Service` are singletons by default. There is only one instance of `PeselVerificationService` for the whole application. Consequently, the `peselIndices` list is a shared state. Every request handled by different threads operates on the exact same list object.

Even though the list is marked as `private final`, only the **reference** to the list is constant. The internal elements of the list are still mutable. Because it wasn't marked `static`, it was easier to miss that this variable is effectively global state for all users.

### 2. The `subList` View vs. Copy
The `subList(fromIndex, toIndex)` method does not create a new, independent list. It returns a **view** of a portion of the original list. In this case, both the original list and the sublist ultimately point to the same underlying storage.

This distinction matters because `subList(0, 4)` alone would not copy anything and would not, by itself, create duplicated values. The problematic part is the next operation: `.stream().sorted().toList()`. To produce the result, the stream has to iterate over the sublist view and materialize a new list. At the same time, another thread might call `Collections.shuffle(peselIndices)` on the base list.

Since the sublist is just a window into the original list, iterating through that window while another thread is shuffling the base list leads to a race condition. A value that has already been read by the first thread can be moved into a later position still waiting to be read. As a result, the same PESEL index can be collected twice and saved to the database.

## The Solution

The rule here is simple: **do not store request-specific or mutable state in a singleton bean.**

To fix this, the initial list of indices should be treated as an immutable template. If shuffling is required per request, the thread must operate on its own local copy of the list.

```java
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class PeselVerificationService {

    private final List<Integer> peselIndices = Arrays.asList(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

    public List<Integer> drawVerificationIndices() {
        // Create a local copy for this specific request.
        List<Integer> localIndices = new ArrayList<>(peselIndices);
        Collections.shuffle(localIndices);

        // All further operations work on request-local data.
        return localIndices.subList(0, 4).stream()
                .sorted()
                .toList();
    }
}
```

By keeping mutable state confined to the method scope (local variables), we ensure thread safety without needing complex synchronization.
