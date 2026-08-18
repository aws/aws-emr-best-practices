---
sidebar_label: Apache Iceberg
---

# Apache Iceberg

## Section 3: Apache Iceberg

Apache Iceberg is an open table format for large analytic datasets in Amazon S3. It provides fast query performance over large tables, atomic commits, concurrent writes, and SQL-compatible table evolution. Starting with Amazon EMR 6.5.0, you can use Apache Spark 3 on Amazon EMR clusters with the Iceberg table format. Amazon EMR 7.12.0 ships Iceberg 1.10.0 as a first-class component.

Iceberg tracks individual data files in a table instead of directories. Writers can create data files in place (files are not moved or changed), and can only add files to the table in an explicit commit. The table state is maintained in metadata files. All changes to the table state create a new metadata file that atomically replaces the older metadata. The table metadata file tracks the table schema, partitioning configuration, and other properties.

Iceberg also includes snapshots of the table contents. Each snapshot is a complete set of data files in the table at a point in time. Snapshots are listed in the metadata file, but the files in a snapshot are stored in separate manifest files. The atomic transitions from one table metadata file to the next provide snapshot isolation. Readers use the snapshot that was current when they loaded the table metadata and are not affected by changes until they refresh.

Figure: Iceberg Snapshot Architecture

Iceberg offers the following key features:

- ACID Transactions: Supports serializable isolation with atomic commits.

- Time Travel: Query previous versions of data using snapshot IDs or timestamps.

- Schema Evolution: Add, drop, update, or rename columns without side-effects.

- Partition Evolution: Update the partition layout of a table as data volume or query patterns change, without rewriting data.

- Hidden Partitioning: Eliminates the need for users to understand table partitioning details or add extra filters to queries.

- Concurrent Writers: Uses optimistic concurrency with file-level conflict resolution for high concurrency.

- Open File Formats: Supports Apache Parquet, Apache Avro, and Apache ORC.

- Version Rollback: Quickly correct problems by reverting to a pre-transaction state.

- Branching and Tagging: Supports named branches and tags on table snapshots for Write-Audit-Publish (WAP) patterns, staging environments, and safe data validation before promoting changes to production.

- Min-Max Statistics: Per-column statistics in metadata enable file skipping for selective queries.

### Considerations for using Apache Iceberg on Amazon EMR

#### *Assess fit for use case*

Consider using Iceberg when you need a table format that provides strong schema evolution, hidden partitioning, and broad multi-engine support. Iceberg is well-suited for:

- Large-scale analytics workloads where partition evolution and hidden partitioning simplify query patterns and reduce the need for manual partition management.

- Multi-engine environments where the same tables need to be accessed by Spark, Trino, Flink, Hive, Amazon Athena, Amazon Redshift, and other engines.

- Change data capture (CDC) and incremental processing workloads that benefit from MERGE operations and snapshot isolation.

- Data privacy compliance (GDPR/CCPA) requiring row-level deletes and updates.

- Workloads requiring time travel and audit capabilities for regulatory compliance.

#### *Amazon S3 Tables Integration*

Introduced at re:Invent 2024, Amazon S3 Tables is the first cloud object store with built-in Apache Iceberg support. S3 Tables provides a fully managed Iceberg experience with automatic compaction, snapshot management, and unreferenced file removal. S3 Tables is supported on Amazon EMR version 7.5 or higher and integrates with the AWS Glue Data Catalog for table discovery. This eliminates the operational overhead of managing Iceberg table maintenance jobs.

**Migration benefit:** S3 Tables eliminates all table maintenance operations (compaction, snapshot expiry, orphan file cleanup) that teams managed on-premises — removing an entire category of operational jobs from your migration scope. For detailed S3 Tables configuration, performance benchmarks, and migration steps from HDFS, see the *S3 Tables Auto-Compaction* section in the Data Migration chapter.

#### *Configuring EMR Spark with the AWS Glue Iceberg REST Catalog*

Starting with Amazon EMR 7.5, you can configure Spark to use the AWS Glue Data Catalog as an Iceberg REST catalog endpoint. This provides a standards-based catalog interface that supports the full Iceberg catalog API, including namespace management, table creation, and multi-engine access. To configure EMR Spark to use the Glue Iceberg REST endpoint, set the following Spark properties:

spark.sql.catalog.glue = org.apache.iceberg.spark.SparkCatalog

spark.sql.catalog.glue.type = rest

spark.sql.catalog.glue.uri =

spark.sql.catalog.glue.rest.sigv4-enabled = true

spark.sql.catalog.glue.rest.signing-region = \{region\}

spark.sql.catalog.glue.rest.signing-name = glue

spark.sql.catalog.glue.warehouse = \{glue-catalog-id\}

Replace \{region\} with your AWS region (e.g., us-east-1) and \{glue-catalog-id\} with your AWS account ID or Glue catalog ARN.

#### Multi-Catalog Hierarchy and Cross-Catalog Access

AWS Glue Data Catalog supports a multi-catalog hierarchy that enables cross-catalog access from a single Spark session. This allows EMR Spark jobs to query Iceberg tables across multiple catalog sources without requiring separate connections or data movement:

**AWS Glue catalogs:** Access Iceberg tables across multiple AWS accounts by configuring additional Glue catalog references.

**Federated catalogs:** Databricks Unity Catalog: AWS Glue catalog federation enables direct read access to Iceberg and UniForm-enabled Delta tables managed in Databricks Unity Catalog through an Iceberg REST API endpoint with OAuth-based authentication. Create a federated catalog in Glue using the DATABRICKSICEBERGRESTCATALOG connection type.

Snowflake Horizon: Similarly, Glue supports federation with Snowflake's Iceberg catalog (Horizon), enabling EMR Spark jobs to query Iceberg tables managed by Snowflake without copying data.

This multi-catalog architecture means an EMR Spark job can join data across a Glue-managed Iceberg table, a Databricks-managed Delta table (via UniForm), and a Snowflake-managed Iceberg table — all within a single query, governed by Lake Formation permissions.

#### *Writing Iceberg datasets*

Iceberg supports writing data through multiple engines on Amazon EMR:

- Apache Spark: Full read/write support including INSERT, UPDATE, DELETE, and MERGE operations via Spark SQL and the DataFrame API. Spark is the primary write engine for Iceberg on EMR.

- Apache Flink: Supports streaming writes to Iceberg tables, enabling real-time data ingestion pipelines on EMR on EKS (from release 7.2.0).

- Trino/Presto: Supports read and write operations on Iceberg tables for interactive analytics.

Table: Iceberg engine support on Amazon EMR

| Engine | Capabilities | When to use? |
|----|----|----|
| Spark SQL | Read, Write, DDL, Time Travel, MERGE | ETL pipelines, Data Science, ML, Primary write engine |
| Trino/Presto | Read, Write, DDL | Interactive & ad hoc queries, BI dashboards |
| Flink | Read, Write (Streaming) | Real-time streaming ingestion, CDC pipelines |
| Hive | Read | Legacy Hive-based ETL workloads |
| Amazon Athena | Read, Write, DDL, Time Travel | Serverless ad hoc queries, Data exploration |

#### *Table Maintenance*

Iceberg tables require periodic maintenance to ensure optimal query performance and manage storage costs.

- Compaction: Rewrite small data files into larger files to improve read performance. Use the rewrite_data_files procedure in Spark.

- Snapshot Expiration: Remove old snapshots to reduce metadata size and storage costs. Use the expire_snapshots procedure.

- Orphan File Removal: Clean up data files that are no longer referenced by any snapshot. Use the remove_orphan_files procedure.

- Sort Order Optimization: Rewrite data files with a specific sort order to improve query performance for common filter patterns.

- With Amazon S3 Tables, compaction, snapshot management, and unreferenced file removal are handled automatically, significantly reducing operational overhead.

#### *Deletes*

Apache Iceberg supports two types of deletes:

- Copy-on-Write Deletes: Rewrites affected data files without the deleted rows. Best for workloads with infrequent deletes and read-heavy access patterns.

- Merge-on-Read Deletes: Writes delete files that mark rows as deleted without rewriting data files. Best for write-heavy workloads with frequent deletes. Requires periodic compaction to merge delete files with data files.

#### *Performance and Tuning*

Keep the following guidelines in mind when working with Iceberg on Amazon EMR.

- EMR Cluster Size: Use memory intensive nodes (R6g, R7g,R5, R6i, R6g instances). Consider Instance Fleets and Spot Instances for cost optimization.

- File Size: Target 128-512 MB data files. Use the rewrite_data_files procedure to compact small files.

- Partition Strategy: Leverage hidden partitioning and partition evolution to avoid full table rewrites when query patterns change.

- Metadata Management: Regularly expire snapshots and remove orphan files to keep metadata lean and query planning fast.

- S3 URI Scheme: Use s3:// URI scheme on EMR for best performance and reliability.

- AWS Glue Data Catalog: Register Iceberg tables in the Glue Data Catalog for cross-service discovery. Use Lake Formation for fine-grained access control including table, row, column, and cell-level permissions (supported from EMR 7.10+).

Table: Key Iceberg Properties

| Property | Description |
|----|----|
| write.target-file-size-bytes | Target size for data files (default 512 MB). |
| write.metadata.delete-after-commit.enabled | Automatically clean up old metadata files after commits. |
| write.spark.fanout.enabled | Enable fanout writer for unordered writes to improve throughput. |
| read.split.target-size | Target split size for read tasks to control parallelism. |
| write.delete.mode | Delete mode: copy-on-write or merge-on-read. |
