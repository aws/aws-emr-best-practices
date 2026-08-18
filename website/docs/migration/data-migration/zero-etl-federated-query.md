---
sidebar_label: Zero-ETL and Federated Query ✨
---

# Zero-ETL and Federated Query — Reducing Data Movement

A key principle of modern data architecture is to move compute to data rather than moving data to compute. Several AWS services now support this pattern, which can simplify or accelerate migration by reducing the amount of data that needs to be physically moved to Amazon S3.

## Amazon Athena Federated Query

Amazon Athena Federated Query lets you run SQL queries across data stored in Amazon S3, relational databases, NoSQL stores, and on-premises systems — all from a single Athena query. The architecture uses Lambda-based data source connectors: when you submit a query referencing a federated catalog, Athena invokes a Lambda function that retrieves metadata and data from the target source. Athena pushes filter conditions to the connector, which translates them to the source's native query language to minimize data transfer. For large result sets, the connector spills intermediate data to an S3 bucket that you configure.

Athena provides over 30 prebuilt connectors for common data sources:

- AWS native sources – Amazon DynamoDB, Amazon Redshift, Amazon CloudWatch Logs, CloudWatch Metrics, Amazon Neptune, Amazon OpenSearch Service, Amazon Timestream, Amazon MSK, Amazon DocumentDB

- Relational databases (JDBC) – MySQL, PostgreSQL, SQL Server, Oracle, Db2, SAP HANA, Teradata, Vertica

- Hadoop ecosystem – HBase, Cloudera Hive, Cloudera Impala, Hortonworks

- Cloud and SaaS – Snowflake, Google BigQuery, Google Cloud Storage, Azure Data Lake Storage Gen2, Azure Synapse

- Other – Apache Kafka, Redis

For on-premises data sources not covered by prebuilt connectors, you can build custom connectors using the open-source Athena Query Federation SDK (Java-based). Deploy the connector Lambda in a VPC with connectivity to on-premises databases via AWS Direct Connect or VPN.

During migration, Athena Federated Query enables several patterns:

- Query on-premises data from AWS without moving it first. Deploy a JDBC connector Lambda with connectivity to on-premises databases. Run analytics from Athena against source systems while migration is in progress.

- Validate migrated data by joining on-premises source with S3 target. For example, run a cross-source join to verify row-level completeness:

FULL OUTER JOIN s3_iceberg.db.orders i ON o.order_id = i.order_id WHERE o.order_id IS NULL OR i.order_id IS NULL

- Run analytics on partially migrated datasets. Keep querying legacy sources via federation while progressively moving tables to S3 and Iceberg. No application changes are needed until final cutover.

Athena Federated Query has several limitations to consider. Lambda functions have a 15-minute maximum execution time per invocation, so large scans on slow sources can time out. Each query may invoke multiple Lambda functions in parallel, and account-level Lambda concurrency limits apply. Federated queries are significantly slower than native S3 queries — they are not suitable for latency-sensitive dashboards on large datasets. Not all SQL expressions can be pushed down to the source; complex aggregations and window functions may execute in Athena after data retrieval. You pay for Lambda invocations, Athena data scanned, and S3 spill storage.

### Amazon Athena OPTIMIZE and VACUUM for Iceberg Tables

Amazon Athena provides two SQL commands for maintaining Iceberg tables without requiring an EMR cluster.

To compact only a specific partition:

Athena supports the BIN_PACK strategy only. Output files target the size specified by the write.target-file-size-bytes table property (default approximately 128 MB). For sort-order compaction, use rewrite_data_files on EMR Spark instead.

The retention period is controlled by the vacuum_max_snapshot_age_seconds table property (default: 5 days / 432,000 seconds):

Athena OPTIMIZE and VACUUM are best suited for routine maintenance on small-to-medium Iceberg tables. For very large tables (terabytes or more) or tables requiring sort-order compaction, use EMR Spark with the rewrite_data_files and expire_snapshots procedures, which provide distributed execution and additional compaction strategies.

## Amazon Redshift Zero-ETL with Aurora

For customers migrating relational database workloads alongside their EMR migration, Amazon Aurora zero-ETL integration with Amazon Redshift eliminates the need to build ETL pipelines for OLTP-to-analytics data movement.

Zero-ETL creates an integration between an Aurora DB cluster (source) and a Redshift data warehouse (target). An initial full snapshot of selected tables is replicated to Redshift, followed by continuous near-real-time replication of ongoing changes. Aurora MySQL uses binary log (binlog) CDC to capture changes. Aurora PostgreSQL uses logical replication. AWS manages the pipeline health, monitoring, and automatic recovery.

Aurora MySQL zero-ETL became generally available in November 2023 (requires Aurora MySQL 3.05.2 or later). Aurora PostgreSQL zero-ETL became generally available in early 2024 (requires Aurora PostgreSQL 16.4 or later). The Redshift target must use RA3 node types (provisioned) or Redshift Serverless, with encryption enabled and case sensitivity turned on.

Key limitations include:

- Tables without primary keys are not replicated.

- Source and target must be in the same AWS Region.

- **The destination database in Redshift is read-only** — you cannot create tables, views, or materialized views in it.

- Data is replicated as-is with no transformations. Transform post-replication using Redshift SQL.

- ALTER TABLE operations on the source cause full table resynchronization, during which the table is unavailable in Redshift.

- Maximum 50 integrations per Redshift data warehouse and 5 integrations per source cluster.

During an EMR migration, zero-ETL enables operational analytics on transactional data without building custom CDC pipelines. Combine zero-ETL replicated data in Redshift with Iceberg tables in S3 for the data lake layer: Redshift can query both its replicated data and Iceberg tables via Redshift Spectrum or data sharing.

## EMR on EKS 

Amazon EMR on EKS lets you run Apache Spark on an existing Amazon EKS Kubernetes cluster without managing dedicated EMR clusters. You register a Kubernetes namespace on your EKS cluster with Amazon EMR, creating a virtual cluster with no idle resources. You then submit Spark jobs via the EMR API, and EMR schedules Spark driver and executor pods in the registered namespace using the EKS cluster's compute. Pods terminate after job completion — there is no persistent infrastructure between jobs.

EMR on EKS supports EMR releases from 5.32.0 (Spark 2.4.x) through 7.12.0 (Spark 3.5.6, Iceberg 1.10.0). Apache Iceberg is supported on EMR on EKS from EMR 6.6.0 and later.

EMR on EKS is S3-native by design — there is no HDFS cluster attached. Spark jobs read and write directly to S3. This aligns naturally with HDFS-to-S3 migration: you change only the storage layer while keeping your existing Kubernetes compute platform. For customers who have already invested in EKS for microservices, this reduces the migration surface by sharing compute infrastructure between Spark workloads and application workloads.

Use EMR on EKS when you already operate Kubernetes clusters and want to consolidate compute, need rapid job submission (pods launch in seconds, compared to 5-10 minutes for EMR cluster bootstrap), or require multi-tenant workload isolation via Kubernetes namespaces. Use EMR on EC2 or EMR Serverless when you want a fully managed big data platform without Kubernetes operational overhead, need frameworks beyond Spark (such as Hive, Presto, Trino, HBase, or Flink), or require interactive notebook environments.

## Recommended Migration Phasing with Federated Query

The following phased approach uses federated query capabilities to reduce risk and enable incremental migration:

- Phase 1 — Assess. Use Athena Federated Query to query on-premises data sources from AWS. No data movement is required. Validate query patterns, identify hot datasets, and estimate data volumes.

- Phase 2 — Pilot. Migrate hot datasets to S3 or S3 Tables. Continue querying on-premises sources via Athena federation for remaining data. Run cross-source validation queries to confirm migrated data matches the source.

- Phase 3 — Migrate. Move remaining datasets to S3. Cut over ETL jobs from on-premises Hadoop to EMR (on EC2, EKS, or Serverless). Convert tables to Iceberg format using the in-place migration procedure.

- Phase 4 — Optimize. Convert remaining tables to Iceberg if not done in Phase 3. Enable S3 Tables auto-compaction or schedule Iceberg maintenance jobs. Optimize storage tiering using S3 Intelligent-Tiering and S3 Glacier Instant Retrieval. Remove federated query connectors as on-premises sources are decommissioned.

> *Note: Athena Federated Query and Aurora zero-ETL serve complementary purposes. Use federated query for ad hoc cross-source validation during migration. Use zero-ETL for ongoing operational analytics on relational data post-migration. For Spark workloads, EMR on EKS provides an S3-native compute platform that aligns with HDFS-to-S3 migration without requiring dedicated EMR cluster management.*
