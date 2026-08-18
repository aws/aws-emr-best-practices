---
sidebar_label: General Best Practices
---

# General Best Practices for Operational Excellence

The following practices represent operational guidance that applies across all EMR deployment options and workload types. Each practice is organized by operational domain to help teams prioritize based on their migration maturity.

## Infrastructure as Code

### Define all clusters and infrastructure as code

Use infrastructure as code (IaC) to define, version, and deploy your EMR environments reproducibly. This eliminates configuration drift, enables peer review of infrastructure changes, and supports rapid disaster recovery.

| **Tool** | **Best For** | **EMR Support** |
|----|----|----|
| AWS CDK | Teams wanting type-safe, programmatic definitions with constructs | Full EMR construct library (L2 constructs for clusters, steps, security configs) |
| Terraform | Multi-cloud teams or those with existing Terraform investment | HashiCorp AWS provider covers EMR on EC2, EKS, and Serverless |
| AWS CloudFormation | Teams preferring declarative YAML/JSON templates | Native AWS support with all EMR resource types |
| EMR CLI / SDK | Rapid prototyping and one-off clusters | Full API coverage for all deployment options |

**Key practices:**

Store all IaC templates in version control alongside application code.

Use parameterized templates with environment-specific configuration (dev, staging, prod) rather than separate templates per environment.

Include EMR security configurations, IAM roles, and VPC resources in the same IaC stack for consistent deployment.

Implement drift detection to catch manual changes made outside IaC.

### Implement CI/CD pipelines for EMR workloads

Treat EMR job deployments with the same rigor as application deployments. A CI/CD pipeline for EMR workloads typically includes:

**Source stage:** Code commit triggers pipeline (Git push, PR merge).

**Build stage:** Compile JARs/packages, run unit tests, lint PySpark code.

**Test stage:** Deploy a transient EMR cluster, run integration tests against sample datasets, validate output quality.

**Deploy stage:** Update Step Functions workflows, Airflow DAGs, or EMR step definitions in production.

**Validate stage:** Run smoke tests on production cluster, compare output checksums against baseline.

**Recommended tools:** AWS CodePipeline, AWS Step Functions, Apache Airflow (MWAA), or Jenkins with the EMR plugin. For Spark-specific testing, use frameworks like pytest with spark-testing-base or Great Expectations for data quality assertions.

## Cluster Lifecycle and Scaling

### Prefer transient clusters where possible

Transient clusters — started on demand, run workloads, and terminate upon completion — eliminate idle cost, launch with fresh configurations (removing patching complexity), and isolate failures. Use transient clusters for scheduled batch ETL, periodic ML training, and ad hoc analytics. Reserve long-running clusters for interactive query engines (Trino, Hive LLAP), Apache HBase, and shared development environments.

For detailed guidance on cluster lifecycle configuration, see *Configuring cluster termination* in the EMR Management Guide.

### Use EMR Managed Scaling and instance fleets

EMR Managed Scaling automatically adjusts cluster capacity based on workload demand. Combine it with instance fleets (specifying 5–10 instance types per fleet) to maximize Spot availability and minimize cost.

**Migration-specific recommendation:** Start conservatively — set your MinimumCapacityUnits to match your on-premises baseline, then progressively lower it as you gain confidence in scaling behavior under your actual workload patterns.

For full configuration guidance, see *Using managed scaling* and *Configure instance fleets* in the EMR Management Guide.

## Compute Optimization

### Adopt Graviton instances for cost-performance improvement

AWS Graviton-based instances (m6g, m7g, c6g, r6g families) deliver up to 30% better price-performance compared to equivalent x86 instances for Apache Spark and Hadoop workloads on EMR.

**Recommended adoption path for migrations:**

**Phase 1:** Start with task nodes (lowest risk — no persistent data, easy to roll back).

**Phase 2:** Validate performance parity with representative workloads against your x86 baseline.

**Phase 3:** Extend to core nodes once task-node validation passes.

**Phase 4:** Use instance fleets with a mix of Graviton and x86 instance types for flexibility.

**Compatibility note:** Graviton instances use ARM architecture. Validate that custom native libraries (JNI, shared objects) have ARM builds. Pure Java, Scala, and PySpark workloads require no code changes.

For supported Graviton instance types on EMR and performance benchmarks, see *Amazon EMR supported instance types* (https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-supported-instance-types.html) and the AWS Big Data Blog post *Run Apache Spark 3.x workloads with up to 27% better price-performance using Amazon EMR on Graviton instances* (https://aws.amazon.com/blogs/big-data/run-apache-spark-workloads-3x-faster-with-amazon-emr-6-x-on-graviton2/).

## Tagging and Cost Allocation

### Implement a consistent tagging strategy

Tags enable cost attribution, access control, and operational automation. Apply these tags to all EMR clusters, EBS volumes, and associated resources:

| **Tag Key** | **Purpose** | **Example Values** |
|----|----|----|
| Environment | Deployment stage | production, staging, development |
| Team | Owning team for cost allocation | data-engineering, data-science, analytics |
| Project | Business project or initiative | customer-360, fraud-detection |
| CostCenter | Finance cost center code | CC-4521 |
| Workload | Workload name for operational tracking | daily-etl, ml-training, ad-hoc-query |
| ManagedBy | IaC tool that created the resource | cdk, terraform, manual |

**Enforcement:** Use AWS Service Control Policies (SCPs) or tag policies to require mandatory tags at cluster creation time. Configure AWS Cost Explorer to group by team/project tags and set up AWS Budgets alerts for cost anomalies.

For comprehensive tagging guidance, see *Best Practices for Tagging AWS Resources* (https://docs.aws.amazon.com/whitepapers/latest/tagging-best-practices/tagging-best-practices.html). For EMR-specific cost allocation with tags, see *Tag and categorize Amazon EMR cluster resources* (https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-tags.html).

## Development Workflows

### Use SageMaker Unified Studio (recommended) or EMR Studio for interactive development

For development and testing, use SageMaker Unified Studio (recommended) — a unified environment for SQL, Spark, and ML with Lake Formation governance — or EMR Studio (managed Jupyter notebooks connected to EMR clusters or EMR Serverless). Both eliminate the need for SSH access to cluster nodes and support Trusted Identity Propagation for per-user access control. See the Phase 5 advisory in the Security chapter for guidance on when each IDE is appropriate.

**Best practice:** Use Studio environments for development and testing; deploy validated code through CI/CD pipelines to production clusters. Do not run production workloads directly from notebooks.

For setup instructions, see the SageMaker Unified Studio User Guide (https://docs.aws.amazon.com/sagemaker-unified-studio/latest/userguide/) or the EMR Studio User Guide (https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-studio.html).

## Incident Response and Runbooks

### Maintain operational runbooks for common scenarios

Document standard operating procedures for scenarios your team will encounter:

| **Scenario** | **Runbook Contents** |
|----|----|
| Cluster launch failure | Check IAM roles, subnet capacity, instance availability, security group rules, bootstrap script logs |
| Job failure / stuck job | Check YARN application logs, driver stderr, executor OOM patterns, shuffle failures |
| Spot Instance interruption | Verify instance fleet diversity, check Managed Scaling recovery, validate job retry configuration |
| Performance degradation | Check CloudWatch metrics for resource contention, review Spark UI for data skew, validate S3 throttling |
| Storage capacity alert | Review HDFS utilization (if used), check EBS volume capacity, validate S3 lifecycle policies |
| Security incident | Isolate cluster (security group lockdown), preserve logs to S3, review CloudTrail for unauthorized access |

**Automation:** Use AWS Systems Manager runbooks or Step Functions to automate diagnostic and remediation steps for common scenarios, reducing mean time to recovery (MTTR).

### Configure alerting for critical operational events

Set up proactive alerting so issues are detected before users are impacted:

**Cluster health:** IsIdle (indicates abandoned cluster), MRUnhealthyNodes, HDFSUtilization \> 80%

**Job failures:** AppsFailed \> 0 within 5-minute window

**Capacity exhaustion:** YARNMemoryAvailablePercentage \< 15%, ContainerPending \> 10 for 5+ minutes

**Cost anomalies:** AWS Cost Anomaly Detection configured for EMR service spend

Use Amazon SNS topics for notifications to Slack, PagerDuty, or email based on severity.

For a complete list of EMR metrics available in CloudWatch, see *Monitoring Amazon EMR Metrics with CloudWatch* (https://docs.aws.amazon.com/emr/latest/ManagementGuide/UsingEMR_ViewingMetrics.html). For observability architecture patterns including Prometheus and Grafana integration, see the *EMR Observability* chapter in this guide.

## Multi-Account and Governance

### Consider a multi-account strategy for production isolation

For enterprise environments, separate EMR workloads across AWS accounts by environment or team:

**Production account:** Restricted access, change management gates, no interactive access.

**Development/staging account:** Broader access, experimentation allowed, cost-bounded with AWS Budgets.

**Shared services account:** Hosts the AWS Glue Data Catalog, Lake Formation permissions, and shared IAM Identity Center configuration.

Use AWS Organizations with Service Control Policies to enforce guardrails across all accounts. Share the data catalog across accounts using Lake Formation cross-account grants.

### Evaluate workload placement across deployment options

Not all workloads belong on the same EMR deployment option. Periodically review your workload portfolio:

**Move batch jobs to EMR Serverless** if they don't require custom cluster configurations, HBase, or specific Hadoop ecosystem components.

**Move containerized Spark jobs to EMR on EKS** if your organization already operates EKS and wants unified container management.

**Keep complex multi-framework workloads on EMR on EC2** where you need full control over cluster configuration, custom AMIs, or applications beyond Spark.

### Consider alternative services for specific workload patterns

Although Amazon EMR is flexible and provides the greatest amount of customization and control, there is an associated cost of managing and maintaining clusters. For specific workload patterns, purpose-built services may offer lower operational overhead:

**AWS Glue** — Serverless ETL with automatic scaling, ideal for straightforward Spark-based data integration without cluster management.

**Amazon Athena** — Serverless interactive SQL queries against S3 data, ideal for ad hoc analysis without provisioning compute.

**Amazon Redshift Serverless** — Serverless data warehouse for structured analytics workloads, ideal when SQL-centric teams need fast dashboarding.

Evaluate these alternatives for workloads that don't require the full flexibility of EMR — they eliminate cluster management entirely.
