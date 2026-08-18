---
sidebar_label: Shared Mode
---

# Shared Mode

In shared mode, tenants share the Amazon EMR cluster with tools installed for processing, analyzing, and data science — all in one cluster. Datasets are stored in the tenant's S3 bucket or the tenant's HDFS folder on the cluster. The Hive metastore can be on the cluster or externally on Amazon RDS or AWS Glue Data Catalog. In many organizations, this shared scenario is more common. Sharing clusters between organizations is a cost-effective way of running large Hadoop installations since it enables them to derive the benefits of economies of scale without creating private clusters.

A large multi-node cluster with all the tools and frameworks installed can support a variety of users. In addition, this infrastructure can also be used by end users who can launch edge nodes to run their data science platforms. Even though it is cost effective, sharing a cluster can be a cause for concern because a tenant might monopolize resources and cause SLAs to be missed for other tenants.

![](/img/migration/image23.png)

> *Figure 30: Example shared mode scenario*

The following table lists the advantages and disadvantages of launching an Amazon EMR cluster in a shared mode.

> *Table 4: Advantages and disadvantages of using shared mode*

| **Advantage** | **Disadvantage** |
|----|----|
| Less operational burden as there is one cluster to maintain. | Hard to measure usage and resources when you have many tenants. |
| Can be cost effective if the cluster is well-utilized. | Configuring the YARN scheduler can be difficult and complex. |
|  | Cannot customize the cluster for individual workloads (instance type, volumes, etc.) for specific workload types. |
|  | One configuration to fit all use cases. Cluster configuration is immutable and teams must optimize applications rather than adjusting cluster configuration. |
|  | Software cannot be upgraded without upgrading all applications. |
|  | Large blast radius if something goes wrong with the cluster. |
