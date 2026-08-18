---
sidebar_label: Hybrid Mode
---

# Hybrid Mode

In hybrid mode, some tenants receive dedicated Amazon EMR resources (silo) while others share a common set of resources (pool), creating a hybrid multi-tenancy model. The decision on which tenants are siloed versus pooled is typically driven by tenant tier, regulatory requirements, data sensitivity, performance SLAs, and cost considerations. Data is stored in tenant-specific Amazon S3 prefixes or buckets, with a shared AWS Glue Data Catalog tables governed by AWS Lake Formation’s fine-grained access control (FGAC). The hybrid model allows organizations to balance the strong isolation guarantees of silo mode with the cost efficiency and operational simplicity of shared mode.

In hybrid mode, the infrastructure is logically divided into two tiers:

- **Premium tier (siloed):** Tenants with strict compliance requirements, high data sensitivity, or performance SLAs receive dedicated EMR clusters (EMR on EC2), dedicated virtual clusters with isolated node pools (EMR on EKS), or dedicated EMR Serverless applications.

- **Standard tier (Shared):** Tenants with moderate isolation requirements share a common EMR cluster (EMR on EC2), share a Kubernetes namespace with ResourceQuota constraints (EMR on EKS), or share an EMR Serverless application for per-user data access controls.

Both tiers share common governance infrastructure — including the AWS Glue Data Catalog, AWS Lake Formation permissions, IAM Identity Center for authentication, and centralized monitoring through Amazon CloudWatch — ensuring consistent security policies and audit capabilities across all tenants regardless of their isolation tier.

The hybrid multi-tenant architecture combines Siloed and Shared approaches into a single framework, organizing tenants into Premium and Standard tiers. Premium tenants receive dedicated EMR clusters (EC2, EKS, or Serverless) with isolated S3 buckets and tenant-specific KMS keys.

Standard tenants share EMR resources — YARN queues, Kubernetes namespaces, or shared Serverless applications — with data access governed by Lake Formation's row/column/cell-level filtering. Both tiers share common governance: AWS Glue Data Catalog as the central metastore, per-tenant IAM roles, and IAM Identity Center for authentication. The data flow starts with authentication, followed by tier resolution, after which requests route to either shared or dedicated resources. CloudWatch, CloudTrail, and Cost Explorer provide unified observability and per-tenant billing. This model suits tiered SaaS platforms, regulated industries, and managed service providers balancing cost efficiency with strict isolation.

The following diagram shows how two separate tenant groups that can have their own shared or siloed storage structure.

![](/img/migration/image24.png)

*Figure 31: Example Hybrid mode scenario*
