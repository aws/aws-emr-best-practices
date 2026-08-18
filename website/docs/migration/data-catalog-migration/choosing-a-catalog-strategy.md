---
sidebar_label: Choosing a Catalog Strategy for Your Migration
---

# Choosing a Catalog Strategy for Your Migration

Apache Hive is an open source data warehouse and analytics package that runs on top of an Apache Hadoop cluster. Hive is one of the applications that can run on Amazon EMR. A Hive metastore contains a description of the table and the underlying data on which it is built, including the partition names and data types. There are three modes for Hive metastore deployment: embedded metastore, local metastore, and remote metastore. When migrating a Hadoop on-premises cluster to Amazon EMR, you must follow a different strategy depending on how the Hive metastore is being deployed. This chapter provides the different patterns used to deploy a Hive metastore and how to migrate an existing metastore to Amazon EMR.

Your on-premises Hive Metastore served as the central schema registry for all tables. On AWS, you have multiple catalog options with different trade-offs. Use this decision table to identify your target:

| **Migration Scenario** | **Recommended Catalog** | **Rationale** |
|----|----|----|
| Standard migration (most customers) | AWS Glue Data Catalog | Default recommendation. Serverless, no infrastructure, supports Hive-compatible tables and Apache Iceberg natively. Integrates with Lake Formation for fine-grained access control, cross-account sharing, and multi-engine access (EMR, Athena, Redshift). |
| New Iceberg tables on S3 Tables | S3 Tables built-in catalog + Glue Data Catalog federation | S3 Tables includes its own Iceberg catalog. Register tables in Glue Data Catalog via federation for unified discovery across all engines. |
| Hybrid migration (on-prem + cloud running in parallel) | External Hive Metastore on Amazon RDS/Aurora | Maintains schema compatibility with on-premises Hive during coexistence. Use DMS for ongoing sync between on-prem and cloud metastore. Migrate to Glue Data Catalog once cutover is complete. |
| Organization uses Databricks alongside AWS | Glue Data Catalog + Databricks Unity Catalog federation | Glue Data Catalog as primary catalog; federate Databricks Unity Catalog tables via the Iceberg REST endpoint for cross-platform access. |
| Strict Hive 2.x/3.x compatibility required | External Hive Metastore on Amazon RDS/Aurora | Some legacy Hive features (e.g., materialized views, certain UDFs) require the native Hive Metastore schema. Use RDS/Aurora until workloads are refactored. |

**Migration principle:** For most migrations, target AWS Glue Data Catalog as your long-term catalog. It is serverless (no infrastructure to manage), supports both Hive-compatible and Iceberg table formats, and provides the foundation for Lake Formation governance. If you need an external Hive Metastore during the transition period, plan to migrate from RDS to Glue Data Catalog once parallel running ends.

## Modern Glue Data Catalog Capabilities (Migration-Relevant)

Since this guide was first published, AWS Glue Data Catalog has added capabilities that significantly change the migration landscape. These are briefly noted here for migration planning — see linked documentation for configuration details.

**Apache Iceberg table management** — Glue Data Catalog natively registers, manages, and exposes Iceberg tables through a standards-compliant Iceberg REST catalog endpoint (EMR 7.5+). This replaces the need for a separate Iceberg catalog service. See Using Iceberg tables with the AWS Glue Data Catalog.

**Lake Formation fine-grained access control** — Table, column, row, and cell-level permissions managed centrally. Replaces Apache Ranger or Sentry policies from on-premises. See AWS Lake Formation.

**Cross-account catalog sharing** — Share databases and tables across AWS accounts without copying data. Enables multi-team governance where a central data team owns the catalog and consumer teams query from their own accounts. See Lake Formation cross-account access.

**Catalog federation** — Access tables from external catalogs (Databricks Unity Catalog, Snowflake, Apache Polaris) through Glue Data Catalog without migrating metadata. Useful during transition when some workloads remain on other platforms. See Federated catalog access.

**SageMaker Lakehouse integration** — Iceberg tables in Glue Data Catalog are automatically accessible through SageMaker Lakehouse, providing unified query access from EMR, Athena, Redshift, and SageMaker notebooks with consistent governance. See SageMaker Lakehouse.

**What this means for your migration:** On-premises, you likely managed a single Hive Metastore with Ranger for access control and no built-in cross-team sharing. Migrating to Glue Data Catalog with Lake Formation provides centralized governance, multi-engine access, and cross-account sharing — capabilities that required complex custom solutions on-premises.
