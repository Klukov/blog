# Optimizing Batch Processing: When Limits and Pagination Are Not Enough

In large enterprise systems, periodic data processing (batch processing) is a daily occurrence. We often use tools like Quartz Scheduler for this purpose. The architecture of such jobs is usually quite simple: **find data to process -> process it -> save the result**.

To control load and execution time, one of two approaches is typically used: a static data volume limit or pagination (processing everything in a loop). However, both solutions have serious drawbacks.

## Pitfalls of the Classic Approach

**1. Rigid Volume Limit (e.g., 1000 records)**
Imagine a job that runs every 1 hour. Processing the set limit of 1000 records takes 2 minutes. For the remaining 58 minutes, the process "sleeps". Resources are wasted, and we could have processed thousands of backlogged records during that time. This is a highly inefficient use of the time window.

**2. Pagination (processing until the table is empty)**
The second approach is processing batch by batch until the data runs out. Usually, such a job finishes in 15 minutes. But what happens when a gigantic package of records arrives (e.g., after a weekend)? A process that was supposed to take an hour stretches to two. Such an extension can lead to severe system problems:
*   **Task Interference / Resource Contention:** Tools like Quartz Scheduler prevent the exact same job from overlapping (a second instance won't start while the first is running). However, a prolonged job can still overlap with *other* scheduled jobs that operate on the same records. This can lead to database deadlocks or thread pool exhaustion.
*   **Resource Exhaustion:** A long-running process continuously loads the database CPU, utilizes memory, and keeps connections open. This can slow down or even halt other critical user operations.
*   **Lack of Predictability:** The system becomes difficult to monitor, and scheduling deployments or maintenance windows becomes impossible when we don't know when a process will release resources.

## My Solution: Time-Based, Not Volume-Based Limits

Instead of guessing what record limit will be optimal, I decided to invert the problem: **let the process run for as long as it has time**. 

That's why I created `InTimeBatchProcessor`. It performs processing in batches, but its stop condition is the expiration of a defined time window (e.g., 55 minutes for an hourly job). As a result, on "light" days, the job finishes quickly, and under heavy load, it processes as much data as possible, but finishes safely before the next scheduled run.

## How Exactly Does It Work?

`InTimeBatchProcessor` is a simple and precise mechanism that implements the following logic under the hood:
1. At the start, it calculates the exact finish time (`finishDateTime = currentTime + duration`).
2. It starts an infinite loop that **before fetching each new data batch** checks if the designated time limit has been exceeded.
3. The loop terminates and returns the number of processed records in one of three cases:
   *   The designated time has run out.
   *   The data source is empty (no more records).
   *   An error occurred during processing (in the variant processing a batch as a single `Callable`).


## Conclusion

This approach drastically increases the stability of batch systems. It shifts the responsibility from the programmer ("what limit should I set for production?") to the system itself ("you have 50 minutes, do as much as you can in that time").

🔗 **[You can find the full code of the InTimeBatchProcessor class in my GitHub repository](https://github.com/Klukov/klukov-utils/blob/main/src/main/java/org/klukov/utils/processing/InTimeBatchProcessor.java)**