---
sidebar_label: "S3 Tables — Managed Iceberg Tables ✨"
---

# Migrating Tabular Data to a Managed Iceberg Destination

When migrating structured data from on-premises Hadoop to AWS, Amazon S3 Tables provides a managed destination that eliminates post-migration maintenance overhead. S3 Tables is introduced earlier in this chapter (see 'Amazon S3 Tables — Managed Destination for Structured Data').

Two migration approaches are available: (1) Full data migration (CTAS) — recreates data files and metadata, allowing you to optimize partition strategies and file formats. (2) In-place registration — registers existing Parquet/ORC/Avro files under Iceberg metadata without rewriting data.

After migration, tables are accessible via the Iceberg REST Catalog endpoint from any compatible engine (Athena, EMR Spark, Redshift, Trino, DuckDB). S3 Intelligent-Tiering automatically moves infrequently accessed data to lower-cost tiers (40% savings after 30 days, 68% after 90 days).
