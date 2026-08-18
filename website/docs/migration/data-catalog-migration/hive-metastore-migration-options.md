---
sidebar_label: Hive Metastore Migration Options
---

# Hive Metastore Migration Options

When migrating Hadoop-based workloads from on-premises to the cloud, you must migrate a Hive metastore as well. Depending on the migration plan and requirements, a metastore can be migrated in two different ways: a one-time migration that migrates an existing Hive metastore completely to AWS, or an on-going migration that migrates the Hive metastore, but keeps a copy on-premises. In this scenario, the two metastores are synced in real time during the migration phase. The following section discusses these two scenarios in detail.

## One-Time Metastore Migration

This section focuses on a set of options to consider when migrating an existing Hive metastore completely to AWS. This situation is applicable to a scenario where the organization plans to use the Hive metastore on AWS. The following figure illustrates this scenario:

![](/img/migration/image20.png)
>
> *Figure 27: One-time metastore migration*

#### Existing Hive Metastore to AWS Glue Data Catalog

In this case, the goal is to migrate existing Hive metastore from on-premises to an AWS Glue Data Catalog. You can use AWS Glue ETL job to extract metadata from your Hive metastore, and use AWS Glue jobs to load the metadata and update AWS Glue Data Catalog. See [\<u>Migration between the Hive\</u>](https://github.com/aws-samples/aws-glue-samples/tree/master/utilities/Hive_metastore_migration) [\<u>Metastore and the AWS Glue Data Catalog\</u>](https://github.com/aws-samples/aws-glue-samples/tree/master/utilities/Hive_metastore_migration) on GitHub document to learn more about those options:

#### Existing Hive Metastore to Amazon RDS

In this case, you are not leveraging an AWS Glue Data Catalog, instead, you are moving the Hive metastore data from an on-premises database to Amazon RDS. Depending on which database is currently being used to store the Hive metastore data, you need to take different steps to migrate them to the corresponding Amazon RDS instance. For example:

- MySQL on on-premises → MySQL on Amazon RDS or Amazon Aurora

- PostgreSQL on on-premises → PostgreSQL on Amazon RDS or Amazon Aurora

- Oracle on on-premises → Oracle on Amazon RDS

Here are few resources that cover how to migrate those databases to AWS:

- [\<u>Migrate On-Premises MySQL Data to Amazon RDS\</u>](https://aws.amazon.com/blogs/aws/migrate-mysql-data-to-amazon-rds-and-back/)

- [\<u>Importing Data into PostgreSQL on Amazon RDS\</u>](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Procedural.Importing.html)

- [\<u>Migrating Data from a PostgreSQL DB Instance to an Aurora PostgreSQL DB Cluster\</u>](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraPostgreSQL.Migrating.RDSPostgreSQL.Replica.html)

- [\<u>Migrating Data from a MySQL DB Instance to an Amazon Aurora MySQL DB Cluster\</u>](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraMySQL.Migrating.RDSMySQL.html)

## On-going Metastore Sync

This pattern is used mainly for large-scale migrations when you want to migrate an on-premises Hive metastore to AWS, but also want to keep running the Hive metastore in your data center as well as in the cloud during the migration phase. In that case, on-going sync is required so that both Hive metastores are up-to-date. For a given time, only one application should be used for updating the Hive metastore, otherwise the metastore will be out-of-sync.

![](/img/migration/image21.png)

> *Figure 28: Ongoing metastore sync*

[\<u>AWS Database Migration Service\</u>](https://aws.amazon.com/dms/) is a data migration service and can be used to create on-going replication. This blog post [\<u>Replicating Amazon EC2 or On-Premises SQL Server to Amazon RDS for SQL\</u>](https://aws.amazon.com/blogs/database/replicating-amazon-ec2-or-on-premises-sql-server-to-amazon-rds-for-sql-server/) [\<u>Server\</u>](https://aws.amazon.com/blogs/database/replicating-amazon-ec2-or-on-premises-sql-server-to-amazon-rds-for-sql-server/) discusses how to achieve ongoing replication for SQL Server, but the same method applies to other databases.
