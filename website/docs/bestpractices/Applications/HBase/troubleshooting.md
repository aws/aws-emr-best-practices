# Troubleshooting

Managing distributed systems like **HBase** and **Hadoop** on **Amazon EMR** can be complex, especially at production scale where reliability, latency, and fault tolerance are critical. This runbook provides hands-on guidance for troubleshooting, recovery, and stability improvement of HBase and Hadoop components when using Amazon EMR.

---

## HBase Issues

This section focuses on common issues within HBase itself that can directly affect the health, performance, and availability of your cluster. Understanding and addressing these issues is crucial for ensuring data availability, maintaining performance, and preventing long-term inconsistencies or data loss.

### Important Notes

- Some commands in this guide perform **destructive or structural actions** (e.g., region assignment, HDFS deletes). Always validate first on staging environments.
- Use `hbck2` over `hbck` for HBase 2.x clusters. The original `hbck` is **deprecated and unsafe** for structural repairs.
- Take **backups or snapshots** before attempting recovery procedures that affect region or file system state.

---

### HBase Master Not Starting

**Description**

The HBase Master process may fail to start for several reasons, including misconfigured or unreachable ZooKeeper quorum, stale ZooKeeper lock files, port conflicts (often caused by custom software or agents installed on the node), unformatted or inconsistent HDFS state, or failures in loading meta regions. Without an active HBase Master, RegionServers cannot operate, leaving the HBase cluster unavailable.

**Symptoms**

- Errors in logs such as `java.net.BindException` (port conflict)
- Messages like `Master startup aborted`
- No active master shown in the HBase Web UI
- HDFS safe mode is active, blocking the HBase root directory check
- Repeated connection or session loss errors to ZooKeeper in master logs

**Investigation**

- **Examine HBase Master Logs** Look for critical errors indicating root causes:

```bash
less /var/log/hbase/hbase-hbase-master-*.log
grep -i "ConnectionLossException" /var/log/hbase/hbase-hbase-master-*.log
grep -i "Could not start master" /var/log/hbase/hbase-hbase-master-*.log
grep -i "safe mode" /var/log/hbase/hbase-hbase-master-*.log
grep -i "Exception" /var/log/hbase/hbase-hbase-master-*.log
```

- **Confirm HDFS Health and Availability**

```bash
# Check if HDFS is in Safe Mode (should be OFF)
hdfs dfsadmin -safemode get

# Confirm the HBase root directory exists and is accessible
hdfs dfs -ls /user/hbase/

# Verify that /user/hbase and all its subfolders/files are owned by hbase:hbase
# NOTE: If the output is empty, all ownership is correct. 
# Any lines shown indicate files/directories NOT owned by hbase:hbase
hdfs dfs -ls -R /user/hbase/ | awk '$3 != "hbase" || $4 != "hbase"'
```

- **Check ZooKeeper Quorum and Health** Confirm all ZooKeeper ensemble nodes are healthy.

```bash
# Extract hbase.zookeeper.quorum value from hbase-site.xml
zk_quorum=$(grep -A2 '<name>hbase.zookeeper.quorum</name>' /etc/hbase/conf/hbase-site.xml | grep '<value>' | sed 's/.*<value>\(.*\)<\/value>.*/\1/')

echo "ZooKeeper quorum: $zk_quorum"

# Loop through all ZooKeeper hosts and try to connect
IFS=',' read -ra zk_hosts <<< "$zk_quorum"

for host in "${zk_hosts[@]}"; do
  echo "Trying to connect to ZooKeeper node: $host:2181"
  if echo "quit" | zookeeper-client -server ${host}:2181 2>&1 | grep -qi 'connected'; then
    echo "SUCCESS: Connected to $host:2181"
  else
    echo "FAILED: Could not connect to $host:2181"
  fi
  echo "-----------------------------"
done
```

- **Check for Port Conflicts**

```bash
# Find processes using HBase Master ports (default: 16000, 16010)
sudo netstat -tulnp | grep 16000
sudo netstat -tulnp | grep 16010
```

**Resolution**

- **Release HDFS Safe Mode (if applicable)** Only do this after investigating and resolving any underlying HDFS issues:

```bash
hdfs dfsadmin -safemode leave
```

- **Resolve Port Conflicts (if applicable)** Stop or reconfigure any process occupying HBase Master ports (default: 16000, 16010).

- **Fix HDFS Permission Issues (if applicable)**

```bash
hdfs dfs -chown -R hbase:hbase /user/hbase/
```

- **Restart the HBase Master Service**

```bash
sudo systemctl restart hbase-master
```

**Prevention**

- Regularly monitor HDFS safe mode status and ZooKeeper ensemble health.
- Avoid running custom agents or services that might conflict with HBase Master ports.
- Configure HBase for High Availability by running [multiple master nodes](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-ha-launch.html)

---

### HBase RegionServer Crashes

**Description**

 RegionServers may crash due to memory exhaustion (`OutOfMemoryError`), prolonged garbage collection (GC) pauses, disk or filesystem failures, or corrupted write-ahead logs (WAL). While the HBase Master typically reassigns the affected regions automatically, sometimes a crash can leave regions unassigned or stuck in transition (Region-In-Transition, or RIT), resulting in data unavailability or degraded cluster performance.

**Symptoms**

- Frequent client errors such as `Connection reset by peer`
- Increased latency for read and write operations
- Errors in RegionServer logs, e.g., `Region not online` or `RegionNotServingException`
- Regions remaining in the RIT (Region-In-Transition) state
- Unassigned regions observed in the HBase Master UI or via shell

**Investigation**

- **Inspect RegionServer Logs** Check logs for critical issues, such as memory errors, Zookeeper connection problems, or abnormal region closures:

```bash
less /var/log/hbase/hbase-hbase-regionserver-*.log
grep -i "OutOfMemoryError" /var/log/hbase/hbase-hbase-regionserver-*.log
grep -i "regionserver aborting" /var/log/hbase/hbase-hbase-regionserver-*.log
grep -i "ClosedChannelException" /var/log/hbase/hbase-hbase-regionserver-*.log
```

- **Evaluate RegionServer Resources**  Assess memory, CPU, file descriptors, and disk health:

```bash
# Get RegionServer PID
rs_pid=`sudo jps -v | grep HRegionServer | awk -F' ' '{print $1}'`

# Memory and CPU usage
sudo ps -p $rs_pid -o %mem,%cpu,cmd

# Number of open file descriptors (sockets, files, etc.)
sudo lsof -u hbase | wc -l

# Disk space and I/O status
df -h
iostat -xm 2 5
```

- **Analyze Garbage Collection Performance** Identify if long GC pauses are causing service interruptions:

```bash
# Get RegionServer PID
rs_pid=`sudo jps -v | grep HRegionServer | awk -F' ' '{print $1}'`

# Garbage Collection statistics
sudo -u hbase jstat -gcutil $rs_pid 5000 10
```

**Resolution**

- **Restart the affected RegionServer**

```bash
sudo systemctl restart hbase-regionserver
```

- **Verify that regions are reassigned by the HBase Master** Use the Master Web UI or HBase shell

- **Check for and fix stuck regions using hbck**

```bash
alias hbck="sudo -u hbase hbase hbck -details"
hbck
```

**Prevention**

- **Increase memory allocation** in `hbase-env.sh` as appropriate for your workload: `export HBASE_REGIONSERVER_OPTS-=4096` or use the following EMR Classification: 

```json
[
  {
    "Classification": "hbase-env",
    "Configurations": [
      {
        "Classification": "export",
        "Properties": {
          "HBASE_REGIONSERVER_OPTS": "\"$HBASE_REGIONSERVER_OPTS -Xmx30g\""
        }
      }
    ],
    "Properties": {}
  }
]
```

- Raise file descriptor limits for the `hbase` user:

```bash
ulimit -n 65536
```

Persistently configure this in `/etc/security/limits.conf`.

---

### Slow Reads or Writes

**Description**

Performance degradation in HBase, seen as slow reads or writes, is frequently caused by I/O bottlenecks, memstore flush pressure, compaction backlog, high store file counts, or suboptimal region distribution. These issues can arise from hardware limits, application write patterns, or table design.

**Symptoms**

- High read or write latency (e.g., read latencies >100ms) visible in the HBase UI or monitoring dashboards
- Frequent or queued memstore flushes
- Elevated store file counts per region
- Write throughput drops or client timeouts
- Key metrics indicate problems, such as:
    - Low blockCacheHitRatio
    - High memstoreSizeMB
    - Large flushQueueLength

**Investigation**:

- Monitor RegionServer Metrics in the Web UI or directly in [CloudWatch](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/AmazonCloudWatchAgent-config-710.html): Open `http://<regionserver>:16030/jmx` for regionserver stats including flush and compaction queues, store file counts, and latency. As alternative, if you don't have any monitoring setup in place, you can use the following script to retrieve metrics of interest across all RegionServers of the cluster.

```bash
#!/bin/bash

HBASE_REST_HOST=`hostname -f`
REST_PORT="16010"

# Define HBase Namespace and table Name for which
# you want specific latency metrics
HBASE_NS="default"
HBASE_TABLE="TestTable"

# Get the list of RegionServers
RS_LIST=$(curl -s "http://${HBASE_REST_HOST}:${REST_PORT}/jmx?qry=Hadoop:service=HBase,name=Master,sub=Server" | jq -r '.beans[0]["tag.liveRegionServers"]' | tr ';' '\n' | awk -F',' '{print $1}')

echo "RegionServers found:"
echo "$RS_LIST"
echo

# For each RegionServer, retrieve and print latency metrics 
# NOTE - Latency metrics for latest EMR release emr 7.9.0
for RS in $RS_LIST; do
  echo "RegionServer: $RS"
  # Retrieve JMX metrics for this RegionServer
  RS_JMX=$(curl -s "http://${RS}:16030/jmx")
  
  # Example: Print few RS metrics
  echo "Generic RS metrics"
  rs_metrics="readRequestRatePerSecond,writeRequestRatePerSecond,l1CacheHitRatio,l1CacheMissRatio,l2CacheHitRatio,l2CacheMissRatio,Get_min,Get_max"
  echo "$RS_JMX" | jq '.beans[] | select(.name=="Hadoop:service=HBase,name=RegionServer,sub=Server") | {'$rs_metrics'}'
  
  echo "Table $HBASE_NS.$HBASE_TABLE metrics"
  table_latency_sub="TableRequests_Namespace_${HBASE_NS}_table_${HBASE_TABLE}"
  table_metrics="GetTime_min,GetTime_max,GetTime_mean,ScanTime_min,ScanTime_max,ScanTime_mean,PutBatchTime_min,PutBatchTime_max,PutBatchTime_mean"

  echo "$RS_JMX" | jq '.beans[] | select(.name=="Hadoop:service=HBase,name=RegionServer,sub='$table_latency_sub'") | {'$table_metrics'}'

  echo "-----------------------------"
done
```

Adjust `rs_metrics` and `table_metrics` based on your needs.

- **Check for Excessive Store Files** Too many store files per region can slow down reads and increase compaction pressure:

```bash
hdfs dfs -count -q -h -v /user/hbase/data/<namespace>/<table>
```

- **Check Memstore Flush Frequency** Frequent flushes may indicate memory pressure or uneven data distribution.

- **Use HBase Shell to Flush and Compact**

    - Flush a table to force memstore to HFiles:
    ```bash
    hbase shell
    > flush 'tablename'
    ```

    - Manually trigger major compaction to reduce store files:
    ```bash
    hbase shell
    > major_compact 'tablename'
    ```

- **Identify and Split Hot Regions**

    - In the Web UI, find regions with high request or size skew.
    - Split large or heavily loaded regions:
    ```bash
    hbase shell
    > split 'region_name'
    ```

**Resolution**

- **Manually Compact Store Files**  Use major compaction to consolidate store files and reduce read latency:

```bash
hbase shell
> major_compact 'tablename'
```

- **Split Hot Regions** Identify oversized or high-traffic regions in the HBase UI and split them to distribute load.

```bash
hbase shell
> split 'region_name'
```

- **Pre-Split Tables for Bulk Loads** Before loading large datasets, create tables with pre-split regions to avoid early hotspots.

- **Tune Block Cache and Memstore Parameters** Adjust settings such as:

    - hbase.hstore.blockingStoreFiles
    - hbase.regionserver.global.memstore.size
    - hbase.regionserver.flush.queue.size

**Prevention**

- **Set Reasonable Store File and Memstore Limits** Carefully configure `hbase.hstore.blockingStoreFiles` and `hbase.regionserver.global.memstore.size` to balance flush and compaction activity.

- **Enable Periodic Compactions** Schedule short major compactions during off-peak hours (e.g., at night) to keep store file counts under control. Set `hbase.offpeak.start.hour` and `hbase.offpeak.end.hour`.

- **Monitor and Alert on Key Metrics** Set up monitoring and alerts for latency, store file count, flush queue length, and block cache hit ratio.

- **Design Tables for Even Region Distribution** Use well-designed rowkeys and pre-splitting to prevent region hotspots.

---

### Table Inconsistencies

**Description**

Table inconsistencies in HBase can manifest as missing regions, orphaned regions, incorrect region assignments, holes in the key space, or files present in HDFS but not referenced in HBase metadata. These issues can arise due to failed region splits/merges, abrupt node failures, manual file operations in HDFS, or incomplete administrative actions.

**Symptoms**

- Errors when scanning or writing to tables (e.g., `RegionNotServingException`, missing rows)
- `hbase hbck` reports inconsistencies, such as "region holes", "orphaned regions" or "table is inconsistent"
- Table shows as `DISABLED` or is unavailable in the HBase shell/UI
- Regions stuck in transition (RIT)


**Investigation**

- **Run HBCK Tool (HBase 1.x & HBase 2.x)** Check for inconsistencies:

  ```bash
  alias hbck="sudo -u hbase hbase hbck -details"
  hbck
  ```

  As alternative you can use the `HBCK` report page in the HBase Web UI ta

  **Note** For HBase 2.x clusters, use `HBCK 1` only for generating reports. Do **NOT** use it for repairs or recovery, as it is not compatible with HBase 2.x internals and may corrupt your table data. However, running `hbase hbck -details` to generate inconsistency reports is safe on HBase 2.x clusters.

- **Review HBCK Report Page in the HBase Web UI** Starting with HBase 2.1.6, the Master Web UI includes an HBCK Report page (`/hbck.jsp`). This page provides valuable insight into cluster health by summarizing the results of two background inspections:
CatalogJanitor Output:

  - The CatalogJanitor runs periodically to inspect the hbase:meta table for region overlaps or holes. Any inconsistencies it finds are listed in the HBCK Report section of the UI.
  - Meta vs. Filesystem Check: Another background chore compares entries in hbase:meta with the actual file-system content. If anomalies (such as orphaned files or mismatched regions) are found, they are also reported on this page.

  You can manually trigger these inspections from the HBase shell:

  ```bash
  # Run the CatalogJanitor inspection
  catalogjanitor_run

  # Run the HBCK chore inspection
  hbck_chore_run
  ```

- **Review Master and RegionServer Logs** Look for messages about region assignment failures, missing regions, or meta table errors:

  ```bash
  grep -i 'inconsistent' /var/log/hbase/hbase-hbase-master-*.log
  grep -i 'orphan' /var/log/hbase/hbase-hbase-regionserver-*.log
  ```

**Resolution (HBase 2.x)**

- **Lingering Reference File Detected** `ERROR: Found lingering reference file <File Name>`

  - Identify the lingering reference files reported by the error.

  - Move the files out of the HBase root directory (do not delete them immediately—as a best practice, keep them as a backup in case of recovery needs).

  - Run an HBCK report to verify if the Region-In-Transition (RIT) or inconsistency is resolved:
  
    ```bash
    alias hbck="sudo -u hbase hbase hbck -details"
    hbck
    ```

  If the affected table is a Phoenix data table, check for related index tables and confirm their health and consistency.

- **Region Not Deployed on Any RegionServer** `ERROR: Region { meta => <Table>, <HBase Region Path> deployed => , replicaId => } not deployed on any region server.`

  - Assign the region manually using the HBCK2 tool:

    ```bash
    alias hbck2="sudo -u hbase hbase hbck -j /usr/lib/hbase-operator-tools/hbase-hbck2.jar"
    hbck2 -s assigns <region_encoded_name>
    ```

  - Check for stuck procedures related to the region assignment (use HBase Master UI > Procedures or logs).

  - If a stuck procedure exists, bypass it and retry assignment:

    ```bash
    alias hbck2="sudo -u hbase hbase hbck -j /usr/lib/hbase-operator-tools/hbase-hbck2.jar"
    hbck2 -s bypass -o -r <procedure_ID>
    hbck2 -s assigns <region_encoded_name>
    ```

- **Overlapping Regions** `ERROR: (regions <Encoded region name> and <Encoded region name>) There is an overlap in the region chain.`
  
  - Manually merge the overlapping regions in the HBase shell:

    ```bash
    echo "merge_region 'ENCODED_REGIONNAME_1', 'ENCODED_REGIONNAME_2'" | sudo -u hbase hbase shell
    ```

- **Region Found in META, Not in HDFS, and Deployed** `ERROR: Region <> hdfs => null, deployed => xxx, replicaId => 0 } found in META, but not in HDFS, and deployed on xxx`

  - Unassign region using HBCK2:

    ```bash
    alias hbck2="sudo -u hbase hbase hbck -j /usr/lib/hbase-operator-tools/hbase-hbck2.jar"
    hbck2 -s <region_encoded_name>
    ```

  - Fix extra regions in meta using HBCK2:
  
    ```bash
    alias hbck2="sudo -u hbase hbase hbck -j /usr/lib/hbase-operator-tools/hbase-hbck2.jar"
    hbck2 extraRegionsInMeta --fix <table_name>
    ```

- **Region Not Found in META, Found in HDFS, and Deployed** `ERROR: Region { meta => null, hdfs => xxx, deployed => yyy, replicaId => 0 } not in META, but deployed on xxx`

  - Fix missing regions in meta using HBCK2:

    ```bash
    alias hbck2="sudo -u hbase hbase hbck -j /usr/lib/hbase-operator-tools/hbase-hbck2.jar"
    hbck2 addFsRegionsMissingInMeta <table_name>
    ```

  - If successful you should see a message similar to: `N regions were added to META, but these are not yet on Masters cache.` 
    This will also show additional instructions that include restart of HBase master and manual assignment of added regions. 
  
  - Restart HBase Master:

    ```bash
    sudo systemctl restart hbase-master.service
    ```

  - Assign added regions using HBCK command:

    ```bash
    hbck2 -s assigns <encoded_region_name>
    ```

- **Table Inconsistency or WAITING_TIMEOUT in Procedures**

  - Check the HBase Master UI under "Procedures" and "Locks" for any assign procedures stuck in WAITING_TIMEOUT.

  - Bypass the stuck procedure and retry the region assignment:

    ```bash
    alias hbck2="sudo -u hbase hbase hbck -j /usr/lib/hbase-operator-tools/hbase-hbck2.jar"
    hbck2 -s bypass -o -r <procedure_ID>
    hbck2 -s assigns <region_encoded_name>
    ```

- **Region Holes** `ERROR: There is a hole in the region chain between xxx and yyy.  You need to create a new .regioninfo and region dir in hdfs to plug the hole.`

  - Run `fixMeta` to fix bad or inconsistent state in hbase:meta

    ```bash
    alias hbck2="sudo -u hbase hbase hbck -j /usr/lib/hbase-operator-tools/hbase-hbck2.jar"
    hbck2 fixMeta
    ```

**Prevention**

- Always use HBase shell or admin tools for region and table operations. Avoid manual file management in HDFS for HBase tables.
- Perform regular hbck or hbck2 audits to catch inconsistencies early.
- Backup metadata and tables before performing major operations or upgrades.
- Monitor master/regionserver logs for early warning signs of inconsistency or failed assignments.

---

## Hadoop HDFS Issues

This section covers common Hadoop HDFS issues that can significantly impact your HBase cluster. HDFS-related problems can lead to critical disruptions affecting cluster availability and data integrity. Addressing these issues promptly is essential, as HBase directly depends on HDFS for data storage, retrieval, and durability.

---

### NameNode High Memory/CPU Usage

**Description**

The NameNode manages all HDFS file system metadata in memory, including the directory structure, file/block mappings, and permissions. Excessive memory or CPU usage on the NameNode is typically caused by a high number of small files, deep or complex directory hierarchies. If overloaded, the NameNode can suffer from long garbage collection (GC) pauses, unresponsiveness, or even crashes due to Java heap exhaustion.

**Symptoms**

- Slow or unresponsive NameNode Web UI (http://EMR_MASTER_NODE:9870 or https://EMR_MASTER_NODE:9871 if in-transit encryption is enabled)
- Frequent or prolonged garbage collection events 
- HDFS enters safe mode, visible in logs or via errors like: java.io.IOException: `File system is in safe mode`
- Job failures or timeouts when interacting with HDFS
- Cluster monitoring tools show high NameNode memory or CPU usage

**Investigation**

- **Check NameNode Heap and GC Behavior**

```bash
nn_pid=`sudo jps -v | grep NameNode | awk -F' ' '{print $1}'`
sudo jstat -gcutil $nn_pid 5s 10
top -p $nn_pid
```

- **Monitor Namespace and Block Report** Get summary of total files, directories, and blocks:

```bash
hdfs dfsadmin -report
hdfs dfs -count -q -h -v /
```

- **Analyze Number of Small Files** Get block count and compare to file count (if similar, you likely have too many small files):

```bash
hdfs fsck / | grep 'Total blocks (validated):'
hdfs dfs -count -v /
```

Large numbers of files with one or very few blocks is a classic sign of a small file problem.

- **Review Logs for Errors or Safe Mode Events** Look for memory errors or safe mode transitions in the NameNode logs:

```bash
less /var/log/hadoop-hdfs/hadoop-hdfs-namenode-*.log
grep -i "safe mode" /var/log/hadoop-hdfs/hadoop-hdfs-namenode-*.log
```

**Resolution**

- **Increase NameNode Heap Size** In hadoop-env.sh modify `export HADOOP_NAMENODE_HEAPSIZE=8192` (set a value accordingly to your needs) or use the following EMR classification:

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

- **Consolidate Small Files** Merge small files. If this is due to HBase Storefiles, make sure you haven't disabled Compactions, and eventually run a Major Compaction to reduce the overall number of files in your tables.

**Prevention**

- **Design your HBase tables to Avoid Small Files** This typically requires to avoid creating tables with a high number of column families. Generally best practice recommend to use no more than 1 or two column families per table.

- **Regular Namespace Auditing** Periodically review file and block counts; set CloudWatch alerts for rapid increases.

---

### HDFS Under-Replication

**Description**

HDFS under-replication occurs when one or more data blocks have fewer replicas than the configured [HDFS replication factor](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-hdfs-config.html). This typically results from DataNode failures, decommissioning, or disk errors, leaving some blocks at risk of data loss if additional nodes fail.

**Symptoms**

- The HDFS NameNode Web UI shows “Under-replicated blocks” or “Missing replicas”
- `hdfs fsck` reports blocks under-replicated or missing
- Alerts or metrics such as `UnderReplicatedBlocks` spike in monitoring dashboards
- Applications reading under-replicated files may encounter errors if additional failures occur

**Investigation**

- **Check HDFS Block Health** Run a file system check to identify under-replicated blocks:

```bash
# List files with under-replicated blocks and their locations
sudo -u hdfs hdfs fsck / -blocks -locations -racks
```

**Note**: In small clusters (fewer than 10 nodes), you may notice under-replicated JAR files being reported. This happens because, by default, YARN sets a replication factor of 10 for shared library files created when a user submits a YARN job. This behavior is controlled by the `yarn.sharedcache.nm.uploader.replication.factor` property, which defaults to 10.

**Resolution**

- **Wait for HDFS Self-Healing** HDFS attempts to automatically restore the desired replication factor when DataNodes recover or new nodes join.

- **Manually set replication** `hdfs dfs -setrep -w 3 /path/to/file`
Adjust the replication factor (3 in the example) as appropriate for your environment.

- **Bulk Fix Under-Replicated Files**

```bash
# Generate a file with under-replicated HDFS blocks
sudo -u hdfs hdfs fsck / | grep 'Under replicated' | awk -F':' '{print $1}' >> /tmp/under_replicated_files

# Fix replication issues
# NOTE - adjust HDFS_REPLICATION accordingly to your needs
HDFS_REPLICATION=3
for hdfs_file in `cat /tmp/under_replicated_files`; do 
    echo "Fixing $hdfs_file..."
    hdfs dfs -setrep -w $HDFS_REPLICATION $hdfs_file
done
```

- **Restore DataNodes** If under-replication is due to node failure, restore or replace failed DataNodes and ensure they are healthy and rejoin the cluster.

**Prevention**:

- **Monitor Cluster Health**  Set up alerts for under-replicated blocks using HDFS metrics (UnderReplicatedBlocks in [CloudWatch Metrics](https://docs.aws.amazon.com/emr/latest/ManagementGuide/UsingEMR_ViewingMetrics.html) exposed by EMR clusters or your preferred monitoring system).

- **Maintain Sufficient DataNodes** Ensure enough healthy DataNodes to meet your desired replication factor, especially before decommissioning nodes.

- **Optimize HDFS Replication Settings** Add or tune these configurations to accelerate detection and correction of under-replicated blocks:

```json
[
  {
    "Classification": "hdfs-site",
    "Properties": {
      "dfs.namenode.heartbeat.recheck-interval": "15000",
      "dfs.namenode.replication.max-streams": "100",
      "dfs.namenode.replication.max-streams-hard-limit": "200",
      "dfs.namenode.replication.work.multiplier.per.iteration": "50",
      "dfs.replication": "3"
    }
  }
]
```

---

### HDFS Block Corruption

**Description**

 HDFS block corruption occurs when a block’s data becomes unreadable, typically due to disk hardware failures, incomplete writes, or checksum mismatches. This can lead to data loss if not detected and remediated promptly, especially for critical data like HBase store files.

**Symptoms**

- `ChecksumException` or similar errors in DataNode or client logs
- `hdfs fsck` reports corrupt or missing blocks
- Unexpected file read failures or application errors when accessing data

**Investigation**

- **Identify Corrupted Blocks** Use HDFS fsck to list all corrupt file blocks:

```bash
hdfs fsck / -list-corruptfileblocks
```

- **Check DataNode Logs** Review logs on DataNodes hosting the affected blocks for disk errors, checksum failures, or volume failures.

- **Corruption Context** For HBase, check if the corrupted blocks belong to HBase store files, WALs, or other important files like tables descriptors or region info files. If so, cross-reference with HBase logs for corresponding errors or data loss.

**Resolution**

- **HBase Store File Corruption**  If corruption affects HBase files and is impossible to recover them, the only safe recovery is to delete and restore the data from a valid HBase Snapshot. If you're not sure on what action you should take, please contact AWS Support for additional help.

- **Other Data** If the file can be recreated or re-ingested, delete the corrupted file and restore from backup or source. To delete a corrupted file: `hdfs dfs -rm /path/to/corrupted/file`

**WARNING** Before deleting any file, ensure that recovery is not possible by other means. Sometimes a block is marked as corrupt because one or more DataNodes are temporarily down, not because the data is permanently lost. If affected DataNodes are still operational, review their health and logs to see if the data can be recovered before removal.

**Prevention**

- **Regular Backups and Snapshots** Periodically back up HBase tables and maintain recent snapshots to enable rapid recovery in case of corruption events.

- **Validate Replication** Ensure the replication factor is sufficient to tolerate node or disk failures.

---

## Hadoop YARN Issues

This section addresses common Hadoop YARN issues that could impact your HBase cluster. While these typically aren't critical threats to cluster stability or data integrity, resolving them can be beneficial, especially since certain HBase operations (like exports and imports) depend on YARN jobs.

---

### ResourceManager Crashes

**Description**

The YARN ResourceManager may crash or become unresponsive due to Java heap exhaustion, excessive garbage collection, queue/scheduler misconfiguration, application overload, or issues in application history management. This is a critical failure that impacts the entire cluster, as no new jobs can be submitted or scheduled while the ResourceManager is down.

**Symptoms**

- New jobs are not accepted or scheduled; running jobs may be orphaned
- YARN ResourceManager UI is unavailable or returns HTTP 500 errors
- Frequent ResourceManager restarts (you can easily spot this by checking the YARN application ID)
- “OutOfMemoryError”, “Unable to create new native thread”, or similar exceptions in ResourceManager logs
- UI or CLI operations hang or timeout

**Investigation**

- **Review ResourceManager Logs** Look for memory-related errors, thread exhaustion, and application history loading issues.
```bash
less /var/log/hadoop-yarn/hadoop-yarn-resourcemanager-*.log
grep -i "OutOfMemoryError" /var/log/hadoop-yarn/hadoop-yarn-resourcemanager-*.log
grep -i "Unable to create new native thread" /var/log/hadoop-yarn/hadoop-yarn-resourcemanager-*.log
grep -i "Exception" /var/log/hadoop-yarn/hadoop-yarn-resourcemanager-*.log
```

- **Monitor ResourceManager Heap Usage** Check for memory pressure or GC issues on the ResourceManager node:

```bash
rm_pid=`sudo jps -v | grep ResourceManager | awk -F' ' '{print $1}'`
sudo jstat -gcutil $rm_pid 5s 10
top -p $rm_pid
```

- **Check Number of Applications Managed** A high count of completed or running applications can overload the scheduler and history components.

```bash
yarn application -list
yarn application -list -appStates ALL | wc -l
```

**Resolution**

- **Increase ResourceManager Java Heap Size** Edit yarn-env.sh to allocate more memory: `export YARN_RESOURCEMANAGER_HEAPSIZE=4096` or use EMR classifications:
```json
[
  {
    "Classification": "yarn-env",
    "Configurations": [
      {
        "Classification": "export",
        "Properties": {
          "YARN_RESOURCEMANAGER_HEAPSIZE": "4096"
        }
      }
    ],
    "Properties": {}
  }
]
```

- **Reduce Completed Application Retention** Set a lower value for completed application retention to prevent RM overload: Set `yarn.resourcemanager.max-completed-applications` in yarn-site.xml or use EMR Classifications:

```json
[
  {
    "Classification": "yarn-site",
    "Properties": {
      "yarn.resourcemanager.max-completed-applications": "500"
    }
  }
]
```

- **Restart ResourceManager** After making configuration changes (manually), restart the ResourceManager:
```bash
sudo systemctl restart hadoop-yarn-resourcemanager
```

**Prevention**

- **Set Reasonable Completed Application Limits** Ensure `yarn.resourcemanager.max-completed-applications` is not set excessively high on small EMR Master nodes. (default: 1000)

- **Enable ResourceManager High Availability** (using [EMR Multi Master](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-ha-launch.html)) for production clusters, to minimize downtime.

- **Monitor ResourceManager Health** Set up alerts for high heap utilization, long GC times, and repeated restarts.

---

### YARN Containers Out of Memory Errors

**Description**

Jobs may fail if the memory allocated to YARN containers is insufficient for the workload’s requirements. This issue is frequently encountered in distributed processing frameworks such as Spark, Hive (Tez), and MapReduce. When a container exceeds its assigned memory limit, YARN will kill the container, leading to job failures or repeated task retries.

**Symptoms**

- Containers killed with messages like: `Container [pid=xxxx,containerID=container_xxx] is running beyond physical memory limits`
- `OutOfMemoryError` exceptions in application or container logs
- Job fails with `killed by YARN for exceeding memory limits` in the ResourceManager or JobHistory UI
- Tasks restart repeatedly or job fails after several retries due to OOM
- Slow performance or “stuck” jobs before crashing

**Investigation**:

- **Review Container and Application Logs** Look for OOM messages and stack traces:

```bash
yarn logs -applicationId <APP_ID> | grep -i "OutOfMemoryError"
yarn logs -applicationId <APP_ID> | grep -i "memory"
```

- **ResourceManager and NodeManager Logs** Check for container kill events and memory limit violations:
```bash
less /var/log/hadoop-yarn/hadoop-yarn-resourcemanager-*.log
less /var/log/hadoop-yarn/hadoop-yarn-nodemanager-*.log
grep -i "exceeded virtual memory" /var/log/hadoop-yarn/yarn-yarn-nodemanager-*.log
```

- **Application UIs** 
    - Spark UI: Review executor and driver memory usage under the “Executors” tab and check for task failures.
    - Job History Server (MapReduce): Look for killed tasks and memory-related errors.

- **Cluster Metrics and Monitoring** Use cluster monitoring dashboards to spot memory pressure, container failures, or node hotspots.

**Resolution**

- **Increase Container Memory Allocation** Adjust memory settings based on application type:
    - **Spark**
        - Increase executor memory: `--executor-memory 4G`
        - Increase driver memory (if driver fails): `--driver-memory 2G`

    - **MapReduce**
        - Set map/reduce memory: `mapreduce.map.memory.mb` and `mapreduce.reduce.memory.mb`

- **Optimize Application Memory Usage**
    - Review code for memory leaks, inefficiencies and large in-memory objects.

- **Tune YARN ResourceManager Settings** 
    - Check that worker nodes have enough RAM to handle the requested container sizes.
    - Ensure YARN allows for higher per-container allocations if required by your application:
    - `yarn.scheduler.maximum-allocation-mb`
    - `yarn.nodemanager.resource.memory-mb`

**Prevention**

- **Test on Smaller Datasets** Run jobs at scale on test data to tune resource requirements before production.
- **Monitor Regularly** Set up alerts on high memory usage, container failures, and node health to catch issues early.

---

### YARN Containers Failures

**Description**

YARN containers may fail to start or crash during execution due to a range of causes, including resource exhaustion, missing dependencies, configuration errors, or issues in the user’s code. External service problems, such as S3 throttling, can also cause tasks to fail or hang, especially when submitting HBase inport / export commands to restore HBase snapshots from an Amazon S3 bucket.

**Symptoms**

- Containers exit with a non-zero exit code (e.g., Container exited with exitCode: 1)
- Application marked as failed in YARN ResourceManager UI
- Error messages like Failed to launch container or Container killed by the ApplicationMaster
- Amazon S3 related errors in containers logs, e.g., `503 Slow Down`, `503 Service Unavailable`

**Investigation**

- **View YARN Application and Container Logs** Get the logs for a specific YARN application:

```bash
yarn logs -applicationId <YARN_APP_ID>
```

Or view individual container logs only:

```bash
yarn logs -applicationId <YARN_APP_ID> -containerId <CONTAINER_ID>
```

- **Check YARN ResourceManager and NodeManager Logs** Look for resource allocation errors or container launch failures:

```bash
# YARN RM on EMR MASTER
less /var/log/hadoop-yarn/hadoop-yarn-resourcemanager-*.log

# YARN NM on EMR CORE and TASK nodes
less /var/log/hadoop-yarn/hadoop-yarn-nodemanager-*.log
grep -i "Failed to launch container" /var/log/hadoop-yarn/hadoop-yarn-nodemanager-*.log
grep -i "exitCode" /var/log/hadoop-yarn/hadoop-yarn-nodemanager-*.log
```

- **Identify S3 Throttling**
```bash
yarn logs -applicationId <YARN_APP_ID> | grep -i "SlowDown"
yarn logs -applicationId <YARN_APP_ID> | grep -i "503"
```

- **Check Cluster Resource Utilization** Use `yarn top`, or cluster monitoring tools to look for resource pressure.

**Resolution**

- **Fix Application Errors** Review stack traces and error messages in container logs. Correct code issues, missing libraries, or input data problems.

- **Resolve S3 Throttling**
    - Review if the bucket is consistently used by mulitple applications that might end up exacerbating throttled requests.
    - Implement or tune [EMRFS Retry Requests](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-spark-emrfs-retry.html) 
    - Contact AWS Support if you observe persistent throttling (look for SlowDown and 503 in logs).


**Prevention**

- **Test Applications in Lower Environments** Validate code and resource settings on a development or staging cluster before running in production.
- **Use Container Isolation and Resource Monitoring** Enable resource isolation (cgroups, YARN container memory/vcore limits) and monitor usage to proactively detect hot spots.

---

## Troubleshooting Commands

This section provides a focused set of commands for collecting system-level diagnostics from a Linux host. These tools are essential for investigating complex issues such as high latency, memory leaks, GC pauses, thread contention, or network bottlenecks. By capturing Java thread dumps, heap dumps, and network traffic, along with relevant system metrics, you gain deeper visibility into HBase process behavior and resource usage. 

Use these commands proactively during incident analysis or performance degradation to gather data for deeper inspection or escalation.

### Java Thread Dump

To capture the current state of all threads in a Java process. Useful for diagnosing deadlocks, thread contention, or long GC pauses.

```bash
# Find the Java PID (e.g., for HBase RegionServer or Master)
jps -l

# Set the PID to analyze and retrieve the user owning the process
PID=<pid>
PID_USER=`ps -o uname= -p "${PID}"`

# Dump threads to stdout
sudo -u $PID_USER jstack $PID

# Save to file
sudo -u $PID_USER jstack $PID > /tmp/thread_dump_${PID}.txt
```

### Java Heap Dump

To capture the entire Java heap for offline analysis of memory leaks or excessive object retention.

```bash
# Find the Java PID (e.g., for HBase RegionServer or Master)
jps -l

# Set the PID to analyze and retrieve the user owning the process
PID=<pid>
PID_USER=`ps -o uname= -p "${PID}"`

# Use jmap to generate heap dump
sudo -u $PID_USER jmap -dump:format=b,file=/tmp/heap_dump_${PID}.hprof ${PID}
```

### Collect Network Traffic

To analyze network-level issues like slow client connections, RPC delays, DNS failures, etc.

```bash
# Use tcpdump to capture all traffic
sudo tcpdump -s 0 -w /tmp/network_traffic.pcap

# Limit to HBase ports (e.g., 16000 for master, 16020 for regionserver)
sudo tcpdump port 16020 -w /tmp/rs_traffic.pcap

# Capture DNS traffic (common issue)
sudo tcpdump port 53 -w /tmp/dns_traffic.pcap
```

### Disk & Filesystem

```bash
# Check available disk space
df -h

# Inode usage
df -i

# List largest files (to debug disk full issues)
du -sh /* 2>/dev/null | sort -hr | head -n 20
```

### Memory & CPU

```bash
# Real-time system resource usage
top

# Memory summary
free -h

# Process-specific memory
ps -p <pid> -o pid,vsz,rss,cmd

# Detailed CPU usage
mpstat -P ALL 1 5
```


### Open Files and File Descriptors

```bash
# Count open files by process
ls /proc/<pid>/fd | wc -l

# List open descriptors (files, connections, etc)
lsof -p <pid> | head

# Check system-wide limits
ulimit -a
cat /proc/sys/fs/file-max
```

### Networking

```bash
# Established connections
ss -tulnp

# Connections by port
netstat -anp | grep 16000

# DNS resolution times (useful when using Custom DNS)
dig hbase-regionserver.example.com +stats
```

### I/O Wait & Performance

```bash
# I/O stats by device
iostat -xz 1 5

# Disk read/write stats
vmstat 1 5
```