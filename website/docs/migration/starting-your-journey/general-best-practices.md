---
sidebar_label: General Best Practices
---

# General Best Practices for Migration

## Common Migration Pitfalls

The following pitfalls are drawn from hundreds of real-world EMR migrations. Avoiding these early can save weeks of debugging and rework.

**1. Assuming S3 behaves like HDFS**

S3 is an object store, not a filesystem. Key differences: no atomic rename (use S3-optimized committers), no append (write new files), no real directories (prefix-based), and slower listing at scale (use Iceberg metadata). See the 'HDFS vs S3' section in Data Migration.

**2. Migrating everything at once**

Attempting to migrate all workloads simultaneously increases risk. Start with non-critical, well-understood workloads. Validate end-to-end before moving the next batch. Maintain parallel running during transition.

**3. Ignoring Spark version differences**

On-premises Spark 2.4 → the target EMR Spark version (3.5 or 4.x) introduces API deprecations, behavior changes, and dependency conflicts. Use the Spark Upgrade Agent to automate code migration (see dedicated chapter).

**4. Over-sizing clusters (lifting on-prem sizing to cloud)**

On-premises clusters are over-provisioned because scaling is slow. On EMR, start small and use Managed Scaling. A 200-node on-prem cluster often becomes a 20-node EMR cluster with auto-scaling.

**5. Not separating storage from compute**

Replicating HDFS-on-cluster patterns is the \#1 architectural mistake. Use S3 as primary storage from day one — enables independent scaling, cluster termination without data loss, and multi-engine access.

**6. Copying security patterns instead of adopting cloud-native**

Don't replicate Kerberos+Ranger+Knox. Adopt: IAM Identity Center + Trusted Identity Propagation (replaces Kerberos+Knox), Lake Formation FGAC (replaces Ranger), S3 Access Grants (fine-grained S3 permissions).

**7. Skipping data validation**

Always compare row counts, run checksum comparisons on critical tables, validate schema compatibility, and run regression tests with known outputs. Silent data corruption discovered months later is far more expensive to fix.

**8. Not planning for hybrid coexistence**

Migrations take months. Plan for: shared metastore access (or synchronized catalogs), network connectivity between environments, dual-write patterns, and gradual traffic shifting rather than big-bang cutover.

**9. Underestimating orchestration changes**

Oozie workflows don't translate 1:1 to Airflow DAGs. Scheduling, error handling, alerting, and dependency management work differently. Budget time for orchestration migration separately.

**10. Forgetting about cost governance from day one**

Without guardrails, cloud costs spike quickly. Tag all clusters with team/project, set billing alarms, use Managed Scaling max-capacity limits, and review Spot allocation weekly during initial migration.

Migrating big data and analytics workloads from on-premises to the cloud involves careful decision making. The following are general best practices to consider when migrating these workloads to Amazon EMR:

###### Use Amazon S3 as Your Central Data Repository

Amazon S3 is architected for high durability, high availability and supports lifecycle policies for tiered storage. For more details, see \<u>Using Amazon S3 as the Central Data Repository\</u>. Amazon S3 enables you to decouple compute from storage, allowing each to scale independently and reduce costs associated with HDFS replication. For more information, see \<u>Benefits of using Amazon S3.\</u>

Build your lake house or data lake architecture by centralizing all structured and unstructured data in Amazon S3. Amazon S3 supports a wide variety of analytics patterns from the same data store, including:

- Big data processing and ETL

- Real-time analytics

- Machine learning and AI

- Interactive querying via Athena, Redshift Spectrum, or EMR

###### Consider the Right AWS Service for Your Workload

> Amazon EMR provides the greatest flexibility and customization for big data workloads, but it comes with an associated operational cost of managing clusters, upgrades, and configurations. Before defaulting to Amazon EMR, evaluate whether a managed AWS service better fits your requirements—these services often carry a lower operational burden and, in some cases, lower overall costs. Consider the following alternatives based on your use case:

- **Amazon EMR Serverless** - Ideal for customers who want to run Spark and Hive workloads without managing cluster infrastructure. EMR Serverless automatically provisions, scales, and terminates resources based on workload demand, eliminating the need to right-size clusters or manage node lifecycles. Key advantages include:

  - No cluster management overhead - resources are provisioned and released automatically

  - Pay only for the compute and memory used during job execution

  - Scales instantly to handle variable workloads without manual intervention

  - Reduces time-to-value for teams looking to migrate quickly with minimal operational complexity

- **Amazon S3 Tables -** Using Amazon S3 as your central data repository is a foundational best practice for any EMR migration. S3 Tables extend this further by providing a fully managed, high-performance storage layer for tabular data built on Apache Iceberg. Key advantages include:

  - S3 Tables deliver up to 3x faster query performance and up to 10x higher transactions per second compared to self-managed Iceberg tables

  - Automatic table maintenance tasks such as compaction and snapshot management are handled natively, reducing operational burden

  - Enables a wide ecosystem of AWS services—including AWS Glue, Amazon Athena, and Amazon Redshift—to access and process the same data, maximizing flexibility across your analytics platform.

- **Amazon SageMaker Unified Studio (SMUS) -** For organizations migrating complex on-premises Hadoop environments that span data engineering, analytics, and machine learning workloads, SMUS provides a single, unified development environment that brings all of these capabilities together. Rather than managing separate tools and interfaces for different teams and use cases, SMUS consolidates them into one collaborative platform. Key advantages include:

  - **Unified experience across workload types –** Data engineers, analysts, and data scientists can work within a single environment, eliminating the context switching between disparate on-premises tools such as Hive editors, Jupyter notebooks, and BI platforms

  - **Native integration with AWS analytics services –** SMUS integrates directly with Amazon EMR, EMR Serverless, EMR on EKS, Amazon Athena, AWS Glue, and Amazon Redshift, allowing teams to run the right engine for each workload without leaving the environment

  - **Built-in data discovery and governance –** Powered by Amazon DataZone, SMUS provides a unified data catalog with built-in access controls and data lineage, replacing the need for separate on-premises metadata management tools

  - **Collaborative development –** Teams can share projects, notebooks, queries, and workflows in a governed environment, improving productivity and reducing duplication of effort

  - **Accelerated migration for ML workloads –** On-premises machine learning pipelines that relied on Spark MLlib or custom Hadoop-based workflows can be modernized and extended using SageMaker's native ML capabilities within the same environment

  - **Simplified access management –** A unified permission model means administrators manage access to data and compute resources in one place, rather than across multiple disconnected on-premises systems

- **Amazon Athena -** Serverless, interactive query service for analyzing data directly in S3 using standard SQL with no infrastructure to manage

- **AWS Glue** - Fully managed ETL service with a serverless Spark environment, ideal for data integration and transformation

- **Amazon Redshift -** Best suited for high-performance data warehousing and complex analytical queries at scale

###### Optimize Cluster Usage and Costs

> Analyze existing workloads and assign them to dedicated clusters based on usage patterns when using EMR on EC2. Separate workload types to improve efficiency and reduce costs:

- **Batch jobs** (ETL, aggregations, data cleansing, roll-ups, machine learning) → Use transient clusters that spin up for a job and terminate on completion

- **Interactive queries** (ad-hoc and one-time analysis) → Use long-running clusters sized for responsiveness

> Reduce compute costs by leveraging the right EC2 purchasing options:

- **Reserved Instances** – For predictable, baseline workloads

- **Spot Instances** – For variable or fault-tolerant workloads

###### Amazon EMR Managed Scaling 

> Use Amazon EMR Managed Scaling to automatically optimize cluster resources for performance and
>
> cost. With Managed Scaling enabled, Amazon EMR continuously monitors workload demand and
>
> automatically scales cluster capacity up and down by adding or removing core and task nodes—without
>
> requiring you to define scaling rules or thresholds manually. You simply set the minimum and maximum
>
> resource boundaries (in number of instances or vCPU units), and EMR handles the rest using internal
>
> workload metrics and optimization algorithms.
>
> Right-size your clusters by selecting the appropriate EC2 instance types, and node counts for
>
> each workload type. For more details, see \<u>Cost Estimation and Optimization\</u>.

###### Implement Automation and CI/CD Practices

> Implement Continuous Integration/Continuous Delivery (CI/CD) practices to enable experimentation and efficiency. Automating the provisioning of EMR clusters along with other resources like IAM roles and security groups is an operational excellence best practice. Apply the same engineering discipline to infrastructure that is typically used for application code. Check the infrastructure code into a code repository and build CI/CD pipelines to test the code. Implementing infrastructure as code also allows for the provisioning of EMR clusters in another Availability Zone or AWS Region should problems arise in the one currently being used. For more details, see \<u>Operational\</u> \<u>Excellence\</u>.

###### Prioritize Security and Compliance Early

Involve security and compliance engineers as early in the migration process as possible and make sure that the EMR environments are in line with the organization's security directives. Make full use of multiple security-related services, such as [AWS Identity and Access Management (IAM)](https://aws.amazon.com/iam/) , [AWS Key Management Service (KMS),](https://aws.amazon.com/kms/)features, such as Security Configurations within EMR. Amazon S3 also includes many security-related features. Make sure that all data is encrypted at-rest and in-transit. Finally, make sure that authentication and authorization are enabled as appropriate. For more details, see \<u>Securing your Resources on Amazon EMR\</u>.
