---
sidebar_label: Requirements Gathering Checklist
---

# Requirements Gathering Checklist

Use this checklist to confirm completeness before moving to the planning and design phase:

| **Category** | **Collected** | **Notes** |
|----|----|----|
| Infrastructure metrics (CPU, memory, storage, network) | ☐ | Per-node and aggregate |
| 30-day utilization data (at minimum 7 days) | ☐ | Peak, average, and time-of-day patterns |
| Workload inventory (all jobs cataloged) | ☐ | By framework, schedule, SLA |
| Dependency map (job-to-job, table-to-table) | ☐ | Upstream and downstream |
| Hive/metastore table catalog | ☐ | With formats, sizes, access patterns |
| Custom code inventory (JARs, UDFs, scripts) | ☐ | Source location and owners identified |
| Security configuration export | ☐ | Kerberos, Ranger/Sentry policies, LDAP |
| Network integration map | ☐ | All external systems documented |
| Service configuration export | ☐ | Core-site, HDFS, YARN, Hive, Spark configs |
| Growth projections (storage, compute, users) | ☐ | 12-month and 3-year |

Once these requirements are gathered, you are ready to proceed to:

**Cost Estimation and Optimization** — to translate metrics into EMR sizing and cost projections

**Amazon EMR Cluster Segmentation Schemes** — to determine how workloads map to clusters

**Securing Your Resources on Amazon EMR** — to translate your security posture to EMR controls
