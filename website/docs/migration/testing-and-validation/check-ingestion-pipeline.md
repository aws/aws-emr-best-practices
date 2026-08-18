---
sidebar_label: Check Ingestion Pipeline
---

# Check your Ingestion Pipeline

Data integrity is a crucial part of data quality checks. One of the most important areas to validate is whether ingested raw data is correct.

**Understanding Tool-Specific Validation**

When validating data migration from source to target systems, first understand your tool's existing validation mechanisms. For example:

**Apache Sqoop** validates data copy jobs through the --validate flag, which performs row count comparisons:

> sqoop import --connect jdbc:mysql://source/db --table orders \
>
> --target-dir s3://bucket/orders/ --validate

However, Sqoop validation has limitations—it does not support:

- All-tables option

- Free-form query option

- Data imported into Hive or HBase

- Table import with --where argument

- Incremental imports

Fundamentally, Sqoop only performs row count comparisons. To validate every transferred value, you must reverse your data flow and compare old data against new data with hashes or checksums—an expensive operation requiring careful risk assessment.

**AWS CLI and S3 Data Transfer Validation**

When using AWS CLI to transfer data to Amazon S3, common validation questions arise:

- Does AWS CLI validate objects as they land in S3? Yes, AWS CLI uses MD5 checksums for integrity validation

- How does AWS CLI validate objects? Through Content-MD5 headers and ETags

- Does Amazon S3 expose the checksum? Yes, via ETag (with caveats for multipart uploads)

- What about multipart uploads? S3 calculates checksums for parts and the whole object differently

- How to validate without relying on ETag? Use AWS CLI's --checksum-algorithm option (SHA256, CRC32, etc.)

Use AWS CLI with explicit checksum algorithms:

> aws s3 cp source.parquet s3://bucket/data/ \
>
> --checksum-algorithm SHA256 \
>
> --metadata-directive REPLACE

## Overall Data Quality Policy
