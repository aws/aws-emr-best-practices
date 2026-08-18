---
sidebar_label: Data Catalog Migration FAQs
---

# Appendix D: Data Catalog Migration FAQs

## What are some of the limitations of using an AWS Glue Data Catalog over a generic Hive metastore?

Database/Table renames, managed tables, Hive authorizations, and Hive constraints are not supported on AWS Glue Data Catalog. To see a list of AWS Glue Data Catalog constraints, see *Considerations when Using AWS Glue Catalog* in [\<u>Using the AWS Glue Data Catalog as the Metastore for Hive\</u>](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-hive-metastore-glue.html).

## What types of security features are available for an AWS Glue Data Catalog?

**Encryption:** You can enable encryption on an AWS Glue Data Catalog. TLS is enabled by default when your cluster is interacting with Glue Data Catalog’s APIs.

**Authentication:** All interactions with Glue Data Catalog’s APIs require AWS IAM credentials.

**Authorization:** Access to AWS Glue actions is configurable through IAM policies, Glue Data Catalog IAM Resource Policies. The default Amazon EMR EC2 role (EMR_EC2_DefaultRole) allows the required AWS Glue actions. However, if you specify a custom EC2 instance profile and permissions when you create a cluster, ensure that the appropriate AWS Glue actions are allowed. For a list of available Glue IAM policies, see [\<u>AWS Glue API Permissions: Actions and Resources Reference\</u>.](https://docs.aws.amazon.com/glue/latest/dg/api-permissions-reference.html) However, if you require fine grained access control, you can use Lake Formation.

## Can multiple Amazon EMR clusters use a single AWS Glue Data Catalog?

Yes, an AWS Glue Data Catalog can be used by one-to-many Amazon EMR clusters, as well as Amazon Athena and Amazon Redshift.

## Can an on-premises Hadoop cluster use AWS Glue Data Catalog?

Connecting an on-premises Hadoop cluster directly to AWS Glue Data Catalog is not a recommended long-term pattern. Instead, migrate your Hive metastore to AWS Glue Data Catalog as part of your overall EMR migration (see the Data Catalog Migration section). For hybrid environments during a phased migration, consider using a remote Hive metastore on Amazon RDS accessible from both on-premises and EMR clusters via AWS Direct Connect. An open-source Glue Data Catalog client for Apache Hive Metastore was previously available but is no longer actively maintained and is not recommended for new implementations.

## When should I use a Hive metastore on Amazon RDS over an AWS Glue Data Catalog?

If you want full control of your Hive metastore and want to integrate with other open-source applications such as Apache Ranger and Apache Atlas, then use Hive metastore on Amazon RDS. If you are looking for a managed and serverless Hive metastore, then use AWS Glue Data Catalog.

> Notes

\<sup>1\</sup> For a step-by-step guide on how to set up an LDAP server and integrate Apache Hue with it, see [\<u>Using\</u>](https://aws.amazon.com/blogs/big-data/using-ldap-via-aws-directory-service-to-access-and-administer-your-hadoop-environment/) [\<u>LDAP via AWS Directory Service to Access and Administer Your Hadoop Environment\</u>](https://aws.amazon.com/blogs/big-data/using-ldap-via-aws-directory-service-to-access-and-administer-your-hadoop-environment/) on the *AWS Big Data Blog*.

\<sup>2\</sup> Example customers that use Amazon S3 as their storage layer for their data lakes include NASDAQ, Zillow, Yelp, iRobot, and FINRA.

\<sup>3\</sup> For more information on these features, see [\<u>Configuring Node Decommissioning Behavior\</u>.](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-spark-configure.html#spark-decommissioning)

\<sup>4\</sup> For Amazon EMR versions 5.8.0 and later, you can configure Hive to use the AWS Glue Data Catalog as its metastore. See \<u>Existing Hive Metastore to AWS Glue Data Catalog\</u> in \<u>Data Catalog Migration\</u>.

\<sup>5\</sup> Applies to Amazon EMR software version 5.20 and later.

\<sup>6\</sup> For example, FINRA migrated a 700-TB HBase environment to HBase on Amazon S3. For more information, see [\<u>Low-Latency Access on Trillions of Records: FINRA’s Architecture Using Apache HBase\</u>](https://aws.amazon.com/blogs/big-data/low-latency-access-on-trillions-of-records-finras-architecture-using-apache-hbase-on-amazon-emr-with-amazon-s3/) [\<u>on Amazon EMR with Amazon S3\</u>](https://aws.amazon.com/blogs/big-data/low-latency-access-on-trillions-of-records-finras-architecture-using-apache-hbase-on-amazon-emr-with-amazon-s3/).

> \<sup>7\</sup> V.M. Megler, Kristin Tufte, and David Maier, *Improving Data Quality in Intelligent Transportation Systems*, [\<u>https://arxiv.org/abs/1602.03100\</u>](https://arxiv.org/abs/1602.03100) (Feb. 9, 2016)

\<sup>8\</sup> For information on support, see [\<u>Amazon EMR What's New\</u>](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-whatsnew.html) and the [\<u>Amazon EMR FAQs\</u>.](https://aws.amazon.com/emr/faqs/)
