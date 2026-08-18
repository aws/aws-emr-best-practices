---
sidebar_label: Optimizing Cost and Performance
---

# Optimizing Cost and Performance

## S3 Tables Auto-Compaction — Solving the Small File Problem

In addition to the S3DistCp approach described earlier in this section, Amazon S3 Tables and Apache Iceberg on Amazon EMR now provide automatic compaction capabilities that eliminate the need for custom compaction jobs.

Amazon S3 Tables provides built-in automatic compaction for data stored as Iceberg tables. Compaction is enabled by default for all tables and supports Apache Parquet, Avro, and ORC file formats. S3 Tables continuously monitors table state and automatically merges small data files into optimally sized files, applies pending row-level deletes, and can rewrite data files to improve sort order when configured.

S3 Tables compaction is configurable through the put-table-maintenance-configuration API:

| Target file size | Default: 512 MB  | Adjustable range: 64 MB to 512 MB     |
|------------------|------------------|---------------------------------------|
| Strategy         | Default: Auto    | Options: Auto, Binpack, Sort, Z-order |
| Status           | Default: Enabled | Can be disabled                       |

The following example changes the target file size to 256 MB with a sort strategy:

The Auto strategy is recommended for most workloads — S3 selects the best strategy based on the table's sort order. Binpack combines small files without sorting and is best for unsorted tables. Sort and Z-order reorganize data by specified columns for filtered or multi-dimensional queries, but incur higher compaction cost.

S3 Tables also provides configurable snapshot management. The default configuration retains a minimum of 1 snapshot with a maximum age of 120 hours. Expired snapshots' data files become noncurrent and are permanently deleted per the unreferenced file removal policy.

For Iceberg tables stored on standard S3 buckets (not S3 Tables), schedule periodic compaction using the rewrite_data_files stored procedure on Amazon EMR Spark:

To reduce small files proactively at write time, set the following table properties:

The original guidance in this section recommends a minimum file size of 64 MB. With modern Spark vectorized readers and Iceberg's metadata-driven scan planning, the optimal target has shifted. For Iceberg tables, target 256 MB to 512 MB. For high-concurrency query workloads, 128 MB to 256 MB provides better parallelism. For standard S3 Parquet files queried by Athena or Redshift Spectrum, 128 MB to 512 MB balances scan parallelism with S3 request overhead. For EMR Spark on standard Parquet, 256 MB to 1 GB reduces task scheduling overhead. For streaming ingestion, let auto-compaction handle the initial small files.

To determine which compaction approach to use: if data is stored in S3 Tables, auto-compaction is built-in and configurable. If data is in Iceberg format on standard S3, schedule rewrite_data_files() on EMR or use Athena OPTIMIZE. If data is in raw Parquet or ORC on standard S3, use S3DistCp on EMR as described earlier in this guide.

> *Note: For new migrations, use S3 Tables with built-in auto-compaction as the default. For existing Iceberg tables on standard S3, schedule periodic rewrite_data_files() calls on EMR. Reserve S3DistCp for legacy Parquet/ORC datasets that have not been migrated to Iceberg.*

## Apache Iceberg Hidden Partitioning

The partitioning approach described earlier in this section uses explicit Hive-style partitioning with directory structures such as s3://my_bucket/logs/year=2018/month=01/day=23/. Apache Iceberg provides an alternative called hidden partitioning that eliminates the need for this manual directory layout and enables partition evolution without rewriting data.

Hive-style partitioning has several limitations: partition columns must be materialized as directory names in S3, changing the partition scheme requires rewriting all existing data, users must include partition columns explicitly in queries to benefit from partition pruning, and partition metadata managed externally in the AWS Glue Data Catalog or Hive Metastore can become inconsistent with the actual S3 layout.

Iceberg hidden partitioning defines partition transforms in table metadata rather than in the physical directory layout. When writing data, Iceberg automatically applies the partition transform and organizes data files accordingly — but the transform is hidden from query users. The engine automatically applies partition pruning based on source column predicates.

The available partition transforms are:

| Transform | Description | Example |
|----|----|----|
| identity | Value unchanged | identity(category) |
| year | Extract year from timestamp | year(ts) |
| month | Extract month from timestamp | month(ts) |
| day | Extract day from timestamp | day(ts) |
| hour | Extract hour from timestamp | hour(ts) |
| bucket\[N\] | Hash modulo N | bucket(16, id) |
| truncate\[W\] | Truncate to width W | truncate(10, name) |
| void | Always produces null (used to drop partition) void(field) |  |

The following example creates an Iceberg table with hidden partitioning on EMR Spark:

PARTITIONED BY (days(event_timestamp), bucket(16, user_id));

In this example, days(event_timestamp) partitions data by day derived from the timestamp column, and bucket(16, user_id) distributes data across 16 buckets based on user_id hash. A query with WHERE event_timestamp \> '2026-01-01' automatically prunes partitions — no synthetic partition column is needed.

One of Iceberg's most powerful migration features is partition evolution — the ability to change the partition scheme without rewriting existing data. Partition evolution is a metadata-only operation. Old data files retain their original partition layout and new data is written with the new scheme. Iceberg resolves both layouts transparently at query time.

To migrate existing Hive-style partitioned tables to Iceberg without rewriting data, use the migrate procedure on EMR Spark. This creates Iceberg metadata that points to existing data files in place, preserving the data without copying or rewriting. It works for tables stored in Parquet, Avro, or ORC.

After migration, evolve the partition scheme incrementally using ALTER TABLE without rewriting any historical data.

> *Note: When migrating partitioned Hive tables to Iceberg on EMR, use the migrate() procedure to adopt Iceberg without rewriting data, then evolve the partition scheme incrementally. For new tables, define partition transforms at creation time and let Iceberg manage the physical layout.*

## Amazon S3 Glacier Instant Retrieval 

In addition to the Amazon S3 Glacier and Amazon S3 Glacier Deep Archive storage classes described earlier in this section, Amazon S3 Glacier Instant Retrieval provides the lowest-cost storage for long-lived data that is rarely accessed but requires millisecond retrieval when needed. It delivers 99.999999999% (11 9's) durability, 99.9% availability, and stores data across three or more Availability Zones.

S3 Glacier Instant Retrieval provides up to 68% lower per-GB storage cost compared to S3 Standard-Infrequent Access (approximately \$0.004/GB/month versus \$0.0125/GB/month in us-east-1). However, per-GB retrieval costs are approximately three times higher than Standard-IA. Total cost depends on access frequency — Glacier Instant Retrieval is most cost-effective for data accessed approximately once per quarter or less. Unlike S3 Glacier Flexible Retrieval and S3 Glacier Deep Archive, no RestoreObject call is required — data is available for real-time access immediately. Minimum storage duration charge is 90 days and minimum billable object size is 128 KB.

The updated comprehensive storage tiering for data lakes is:

| Tier | Storage Class | Access Pattern | Retrieval Time | Approximate Storage |
|----|----|----|----|----|
| Hot — Processing | S3 Express One Zone | Frequent | Single-digit ms | ~\$0.16/GB/month |
| Hot — Active | S3 Standard | Frequent | Milliseconds | ~\$0.023/GB/month |
| Warm | S3 Intelligent-Tiering | Unknown/variable | Milliseconds | ~\$0.023/GB/month |
| Cool | S3 Standard-IA | Monthly | Milliseconds | ~\$0.0125/GB/month |
| Cold — Instant | S3 Glacier Instant Retrieval | Quarterly | Milliseconds | ~\$0.004/GB/month |
| Cold — Flexible | S3 Glacier Flexible Retrieval | Annual | Minutes to hours | ~\$0.0036/GB/month |
| Frozen | S3 Glacier Deep Archive | Rarely/never | Hours | ~\$0.00099/GB/month |

Storage costs shown are approximate per-GB/month rates for us-east-1. Retrieval fees, minimum duration charges, and per-request costs vary by storage class.

Since the original guide, S3 Intelligent-Tiering has been enhanced with additional tiers. It now includes five access tiers:

Frequent Access tier — objects are placed here on upload or transition. Infrequent Access tier — objects not accessed for 30 consecutive days are moved here automatically. Archive Instant Access tier — objects not accessed for 90 consecutive days are moved here automatically, with millisecond retrieval and no restore required. Archive Access tier — optional, must be explicitly activated, for objects not accessed for 90 or more days, requiring a RestoreObject call for retrieval. Deep Archive Access tier — optional, must be explicitly activated, for objects not accessed for 180 or more days, requiring a RestoreObject call.

The Archive Instant Access tier is automatic and requires no configuration. The Archive Access and Deep Archive Access tiers must be explicitly activated using the PutBucketIntelligentTieringConfiguration API:

Objects smaller than 128 KB are always stored in the Frequent Access tier and are not monitored or eligible for tiering. A small monthly per-object monitoring and automation fee applies (approximately \$0.0025 per 1,000 objects).

> *Note: For data lake tiers previously placed in S3 Standard-IA and accessed quarterly or less, evaluate S3 Glacier Instant Retrieval for significant storage cost savings with no change in access latency. For data with unpredictable access patterns, use S3 Intelligent-Tiering. Remember to explicitly activate the Archive Access and Deep Archive Access tiers if you want objects to tier beyond Archive Instant Access.*

## Updated WORM Compliance: S3 Object Lock Replaces Glacier Vault Lock

The existing guide describes Amazon S3 Glacier Vault Lock for WORM (write once read many) compliance. S3 Object Lock provides the same WORM guarantees directly on standard S3 buckets — without requiring data to be archived to Glacier first. It offers two retention modes: Compliance (no user, including root, can delete or overwrite until retention expires) and Governance (users with s3:BypassGovernanceRetention permission can override). A Legal Hold flag can also be applied independently of retention periods.

For data lake migrations, S3 Object Lock is relevant for raw landing zone data that must be preserved for regulatory compliance — financial records, healthcare audit logs, or legal discovery datasets. Apply Object Lock to these buckets so ingested data is immutable from the point of landing.

Important: S3 Object Lock is incompatible with Apache Iceberg table maintenance. Iceberg compaction (rewrite_data_files()), snapshot expiry (expire_snapshots()), and orphan file cleanup all require deleting old data and metadata files. Object Lock blocks these deletions, causing maintenance jobs to fail. S3 Tables auto-compaction is also blocked. Do not enable Object Lock on buckets that store Iceberg tables.

Recommended pattern: Separate immutable compliance data from Iceberg-managed analytics data. Use a raw/compliance bucket with Object Lock enabled as an immutable landing zone for audit and regulatory data. Use a separate analytics bucket without Object Lock for Iceberg tables with compaction, snapshot management, and lifecycle policies.

Note: Replace Glacier Vault Lock with S3 Object Lock for WORM requirements on data that must be preserved at the point of ingestion. Keep Object Lock on raw/compliance buckets only — never on buckets hosting Iceberg tables or S3 Tables where maintenance operations require file deletion.

## Amazon S3 Storage Lens — Organization-Wide Cost Visibility

Amazon S3 Storage Lens delivers organization-wide visibility into object storage usage and activity. It provides a single view of storage metrics across all S3 buckets, accounts, and AWS Regions, with interactive dashboards, trend analysis, and actionable recommendations.

During and after a large-scale HDFS-to-S3 migration, organizations often lose visibility into storage growth and cost drivers. Data lands in S3 from multiple migration streams (AWS DataSync, AWS DMS, ETL jobs), and without centralized monitoring, storage costs can grow unpredictably. S3 Storage Lens addresses this by providing:

- Usage metrics – Total storage, object count, and average object size per bucket, prefix, account, and Region.

- Activity metrics (advanced tier) – GET/PUT/DELETE request rates and bytes downloaded/uploaded, identifying hot and cold datasets.

- Cost optimization recommendations – Flags buckets without lifecycle policies, identifies data eligible for cheaper storage classes, and detects incomplete multipart uploads consuming storage.

- Prefix-level aggregation – Default metrics support up to 10 levels of prefix depth. The advanced tier supports up to 50 levels with expanded prefix reports.

S3 Storage Lens offers a free tier with 28-day metric retention and an advanced tier with 15-month retention, detailed status-code metrics, CloudWatch publishing, and contextual recommendations. Metrics can be exported to S3 in CSV or Parquet format for analysis with Amazon Athena or Amazon EMR.

The following is an example configuration for a data lake migration dashboard:

After migration, use Storage Lens to identify optimization opportunities: buckets with high storage and zero GET requests may contain unused migrated data suitable for archival or deletion. Buckets without lifecycle configurations should have tiering rules configured. Buckets with high object counts and low average object size indicate the small file problem and should have compaction applied. Buckets with incomplete multipart upload bytes should have lifecycle rules configured to abort incomplete uploads.

> *Note: Enable S3 Storage Lens at the organization level before starting a migration. Use the default free dashboard for basic visibility. For detailed prefix-level analysis and custom migration progress dashboards, enable advanced metrics with Parquet export to S3.*

Using AWS Glue to Transform and Normalize Data — Updated Guidance

In addition to the AWS Glue capabilities described earlier in this section, the following enhancements are available for migration workloads:

AWS Glue 4.0 runs on Apache Spark 3.3.0 with Python 3.10 and provides native support for Apache Iceberg, Apache Hudi, and Delta Lake. Migration scripts can write directly to Iceberg tables using the Iceberg Spark API, including schema evolution and hidden partitioning, eliminating the need for separate format conversion and catalog registration steps. AWS Glue 5.0, running on Spark 3.5.x, is also available for workloads requiring newer Spark features. Note that ML transforms and PII transforms are not available in Glue 4.0.

AWS Glue Data Quality provides automated data quality checks using the Data Quality Definition Language (DQDL), which supports over 25 rule types. Quality rules can be integrated into Glue ETL jobs to validate data during transformation:

DQDL supports composite rules using and/or operators, where clauses for conditional validation (Glue 4.0+), and dynamic rules that compare against historical values:

AWS Glue interactive sessions allow you to develop and test migration scripts interactively in Jupyter notebooks backed by Glue Spark sessions, without deploying and running full Glue jobs during development.

AWS Glue Flex jobs provide up to 34% cost savings for non-time-sensitive migration workloads (historical data conversion, backfill operations) by using spare compute capacity. Actual savings vary by region and capacity availability. Flex jobs may experience start delays when spare capacity is not immediately available — use only for non-time-critical workloads. To use Flex, set the execution_class parameter to FLEX when creating the Glue job.

## Understand How Applications Work with Amazon S3 

In addition to the application considerations described earlier in this section, the following updates are relevant for migration:

- EMRFS S3-optimized committer – On EMR 6.x and 7.x, the EMRFS S3-optimized committer is the default (for EMR versions prior to 7.10; starting with EMR 7.10, S3A replaces EMRFS as the default S3 connector) for Spark jobs writing Parquet — no configuration is needed. For Iceberg tables, Iceberg uses its own commit protocol with atomic metadata updates, so the S3 committer is not needed. S3 Express One Zone is compatible with both EMRFS and Iceberg committers, providing lower latency for commit operations.

- S3 strong read-after-write consistency – Since December 2020, Amazon S3 delivers strong read-after-write consistency for all operations. Applications migrated from HDFS can rely on the same consistency semantics they had with HDFS. The eventual consistency concerns discussed earlier in this guide are no longer applicable.

- S3 Mountpoint for legacy compatibility – Amazon S3 Mountpoint (open source, generally available 2023) allows mounting an S3 bucket as a local filesystem via FUSE. This enables legacy scripts and tools that expect POSIX file paths to read from S3 without code changes. S3 Mountpoint is optimized for read-heavy, sequential workloads. For write-heavy or random access patterns, use native S3 APIs or EMRFS.
