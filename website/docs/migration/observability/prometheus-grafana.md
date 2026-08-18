---
sidebar_label: Enhanced Observability with Prometheus and Grafana
---

# Enhanced Observability with Prometheus and Grafana

For production workloads requiring deeper insights, AWS recommends integrating **Amazon Managed Service for Prometheus** and **Amazon Managed Grafana** to create a centralized, scalable observability platform.

**Architecture Overview:**

1.  **Prometheus Exporters on EMR Clusters:** Install JMX Exporter, Node Exporter, and application-specific exporters via bootstrap scripts

2.  **Metrics Collection:** Configure Prometheus to scrape metrics from YARN ResourceManager, HDFS NameNode, Spark applications, and HBase RegionServers

3.  **Centralized Storage:** Send metrics to Amazon Managed Prometheus workspace for long-term retention and cross-cluster aggregation

4.  **Visualization:** Create comprehensive dashboards in Amazon Managed Grafana for real-time operational visibility

**Benefits of Prometheus + Grafana:**

- Task-level, node-level, and cluster-level metrics in a single pane of glass

- Real-time operational visibility across multiple EMR clusters and AWS accounts

- Centralized metric storage with configurable retention (default 150 days)

- Custom alerting through Prometheus Alertmanager integrated with Amazon SNS

**Implementation Example:**

Bootstrap script to install Prometheus JMX Exporter on EMR nodes:

> \#!/bin/bash
>
> \# Install JMX Exporter for YARN and HDFS metrics
>
> sudo mkdir -p /opt/prometheus
>
> cd /opt/prometheus
>
> sudo wget [https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.19.0/jmx_prometheus_javaagent-0.19.0.jar](https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.19.0/jmx_prometheus_javaagent-0.19.0.jar)
>
> \# Configure JMX Exporter for YARN ResourceManager
>
> sudo tee /opt/prometheus/yarn-config.yaml \> /dev/null \<\<EOF
>
> lowercaseOutputName: true
>
> rules:
>
> \- pattern: 'Hadoop\<service=ResourceManager, name=QueueMetrics.\*\>'
>
> name: yarn_queue_metrics
>
> labels:
>
> queue: "\\1"
>
> EOF

**Sample Grafana Dashboard Panels:**

- **YARN Resource Utilization**: Memory and vCore allocation across queues

- **HDFS Health**: NameNode heap usage, DataNode availability, block replication status

- **Spark Application Metrics:** Executor memory usage, task duration, shuffle read/write

- **HBase Performance:** RegionServer request latency, compaction queue size, memstore size

## Application-Specific Monitoring

**Spark Observability**

**Spark UI and History Server:**

Amazon EMR provides persistent access to Spark application UIs through the Spark History Server, which stores event logs in Amazon S3 for post-job analysis.

Enable persistent Spark History Server:

> \[
> \{
> "Classification": "spark",
> "Properties": \{
> "spark.eventLog.enabled": "true",
> "spark.eventLog.dir": "s3://my-bucket/spark-logs/",
> "spark.history.fs.logDirectory": "s3://my-bucket/spark-logs/"
> \}
> \}
> \]

**Key Spark Metrics to Monitor:**

Executor Metrics: executor.memoryUsed, executor.diskUsed, executor.totalCores

Task Metrics: task.duration, task.shuffleReadBytes, task.shuffleWriteBytes

Stage Metrics: stage.completedTasks, stage.failedTasks, stage.executorRunTime

Application Metrics: app.duration, app.numExecutors, app.memoryUsed

Custom SparkListeners for CloudWatch:

Emit application-specific metrics to CloudWatch using custom SparkListeners:

> class CloudWatchSparkListener extends SparkListener \{
> override def onTaskEnd(taskEnd: SparkListenerTaskEnd): Unit = \{
> val metrics = taskEnd.taskMetrics
> *// Publish metrics to CloudWatch*
> cloudWatch.putMetricData(
> namespace = "EMR/Spark",
> metricName = "TaskDuration",
> value = metrics.executorRunTime
> )
> \}
> \}

**YARN Resource Manager Monitoring**

YARN ResourceManager provides comprehensive metrics for cluster resource allocation and application scheduling.

**Critical YARN Metrics:**

- **Memory Metrics:** availableMB, allocatedMB, totalMB, reservedMB

- **vCore Metrics:** availableVirtualCores, allocatedVirtualCores, totalVirtualCores

- **Application Metrics:** appsSubmitted, appsRunning, appsCompleted, appsFailed, appsKilled

- **Container Metrics:** containersAllocated, containersReserved, containersPending

Access YARN ResourceManager UI through EMR console → **Application user interfaces** tab for real-time visibility into running applications, queue utilization, and node health.

**HDFS Monitoring**

HDFS health monitoring focuses on NameNode availability, DataNode health, and block replication status.

**Key HDFS Metrics:**

- NameNode Metrics: CapacityUsed, CapacityRemaining, FilesTotal, BlocksTotal, MissingBlocks, CorruptBlocks

- DataNode Metrics: BytesRead, BytesWritten, BlocksRead, BlocksWritten, VolumeFailures

- Replication Metrics: UnderReplicatedBlocks, PendingReplicationBlocks, ScheduledReplicationBlocks

Monitor HDFS health through:

1.  CloudWatch Metrics: HDFSUtilization, MissingBlocks, CorruptBlocks

2.  HDFS NameNode UI: Access via EMR console for detailed block reports and DataNode status

3.  Prometheus JMX Exporter: Scrape NameNode and DataNode JMX metrics for Grafana dashboards
