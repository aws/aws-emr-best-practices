---
sidebar_label: Delta Lake
---

# Delta Lake

## Section 2: Delta Lake

Delta Lake is an open-source storage layer framework, originally developed by Databricks and now a Linux Foundation project, that brings ACID transactions, scalable metadata handling, and unified streaming and batch data processing to data lakes built on Amazon S3. Amazon EMR provides native support for Delta Lake starting with release 6.9.0, enabling organizations to leverage ACID transactions, schema enforcement, and time travel on their lakehouse architectures without packaging custom dependencies.

Amazon EMR 7.12.0 ships Delta Lake 3.3.2 as a first-class component. Delta Lake is also supported on EMR Serverless (release 7.1.0+) natively, eliminating the need to package jars or use --packages flags. Delta Lake tables registered in the AWS Glue Data Catalog become discoverable by other AWS analytics services including Amazon Athena and Amazon Redshift Spectrum.

Delta Lake stores data in Parquet format and maintains a transaction log (\_delta_log directory) that records every change made to the table. This transaction log enables ACID transactions, time travel, and audit history. Key capabilities include:

- ACID Transactions: Serializable isolation for concurrent reads and writes.

- Schema Enforcement and Evolution: Prevents bad data from being written and supports adding/changing columns.

- Time Travel: Query previous versions of data using timestamps or version numbers.

- Unified Batch and Streaming: Use the same table as both a batch table and a streaming source/sink.

- DML Operations: Supports INSERT, UPDATE, DELETE, and MERGE operations via Spark SQL.

### Considerations for using Delta Lake on Amazon EMR

#### *Version Compatibility and EMR Release Alignment*

Delta Lake support on Amazon EMR follows a release-coupled model. The Delta Lake version is bundled with each EMR release and cannot be independently upgraded. Key considerations:

- Delta Lake 3.3x requires Apache Spark 3.5x. Running Delta Lake 3.3.x on Spark 3.4 or earlier will fail. EMR releases prior to 6.9.0 do not include Delta Lake support. Please check this [link](https://docs.delta.io/releases/) for latest compatibility.

- The Delta Lake version determines which Delta protocol features are available (reader/writer versions). For example, UniForm requires minReaderVersion \>= 2 and minWriterVersion \>= 7, which may not be achievable on older EMR releases.

- EMR Serverless (release 7.1.0+) ships Delta Lake natively, eliminating the need to package jars.

Recommendation: Pin your EMR release version in production and test Delta Lake feature compatibility before upgrading. Review the EMR release guide for the exact Delta version bundled with each release.

#### *Known Limitations and Platform-Specific Issues*

- UniForm and Convert-to-Iceberg (EMR 7.0): Delta Universal Format (UniForm) and convert-to-Iceberg statements are not supported on Amazon EMR 7.0. Organizations planning to use UniForm for cross-format interoperability should target EMR 7.1.0 or later.

- Column Rename Data Loss (EMR 6.9 and 6.10): When Delta Lake table data is stored in Amazon S3, performing a column rename operation on EMR 6.9 or 6.10 causes column data to become NULL. This issue is resolved in EMR 6.11.

- S3 URI Scheme: AWS recommends using the s3:// URI scheme rather than s3a:// for Delta Lake table paths on EMR for better performance, security, and reliability through EMRFS.

- AWS Glue Data Catalog Empty LOCATION: If a database is created in the AWS Glue Data Catalog outside of Apache Spark, the database may have an empty LOCATION field, resulting in IllegalArgumentException. Always create Glue databases with a valid, non-empty LOCATION path.

#### *Catalog Integration: AWS Glue Data Catalog*

The AWS Glue Data Catalog serves as the default Hive-compatible metastore for Amazon EMR. When using Delta Lake with Glue:

- Enable "Use for Spark table metadata" in the EMR cluster configuration to register Delta tables in the Glue Data Catalog.

- Delta tables registered in Glue become discoverable by other AWS analytics services (Athena, Redshift Spectrum) depending on format support.

- The Glue Data Catalog does not natively understand Delta Lake transaction log. It stores the table location, and the Delta Lake client reads the \_delta_log directory at query time to resolve the current table state.

#### *Interoperability Through Delta Lake UniForm*

Delta Lake UniForm addresses interoperability with other table formats by generating Iceberg metadata alongside Delta Lake metadata, allowing Iceberg clients to read Delta tables without data duplication. Only one copy of data exists on S3. Delta Lake remains the writer, and Iceberg clients (Amazon Redshift, Athena, Snowflake, Trino) get read access through the generated Iceberg metadata.

- UniForm is not supported on EMR 7.0. Use EMR 7.1.0 or later.

- The delta-iceberg package is required to generate Iceberg metadata alongside Delta metadata.

- UniForm tables are write-only from the Delta Lake side. Iceberg clients cannot write to UniForm tables.

- UniForm adds overhead to write operations because Iceberg metadata must be generated on each commit.

A common pattern enabled by UniForm: Amazon EMR (Spark) writes and manages Delta Lake tables with UniForm enabled, tables are registered in the AWS Glue Data Catalog, and Amazon Redshift queries the same tables as Iceberg tables through the awsdatacatalog schema. This eliminates the need for manifest-based access patterns or ETL pipelines to convert Delta tables for Redshift consumption.

#### *Catalog Federation with Databricks Unity Catalog*

AWS Glue now supports catalog federation, enabling direct access to Apache Iceberg tables managed in Databricks Unity Catalog through the Glue Data Catalog. This integration uses an Iceberg REST API endpoint and OAuth-based authentication.

- Supports read operations on Iceberg and UniForm-enabled Delta tables.

- Avoids manual catalog synchronization.

- Fine-grained access control is enforced through AWS Lake Formation, including table filters, column filters, and row filters.

- Requires creating a federated catalog in Glue using a DATABRICKSICEBERGRESTCATALOG connection type.

#### *Performance and Operational Considerations*

- S3 Storage Optimization: Use s3:// URI scheme exclusively on EMR for Delta Lake paths. Enable S3 lifecycle policies to manage old log entries if not using VACUUM regularly.

- Concurrency: Delta Lake uses optimistic concurrency control. Concurrent writers to the same table from multiple EMR clusters can cause commit conflicts. Design write pipelines to minimize overlapping partition writes.

- Table Maintenance: Run OPTIMIZE regularly to compact small files into larger ones for better read performance. Run VACUUM to remove old data files no longer referenced by the transaction log.

- Monitoring: Use Spark UI and EMR cluster metrics to monitor Delta Lake operation latency. Monitor S3 request rates for tables with high commit frequency, as the \_delta_log directory can become a hotspot.
