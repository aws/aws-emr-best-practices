---
sidebar_label: Obtaining On-Premises Metrics
---

# Obtaining On-Premises Metrics

Before designing your target EMR architecture or estimating costs, you need a clear picture of your current on-premises environment. This chapter provides a framework for gathering the metrics, configurations, and workload characteristics from your existing Hadoop clusters that will inform every subsequent decision — from cluster sizing to storage layout to network topology.

The sections below walk through what to collect, where to find it, and how it maps to the migration planning questionnaire in Appendix A.

The following metrics are essential for cost estimation and EMR deployment planning. Capture each of these from your existing Hadoop clusters to drive migration decision-making.

**Infrastructure metrics:**

Aggregate number of physical CPUs and vCPUs

CPU clock speed and core counts per node

Aggregate and per-node memory size

Amount of HDFS storage (without replication) and monthly growth rate

Aggregate maximum network throughput and inter-rack bandwidth

Disk I/O throughput per node (sequential read/write, IOPS)

**Utilization metrics:**

At least one week (ideally 30 days) of utilization graphs for CPU, memory, disk I/O, and network

Peak vs. average utilization ratios for each resource dimension

Time-of-day and day-of-week usage patterns

YARN queue utilization breakdown (if multiple queues are configured)

**Workload metrics:**

Job counts, schedule, and average durations (by framework: Spark, Hive, MapReduce, Pig)

Peak concurrency — maximum number of simultaneously running applications

Job failure rates and common failure categories

Data read/written per job (input/output size)

For help with taking a full inventory of your on-premises architecture and the possible requirements for migration, refer to **Appendix A: Questionnaire for Requirements Gathering**. The questionnaire maps directly to the metrics above — Section "Current Cluster Setup" covers infrastructure metrics, "Cluster Use" covers utilization, and "Use Cases" covers workload characteristics.

## How to Collect On-Premises Metrics

Collecting the metrics above requires querying different systems depending on your Hadoop distribution and cluster configuration. This section provides practical guidance for the most common environments.

### Cloudera (CDH/CDP) Environments

**Cloudera Manager API** — Cloudera Manager exposes a comprehensive REST API for cluster metrics, host details, and service configurations.

| **Metric Category** | **API Endpoint** | **What It Returns** |
|----|----|----|
| Cluster hosts | GET /api/v41/clusters/\{cluster\}/hosts | Node count, CPU cores, memory, rack assignment |
| CPU/memory time series | GET /api/v41/timeseries?query=select cpu_percent, physical_memory_used | Historical utilization at configurable granularity |
| HDFS usage | GET /api/v41/clusters/\{cluster\}/services/hdfs/roles | Capacity, used bytes, replication factor, block count |
| YARN resource pools | GET /api/v41/clusters/\{cluster\}/services/yarn/yarnApplications | Application history with resource consumption |
| Service configurations | GET /api/v41/clusters/\{cluster\}/services/\{service\}/config | Full configuration export for each service |

**Export tip:** Use the Cloudera Manager diagnostic bundle (Support \> Send Diagnostic Data \> Collect Diagnostic Data) to generate a full cluster snapshot including configurations, metrics, and logs. This bundle can be shared with AWS solutions architects during migration planning.

**Cloudera Manager Reports:** Navigate to Clusters \> Utilization Report to download CSV-formatted utilization data spanning configurable time ranges. These reports include per-tenant resource consumption when YARN fair scheduler is configured.

### Hortonworks (HDP) / Apache Ambari Environments

**Ambari REST API** — Ambari provides host-level and service-level metrics through its API.

| **Metric Category** | **API Endpoint** | **What It Returns** |
|----|----|----|
| Cluster hosts | GET /api/v1/clusters/\{cluster\}/hosts | Hostnames, CPU, memory, disk, OS |
| Host metrics | GET /api/v1/clusters/\{cluster\}/hosts/\{host\}?fields=metrics | CPU, memory, disk, network time series |
| YARN queues | GET /api/v1/clusters/\{cluster\}/services/YARN/components/RESOURCEMANAGER | Queue capacity, used resources |
| Service configurations | GET /api/v1/clusters/\{cluster\}/configurations | All service configs with version history |
| Installed components | GET /api/v1/clusters/\{cluster\}/services | List of deployed services and their status |

**Ambari Metrics Collector (AMS):** If AMS is deployed, query it directly for higher-resolution historical metrics using the /ws/v1/timeline/metrics endpoint. AMS retains data at 10-second resolution for recent data and hourly aggregates for longer ranges.

### Direct Hadoop Component APIs

Regardless of your distribution, you can query Hadoop components directly:

**YARN ResourceManager REST API:**

\# Active applications and resource usage
GET http://\<rm-host\>:8088/ws/v1/cluster/metrics

\# Application history (completed jobs)
GET http://\<rm-host\>:8088/ws/v1/cluster/apps?states=FINISHED&startedTimeBegin=\<epoch_ms\>

\# Queue utilization
GET http://\<rm-host\>:8088/ws/v1/cluster/scheduler

The /cluster/metrics endpoint returns totalMB, availableMB, allocatedMB, totalVirtualCores, availableVirtualCores, and allocatedVirtualCores — exactly the inputs needed for the sizing exercise in the Cost Estimation chapter.

**HDFS NameNode REST API:**

\# File system summary (capacity, used, remaining)
GET http://\<nn-host\>:9870/jmx?qry=Hadoop:service=NameNode,name=FSNamesystemState

\# Block statistics
GET http://\<nn-host\>:9870/jmx?qry=Hadoop:service=NameNode,name=FSNamesystem

Key metrics to capture: CapacityTotal, CapacityUsed, CapacityRemaining, FilesTotal, BlocksTotal, UnderReplicatedBlocks. The capacity numbers exclude replication factor — multiply by your configured replication (typically 3) to get raw disk usage.

**Spark History Server:**

\# List all completed applications
GET http://\<shs-host\>:18080/api/v1/applications?status=completed

\# Per-application details (stages, executors, environment)
GET http://\<shs-host\>:18080/api/v1/applications/\{app-id\}

Use the Spark History Server API to extract executor counts, memory per executor, and stage runtimes for representative Spark jobs. These inputs feed directly into the EMR sizing exercise.

### Linux-Level Collection

For bare-metal or VM-based clusters without a management platform, collect metrics directly from each node:

| **Tool** | **Command** | **What It Captures** |
|----|----|----|
| sar | sar -u -r -d -n DEV 60 1440 \> metrics.txt | CPU, memory, disk, network — 1-minute intervals for 24 hours |
| vmstat | vmstat 60 1440 \> vmstat.txt | Processes, memory, swap, I/O, CPU |
| iostat | iostat -x 60 1440 \> iostat.txt | Per-device I/O utilization, latency, throughput |
| free | free -g | Total and available memory |
| lscpu | lscpu | CPU architecture, cores, threads, clock speed |
| df | df -h | Filesystem capacity and usage |

Run these on a representative sample of data nodes during a typical workload period (at least one full business day covering peak hours).

### Automated Collection with Assessment Tools

AWS and its partners provide automated discovery tools that simplify metric collection:

**AWS Migration Hub** — The Migration Hub Strategy Recommendations collector agent can be deployed on-premises to automatically gather server inventory, CPU, memory, and network metrics over a 14-day assessment period.

**Unravel Data** — Provides an automated assessment tool that connects to your Hadoop cluster and generates a migration readiness report with resource utilization, job performance baselines, and complexity scoring.

**Partner assessment tools** — Several AWS Partners in the Service Delivery Program offer proprietary assessment tools as part of their migration engagements (see the *Support for Your Migration* chapter).
