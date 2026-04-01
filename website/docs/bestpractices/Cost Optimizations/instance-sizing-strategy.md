---
sidebar_label: Instance Sizing Strategy
---

# Instance Sizing Strategy: Vertical vs Horizontal Scaling

Selecting the right instance family and size affects both performance and cost of EMR workloads. This guide covers two key decisions: instance family selection and vertical vs horizontal scaling.

## Instance Family Selection

When optimizing for price-performance, it is worth evaluating general-purpose instances alongside memory-optimized or compute-optimized options.

**Key observations**:

- Moving from R6G to R8G improves performance, but the higher instance price can offset the gains — resulting in similar price-performance
- General-purpose instances (e.g., M8G) can deliver comparable performance to memory-optimized instances (e.g., R8G) of the same size at lower cost
- This holds even when sizing tools recommend the same CPU/memory ratio as R-family instances

**Recommendation**: Benchmark with general-purpose (M-family) instances alongside memory-optimized (R-family) before committing to a fleet configuration.

## Vertical Scaling (Larger Instances)

Larger instances with fewer executors tend to perform better for:

- **Shuffle-heavy workloads**: More data stays local to the executor, reducing network shuffle overhead
- **Large joins**: Executors have enough memory to hold intermediate data without spilling to disk
- **Skewed workloads**: Hot partitions have more CPU/memory headroom before causing heartbeat timeouts, GC pauses, or disk spill
- **Coordination overhead**: Fewer executors means fewer network connections during shuffle and fewer fetch failures

## Horizontal Scaling (Smaller Instances)

Smaller instances with more executors are better for:

- **GC-sensitive workloads**: Smaller heap sizes lead to better garbage collection behavior and more predictable latency
- **Fault tolerance**: Losing one executor out of 100 is less disruptive than losing one out of 10
- **Dynamic Resource Allocation (DRA)**: Easier to scale up/down in smaller increments, particularly effective with EMR Serverless
- **High-concurrency environments**: Better resource sharing across many concurrent jobs

## Workload-Specific Guidance

The right choice depends on your workload profile:

| Workload Type | Recommended Approach | Reason |
|---|---|---|
| Complex joins and aggregations (e.g., TPC-DS) | Vertical (larger instances) | Less shuffle, more local processing |
| Many small jobs / analyst workloads | Horizontal (smaller instances) | Better concurrency and resource sharing |
| Latency-sensitive pipelines | Horizontal (smaller instances) | More predictable GC behavior |
| Large ETL with data skew | Vertical (larger instances) | Headroom for hot partitions |

:::tip
When benchmarking, distinguish between optimizing for benchmark numbers (e.g., TPC-DS) and optimizing for your actual production workload. The optimal instance strategy may differ between the two.
:::
