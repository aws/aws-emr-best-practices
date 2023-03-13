# Best Practice for HDFS

This section highlights some of the features / best practice that you could use to improve the performance in your cluster when using HDFS as storage layer for HBase. 


## HDFS - Name Node memory

When handling large cluster deployments, it’s important to properly size the HDFS NameNode (NN) heap memory which Amazon EMR set accordingly to the [instance used](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-hadoop-daemons.html). The NN keeps in memory metadata for each file / block allocated in the HDFS, so it’s important to properly size the memory to prevent failures that might create down-times in our services. 

To size the NN memory, we can consider that each HDFS block persisted in memory uses approximately 150 bytes. Using this value as reference, you can do a rough estimate of the memory required to store data in the HDFS, considering that a block is 128MB (please note that a file smaller than the HDFS block size will still count as a individual block in memory). As alternative, you can use a rule of thumb and specify 1GB of memory each 1 million blocks stored in the HDFS. 

To change the default NN memory, you can use the following [EMR Configuration](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-configure-apps.html): 

```json
[
  {
    "Classification": "hadoop-env",
    "Configurations": [
      {
        "Classification": "export",
        "Properties": {
          "HADOOP_NAMENODE_HEAPSIZE": "8192"
        }
      }
    ],
    "Properties": {}
  }
]
```


## HDFS - Service Threads  

Amazon EMR already configures most of the HDFS parameters that are required to get good HDFS performance for HBase. However, if you’re using a large instance with several vCpu, you might benefit in increasing the number of service threads that are available for the HDFS DataNode service. Please note that if you’re using [HDFS - Short Circuit Reads](#hdfs-short-circuit-reads) you might not get any additional benefits from this parameter tuning, but this might still be handy if your HDFS is used by other applications. 

In this case, setting the **dfs.datanode.handler.count** to 3 times the number of vCpu available on the node can be a good starting point. In the same way we can also tune the number of **dfs.namenode.handler.count** for larger cluster installations. For this last parameter, you can use the following formula to determine a good value for your cluster

```
20 * log2(number of CORE nodes)
```

Please note that this value might be useful to increase, if you have more than 20 CORE nodes provisioned in the cluster, otherwise you might stick to the default values set by the service. Also for both **dfs.namenode.handler.count** and **dfs.datanode.handler.count** you should not set a value higher than 200.


```json
[
  {
    "Classification": "hdfs-site",
    "Properties": {
      "dfs.namenode.handler.count": "64",
      "dfs.datanode.handler.count": "48"
    }
  }
]
```


## HDFS - Short Circuit Reads

In HDFS, reads normally go through the Data Node service. When the client asks the Data Node to read a file, the service reads that file off of the disk and sends the data to the client over a TCP socket. The "short-circuit reads" bypass the Data Node, allowing the client to read the file directly. This is only possible in cases where the client is co-located with the data. 

The following configurations allow HBase to directly read store files on the local node bypassing the HDFS service providing better performance while accessing data not cached.

```json
[
  {
    "Classification": "hdfs-site",
    "Properties": {
      "dfs.client.read.shortcircuit": "true",
      "dfs.client.socket-timeout": "60000", 
      "dfs.domain.socket.path": "/var/run/hadoop-hdfs/dn_socket"
    }
  }
]
```


For additional details, see [HDFS Short-Circuit Local Reads](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/ShortCircuitLocalReads.html)


## HDFS - Replication Factor

As best practice is recommended to launch the EMR cluster using at least 4 CORE nodes. When you launch an EMR cluster with at least 4 CORE nodes, the default HDFS replication factor will be automatically set to 2 by the EMR service. This prevents to lose data in case some CORE nodes get terminated. Please note that you cannot recover a HDFS block if all its replicas are lost (e.g. all CORE nodes containing a specific HDFS block and its replica are terminated). If you want a stronger guarantee about the availability of your data, launch the EMR cluster with at least 10 CORE nodes (this will set the default replication factor to 3), or manually specify the HDFS replication factor using the EMR Configuration API. 

If you specify the HDFS replication manually, please make sure to have a sufficient number of CORE nodes to allocate all the replica of your data. For more details see [HDFS configuration](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-hdfs-config.html) in the Amazon EMR documentation. 


## HBase - Hedged Reads

Hadoop 2.4 introduced a new feature called Hedged Reads. If a read from a block is slow, the HDFS client starts up another parallel read against a different block replica. The result of whichever read returns first is used, and the outstanding read is cancelled. This feature helps in situations where a read occasionally takes a long time rather than when there is a systemic problem. Hedged reads can be enabled for HBase when the HFiles are stored in HDFS. This feature is disabled by default.

To enable hedged reads, set **dfs.client.hedged.read.threadpool.size** to the number of threads to dedicate to running hedged threads, and **dfs.client.hedged.read.threshold.millis** to the number of milliseconds to wait before starting another read against a different block replica. 

The following is an example configuration to enable hedged reads using EMR Configurations: 

```json
[
  {
    "Classification": "hdfs-site",
    "Properties": {
      "dfs.client.hedged.read.threadpool.size": "20",
      "dfs.client.hedged.read.threshold.millis": "100"
    }
  }
]
```



## HBase - Tiered Storage

HBase can take advantage of the [Heterogeneous Storage and Archival Storage](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/ArchivalStorage.html) feature available in the HDFS to store more efficiently data in different type of storage and provide better performance. 

One of the use case where this setup might be useful, is for write intensive clusters that have a high ingestion rate and trigger a lot of internal compaction operations. In this case we can define a policy to store HBase WALs on SSD disks present in our nodes (NVMe instance store volumes), while storing HFiles on additional EBS volumes attached to our instances. Please note that this is an advanced configuration that requires additional steps to be enabled on an EMR cluster and might not be beneficial for small clusters with simple ingestion patterns.

Amazon EMR automatically configures both instances volumes stores and EBS disks that are defined while launching the cluster. However, we need to label the volumes attached to our node to specify the corresponding Storage Type for the  corresponding volume. 

The first step is to attach a [Bootstrap Action](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-bootstrap.html) while launching the cluster to label NVMe disks. You can use the following script to label as **SSD** the NVMe disks attached to the cluster's nodes. 


```bash
#!/bin/bash
#===============================================================================
#!# script: emr-ba-disk_labels.sh
#!# version: v0.1
#!#
#!# This Bootstrap Action can be attached to an EMR Cluster to automatically
#!# tag NVMe Disks using the HDFS Storage Type SSD.
#!#
#===============================================================================
#?#
#?# usage: ./emr-ba-disk_labels.sh
#?#
#===============================================================================

# Force the script to run as root
if [ $(id -u) != "0" ]
then
    sudo "$0" "$@"
    exit $?
fi

## Install nvme-cli
yum install -y nvme-cli
cd /tmp && wget -O epel.rpm –nv https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
yum install -y ./epel.rpm && yum -y install xmlstarlet

## List NVMe disks
nvme_disks=($(nvme list | grep "Amazon EC2 NVMe Instance Storage" | awk -F'[[:space:]][[:space:]]+' '{print $1}'))

## If there's no nvme exit
[[ ${#nvme_disks[@]} -eq 0 ]] && echo "No EC2 NVMe Instance Storage found. End script..." && exit 0

SCRIPT_NAME="/tmp/disk_labels.sh"
cat << 'EOF' > $SCRIPT_NAME
#!/bin/bash

# retrieve dfs.data.dir value
HDFS_CORE_SITE="/etc/hadoop/conf/hdfs-site.xml"

nvme_disks=($(nvme list | grep "Amazon EC2 NVMe Instance Storage" | awk -F'[[:space:]][[:space:]]+' '{print $1}'))

for disk in "${nvme_disks[@]}"; do
  # Find corresponding mounted partition
  mount_path=$(mount | grep "$disk" | awk -F'[[:space:]]' '{print $3}')

  echo "Apply Hadoop Storaget Type Label [SSD] to $disk ($mount_path)"
  curr_value=$(xmlstarlet sel -t -v '//configuration/property[name = "dfs.data.dir"]/value' $HDFS_CORE_SITE)
  echo "current: $curr_value"
  new_value=$(echo $curr_value | sed "s|$mount_path|[SSD]$mount_path|g")
  echo "new: $new_value"
  xmlstarlet ed -L -u "/configuration/property[name='dfs.data.dir']/value" -v "$new_value" $HDFS_CORE_SITE
done

systemctl restart hadoop-hdfs-datanode.service
exit 0
EOF
chmod +x $SCRIPT_NAME

sed -i "s|null &|null \&\& bash $SCRIPT_NAME >> \$STDOUT_LOG 2>> \$STDERR_LOG 0</dev/null \&|" /usr/share/aws/emr/node-provisioner/bin/provision-node

exit 0
```


Once done, we can specify the following HBase configuration in the *hbase-site* in order to store our WALs files on SSD disks only.

```json
[
  {
    "Classification": "hbase-site",
    "Properties": {
      "hbase.wal.storage.policy": "ALL_SSD"
    }
  }
]
```

By doing this, WALs will be allocated and persisted on the HDFS using disks that have been labeled as SSD. To verify the setup, you can run the following command from the EMR master node that will display the corresponding allocations on the blocks on the HDFS for WALs. 

```bash
# Describe block allocation for hbase root dir
hdfs fsck /user/hbase/WALs -files -blocks -locations

# Sample output
/user/hbase/WALs/ip-172-31-3-138.eu-west-1.compute.internal,16020,1674746296461/ip-172-31-3-138.eu-west-1.compute.internal%2C16020%2C1674746296461.1674746301597 135252162 bytes, replicated: replication=1, 1 block(s):  OK
0. BP-581531277-172.31.3.43-1674746228762:blk_1073741836_1012 len=135252162 Live_repl=1  [DatanodeInfoWithStorage[172.31.3.138:9866,DS-5ef6e227-738d-4cb5-9fc9-4d636744674d,SSD]]

/user/hbase/WALs/ip-172-31-3-138.eu-west-1.compute.internal,16020,1674746296461/ip-172-31-3-138.eu-west-1.compute.internal%2C16020%2C1674746296461.1674746426864 135213883 bytes, replicated: replication=1, 1 block(s):  OK
0. BP-581531277-172.31.3.43-1674746228762:blk_1073742073_1255 len=135213883 Live_repl=1  [DatanodeInfoWithStorage[172.31.3.138:9866,DS-bf9acb8e-ad9f-4757-a8cb-59b9d1d0e659,SSD]]
```

Based on this example, you can create more complex scenarios depending on the volumes attached to the nodes. 

HBase also provides another useful feature called [Heterogeneous Storage for Date Tiered Compaction](https://issues.apache.org/jira/browse/HBASE-24289) to better handle cold and hot data separation. However, this feature has been introduced in the newer HBase 3.x versions only.


## Summary

The following summarize a minimal set of configurations you can tune to improve the performance on an HDFS cluster. 

```json
[
  {
    "Classification": "hbase-site",
    "Properties": {
      "hbase.regionserver.handler.count": "120"
    }
  },
  {
    "Classification": "hdfs-site",
    "Properties": {
      "dfs.namenode.handler.count": "64",
      "dfs.datanode.handler.count": "48",
      "dfs.client.hedged.read.threadpool.size": "20",
      "dfs.client.hedged.read.threshold.millis": "100",
      "dfs.client.read.shortcircuit": "true",
      "dfs.client.socket-timeout": "60000", 
      "dfs.domain.socket.path": "/var/run/hadoop-hdfs/dn_socket"
    }
  }
]
```

