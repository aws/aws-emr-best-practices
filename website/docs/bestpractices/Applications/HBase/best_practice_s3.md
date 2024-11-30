# Best Practices for Amazon S3

This section highlights some of the features / best practice that you can use to improve the performance in your cluster when using Amazon S3 as storage layer for HBase. For additional best practice / tuning parameters, see [Apache HBase on Amazon S3 configuration properties](https://docs.aws.amazon.com/whitepapers/latest/migrate-apache-hbase-s3/identifying-apache-hbase-and-emrfs-tuning-options.html).

## Bucket Cache

When using Amazon S3 as storage layer for HBase, EMR configures the service to use a Bucket Cache for persisting data blocks on the L2 Cache of each region server. The default cache implementation used for Amazon S3 persists blocks on the local volumes of the node as defined by the *`hbase.bucketcache.ioengine`* property. This parameter defines the location of the files used to store the cached data. For example, the following snippet shows the default configurations for a node with 4 EBS volumes attached. 

```xml
  <property>
    <name>hbase.bucketcache.ioengine</name>
    <value>files:/mnt1/hbase/bucketcache,/mnt2/hbase/bucketcache,/mnt3/hbase/bucketcache</value>
  </property>
```

By default, EMR configures N - 1 volumes for caching data, so in our example only 3 volumes out of 4 will be used for the cache. This feature can be useful to persist HOT data on the local disks of the cluster to reduce the latency introduced when accessing HFiles stored on S3. However, by default the cache size is set as 8GB, so you might need to increase it depending on the amount of data you want to store on each node. To modify the default cache value, you can set the following property: 

```
hbase.bucketcache.size: 98304 # defined as MB
```

In the above example, we set the cache size for each node to 98GB. In each volume only 32GB (98304 / 3) are used, as the total cache size will be evenly distributed across the volumes defined in the *`hbase.bucketcache.ioengine`*.

Besides, when using S3 it might be convenient to pre-warm the cache during the region opening to avoid performance degradation when the cache is still not fully initialized. In this case to enable blocks prefetch, you should enable the following configuration.

```
hbase.rs.prefetchblocksonopen: true
```

This configuration can also be set for individual Column Family of an HBase table. In this case you should specify the configuration through the HBase shell using the following command:

```
hbase> create 'MyTable', { NAME => 'myCF', PREFETCH_BLOCKS_ON_OPEN => 'true' }
```

Finally, in write intensive use cases, it might be useful to also enable the following configurations to automatically persist blocks in the cache as they are written, and to repopulate the cache following a compaction (compaction operations invalidate cache blocks). In this case we can set the following additional properties:

```
hbase.rs.cacheblocksonwrite: true
hbase.rs.cachecompactedblocksonwrite: true
```

Below a sample configuration to tune the Bucket Cache in an Amazon EMR cluster:

```json
[
  {
    "Classification": "hbase-site",
    "Properties": {
      "hbase.bucketcache.size": "98304",
      "hbase.rs.prefetchblocksonopen": "true",
      "hbase.rs.cacheblocksonwrite": "true",
      "hbase.rs.cachecompactedblocksonwrite": "true"
    }
  }
]
```

## Memstore flush size

When using Amazon S3 in HBase, it might be convenient to increase the default memstore flush size to avoid performance degradation, or an excessive number of small compaction operations in write intensive clusters. This can be useful if you have manually disabled the [Persistent File Tracking](#persistent-file-tracking) feature that is enabled on EMR greater than 6.2.0 or if you're using an EMR 5.x cluster.

In this case, you can increase the memstore flush size to 256MB or 512MB (default 128MB). Below an example of how you can change this configuration in an Amazon EMR cluster:
 

```json
[
  {
    "Classification": "hbase-site",
    "Properties": {
      "hbase.hregion.memstore.flush.size": "268435456" # 256 * 1024 * 1024
    }
  }
]
```

## Region Split Policy

Depending on the HBase version that you’re using, you will use different region split policies. By default, you’ll have:

* **HBase 1.x** *`org.apache.hadoop.hbase.regionserver.IncreasingToUpperBoundRegionSplitPolicy`*
* **HBase 2.x**  *`org.apache.hadoop.hbase.regionserver.SteppingSplitPolicy`*

These specific implementations aims to quickly increase the number of regions when you have a fresh new table that wasn’t pre-partitioned. This might be a good strategy for new tables in a cluster.

However, it might be more convenient for a cluster using S3 as storage layer to use the old split strategy *`org.apache.hadoop.hbase.regionserver.ConstantSizeRegionSplitPolicy`* that performs a split operation only when the overall size of a region goes above a threshold as defined by the parameter:  *`hbase.hregion.max.filesize`* (default: 10GB)

This can help if you want to have more control on the number of regions, as it will allow you to control the growth of the number of regions by a fixed size that you specify. Additionally, this can also be handy in case you’re leveraging Apache Phoenix to query HBase and you have a constant flow of new data. Setting a constant size region split policy will prevent excessive splitting operations. These operations can cause temporary region cache boundaries exceptions while using Phoenix, due to the time required to refresh internal metadata about regions boundaries. This problem might be more frequent when using S3 as storage layer than when using HDFS.

Below an example to modify the Region Server split logic on an Amazon EMR cluster:

```json
[
  {
    "Classification": "hbase-site",
    "Properties": {
      "hbase.regionserver.region.split.policy": "org.apache.hadoop.hbase.regionserver.ConstantSizeRegionSplitPolicy",
      "hbase.hregion.max.filesize": "10737418240"
    }
  }
]
```

## Persistent File Tracking

When using EMR versions greater than 6.2.0, EMR will enable a feature called Persistent File Tracking when using Amazon S3 as storage layer. This specific feature, is enabled by default and provides performance benefits as it avoids HFile rename operations that might delay write operations due to S3 latencies. However, please note that this feature does not support the native [HBase replication](https://hbase.apache.org/book.html#_cluster_replication) feature. So if you want to use replication to implement a Highly Available setup when using Amazon S3, you’ll have to disable this feature. This applies only to S3 and is not required when using HDFS as storage layer.

For more details on this feature, see [Persistent HFile tracking](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-hbase-s3.html#emr-hbase-s3-hfile-tracking).

## Speed up region assignment / opening / closing

### HBase 1.x

Set the below configurations to speed up region assignment, opening and closure on HBase 1.x clusters. These configurations specifically disable the use of zookeeper for the region assignment by setting to false the property *`hbase.assignment.usezk`*. Additionally, you can increase the thread pools the Region Servers use for opening the assigned regions. For Regions Servers handling many regions (in the order of thousands), you can set the thread pools up to 10 times the available number of vCpu on the Region Server. Below, an example EMR Configuration:

```json
[
  {
    "Classification": "hbase-site",
    "Properties": {
      "hbase.assignment.usezk": "false",
      "hbase.regionserver.executor.openregion.threads": "120",
      "hbase.regionserver.executor.closeregion.threads": "120"
    }
  }
]
```

### HBase 2.x

HBase 2.x introduced a more robust and efficient workflow to manage regions transitions which leverage the ProcedureV2 introduced in [HBASE-14614](https://issues.apache.org/jira/browse/HBASE-14614). In this case, it is only sufficient to increase the default region server thread pools to speed up the initialization of the regions.

```json
[
  {
    "Classification": "hbase-site",
    "Properties": {
      "hbase.regionserver.executor.openregion.threads": "120",
      "hbase.regionserver.executor.closeregion.threads": "120"
    }
  }
]
```
