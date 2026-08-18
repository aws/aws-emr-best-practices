---
sidebar_label: Configuration and Dependency Mapping
---

# Configuration and Dependency Mapping

The third pillar of requirements gathering focuses on the software configurations, custom code, and integration dependencies that must be replicated or replaced on EMR.

## Custom Code Inventory

Identify all custom artifacts that run alongside standard framework jobs:

**Custom JARs and libraries** — user-defined functions (UDFs), custom input/output formats, SerDes, custom Spark listeners or accumulators.

**Python packages** — any non-standard Python libraries used by PySpark jobs (check virtual environments, pip freeze on gateway nodes).

**Shell scripts and wrappers** — bootstrap scripts, pre/post-processing scripts called by scheduler actions.

**Configuration overlays** — custom spark-defaults.conf, hive-site.xml, core-site.xml, mapred-site.xml properties that differ from distribution defaults.

**Export configurations systematically:**

For Cloudera: Clusters \> \{cluster\} \> Actions \> Download Client Configuration exports all service client configurations as a ZIP file.

For Ambari: GET /api/v1/clusters/\{cluster\}/configurations?type=\{config-type\} for each service config type (core-site, hdfs-site, hive-site, spark2-defaults, etc.).

## Authentication and Authorization Configuration

Document your current security posture to map it to EMR security controls:

| **On-Premises Component** | **What to Capture** | **EMR Equivalent** |
|----|----|----|
| Kerberos KDC | Realm name, trust relationships, keytab management process | EMR Kerberos config, cross-realm trust to Active Directory |
| Apache Ranger | All policies (HDFS, Hive, Spark SQL, HBase), user/group mappings | EMR-native RBAC via Lake Formation, or Apache Ranger on EMR |
| Apache Sentry | Database/table/column-level policies | Lake Formation permissions |
| LDAP/Active Directory | User/group structure, service accounts, LDAP search bases | IAM Identity Center, LDAP integration via EMR security config |
| Network segmentation | Firewall rules between zones, allowed ports | VPC security groups, NACLs, PrivateLink endpoints |
| Encryption | At-rest (HDFS TDE, KMS), in-transit (TLS/SSL configs) | EMR security configuration (S3 SSE/CSE, EBS encryption, TLS) |

This mapping directly informs the architecture decisions in the *Securing Your Resources on Amazon EMR* chapter. Capture the actual policy definitions — not just the policy types — so they can be converted to equivalent EMR/Lake Formation permissions.

## Network and Integration Dependencies

Map all external systems that interact with your Hadoop cluster:

**Data sources:** RDBMS connections (JDBC URLs), Kafka brokers, FTP/SFTP servers, API endpoints

**Data consumers:** BI tools (Tableau, Power BI), downstream databases, reporting systems

**Identity systems:** Active Directory servers, LDAP endpoints, Kerberos KDC addresses

**Monitoring/alerting:** Nagios, Zabbix, Datadog, or Splunk integrations

**DNS and service discovery:** Internal DNS names used in configurations, Zookeeper quorums

Document the network path (source IP/port → destination IP/port, protocols) for each integration. This information drives VPC design, security group rules, and determines whether AWS Direct Connect or VPN is required during and after migration.
