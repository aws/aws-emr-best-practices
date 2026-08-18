---
sidebar_label: Authentication
---

# Authentication

Authentication is the process of verifying the identity of a user, application, or service before granting access to resources. In Amazon EMR, authentication operates at two distinct levels:

- **Cluster administration with EMR APIs** Verifying the identity of users and roles that perform administrative operations (creating clusters, modifying configurations, terminating clusters) through the Amazon EMR public APIs.

- **Application and job Authentication** Verifying the identity of users, applications, and services that interact with the open-source frameworks running on the cluster (submitting Spark or Hive queries, accessing HDFS, connecting to HiveServer2, etc.). This is handled by Kerberos, LDAP, or other mechanisms configured on the cluster.

## Cluster administration with EMR APIs

AWS Identity and Access Management (IAM) controls access to the Amazon EMR Web Service APIs — operations such as creating clusters and terminating clusters. These interactions are typically performed by cluster administrators or automated pipelines that provision and manage the underlying clusters used to process data. IAM policies attached to IAM users, groups, or roles determine which EMR API actions a principal can perform and on which resources. IAM authentication applies to all interactions with the EMR control plane (console, CLI, SDK). For more information, see [AWS Identity and Access Management for Amazon EMR](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-access-iam.html) in the *Amazon EMR Management Guide*.

## Application and job Authentication

> In EMR on EC2, you can configure multiple authentication mechanisms depending on how you want or need to interact with the cluster. These are **mutually exclusive**. The three options are:

- IAM Authentication (EMR APIs: AddJobFlowSteps, GetClusterSessionCredentials)

- Kerberos (spark-submit, beeline, etc.)

- Native LDAP (Hue, Zeppelin)

#### IAM Authentication

> IAM Users or Roles can submit jobs to a cluster using EMR Steps. By default, these jobs access AWS services using the cluster's EC2 instance profile role.
>
> Amazon EMR provides two cloud-native mechanisms that allow users and pipelines to authenticate to AWS resources without sharing the cluster's EC2 instance profile:

- **Runtime Roles for EMR Steps** — Assign a dedicated IAM role to each step, enabling per-job least-privilege access control.

- **GetClusterSessionCredentials API** — Issue temporary, role-scoped credentials to external clients such as SageMaker Unified Studio, EMR Studio or SageMaker AI Studio notebooks.

> See the Authorization section below for a deep dive on both mechanisms.

#### Kerberos Authentication

Kerberos is the standard authentication protocol for the Hadoop ecosystem. Users and services authenticate with a Key Distribution Center (KDC) and receive tickets that prove their identity to other services on the cluster. Kerberos provides mutual authentication — both the client and the service verify each other's identity. Amazon EMR supports three Kerberos architecture options:

- **Cluster-dedicated KDC** Amazon EMR runs a KDC on the primary node. This is the simplest option and does not require additional infrastructure to manage.

- **Cross-realm trust** The cluster-dedicated KDC establishes a one-way trust with an external Kerberos realm, such as an Active Directory domain. Users authenticate with their AD credentials, and the trust relationship allows those credentials to be accepted by the cluster's KDC.

- **External KDC** The cluster uses an existing external KDC (e.g., an MIT KDC) rather than running its own. Multiple clusters can share the same external KDC.

Most applications on Amazon EMR support Kerberos authentication. For the full list, see [Supported applications](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-kerberos-principals.html) in the *Amazon EMR Management Guide*. For details on each architecture option, see [Kerberos architecture options](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-kerberos-options.html) in the *Amazon EMR Management Guide*. For more information on Kerberos enabled workflows on Amazon EMR, see \<u>Appendix B: EMR Kerberos Workflow\</u>.

#### EMR Native LDAP Integration (Amazon EMR 6.12.0+)

Starting with Amazon EMR 6.12.0, Amazon EMR provides native integration with LDAP-compatible identity servers such as Active Directory and OpenLDAP. When you enable this feature in the EMR security configuration, Amazon EMR automatically configures the supported applications to authenticate users against your LDAP server over LDAPS. Behind the scenes, Amazon EMR sets up and maintains a Kerberos KDC on the cluster and handles the mapping between LDAP users and Kerberos principals. This native integration also provides:

- Fine-grained SSH access control — only LDAP-authenticated users can SSH into the cluster.

- Automatic OS-level account creation and group mapping for LDAP users on cluster nodes.

This is the recommended approach for LDAP-based authentication on Amazon EMR. It replaces the manual Kerberos cross-realm trust setup that was previously required. For more information, see [Use Active Directory or LDAP servers for authentication with Amazon EMR](https://ttps://docs.aws.amazon.com/emr/latest/ManagementGuide/ldap.html) in the *Amazon EMR Management Guide*. For a walkthrough, see [Simplify authentication with native LDAP integration on Amazon EMR](https://aws.amazon.com/blogs/big-data/simplify-authentication-with-native-ldap-integration-on-amazon-emr/) on the AWS Big Data Blog.
