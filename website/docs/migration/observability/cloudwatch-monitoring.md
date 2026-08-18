---
sidebar_label: Native Monitoring with Amazon CloudWatch
---

# Native Monitoring with Amazon CloudWatch

When migrating Apache Hadoop and Spark workloads from on-premises to Amazon EMR, establishing comprehensive observability is critical for operational success. Amazon EMR provides multiple monitoring approaches that address the challenges of dynamic, cloud-based big data environments.

Amazon EMR automatically publishes cluster metrics to Amazon CloudWatch at five-minute intervals at no additional charge. CloudWatch serves as the foundation for EMR observability, providing visibility into cluster health, resource utilization, and job progress.

**Key CloudWatch metrics include:**

**Cluster Status Metrics:**

- IsIdle — Indicates whether the cluster is actively running tasks or idle

- AppsRunning, AppsPending, AppsCompleted, AppsFailed — YARN application lifecycle tracking

- ContainerAllocated, ContainerReserved, ContainerPending — Container-level resource allocation

**Node Health Metrics:**

- CoreNodesRunning, CoreNodesPending — Core node availability

- MRActiveNodes, MRUnhealthyNodes — MapReduce node health status

- LiveDataNodes, DeadDataNodes — HDFS DataNode availability

- MissingBlocks, CorruptBlocks — HDFS data integrity indicators

**Resource Utilization Metrics:**

- MemoryAvailableMB, YARNMemoryAvailablePercentage — Memory availability across the cluster

- HDFSUtilization — Percentage of HDFS storage capacity used

- S3BytesRead, S3BytesWritten — Data transfer between EMR and Amazon S3

- HDFSBytesRead, HDFSBytesWritten — HDFS I/O throughput

Access CloudWatch metrics through the EMR console's Monitoring tab or the CloudWatch console for custom dashboards and alarms.

**Setting Up CloudWatch Alarms:**

Configure automated alerts for critical thresholds to proactively detect issues:

> \{
>
> "AlarmName": "EMR-Cluster-Unhealthy-Nodes",
>
> "MetricName": "MRUnhealthyNodes",
>
> "Namespace": "AWS/ElasticMapReduce",
>
> "Statistic": "Average",
>
> "Period": 300,
>
> "EvaluationPeriods": 2,
>
> "Threshold": 1,
>
> "ComparisonOperator": "GreaterThanThreshold"
>
> \}

Common alarm configurations include:

- Cluster Idle Detection: Alert when IsIdle = 1 for extended periods (cost optimization)

- Node Failure Detection: Alert when MRUnhealthyNodes \> 0 or DeadDataNodes \> 0

- Storage Capacity: Alert when HDFSUtilization \> 80%

- Application Failures: Alert when AppsFailed exceeds threshold
