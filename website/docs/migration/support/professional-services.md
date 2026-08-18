---
sidebar_label: AWS Professional Services
---

# AWS Professional Services

AWS Professional Services provides a global specialty practice to support focused areas of enterprise cloud computing. Specialty practices deliver targeted guidance through best practices, frameworks, tools, and services across solution, technology, and industry subject areas. Their deep expertise helps you take advantage of business and technical benefits available in the AWS Cloud.

Specific to Amazon EMR, the domain expertise of the Data Analytics practice helps organizations derive more value from their data assets using AWS services. For Hadoop migrations, AWS Professional Services has a prescriptive and proven methodology that includes an alignment phase and a launch phase, described in the following sections.

## Hadoop Migration Alignment to Amazon EMR and Amazon S3 Data Lake

AWS Professional Services partners with you to learn and document your current state environment and the desired future state outcomes. Although the scope of this phase is mutually confirmed, the following activities are typically covered during the Hadoop migration alignment phase:

**Business understanding:** Confirm business drivers, success metrics, and internal SLA targets.

**Data prioritization:** Use business drivers and technical considerations as prioritization criteria for the defined scope.

**Data assessment:** Assess end-to-end data flow architecture to recommend a future state environment inclusive of source and target destinations, file formats, and table format strategy (Apache Iceberg, Hudi, or Delta Lake).

**Technical understanding:** Deconstruct Hadoop workloads to determine a migration path to Amazon EMR.

**Hands-on labs:** Application mapping exercises (e.g., Impala to Trino, Hive to Spark SQL) and use case validation (e.g., data science notebooks on SageMaker Unified Studio).

**Security deep dive:** Assess current Ranger/Sentry/Kerberos/LDAP configurations and design the target security architecture using Lake Formation, IAM Identity Center, and EMR security configurations.

**Data Catalog strategy:** Evaluate migration from Hive Metastore to AWS Glue Data Catalog, including schema compatibility, partition handling, and table format considerations.

**EMR service pricing exercise:** What-if analysis comparing deployment options (EMR on EC2, EMR on EKS, EMR Serverless) against current on-premises costs.

**Detailed work plan:** Migration roadmap with phasing, resource requirements, and risk mitigation.

Given the dependency Amazon EMR has with Amazon S3, the second section of the alignment phase focuses on the S3 data lake:

**Lake Formation architecture:** Future-proofing the architecture with fine-grained access control, cross-account sharing, and serverless query capabilities via Amazon Athena and Amazon Redshift Serverless.

**Data ingestion architecture:** Recommendations for batch and streaming ingestion patterns.

**Data storage architecture:** S3 bucket strategy, lifecycle policies, storage class tiering, and encryption standards.

**Data Catalog approach:** AWS Glue Data Catalog configuration, database/table organization, and metadata governance.

**Data serving layer:** Recommendations for downstream application access, including BI tools, Redshift Serverless, and Athena.

**Compute-storage decoupling:** Architecture patterns for cost-optimized, elastic processing with EMR reading/writing directly to S3.

**Alignment phase outcomes:**

Identification of up to five priority use cases for initial migration

Closure Architecture document aligning requirements to architectural design

Detailed migration path for execution of the EMR Launch work

AWS Services cost estimate (platform spend)

Recommendations on selecting the right deployment option per workload

S3 bucket strategy built on AWS for defined workloads

## Amazon EMR Launch

During the Amazon EMR Launch implementation, the AWS Professional Services team delivers an Amazon EMR platform foundation architecture that enables Hadoop workloads to execute with compute decoupled from storage on an Amazon S3 data lake using infrastructure as code. The team helps in the following areas:

Deploying Amazon EMR using AWS CloudFormation or AWS CDK templates.

Guidance in designing and implementing data security requirements on Amazon EMR (Lake Formation, IAM, encryption).

Ensuring EMR can access defined S3 buckets with appropriate IAM roles and policies.

Setting up IAM roles, security groups, and identity federation using infrastructure as code.

Setting up AWS Glue Data Catalog as the external Apache Hive Metastore for Amazon EMR.

Setting up Amazon EMR cluster configurations and performing tuning for priority workloads.

Validating data quality and functional equivalence between on-premises and EMR outputs.

**Launch phase outcomes:**

A defined workload automated and tuned on EMR

Automated EMR infrastructure as code to support transient clusters and end-user access for development and research

Documented performance and testing results

Refined AWS Services cost estimate (platform spend)

Runbook for ongoing operations and incident response

For more information on work effort, timeline, and cost, contact your AWS account team or reach out to AWS Professional Services leadership at aws-proserv-data-analytics-leads@amazon.com.
