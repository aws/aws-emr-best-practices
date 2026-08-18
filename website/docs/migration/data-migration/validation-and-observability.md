---
sidebar_label: Validation and Observability ✨
---

# Data Migration Validation and Observability

Data migration is only successful when the target data is complete, accurate, and intact. Validation failures discovered after cutover can result in incorrect analytics, compliance violations, or costly re-migration efforts. Equally important is observability — maintaining real-time visibility into migration progress, throughput, and errors so that issues are detected and resolved before they compound.

This section covers migration-specific validation patterns and monitoring strategies using current AWS services. For broader data quality concepts (completeness, accuracy, timeliness, consistency) and general testing approaches, see the Testing and Validation chapter.

## Data Integrity During Transfer

Amazon S3 now provides default data integrity protections for all uploads. As of December 2024, the latest AWS SDKs automatically calculate CRC-based checksums (CRC64NVME by default) during upload, and S3 independently verifies these checksums before accepting objects. S3 supports six checksum algorithms: CRC64NVME, CRC32, CRC32C, SHA-1, SHA-256, and MD5. For multipart uploads, S3 stores a whole-object CRC-based checksum in object metadata, enabling post-transfer integrity verification without downloading the object.

For data already stored in S3, S3 Batch Operations Compute Checksum (launched August 2025) calculates checksums for up to billions of objects at rest without downloading or restoring data. You provide a manifest or specify bucket filters, and S3 generates a consolidated integrity report. This is particularly useful for verifying large-scale migrations after transfer completion.

AWS DataSync performs built-in integrity verification during every transfer. DataSync calculates checksums at the source, transfers the data, and compares checksums at the destination. Task reports provide per-file verification status, documenting which files were transferred successfully and flagging any integrity mismatches. In Enhanced mode, structured JSON logs provide additional detail for troubleshooting.

> *Note: For critical migrations, we recommend enabling full verification in DataSync (the default) and retaining task reports in S3 for audit purposes. After transfer, use S3 Batch Operations Compute Checksum to generate an independent integrity report that can be compared against source-side checksums for end-to-end validation.*

## Data Parity Validation

Data parity confirms that the content, structure, and completeness of migrated data matches the source. AWS provides several approaches depending on the data source type and scale.

### AWS Glue Data Quality

AWS Glue Data Quality is a serverless service that measures and monitors data quality using the Data Quality Definition Language (DQDL). For migration validation, key capabilities include:

- **Cross-dataset comparison** — rules like DatasetMatch and AggregateMatch compare source and target datasets to verify equivalence of row counts, column sums, and value distributions

- **Automatic rule recommendations** — Glue analyzes your dataset statistics and recommends quality rules, reducing manual rule authoring

- **Inline ETL validation** — embed data quality checks directly in AWS Glue ETL pipelines to validate data during transformation before writing to the target

- **Anomaly detection** — ML-based detection of unexpected changes in data distributions that may indicate migration errors

DQDL rules relevant to migration parity include RowCount, ColumnCount, Completeness, Uniqueness, SchemaMatch, and aggregate comparisons. Results can trigger CloudWatch alarms or halt pipelines when parity checks fail.

### AWS DMS Validation

AWS Database Migration Service includes built-in data validation that compares source and target data row-by-row after a full load completes or during ongoing CDC replication. DMS validation supports S3 targets and can identify missing rows, extra rows, and data mismatches.

For scenarios where you need validation without data movement, DMS supports validation-only tasks — these compare source and target without performing any migration, useful for periodic re-verification or post-cutover confirmation. When discrepancies are found, DMS data resync can automatically re-read affected records from the source and apply corrections to the target.

### Custom Validation with Apache Spark

For large-scale migrations where built-in validation tools are insufficient, run custom validation jobs on Amazon EMR Serverless:

- **Row count comparison** — count records in source and target, grouped by partition keys

- **Column-level checksums** — compute hash aggregates (e.g., MD5(CONCAT(col1, col2, ...))) on both sides and compare

- **Schema validation** — verify column names, data types, and nullability match expectations

- **Statistical profiling** — compare min/max/avg/distinct counts for numeric and categorical columns

- **Apache Griffin** — open-source data quality framework that supports configuration-driven batch and streaming validation at scale on EMR

## Monitoring Migration Progress

A comprehensive observability strategy combines metrics, logs, and alerts across all migration services into a unified view.

Amazon CloudWatch serves as the central monitoring hub:

- **AWS DataSync** — bytes transferred, files transferred, throughput (bytes/second), task execution status

- **AWS DMS** — CDC latency, rows migrated, validation state (pending/validated/mismatched), replication instance CPU and memory

- **Amazon S3** — request counts, bytes uploaded, 4xx/5xx error rates, first-byte latency

Build a CloudWatch dashboard that consolidates these metrics into a single migration progress view. Include widgets for overall data volume transferred, current throughput, error rates, and validation status. Use CloudWatch alarms to alert on throughput drops below expected thresholds, rising error rates, or stalled transfers.

Amazon EventBridge enables event-driven automation — trigger notifications or remediation workflows when DataSync tasks complete, DMS validation finds mismatches, or EMR jobs fail. For example, automatically restart a failed transfer task or escalate validation failures to the migration team.

AWS CloudTrail provides an audit trail of all API calls during migration, documenting who initiated transfers, modified configurations, or accessed migrated data — essential for compliance and post-migration review.

> *Note: Establish validation gates at each stage of your migration pipeline: verify integrity immediately after transfer (checksums), validate parity after transformation (Glue Data Quality or custom Spark jobs), and confirm completeness before cutover (row counts and aggregate comparisons). Automate these gates using AWS Step Functions or Apache Airflow so that data does not advance to the next stage until validation passes. This approach catches issues early when they are cheapest to remediate.*

## Appendix

Amazon S3 Access Grants — Identity-Based Data Lake Permissions

Amazon S3 Access Grants (GA March 2024) maps identities from AWS IAM Identity Center (or any SAML 2.0/OIDC identity provider) directly to S3 prefixes, buckets, or objects with permission levels (READ, WRITE, READWRITE). Applications call the GetDataAccess API to receive temporary, scoped STS credentials for the specific S3 prefix (default 1 hour, configurable 15 min–12 hours).

This replaces the complex per-dataset IAM policies that would otherwise be needed to replicate on-premises Ranger or HDFS ACL permissions at scale. For example, the data-science AD group gets read access to s3://data-lake/curated/, while data-engineering gets read-write access to s3://data-lake/raw/ — all managed through a single Access Grants instance (up to 1,000 grants, increasable via Service Quotas).

To configure S3 Access Grants on EMR (requires EMR 6.15+ or 7.0+):

> \[
> \{
> "Classification": "emrfs-site",
> "Properties": \{
> "fs.s3.s3AccessGrants.enabled": "true",
> "fs.s3.s3AccessGrants.fallbackToIAM": "true"
> \}
> \}
> \]

Set fallbackToIAM to true during migration so existing IAM-based access continues to work. Once all grants are validated, set it to false to enforce Access Grants exclusively.

| On-Premises | S3 Access Grants Equivalent |
|----|----|
| HDFS ACLs per directory | S3 prefix-level grants |
| Ranger policies per Hive database/table | Grants mapped to S3 table prefixes |
| Kerberos principal + AD group | AWS Identity Center group |
| Ranger audit logs | S3 Access Grants + CloudTrail logs |
| Ranger column/row-level security | Not supported — use AWS Lake Formation |

> Note: Access Grants provides prefix-level allow-only access — explicit denials require IAM policies, bucket policies, or SCPs. For column-level masking, row-level filtering, or tag-based policies, combine Access Grants with AWS Lake Formation. Instances are region-scoped; credentials are evaluated at vending time, so revoked grants remain valid until existing credentials expire.
