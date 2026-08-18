---
sidebar_label: Overview
---

# Overview

Organizations across the globe are increasingly recognizing the transformative potential of big data processing frameworks, such as Apache Spark, alongside modern Artificial Intelligence and Machine Learning tools. However, deploying and managing these technologies within on-premises data lake environments presents a unique set of challenges. With the big data industry evolving rapidly and the vendor landscape in constant flux, the need for a reliable, future-proof platform has never been greater. Modern data analytics platforms must also meet the growing demand for integrated AI and ML capabilities, empowering businesses to unlock deeper insights, drive intelligent automation, and maintain a competitive edge. Ultimately, organizations must make strategic technology decisions that stand the test of time and position them to fully harness the power of data-driven innovation.

Common problems include a lack of agility, excessive costs, and administrative headaches, as IT organizations wrestle with the effort of provisioning resources, handling uneven workloads at large scale, and keeping up with the pace of rapidly changing, community-driven, open-source software innovation. Many big data initiatives suffer from the delay and burden of evaluating, selecting, purchasing, receiving, deploying, integrating, provisioning, patching, maintaining, upgrading, and supporting the underlying hardware and software infrastructure.

A subtler, if equally critical, problem is the way companies’ data center deployments of Apache Hadoop and Apache Spark directly tie together the compute and storage resources in the same servers, creating an inflexible model where they must scale in lock step. This means that almost any on-premises environment pays for high amounts of under-used disk capacity, processing power, or system memory, as each workload has different requirements for these components.

How can businesses find success with Data Analytics, Machine Learning, and AI initiatives?

Migrating big data, machine learning, and AI workload to cloud offers many advantages. Cloud infrastructure service providers, such as Amazon Web Services (AWS), offer a broad choice of on-demand and elastic compute resources, resilient and inexpensive persistent storage, and managed services that provide up-to-date, familiar environments to develop and operate big data applications. Data engineers, developers, data scientists, and IT personnel can focus their efforts on preparing data and extracting valuable insights.

Services like Amazon EMR, AWS Glue, and Amazon S3 enable you to decouple and scale your compute and storage independently, while providing an integrated, well-managed, highly resilient environment, immediately reducing so many of the problems of on-premises approaches. This approach leads to faster, more agile, easier to use, and more cost-efficient big data and data lake initiatives.

However, the conventional wisdom of traditional on-premises Apache Hadoop and Apache Spark isn’t always the best strategy in cloud-based deployments. A simple lift and shift approach to running cluster nodes in the cloud is conceptually easy but suboptimal in practice. Different design decisions go a long way towards maximizing your gains as you migrate big data to a cloud architecture.

This guide provides the best practices for:

- Migrating data, applications, and catalogs

- Using persistent and transient resources

- Configuring security policies, access controls, and audit logs

- Estimating and minimizing costs, while maximizing value

- Leveraging the AWS Cloud for high availability (HA) and disaster recovery (DR)

- Automating common administrative tasks

Although not intended as a replacement for professional services, this guide covers a wide range of common questions and scenarios as you migrate your big data, machine learning and AI workloads to the cloud.

## Hadoop Ecosystem to AWS Service Mapping

The following reference maps on-premises Hadoop components to their AWS equivalents. Each component is covered in detail in the relevant chapter.

| **On-Premises Component** | **AWS Equivalent** | **Notes** |
|---|---|---|
| **COMPUTE & RESOURCE MANAGEMENT** |  |  |
| HDFS (storage) | Amazon S3 + S3 Tables | Decouple storage from compute |
| YARN (resource manager) | EMR Managed Scaling / EKS | Automatic scaling replaces manual capacity planning |
| MapReduce | Apache Spark on EMR | Rewrite for 10-100x performance |
| **SQL & QUERY ENGINES** |  |  |
| Apache Hive (batch SQL) | Hive on EMR / Amazon Athena | Athena for serverless; Hive for batch |
| Apache Impala | Trino on EMR / Amazon Athena | See Migrating Apache Impala section |
| Presto/Trino | Trino on EMR / Amazon Athena | EMR ships both PrestoDB and Trino |
| Apache HBase | HBase on EMR (S3 storage) | See HBase Workloads section |
| **DATA INGESTION** |  |  |
| Apache Sqoop | AWS Glue (JDBC) / AWS DMS | Sqoop deprecated — see Data Migration |
| Apache Flume | Kinesis Data Streams / MSK | Managed streaming ingestion |
| Apache Kafka | Amazon MSK | Fully managed, same Kafka APIs |
| Apache NiFi | MWAA + Glue / DataSync | Depends on use case |
| **ORCHESTRATION** |  |  |
| Apache Oozie | Amazon MWAA (Airflow) / Step Functions | Oozie deprecated |
| Apache ZooKeeper | Not needed | EMR manages coordination internally |
| **SECURITY** |  |  |
| Kerberos / Active Directory | IAM + IAM Identity Center | Trusted Identity Propagation (TIP) |
| Apache Ranger | AWS Lake Formation FGAC | Table/column/row-level permissions |
| Apache Knox (SSO) | IAM Identity Center + SageMaker Unified Studio | See Migrating to EMR TIP section |
| Cloudera Navigator | CloudTrail + S3 Access Logs | Full API-level audit trail |
| **METADATA & CATALOG** |  |  |
| Hive Metastore | AWS Glue Data Catalog | Serverless, auto-discovery |
| Apache Atlas | Glue Data Catalog + Lake Formation | Governance + lineage |
| **MONITORING & OPERATIONS** |  |  |
| Ganglia | CloudWatch + Prometheus/Grafana | See EMR Observability chapter |
| Cloudera Manager / Ambari | EMR Console + CloudWatch | EMR is managed — no admin UI needed |
| **TABLE FORMATS** |  |  |
| Raw Parquet/ORC on HDFS | Apache Iceberg on S3 | ACID, schema evolution, time travel |
| Apache Hudi | Hudi on EMR (or migrate to Iceberg) | Iceberg recommended for new workloads |

## Quick-Start: Find Your Migration Path

Use this guide to identify your recommended starting point based on your current environment:

**By source platform:**

- Cloudera (CDH/CDP) → Start with Security chapter (Kerberos → TIP, Ranger → Lake Formation), then Data Migration

- Hortonworks (HDP) / MapR → Start with Data Migration, then Cluster Segmentation (redesign monolithic clusters)

- Custom Apache Hadoop → Start with Gathering Requirements, then Starting Your Journey

**By primary workload:**

- Mostly Spark batch → Priority: Data Migration → Cost Estimation → Spark Agents (version upgrade)

- Mostly Hive/SQL analytics → Priority: Data Catalog Migration → Ad Hoc Query → Incremental Data Processing

- Streaming (Kafka/Flink) → Priority: Data Migration (Streaming) → Operational Excellence

- HBase → Priority: Ad Hoc Query (HBase section) → Data Migration

**By biggest concern:**

- 'Will my jobs still work?' → Spark Agents chapter (automated upgrade + testing)

- 'How do we secure this?' → Securing your Resources chapter

- 'What will it cost?' → Cost Estimation chapter

- 'How do we move petabytes?' → Data Migration chapter

- 'How long will it take?' → Migration Timeline Framework (Starting Your Journey)
