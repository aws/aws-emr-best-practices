---
sidebar_label: Presto Considerations
---

# Considerations for Amazon Athena, Trino and Presto

Many organizations migrating from on-premises Hadoop rely heavily on interactive, ad hoc query capabilities for data exploration, business intelligence, and operational analytics. This chapter covers how to replicate and improve those capabilities on AWS — including considerations for Amazon Athena (serverless SQL), Trino and Presto on EMR (distributed query engines), HBase workloads, and migrating from Apache Impala. The goal is to provide your analysts and data scientists with faster, more cost-effective interactive query experiences after migration.

[Amazon Athena](https://aws.amazon.com/athena/) is a serverless interactive query engine that executes SQL queries on data that rests in Amazon S3. Many customers use Athena for a wide variety of use cases, including interactive querying of data, exploring data, powering dashboards on top of operational metrics saved on Amazon S3, and powering visualization tools such as Amazon QuickSight or Tableau.

We strongly recommend that you consider Amazon Athena for these types of workloads. Athena is easy to integrate with, offers features such as cost management, workgroup-level controls, and fine-grained security controls, and requires little capacity planning. All of these characteristics lead to a lower operational burden and reduced costs.

**Trino Recommendation**: The Amazon [EMR documentation](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-presto.html) (EMR v6.4.0+) now recommends Trino (the open-source successor to PrestoSQL) over PrestoDB for new deployments. Presto (PrestoDB) is still available for use with Amazon EMR, but AWS recommends Trino going forward since this will receive feature and performance updates on EMR.

However, there are some use cases where PrestoDB or Trino on Amazon EMR may be better suited than Amazon Athena. For example, consider the following priorities:

- **Cost optimization**: If cost optimization is your primary goal, we recommend performing a quick proof-of-concept (POC) to estimate cost based on both approaches using representative workloads and query patterns. Run sample queries on both Presto/Trino on Amazon EMR and Amazon Athena to measure actual resource consumption and costs. You may find that certain load and query patterns are cheaper to run using Presto or Trino on Amazon EMR, while others benefit from Athena's serverless pricing model. Evaluate whether any cost increases outweigh the benefits of running and maintaining a cluster on EMR that can scale and provides fine-grained availability control, versus the features that Amazon Athena provides.

- **Performance requirements**: If your use case includes a high sensitivity to performance, choose to fine-tune a Trino or Presto cluster to meet the performance requirements. EMR clusters can be configured with dedicated hardware, custom memory allocations, and query-specific tuning options not available in a fully managed serverless service. Note that Amazon Athena Provisioned Capacity offers an alternative for predictable, high-performance workloads by providing dedicated processing capacity with consistent query performance, which may address some performance requirements without the operational overhead of managing EMR clusters. Evaluate whether Athena Provisioned Capacity meets your performance needs before committing to EMR cluster management.

- **Critical features**: If there are features that Amazon Athena does not currently provide (see [Athena feature comparison](https://docs.aws.amazon.com/athena/latest/ug/what-is.html) for current capabilities), such as the use of custom serializers/deserializers for custom data types, connectors to data stores other than those currently supported, or specific Trino/Presto SQL extensions, then running on EMR may be a better fit.

- **Data locality or hybrid requirements**: If your workload requires co-located compute and storage, involves non-S3 data sources, or demands strict latency SLAs that benefit from cluster tuning, running Trino or Presto on Amazon EMR provides more control over the execution environment.

For performance tips and best practices for Athena and Trino, see the following Performance Tuning Tips on the AWS Big Data Blog:

- [Best practices for Trino on Amazon EMR](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-trino-advanced.html)

- [Run Trino queries 2.7 times faster with Amazon EMR](https://aws.amazon.com/blogs/big-data/run-trino-queries-2-7-times-faster-with-amazon-emr-6-15-0/)

- [Optimize Athena performance](https://docs.aws.amazon.com/athena/latest/ug/performance-tuning.html)

Comparison at a glance:

| **Criteria** | **Amazon Athena** | **Trino / PrestoDB on EMR** |
|----|----|----|
| Infrastructure | Serverless, fully managed | Self-managed cluster on EMR |
| Cost Model | Pay per query (per TB scanned) | Pay per EC2 instance-hour; can use Spot |
| Scalability | Auto-scaling, no cluster management | Manual or auto-scaling, Instance Fleets |
| Performance Tuning | Limited; managed by AWS | Full configuration control |
| Custom Connectors | Athena federated query support | Full Trino/Presto connector ecosystem |
| Best For | Exploratory analytics, dashboards, low overhead | High-performance, complex workloads, custom tuning |

### Trino Migration from PrestoDB and Tuning

**Migration**

On Amazon EMR, PrestoDB and Trino both use the same command line executable (presto-cli) and share the same default web interface port (8889), which simplifies client-side migration. However, you cannot run PrestoDB and Trino simultaneously on the same cluster — create a new EMR cluster with Trino installed. The key changes to address are:

1.  Update EMR configuration classifications from presto-config and presto-connector-hive to trino-config and trino-connector-hive

2.  Update client JDBC connection URLs from jdbc:presto: to jdbc:trino:. During the transition, add protocol.v1.alternate-header-name=Presto to your Trino configuration to allow older Presto clients to continue connecting while you migrate them. This property is not available on EMR 7.x, so plan to update all clients before updating.

3.  Update any JMX-based monitoring references from presto to trino namespaces

4.  Review any custom connector configurations, as Trino's connector ecosystem has diverged from PrestoDB, and Validate your SQL queries and functions, as some functions and syntax have changed since the fork.

If you use AWS Glue Data Catalog as your Hive metastore, Trino supports it the same way PrestoDB does — no metastore migration is needed. Run your representative query workload on both engines in parallel before cutting over to confirm functional equivalence and comparable performance.

**Tuning**

On-premises Presto clusters are typically right-sized through tribal knowledge over time; EMR defaults may not match your workload. Focus tuning on three areas. Memory: set query.max-memory and query.max-memory-per-node based on your heaviest queries, and ensure JVM heap size exceeds the sum of query.max-memory-per-node and memory.heap-headroom-per-node. If memory-intensive queries that succeeded on-premises now fail, enable spill-to-disk (spill-enabled=true) as a safety net — but right-sizing memory is preferred, as spilled queries run slower. Data layout: queries against S3 benefit significantly from columnar formats (Parquet/ORC) with appropriate partitioning — re-evaluate partition keys if your on-premises data used HDFS with different partitioning strategies.

Instance selection and scaling. Use memory-optimized Graviton instances (r7g or r8g) for Trino coordinator and worker nodes, as Trino is memory-intensive by design. Use EMR managed scaling to handle variable query concurrency rather than over-provisioning a fixed cluster as you would on-premises. For the complete set of tuning parameters including dynamic filtering and table statistics, see [Best practices for Trino on Amazon EMR](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-trino-advanced.html) and [Run Trino queries 2.7x faster with Amazon EMR](https://aws.amazon.com/blogs/big-data/run-trino-queries-2-7-times-faster-with-amazon-emr-6-15-0/).

### Metadata Management

##### AWS Glue as a Data Catalog as the Hive Metastore

Starting with Amazon EMR release 5.10.0, Amazon EMR can use the AWS Glue Data Catalog as the default Hive metastore for Presto and Trino. When using AWS Glue Data Catalog with Presto or Trino on Amazon EMR, the authorization mechanism (such as Hive SQL authorization) is replaced with AWS IAM-based policies and AWS Glue resource policies. This centralization simplifies access governance across multiple services and query engines that share the same catalog.

You are also required to separately secure the underlying data in Amazon S3. You can secure this data by using an S3 bucket policy or an AWS IAM policy. You may find it more efficient to use IAM policies, as they allow you to centralize access control for both Amazon S3 and the AWS Glue Data Catalog from a single policy framework.

Key benefits when using AWS Glue Data Catalog with Presto or Trino on EMR:

1.  **Centralized schema registry**: All EMR applications (Spark, Hive, Presto, Trino) share a single consistent view of your data catalog.

2.  **Automatic schema discovery**: AWS Glue crawlers can automatically detect and register new datasets as they arrive in Amazon S3.

3.  **Cross-account access**: AWS Glue Data Catalog supports cross-account access via resource-based policies, enabling catalog sharing across your organization.

4.  **Reduced operational burden**: Eliminates the need to provision and maintain a separate Hive Metastore database (e.g., Amazon RDS MySQL or Aurora).

**Documentation:**

- [Using Presto with AWS Glue Data Catalog](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-presto-glue.html)

- [Easily manage table metadata for Presto running on Amazon EMR using the AWS Glue Data Catalog](https://aws.amazon.com/blogs/big-data/easily-manage-table-metadata-for-presto-running-on-amazon-emr-using-the-aws-glue-data-catalog/)

- [Configuring Trino on Amazon EMR](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-trino-config.html)

- [Launch an Amazon EMR cluster with Trino](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-trino-getting-started-launch.html)

- [Connect to the primary node for the Amazon EMR cluster and run queries](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-trino-getting-started-connect.html)

- [Using the AWS Glue Data Catalog as the metastore for Hive](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-hive-metastore-glue.html)

##### EMRFS, EMR S3A, and PrestoS3FileSystem Configuration

By default, Presto running on Amazon EMR release versions 5.12.0 through 7.9 uses EMRFS to access data on Amazon S3. Starting with EMR 7.10, all engines (including Presto/Trino) use EMR S3A as the default S3 connector. Presto running on earlier versions of EMR uses PrestoS3FileSystem, a component of the Hive connector. Accessing data via EMRFS allows you to configure Amazon S3 encryption requirements through an EMR Security Configuration and use separate IAM roles for fine-grained access control by user, group, or Amazon S3 location.

**Transition to EMR S3A**: Amazon EMR is transitioning from EMRFS to [EMR S3A as the default file system connector](https://aws.amazon.com/about-aws/whats-new/2025/08/amazon-emr-s3a-default-connector/) for Amazon S3 access, starting with EMR 7.10. EMR S3A achieves performance parity with EMRFS and delivers **up to 65% lower latency** than open-source S3A (OSS S3A) on read-heavy and mixed workloads. The transition is seamless: EMR automatically maps EMRFS configurations to S3A equivalents when S3A configurations are not explicitly set. For detailed guidance on migrating existing EMRFS configurations, see [Migration of Existing EMRFS Configurations to S3A Configurations](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-s3a-migrate.html).

For EMR release version 5.12.0 or later, you can still switch from EMRFS to PrestoS3FileSystem if needed. This approach may be beneficial if your organization continues to rely on Hive SQL-based authorization with an RDBMS-backed Hive metastore.

For S3 encryption configuration (SSE-S3, SSE-KMS, CSE-KMS/CSE-C) when using EMRFS or S3A with Presto/Trino, see the Encryption section in the Securing your Resources on Amazon EMR chapter.

## Additional Migration Considerations

### Iceberg Table Support Across Query Engines

If you are adopting Apache Iceberg as part of your migration (see the *Choosing a Table Format for Your Migration* section in the Incremental Data Processing chapter), ensure your ad hoc query engine supports it:

| **Engine** | **Iceberg Support** | **Migration Note** |
|----|----|----|
| Amazon Athena | Native — reads Iceberg tables registered in Glue Data Catalog | No cluster to manage. Ideal for ad hoc exploration of migrated Iceberg tables. |
| Trino on EMR | Native — via Iceberg connector and Glue Data Catalog | Full DML support (INSERT, UPDATE, DELETE, MERGE). Use for heavy interactive workloads. |
| PrestoDB on EMR | Limited — read-only Iceberg support | If migrating from Presto, switching to Trino is recommended for full Iceberg write support. |

All three engines support time travel queries, schema evolution, and hidden partition pruning on Iceberg tables — capabilities that were not available when querying plain Hive tables on-premises.

### Access Control: Lake Formation Replaces Ranger for Query Engines

On-premises, Apache Ranger (or Sentry) provided column and row-level access control for Presto, Hive, and Impala. On AWS, Lake Formation provides equivalent fine-grained access control for both Athena and Trino on EMR — centrally managed, cross-engine, and integrated with the Glue Data Catalog.

Note: EMR-hosted Trino does not support TIP directly. If you need TIP-based user-level access control for interactive SQL queries, use Amazon Athena (which uses Trino under the hood and supports TIP natively) rather than running Trino on an EMR cluster.

When migrating interactive query workloads, map your existing Ranger policies to Lake Formation permissions rather than deploying Ranger on EMR. See the *Securing Your Resources on Amazon EMR* chapter for detailed policy migration guidance.

### EMR Serverless for Ad Hoc Trino Workloads

For ad hoc query workloads with unpredictable usage patterns, consider Trino on EMR Serverless as an alternative to a persistent Trino cluster:

**Use EMR Serverless** when query volume is sporadic, you want zero idle cost, and sub-minute cold-start latency is acceptable.

**Use a persistent EMR Trino cluster** when you need consistent sub-second response times, BI tool connection pooling, or high-concurrency interactive sessions.

For detailed deployment guidance, see Using Trino on Amazon EMR Serverless.

### Querying On-Premises Data During Transition

During migration, you may need to query data that has not yet been moved to S3. Amazon Athena Federated Query provides JDBC connectors that can query on-premises databases, Hadoop clusters (via Hive connector), and other data sources directly from Athena — without migrating the data first. This enables a gradual migration where analysts use a single query engine (Athena) while data moves from on-premises to S3 in phases.

For federated query architecture patterns and recommended migration phasing, see the *Zero-ETL and Federated Query* section in the Data Migration chapter.
