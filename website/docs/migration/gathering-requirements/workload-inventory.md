---
sidebar_label: Workload Inventory
---

# Workload Inventory

Beyond infrastructure metrics, you need a complete catalog of *what runs* on your clusters. A workload inventory identifies every job, table, and data pipeline that must be migrated, validated, and scheduled on EMR.

## Cataloging Jobs by Framework

Create a spreadsheet or structured inventory with one row per distinct job or pipeline. Capture:

| **Field** | **Description** | **Where to Find It** |
|----|----|----|
| Job name / ID | Unique identifier or meaningful name | Scheduler (Oozie, Airflow, cron), YARN app name |
| Framework | Spark, Hive, MapReduce, Pig, Sqoop, etc. | YARN application type field |
| Language | Scala, PySpark, Java, HiveQL, SQL | Source repository or YARN application tags |
| Schedule | Cron expression or trigger (event-driven, ad hoc) | Oozie coordinator, Airflow DAG, crontab |
| SLA | Required completion time | Business owner documentation, scheduler alerts |
| Upstream dependencies | Input tables, files, or signals this job waits for | DAG definitions, Oozie workflows |
| Downstream consumers | Tables, files, or signals produced | Data lineage tools, DAG definitions |
| Average runtime | Typical end-to-end duration | YARN app history, scheduler logs |
| Peak resources | Maximum vCPU and memory consumed | YARN application attempt metrics |
| Data volumes | Input and output size (GB/TB) | HDFS audit logs, Spark UI I/O metrics |

**Tip:** Query the YARN application history API (/ws/v1/cluster/apps) with a 30-day window and group by applicationType and name to generate this inventory programmatically. Export the results and enrich with scheduling and SLA information from your orchestrator.

## Hive Table Inventory

If your cluster uses Apache Hive or a Hive-compatible metastore, export the full table catalog:

-- List all databases and table counts
SELECT d.NAME as db_name, COUNT(t.TBL_ID) as table_count
FROM DBS d LEFT JOIN TBLS t ON d.DB_ID = t.DB_ID
GROUP BY d.NAME;

-- Table details including format, location, and row counts
SELECT d.NAME as db_name, t.TBL_NAME, t.TBL_TYPE,
sd.INPUT_FORMAT, sd.LOCATION, tp.PARAM_VALUE as num_rows
FROM TBLS t
JOIN DBS d ON t.DB_ID = d.DB_ID
JOIN SDS sd ON t.SD_ID = sd.SD_ID
LEFT JOIN TABLE_PARAMS tp ON t.TBL_ID = tp.TBL_ID AND tp.PARAM_KEY = 'numRows';

This inventory identifies tables that are actively used vs. stale, which file formats are in play (Parquet, ORC, Avro, text), and where data lives in HDFS. It directly informs decisions about table format migration (see the *Apache Iceberg on EMR — Table Format Migration* section) and Data Catalog migration strategy.

## Identifying Job Dependencies and Scheduling

Map the execution graph of your workloads to understand what must run before what:

**Oozie workflows/coordinators:** Export workflow XML definitions and coordinator schedules. Each \<action\> node represents a job; \<fork\>/\<join\> nodes reveal parallelism.

**Apache Airflow DAGs:** Export DAG definitions (Python files). Use airflow dags show \<dag_id\> to visualize dependency graphs.

**Custom schedulers (cron, Autosys, Control-M):** Extract job definitions and dependency chains from the scheduler's configuration or database.

**Event-driven pipelines:** Document which HDFS directory sensors, Kafka topics, or database triggers initiate downstream processing.

The dependency map determines your migration phasing — independent workloads can be migrated in parallel, while tightly coupled pipelines should move together.
