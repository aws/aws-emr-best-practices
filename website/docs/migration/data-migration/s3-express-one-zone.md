---
sidebar_label: S3 Express One Zone ✨
---

# S3 Express One Zone — High-Performance Temporary Storage

Amazon S3 Express One Zone is a single-Availability Zone, high-performance S3 storage class designed for workloads that issue hundreds of thousands of requests per second and benefit from single-digit millisecond latency. For EMR workloads bottlenecked by object-store request latency or small-file metadata operations rather than bulk throughput, pairing EMR with S3 Express One Zone can materially reduce job runtime without changing cluster shape. Support is available on Amazon EMR 6.15.0 and later on EC2, and Amazon EMR 7.2.0 and later on EMR Serverless and EMR on EKS. For details, see Upload data to Amazon S3 Express One Zone in the Amazon EMR Management Guide.

## When to Use

S3 Express One Zone is a strong fit with Amazon EMR in the following scenarios:

- Interactive and ad-hoc Spark SQL — Short-running queries where per-request latency on LIST, HEAD, and GET operations dominates total runtime. Query planning and shuffle-read phases complete faster, improving the responsiveness of BI dashboards and notebook-driven exploration.

- Iterative ML and feature engineering — Workloads that repeatedly read the same working set, such as hyperparameter tuning, gradient boosting, and graph algorithms. Keeping the hot dataset in the same AZ as the EMR cluster reduces per-iteration latency and overall training time.

- Shuffle-heavy Spark jobs with many small files — Joins, aggregations, and skew-handling stages that generate large numbers of small partitions benefit from high per-prefix transactions-per-second, reducing throttling and retry overhead on S3.

- Near-real-time ETL with Spark Structured Streaming — Micro-batch checkpointing, state store writes, and frequent small commits benefit from low write latency, enabling tighter end-to-end latency SLAs.

- Metadata-heavy Hive, Flink, and HBase workloads (EMR 7.2.0+) — Partition discovery on large Hive tables, transactional table operations, and HBase HFile access patterns that are sensitive to storage latency.

- Hot working-set tier in tiered pipelines — Land raw data in S3 Standard, stage an active working set into an S3 Express One Zone directory bucket co-located with the EMR cluster's AZ, run multi-stage processing against the hot tier, and write curated outputs back to S3 Standard for durability and multi-AZ access.

- EMR Serverless and EMR on EKS short-lived jobs — Jobs where cold-start-to-first-result time is dominated by initial reads, and reduced read latency translates directly into shorter billed duration.

## When Not to Use

S3 Express One Zone is not a replacement for S3 Standard in every scenario. Consider alternatives when:

- Data requires multi-AZ durability — S3 Express One Zone stores data in a single Availability Zone, which makes it unsuitable as a system of record. Keep landing zones, archives, and authoritative datasets in a multi-AZ S3 storage class.

- Jobs rely on the S3A FileOutputCommitter — Writes to S3 Express One Zone using the default FileOutputCommitter fail with InvalidStorageClass. Use the magic committer or another supported committer.

- Workloads are throughput-bound, not latency-bound — Large sequential scans where per-request latency is not the bottleneck typically run as well on S3 Standard at lower cost.

- Running on unsupported EMR releases — Pre-6.15.0 on EC2, or pre-7.2.0 on EMR Serverless and EMR on EKS.

## Reference Architecture Pattern

A common pattern for EMR migrations is a two-tier storage layout:

- Durable tier (S3 Standard) — Raw ingestion, curated outputs, and long-term datasets consumed across AZs and services.

- Hot working tier (S3 Express One Zone) — A directory bucket in the same AZ as the EMR cluster, used for the active working set, intermediate stages, and latency-sensitive reads and writes.

- Promote data from the durable tier to the hot tier at the start of a processing window, run EMR jobs against the hot tier, and write final outputs back to the durable tier. This preserves the cost, durability, and multi-AZ characteristics of S3 Standard for persistent data while capturing the latency benefits of S3 Express One Zone for active compute.
