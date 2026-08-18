---
sidebar_label: "EMR on EC2: Multi-Tenancy Models"
---

# EMR on EC2: Multi-Tenancy Models

Amazon EMR provides a comprehensive set of features to build highly secure multitenant big data processing environments. Multitenancy enables organizations to share infrastructure across teams, business units, or external tenants while maintaining strict isolation of data, resources, and user access.

With the evolution of Amazon EMR across three deployment models — EMR on EC2, EMR on EKS, and EMR Serverless — organizations now have multiple architectural options for implementing multi-tenancy, each with unique characteristics for isolation, cost management, and operational overhead.

This chapter discusses steps to implement multitenancy on Amazon EMR across all deployment models, along with key dimensions such as user, data, and resource isolation, followed by recommended best practices.

*Note: For operational cluster topology decisions (instance types, lifecycle segmentation, cost allocation), see the Amazon EMR Cluster Segmentation Schemes chapter.*

## Key Challenges of Multitenancy

Regardless of deployment model, multitenancy presents common challenges:

- Implementing isolation at all pipeline stages requires understanding the nuances of each deployment model's processes and tools.

- Metering tenant resource usage is difficult when tenants share metadata and compute resources.

- Scalability challenges arise when onboarding new tenants.

- Applying robust security controls across authentication, authorization, and resource management can be a daunting task.

There are three different conceptual models for isolating users, data, and resources when building multitenant analytics on Amazon EMR on EC2.

- Silo Mode

- Shared Mode

- Hybrid Mode
