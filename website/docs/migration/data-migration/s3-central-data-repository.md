---
sidebar_label: S3 as Central Data Repository
---

# Using Amazon S3 as the Central Data Repository

This chapter covers the end-to-end process of migrating data from on-premises Hadoop environments (HDFS, relational databases, and streaming sources) to Amazon S3 on AWS. The assumed starting point is a traditional Hadoop deployment — whether Cloudera (CDH/CDP), Hortonworks (HDP), MapR, or a custom Apache Hadoop distribution.

The target architecture uses Amazon S3 as the central data repository, with data stored in open formats (Apache Parquet, Apache ORC, or Apache Iceberg tables) and cataloged in AWS Glue Data Catalog.

## HDFS vs Amazon S3 — Key Behavioral Differences

When migrating from HDFS to Amazon S3, understanding the behavioral differences is critical to avoid runtime failures and performance issues. S3 is an object store, not a POSIX filesystem — while the Hadoop FileSystem API abstracts most differences, some behaviors change fundamentally.

| **Behavior** | **HDFS** | **Amazon S3** | **Migration Impact** |
|----|----|----|----|
| Consistency | Strong (single-writer) | Strong read-after-write (since Dec 2020) | No action needed |
| Rename | Atomic, O(1) | Copy + delete, O(n) | Use S3-optimized committers or Iceberg |
| Append | Supported | Not supported | Write new files instead |
| Directories | Real directories, atomic | Simulated via key prefixes | Avoid directory-atomicity patterns |
| File listing | Fast (inode-based) | Slower (prefix scan) | Use Iceberg metadata for file discovery |
| Permissions | POSIX rwx, HDFS ACLs | IAM policies, bucket policies | Redesign with IAM/Lake Formation |
| Locality | Data-local compute | Network-accessed (10+ Gbps) | Locality less critical on AWS |
| Durability | 3x replication | 11 9s (automatic) | No action — S3 exceeds HDFS |
| Cost model | Hardware (fixed) | Pay per GB + requests | Optimize: fewer small files, right storage class |

**Critical code patterns to address:**

1\. Output committers — Replace FileOutputCommitter algorithm 1 with the EMRFS S3-optimized committer (default on EMR 6.x–7.9), the S3A Magic Committer (default on EMR 7.10+ with S3A), or use Iceberg tables which handle commits atomically via their own metadata-based protocol.

2\. Temp files and scratch directories — Workflows that write temp files to HDFS should use instance storage (local HDFS) for scratch and write final output to S3.

3\. Small files — HDFS handles millions of small files via NameNode memory. On S3, small files incur per-request costs and slower listing. Compact files to 128 MB–1 GB; use S3 Tables auto-compaction for ongoing management.

4\. Hive INSERT OVERWRITE — On HDFS, this atomically replaces a partition directory. On S3, it's a multi-step operation. Use Iceberg's INSERT OVERWRITE for atomic partition replacement via metadata.
