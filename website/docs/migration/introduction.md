---
sidebar_position: 1
sidebar_label: Introduction
---

# Introduction

This section provides best practice guidance and tools to migrate data processing applications from self-managed environments to Amazon EMR.


1. [EMR Migration Guide](https://pages.awscloud.com/EMR_Migration_Guide.html) : This is a comprehensive technical document that provides guidance for migrating various components including data, application, security configurations etc from self-managed data processing applictions to Amazon EMR 

2. Data Migration: We recommend using AWS Datasync for migrating HDFS to S3. [Start with this](https://aws.amazon.com/blogs/storage/using-aws-datasync-to-move-data-from-hadoop-to-amazon-s3/) Data Sync support for HDFS blog to review Datasync capabilities and how to get started with Data migrations

3. Data pipelines Migrations: The following tools can be useful in migrating your current data pipelines to AWS
    1. Oozie to MWAA
    2. Oozie to stepfunctions 

4. Data Governance: The following tools can helpful in migrating your current data catalogs to AWS
    1. [Migrate metadata between Hive metastore and AWS Glue Data Catalog](https://github.com/aws-samples/aws-glue-samples/tree/f3baf576d7da13ff79dbfe52938f22834fb6c0d7/utilities/Hive_metastore_migration)
    2. [Hive Glue Catalog Sync Agent](https://github.com/awslabs/aws-glue-catalog-sync-agent-for-hive)

For further assistance reach out to aws-bdms-emr@amazon.com 
