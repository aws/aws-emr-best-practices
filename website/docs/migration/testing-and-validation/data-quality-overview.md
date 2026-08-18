---
sidebar_label: Data Quality Overview
---

# Data Quality Overview

Data quality measures how well your data meets the expectations of its consumers—essentially, the correctness of the data relative to the construct or object it models. Consider data quality from the perspective of these dimensions:

- **Completeness** - How comprehensive your data is

- **Uniqueness** - Duplication within your data

- **Timeliness** - Data freshness and availability within SLAs

- **Validity** - Conformance to defined schemas, syntax, and requirements

- **Accuracy** - Correctness in representing objects within scope

- **Consistency** - Differences when referencing the same object or relationships

Organizations can define additional metrics and attributes as dimensions for their specific data quality needs.

### Check your Ingestion Pipeline
## Apache Spark Troubleshooting Agent for Testing

The \<u>Apache Spark Troubleshooting Agent\</u> automates root cause analysis for data quality validation failures during EMR migration. When Deequ or Apache Griffin validation jobs fail or exhibit performance issues, the agent analyzes Spark event logs, YARN container logs, CloudWatch metrics, and EMR configurations to identify underlying causes. Common scenarios include **memory-related failures** where Deequ constraint validation encounters OutOfMemoryError or excessive GC pressure (\>10% of task time)—the agent identifies whether issues stem from insufficient spark.executor.memory, inadequate spark.executor.memoryOverhead, or data skew, and provides specific recommendations (e.g., increasing executor memory from 4g to 8g when peak usage reaches 95%). For **performance degradation**, large-scale Griffin validation jobs may experience shuffle spills exceeding 100GB during join operations; the agent detects partition skew and recommends increasing spark.sql.shuffle.partitions or implementing salting techniques. When validation jobs run slower on EMR with S3 versus on-premises HDFS, the agent identifies **S3 access pattern issues** such as excessive list operations or request throttling and recommends optimizations like spark.hadoop.fs.s3a.experimental.input.fadvise=random and file consolidation strategies.

The agent is particularly effective for **iterative validation workflows**. After implementing Deequ verification suites to validate schema completeness, uniqueness constraints, and statistical distributions, the agent monitors execution through Spark History Server and YARN ResourceManager, automatically detecting stage-level failures (identifying which Deequ analyzers cause task failures), data skew in validation joins (recommending Adaptive Query Execution or broadcast joins), and serialization errors (recommending Kryo serialization or broadcast variables). The agent provides **automated timeline correlation** across observability sources, reducing troubleshooting time from hours to minutes:

10:15:23 - Validation job started (CloudWatch)
10:16:45 - Executor OOM during Uniqueness check (YARN logs)
10:17:12 - GC time spike to 60% (Spark History Server)
10:18:30 - Executor lost, task retry initiated (Spark event log)
10:19:45 - Job failed after 3 retries (YARN ResourceManager)

Root Cause: Memory pressure during distinct count operation
Recommendation: Increase spark.executor.memory to 12g and enable
spark.sql.adaptive.coalescePartitions.enabled=true

This allows migration teams to focus on actual data quality issues (schema mismatches, data type inconsistencies, business rule violations) rather than debugging validation infrastructure. The agent integrates seamlessly with EMR observability tools (CloudWatch, Spark History Server, YARN ResourceManager) to provide comprehensive diagnostics across the entire validation pipeline.

## Best Practices for Testing and Validation

1.  **Validate early, validate often** — Integrate validation checks throughout the entire data pipeline, not just at final stages. Add checkpoints at ingestion, transformation, and output stages to catch issues before they propagate downstream and become costly to remediate.

2.  **Use AWS Glue Data Quality** for managed, automated validation with minimal setup - AWS Glue Data Quality automatically computes statistics on your data and recommends quality rules using the Data Quality Definition Language (DQDL). You can add "Evaluate Data Quality" nodes directly in AWS Glue Studio ETL pipelines to validate data without writing custom code.

3.  **Implement Deequ** for custom Spark-based validation logic on EMR clusters - Deequ runs directly within your EMR cluster as part of a Spark job, making it a natural fit for inline validation of existing EMR workloads.

4.  **Leverage Apache Griffin** for large-scale migration validation scenarios - It can validate large datasets after migration by comparing source and target data on Amazon EMR using a configuration-based approach.

5.  **Define quantifiable metrics** for data accuracy and establish acceptable risk levels - Establish measurable thresholds for completeness, uniqueness, validity, accuracy, consistency, and timeliness of your migrated data. Set acceptable tolerance levels for each metric so that quality violations can be assessed objectively against defined standards

6.  **Document data lineage** **from source to consumption to identify potential quality issues.** [Data lineage in Amazon SageMaker Unified Studio](https://docs.aws.amazon.com/sagemaker-unified-studio/latest/userguide/datazone-data-lineage.html) provides an OpenLineage-compatible capability to trace data origins, track transformations, and visualize data consumption across your organization. For Apache Spark workloads on Amazon EMR, you can capture lineage events using the OpenLineage Spark integration and publish them via the [OpenLineage-compatible API](https://docs.aws.amazon.com/sagemaker-unified-studio/latest/userguide/datazone-data-lineage-apis.html), then visualize end-to-end lineage in SageMaker Unified Studio.

7.  **Automate alerts** for data quality violations using CloudWatch and SNS - Configure CloudWatch Alarms on these metrics with Amazon SNS notifications to detect and respond to anomalies in your data pipelines.

8.  **Test with production-like data** during development to catch issues early - Use representative production data volumes and distributions in your test environment to surface issues that only appear at scale. This reduces the risk that cleaned or sampled development data masks quality problems that will appear in production.
