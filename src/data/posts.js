const posts = [
  {
    title: "One User, Many Sessions: A Thread-Safe Map of Lists",
    path: "posts/post-006.html",
    description:
      "A thread-safe map of lists behind server-sent events, so one pod can safely fan a notification out to every session a user has open.",
  },
  {
    title: "Context Lock for Phone Number Validation",
    path: "posts/post-005.html",
    description:
      "A context-aware Redis lock that lets a failed async retry continue, while still blocking a genuinely competing process on the same phone number.",
  },
  {
    title: "The Collections.synchronizedList() Trap Behind a Flaky Test",
    path: "posts/post-004.html",
    description:
      "Why a synchronized list still threw ConcurrentModificationException during iteration, and how CopyOnWriteArrayList fixed it for good.",
  },
  {
    title: "Optimizing Batch Processing: When Limits and Pagination Are Not Enough",
    path: "posts/post-003.html",
    description:
      "Replacing rigid record limits and pagination loops with a time-boxed batch processor that adapts to the actual load.",
  },
  {
    title: "Dynamic Lock Management: Concurrency by ID",
    path: "posts/post-002.html",
    description:
      "Self-cleaning, per-ID locks built from ConcurrentHashMap and reference counting, without leaking memory over time.",
  },
  {
    title: "The Hidden State: Concurrency Issues in a Singleton Bean",
    path: "posts/post-001.html",
    description:
      "How shared mutable state in a Spring singleton, combined with List.subList(), quietly duplicated data under load.",
  },
];

window.posts = posts;

