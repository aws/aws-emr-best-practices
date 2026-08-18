---
sidebar_label: Migration Approaches
---

# Migration Approaches

Migrating from an on-premises Hadoop platform to Amazon EMR is a significant undertaking that benefits from deliberate planning. This chapter helps you make foundational decisions before any data moves: choosing a migration approach (lift-and-shift, re-platform, or re-architect), identifying which workloads to prototype first, assembling the right team, and establishing best practices that will guide the entire migration lifecycle.

## Migration Timeline Framework

Every migration is unique, but the following framework helps estimate effort and duration based on environment complexity. Use this as a planning starting point.

**Phase 1: Assessment & Planning (4–8 weeks)**

Inventory on-premises workloads, data volumes, and dependencies. Build TCO comparison and business case. Select 3–5 pilot workloads. Design target architecture. Establish success criteria and rollback plan.

**Phase 2: Foundation & Pilot (6–10 weeks)**

Set up AWS networking (VPC, Direct Connect). Configure EMR security (IAM, Lake Formation, encryption). Migrate pilot workloads end-to-end. Validate data integrity and performance. Document lessons learned.

**Phase 3: Bulk Migration (12–24 weeks)**

Migrate data in staged waves by priority and volume. Migrate workloads grouped by dependency and criticality. Run parallel validation (same inputs → compare outputs). Migrate orchestration (Oozie → Airflow). Train operations team.

**Phase 4: Optimization & Cutover (4–8 weeks)**

Performance tuning (right-sizing, Spot, caching). Cost optimization (storage tiering, instance selection). Final data synchronization and cutover. Decommission on-premises clusters.

**Effort estimation by environment size:**

| **Environment** | **Workloads** | **Data Volume** | **Duration** | **Team Size** |
|----|----|----|----|----|
| Small | \<50 jobs | \<10 TB | 3–6 months | 2–4 engineers |
| Medium | 50–200 jobs | 10–100 TB | 6–12 months | 4–8 engineers |
| Large | 200–500 jobs | 100 TB–1 PB | 9–18 months | 8–15 engineers |
| Very Large | 500+ jobs | \>1 PB | 12–24 months | 15+ engineers + ProServe |

When starting your journey migrating your big data platform to the cloud, you must first decide how to approach migration. One approach is to *re-architect* your platform to maximize the benefits of the cloud. The other approach is known as *lift and shift*, is to take your existing architecture and complete a straight migration to the cloud. A final option is a hybrid approach, where you blend a lift and shift with re-architecture. This decision is not straightforward as there are advantages and disadvantages of both approaches.

A lift and shift approach is usually simpler with less ambiguity and risk. Additionally, this approach is better when you are working against tight deadlines, such as when your lease is expiring for a data center. However, the disadvantage to a lift and shift is that it is not always the most cost effective, and the existing architecture may not readily map to a solution in the cloud.

A re-architecture unlocks many advantages, including optimization of costs and efficiencies. With re-architecture, you move to the latest and greatest software, have better integration with native cloud tools, and lower operational burden by leveraging native cloud products and services.

This paper provides advantages and disadvantages of each migration approach from the perspective of the Apache Hadoop ecosystem. For a general resource on deciding which approach is ideal for your workflow, see [An E-Book of Cloud Best Practices for Your Enterprise](https://aws.amazon.com/blogs/enterprise-strategy/an-e-book-of-cloud-best-practices-for-your-enterprise/)\<u>,\</u> which outlines the best practices for performing migrations to the cloud at a higher level.

#### Re-Architecting

Re-architecting your platform is the ideal approach when your primary goal is to maximize the long-term benefits of the cloud. While this approach requires a significant upfront investment—spanning research, planning, experimentation, education, implementation, and deployment—it consistently delivers the highest rate of return through reduced hardware and storage costs, lower operational overhead, and greater flexibility to meet evolving business needs.

###### Benefits of Re-Architecture

- **Independent Scaling -** Decoupled storage and compute resources allow each layer to scale independently, improving both performance and cost efficiency.

- **Access to Latest Software -** Migrating to modern frameworks and tools increases team productivity and unlocks the latest performance improvements and features.

- **Faster Experimentation -** On-demand resource provisioning enables rapid prototyping and iteration without lengthy lead times.

- **Flexible Scaling Options -** Scale vertically by upgrading to more powerful instance types, or horizontally by adding additional nodes to meet workload demands.

- **Reduced Operational Burden -** Cloud-managed services handle time-consuming cluster lifecycle tasks such as node replacement, software upgrades, and patching. Clusters can be treated as transient resources—provisioned when needed and decommissioned when the job is complete—eliminating the overhead of managing persistent infrastructure.

- **Enhanced Data Accessibility -** A data lake architecture centralizes data storage on a system accessible to a wide variety of services and tools. Storing data on Amazon S3 enables integration with services such as AWS Glue and Amazon Athena, significantly reducing operational burden and costs while supporting diverse use cases across your organization.

- **Transient Compute Resources -** Compute instances can be provisioned on demand and released when no longer needed, ensuring you only pay for what you actively use.

###### Best Practices for Re-architecting

- **Leverage this guide**- Review the reference architectures and migration approaches documented throughout this guide to understand how others have successfully migrated their Hadoop workloads to Amazon EMR.

- **Engage AWS early**- Reach out to your AWS representative at the start of your project to develop a roadmap tailored to your specific use case, architecture requirements, and business goals.

#### Lift and Shift

> A lift and shift migration moves your existing applications from on-premises infrastructure to the cloud with minimal modification. This approach prioritizes speed and simplicity, making it the preferred strategy when time is critical, deadlines are firm, or ambiguity must be minimized—such as when a data center lease or software license is expiring.

###### Benefits of Lift and Shift

- **Fewer Changes Required** – The goal is to replicate your existing environment in the cloud as closely as possible, limiting changes to only those necessary to make applications function on cloud infrastructure.

- **Lower Risk** – Fewer changes mean fewer unknowns and a reduced likelihood of unexpected issues arising during migration.

- **Faster Time to Market** – A smaller change footprint reduces the training and ramp-up time required for your engineering team, accelerating the overall migration timeline.

### Trade-offs to Consider

> While lift and shift offers speed and simplicity, it is important to recognize its limitations. Your existing on-premises architecture may not map cleanly to cloud equivalents, and without redesigning for the cloud, you may not fully realize the cost and operational efficiencies the cloud has to offer.

###### Best Practices for Lift and Shift

- **Use Amazon S3 for Storage Instead of HDFS -** Storing data on Amazon S3 rather than HDFS can significantly reduce storage costs—in some cases by up to three times. HDFS requires data to be replicated at least twice, which drives up storage requirements on disk-based EC2 instances or large EBS volumes. Amazon S3 eliminates this overhead and allows you to scale compute independent of storage. See \<u>Using Amazon S3\</u> \<u>as the Central Data Repository\</u> for a detailed guide.

- **Research Application Version Changes -** Amazon EMR bundles multiple application versions into a single Amazon Machine Image (AMI). If you select a newer version of an application, carefully review the changes made between versions and check for known issues. Upgrading open-source applications to newer versions can occasionally introduce unexpected bugs.

- **Review and Tune Cluster Configuration Defaults -** Amazon EMR clusters are configured with defaults based on the instance types selected. While these defaults are suitable for most workloads, some jobs may require overrides. See [Task Configuration](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-hadoop-task-config.html) for default values at the Hadoop task level and [Spark Defaults Set by](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-spark-configure.html#spark-defaults) [Amazon EMR](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-spark-configure.html#spark-defaults) for Apache Spark defaults.

- **Validate Your Resource Scheduler.** Amazon EMR uses the Apache Hadoop Capacity Scheduler by default. Confirm that this scheduler is compatible with the workloads you are migrating before proceeding.

#### Hybrid Architecture

Hybrid architectures leverage aspects of both lift and shift and re-architecting approaches. For existing applications, a lift and shift approach is employed for a quick migration. Any new applications then can use re-architected architecture. This hybrid approach includes the benefit of being able to experiment and gain experience with cloud technologies and paradigms before moving to the cloud.
