---
sidebar_label: EMR Security Best Practices
---

# EMR Security Best Practices

Amazon EMR offers a comprehensive set of controls to secure data processing in AWS. This chapter covers six security domains: **Authentication** (verifying identity), **Authorization** (granting access to resources), **Encryption**, **Network Security, Auditing** (tracking who accessed what and when), and **Patching**. It concludes with Best Practices and reference architectures for common customer scenarios.

## EMR Security Configuration

To configure many of the security controls within this section, customers will need to create EMR Security Configurations. EMR Security Configurations specify which security control to enable as well as how to configure them, which then can be specified when launching an EMR cluster. EMR will then configure the applications and components on your behalf. With EMR security configurations, you can configure:

- Data encryption including in-transit and data at rest encryption

- Authentication including enabling Kerberos authentication and LDAP integration

- Authorization including Lake Formation, and S3 Access Grants

For more information, see [**Use security configurations to set up Amazon EMR cluster security**](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-security-configurations.html)

**Design early with security in mind.** Implementing security designs at the beginning of migration saves time and reduces complexity because the architecture is built with security in mind. Large changes may require more effort when security becomes a requirement after implementation has been completed.

> **Ensure that the supporting department is involved early in security architecture.** Have the department reviews and approves architectures for security involved in the process as early as possible, and keep them up-to-date with decisions related to security. They may be able to give you advice earlier in the process to reduce or avoid design changes later in the process.

**Understand the risks.** Security is mainly about minimizing attack surfaces and minimizing impact should a system become compromised. No system can be entirely secured.

**Use different security setups for different use cases.** Batch and ETL clusters that do not have user interaction likely require a different security configuration than a cluster that is used in an interactive way. Clusters with interaction may have several users and processes that interact with a cluster and each user requiring different levels of access with each other. Clusters that are used for batch usually require much lower security controls than an interactive cluster.

**Protect from unintentional network exposure.** Security departments may configure proper security group rules to protect applications and data on the cluster. Misconfiguration of network security rules can open a broad range of cluster ports to unrestricted traffic from the public internet and expose cluster resources to outside threats. The [\<u>Amazon EMR block public access\</u>](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-block-public-access.html) feature allows you to minimize misconfigurations by centrally managing public network access to EMR clusters in an AWS Region. You can enable this configuration in an AWS Region and block your account users from launching clusters that allow unrestricted inbound traffic from the public IP address.

**Stay up to date with EMR and OS versions**. Regularly upgrade to the latest Amazon EMR release versions and operating system patches to benefit from security fixes, vulnerability remediations, and improved default configurations. Running outdated versions increases exposure to known CVEs and may lack support for newer security features. Establish a patching cadence and test upgrades in non-production environments before rolling them out to production clusters.

To learn more about EMR security best practices, see \<u>[Best Practices for Securing Amazon EMR](https://aws.amazon.com/blogs/big-data/best-practices-for-securing-amazon-emr/)\</u> on the

> *AWS Big Data Blog*.
