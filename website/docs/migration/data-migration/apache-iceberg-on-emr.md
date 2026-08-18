---
sidebar_label: Apache Iceberg on EMR ✨
---

# Apache Iceberg on EMR — Table Format Migration

Apache Iceberg is an open table format for large analytic datasets that provides ACID transactions, schema evolution, hidden partitioning, and time travel. Amazon EMR provides native, optimized support for Apache Iceberg across Spark, Hive, Trino, and Flink. EMR has supported Iceberg since EMR 6.5.0, and the latest EMR 7.x releases bundle Iceberg 1.10.0 with full integration with the AWS Glue Data Catalog and S3 Tables.

On-premises Hadoop environments typically use Hive-style partitioned tables with raw Parquet or ORC files. This approach has well-known limitations: partition evolution requires rewriting all data, schema changes such as adding or renaming columns require data reprocessing, there are no ACID transactions so concurrent writes can corrupt data, and there is no time travel so once data is overwritten the old version is gone. Iceberg solves all of these. When migrating to EMR, adopting Iceberg as the target format avoids carrying forward these limitations.

To configure Iceberg on EMR, enable it in the cluster configuration and configure a Spark catalog:

> \[
> \{
> "Classification": "iceberg-defaults",
> "Properties": \{
> "iceberg.enabled": "true"
> \}
> \}
> \]

Then configure the Spark session to use the AWS Glue Data Catalog as the Iceberg catalog:

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

There are three migration patterns for moving data from Hive-style tables to Iceberg on EMR.

- Pattern 1 — Lift and Shift to Iceberg. Read existing Hive or Parquet tables and write them as new Iceberg tables. This creates a full copy in Iceberg format:

PARTITIONED BY (days(event_timestamp)) AS SELECT \* FROM parquet.s3://raw-data/events/;

- Pattern 2 — In-place Migration (Hive to Iceberg). Convert an existing Hive table to Iceberg without rewriting data. The migrate procedure creates Iceberg metadata that points to existing Parquet, Avro, or ORC data files in place:

Existing data files are registered as Iceberg data files with no data movement required. After migration, the table supports all Iceberg features including schema evolution and time travel. To leave the original Hive table intact while creating a new Iceberg table pointing to the same files, use the snapshot procedure instead:

- Pattern 3 — Shadow Migration (zero-downtime). For production workloads that cannot tolerate downtime during migration: 1. Create an Iceberg table alongside the existing Hive table. 2. Dual-write to both tables during the migration window. 3. Validate the Iceberg table matches the Hive table using row counts, checksums, and sample queries. 4. Cut over readers to the Iceberg table. 5. Decommission the Hive table.

Key Iceberg features relevant to migration include:

- Hidden partitioning – Define partition transforms (year, month, day, hour, bucket, truncate) without requiring a specific directory layout. Partition values are derived from source columns automatically. Users do not need to include partition columns in queries to benefit from partition pruning. See the hidden partitioning discussion in the Optimizing Cost and Performance section.

- Schema evolution – Add, drop, rename, reorder columns, and widen types without rewriting data. Schema changes are metadata-only operations.

- Time travel – Query data as of a specific snapshot or timestamp. This is critical for migration validation: verify that the migrated table matches the source as of the cutover time.

- Row-level operations – MERGE INTO, UPDATE, and DELETE enable change data capture (CDC) patterns directly on the data lake. These operations use Iceberg format version 2 equality deletes and position deletes.

EMR-specific optimizations for Iceberg include:

- The EMR runtime for Apache Spark includes optimized Iceberg integration with vectorized reads, providing faster scan performance than open-source Iceberg.

- EMR 7.x bundles Iceberg 1.5 and later with native support for S3 Tables as the catalog backend, enabling automatic compaction and snapshot management.

- EMRFS S3-optimized committer is the default (for EMR versions prior to 7.10; starting with EMR 7.10, S3A replaces EMRFS as the default S3 connector) for Parquet writes on EMR 6.x and 7.x. For Iceberg tables, Iceberg uses its own commit protocol with atomic metadata updates, so the S3 committer is not needed.

The following table shows Iceberg version availability across EMR releases:

| EMR Release | Iceberg Version | Spark Version |
|-------------|-----------------|---------------|
| emr-7.12.0  | 1.10.0-amzn-0   | 3.5.x         |
| emr-7.5.0   | 1.6.1-amzn-1    | 3.5.x         |
| emr-7.0.0   | 1.4.2-amzn-0    | 3.5.x         |
| emr-6.15.0  | 1.4.0-amzn-0    | 3.4.x         |
| emr-6.10.0  | 1.1.0-amzn-0    | 3.3.x         |
| emr-6.5.0   | 0.12.0          | 3.2.x         |

The -amzn-N suffix indicates Amazon-specific patches to upstream Apache Iceberg releases.

Apache Iceberg currently has three format versions. Format v1 is the original specification providing types, partitioning, schema evolution, and snapshot isolation. Format v2 adds row-level deletes (equality and position deletes) and sequence numbers for ordering operations within snapshots — this is the default and most widely used production version. Format v3, finalized in Apache Iceberg 1.6.0, adds nanosecond timestamp types, default column values, and a binary variant type. Format v3 must be explicitly opted into with the format-version table property. For CDC patterns that require row-level deletes, format v2 or later is required.

For EMR on EKS environments, Iceberg is supported from EMR 6.6.0 and later. Configuration uses the same Spark catalog properties, specified via spark-submit parameters or application configuration overrides:

> *Note: When migrating to EMR, adopt Apache Iceberg as the target table format for structured data. Use the in-place migrate() procedure to convert existing Hive tables without rewriting data. For new tables, define hidden partition transforms at creation time. For production migrations with zero-downtime requirements, use the shadow migration pattern with dual-write and validation before cutover.*
