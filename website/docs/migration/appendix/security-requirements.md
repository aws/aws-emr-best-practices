---
sidebar_label: Security Requirements
---

# Security Requirements

## Authentication

- How do users authenticate to the cluster today? (Kerberos, LDAP, SSH keys, other)

- Do you use a directory service? Which one? (Active Directory, OpenLDAP, other)

- Is there a requirement for single sign-on (SSO) or federation with a corporate identity provider?

- Do service accounts or applications authenticate to the cluster? How? (Keytabs, service principals, certificates)

## Authorization and Access Control

- Are there fine-grained access control requirements? At what level? (Database, table, column, row, S3 prefix)

- How is read/write access restricted today? (HDFS ACLs, Ranger policies, Sentry, custom mechanisms)

- Are users allowed to create their own databases or tables? Are there approval workflows?

- Do different teams or users require different levels of access to the same cluster?

- Is there a requirement to restrict which AWS resources (S3 buckets, Glue catalogs, KMS keys) each job can access?

## Network Security

- Will the cluster run in a public or private subnet?

- Do users need interactive access (SSH, web UIs) to the cluster, or is API-only access sufficient?

- Are there firewall rules, network ACLs, or security group restrictions that must be replicated?

- Is there a requirement to keep all traffic within the AWS network (VPC endpoints, no internet gateway)?

## Encryption

- Is encryption at rest required? For which storage layers? (S3, EBS, instance store, HDFS)

- Is encryption in transit required? Between which components? (Node-to-node, client-to-cluster)

- Are there specific compliance requirements that dictate encryption standards?

## Auditing and Compliance

- What actions need to be audited? (User logins, data access, job submissions, administrative changes)

- Where are audit logs stored today? What is the retention requirement?

- Are there regulatory or compliance frameworks that apply? (HIPAA, PCI-DSS, SOC 2, GDPR, FedRAMP)

## Patching and Lifecycle

- How frequently are clusters patched or upgraded today?

- Are clusters long-running or transient (launched per job/workflow)?

- Is there a requirement for a maximum time between security patches being available and applied?

- Are there change management or approval processes for cluster upgrades?

## Operational Security

- Who has administrative access to the cluster today? How is that access controlled?

- Is there a separation of duties requirement between cluster administrators and data users?

- Are there requirements for termination protection or deletion safeguards on production clusters?

- Are there requirements for isolating workloads from different teams or tenants on the same cluster?
