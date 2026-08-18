---
sidebar_label: Migrating Apache Impala
---

# Migrating Apache Impala

If you are running Apache Impala and are looking to migrate it to Amazon EMR, we recommend that you use **Amazon Athena or Trino** (formerly PrestoSQL).

AWS now recommends Trino over PrestoDB for new deployments. Trino is the open-source successor to PrestoSQL and is actively maintained by the community and will receive new features and performant updates. Amazon Athena engine version 3 is built on Trino, providing the same performance foundation with a fully managed, serverless experience.

See the "[**Considerations for Presto**](bookmark://_Considerations_for_Amazon)" section earlier in this guide for detailed guidance on choosing between Amazon Athena and Trino/PrestoDB on Amazon EMR.

**If You Must Use Impala**

If you must use Impala due to a use case that is not covered by Trino or Athena, you have three options to install Impala:

1.  **Manually install Impala on Amazon EC2** instances and manage the infrastructure yourself.

2.  **Use a bootstrap action to install Impala on Amazon EMR** clusters during cluster launch.

3.  **Use a third-party cloud provider** that installs and manages Impala as a managed service.

**Important Support Limitation**

**Because Impala is not a managed application on Amazon EMR, AWS Support and Amazon EMR service teams are not able to support an Impala installation.** You will be responsible for troubleshooting, maintenance, upgrades, and operational support if you choose to run Impala on AWS infrastructure.

**SQL Compatibility Considerations**

Most Impala SQL queries are compatible with Trino and Athena with minimal modifications. Both Trino and Athena support ANSI SQL syntax, which Impala also follows. Key differences to be aware of during migration include:

| Impala SQL Feature | Trino/Athena Equivalent | Notes |
|----|----|----|
| INVALIDATE METADATA | Automatic (Glue) | Not required, Athena/Trino see Glue Catalog changes instantly. |
| REFRESH \[table\] | MSCK REPAIR TABLE | Use only to register new partitions added directly to S3 |
| COMPUTE STATS | ANALYZE | Essential for Trino’s Cost-Based Optimizer to handle large joins |
| UPSERT | MERGE | Requires Apache Iceberg or Delta Lake table formats on S3 |
| C++ UDFs (User Defined Functions) | Lambda/Java UDFs (Athena) or custom Trino UDFs | Requires rewriting in Java/Python |
| Impala-specific data types | ARRAY, MAP, ROW | Standardized in Trino; highly compatible with Impala’s nested types; Minor type mapping required |

For detailed SQL migration guidance, see:

- [Migrating from Hive to Trino](https://trino.io/docs/current/appendix/from-hive.html) (Impala SQL is similar to HiveQL)

- [Amazon Athena SQL Reference](https://docs.aws.amazon.com/athena/latest/ug/ddl-sql-reference.html)

**Migration Decision Framework**

Use the following framework to determine the best path forward:

| Your Requirement | Recommended Solution | Rationale |
|----|----|----|
| Serverless, fully managed SQL queries with minimal operational overhead | Amazon Athena | No infrastructure management, pay-per-query pricing, automatic scaling |
| Need custom configurations, fine-tuned performance, or features not in Athena | Trino on Amazon EMR | Full control over cluster configuration, custom connectors, dedicated resources |
| Require Impala-specific features with no Trino/Athena equivalent | Self-managed Impala on EC2 | Full compatibility but highest operational burden |
| Legacy applications with deep Impala dependencies | Third-party managed Impala service | Reduces operational burden while maintaining compatibility |

**Documentation References:**

- [Amazon Athena](https://aws.amazon.com/athena/)

- [Trino on Amazon EMR](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-trino.html)

- [PrestoDB on Amazon EMR](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-presto.html)
