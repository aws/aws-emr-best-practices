---
sidebar_position: 2
sidebar_label: Best Practices
---

# Best Practice

The following section describes some general HBase tuning and best practice that can be applied both when using HDFS or Amazon S3 as storage layer for HBase. 


## EMR Multi Master

When working with HBase on Amazon EMR, it is good practice to enable the [EMR Multi Master](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-ha.html) feature that allows you to launch three EMR master nodes. This functionality allows the HBase cluster to tolerate impairments that might occur if a single master goes down. 

Nevertheless, this functionality is highly recommended both when using HDFS or S3 as storage layer for your HBase cluster. Enabling this, allows you to serve HBase requests (both writes and reads) in case of a master failure. Please note that if you launch the EMR cluster with a single master and this node is terminated for any reason (e.g. human error, hardware impairment, etc.), it will not be possible to recover any data from the HDFS storage on the cluster as the HDFS metadata will be lost after the termination of the EMR master.


## EMR Termination Protection

[Using termination protection](https://docs.aws.amazon.com/emr/latest/ManagementGuide/UsingEMR_TerminationProtection.html) in Amazon EMR is highly recommended both when using HDFS or Amazon S3 for your HBase cluster. 

Amazon EMR periodically checks the Apache Hadoop YARN status of nodes running on CORE and TASK nodes in a cluster. The health status is reported by the [YARN NodeManager health checker service](https://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/NodeManager.html#Health_checker_service). If a node reports an UNHEALTHY status, it will not be possible to allocate YARN containers to it until it becomes healthy again. A common reason for unhealthy nodes is that disk utilization goes above 90%. If the node stays in this state for more than 45 minutes and Termination Protection is disabled, the EMR service terminates the node and launch a fresh new one as replacement.

When a node is in an UNHEALTHY state, with the termination protection enabled the nodes will not be terminated and replaced by the EMR service. This prevents to lose HDFS data blocks in case the utilization of the disks of a CORE node goes above 90%, so preventing data integrity issues in HBase tables.


## HBase RPC Listeners

One of the most important parameters to configure in your HBase cluster is the number of active RPC listeners defined per Region Server. Tuning the parameter *`hbase.regionserver.handler.count`* (default: 30) can increase the number of requests that you can concurrently serve in each region server and so the overall throughput of your cluster. To modify the default number of RPC listeners you can use the following EMR configuration: 

```json
[
  {
    "Classification": "hbase-site",
    "Properties": {
      "hbase.regionserver.handler.count": "120"
    }
  }
]
```

However, please be mindful that this parameter should be tuned accordingly to the average size of data stored or retrieved from your tables. As rule of thumb, you should increase this number when the payload of your data is lower than 100KB, while you should stick to the default, or decrease it when the payload size is `>= 1MB.` For small payloads (`<= 1KB)`, you can push this value up to 4 times the number of vCpu available in your Region Servers.

To determine the average payload of data stored in your tables, see [Determine average row size](./management.md#determine-average-row-size).


## HBase Heap Memory

On Amazon EMR, when you install HBase, the memory will be evenly re-partitioned between Hadoop YARN and HBase services. For a list of the default memory settings used per instance type see [Task configuration](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-hadoop-task-config.html#emr-hadoop-task-jvm) in the EMR documentation. 

However, when working with HBase it might be convenient to override the default parameters and increase the available memory for our HBase services. This might be required if we want to host a higher number of Regions per Region Server. To modify the default memory, you should modify the HBase environmental variables defined in the *hbase-env* which defines the default heap memory available for each HBase service. The following list highlight the variables that should be modified by service: 

* **`HBASE_MASTER_OPTS`** JVM options for the HBase master
* **`HBASE_REGIONSERVER_OPTS`** JVM options for the HBase Region Servers
* **`HBASE_THRIFT_OPTS`** JVM options for the HBase Thrift service
* **`HBASE_REST_OPTS`** JVM options for the HBase REST service


It’s best practice to modify the memory of each component using its own dedicated variable, rather than using the more general **HBASE_OPTS**, which is used to apply common JVM options across all HBase services. 

To override the default memory we should specify the following java parameter in our environmental variable: `-Xmx<size>[g|G|m|M|k|K]`. Please also make sure to add a self reference in the environmental variable to avoid loosing other parameters that are set in the script. Besides, if we modify the default HBase memory, we should also lower accordingly the memory specified for the YARN Node Manager service to avoid incurring in Out Of Memory errors. 

Please note that either if you’re just installing HBase, it might still be convenient to keep some memory reserved for YARN. This can be useful as some HBase utility runs on YARN (e.g. HBase export utility). 

The example below highlights the configurations that should be modified in an EMR cluster while tuning the HBase heap memory. Please make sure that the sum of the YARN and HBase memory is not greater than the memory available on the node. Also make sure to keep at least 2GB of available memory for the Operating System and other internal components running on the node.

```json
[
  {
    "Classification": "yarn-site",
    "Properties": {
      "yarn.scheduler.maximum-allocation-mb": "MAX_MEMORY_BYTES",
      "yarn.nodemanager.resource.memory-mb": "MAX_MEMORY_BYTES"
    }
  },
  {
    "Classification": "hbase-env",
    "Configurations": [
      {
        "Classification": "export",
        "Properties": {
          "HBASE_MASTER_OPTS": "\"$HBASE_MASTER_OPTS -Xmx30g\"",
          "HBASE_REGIONSERVER_OPTS": "\"$HBASE_REGIONSERVER_OPTS -Xmx30g\""
        }
      }
    ],
    "Properties": {}
  }
]
```


## HBase MultiWal Provider

By default, HBase uses a single [Write Ahead Log](https://hbase.apache.org/book.html#wal) file (WAL) per Region Server to persist mutate operations that are performed against Regions hosted on the node. This implementation can be a bottleneck as WALs are stored on the HDFS and each operation is performed sequentially against the same file. 

In write intensive clusters, you might increase the HBase throughput by adopting a multiwal strategy. In this scenario is recommended to have multiple disks attached to the node to get the most out of this feature. This configuration can be enabled specifying the following properties while launching an EMR cluster: 

```json
[
  {
    "Classification": "hbase-site",
    "Properties": {
      "hbase.wal.provider": "multiwal",
      "hbase.wal.regiongrouping.numgroups": "2"
    }
  }
]
```

The parameter *`hbase.wal.regiongrouping.numgroups`* determines the number of WALs that will be created per Region Server. By default, this parameter is set to two, but you can tune this parameter accordingly to the number of disks attached to the node for better performance. 


## HBase OffHeap Caching

The following example, shows how to enable OffHeap memory caching on HBase. This configuration, can be used both when using Amazon S3 or HDFS as storage layer. The example below sets an offheap memory of 5GB while the bucket cache allocated for this memory will be 4GB. 

```json
[
  {
    "Classification": "hbase-env",
    "Properties": {},
    "Configurations": [
      {
        "Classification": "export",
        "Properties": {
          "HBASE_OFFHEAPSIZE": "5G"
        },
        "Configurations": []
      }
    ]
  },
  {
    "Classification": "hbase-site",
    "Properties": {
      "hbase.bucketcache.size": "4096",
      "hbase.bucketcache.ioengine": "offheap"
    }
  }
]
```

In order to use the configured cache, make sure to enable the following configurations in the tables you want to cache. For example, from the HBase shell:

```bash
# creating new table t with column family info0
hbase> create 't', {NAME => 'info0', CONFIGURATION => {CACHE_DATA_IN_L1 => 'true'}}

# modify existing table t with column family info0
hbase> alter 't', {NAME => 'info0', CONFIGURATION => {CACHE_DATA_IN_L1 => 'true'}}
```

