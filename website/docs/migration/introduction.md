---
sidebar_position: 1
sidebar_label: Migration
---

# Migration

This section provides best practice guides and tools to migrate data processing applications from self-managed environments to Amazon EMR.

1. [Amazon EMR Migration Guide](https://d1.awsstatic.com/whitepapers/amazon_emr_migration_guide.pdf) This is a comprehensive technical document that provides best practices and steps for migrating Apache Spark and Apache Hadoop from on-premises to AWS.

2. [Migrating to Apache HBase on Amazon S3 on Amazon EMR](https://docs.aws.amazon.com/whitepapers/latest/migrate-apache-hbase-s3/migrate-apache-hbase-s3.html) This whitepaper provides an overview of Apache HBase on Amazon S3 and guides data engineers and software developers in the migration of an on- premises or HDFS backed Apache HBase cluster to Apache HBase on Amazon S3. The whitepaper offers a migration plan that includes detailed steps for each stage of the migration, including data migration, performance tuning, and operational guidance.

3. Data Migration: We recommend using [AWS DataSync](https://aws.amazon.com/datasync/) for migrating data from HDFS to S3. Check this [blog post](https://aws.amazon.com/blogs/storage/using-aws-datasync-to-move-data-from-hadoop-to-amazon-s3/) to review Datasync capabilities and how to get started with Data migrations.

4. Data pipelines Migrations: The following tools can be useful in migrating your current data pipelines to AWS
    1. [Oozie to MWAA](https://github.com/dgghosalaws/oozie-to-airflow-emr)
    2. [Oozie to AWS Step Functions](https://docs.aws.amazon.com/SchemaConversionTool/latest/userguide/big-data-oozie.html)

5. Data Governance: The following tools can helpful in migrating your current data catalogs to AWS
    1. [Migrate metadata between Hive metastore and AWS Glue Data Catalog](https://github.com/aws-samples/aws-glue-samples/tree/f3baf576d7da13ff79dbfe52938f22834fb6c0d7/utilities/Hive_metastore_migration)
    2. [Hive Glue Catalog Sync Agent](https://github.com/awslabs/aws-glue-catalog-sync-agent-for-hive)

For further assistance reach out to [aws-bdms-emr@amazon.com](mailto:aws-bdms-emr@amazon.com?subject=EMR%20Best%20Practices:%20Migration%20Question)
