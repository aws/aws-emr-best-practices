---
sidebar_label: KDC with One-Way Trust
---

# EMR Kerberos Cluster Startup Flow for KDC with One-Way Trust

![](/img/migration/image36.png)

> *Figure 50: EMR Kerberos Cluster Startup Flow for KDC with One-Way Trust*

During EMR cluster provisioning, each node runs a provisioning script that performs the following steps:

- **Primary node only** Creates the KDC and configures it for one-way trust.

- **All nodes** Starts realmd to join Active Directory, which in turn configures SSSD for user and group mapping and generates the node's keytab.

- **All nodes** Creates application principals and keytabs for each application and sub-application.

When a new node joins the cluster, its provisioning script performs the same operations: it creates principals in the KDC on the primary node for all locally running applications, generates the keytab file, joins Active Directory (if configured), and starts the applications.
