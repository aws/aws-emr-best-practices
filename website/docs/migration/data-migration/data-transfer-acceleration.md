---
sidebar_label: Data Transfer Acceleration ✨
---

# Data Transfer Acceleration

The landscape of AWS data transfer services has evolved significantly since the original publication of this guide. Several services have been retired or restricted to existing customers, while new options provide higher throughput, simpler operations, and broader connectivity. This section consolidates the current options for accelerating data transfers to Amazon S3, helping you choose the right approach based on your data volume, network availability, and migration timeline. For detailed operational guidance on AWS DataSync and AWS Direct Connect in ongoing migration scenarios, see the Large Quantities of Data on an Ongoing Basis section.

## Amazon S3 Transfer Acceleration

Amazon S3 Transfer Acceleration is a bucket-level feature that speeds up long-distance transfers to and from Amazon S3 by routing data through Amazon CloudFront's globally distributed edge locations (400+). As data arrives at the nearest edge location, it is routed to Amazon S3 over an optimized network path across the AWS backbone, delivering 50–500% faster transfer speeds for geographically distant clients.

Key characteristics:

- Enabled per bucket; clients use a dedicated endpoint (bucketname.s3-accelerate.amazonaws.com)

- Works with both uploads and downloads

- Combines with multipart uploads for maximum throughput on large objects

- You are only charged when acceleration provides a measurable speed improvement

- Supports IPv4 and IPv6 (dual-stack endpoint available)

S3 Transfer Acceleration is best suited for scenarios where multiple geographically distributed sources upload data to a single S3 bucket — for example, collecting data from global offices, IoT deployments, or distributed data centers during a migration.

> *Note: S3 Transfer Acceleration applies to general purpose buckets only. Use the Amazon S3 Transfer Acceleration Speed Comparison tool to test whether acceleration provides a benefit for your specific source locations before enabling it in production.*

### AWS DataSync Enhanced Mode

AWS DataSync now offers Enhanced mode, which optimizes the transfer process by listing, preparing, transferring, and verifying data in parallel. Enhanced mode delivers higher performance than Basic mode for most workloads and removes file count limitations, supporting datasets with virtually unlimited numbers of objects.

Enhanced mode capabilities:

- **On-premises to S3** — supports transfers between on-premises NFS/SMB file servers and Amazon S3 using an Enhanced mode agent (available since December 2025)

- **Cross-cloud transfers** — supports agentless transfers from Azure Blob Storage and Google Cloud Storage to Amazon S3 in Enhanced mode (available since May 2025)

- **S3-to-S3 transfers** — supports transfers between Amazon S3 locations without an agent

- **Structured logging** — JSON-formatted transfer logs and richer CloudWatch metrics for monitoring and troubleshooting

Enhanced mode is the recommended approach for online data migration when network bandwidth is available. For HDFS-to-S3 transfers, Basic mode is still required.

### AWS Data Transfer Terminal

AWS Data Transfer Terminal is a physical data transfer service launched in December 2024 that provides secure, reservable locations where you bring your own storage devices and connect them directly to the AWS network. Data Transfer Terminal replaces the AWS Snow Family for new customers requiring physical data transfer.

How it works:

1\. Schedule a reservation at a Data Transfer Terminal location through the AWS Management Console (at least 24 hours in advance) 2. Bring your storage devices with compatible 100G QSFP-LR4 fiber interfaces 3. Connect to the provided high-speed ports and transfer data to any AWS public endpoint (Amazon S3, Amazon EFS, Amazon EC2, etc.) 4. Validate the transfer and disconnect

Each terminal provides at least two 100 GbE fiber connections (200 Gbps aggregate), with select locations offering four fibers (400 Gbps aggregate). Reservations last up to 24 hours, and pricing is per port-hour with lower rates for same-continent uploads.

Data Transfer Terminal is ideal for:

- Large-scale one-time migrations where network bandwidth is limited or unavailable

- Recurring high-volume uploads (e.g., media production, autonomous vehicle sensor data)

- Scenarios requiring device custody throughout the transfer process

AWS Partner white-glove services are available for a fully managed experience including device logistics, transfer execution, and data validation.

### AWS Transfer Family

AWS Transfer Family provides fully managed file transfer over SFTP, FTPS, FTP, and AS2 protocols directly into Amazon S3 or Amazon EFS. It is designed for B2B file exchanges and partner data ingestion scenarios where existing clients and workflows use standard file transfer protocols.

Recent additions:

- **Transfer Family web apps (December 2024)** — no-code, browser-based portals that allow authenticated users to upload, download, and manage files in S3 without requiring SFTP clients or technical expertise

- **Managed File Transfer Workflows (MFTW)** — serverless post-upload processing including decryption, decompression, tagging, and custom Lambda steps

- Integration with existing identity providers (Active Directory, LDAP, custom authentication)

Transfer Family is best suited for replacing legacy on-premises FTP/SFTP servers during migration, or for enabling non-technical users and external partners to contribute data to your S3-based data lake.

### AWS Direct Connect and AWS Interconnect

AWS Direct Connect now supports dedicated connections at 1 Gbps, 10 Gbps, 100 Gbps, and 400 Gbps (available since July 2024 at select locations). Native 400 Gbps connections provide higher bandwidth without the operational overhead of managing multiple connections in a link aggregation group. MACsec encryption is supported on 10 Gbps, 100 Gbps, and 400 Gbps dedicated connections.

AWS Interconnect — multicloud (generally available April 2026) is a managed connectivity service that provides private, high-speed Layer 3 connections between AWS and other cloud service providers. Google Cloud is the first launch partner, with Microsoft Azure planned for 2026. AWS Interconnect simplifies multicloud data migration by eliminating the need for VPN tunnels, colocation cross-connects, or third-party network providers.

### Optimizing Upload Performance

Amazon S3 increased the maximum object size from 5 TB to 50 TB in December 2025. To upload objects larger than 5 GB, you must use multipart upload. AWS recommends multipart upload for any object larger than 100 MB.

Best practices for maximizing upload throughput:

- **Use multipart upload** — split large objects into parts (5 MB to 5 GB each, up to 10,000 parts) and upload in parallel

- **Combine with S3 Transfer Acceleration** — multipart uploads work with the accelerated endpoint for long-distance transfers

- **Leverage AWS CRT-based SDKs** — the Common Runtime (CRT) library provides higher-performance transfer implementations than default SDK clients

- **Tune part size** — larger parts reduce per-request overhead; smaller parts increase parallelism. Balance based on network conditions.

- **Use S3 Express One Zone for staging** — for latency-sensitive intermediate processing, stage data in directory buckets before writing final results to general purpose buckets

### AWS Snow Family

The AWS Snow Family has been significantly reduced in scope:

| Device | Status |
|----|----|
| AWS Snowmobile | Retired (March 2024) |
| AWS Snowcone (HDD and SSD) | Discontinued (November 2024) |
| Previous-generation Snowball Edge devices | Discontinued (November 2024) |
| AWS Snowball Edge (latest generation) | Closed to new customers (November 2025) |

Existing Snowball Edge customers can continue using the service. New customers are directed to:

- **AWS DataSync** — for online transfers when bandwidth is available

- **AWS Data Transfer Terminal** — for secure physical transfers with bring-your-own devices

- **AWS Partner solutions** — for fully managed migration services

- **AWS Outposts** — for edge computing use cases previously served by Snow devices

> *Note: When choosing a transfer method, consider the total data volume, available network bandwidth, transfer deadline, and whether the migration is one-time or ongoing. As a general rule: if your data can be transferred within your timeline using available network bandwidth, prefer online methods (DataSync Enhanced mode, S3 Transfer Acceleration, Direct Connect). If network constraints make online transfer impractical, use AWS Data Transfer Terminal. For sustained high-volume transfers exceeding 10 Gbps, AWS Direct Connect with dedicated 100 Gbps or 400 Gbps connections provides the best cost-performance ratio.*
