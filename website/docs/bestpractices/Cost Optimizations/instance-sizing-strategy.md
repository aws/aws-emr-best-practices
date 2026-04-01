---
sidebar_label: Instance Sizing Strategy
---

# Instance Sizing Strategy: Vertical vs Horizontal Scaling

One of the first questions teams face when setting up EMR clusters is: should we use a few large nodes or many smaller ones? And which instance family — R, M, C? There's no single right answer, but there are patterns worth understanding before you start benchmarking.

## Rethinking Instance Family Choices

A common assumption is that Spark workloads need memory-optimized instances (R-family) because Spark is memory-hungry. In practice, this isn't always the case.

We've seen teams move from R8G to M8G instances of the same size and observe minimal performance difference — while saving significantly on cost. This can be counterintuitive, especially when EMR sizing tools recommend the same CPU-to-memory ratio as R instances. But many Spark jobs don't actually use all that extra memory, particularly if shuffle spill and caching aren't dominant factors in the workload.

On the other hand, moving from an older generation (say R6G) to a newer one (R8G) does improve raw performance — but the per-instance price also goes up. The net effect on price-performance can be a wash.

**Bottom line**: Don't default to R-family out of habit. Run your workload on M-family instances of the same size and compare. You may find the cost savings are substantial with little to no performance trade-off.

## Vertical vs Horizontal: What's the Trade-off?

Consider two ways to get roughly the same total compute — 288 vCPUs and ~2,300 GB of memory:

```
  VERTICAL: 3 × r8gd.24xlarge                HORIZONTAL: 36 × r8gd.2xlarge
  ┌────────────────────────┐                  ┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐
  │    r8gd.24xlarge       │                  │.2xl ││.2xl ││.2xl ││.2xl ││.2xl ││.2xl │
  │    96 vCPU / 768 GB    │                  │8vCPU││8vCPU││8vCPU││8vCPU││8vCPU││8vCPU│
  │    ~6 large executors  │                  │64 GB││64 GB││64 GB││64 GB││64 GB││64 GB│
  ├────────────────────────┤                  └─────┘└─────┘└─────┘└─────┘└─────┘└─────┘
  │    r8gd.24xlarge       │                  ┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐
  │    96 vCPU / 768 GB    │                  │.2xl ││.2xl ││.2xl ││.2xl ││.2xl ││.2xl │
  │    ~6 large executors  │                  │8vCPU││8vCPU││8vCPU││8vCPU││8vCPU││8vCPU│
  ├────────────────────────┤                  │64 GB││64 GB││64 GB││64 GB││64 GB││64 GB│
  │    r8gd.24xlarge       │                  └─────┘└─────┘└─────┘└─────┘└─────┘└─────┘
  │    96 vCPU / 768 GB    │                             ... + 24 more nodes
  │    ~6 large executors  │
  └────────────────────────┘
  Total: ~18 executors                        Total: ~36 executors
```

Same total resources, very different behavior. Here's why.

### Why Vertical Works Well for Some Workloads

When Spark shuffles data — during joins, aggregations, or repartitions — it moves data between executors over the network. With larger instances, more of that data stays local. An executor on a 24xlarge node has enough memory to hold large partitions without spilling to disk, and there are fewer executors to coordinate with during shuffle.

This matters most when:

- **Joins are large and complex** — think multi-way joins on big tables, like TPC-DS style queries. The executor can hold both sides of a join partition in memory.
- **Data is skewed** — if one partition is 10x larger than the rest, a big executor can absorb it. On a small instance, that same partition causes GC pressure, heartbeat timeouts, and eventually task failures.
- **Shuffle is the bottleneck** — fewer executors means fewer network connections, fewer fetch requests, and fewer "FetchFailedException" errors that plague large clusters.

### Why Horizontal Works Well for Other Workloads

Smaller instances aren't just "worse vertical." They have real advantages:

- **Garbage collection is dramatically better** with smaller heaps. A 4 GB executor heap rarely causes long GC pauses. A 64 GB heap can pause for seconds during full GC — and that pause can cascade into missed heartbeats and task re-launches.
- **Fault tolerance improves** — if a node dies, you lose 1 out of 36 executors instead of 1 out of 3 nodes (taking ~6 executors with it). Recovery is faster and less disruptive.
- **Dynamic Resource Allocation (DRA)** works better in smaller increments. EMR Serverless in particular benefits from this — it can spin up and release capacity more granularly.
- **Multi-tenant or high-concurrency setups** share resources more effectively across many small executors than a few large ones.

### Instance Family Comparison at a Glance

| Configuration | vCPU | Memory | Relative Cost | Best For |
|---|---|---|---|---|
| r8gd.24xlarge × 3 nodes | 288 | 2,304 GB | Higher per node, fewer nodes | Shuffle-heavy, skewed, complex joins |
| r8gd.2xlarge × 36 nodes | 288 | 2,304 GB | Lower per node, more nodes | GC-sensitive, high-concurrency, DRA |
| m8g.4xlarge × 18 nodes | 288 | 1,152 GB | Lower overall | Cost-optimized when memory isn't the bottleneck |

## Matching Strategy to Workload

| Workload Profile | Approach | Why |
|---|---|---|
| Complex analytical queries (TPC-DS style) | Vertical | Less shuffle, executors can hold large join partitions |
| Many small concurrent jobs (analyst notebooks, ad-hoc queries) | Horizontal | Better sharing, faster scale-up/down |
| Latency-sensitive streaming or micro-batch | Horizontal | Predictable GC, consistent tail latency |
| Large ETL with known data skew | Vertical | Headroom to absorb hot partitions without spill |
| Mixed or unknown workloads | Start horizontal, test vertical | Horizontal is safer as a default; vertical is an optimization |

:::tip
If you're running benchmarks like TPC-DS to evaluate instance choices, keep in mind that benchmark workloads tend to favor vertical scaling (complex joins, large shuffles). Your production workloads — especially if they include many smaller jobs or interactive queries — may behave quite differently. Test with representative production queries before finalizing your configuration.
:::
