---
sidebar_label: Large Data on Ongoing Basis
---

# Large Quantities of Data on an Ongoing Basis

## AWS Direct Connect and AWS Site-to-Site VPN

AWS Direct Connect provides dedicated, high-bandwidth connections from your premises to the AWS network. AWS Direct Connect is the recommended choice when you need to transfer large quantities of data to AWS on an ongoing basis. AWS Direct Connect lets you establish dedicated network connections between AWS networks and one of the AWS Direct Connect locations, with the following speed options:

- Dedicated connections: 1 Gbps, 10 Gbps, 100 Gbps, and 400 Gbps, provisioned directly or through an AWS Direct Connect Partner using single-mode fiber.

- Hosted connections: 50 Mbps to 25 Gbps, provisioned through an AWS Direct Connect Partner.

AWS Direct Connect uses industry-standard 802.1Q VLANs, which enable you to access resources running within an Amazon Virtual Private Cloud (Amazon VPC) using private IP addresses. AWS Direct Connect supports three virtual interface types: private virtual interfaces for VPC access, public virtual interfaces for accessing AWS public services such as Amazon S3, and transit virtual interfaces for connecting through AWS Transit Gateway to reach multiple VPCs across accounts and Regions.

For enterprise migration scenarios, the AWS Direct Connect Resiliency Toolkit helps you configure connections for maximum resiliency with a 99.99% SLA. AWS Direct Connect also supports MACsec encryption (IEEE 802.1AE) on 10 Gbps, 100 Gbps, and 400 Gbps dedicated connections, providing an additional layer of security for data in transit.

*Figure 17: AWS Direct Connect*

In addition to AWS Direct Connect, you can enable communication between your remote network and your VPC by creating an AWS Site-to-Site VPN connection. A Site-to-Site VPN connection uses Internet Protocol security (IPsec) tunnels over the internet to provide encrypted connectivity. You can create a VPN connection by attaching a virtual private gateway or transit gateway to the VPC, configuring your customer gateway device, and establishing the VPN tunnels.

> *Note: We recommend that you use AWS Direct Connect for large ongoing data transfer needs, since AWS Direct Connect can reduce costs, increase bandwidth, and provide a more consistent network experience than internet-based VPN connections. AWS Site-to-Site VPN is a good solution if you have an immediate need, have low to modest bandwidth requirements, and can tolerate the inherent variability in internet-based connectivity. For multicloud environments, AWS Interconnect is a newer managed connectivity service that simplifies private, high-speed connections between AWS and other cloud service providers.*

Within the connection established between your on-premises environment using either of these methods, you can migrate your data into Amazon S3 on an ongoing basis using any of the following approaches.

## Accessing Amazon S3 from Hadoop

Apache Hadoop provides the S3A connector, which implements the Hadoop FileSystem interface for Amazon S3 and can be used with the DistCp tool to migrate data from HDFS. The command to transfer data typically looks like the following:

> hadoop distcp hdfs://source-folder s3a://destination-bucket

Starting with Amazon EMR 7.10, AWS is transitioning from the proprietary EMR File System (EMRFS) to EMR S3A as the default Amazon S3 connector. EMR S3A enhances the open-source S3A connector with AWS-specific optimizations, delivering read performance comparable to EMRFS while maintaining full API compatibility with open-source Apache Spark and Hadoop. This transition applies across all Amazon EMR deployment options, including Amazon EMR on EC2, Amazon EMR Serverless, Amazon EMR on Amazon EKS, and Amazon EMR on AWS Outposts.

Often, the reason for the migration is a lack of compute capacity in the on-premises cluster. Customers in that situation use the S3DistCp tool provided by Amazon EMR to pull the data from HDFS onto Amazon S3. S3DistCp is an extension of DistCp that is optimized for Amazon S3 and provides features such as file concatenation, compression, and efficient parallel transfers. For more information on best practices in this scenario, see the AWS Big Data Blog post Seven Tips for Using S3DistCp on Amazon EMR to Move Data Efficiently Between HDFS and Amazon S3, and the post Migrate data from an on-premises Hadoop environment to Amazon S3 using S3DistCp with AWS Direct Connect.

You can also use commercially available solutions such as WANDisco LiveData Migrator to perform live data migrations from HDFS to Amazon S3 with zero downtime. LiveData Migrator supports both one-time and continuous replication, keeping the target in sync as users actively interact with the source data.

Additionally, you can use Apache Hadoop and Amazon EMR integration with Amazon S3 to have data processing workflows write directly to Amazon S3. For relational database ingestion, AWS Glue with JDBC connections or AWS Database Migration Service (AWS DMS) are the recommended approaches (see the Event and Streaming Data on a Continuous Basis section for more on AWS DMS).

> Note: Apache Sqoop was retired and moved to the Apache Attic in June 2021 and is not available on Amazon EMR 7.x releases. For relational database ingestion to Amazon S3, use: (1) AWS Glue with JDBC connections for batch ETL (see below), (2) AWS Database Migration Service (AWS DMS) for continuous replication with Change Data Capture (CDC), (3) Amazon AppFlow for SaaS application data ingestion, or (4) zero-ETL integrations for real-time analytics without ETL pipeline management.

## AWS Glue

AWS Glue is a serverless data integration service that makes it simple to discover, prepare, move, and integrate data from multiple sources for analytics and machine learning. AWS Glue automatically discovers your data and stores the associated metadata (for example, table definitions and schemas) in the AWS Glue Data Catalog. With AWS Glue 5.0, the service runs on Apache Spark 3.5.4 with Java 17 and Python 3.11, and provides native support for open table formats including Apache Iceberg, Delta Lake, and Apache Hudi.

AWS Glue can access on-premises relational databases via Java Database Connectivity (JDBC) to crawl a data store and catalog its metadata in the AWS Glue Data Catalog. The connection can also be used by any ETL job that uses the data store as a source or target, such as writing the data to Amazon S3. Key capabilities for ongoing data migration include:

- Batch ETL jobs for scheduled extraction, transformation, and loading of data from relational databases, file systems, and other sources into Amazon S3.

- Streaming ETL jobs that run continuously and consume data from streaming sources such as Amazon Kinesis Data Streams, Apache Kafka, and Amazon Managed Streaming for Apache Kafka (Amazon MSK), transforming and writing the results to Amazon S3 or JDBC data stores.

- AWS Glue crawlers that automatically infer file types, schemas, and partition structures, populating the Data Catalog for downstream querying by services such as Amazon Athena and Amazon Redshift Spectrum.

- Fine-grained access controls and integration with Amazon SageMaker Lakehouse for unified governance across data lakes and warehouses.

The following figure illustrates the workflow to extract data from a relational database, transform the data, and store the results in Amazon S3.

*Figure 18: AWS Glue Data Catalog*

> *Note: For ongoing data migration from on-premises relational databases, AWS Glue provides a fully managed, serverless approach that eliminates the need to provision and maintain ETL infrastructure. For streaming and near-real-time ingestion scenarios, consider AWS Glue streaming ETL jobs as an alternative to custom Spark Streaming applications.*

## AWS DataSync

AWS DataSync is an online data transfer service that simplifies, automates, and accelerates moving data between on-premises storage and AWS storage services. DataSync supports HDFS, NFS, SMB, self-managed object storage, and cloud storage from other providers including Azure Blob Storage. It uses a purpose-built network protocol with parallel, multi-threaded transfers and provides end-to-end encryption and data integrity validation. To transfer from HDFS, deploy a DataSync agent on-premises, configure source (HDFS) and destination (S3) locations, and run a transfer task. DataSync now offers Enhanced mode (parallel listing, structured JSON logging, unlimited object counts) and Basic mode — HDFS-to-S3 transfers currently require Basic mode.

> *Note: Use AWS DataSync for fast bulk transfer of existing data from Hadoop to Amazon S3. For subsequent low-latency on-premises access, pair with Amazon S3 File Gateway. For multicloud scenarios, DataSync also supports Azure Blob Storage and other cloud providers.*

## AWS Storage Gateway

AWS Storage Gateway is a hybrid cloud storage service that provides on-premises applications with access to virtually unlimited cloud storage in Amazon S3. The Amazon S3 File Gateway configuration offers on-premises devices and applications low-latency access to data in Amazon S3 via NFS (versions 3 and 4.1) and SMB (versions 2 and 3) file protocols. This means that you can easily integrate applications and platforms that don't have native Amazon S3 capabilities — such as on-premises lab equipment, mainframe computers, databases, and data warehouses — to directly write their files into Amazon S3. Files written to this mount point are converted to objects stored in Amazon S3 in their original format without any proprietary modification.

S3 File Gateway manages data transfer to and from AWS, buffers applications from network congestion, optimizes and streams data in parallel, and manages bandwidth consumption. It provides a local cache for low-latency access to frequently used data, and supports encryption using AWS Key Management Service (AWS KMS), including dual-layer server-side encryption with KMS keys (DSSE-KMS). S3 File Gateway can be deployed as a virtual machine on VMware ESXi, Microsoft Hyper-V, or Linux KVM, as a hardware appliance, or as an Amazon EC2 instance.

> *Note: AWS Storage Gateway is well suited for ongoing data migration scenarios where on-premises applications need to write data to Amazon S3 using standard file protocols without code changes. For bulk data transfers from Hadoop clusters, use AWS DataSync as the primary transfer mechanism and S3 File Gateway for subsequent low-latency access from on-premises applications.*
