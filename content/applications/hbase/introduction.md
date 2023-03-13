# Introduction

When working with Amazon EMR on EC2, you have the ability to choose between two deployment options for the underlying storage layer used by HBase: the [Hadoop HDFS](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html) or [Amazon S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html). 

Although there are no restrictions in the use of these storage options, they serve different purposes, and they both have pros and cons with related performance implications. In this document, we are going to review the main aspects of each storage option.


## Which storage layer should I use?

Typically, to understand which storage layer you should use in your HBase cluster, you must determine what are your application requirements and decide what is most important between these two main decision drivers: performance or costs. Generally speaking, on a large cluster setup, HDFS provides better performance in most cases, while Amazon S3 provides better cost savings due to the reduced amount of storage required to persist all your data, and is the right option when you want to decouple your storage from compute.

Using HDFS allows you to achieve the best performance for latency responses. This is true if you need milliseconds / sub-milliseconds read responses from HBase. You can also achieve similar results using Amazon S3 as storage layer, but this will require to rely on HBase caching features. Depending on your tables sizes, this can increase costs when provisioning resources for cache, as you’ll have to provision more EBS volumes or use bigger instances to cache your data locally on the nodes, thus losing the main advantages of using Amazon S3. This requires to fine tune HBase to find the right balance between performance and cost for your workload. 

Another common use case to choose HDFS over S3 is a data migration from an on premise cluster. This is typically recommended as first migration step, as this solution provides similar performance compared to your existing cluster. You can more easily migrate your infrastructure to the cloud, and later decide if it makes sense to use Amazon S3. 
Besides, using the HDFS for a data migration can be a requirement before moving to Amazon S3. Specifically this can help to optimize the underlying layout of your HBase tables if they have a considerable amount of small HBase regions, and you want to merge them. This operation can be more quickly be performed on an HDFS cluster, and you can later migrate the data to Amazon S3. For more details, see the sections [Reduce number of Regions](./management.md#reduce-number-of-regions) and [Data Migration](./data_migration.md).

Finally, using HDFS is also the right choice if you have a cluster that is mostly used for write intensive workloads. This is  because write intensive clusters are subject to intensive compaction and region splitting operations that are performed internally by HBase to manage the underlying data storage. In these cases, using Amazon S3 might not be the right option, because of data movements that occur between Amazon S3 and the cluster to perform compaction processes. This increases the time required to perform such operations, thus impacting the overall cluster performance resulting in higher latencies. 

On the other side, Amazon S3 is a good option for read-intensive HBase clusters. One of the best use cases where S3 excels is when the data that is most frequently accessed (read or modified) is the most recent, while old data is rarely modified. You can use the pre-configured bucket cache, to store a hot copy of the most recent data on local disks of your cluster, thus maintaining a good compromise in terms of costs and performance. For more details, see [Bucket Cache](./best_practice_s3.md#hbase---bucket-cache). 

Another good use case for using Amazon S3 is when you have tables that rarely change over time, and you need to serve a large amount of read requests. In this case, you can opt for Amazon S3 in combination with the [EMR HBase read-replica](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-hbase-s3.html#emr-hbase-s3-read-replica), to distribute your read requests across multiple clusters. For more details about this approach kindly see [Data Integrity](./data_integrity.md#amazon-emr-read-replica). Moreover, Amazon S3 provides stronger SLA for data durability and availability transparently at the storage level and will not be impacted by failures on EMR instances.

Finally, one major benefit of relying on S3 for storage is cost saving. If you have significant costs in your cluster due to large amount of data stored on EBS volumes, moving to S3 can reduce costs drastically. Moreover, HDFS uses block replication to provide fault tolerance, which increases the footprint of data stored locally in your cluster. In Amazon EMR, the default [HDFS replication](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-hdfs-config.html) factor is defined automatically when launching the cluster (or you can override it manually using the [EMR configuration API](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-configure-apps.html)). For large tables size this can drastically increase EBS storage costs, so you might want to leverage S3 where replication is handled natively by the service for a more convenient cost. 


## Which instance should I use? 

When talking about hardware requirements for HBase, it is very important to choose the right EC2 instance type when using HDFS as storage layer, as it might be prohibitive to change it once you have a live production cluster. On the other side, changing instances for an HBase cluster running on Amazon S3 is much easier as data is persisted on S3. This allows us to more easily terminate an EMR cluster without losing data and launch a new one using a different instance type. Below you can find some details that can help you to choose the right instances based on your use case / workloads requirements. 

HBase typically performs better with small instances and when you spread the overall requests across multiple instances. This is because there are some limitations in the number of HBase regions a single Region Server can handle, and having a huge amount of regions on a single node can lead to issues and unexpected behavior. For more details on determining the right number of regions for a specific instance, see the section [Number of HBase Regions](#number-of-hbase-regions).

Generally speaking, if you want to achieve the best possible performance in your HBase cluster, it’s highly recommended to use EC2 instances powered with an [Instance Store](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/InstanceStorage.html) volume. This is especially true for write intensive / mixed (50% writes 50% reads) workloads. For such use cases, if you have significant write requests, you’ll need disks that can provide a large amount of IOPS in order to accommodate all background operations performed by HBase (compaction, WAL writes). Using disk optimized instances allows you to sustain high volumes of write operations either if HBase is performing compaction or other background operations on disks. Some example of instances that are recommended for such workloads are: 

* [i3](https://aws.amazon.com/ec2/instance-types/i3/) / [i3en](https://aws.amazon.com/ec2/instance-types/i3en/) provide dense SSD storage for data-intensive workloads. They provide the best performance for write intensive workloads but can be prohibitive depending on the amount of storage you want to use. They are recommended if you want to achieve the best possible performance, and if you want to cache several data in memory.
* [m5d](https://aws.amazon.com/ec2/instance-types/m5/) / [r5d](https://aws.amazon.com/ec2/instance-types/r5/) / [c5d](https://aws.amazon.com/ec2/instance-types/c5/) all these families provide NVMe SSD disks to deliver high random I/O performance. They can be used in different ways to exploit HBase features. For example, r5d can be used in combination with HBase off heap caching to maintain a significant amount of data cached in a performant memory (instead of reading data from the disks). On the other side, c5d comes with a higher proportion of vCPU compared to the memory, so they can be a better match if you need to serve huge volumes of requests on a single region server. 

To decide the right instance size, it’s important to understand how many regions you’re going to serve on a single region server. As general rule however, for large HBase tables, it’s recommended to choose an instance type that can provide at least 32GB of memory dedicated for the HBase services (HMaster and Region Servers). Please note that by default Amazon EMR split the available memory of an instance between the YARN Node Manager and the HBase Region Server. For a list of default memory settings, see [Default values for task configuration settings](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-hadoop-task-config.html#emr-hadoop-task-jvm). You can always override the default EMR behavior using the EMR Configuration API. For more details see [Modify Heap Memory](./best_practice.md#hbase-heap-memory).


## Number of HBase Regions

As described in the [HBase documentation](https://hbase.apache.org/book.html#ops.capacity.regions.count), you can use the following formula to compute the number of HBase regions that should be hosted on a single region server. You should note that this is gives more of guideline about number of regions, but you should investigate and experiment on your workload to tune the number of regions: 

```
(REGION_SERVER_MEM_SIZE * MEMSTORE_FRACTION) / (MEMSTORE_SIZE * NUM_COLUMN_FAMILIES)
```

* **REGION_SERVER_MEM_SIZE** Memory allocated for the Region Server, as defined by the parameter -Xmx in *hbase-env.sh*
* **MEMSTORE_FRACTION** Memstore memory fraction, defined by *hbase.regionserver.global.memstore.size* (default 0.4)
* **MEMSTORE_SIZE** Memstore flush size (default 128MB)
* **NUM_COLUMN_FAMILIES** Number of column families defined for the table


For example for a Region Server configured with 32GB of Heap memory and hosting a table with a single column family with the default HBase settings, we'll have an ideal allocation of regions equals to:

```
# Number Recommended Regions
(32GB * 0.4) / (128MB * 1) = 100 
```

As previosly mentioned, this is a recommended setting that you can use as a starting point. For example, is not unfrequent to have a region server with 3 / 4 times the recommended value. However, to avoid impacting the performance it’s better that you’re not extensively using these extra regions for write operations to avoid extensive GC operations that might degrade performance or in worst cases failures that will force a Region Server restart.
