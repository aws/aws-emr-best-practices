# Data Migration

This document describes possible migrations paths you can follow when migrating data from an existing HBase cluster (e.g. on premise, or self-managed cluster on EC2) to Amazon EMR.


## HBase snapshots

This is the most straight forward approach that doesn't require a complex setup and can easily be achieved using simple bash scripts. This approach is suitable if your data does not change frequently or when you can tolerate downtimes in your production systems to perform the data migration.

Below a list of steps that can be used to create a HBase Snapshot and transfer it to an Amazon S3 bucket. Please note that you can use the same approach to store snapshots on an HDFS cluster. If this is the case, replace the S3 target path in the following commands with the destination HDFS path (e.g. `hdfs://NN_TARGET:8020/user/hbase`) where you want to store the snapshots.

**Create a snapshot of a single HBase table**

When creating a snapshot, it’s good practice to also add an identifier in the snapshot name to have a reference date of when the snapshot was created. Before launching this command please replace the variable `TABLE_NAME` with the corresponding table you want to generate the snapshot for. If the table is in a namespace different from `default` use the following convention `NAMESPACE:TABLE_NAME`. From the SOURCE cluster submit the following commands:

```bash
DATE=`date +"%Y%m%d"`
TABLE_NAME="YOUR_TABLE_NAME"
hbase snapshot create -n "${TABLE_NAME/:/_}-$DATE" -t ${TABLE_NAME}
```

To verify the snapshot just created, use the following command

```bash
hbase snapshot info -list-snapshots
```

**Copy the snapshot to an Amazon S3 bucket**

**Note**
When migrating from an on premise cluster, make sure that you have Hadoop YARN installed in your cluster, as the commands rely on MR jobs to perform the copy to S3. Besides, you need to make sure that your Hadoop installation provides the [hadoop-aws](https://hadoop.apache.org/docs/stable/hadoop-aws/tools/hadoop-aws/index.html) module that is required to communicate with Amazon S3.

**Note** If you're planning to use HBase with Amazon S3 as storage layer, you should use as `TARGET_BUCKET` the same S3 path that will be used as HBase S3 Root Directory while launching the EMR cluster. This minimize copies on S3 that are required when restoring the snapshots, thus reducing the restore time of your tables. To avoid any conflict during the snapshot copy, you should not start the EMR cluster (if using Amazon S3 as storage layer) before the end of the snapshot copy.

```bash
TARGET_BUCKET="s3://BUCKET/PREFIX/"
hbase snapshot export -snapshot ${TABLE_NAME/:/_}-$DATE -copy-to $TARGET_BUCKET
```

**Restore Table when using Amazon S3 as storage layer for HBase** 

If you followed the notes in the previous step, you'll find the snapshot already available in HBase after launching the cluster. 

**Note** If your snapshot was created from a namespace different from the `default` one, make sure to pre create it, to avoid failures while restoring the snapshot. From the EMR master node:

```bash
# Verify snapshot availability
HBASE_CMD="sudo -u hbase hbase"
$HBASE_CMD snapshot info -list-snapshots

# Review snapshot info and details
SNAPSHOT_NAME="YOUR_SNAPSHOT_NAME"
$HBASE_CMD snapshot info -snapshot $SNAPSHOT_NAME -size-in-bytes -files -stats -schema

# Optional - Create namespaces required by the snapshot
echo "create_namespace \"$NAMESPACE_NAME\"" | $HBASE_CMD shell

# Restore table from snapshot
echo "restore_snapshot \"$SNAPSHOT_NAME\"" | $HBASE_CMD shell
```

**Scripts**

The following scripts allows you to migrate and restore HBase tables an namespaces using the snapshot procedure previously described.

* [Snapshot export](./scripts/hbase-snapshot-export.sh) - Generate HBase snapshots for all the tables stored in all the namespaces, and copy them on an Amazon S3 bucket.
* [Snapshot import](./scripts/hbase-snapshot-import.sh) - Restore all the snapshots stored in an Amazon S3 bucket.


## Snapshots with Incremental Export

This approach might help in those situations where you want to migrate your data but at the same time you cannot tolerate much downtime in your production system. This approach helps to perform an initial bulk migration using the HBase snapshot procedure previously described, and then reconcile data received after the HBase snapshot generating incremental exports from the SOURCE table. 

This approach works when the volume of ingested data is not high, as the procedure to reconcile the data in the DESTINATION cluster might require multiple iterations to synchronize the two clusters, along with the fact that might be error prone. The following highlights the overall migration procedure. 

In the SOURCE cluster:

- Create a snapshot of the HBase table you want to migrate. Collect the epoch time when the snapshot was taken, as this will be used to determine new data ingested in the cluster.

- Export the snapshot on Amazon S3 `org.apache.hadoop.hbase.snapshot.ExportSnapshot`


In the DESTINATION cluster:

- Import the snapshot in the cluster and restore the table

In the SOURCE cluster:

- Generate an incremental export to S3 for data arrived in the cluster after taking the snapshot using the HBase utility `org.apache.hadoop.hbase.mapreduce.Export`

In the DESTINATION cluster:

- Restore the missing data in the destination cluster using the HBase utility `org.apache.hadoop.hbase.mapreduce.Import`

**Example Export Commands**

```bash
## Configurations
HBASE_CMD="sudo -u hbase hbase"
BUCKET_NAME="YOUR_BUCKET_NAME"
SNAPSHOT_PATH="s3://$BUCKET_NAME/hbase-snapshots/"
TABLE_NAME="TestTable"

# ==============================================================================
# (Simulate) Create TestTable with 1000 rows
# ==============================================================================
$HBASE_CMD pe --table=$TABLE_NAME --rows=1000 --nomapred sequentialWrite 1

# ==============================================================================
# Take initial table snapshot and copy it to S3
# ==============================================================================
DATE=`date +"%Y%m%d"`
EPOCH_MS=`date +%s%N | cut -b1-13`
LABEL="$DATE-$EPOCH_MS"

# snapshot creation
# Note: HBase performs a FLUSH by default when creating a snapshot
#       You can change this behaviour specifying the -s parameter
$HBASE_CMD snapshot create -n "${LABEL}-${TABLE_NAME}" -t $TABLE_NAME

# copy to S3
$HBASE_CMD org.apache.hadoop.hbase.snapshot.ExportSnapshot -snapshot "${LABEL}-${TABLE_NAME}" -copy-to $SNAPSHOT_PATH

# ==============================================================================
# (Simulate) Data mutations to simulate data arrived after taking the snapshot
# ==============================================================================
# overwrite the first 100 elements of the table
$HBASE_CMD pe --rows=100 --nomapred sequentialWrite 1
# check first 100 rows will have an higher timestamp compared to the 101 element
echo "scan '$TABLE_NAME', {LIMIT => 101}" | $HBASE_CMD shell

# ==============================================================================
# Generate incremental data export
# ==============================================================================
# Retrieve the epoch time from the snapshot name that was previously created.
# This allow us to only export data modified since that moment in time.
$HBASE_CMD snapshot info -list-snapshots

# Incremental updates
LATEST_SNAPSHOT_EPOCH="$EPOCH_MS"
NEW_EPOCH_MS=`date +%s%N | cut -b1-13`
INCREMENTAL_PATH="s3://$BUCKET_NAME/hbase-delta/${TABLE_NAME}/${NEW_EPOCH_MS}"
$HBASE_CMD org.apache.hadoop.hbase.mapreduce.Export ${TABLE_NAME} $INCREMENTAL_PATH 1 $LATEST_SNAPSHOT_EPOCH
```

**Example Import Commands**

```bash
## Configurations
HBASE_CMD="sudo -u hbase hbase"
BUCKET_NAME="YOUR_BUCKET_NAME"
SNAPSHOT_PATH="s3://$BUCKET_NAME/hbase-snapshots/"

HBASE_CONF="/etc/hbase/conf/hbase-site.xml"
HBASE_ROOT=$(xmllint --xpath "//configuration/property/*[text()='hbase.rootdir']/../value/text()" $HBASE_CONF)

# ==============================================================================
# Import and Restore HBase snapshot
# ==============================================================================

## List Snapshots on S3 and take note of the snapshot you want to restore
$HBASE_CMD snapshot info -list-snapshots -remote-dir $SNAPSHOT_PATH
SNAPSHOT_NAME="SNAPSHOT_NAME" # e.g. "20220817-1660726018359-TestTable"

## Copy snapshot on the cluster
$HBASE_CMD snapshot export \
    -D hbase.rootdir=$SNAPSHOT_PATH \
    -snapshot $SNAPSHOT_NAME \
    -copy-to $HBASE_ROOT

# Restore initial snapshot
echo "restore_snapshot '$SNAPSHOT_NAME'" | $HBASE_CMD shell

# ==============================================================================
# Replay incremental updates
# ==============================================================================
TABLE_NAME=$(echo $SNAPSHOT_NAME | awk -F- '{print $3}')
INCREMENTAL_PATH="s3://$BUCKET_NAME/hbase-delta/${TABLE_NAME}/${NEW_EPOCH_MS}"
$HBASE_CMD org.apache.hadoop.hbase.mapreduce.Import ${TABLE_NAME} ${INCREMENTAL_PATH}
```

## Snapshots with HBase Replication

This approach describes how to migrate data using the [HBase cluster replication](https://hbase.apache.org/book.html#_cluster_replication) feature that allows you to establish a peering between two (or more) HBase clusters so that they can replicate incoming data depending on how the peering was established.

In order to use this approach, a network connection between the SOURCE and DESTINATION cluster should be present. If you're transferring data from an on premise cluster and you have large volumes of data to replicate, you might establish the connection between the two clusters using [AWS Direct Connect](https://aws.amazon.com/directconnect/) or you can establish a VPN connection if this is a one time migration. 


The below section highlight the overall procedure to establish the replication. 

* In the SOURCE cluster, create a HBase peering with the DESTINATION cluster and then disable the peering so that data is accumulated in the HBase WALs.
* In the SOURCE cluster, take a snapshot of the table you want to migrate and export it to S3.
* In the DESTINATION cluster, import and restore the snapshot. This creates the metadata (table description) required for the replication and also restore the data present in the snapshot.
* In the SOURCE cluster, re-enable the HBase peering with the DESTINATION cluster, so that data modified up to that moment will start to be replicated in the DESTINATION cluster.
* Monitor the replication process from the HBase shell to verify the lag of replication before completely switch on the DESTINATION cluster, and shutdown the SOURCE cluster.


**Create one-way peering: SOURCE → DESTINATION**

**Note** The configuration for the replication should be enabled by default in HBase. To double check, verify `hbase.replication` is set to true in the *hbase-site.xml* in the SOURCE cluster.

To create the HBase peering, you need to know the DESTINATION ip or hostname of the node where the Zookeeper ensemble used by HBase is located. If the destination cluster is an Amazon EMR cluster this coincides with the EMR master node.

Once collected this information, from the SOURCE cluster execute the following commands to enable the peering with the destination cluster and start accumulating new data in the HBase WALs:

```bash
# The HBase command might be different in your Hadoop environment depending on
# how HBase was installed and which user is used to properly launch the cli.
# In most installations, it's sufficient to use the `hbase` command only.
HBASE_CMD="sudo -u hbase hbase"
MASTER_IP="**YOUR_MASTER_IP**" # e.g. ip-xxx-xx-x-xx.eu-west-1.compute.internal
PEER_NAME="aws"
TABLE_NAME="**YOUR_TABLE_NAME**"

## Create peering with the destination cluster
echo "add_peer '$PEER_NAME', CLUSTER_KEY => '$MASTER_IP:2181:/hbase'" | $HBASE_CMD shell

## List peers in the source cluster
echo "list_peers" | $HBASE_CMD shell

## Disable the peer just created, so that we can keep new data in the LOG (HBase WALs) until the snapshots are restored in the DESTINATION cluster
echo "disable_peer '$PEER_NAME'" | $HBASE_CMD shell

## enable replication for the tables to replicate
echo "enable_table_replication '$TABLE_NAME'" | $HBASE_CMD shell
```

Now you can switch to the DESTINATION cluster and restore the initial snapshot taken for the table. Once the restore is complete, switch again on the SOURCE cluster and enable the HBase peering to start replicating new data ingested in the SOURCE cluster since the initial SNAPSHOT was taken.

```bash
HBASE_CMD="sudo -u hbase hbase"
PEER_NAME="aws"
echo "enable_peer '$PEER_NAME'" | $HBASE_CMD shell
```

To monitor the replication status you could use the hbase command **status 'replication'** from the HBase shell on the SOURCE cluster.


## Migrate HBase 1.x to HBase 2.x

### When using HDFS
The migration path from HBase 1.x to HBase 2.x, can be accomplished using HBase snapshots if you're using HDFS as storage layer. In this case you can take a snapshot on the HBase 1.x cluster and then restore it on the HBase 2.x one. Although it is highly recommended to migrate to the latest version of HBase 1.4.x before migrating to HBase 2.x, it is still possible to migrate from older version of the 1.x branch (1.0.x, 1.1.x, 1.2.x, etc). 

### When using Amazon S3
If you're using Amazon S3 as storage layer for HBase, you can directly migrate any EMR cluster using an HBase version >= 1.x to an Amazon EMR release using HBase <= 2.2.x. 

**Note** If you try to update to a more recent version of HBase (e.g. HBase 2.4.4 from HBase 1.x), the HBase master will fail to correctly start due to some breaking changes in the way HBase load the meta table information in newest releases. You might see a similar error in your HMaster logs:

```log
Caused by: org.apache.hadoop.hbase.ipc.RemoteWithExtrasException(org.apache.hadoop.hbase.regionserver.NoSuchColumnFamilyException): org.apache.hadoop.hbase.regionserver.NoSuchColumnFamilyException: Column family table does not exist in region hbase:meta,,1.1588230740 in table 'hbase:meta', {TABLE_ATTRIBUTES => {IS_META => 'true', coprocessor$1 => '|org.apache.hadoop.hbase.coprocessor.MultiRowMutationEndpoint|536870911|'}}, {NAME => 'info', VERSIONS => '3', KEEP_DELETED_CELLS => 'FALSE', DATA_BLOCK_ENCODING => 'NONE', TTL => 'FOREVER', MIN_VERSIONS => '0', REPLICATION_SCOPE => '0', BLOOMFILTER => 'NONE', IN_MEMORY => 'true', COMPRESSION => 'NONE', BLOCKCACHE => 'true', BLOCKSIZE => '8192', METADATA => {'CACHE_DATA_IN_L1' => 'true'}}
    at org.apache.hadoop.hbase.regionserver.HRegion.checkFamily(HRegion.java:8685)
    at org.apache.hadoop.hbase.regionserver.HRegion.getScanner(HRegion.java:3125)
    at org.apache.hadoop.hbase.regionserver.HRegion.getScanner(HRegion.java:3110)
```

In this case to migrate to the latest version, you can perform a two step migration:

* First, disable all your HBase tables in the Amazon EMR cluster using HBase 1.x. Once all the tables are disabled, terminate this cluster.
* Launch a new Amazon EMR cluster using EMR 6.3.0 as release and wait for all the tables/regions to be assigned. Once completed, disable all the tables again and shutdown the cluster.
* Finally, launch the latest EMR Version you want to use.


## Summary

|Approach	|When to use?	|Complexity	|
|---	|---	|---	|
|Batch - HBase Snapshots	|Data doesn't change frequently or when you can tolerate high service downtime	|Easy	|
|Incremental - HBase Snapshots + Export	|The data doesn't change frequently and you have large tables	|Medium	|
|Online - HBase Snapshots + Replication	|Data changes frequently and high service downtime cannot be tolerated	|Advanced	|
