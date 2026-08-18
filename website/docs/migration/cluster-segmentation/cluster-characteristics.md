---
sidebar_label: Cluster Characteristics
---

# Cluster Characteristics

> One of the main benefits of using Amazon EMR is that it makes it easy for you to start and terminate clusters. Starting and stopping clusters quickly gives you the flexibility that a single, long-running cluster cannot provide, and provides opportunities to save costs by leveraging Amazon EC2 Spot Instances.
>
> This section covers a few approaches to splitting a single, permanently running cluster into smaller clusters and identifies the benefits these practices bring to your environments. The approach you choose depends on your use case and existing workflows. AWS can work with you to help choose the strategy that meets your goals.

> You can approach the task of splitting up existing cluster from different perspectives, depending on the area or a set of characteristics that you want to tackle or address. The strategy you choose depends on the scenarios you have and the goals you want to achieve. The following cluster characteristics are typically considered.

## Instance Types and Cluster Sizes

> In your cluster environment, different established workflows may experience bottlenecks on different resources, such as the number of CPUs, memory size, network bandwidth, or network latency. With smaller, purpose-built clusters, you select instance types to match each workload's resource profile.
>
> **Best practice -** Use [Instance Fleets](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-instance-fleet.html) instead of Instance Groups. Instance Fleets let you specify multiple instance types per fleet with allocation strategies (capacity-optimized for Spot, lowest-price for On-Demand). This reduces the need to create separate clusters solely for different hardware requirements.
>
> Examples:

- Memory-optimized (r6i, r6g, r7g) for Spark ML, large shuffles, or in-memory caching

- Compute-optimized (c6i, c6g, c7g) for Trino/Presto query engines or CPU-intensive transformations

- Storage-optimized (i3, i4i, d3) for HBase or workloads requiring high local I/O

- GPU instances (p4d, g5) for distributed deep learning with Spark + GPU frameworks

- Graviton-based (m7g, r7g, c7g) for up to 40% better price-performance on general workloads

## Applications, Application Versions, and Configuration

> You can create different configurations and deploy different applications on different clusters, providing only those resources that users need. You can also create clusters that allow you to run blue-green testing during application version upgrades, and to test new EMR releases before promoting to production. [EMR Studio](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-studio.html) workspaces can attach to different clusters dynamically. This means you don't necessarily need to give each team their own cluster for interactive work instead a shared cluster with EMR Studio provides per-user notebook isolation while sharing compute.

## Security

> Security is often the primary driver for cluster segmentation. However, modern EMR capabilities provide fine-grained isolation within a cluster, reducing the need to segment purely for security.

## Modern Isolation Mechanisms (Reducing Segmentation Need)

| **Mechanism** | **What It Provides** | **Replaces** |
|---|---|---|
| Runtime Roles (EMR 6.x+) | Different IAM roles per job/step on the same cluster — each step runs with its own credentials | Separate clusters per IAM role |
| Lake Formation Fine-Grained Access Control | Table, column, row, and cell-level permissions per user/group — enforced within a shared cluster | Separate clusters per data access boundary |
| Trusted Identity Propagation (TIP) | Corporate identity (via IAM Identity Center) flows through to Spark sessions — no Kerberos manual setup required | Separate clusters per identity domain |
| S3 Access Grants | Prefix-level S3 access mapped to Identity Center users/groups | Separate clusters per S3 bucket access |

> Note: If you leverage Runtime Roles + Lake Formation FGAC + Trusted Identity Propagation, you can support multiple teams with different data access requirements on a single cluster eliminating several traditional segmentation drivers.
>
> **IAM Roles Specific to Each Cluster**
>
> Amazon EMR clusters are assigned an EC2 instance profile role that provides permissions to access AWS resources. You can assign different roles to your clusters so they have scoped access to resources such as Amazon S3 buckets, Amazon Kinesis Data Streams, or Amazon MSK topics.
>
> However, with Runtime Roles (available on EMR 6.x+), you can now assign different IAM roles at the step/job level on the same cluster. This means you don't need separate clusters purely for IAM isolation and you can achieve per-job credential scoping on a shared cluster.
>
> For more information, see [Configure runtime roles for Amazon EMR steps.](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-steps-runtime-roles.html)
>
> **Security Controls**
>
> Depending on the use cases a cluster serves, you can adjust the security posture:

- Interactive clusters (SageMaker Unified Studio (recommended) or EMR Studio notebooks) - Configure [Trusted Identity Propagation](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-trusted-identity-propagation.html) with IAM Identity Center. Enable IAM Identity Center integration for per-user workspace isolation and identity-aware query execution.

- Batch/ETL clusters - Step-level Runtime Roles provide workload isolation.

> For information on security controls available in Amazon EMR, see [Security in Amazon EMR](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-security.html) in the Amazon EMR Management Guide.
>
> **Network Controls**
>
> You can assign different clusters to different security groups or place them in different subnets that control access from specified network sources.
>
> **Disaster Recovery**
>
> Using more than one cluster provides redundancy to minimize impact if a single cluster goes down or is taken offline. The following examples are a couple use cases where having multiple clusters can help:

- A cluster becomes unhealthy due to a software bug, network issue, or other external dependencies being unavailable.

- A maintenance operation needs to occur such as a software upgrade, patching that requires a machine reboot, or bouncing of applications.

- **Cross-Region patterns** - For DR across Regions, replicate S3 data and AWS Glue Data Catalog metadata to a secondary Region with standby clusters.
