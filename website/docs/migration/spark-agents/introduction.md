---
sidebar_label: Spark Agents ✨
---

# Apache Spark Agents for EMR

# Spark Agents

When migrating Apache Spark and Hadoop workloads from on-premises environments to Amazon EMR, one of the most common and time-consuming steps is upgrading from the on-premises Spark version to the version supported on the target EMR release. Traditional Spark version upgrades require months of engineering effort to analyze API changes, resolve dependency conflicts, and validate functional correctness. AWS provides two AI-powered agents that address these challenges: the Spark Upgrade Agent automates code transformation, dependency updates, and data quality validation to compress upgrades from months to weeks, while the Spark Troubleshooting Agent analyzes Spark event logs, error messages, and resource usage to pinpoint root causes, reducing troubleshooting from hours to minutes.

## Overview of Apache Spark Agents for EMR

AWS offers two primary Spark agents designed specifically for migration scenarios:

### 1. Apache Spark Upgrade Agent

The **Spark Upgrade Agent** is a conversational AI capability that accelerates Apache Spark version upgrades for Amazon EMR applications. Traditional Spark upgrades require months of engineering effort to analyze API changes, resolve dependency conflicts, and validate functional correctness. This agent transforms upgrades from high-risk, resource-intensive projects into manageable workflows that fit within normal development cycles.

**Key Capabilities:**

- Converts complex upgrade processes that typically take months into weeks through automated code analysis and transformation

- Supports upgrades from Spark 2.4 to 4.x across PySpark and Scala applications

- Works with Amazon EMR on EC2 and EMR Serverless

- Compresses upgrade timelines from months to weeks through automated code analysis, dependency resolution, and validation. For more information, see .

- Maintains 100% semantic equivalence and data processing accuracy throughout the upgrade process

###  2. Apache Spark Troubleshooting Agent

The Spark Troubleshooting Agent streamlines the process of diagnosing Spark failures, saving data engineers and scientists significant time by analyzing workloads and providing actionable recommendations through natural language prompts.

**Key Capabilities:**

- Reduces troubleshooting time from hours to minutes

- Analyzes logs, metrics, and configurations across EMR on EC2 and EMR Serverless

- Provides specific code recommendations for PySpark applications

- Identifies root causes automatically without manual investigation

## Architecture and Deployment

Both agents are built on a modern, cloud-native architecture using the Model Context Protocol (MCP):

**Core Components**

- MCP Client Layer — User interaction through:

  - Kiro CLI or Kiro IDE (AWS AI-powered development environment — see https://kiro.dev) (customer's local environment)

  - SageMaker Unified Studio JupyterLab Spaces (AWS-managed compute)

  - Any MCP-compatible AI Assistant in your local development environment

- MCP Proxy for AWS (customer’s local environment) - Handles secure communication between your client and the MCP server with IAM role-based authentication

- **IAM Role and S3 Staging Bucket** (customer's AWS account) — CloudFormation-provisioned IAM role with permissions to call the MCP server and access EMR resources, plus an S3 bucket for staging upgrade artifacts

- Amazon SageMaker Unified Studio Managed MCP Server (preview) (AWS-managed) - Provides specialized Spark upgrade and troubleshooting tools for Amazon EMR

- Target Infrastructure (customer’s AWS account) - EMR on EC2 or EMR Serverless clusters where validation jobs execute

All actions are recorded in **AWS CloudTrail** for full auditability.

## Spark Upgrade Agent: How it fits in your migration 

When migrating from on-premises Spark (e.g., CDH or HDP running Spark 2.4) to Amazon EMR 7.x running Spark 3.5/4.x, the upgrade agent handles the end-to-end application upgrade in five stages: it analyzes your codebase and generates an upgrade plan, updates build configurations and dependencies, applies targeted code edits to resolve API incompatibilities, submits validation jobs to your target EMR cluster, and tracks progress throughout. The agent uses an error-driven approach — fixing one issue at a time based on actual compilation or runtime errors rather than applying bulk changes.

**What this means for your migration:**

- **You provide**: Your application code (cloned locally with Git), and a target EMR cluster or EMR Serverless application running the desired Spark version.

- **The agent handles**: Dependency updates, deprecated API replacements, build fixes, remote validation, and data quality comparison between source and target outputs.

- **You retain control**: All code changes are explained and shown before being applied. You approve each modification.

For the complete stage-by-stage workflow, see S[park Upgrade Agent Workflow In Details](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-spark-upgrade-agent-workflow-details.html).

## Spark Troubleshooting Agent: How It Fits in Your Migration 

During migration, Spark applications that ran successfully on-premises often fail on EMR due to differences in Spark versions, cluster configurations, resource allocation, or S3 access patterns versus HDFS. Traditional troubleshooting requires manually sifting through driver and executor logs, YARN container logs, and CloudWatch metrics across a distributed system — a process that can take hours or days.

The Troubleshooting Agent automates this by analyzing your failed Spark application's event logs, error messages, and resource usage to pinpoint the exact issue — whether it's an executor running out of memory, a configuration error, or a code bug. It then provides a clear root cause explanation and specific code recommendations to fix it.

**Common migration-specific scenarios where the agent helps:**

- **OOM failures after migration** — Your application fit in memory on-premises but fails on EMR due to different executor memory defaults or data distribution changes when reading from S3 instead of HDFS.

- **Performance degradation** — Jobs run slower on EMR than on-premises due to S3 access patterns, shuffle configuration differences, or suboptimal cluster sizing.

- **API behavior changes** — Upgraded Spark version changes query plan behavior, causing jobs to fail or produce unexpected results.

**What you need**: Access to your failed Spark application identifiers on a supported platform (EMR on EC2, EMR Serverless, or AWS Glue) with accessible logs and Spark History Server. The agent connects to EMR Persistent UI (for EMR on EC2) or Spark History Server (for EMR Serverless) to retrieve Spark event information.

For the complete workflow and supported platforms, see [Apache Spark Troubleshooting Agent Features and Capabilities](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/spark-troubleshooting-features.html).

## Data Quality Validation 

The upgrade agent can validate that your application produces equivalent results after upgrading Spark versions. You provide both a source and target EMR cluster ID; the agent runs your application on both and compares outputs for schema differences, statistical drifts, and row-count mismatches. Both clusters must be Amazon EMR clusters — the agent cannot connect to on-premises Spark environments. To validate during migration, first migrate your data to S3, then provision a source EMR cluster matching your current on-premises Spark version alongside your target EMR cluster. Data quality validation requires Spark 3.0+ on the source cluster and only tracks Spark write operations. For details, see Enable Data Quality Validation..

**Migration Best Practices**

**Pre-Migration Assessment**: Deploy the assessment dashboard to understand your EMR footprint, identify all Spark applications, document dependencies and custom UDFs, and review data sources.

**Version Support**: EMR on EC2 supports upgrades from EMR 5.20.0+ to EMR 7.12.0; EMR Serverless supports 6.6.0+ to 7.12.0.

**Upgrade Coverage**: Build configuration, source code (API compatibility), test code, dependencies, validation, and data quality checks.

**Cost and Benefits**

The Spark agents are available at no additional cost with Amazon EMR—you only pay for underlying resources during validation. Benefits include:

- **Time Savings**: Months → weeks; typical applications 8 hours → 30 minutes

- **Risk Reduction**: Automated validation, data quality checks, iterative error correction (up to 3 retries)

- **Operational Efficiency**: Natural language interface, full approval control, CloudTrail audit trail

## Integration with EMR Migration Strategy

The agents complement AWS's EMR Migration Acceleration Program, enabling compute/storage separation (S3 + EMR), increased agility, managed services, cost optimization (Spot instances), and performance improvements (EMR runtime 4.5x faster than Apache Spark 3.5). Complementary tools include AWS DMS, Amazon MSK, Step Functions, and MWAA.

## Real-World Migration Patterns

1.  **Lift-and-Shift with Modernization**: Assess → migrate → upgrade → optimize with EMR features

2.  **Gradual Migration**: Pilot non-critical workloads → validate → expand incrementally → decommission on-premises

3.  **Hybrid Approach**: Use EMR on AWS Outposts for on-premises presence, maintain consistent tooling, gradually shift to cloud

**Common Migration Issues**

The Troubleshooting Agent addresses: (1) **Job failures** - analyzes logs/configs, provides root cause analysis and code recommendations; (2) **Performance degradation** - identifies configuration issues, recommends EMR optimizations; (3) **Data inconsistencies** - validates schema compatibility, checks API behavior changes.

## Documentation and Next Steps

**Resources**:

- [Apache Spark Upgrade Agent Documentation](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/spark-upgrades.html)

- [Troubleshooting Agent Documentation](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/spark-troubleshoot.html)

- [MCP Proxy for AWS](https://github.com/aws/mcp-proxy-for-aws)

**Next Steps**:

1.  Deploy assessment dashboard

2.  Install Kiro powers in your IDE

3.  Start with a pilot application

4.  Validate thoroughly using data quality checks

5.  Scale gradually to additional applications

| **56%** |  |  | **3.5×** |  | **626%** |  |  | **99%** |  |  |  |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Year-one cost savings vs. on-premises Hadoop |  |  | Faster Spark workload performance |  | 5-year return on investment |  |  | Reduction in unplanned downtime |  |  |  |
| **Track** |  | **Migrate From** |  |  |  | **Migrate To** |  |  |  |  |  |
| Big Data / Analytics |  | Cloudera, Hortonworks, MapR, on-premises Hadoop/Spark |  |  |  | Amazon EMR — managed Hadoop, Spark, Hive, Presto |  |  |  |  |  |
| ETL / Data Integration |  | Informatica, Talend, Ab Initio, SSIS, DataStage |  |  |  | AWS Glue — serverless data integration service |  |  |  |  |  |
| Workflow Orchestration |  | Autosys, Control-M, Oozie, Airflow (self-managed) |  |  |  | Amazon MWAA — managed Apache Airflow |  |  |  |  |  |
| **Phase 1: Assess** |  |  |  | **Phase 2: Mobilize** |  |  | **Phase 3: Migrate & Modernize** |  |  |  |  |
| Workload discovery and profiling, TCO analysis, migration complexity scoring, and architecture recommendation. |  |  |  | Detailed migration plan, proof-of-concept migration, team enablement, and partner engagement. |  |  | Phased migration execution, performance optimization, cost right-sizing, and production cutover support. |  |  |  |  |
| **Step** | **Action** |  |  |  |  |  |  |  |  |  |  |
| 1 | Contact your AWS Account Manager or reach out at aws.amazon.com/contact-us |  |  |  |  |  |  |  |  |  |  |
| 2 | Request a Data Processing Modernization assessment for your environment |  |  |  |  |  |  |  |  |  |  |
| 3 | AWS will conduct workload discovery and deliver a TCO analysis with a migration roadmap |  |  |  |  |  |  |  |  |  |  |
| 4 | Upon approval, begin phased migration with AWS and partner support |  |  |  |  |  |  |  |  |  |  |
