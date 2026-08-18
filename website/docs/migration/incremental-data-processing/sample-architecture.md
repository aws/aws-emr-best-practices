---
sidebar_label: Sample Architecture
---

# Sample Architecture

The following architecture shows the workflow for ingesting incremental data using Apache Iceberg on Amazon EMR.

![](/img/migration/image30.png)

Figure: Ingesting incremental data with Apache Iceberg on Amazon EMR

- Ingestion — Data from 3rd party APIs, on-prem databases, files, and streaming sources is ingested into Amazon S3 using EMR, Lambda, DMS, Transfer Family, Glue, or Firehose.

- Data Processing — Amazon EMR processes raw data through a medallion architecture (Raw → Transformed → Conformed) as Iceberg tables, governed by Lake Formation and Data Quality rules, with all tables registered in the AWS Glue Catalog.

- 1P Consumption — Amazon Athena, EMR, and Redshift query the Iceberg tables directly through the Glue Data Catalog with time travel and snapshot isolation.

- 3P Catalog Integration — Glue catalog federation enables cross-catalog access to Iceberg tables in external platforms like Polaris, Snowflake Horizon, and Databricks Unity Catalog.

**SageMaker Lakehouse integration:** When Iceberg tables are registered in the AWS Glue Data Catalog, they are automatically accessible through Amazon SageMaker Lakehouse — providing a unified governance plane where EMR, Amazon Redshift, Amazon Athena, and SageMaker notebooks can all query the same tables with consistent Lake Formation access controls. For migrating organizations, this means a single security model replaces the fragmented access controls (Ranger + HDFS ACLs + custom policies) typical of on-premises environments. See SageMaker Lakehouse for details.
