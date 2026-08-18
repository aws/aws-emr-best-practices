---
sidebar_label: Optimizing S3 Repository
---

# Optimizing an Amazon S3-Based Central Data Repository

By using Amazon S3 as the central repository for your data lake, you have already optimized the total cost of ownership (TCO) by decoupling storage and compute, and paying for compute based on the actual need and usage. AWS and Amazon S3 have several features that can optimize the storage footprint in your data lake to further reduce costs. By using columnar file formats, you can speed up your queries while reducing costs. In this section, we look at different optimizations you can make with your Amazon S3-based central data repository.

## Optimizing Storage Cost

Amazon S3 offers a range of storage classes designed for frequently accessed, infrequently accessed, and rarely accessed data. In addition, customers can use the Amazon S3 Glacier storage classes for long-term archive. Amazon S3 offers configurable lifecycle policies for managing your data throughout its lifecycle, and analytics tools such as S3 Storage Class Analysis and Amazon S3 Storage Lens to help you understand access patterns and optimize costs. The following sections cover options available in AWS for optimizing your storage cost by tiering your data across Amazon S3 storage classes.

## Amazon S3 Storage Classes

Amazon S3 Standard (S3 Standard) offers high durability, availability, and performance object storage for frequently accessed data. Because it delivers low latency and high throughput, S3 Standard is the right choice for storing data that is accessed frequently, such as big data analytics workloads, content distribution, and active data sets.

Amazon S3 Express One Zone (S3 Express One Zone) is a high-performance, single-Availability Zone storage class purpose-built to deliver consistent, single-digit millisecond data access for latency-sensitive applications. S3 Express One Zone delivers data access speeds up to 10x faster and request costs up to 50 percent lower than S3 Standard. Data is stored in directory buckets within a single Availability Zone that you choose, enabling you to co-locate storage with compute resources for optimal performance. S3 Express One Zone is ideal for machine learning training, interactive analytics, and media content creation workloads that require the lowest possible latency.

Amazon S3 Intelligent-Tiering (S3 Intelligent-Tiering) is designed to optimize storage costs by automatically moving data to the most cost-effective access tier when access patterns change. S3 Intelligent-Tiering is the only cloud storage class that delivers automatic cost savings by moving data on a granular object level between access tiers. There are no retrieval fees for S3 Intelligent-Tiering.

S3 Intelligent-Tiering automatically stores objects across three low-latency access tiers:

- Frequent Access tier — the default tier for newly uploaded objects; provides low latency and high throughput.

- Infrequent Access tier — objects not accessed for 30 consecutive days are moved here automatically, saving approximately 40% compared to the Frequent Access tier.

- Archive Instant Access tier — objects not accessed for 90 consecutive days are moved here automatically, saving approximately 68% compared to the Frequent Access tier while still delivering millisecond retrieval.

For data that can be accessed asynchronously, you can activate two optional archive tiers:

- Archive Access tier (optional) — automatically archives objects not accessed for a minimum of 90 consecutive days (configurable up to 730 days). Retrieval times range from 3–5 hours. Performance is equivalent to S3 Glacier Flexible Retrieval.

- Deep Archive Access tier (optional) — automatically archives objects not accessed for a minimum of 180 consecutive days (configurable up to 730 days). Standard retrieval occurs within 12 hours. Performance is equivalent to S3 Glacier Deep Archive.

S3 Intelligent-Tiering is the ideal storage class for long-lived data with access patterns that are unknown or unpredictable, such as data lakes where different datasets have varying access frequencies.

Note: Objects smaller than 128 KB are not monitored and are not eligible for automatic tiering — they are always stored in the Frequent Access tier with no monitoring charge. Only activate the Archive Access tier for 90 days if you want to bypass the Archive Instant Access tier; the Archive Instant Access tier delivers millisecond access, while the Archive Access tier offers slightly lower cost with minute-to-hour retrieval times.

Amazon S3 Standard-Infrequent Access (S3 Standard-IA) offers the high durability, high throughput, and low latency of S3 Standard, with a low per-GB storage price and per-GB retrieval fee. S3 Standard-IA is ideal for data that is accessed less frequently (approximately once a month) but requires rapid access when needed. It stores data redundantly across multiple Availability Zones.

Amazon S3 One Zone-Infrequent Access (S3 One Zone-IA) stores data in a single Availability Zone and offers a lower-cost option (20% less than S3 Standard-IA) for infrequently accessed data that does not require multi-AZ resilience. S3 One Zone-IA is ideal for storing backup copies, easily re-creatable data, or S3 Cross-Region Replication replicas.

## Amazon S3 Glacier Storage Classes

The Amazon S3 Glacier storage classes are purpose-built for data archiving, providing low-cost storage with retrieval flexibility. All S3 Glacier storage classes provide 99.999999999% (11 nines) durability and integrate directly with Amazon S3 lifecycle management.

Amazon S3 Glacier Instant Retrieval (S3 Glacier Instant Retrieval) delivers the lowest-cost storage for long-lived data that is rarely accessed (approximately once per quarter) and requires retrieval in milliseconds. It offers the same low latency and high throughput as S3 Standard and S3 Standard-IA, with storage costs up to 68% lower than S3 Standard-IA. S3 Glacier Instant Retrieval has a 90-day minimum storage duration and a 128 KB minimum billable object size.

Amazon S3 Glacier Flexible Retrieval (S3 Glacier Flexible Retrieval) is optimized for archive data that does not require immediate access but needs the flexibility to retrieve large sets of data at no additional cost. It offers free bulk retrievals (typically within 5–12 hours), expedited retrievals in 1–5 minutes, and standard retrievals in 3–5 hours. S3 Glacier Flexible Retrieval has a 90-day minimum storage duration.

Amazon S3 Glacier Deep Archive (S3 Glacier Deep Archive) is the lowest-cost storage class, designed for long-term retention of data that is accessed less than once per year. Standard retrieval time is within 12 hours, and bulk retrieval is within 48 hours. S3 Glacier Deep Archive has a 180-day minimum storage duration and is ideal for compliance archives, digital media preservation, and long-term backup retention.

Note: When using S3 Glacier storage classes, your objects remain in Amazon S3 and are managed through the S3 API. S3 Glacier Flexible Retrieval and S3 Glacier Deep Archive objects are archived and not available for real-time access — you must first restore them before you can access the data.

## Amazon S3 Lifecycle Management

Amazon S3 lifecycle management enables you to create data lifecycle rules that automatically transition data assets to lower-cost storage tiers or expire them when they are no longer needed. A lifecycle configuration comprises a set of rules with predefined actions that Amazon S3 performs on data assets during their lifetime. Each S3 bucket supports up to 1,000 lifecycle rules.

Lifecycle rules support filtering objects by:

- Prefix — target objects under a specific key prefix (e.g., logs/ or raw-data/)

- Object tags — target objects with specific tag key-value pairs

- Object size — target objects larger or smaller than a specified size using ObjectSizeGreaterThan and ObjectSizeLessThan filters

- Combinations — use AND logic to combine prefix, tags, and size filters for granular control

The supported transition waterfall allows you to move objects progressively to lower-cost tiers:

S3 Standard → S3 Intelligent-Tiering → S3 Standard-IA → S3 One Zone-IA → S3 Glacier Instant Retrieval → S3 Glacier Flexible Retrieval → S3 Glacier Deep Archive

Lifecycle configurations can also be combined with S3 object tagging to perform granular management of data assets — for example, tagging objects by data classification level and applying different retention policies to each classification.

## Amazon S3 Storage Class Analysis and Amazon S3 Storage Lens

One of the challenges of developing and configuring lifecycle rules for the data lake is gaining an understanding of how data assets are accessed over time. Amazon S3 provides two complementary analytics capabilities to help you optimize costs:

Amazon S3 Storage Class Analysis helps you understand how individual buckets or prefixes are accessed. It monitors access patterns and provides recommendations on when to transition data to a more cost-effective storage class. Storage Class Analysis is useful for developing lifecycle rules that optimize costs at the bucket or prefix level.

Amazon S3 Storage Lens provides organization-wide visibility into object storage usage and activity across hundreds or thousands of accounts. S3 Storage Lens offers 29+ usage and activity metrics with interactive dashboards, drill-downs at the organization, account, Region, bucket, and prefix levels, and contextual recommendations for cost optimization. S3 Storage Lens also includes performance metrics to help identify and resolve performance constraints. A free tier is available for all S3 accounts, with an advanced tier offering additional metrics and recommendations.

Note: We recommend using S3 Storage Lens for organization-wide visibility and trend analysis, and S3 Storage Class Analysis for bucket-level access pattern insights when developing lifecycle rules. Together, these tools help you make data-driven decisions about storage tiering without guesswork.

## Tiering Your Data Lake Storage

A data lake generally has raw data being ingested from many sources, which is then transformed and optimized for ad hoc querying and ongoing analysis. Many advanced uses, such as machine learning and artificial intelligence, consist of building data models and then training and refining these models using the raw historical data. In addition, by keeping the historical raw data, you can go back and reprocess historical data to provide new insights in the transformed data.

A recommended tiering strategy for a data lake includes:

- Active/hot data (frequently queried results, dashboards, ML features) — store in S3 Standard or S3 Express One Zone for lowest latency.

- Warm data (recent raw data, intermediate processing results) — use S3 Intelligent-Tiering to automatically optimize costs as access patterns change, or S3 Standard-IA for data with predictable infrequent access.

- Cold data (historical raw data, older transformed datasets) — transition to S3 Glacier Instant Retrieval for data that may still need millisecond access on occasion (e.g., quarterly reporting), or S3 Glacier Flexible Retrieval for data accessed less than once per year.

- Archive data (compliance records, long-term backups, digital preservation) — transition to S3 Glacier Deep Archive for the lowest storage cost.

For compliance and audit purposes, you can enforce immutability on data assets using Amazon S3 Object Lock, which provides write-once-read-many (WORM) protection directly on S3 buckets. S3 Object Lock supports two retention modes:

- Governance mode — prevents most users from deleting or overwriting an object version, but users with specific IAM permissions can modify the retention settings or delete the object.

- Compliance mode — no user, including the root account, can delete or overwrite a protected object version until the retention period expires.

S3 Object Lock can be enabled on both new and existing buckets, and provides an audit trail for protected assets using AWS CloudTrail. For data lakes with regulatory requirements (such as SEC 17a-4, HIPAA, or FINMA), S3 Object Lock in Compliance mode satisfies WORM storage mandates.

Note: Amazon S3 Glacier Vault Lock remains available for legacy architectures that store data directly in Glacier vaults. For new implementations, we recommend Amazon S3 Object Lock, which provides the same WORM guarantees while working natively with S3 storage classes and lifecycle policies. S3 Object Lock also integrates with AWS Backup Vault Lock for centralized backup protection.

| **Tool** | **Best For** |  | **EMR Support** |
|---|---|---|---|
| AWS CDK | Teams wanting type-safe, programmatic definitions with constructs |  | Full EMR construct library (L2 constructs for clusters, steps, security configs) |
| Terraform | Multi-cloud teams or those with existing Terraform investment |  | HashiCorp AWS provider covers EMR on EC2, EKS, and Serverless |
| AWS CloudFormation | Teams preferring declarative YAML/JSON templates |  | Native AWS support with all EMR resource types |
| EMR CLI / SDK | Rapid prototyping and one-off clusters |  | Full API coverage for all deployment options |
| **Tag Key** | **Purpose** |  | **Example Values** |
| Environment | Deployment stage |  | production, staging, development |
| Team | Owning team for cost allocation |  | data-engineering, data-science, analytics |
| Project | Business project or initiative |  | customer-360, fraud-detection |
| CostCenter | Finance cost center code |  | CC-4521 |
| Workload | Workload name for operational tracking |  | daily-etl, ml-training, ad-hoc-query |
| ManagedBy | IaC tool that created the resource |  | cdk, terraform, manual |
| **Scenario** |  | **Runbook Contents** |  |
| Cluster launch failure |  | Check IAM roles, subnet capacity, instance availability, security group rules, bootstrap script logs |  |
| Job failure / stuck job |  | Check YARN application logs, driver stderr, executor OOM patterns, shuffle failures |  |
| Spot Instance interruption |  | Verify instance fleet diversity, check Managed Scaling recovery, validate job retry configuration |  |
| Performance degradation |  | Check CloudWatch metrics for resource contention, review Spark UI for data skew, validate S3 throttling |  |
| Storage capacity alert |  | Review HDFS utilization (if used), check EBS volume capacity, validate S3 lifecycle policies |  |
| Security incident |  | Isolate cluster (security group lockdown), preserve logs to S3, review CloudTrail for unauthorized access |  |
