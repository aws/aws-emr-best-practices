---
sidebar_label: Cluster-Level Validation
---

# Cluster-Level Validation

After establishing a process for migrating data from source systems and running analytics jobs on Amazon EMR, ensuring data quality becomes increasingly important. Unit tests are typically written for code, but testing data quality is often overlooked. Incorrect or malformed data can significantly impact production systems.

**Common data quality issues include:**

- **Missing values** can lead to failures in production systems requiring non-null values

- **Changes in data distribution** can lead to unexpected outputs of machine learning models

- **Aggregations of incorrect data** can lead to ill-informed business decisions

This section covers multiple methods of checking data quality using modern AWS-native and open-source tools. The approaches described here should be applied as part of your EMR migration strategy.

When migrating workloads to Amazon EMR, validating cluster health and resource utilization is as important as validating data quality. Cluster-level validation ensures that migrated workloads perform as expected and that clusters are right-sized for the target environment.

## Monitor Cluster Metrics with Amazon CloudWatch

Amazon EMR automatically publishes metrics to [Amazon CloudWatch](https://docs.aws.amazon.com/emr/latest/ManagementGuide/UsingEMR_ViewingMetrics.html) every five minutes at no additional charge. Key metrics to monitor during and after migration include:

- AppsRunning and AppsPending — Track application throughput and queuing. A sustained increase in AppsPending may indicate that the cluster is undersized relative to the migrated workload.

- ContainerPending and ContainerAllocated — Monitor YARN container allocation. High ContainerPending values indicate resource contention where YARN cannot allocate containers fast enough to meet demand.

- YARNMemoryAvailablePercentage — Track available YARN memory as a percentage of total cluster memory. Low values signal the cluster is approaching memory saturation.

- HDFSUtilization and CapacityRemainingGB — Monitor HDFS disk usage if your cluster uses HDFS for intermediate or persistent storage.

For Spark-specific monitoring, you can publish application-level metrics to CloudWatch. For details, see [Monitor Apache Spark applications on Amazon EMR with Amazon CloudWatch](https://aws.amazon.com/blogs/big-data/monitor-apache-spark-applications-on-amazon-emr-with-amazon-cloudwatch/) on the AWS Big Data Blog.

## Compare Performance Against On-Premises Baselines

Establish baseline metrics from your on-premises environment (job duration, resource consumption, throughput) before migration. After migrating, compare EMR CloudWatch metrics against these baselines to validate that migrated jobs meet expected SLAs. Metrics such as RunningMapTasks, RemainingMapTasks, and Spark application execution times are directly useful for this comparison.

## Validate Cluster Sizing and Capacity Planning

Use CloudWatch metrics to right-size your clusters after migration. When [managed scaling](https://docs.aws.amazon.com/emr/latest/ManagementGuide/managed-scaling-metrics.html) is enabled, Amazon EMR publishes high-resolution metrics at one-minute granularity, including current and target capacity units. Monitor these metrics to verify that managed scaling responds appropriately to your migrated workload patterns and to identify whether minimum or maximum instance counts need adjustment.

For guidance on estimating cluster capacity based on data size and memory requirements, see [Estimating Amazon EMR cluster capacity](https://docs.aws.amazon.com/prescriptive-guidance/latest/amazon-emr-hardware/capacity.html) in the AWS Prescriptive Guidance.

## Set Up Alerts for Cluster Health

Configure [CloudWatch Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Alarms.html) with Amazon SNS notifications on critical cluster metrics. For example, alert when YARNMemoryAvailablePercentage drops below a threshold, when ContainerPending exceeds a sustained count, or when IsIdle indicates a long-running cluster has no active workloads. This enables rapid detection and response to cluster-level issues during and after migration.
