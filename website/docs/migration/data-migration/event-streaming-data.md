---
sidebar_label: Event and Streaming Data
---

# Event and Streaming Data on a Continuous Basis

## Streaming Ingestion Directly to Apache Iceberg Tables

A common pattern in on-premises Hadoop environments is the Lambda Architecture, where streaming data lands in a raw layer (HDFS) and a batch job periodically processes it into a curated layer. This creates operational complexity — duplicate codebases for batch and real-time paths, data latency, and consistency challenges between the two views. Lambda architecture is now considered obsolete for new builds. Unified processing engines (Spark Structured Streaming, Apache Flink) treat batch and streaming as the same programming model, and Apache Iceberg supports both batch and streaming writes into a single table with ACID guarantees. Together, these collapse the separate batch, speed, and serving layers into one unified path where streaming data lands directly in Iceberg tables on EMR that are immediately queryable — no separate raw-to-curated ETL step required.

Spark Structured Streaming on Amazon EMR is the Spark-native approach, supported on EMR 6.5.0 and later. Only micro-batch execution mode is supported with Iceberg — Trigger.Continuous does not work. Only append output mode is supported for the native Iceberg streaming sink; upserts require foreachBatch with MERGE INTO. The following example shows the configuration:

> spark = SparkSession.builder \\
> .config("spark.sql.catalog.glue_catalog",
> "org.apache.iceberg.spark.SparkCatalog") \\
> .config("spark.sql.catalog.glue_catalog.catalog-impl",
> "org.apache.iceberg.aws.glue.GlueCatalog") \\
> .config("spark.sql.catalog.glue_catalog.warehouse",
> "s3://data-lake/warehouse/") \\
> .config("spark.sql.catalog.glue_catalog.io-impl",
> "org.apache.iceberg.aws.s3.S3FileIO") \\
> .getOrCreate()

Each micro-batch commits an Iceberg snapshot atomically. Checkpoints are stored at the specified S3 path. On failure, Spark resumes from the last committed checkpoint, providing exactly-once semantics for append operations.

Streaming writes produce small files that require compaction. Pair with S3 Tables auto-compaction, Athena OPTIMIZE, or scheduled rewrite_data_files() on EMR to manage file sizes.

On-premises Hadoop environments commonly use Apache Flume or Kafka Connect to land streaming data into HDFS. The following table shows the migration path to AWS:

| On-Premises Component | AWS Replacement | Benefit |
|----|----|----|
| Flume agents writing to HDFS | Spark Structured Streaming on EMR to Iceberg | EMR-native, direct Iceberg writes |
| Kafka Connect HDFS Sink | Spark Structured Streaming on EMR from MSK | Native Kafka integration on EMR |
| Custom Spark Streaming to HDFS | Spark Structured Streaming on EMR to Iceberg | Same Spark APIs, Iceberg target |
| Cron-scheduled compaction jobs | S3 Tables auto-compaction or Athena OPTIMIZE | Managed compaction |

> *Note: Adopt Spark Structured Streaming on EMR with Iceberg as the default pattern for new streaming workloads during migration. This eliminates the raw landing zone, the batch compaction job, and the catalog registration step — reducing the operational surface area and providing fresher data for analytics. For stateful stream processing requirements (windowed aggregations, pattern detection), evaluate Amazon Managed Service for Apache Flink separately.*

## AWS Database Migration Service

In addition to the capabilities described earlier in this section, AWS DMS now provides the following enhancements relevant to streaming data migration:

- **Streaming CDC to Iceberg – AWS DMS can write change data capture (CDC) events to Amazon MSK or Amazon Kinesis Data Streams as targets. Combined with Spark Structured Streaming on EMR, this enables a streaming CDC pipeline that lands directly in Iceberg tables** — replacing the CSV-to-S3 pattern described earlier.

- **DMS Serverless – AWS DMS Serverless (generally available June 2023) automatically provisions and scales replication capacity using DMS Capacity Units (DCUs), where 1 DCU equals 2 GB of RAM. Storage starts at 100 GB and auto-scales at 90% utilization. Built-in Multi-AZ high availability requires no separate configuration. DMS Serverless does not support public IP addresses** — use VPC endpoints for S3, Kinesis, Secrets Manager, and other services. If replication is idle for 48 hours without restart, resources and metadata are permanently deprovisioned.

The recommended CDC-to-Iceberg pattern is:

Source DB → DMS Serverless (CDC) → MSK Topic → Spark Structured Streaming on EMR → Iceberg Table

Spark applies MERGE INTO operations for upserts and deletes, maintaining a current-state view in the Iceberg table while preserving full change history via Iceberg snapshot isolation.

- Strong read-after-write consistency – Since December 2020, Amazon S3 delivers strong read-after-write consistency for all operations. Applications migrated from HDFS can rely on the same consistency semantics they had with HDFS, without the eventual consistency concerns described in earlier versions of this guide.

- Identity-based access control – S3 Access Grants enables mapping corporate identities directly to data permissions, simplifying the migration of on-premises access control models (Apache Ranger, HDFS ACLs) to AWS.

- **Open table format support – With S3 Tables and native Apache Iceberg integration, Amazon S3 supports structured tabular data with ACID transactions, schema evolution, hidden partitioning, and time travel** — capabilities that previously required a separate data warehouse or metastore.

In addition to the benefits described earlier in this section, Amazon S3 now provides the following capabilities relevant to data lake migration:

Additional Benefits of Using Amazon S3

> *Note: For new data lake migrations on EMR 7.x, evaluate S3 Tables as the default destination for structured and semi-structured data. Reserve standard S3 buckets for unstructured data, raw landing zones, and workloads on EMR 6.x.*

- S3 Tables requires EMR 7.x (Spark 3.4+) and supports Apache Iceberg format only.

- **Table buckets are a separate bucket type** — you cannot mix regular S3 objects with tables in a table bucket. All access must go through the Iceberg interface or S3 Tables API.

- For ad hoc query workloads with Amazon Athena or Amazon Redshift Spectrum, S3 Tables provides optimized metadata without requiring separate AWS Glue Data Catalog configuration.

- For streaming ingestion workloads that produce many small files, S3 Tables auto-compaction eliminates the need for manual compaction jobs.

- For tabular and structured data, S3 Tables is recommended. For unstructured data (images, logs, ML artifacts), use standard S3 buckets.

When evaluating S3 Tables versus standard S3 buckets, consider the following:

To migrate data from HDFS to S3 Tables:

> spark = SparkSession.builder \\
> .config("spark.sql.catalog.s3tablesbucket",
> "org.apache.iceberg.spark.SparkCatalog") \\
> .config("spark.sql.catalog.s3tablesbucket.catalog-impl",
> "software.amazon.s3tables.iceberg.S3TablesCatalog") \\
> .config("spark.sql.catalog.s3tablesbucket.warehouse",
> "arn:aws:s3tables:us-east-1:123456789012:bucket/my-table-bucket") \\
> .getOrCreate()

To configure Spark on EMR 7.x for S3 Tables, use the S3 Tables catalog implementation:

- Built-in Iceberg catalog – S3 Tables provides a native Iceberg REST catalog endpoint. Tables can also be registered in AWS Glue Data Catalog via catalog federation for discovery by Amazon Athena, Amazon Redshift Spectrum, and Amazon EMR.

- Query performance – S3 Tables delivers up to 3x faster query performance and up to 10x higher transactions per second compared to self-managed Iceberg tables on standard S3 buckets, due to optimized storage layout, reduced metadata overhead, and S3-native catalog integration.

- Snapshot management – Automatic cleanup of expired snapshots (default: retain minimum 1 snapshot, maximum age 120 hours) and orphaned data files reduces storage costs without custom maintenance jobs. Snapshot retention settings are configurable.

- Automatic compaction – Small files from streaming ingestion or batch writes are automatically compacted into optimally sized files (default target: 512 MB, configurable down to 64 MB). S3 Tables supports binpack, sort, and z-order compaction strategies. This eliminates the "small file problem" that previously required S3DistCp or custom compaction jobs.

Key capabilities for migration include:

When migrating from on-premises HDFS to AWS, the traditional approach requires multiple steps: moving raw files to S3, defining schemas in a Hive Metastore or AWS Glue Data Catalog, converting data to columnar formats, building and scheduling compaction jobs, and managing partition evolution manually. With S3 Tables, schema management, compaction, snapshot lifecycle, and metadata management are handled automatically. The migration path simplifies to moving data to S3 Tables using Spark on EMR with Iceberg write APIs.

Amazon S3 Tables is a purpose-built S3 storage type designed specifically for tabular data. S3 Tables stores data natively in Apache Iceberg format and provides built-in query optimization, including automatic compaction, snapshot management, and unreferenced file cleanup. This eliminates the operational overhead that customers previously had to build and maintain when using standard S3 buckets as a data lake destination.

### Amazon S3 Tables — Managed Destination for Structured Data
