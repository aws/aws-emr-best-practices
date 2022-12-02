# ** 5.1 - Spark **

## ** BP 5.1.1  -  Use the most recent version of EMR **

Amazon EMR provides several Spark optimizations out of the box with [EMR Spark runtime](https://aws.amazon.com/blogs/big-data/run-apache-spark-3-0-workloads-1-7-times-faster-with-amazon-emr-runtime-for-apache-spark/) which is 100% compliant with the open source Spark APIs i.e., EMR Spark does not require you to configure anything or change your application code. We continue to [improve](https://aws.amazon.com/about-aws/whats-new/2021/10/amazon-emr-6-4-supports-apache-spark-3-1-2/) the performance of this Spark runtime engine for new releases. Several [optimizations](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-spark-performance.html) such as Adaptive Query Execution are only available from EMR 5.30 and 6.0 versions onwards. For example, following image shows the Spark runtime performance improvements in EMR 6.5.0 (latest version as of writing this) compared to its previous version EMR 6.1.0 based on a derived TPC-DS benchmark test performed on two identical EMR clusters with same hardware and software configurations (except for the version difference).

![BP - 33](images/spark-bp-33.png)

As seen in the above image, Spark runtime engine on EMR 6.5.0 is 1.9x faster by geometric mean compared to EMR 6.1.0. Hence, it is strongly recommended to migrate or upgrade to the latest available Amazon EMR version to make use of all these performance benefits.

Upgrading to a latest EMR version is typically a daunting task - especially major upgrades (for eg: migrating to Spark 3.1 from Spark 2.4). In order to reduce the upgrade cycles, you can make use of [EMR Serverless](https://aws.amazon.com/emr/serverless/) (in preview) to quickly run your application in an upgraded version without worrying about the underlying infrastructure. For example, you can create an EMR Serverless Spark application for EMR release label 6.5.0 and submit your Spark code.

```
aws --region us-east-1 emr-serverless create-application \
    --release-label emr-6.5.0-preview \
    --type 'SPARK' \
    --name spark-6.5.0-demo-application
```
Detailed documentation for running Spark jobs using EMR Serverless can be found [here](https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/spark-jobs.html). Since EMR Serverless and EMR on EC2 will use the same Spark runtime engine for a given EMR release label, once your application runs successfully in EMR Serverless, you can easily port your application code to the same release version on EMR. Please note that this approach does not factor in variables due to infrastructure or deployment into consideration and is only meant to validate your application code quickly on an upgraded Spark version in the latest Amazon EMR release available.

## ** BP 5.1.2  -  Determine right infrastructure for your Spark workloads **

Spark workloads may require different types of hardware for different job characteristics to ensure optimal performance. EMR supports [several instance types](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-supported-instance-types.html) to cover all types of processing requirements. While onboarding new workloads, it is recommended to start benchmarking with general instance types like m5s or m6gs. Monitor the OS and YARN metrics from Ganglia and CloudWatch to determine the system bottlenecks at peak load. Bottlenecks include CPU, memory, storage and I/O. Once identified, choose the appropriate hardware type for your job requirements.

### Memory-optimized
Memory-optimized instances like r5 and r4 are good candidates for memory intensive workloads. Spark jobs that cache large DataFrames, Datasets or RDDs, perform operations like joins and unions on large tables, use many internal or user-defined broadcast variables or accumulators, go through many GC cycles and perform massive shuffles are likely to be memory intensive. Following diagram shows YARN memory available percentage and aggregated OS memory utilization from Cloudwatch EMR namespace and Ganglia respectively.

![BP - 1](images/spark-bp-1.png)

### CPU-optimized
CPU-optimized instances like c5 and c4 are good candidates for CPU intensive workloads. Spark jobs with complex aggregate operations involving many in-built arithmetic functions or UDFs and jobs that use a lot of LRU caches are likely to be CPU intensive. Following screenshot shows aggregated CPU utilization of the EMR cluster from Ganglia.

![BP - 2](images/spark-bp-2.png)

### General purpose
General purpose instances like m5 and m4 are good candidates for a mix of CPU and memory intensive workloads. They are also great for benchmarking and onboarding your Spark applications. Following sheet outlines the CPU:Memory ratio of 3 different instances types at a similar price. It is important to use instance types with right CPU:memory ratio based on your workload needs.

| Instance Type | Instance | EC2 price | EMR price | Cores | Memory in GiB | CPU:memory ratio |
--------|----------------|------------|-----------|--------|------------|------------|
| Compute | c5.18xlarge |  $3.06 |  $0.27 | 72 | 144 | 2 |
| Memory | r5.12xlarge |  $3.02 |  $0.27 | 48 | 384 | 8 |
| General | m5.16xlarge |  $3.07 | $0.27 | 64 | 256 | 4 |

### Storage-optimized
Storage-optimized instances like i3ens, d2 are good candidates for I/O intensive workloads. If your use case is CPU/memory bound but also consumes a lot of I/O, and demands high disk throughput or low read or write latencies from transient HDFS storage, you can consider using instances backed by SSD volumes like r5ds, c5ds, m5ds etc.. Spark jobs that perform massive shuffles may also benefit from instance types with optimized storage since Spark external shuffle service will write the shuffle data blocks to the local disks of worker nodes running the executors.

### GPU instances
GPU instances such as p3 family are typically used for Spark ML and intensive analytical workloads like image processing. From EMR 6.2, you can make use of [Nvidia RAPIDS accelerator](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-spark-rapids.html) plugin to improve your GPU instance performance without any changes to your code or data processing pipelines.

### Graviton instances
Starting EMR 5.31+ and 6.1+, EMR supports Graviton instance (eg: r6g, m6g, c6g) which offers up to 15% improvement in performance and 30% reduction in cost based on our derived benchmark tests. They are a great choice to replace your legacy instances and achieve better price-performance.

![BP - 3](images/spark-bp-3.png)

## ** BP 5.1.3  -  Choose the right deploy mode **

Spark offers two kinds of deploy modes called client and cluster deploy modes. Spark deploy mode determines where your application's Spark driver runs. Spark driver is the cockpit for your Spark application. It hosts the SparkContext (or SparkSession) for your application. It keeps track of the statuses of all the tasks and executors via heartbeats. Spark driver also fetches the results from the executors running tasks. Choose the right deploy mode based on your workload requirements.

### Client deploy mode

This is the default deploy mode for Spark applications in EMR. In this deploy mode, the driver process will be launched within your Spark client - whether you submit your application from EMR master node (using EMR Step API or spark-submit) or using a remote client. In this case, Spark driver will be the single point of failure. A failed Spark driver process will not be retried in client deploy mode. Also, when client loses connectivity with YARN, your job will be killed.

![BP - 4](images/spark-bp-4.png)

Use this deploy mode if :-
* You are running only one or two Spark applications at a time in a cluster. This deploy mode is not ideal if you are running multiple applications at the same time on the same cluster since all those Spark drivers running on a single master/remote node can lead to resource contention.
* You want to be more in control of your Spark driver configurations. In client mode, Spark driver resources will not compete with YARN resources and can be adjusted separately without affecting the YARN resource procurement of your applications.
* You are running too many executors (1000+) or tasks (30000+) in a single application. Since Spark driver manages and monitors all the tasks and executors of an application, too many executors/tasks may slow down the Spark driver significantly while polling for statuses. Since EMR allows you to specify a different instance type for master node, you can choose a very powerful instance like z1d and reserve a large amount of memory and CPU resources for the Spark driver process managing too many executors and tasks from an application.
* You want to write output to the console i.e., send the results back to the client program where you submitted your application.
* Notebook applications such as Jupyter, Zeppelin etc. will use client deploy mode.

### Cluster deploy mode

In cluster deploy mode, your Spark driver will be located within the Application Master (AM) container from YARN regardless of where you submit your Spark application from.

![BP - 5](images/spark-bp-5.png)

Use cluster deploy mode if :-
* You are submitting multiple applications at the same time or have higher application or EMR step concurrency. While running multiple applications, Spark drivers will be spread across the cluster since AM container from a single application will be launched on one of the worker nodes.
* There are relatively fewer number of executors per application. i.e., the Spark driver process does not have to do intensive operations like manage and monitor tasks from too many executors.
* You are saving results in S3/HDFS and there is no need to print output to the console.
* You want to specify detailed instructions on where AM runs. You can launch AMs on CORE partition or both CORE and TASK partitions based on where you want your AM and executors to launch. For example, you can run AM on only on-demand CORE nodes and executors only on spot task nodes.
* You want to relaunch a failed driver JVM i.e., increased resiliency. By default, YARN re-attempts AM loss twice based on property *spark.yarn.maxAppAttempts*. You can increase this value further if needed.
* You want to ensure that termination of your Spark client will not lead to termination of your application. You can also have Spark client return success status right after the job submission if the property *spark.yarn.submit.waitAppCompletion* is set to "false".

Regardless of which deploy mode you choose, make sure that your driver Spark configs are tuned for your workload needs.

## ** BP 5.1.4  -  Use right file formats and compression type **

Right file formats must be used for optimal performance. Avoid legacy file formats like CSV, JSON, text files etc. since the read/write performance will much slower. It is highly recommended that you use columnar file formats like Parquet and ORC. For Spark, Parquet file format would be the best choice considering performance benefits and wider community support.

When writing Parquet files to S3, EMR Spark will use [EMRFSOutputCommitter](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-spark-s3-optimized-committer.html) which is an optimized file committer that is more performant and resilient than FileOutputCommitter. Using Parquet file format is great for schema evolution, filter push downs and integration with applications offering transactional support like Apache Hudi, Apache Iceberg etc.

Also, it is recommended to use an optimal compression format. Avoid using unsplittable compression formats like GZIP. Since they are not splittable, when a Spark task processes a large GZIP compressed file, it will lead to executor OOM errors.

![BP - 6](images/spark-bp-6.png)

Use splittable compression formats like BZ2, LZO etc. Parquet uses Snappy compression by default. ORC uses ZLIB compression by default. Both compression types are good choices and you can continue to use the defaults.

![BP - 7](images/spark-bp-7.png)

You can also apply columnar encryption on Parquet files using KMS.
```
sc.hadoopConfiguration.set("parquet.encryption.kms.client.class" ,"org.apache.parquet.crypto.keytools.mocks.InMemoryKMS")
// Explicit master keys (base64 encoded) - required only for mock InMemoryKMS
sc.hadoopConfiguration.set("parquet.encryption.key.list" ,"keyA:AAECAwQFBgcICQoLDA0ODw== ,  keyB:AAECAAECAAECAAECAAECAA==")
// Activate Parquet encryption, driven by Hadoop properties
sc.hadoopConfiguration.set("parquet.crypto.factory.class" ,"org.apache.parquet.crypto.keytools.PropertiesDrivenCryptoFactory")
// Write encrypted dataframe files.
// Column "square" will be protected with master key "keyA".
// Parquet file footers will be protected with master key "keyB"
squaresDF.write.option("parquet.encryption.column.keys" , "keyA:square").option("parquet.encryption.footer.key" , "keyB").parquet("/path/to/table.parquet.encrypted")
// Read encrypted dataframe files
val df2 = spark.read.parquet("/path/to/table.parquet.encrypted")
```

## ** BP 5.1.5  -  Partitioning **

Partitioning your data or tables is very important if you are going to run your code or queries with filter conditions. Partitioning helps arrange your data files into different S3 prefixes or HDFS folders based on the partition key. It helps minimize read/write access footprint i.e., you will be able to read files only from the partition folder specified in your where clause - thus avoiding a costly full table scan. Partitioning can also help if your data ingestion is incremental in nature. However, partitioning can reduce read throughput when you perform full table scans.

You can choose one or more partition fields from your dataset or table columns based on :-

* Query pattern. i.e., if you find queries use one or more columns frequently in the filter conditions more so than other columns, it is recommended to consider leveraging them as partitioning field.
* Ingestion pattern. i.e., if you are loading data into your table based on a fixed schedule (eg: once everyday) and you want to avoid re-writing historical data, you can partition your data based on date field (typically in YYYY-MM-DD format or YYYY/MM/DD nested partitions).
* Cardinality of the partitioning column. For partitioning, cardinality should not be too high. For example, fields like employee_id or uuid should not be chosen as partition fields.
* File sizes per partition. It is recommended that your individual file sizes within each partition are >=128 MB.

The number of shuffle partitions will determine the number of output files per table partition.
```
df.repartition(400).write.partitionBy("datecol").parquet("s3://bucket/output/")
```
The above code will create maximum of 400 files per datecol partition. Repartition API alters the number of shuffle partitions dynamically. PartitionBy API specifies the partition column(s) of the table. You can also control the number of shuffle partitions with the Spark property *spark.sql.shuffle.partitions*. You can use repartition API to control the output file size i.e., for merging small files. For splitting large files, you can use the property *spark.sql.files.maxPartitionBytes*.

Partitioning ensures that [dynamic partition pruning](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-spark-performance.html#emr-spark-performance-dynamic) takes place during reads and writes. Pruning makes sure that only necessary partition(s) are read from S3 or HDFS. Spark optimized logical plan or DAG can be studied to ensure that the partition filters are pushed down while reading and writing to partitioned tables from Spark.

For example, following query will push partition filters for better performance. l_shipdate and l_shipmode are partition fields of the table "testdb.lineitem_shipmodesuppkey_part".

```
val df = spark.sql("select count(*) from testdb.lineitem_shipmodesuppkey_part where l_shipdate='1993-12-03' and l_shipmode='SHIP'")

df.queryExecution.toString
```
Printing the query execution plan where we can see pushed filters for the two partition fields in where clause:
```
== Physical Plan ==
AdaptiveSparkPlan isFinalPlan=true
+- == Final Plan ==
   *(2) HashAggregate(keys=[], functions=[count(1)], output=[count(1)#320])
   +- ShuffleQueryStage 0
      +- Exchange SinglePartition, ENSURE_REQUIREMENTS, [id=#198]
         +- *(1) HashAggregate(keys=[], functions=[partial_count(1)], output=[count#318L])
            +- *(1) Project
               +- *(1) ColumnarToRow
                  +- FileScan orc testdb.lineitem_shipmodesuppkey_part[l_shipdate#313,l_shipmode#314] Batched: true, DataFilters: [], Format: ORC, Location: InMemoryFileIndex[s3://vasveena-test-vanguard/bigtpcparq/lineitem_shipmodesuppkey_part/l_shipdate..., PartitionFilters: [isnotnull(l_shipdate#313), isnotnull(l_shipmode#314), (l_shipdate#313 = 1993-12-03), (l_shipmode..., PushedFilters: [], ReadSchema: struct<>
+- == Initial Plan ==
   HashAggregate(keys=[], functions=[count(1)], output=[count(1)#320])
   +- Exchange SinglePartition, ENSURE_REQUIREMENTS, [id=#179]
      +- HashAggregate(keys=[], functions=[partial_count(1)], output=[count#318L])
         +- Project
            +- FileScan orc testdb.lineitem_shipmodesuppkey_part[l_shipdate#313,l_shipmode#314] Batched: true, DataFilters: [], Format: ORC, Location: InMemoryFileIndex[s3://vasveena-test-vanguard/bigtpcparq/lineitem_shipmodesuppkey_part/l_shipdate..., PartitionFilters: [isnotnull(l_shipdate#313), isnotnull(l_shipmode#314), (l_shipdate#313 = 1993-12-03), (l_shipmode..., PushedFilters: [], ReadSchema: struct<>
```

## ** BP 5.1.6 -  Tune driver/executor memory, cores and spark.sql.shuffle.partitions to fully utilize cluster resources **

Amazon EMR configures Spark defaults during the cluster launch based on your cluster's infrastructure (number of instances and instance types). EMR configured defaults are generally sufficient for majority of the workloads. However, if it is not meeting your performance expectations, it is recommended to tune the Spark driver/executor configurations and see if you can achieve better performance. Following are the general recommendations on driver/executor configuration tuning.

For a starting point, generally, it is advisable to set *spark.executor.cores* to 4 or 5 and tune *spark.executor.memory* around this value. Also, when you calculate the *spark.executor.memory*, you need to account for the executor overhead which is set to 0.1875 by default (i.e., 18.75% of *spark.executor.memory*). For example, for a 2 worker node r4.8xlarge cluster, following will be the configurations.

Based on [Task Configurations](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-hadoop-task-config.html) r4.8xlarge node has YARN memory of 241664 MB (based on the value of *yarn.nodemanager.resource.memory-mb*). The instance has 32 vCores. If we set *spark.executor.cores* as 4, we can run 8 executors at a time. So, the configurations will be following.

*spark.executor.cores* = 4

*spark.executor.memory* + (*spark.executor.memory* * *spark.yarn.executor.memoryOverheadFactor*) = (241664 MB / 8) = 30208 MB

*spark.executor.memory* = 24544 MB (substituting default *spark.yarn.executor.memoryOverheadFactor*=0.1875)

If you have a cluster of 10 r4.8xlarge nodes, then totally, 80 executors can run with 24544 MB memory and 4 vCores each.

Please note that some of the jobs benefit from bigger executor JVMs (with more cores assigned). Some jobs benefit from smaller but more number of executors. So, you can use the above formula to arrive at optimal values for your application. EMR Spark has a feature called [maximizeResourceAllocation](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-spark-configure.html#emr-spark-maximizeresourceallocation). Setting this property to "true" will lead to one fat executor JVM per node that uses all of the available cores in that instance. However, please note that this setting may not prove to be optimal for many different types of workloads. It is not recommended to enable this property if your cluster is a shared cluster with multiple parallel applications or if your cluster has HBase installed.

After configuring the values, run a sample job and monitor the Resource Manager UI, ContainerPendingRatio and YARNMemoryAvailablePcnt Cloudwatch metrics to verify that the vCores and YARN memory are being fully utilized. [Spark JMX metrics](https://spark.apache.org/docs/latest/monitoring.html) provides JMX level visibility which is the best way to determine resource utilization.

While using instance fleets, it is generally advisable to request worker nodes with similar vCore:memory ratio (for eg: requesting r4, r5 and r6gs in the same fleet). However, in some cases, in order to ensure capacity, you may have to diversify the instance type families as well in your request (for eg: requesting c5s, m5s and r5s within the same fleet). EMR will configure driver/executor configurations based on minimum of (master, core, task) OS resources. Generally, with variable fleets, it is best to use the default configurations. However, if needed, you can fine tune the driver and executor configurations based on above principles. But in this case, you will need to take YARN memory and vCores of all the different instance families into consideration.

To provide an example, lets say you have requested a cluster with a core fleet containing following instances: r5.4xlarge, r5.12xlarge, c5.4xlarge, c5.12xlarge, m5.4xlarge, m5.12xlarge. All the 4xlarge instances in this fleet have 16 vCores and 12xlarge instances have 48 vCores. But the OS/YARN memory of these instances are different.

| Instance | YARN memory in MB |
|----------------|------------|
| c5.4xlarge | 24576 |
| c5.12xlarge | 90112 |
| m5.4xlarge | 57344 |
| m5.12xlarge | 188416 |
| r5.4xlarge | 122880 |
| r5.12xlarge | 385024 |

Now, let us calculate executor memory after setting *spark.executor.cores* = 4 by starting with smallest YARN memory from the above table (c5.4xlarge) and dividing the YARN memory by *spark.executor.cores* to get the total container size -> 24576 / 4 = 6144.

*spark.executor.memory* = 6144 - (6144 * 0.1875) = 4992 MB

Using default Spark implementation, with the above math, if you set 4992 MB as executor memory, then in r5.12xlarge instances in your fleet, the resources will be under utilized even though you will not see the evidence of it from the Resource Manager UI. With the above configs, 77 executors can run in r5.12xlarge but there are only 48 vCores. So, even though 77 executors will have YARN resources allocated, they are only able to run 48 tasks at any given time which could be considered a wastage of memory resources.

In order to alleviate this issue, from EMR 5.32 and EMR 6.2, there is a feature called Heterogenous Executors which dynamically calculates executor sizes. It is defined by the property *spark.yarn.heterogeneousExecutors.enabled* and is set to "true" by default. Further, you will be able to control the maximum resources allocated to each executor with properties *spark.executor.maxMemory* and *spark.executor.maxCores*. Minimum resources are calculated with *spark.executor.cores* and *spark.executor.memory*. For uniform instance groups or for flexible fleets with instance types having similar vCore:memory ratio, you can try setting *spark.yarn.heterogeneousExecutors.enabled* to "false" and see if you get better performance.

Similar to executors, driver memory and vCores can be calculated as well. The default memory overhead for driver container is 10% of driver memory. If you are using cluster deploy mode, then the driver resources will be allocated from one of the worker nodes. So, based on the driver memory/core configurations, it will take away some of the YARN resources that could be used for launching executors - which shouldn't matter that much if your cluster is not very small. If you are using client deploy mode and submitting jobs from EMR master node or a remote server, then the driver resources are taken from the master node or remote server and your driver will not compete for YARN resources used by executor JVMs. The default driver memory (without maximizeResourceAllocation) is 2 GB. You can increase driver memory or cores for the following conditions:

1. Your cluster size is very large and there are many executors (1000+) that need to send heartbeats to driver.
2. Your result size retrieved during Spark actions such as collect() or take() is very large. For this, you will also need to tune *spark.driver.maxResultSize*.

You can use smaller driver memory (or use the default *spark.driver.memory*) if you are running multiple jobs in parallel.

Now, coming to *spark.sql.shuffle.partitions* for Dataframes and Datasets and *spark.default.parallelism* for RDDs, it is recommended to set this value to total number of vCores in your cluster or a multiple of that value. For example, a 10 core node r4.8xlarge cluster can accommodate 320 vCores in total. Hence, you can set shuffle partitions or parallelism to 320 or a multiple of 320 such that each vCore handles a single Spark partition at any given time. It is not recommended to set this value too high or too low. Generally 1 or 2x the total number of vCores is optimal. Generally, each Spark shuffle partition should process ~128 MB of data. This can be determined by looking at the execution plan from the Spark UI.

![BP - 16](images/spark-bp-16.png)

From the above image, you can see that the average size in exchange (shuffle) is 2.2 KB which means we can try to reduce *spark.sql.shuffle.partitions* to increase partition size during the exchange.

Apart from this, if you want to use tools to receive tuning suggestions, consider using [Sparklens and Dr. Elephant](https://aws.amazon.com/blogs/big-data/tune-hadoop-and-spark-performance-with-dr-elephant-and-sparklens-on-amazon-emr/) with Amazon EMR which will provide tuning suggestions based on metrics collected during the runtime of your application.

## ** BP 5.1.7 -  Use Kryo serializer by registering custom classes especially for Dataset schemas **

Spark uses Java Serializer by default. From Spark 2.0+, Spark internally uses Kryo Serializer when shuffling RDDs with simple types, arrays of simple types, or string type. It is highly recommended that you use Kryo Serializer and also register your classes in the application.
```
val spark = SparkSession
                  .builder
                  .appName("my spark application name")
                  .config(getConfig)
                  .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
                  // use this if you need to increment Kryo buffer size. Default 64k
                  .config("spark.kryoserializer.buffer", "1024k")
                  // use this if you need to increment Kryo buffer max size. Default 64m
                  .config("spark.kryoserializer.buffer.max", "1024m")
                  /*
                  * Use this if you need to register all Kryo required classes.
                  * If it is false, you do not need register any class for Kryo, but it will increase your data size when the data is serializing.
                  */
                  .config("spark.kryo.registrationRequired", "true")
                  .getOrCreate
```
If you do not specify classesToRegister, then there will be a Kryo conversion overhead which could impact performance. Hence, it is recommended to register Kryo classes in your application. Especially, if you are using Datasets, consider registering your Dataset schema classes along with some classes used by Spark internally based on the data types and structures used in your program. An example provided below:
```
val conf = new SparkConf()
        conf.registerKryoClasses(
          Array(
            classOf[org.myPackage.FlightDataset],
            classOf[org.myPackage.BookingDataset],
            classOf[scala.collection.mutable.WrappedArray.ofRef[_]],
            classOf[org.apache.spark.sql.types.StructType],
            classOf[Array[org.apache.spark.sql.types.StructType]],
            classOf[org.apache.spark.sql.types.StructField],
            classOf[Array[org.apache.spark.sql.types.StructField]],
            Class.forName("org.apache.spark.sql.types.StringType$"),
            Class.forName("org.apache.spark.sql.types.LongType$"),
            Class.forName("org.apache.spark.sql.types.BooleanType$"),
            Class.forName("org.apache.spark.sql.types.DoubleType$"),
            classOf[org.apache.spark.sql.types.Metadata],
            classOf[org.apache.spark.sql.types.ArrayType],
            Class.forName("org.apache.spark.sql.execution.joins.UnsafeHashedRelation"),
            classOf[org.apache.spark.sql.catalyst.InternalRow],
            classOf[Array[org.apache.spark.sql.catalyst.InternalRow]],
            classOf[org.apache.spark.sql.catalyst.expressions.UnsafeRow],
            Class.forName("org.apache.spark.sql.execution.joins.LongHashedRelation"),
            Class.forName("org.apache.spark.sql.execution.joins.LongToUnsafeRowMap"),
            classOf[org.apache.spark.util.collection.BitSet],
            classOf[org.apache.spark.sql.types.DataType],
            classOf[Array[org.apache.spark.sql.types.DataType]],
            Class.forName("org.apache.spark.sql.types.NullType$"),
            Class.forName("org.apache.spark.sql.types.IntegerType$"),
            Class.forName("org.apache.spark.sql.types.TimestampType$"),
            Class.forName("org.apache.spark.sql.execution.datasources.FileFormatWriter$WriteTaskResult"),
            Class.forName("org.apache.spark.internal.io.FileCommitProtocol$TaskCommitMessage"),
            Class.forName("scala.collection.immutable.Set$EmptySet$"),
            Class.forName("scala.reflect.ClassTag$$anon$1"),
            Class.forName("java.lang.Class")
          )
        )
    }
```
You can also optionally fine tune the following Kryo configs :-

*spark.kryo.unsafe* - Set to false for faster serialization. This is not unsafer for same platforms but should not be used if your EMR cluster fleets use a mix of different processors (for eg: AMD, Graviton and Intel types within the same fleet).
*spark.kryoserializer.buffer.max* - Maximum size of Kryo buffer. Default is 64m. Recommended to increase this property upto 1024m but the value should be below 2048m.
*spark.kryoserializer.buffer* - Initial size of Kryo serialization buffer. Default is 64k. Recommended to increase up to 1024k.

## ** BP 5.1.8  -   Tune Garbage Collector **

By default, EMR Spark uses Parallel Garbage Collector which works well in most cases. You can change the GC to G1GC if your GC cycles are slow since G1GC may provide better performance in some cases specifically by reducing GC pause times. Also, since G1GC is the default garbage collector since Java 9, you may want to switch to G1GC for forward compatibility.

Following is the spark configuration :-
```
[{
"classification": "spark-defaults",
"properties": {
    "spark.executor.extraJavaOptions": "-XX:+UseG1GC -XX:+UnlockDiagnosticVMOptions -XX:+G1SummarizeConcMark -XX:InitiatingHeapOccupancyPercent=35 -verbose:gc -XX:+PrintGCDetails -XX:+PrintGCDateStamps -XX:OnOutOfMemoryError='kill -9 %p'",
    "spark.driver.extraJavaOptions": "-XX:+UseG1GC -XX:+UnlockDiagnosticVMOptions -XX:+G1SummarizeConcMark -XX:InitiatingHeapOccupancyPercent=35 -verbose:gc -XX:+PrintGCDetails -XX:+PrintGCDateStamps -XX:OnOutOfMemoryError='kill -9 %p'"
},
"configurations": []
}]
```
You can also tune the GC parameters for better GC performance. You can see the comprehensive list of parameters [here](https://www.oracle.com/technical-resources/articles/java/g1gc.html) for G1GC and [here](https://docs.oracle.com/en/java/javase/11/gctuning/parallel-collector1.html) for ParallelGC. Some useful ones are below :-

-XX:ConcGCThreads=n
-XX:ParallelGCThreads=n
-XX:InitiatingHeapOccupancyPercent=45
-XX:MaxGCPauseMillis=200

You can monitor GC performance using Spark UI. The GC time should be ideally <= 1% of total task runtime. If not, consider tuning the GC settings or experiment with larger executor sizes. For example, we see below in the Spark UI that GC takes almost 25% of task runtime which is indicative of poor GC performance.

![BP - 8](images/spark-bp-8.png)

## ** BP 5.1.9  -   Use optimal APIs wherever possible **

When using Spark APIs, try to use the optimal ones if your use case permits. Following are a few examples.

### repartition vs coalesce

Both repartition and coalesce are used for changing the number of shuffle partitions dynamically. Repartition is used for both increasing and decreasing the shuffle partitions whereas coalesce is used for only decreasing the number of shuffle partitions. If your goal is to decrease the number of shuffle partitions, consider using coalesce instead of repartition. Repartition triggers a full shuffle but coalesce triggers only a partial shuffle and thus minimizes the amount of data shuffled by keeping a few nodes as solely receivers of the shuffle data.
```
df.coalesce(1) //instead of df.repartition(1)
```
But please note that when you coalesce (or repartition) to a very small number, your JVM will process a lot of data which can lead to OOM issues or disk space issues due to shuffle spill.

### groupByKey vs reduceByKey

Use reduceByKey instead of groupByKey wherever possible. With groupByKey, data will be transferred over the network and collected on the reduced workers. This can lead to OOMs since all data is sent across the network. Whereas, with reduceByKey, data is combined at partition-level, with only one output for one key at each partition to send over the network.

### orderBy vs sortBy or sortWithinPartitions

orderBy performs global sorting. i.e., all the data is sorted using a single JVM. Whereas, sortBy or sortWithinPartitions performs local sorting i.e., data is sorted within each partition but it does not preserve global ordering. Use sortBy or sortWithinPartitions if global ordering is not necessary. Try to avoid orderBy clause especially during writes.

## ** BP 5.1.10 -   Leverage spot nodes with managed autoscaling **

Enable managed autoscaling for your EMR clusters. From EMR 5.32 and EMR 6.2, several optimizations have been made to managed scaling to make it more resilient for your Spark workloads. It is not recommended to use Spot with core or master nodes since during a Spot reclaimation event, your cluster could be terminated and you would need to re-process all the work. Try to leverage task instance fleets with many instance types per fleet along with Spot since it would give both cost and performance gains. However, in this case, make sure that your output is being written directly to S3 using EMRFS since we will aim to have limited/fixed core node capacity.

Following policy defines max core nodes to 2 and we are requesting the core nodes to be on-demand as recommended. Rest of the nodes are Spot task nodes.

![BP - 9](images/spark-bp-9.png)

Following experimentation illustrates the performance gains using Managed Autoscaling.

![BP - 10](images/spark-bp-10.png)

For some of our Spark workloads, we observed ~50% gains compared to custom autoscaling clusters. Please note that the results may vary for your workloads.

![BP - 11](images/spark-bp-11.png)

If your workloads are SLA sensitive and fault intolerant, it is best to use on-demand nodes for task fleets as well since reclaimation of Spot may lead to re-computation of one or more stages or tasks.

## ** BP 5.1.11  -   For workloads with predictable pattern, consider disabling dynamic allocation **

Dynamic allocation is enabled in EMR by default. It is a great feature for following cases:

1. Workloads processing variable amount of data  
2. When your cluster uses autoscaling
3. Dynamic processing requirements or unpredictable workload patterns
4. Streaming and ad-hoc workloads
5. When your cluster runs multiple concurrent applications
6. Your cluster is long-running

The above cases would cover at least 95% of the workloads run by our customers today. However, there are a very few cases where:

1. Workloads have a very predicatable pattern
2. Amount of data processed is predictable and consistent throughout the application
3. Cluster runs Spark application in batch mode
4. Clusters are transient and are of fixed size (no autoscaling)
5. Application processing is relatively uniform. Workload is not spikey in nature.

For example, you may have a use case where you are collecting weather information of certain geo regions twice a day. In this case, your data load will be predictable and you may run two batch jobs per day - one at BOD and one at EOD. Also, you may use two transient EMR clusters to process these two jobs.  

For such use cases, you can consider disabling dynamic allocation along with setting the precise  number and size of executors and cores like below.

```
[{
    "classification": "spark-defaults",
    "properties": {
        "spark.dynamicAllocation.enabled": "false",
        "spark.executor.instances": "12",
        "spark.executor.memory": "8G",
        "spark.executor.cores": "4"
    },
    "configurations": []
}]
```
Please note that if you are running more than one application at a time, you may need to tweak the Spark executor configurations to allocate resources to them. By disabling dynamic allocation, Spark driver or YARN Application Master does not have to calculate resource requirements at runtime or collect certain heuristics. This may save anywhere from 5-10% of job execution time. However, you will need to carefully plan Spark executor configurations in order to ensure that your entire cluster is being utilized. If you choose to do this, then it is better to disable autoscaling since your cluster only runs a fixed number of executors at any given time unless your cluster runs other applications as well.

However, only consider this option if your workloads meet the above criteria since otherwise your jobs may fail due to lack of resources or you may end up wasting your cluster resources.

## ** BP 5.1.12  -   Leverage HDFS as temporary storage for I/O intensive workloads **

Many EMR users directly read and write data to S3. This is generally suited for most type of use cases. However, for I/O intensive and SLA sensitive workflows, this approach may prove to be slow - especially during heavy writes.

![BP - 12](images/spark-bp-12.png)

For I/O intensive workloads or for workloads where the intermediate data from transformations is much larger than the final output, you can leverage HDFS as temporary storage and then use S3DistCp to copy the data into final location once your application is finished. For example, for a fraud detection use case, you could be performing transforms on TBs of data but your final output report may only be a few KBs. In such cases, leveraging HDFS will give you better performance and will also help you avoid S3 throttling errors.

![BP - 13](images/spark-bp-13.png)

Following is an example where we leverage HDFS for intermediate results. A Spark context could be shared between multiple workflows, wherein, each workflow comprises of multiple transformations. After all transformations are complete, each workflow would write the output to an sHDFS location. Once all workflows are complete, you can save the final output to S3 either using S3DistCp or simple S3 boto3 client determined by the number of files and the output size.

![BP - 14](images/spark-bp-14.png)

However, while using this architecture, please make sure that you are sizing your HDFS properly to prevent job failures due to lack of storage space when the job is running. Refer to best practice BP 2.13 in Reliability section. Also, checkpoint your data frequently to S3 using S3DistCp or boto to prevent data loss due to unexpected cluster terminations.

Even if you are using S3 directly to store your data, if your workloads are shuffle intensive, use storage optimized instances or SSD/NVMe based storage (for example: r5d’s and r6gd’s instead of r5s and r6g’s). This is because when dynamic allocation is turned on, Spark will use external shuffle service that spills data to local disks when the executor JVM cannot hold any more shuffle data. This process is a very I/O intensive one and will benefit from instance types that offer high disk throughput.

## ** BP 5.1.13  -   Spark speculation with EMRFS **

In Hadoop/Spark, speculative execution is a concept where a slower task will be launched in parallel on another node using a different JVM (based on resource availability). Whichever task completes first (original or speculated task), will write the output to S3. This works well for HDFS based writes. However, for EMRFS, turning on spark.speculation may lead to serious issues such as data loss or duplicate data. By default, *spark.speculation* is turned off. Only enable *spark.speculation* if you are doing one of the following.

* Writing Parquet files to S3 using EMRFSOutputCommitter
* Using HDFS as temporary storage in an understanding that final output will be written to S3 using S3DistCp
* Using HDFS as storage (not recommended)

**Do not enable *spark.speculation* if none of the above criteria is met since it will lead to incorrect or missing or duplicate data.**

You can consider enabling *spark.speculation* especially while running workloads on very large clusters, provided you are performing one of the above actions. This is because, due to some hardware or software issues, one node out of 500+ nodes could be slower and may run tasks slowly even if data size being processed is the same as other tasks. Chances of this happening are higher in larger clusters. In that case, *spark.speculation* will help relaunch those slow tasks on other nodes providing SLA consistency (as long as the above criteria are met).

You can set *spark.speculation* to true in spark-defaults or pass it as a command line option (--conf *spark.speculation*="true").

```
[{
    "classification": "spark-defaults",
    "properties": {
        "spark.speculation": "true"
    },
    "configurations": []
}]
```

Please do not enable *spark.speculation* if you are writing any non-Parquet files to S3 or if you are writing Parquet files to S3 without the default EMRFSOutputCommitter.

## ** BP 5.1.14 -   Data quality and integrity checks with deequ **

Spark and Hadoop frameworks do not inherently guarantee data integrity. While it is very rare, you may observe some data corruption or missing data or duplicate data due to unexpected errors in the hardware and software stack. It is highly recommended that you validate the integrity and quality of your data atleast once after your job execution. It would be best to check for data correctness in multiple stages of your job - especially if your job is long-running.

In order to check data integrity, consider using [Deequ](https://github.com/awslabs/deequ) for your Spark workloads. Following are some blogs that can help you get started with Deequ for Spark workloads.

[Test data quality at scale with Deequ | AWS Big Data Blog](https://aws.amazon.com/blogs/big-data/test-data-quality-at-scale-with-deequ/)

[Testing data quality at scale with PyDeequ | AWS Big Data Blog](https://aws.amazon.com/blogs/big-data/testing-data-quality-at-scale-with-pydeequ/)

Sometimes, you may have to write your own validation logic. For example, if you are doing a lot of calculations or aggregations, you will need to compute twice and compare the two results for accuracy. In other cases, you may also implement checksum on data computed and compare it with the checksum on data written to disk or S3. If you see unexpected results, then check your Spark UI and see if you are getting too many task failures from a single node by sorting the Task list based on "Status" and check for error message of failed tasks. If you are seeing too many random unexpected errors such as "ArrayIndexOutOfBounds" or checksum errors from a single node, then it may be possible that the node is impaired. Exclude or terminate this node and re-start your job.

## ** BP 5.1.15 -   Use DataFrames wherever possible **

WKT we must use Dataframes and Datasets instead of RDDs since Dataframes and Datasets have several enhancements over RDDs like catalyst optimizer and adaptive query execution. But between Datasets and Dataframes, Dataframes perform certain optimizations during DAG creation and execution. These optimizations can be identified by inspecting the query plan. For example -

* Datasets perform many serializations and deserializations that Dataframes tries to skip.
* Dataframes perform more push downs when compared to Datasets. For example, if there is a filter operation, it is applied early on in the query plan in Dataframes so that the data transfer in-memory is reduced.
* Dataframes avoid unnecessary exchanges. For example, distinct after join will be accomplished with two exchanges in Datasets but with only one exchange in Dataframes.

Only downside to using dataframes instead of datasets is that, with dataset, you generally define schema in a class.

```
case class DeviceIoTData (
  battery_level: Long,
  c02_level: Long,
  cca2: String,
  cca3: String,
  cn: String,
  device_id: Long,
  device_name: String,
  humidity: Long,
  ip: String,
  latitude: Double,
  longitude: Double,
  scale: String,
  temp: Long,
  timestamp: Long
)
```
This provides you type-safety. When there are changes to your schema, it can be consolidated and tracked within a single class. This can be considered as the industry standard. While using Spark Dataframes, you can achieve something similar by maintaining the table columns in a list and fetching from that list dynamically from your code. But this requires some additional coding effort.

## ** BP 5.1.16  -   Data Skew **

Data skew can significantly slow down the processing since a single JVM could be handling a large amount of data. In this case, as observed in Spark UI, a single task is processing 25 times more data than other tasks. This can inevitably lead to slowness, OOMs and disk space filling issues.

![BP - 15](images/spark-bp-15.png)

When there is a data skew, it is best handled at code level since very little can be done in terms of configuration. You can increase JVM size or use one fat executor per node in order to prevent OOMs to the best of ability. But this will impact other running tasks and also will not improve your job performance since one task uses only one vCPU. Following are some of the common strategies to mitigate data skew at code level.

### Salting
Salting is one of the most common skew mitigation techniques where you add a "salt" to the skewed column say "col1". You can split it into multiple columns like "col1_0","col1_1","col1_2" and so on. As number of salts increase, the skew decreases i.e., more parallelism of tasks can be achieved.

**Original data**

![BP - 17](images/spark-bp-17.png)

**Salted 4  times**

![BP - 18](images/spark-bp-18.png)

**Salted 8 times**

![BP - 19](images/spark-bp-19.png)

A typical Salting workflow looks like below:

![BP - 20](images/spark-bp-20.png)

For example, a salt column is added to the data with 100 randomized salts during narrow transformation phase (map or flatMap type of transforms).

```
n = 100
salted_df = df.withColumn("salt", (rand * n).cast(IntegerType))
```

Now, aggregation is performed on this salt column and the results are reduced by keys

```
unsalted_df = salted_df.groupBy("salt", groupByFields).agg(aggregateFields).groupBy(groupByFields).agg(aggregateFields)
```
Similar logic can  be applied for windowing functions as well.

A downside to this approach is that it creates too many small tasks for non-skewed keys which may have a negative impact on the overall job performance.

### Isolated Salting
In this approach salting is applied to only subset of the keys. If 80% or more data has a single value, isolated salting approach could be considered (for eg: skew due to NULL columns). In narrow transformation phase, we will isolate the skewed column. In the wide transformation phase, we  will isolate and reduce the heavily skewed column after salting. Finally, we will reduce other values without the salt and merge the results.

Isolated Salting workflow looks like below:

![BP - 21](images/spark-bp-21.png)

Example code looks like below:

```
val count = 4
val salted = df.withColumn("salt", when('col === "A", rand(1) * count cast IntegerType) otherwise 0)
val replicaDF = skewDF
      .withColumn("replica", when('col === "A", (0 until count) toArray) otherwise Array(0))
      .withColumn("salt", explode('replica'))
      .drop('replica')
val merged = salted.join(replicaDF, joinColumns :+ "salt")
```
### Isolated broadcast join
In this approach, smaller lookup table is broadcasted across the workers and joined in map phase itself. Thus, reducing the amount of data shuffles. Similar to last approach, skewed keys are separated from normal keys. Then, we reduce the ”normal” keys and perform map-side join on isolated ”skewed” keys. Finally, we can merge the results of skewed and normal joins

Isolated map-side join workflow looks like below:

![BP - 22](images/spark-bp-22.png)

Example code looks like below:

```
val count = 8
val salted = skewDF.withColumn("salt", when('col === "A", rand(1) * count cast IntegerType) otherwise 0).repartition('col', 'salt') // Re-partition to remove skew
val broadcastDF = salted.join(broadcast(sourceDF), "symbol")
```

### Hashing for SparkSQL queries
While running SparkSQL queries using window functions on skewed data, you may have observed that it runs out of memory sometimes.

Following could be an example query working on top of a skewed dataset.

```
select *, ROW_NUMBER() OVER (partition by l_orderkey order by l_orderkey) AS row_num FROM testdb.skewlineitem
```
Considering there is a skew in l_orderkey field, we can split the above query into 4 hashes.
```
select * from (select *, ROW_NUMBER() OVER (partition by l_orderkey order by l_orderkey) AS row_num FROM testdb.skewlineitem where cast(l_orderkey as integer)%4 = 1
union
select *, ROW_NUMBER() OVER (partition by l_orderkey order by l_orderkey ) AS row_num FROM testdb.skewlineitem where cast(l_orderkey as integer)%4 = 2
union
select *, ROW_NUMBER() OVER (partition by l_orderkey order by l_orderkey ) AS row_num FROM testdb.skewlineitem where cast(l_orderkey as integer)%4 = 3
union
select *, ROW_NUMBER() OVER (partition by l_orderkey order by l_orderkey ) AS row_num FROM testdb.skewlineitem where cast(l_orderkey as integer)%4 = 4 )
limit 10;
```
If the values are highly skewed, then salting approaches should be used instead since this approach will still send all the skewed keys to a single task. This approach should be used to prevent OOMs quickly rather than to increase performance. The read job is re-computed for the number of sub queries written.

## ** BP 5.1.17  -  Choose the right type of join **

There are several types of joins in Spark. Some are more optimal than others based on certain considerations. Spark by default does a few join optimizations. However, we can pass join "hints" as well if needed to instruct Spark to use our preferred type of join. For example, in the following SparkSQL queries we supply broadcast and shuffle join hints respectively.

```
SELECT /*+ BROADCAST(t1) */ * FROM t1 INNER JOIN t2 ON t1.key = t2.key;
SELECT /*+ SHUFFLE_HASH(t1) */ * FROM t1 INNER JOIN t2 ON t1.key = t2.key;
```

### Broadcast Join
Broadcast join i.e., map-side join is the most optimal join, provided one of your tables is small enough - in the order of MBs and you are performing an equi (=) join. All join types are supported except full outer joins. This join type broadcasts the smaller table as a hash table across all the worker nodes in memory. Note that once the small table has been broadcasted, we cannot make changes to it. Now that the hash table is locally in the JVM, it is merged easily with the large table based on the condition using a hash join. High performance while using this join can be attributed to minimal shuffle overhead. From EMR 5.30 and EMR 6.x onwards, by default, while performing a join if one of your tables is <=10 MB, this join strategy is chosen. This is based on the parameter *spark.sql.autoBroadcastJoinThreshold* which is defaulted to 10 MB.

If one of your join tables are larger than 10 MB, you can either modify *spark.sql.autoBroadcastJoinThreshold* or use an explicit broadcast hint. You can verify that your query uses a broadcast join by investigating the live plan from SQL tab of Spark UI.

![BP - 24](images/spark-bp-24.png)

Please note that you should not use this join if your "small" table is not small enough. For eg, when you are joining a 10 GB table with a 10 TB table, your smaller table may still be large enough to not fit into the executor memory and will subsequently lead to OOMs and other type of failures. Also, it is not recommended to pass GBs of data over network to all of the workers which will cause serious network bottlenecks. Only use this join if broadcast table size is <1 GB.

### Sort Merge Join
This is the most common join used by Spark. If you are joining two large tables (>10 MB by default), your join keys are sortable and your join condition is equi (=), it is highly likely that Spark uses a Sort Merge join which can be verified by looking into the live plan from the Spark UI.

![BP - 25](images/spark-bp-25.png)

Spark configuration *spark.sql.join.preferSortMergeJoin* is defaulted to true from Spark 2.3 onwards. When this join is implemented, data is read from both tables and shuffled. After this shuffle operation, records with the same keys from both datasets are sent to the same partition. Here, the entire dataset is not broadcasted, which means that the data in each partition will be of manageable size after the shuffle operation. After this, records on both sides are sorted by the join key. A join is performed by iterating over the records on the sorted dataset. Since the dataset is sorted, the merge or join operation is stopped for an element as soon as a key mismatch is encountered. So a join attempt is not performed on all keys. After sorting, join operation is performed upon iterating the datasets on both sides which will happen quickly on the sorted datasets.

Continue to use this join type if you are joining two large tables with an equi condition on sortable keys. Do not convert a sort merge join to broadcast unless one of the tables is < 1 GB. All join types are supported.

### Shuffle Hash Join
Shuffle Hash Join sends data with the same join keys in the same executor node followed by a Hash Join. The data is shuffled among the executors using the join key. Then, the data is combined using Hash Join since data from the same key will be present in the same executor. In most cases, this join type performs poorly when compared to Sort Merge join since it is more shuffle intensive. Typically, this join type is avoided by Spark unless *spark.sql.join.preferSortMergeJoin* is set to "false" or the join keys are not sortable. This join also supports only equi conditions. All join types are supported except full outer joins. If you find out from the Spark UI that you are using a Shuffle Hash join, then check your join condition to see if you are using non-sortable keys and cast them to a sortable type to convert it into a Sort Merge join.

### Broadcast Nested Loop Join
Broadcast Nested Loop Join broadcasts one of the entire datasets and performs a nested loop to join the data. Some of the results are broadcasted for a better performance. Broadcast Nested Loop Join generally leads to poor job performance and may lead to OOMs or network bottlenecks. This join type is avoided by Spark unless no other options are applicable. It supports both equi and non-equi join conditions (<,>,<=,>=,like conditions,array/list matching etc.). If you see this join being used by Spark upon investigating your query plan, it is possible that it is being caused by a poor coding practice.

![BP - 26](images/spark-bp-26.png)

Best way to eliminate this join is to see if you can change your code to use equi condition instead. For example, if you are joining two tables by matching elements from two arrays, explode the arrays first and do an equi join. However, there are some cases where this join strategy is not avoidable.

For example, below code leads to Broadcast Nested Loop Join.

```
val df1 = spark.sql("select * from testdb.lineitem_shipmodesuppkey_part where l_shipdate='1993-12-03' and l_shipmode='SHIP'")
val df2 = spark.sql("select * from testdb.lineitem_shipmodesuppkey_part where l_shipdate='1993-12-04' and l_shipmode='SHIP'")
val nestedLoopDF = df1.join(df2, df1("l_partkey") === df2("l_partkey") || df1("l_linenumber") === df2("l_linenumber"))
```
Instead, you can change the code like below:

```
val result1 = df1.join(df2, df1("l_partkey") === df2("l_partkey"))
val result2 = df1.join(df2, df1("l_linenumber") === df2("l_linenumber"))
val resultDF = result1.union(result2)
```
The query plan after optimization looks like below. You can also optionally pass a broadcast hint to ensure that broadcast join happens if any one of your two tables is small enough. In the following case, it picked broadcast join by default since one of the two tables met *spark.sql.autoBroadcastJoinThreshold*.

![BP - 27](images/spark-bp-27.png)

### Cartesian Join
Cartesian joins or cross joins are typically the worst type of joins. It is chosen if you are running "inner like" queries. This type of join follows the below procedure which as you can see is very inefficient and may lead to OOMs and network bottlenecks.

```
for l_key in lhs_table:
  for r_key in rhs_table:
    #Execute join condition
```
If this join type cannot be avoided, consider passing a Broadcast hint on one of the tables if it is small enough which will lead to Spark picking Broadcast Nested Loop Join instead. Broadcast Nested Loop Join may be slightly better than the cartesian joins in some cases since atleast some of the results are broadcasted for better performance.

Following code will lead to a Cartesian product provided the tables do not meet *spark.sql.autoBroadcastJoinThreshold*.

```
val crossJoinDF = df1.join(df2, df1("l_partkey") >= df2("l_partkey"))
```
![BP - 28](images/spark-bp-28.png)

Now, passing a broadcast hint which leads to Broadcast Nested Loop Join

```
val crossJoinDF = df1.join(broadcast(df2), df1("l_partkey") >= df2("l_partkey"))
```
![BP - 29](images/spark-bp-29.png)

## ** BP 5.1.18  - Consider Spark Blacklisting for large clusters **

Spark provides blacklisting feature which allows you to blacklist an executor or even an entire node if one or more tasks fail on the same node or executor for more than configured number of times. Spark blacklisting properties may prove to be very useful especially for very large clusters (100+ nodes) where you may rarely encounter an impaired node. We discussed this issue briefly in BPs 5.1.13 and 5.1.14.

This blacklisting is enabled by default in Amazon EMR with the *spark.blacklist.decommissioning.enabled* property set to true. You can control the time for which the node is blacklisted using *spark.blacklist.decommissioning.timeout property*, which is set to 1 hour by default, equal to the default value for *yarn.resourcemanager.nodemanager-graceful-decommission-timeout-secs*. It is recommended to set *spark.blacklist.decommissioning.timeout* to a value equal to or greater than *yarn.resourcemanager.nodemanager-graceful-decommission-timeout-secs* to make sure that Amazon EMR blacklists the node for the entire decommissioning period.

Following are some *experimental* blacklisting properties.

**spark.blacklist.task.maxTaskAttemptsPerExecutor** determines the number of times a unit task can be retried on one executor before it is blacklisted for that task. Defaults to 2.

**spark.blacklist.task.maxTaskAttemptsPerNode** determines the number of times a unit task can be retried on one worker node before the entire node is blacklisted for that task. Defaults to 2.

**spark.blacklist.stage.maxFailedTasksPerExecutor** is same as *spark.blacklist.task.maxTaskAttemptsPerExecutor* but the executor is blacklisted for the entire stage.

**spark.blacklist.stage.maxFailedExecutorsPerNode** determines how many different executors are marked as blacklisted for a given stage, before the entire worker node is marked as blacklisted for the stage. Defaults to 2.

**spark.blacklist.application.maxFailedTasksPerExecutor** is same as *spark.blacklist.task.maxTaskAttemptsPerExecutor* but the executor is blacklisted for the entire application.

**spark.blacklist.application.maxFailedExecutorsPerNode** is same as *spark.blacklist.stage.maxFailedExecutorsPerNode* but the worker node is blacklisted for the entire application.

**spark.blacklist.killBlacklistedExecutors** when set to true will kill the executors when they are blacklisted for the entire application or during a fetch failure. If node blacklisting properties are used, it will kill all the executors of a blacklisted node. It defaults to false. Use with caution since it is susceptible to unexpected behavior due to red herring.

**spark.blacklist.application.fetchFailure.enabled** when set to true will blacklist the executor immediately when a fetch failure happens. If external shuffle service is enabled, then the whole node will be blacklisted. This setting is aggressive. Fetch failures usually happen due to a rare occurrence of impaired hardware but may happen due to other reasons as well. Use with caution since it is susceptible to unexpected behavior due to red herring.

The node blacklisting configurations are helpful for the rarely impaired hardware case we discussed earlier. For example, following configurations can be set to ensure that if a task fails more than 2 times in an executor and if more than two executors fail in a particular worker or if you encounter a single fetch failure, then the executor and worker are blacklisted and subsequently removed from your application.

```
[{
    "classification": "spark-defaults",
    "properties": {
        "spark.blacklist.killBlacklistedExecutors": "true",
        "spark.blacklist.application.fetchFailure.enabled": "true"
    },
    "configurations": []
}]
```

You will be able to distinguish blacklisted executors and nodes from the Spark UI and from the Spark driver logs.

![BP - 30](images/spark-bp-30.png)

When a stage fails because of fetch failures from a node being decommissioned, by default, Amazon EMR does not count the stage failure toward the maximum number of failures allowed for a stage as set by *spark.stage.maxConsecutiveAttempts*. This is determined by the setting *spark.stage.attempt.ignoreOnDecommissionFetchFailure* being set to true. This prevents a job from failing if a stage fails multiple times because of node failures for valid reasons such as a manual resize, an automatic scaling event, or Spot instance interruptions.

## ** BP 5.1.19  - Debugging and monitoring Spark applications **

EMR provides several options to debug and monitor your Spark application. As you may have seen from some of the screenshots in this document, Spark UI is very helpful to determine your application performance and identify any potential bottlenecks. With regards to Spark UI, you have 3 options in Amazon EMR.

1. **Spark Event UI** - This is the live user interface typically running on port 20888. It shows the most up-to-date status of your jobs in real-time. You can go to this UI from Application Master URI in the Resource Manager UI. If you are using EMR Studio or EMR Managed Notebooks, you can navigate directly to Spark UI from your Jupyter notebook anytime after a Spark application is created using Livy. This UI is not accessible once the application finishes or if your cluster terminates.
2. **Spark History Server** - SHS runs on port 18080. It shows the history of your job runs. You may also see live application status but not in real time. SHS will persist beyond your application runtime but it becomes inaccessible when your EMR cluster is terminated.
3. **EMR Persistent UI** - Amazon EMR provides [Persistent User Interface for Spark](https://docs.aws.amazon.com/emr/latest/ManagementGuide/app-history-spark-UI.html). This UI is accessible for up to 30 days after your application ends even if your cluster is terminated since the logs are stored off-cluster. This option is great for performing post-mortem analysis on your applications without spending on your cluster to stay active.

Spark UI options are  also helpful to identify important metrics like shuffle reads/writes, input/output sizes, GC times, and also information like runtime Spark/Hadoop configurations, DAG, execution timeline etc. All these UIs will redirect you to live driver (cluster mode) or executor logs when you click on "stderr" or "stdout" from Tasks and Executors lists. When you encounter a task failure, if stderr of the executor does not provide adequate information, you can check the stdout logs.

![BP - 31](images/spark-bp-31.png)

Apart from the UIs, you can also see application logs in S3 Log URI configured when you create your EMR cluster. Application Master (AM) logs can be found in s3://bucket/prefix/containers/YARN application ID/container_appID_attemptID_0001/. AM container is the very first container. This is where your driver logs will be located as well if you ran your job in cluster deploy mode. If you ran your job in client deploy mode, driver logs are printed on to the console where you submitted your job which you can write to a file. If you used EMR Step API with client deploy mode, driver logs can be found in EMR Step's stderr. Spark executor logs are found in the same S3 location. All containers than the first container belong to the executors. S3 logs are pushed every few minutes and are not live.

![BP - 32](images/spark-bp-32.png)

If you have SSH access to the EC2 nodes of your EMR cluster, you can also see application master and executor logs stored in the local disk under /var/log/containers. You will only need to see the local logs if S3 logs are unavailable for some reason. Once the application finishes, the logs are aggregated to HDFS and are available for up to 48 hours based on the property *yarn.log-aggregation.retain-seconds*.

## ** BP 5.1.20  -  Spark Observability Platforms **

Spark JMX metrics will supply you with fine-grained details on resource usage. It goes beyond physical memory allocated and identifies the actual heap usage based on which you can tune your workloads and perform cost optimization. There are several ways to expose these JMX metrics. You can simply use a ConsoleSink which prints the metrics to console where you submit your job or CSVSink to write metrics to a file which you can use for data visualization. But these approaches are not tidy. There are more options as detailed [here](https://spark.apache.org/docs/latest/monitoring.html). You can choose an observability platform based on your requirements. Following are some example native options.

### Amazon Managed Services for Prometheus and Grafana
AWS offers [Amazon Managed Prometheus (AMP)](https://aws.amazon.com/prometheus/) which is a Prometheus-compatible monitoring and alerting service that makes it easy to monitor containerized applications and infrastructure at scale. [Amazon Managed Grafana (AMG)](https://aws.amazon.com/grafana/) is a fully managed service for open source Grafana developed in collaboration with Grafana Labs. Grafana is a popular open source analytics platform that enables you to query, visualize, alert on and understand your metrics no matter where they are stored. You can find the [deployment instructions](https://aws.amazon.com/blogs/big-data/monitor-and-optimize-analytic-workloads-on-amazon-emr-with-prometheus-and-grafana/) available to integrate Amazon EMR with OSS Prometheus and Grafana which can be extended to AMP and AMG as well. Additionally, Spark metrics can be collected using [PrometheusServlet](https://spark.apache.org/docs/latest/monitoring.html) and [prometheus/jmx_exporter](https://github.com/prometheus/jmx_exporter). However, some bootstrapping is necessary for this integration.

###Amazon Opensearch
[Amazon Opensearch](https://aws.amazon.com/blogs/opensource/introducing-opensearch/) is a community-driven open source fork of [Elasticsearch and Kibana](https://aws.amazon.com/blogs/opensource/stepping-up-for-a-truly-open-source-elasticsearch/). It is a popular service for log analytics. Logs can be indexed from S3 or local worker nodes to Amazon Opensearch either using AWS Opensearch SDK or Spark connector. These logs can then be visualized using Kibana To analyze JMX metrics and logs, you will need to develop a custom script for sinking the JMX metrics and importing logs.

Apart from native solutions, you can also use one of the AWS Partner solutions. Some of the popular choices are Splunk, Data Dog and Sumo Logic.

## ** BP 5.1.21  -  Potential resolutions for not-so-common errors **

Following are some interesting resolutions for common (but not so common) errors faced by EMR customers. We will continue to update this list as and when we encounter new and unique issues and resolutions.

###Potential strategies to mitigate S3 throttling errors
For mitigating S3 throttling errors (503: Slow Down), consider increasing *fs.s3.maxRetries* in emrfs-site configuration. By default, it is set to 15 and you may need to increase it further based on your processing needs. You can also increase the multipart upload threshold in EMRFS. Default value at which MPU triggers is 128 MB.

```
[{
    "classification": "emrfs-site",
    "properties": {
        "fs.s3.maxRetries": "20",
        "fs.s3n.multipart.uploads.split.size": "268435456"
    },
    "configurations": []
}]
```
Consider using Iceberg format [ObjectStoreLocationProvider](https://iceberg.apache.org/docs/latest/aws/#object-store-file-layout) to store data under S3 hash [0*7FFFFF] prefixes. This would help S3 scale traffic more efficiently as your job's processing requirements increase and thus help mitigate the S3 throttling errors.
```
 CREATE TABLE my_catalog.my_ns.my_table
 ( id bigint,
   data string,
   category string)
   USING iceberg OPTIONS
   ( 'write.object-storage.enabled'=true,
     'write.data.path'='s3://my-table-data-bucket')
     PARTITIONED BY (category);
```
Your S3 files will be arranged under MURMUR3 S3 hash prefixes like below.
```
 2021-11-01 05:39:24  809.4 KiB 7ffbc860/my_ns/my_table/00328-1642-5ce681a7-dfe3-4751-ab10-37d7e58de08a-00015.parquet
 2021-11-01 06:00:10    6.1 MiB 7ffc1730/my_ns/my_table/00460-2631-983d19bf-6c1b-452c-8195-47e450dfad9d-00001.parquet
 2021-11-01 04:33:24    6.1 MiB 7ffeeb4e/my_ns/my_table/00156-781-9dbe3f08-0a1d-4733-bd90-9839a7ceda00-00002.parquet
```
Please note that using Iceberg ObjectStoreLocationProvider is not a fail proof mechanism to avoid S3 503s. You would still need to set appropriate EMRFS retries to provide additional resiliency. You can refer to a detailed POC on Iceberg ObjectStoreLocationProvider[here](https://github.com/vasveena/IcebergPOC/blob/main/Iceberg-EMR-POC.ipynb).

If you have exhausted all the above options, you can create an AWS support case to partition your S3 prefixes for bootstrapping capacity. Please note that the prefix pattern needs to be known in advance for eg: s3://bucket/000-fff/ or s3://bucket/<date fields from 2020-01-20 to 2030-01-20>/.

###Precautions to take while running too many executors
If you are running Spark jobs on large clusters with many number of executors, you may have encountered dropped events from Spark driver logs.

```
ERROR scheduler.LiveListenerBus: Dropping SparkListenerEvent because no remaining room in event queue. This likely means one of the SparkListeners is too slow and cannot keep up with the rate at which tasks are being started by the scheduler.
WARN scheduler.LiveListenerBus: Dropped 1 SparkListenerEvents since Thu Jan 01 01:00:00 UTC 1970
```
For this issue, you can increase *spark.scheduler.listenerbus.eventqueue.size* from default of 10000 to 2x or more until you do not see dropped events anymore.

Running large number of executors may also lead to driver hanging since the executors constantly heartbeat to the driver. You can minimize the impact by increasing *spark.executor.heartbeatInterval* from 10s to 30s or so. But do not increase to a very high number since this will prevent finished or failed executors from being reclaimed for a long time which will lead to wastage cluster resources.

If you see the Application Master hanging while requesting executors from the Resource Manager, consider increasing *spark.yarn.containerLauncherMaxThreads* which is defaulted to 25. You may also want to increase *spark.yarn.am.memory* (default: 512 MB) and *spark.yarn.am.cores* (default: 1).

###Adjust HADOOP, YARN and HDFS heap sizes for intensive workflows
You can see the heap sizes of HDFS and YARN processes under /etc/hadoop/conf/hadoop-env.sh and /etc/hadoop/conf/yarn-env.sh on your cluster.

In hadoop-env.sh, you can see heap sizes for HDFS daemons.
```
export HADOOP_OPTS="$HADOOP_OPTS -server -XX:+ExitOnOutOfMemoryError"
export HADOOP_NAMENODE_HEAPSIZE=25190
export HADOOP_DATANODE_HEAPSIZE=4096
```
In yarn-env.sh, you can see heap sizes for YARN daemons.
```
export YARN_NODEMANAGER_HEAPSIZE=2048
export YARN_RESOURCEMANAGER_HEAPSIZE=7086
```
Adjust this heap size as needed based on your processing needs. Sometimes, you may see HDFS errors like "MissingBlocksException" in your job or other random YARN errors. Check your HDFS name node and data node logs or YARN resource manager and node manager logs to ensure that the daemons are healthy. You may find that the daemons are crashing due to OOM issues in .out files like below:

```
OpenJDK 64-Bit Server VM warning: INFO: os::commit_memory(0x00007f0beb662000, 12288, 0) failed; error='Cannot allocate memory' (errno=12)
#
# There is insufficient memory for the Java Runtime Environment to continue.
# Native memory allocation (mmap) failed to map 12288 bytes for committing reserved memory.
# An error report file with more information is saved as:
# /tmp/hs_err_pid14730.log
```

In this case, it is possible that your HDFS or YARN daemon was trying to grow its heap size but the OS memory did not have sufficient room to accommodate that. So, when you launch a cluster, you can define -Xms JVM opts to be same as -Xmx for the heap size of the implicated daemon so that the OS memory is allocated when the daemon is initialized. Following is an example for the data node process which can be extended to other daemons as well:

```
[
{
    "Classification": "hadoop-env",
    "Properties": {

    },
    "Configurations": [
      {
        "Classification": "export",
        "Properties": {
          "HADOOP_DATANODE_OPTS": "-Xms4096m -Xmx4096m $HADOOP_DATANODE_OPTS"
          “HADOOP_DATANODE_HEAPSIZE”: "4096"
        },
        "Configurations": []
      }
    ]
  }
]
```
Additionally, you can also consider reducing *yarn.nodemanager.resource.memory-mb* by subtracting the heap sizes of HADOOP, YARN and HDFS daemons from *yarn.nodemanager.resource.memory-mb* for your instance types.

###Precautions to take for highly concurrent workloads

When you are running multiple Spark applications in parallel, you may sometimes encounter job or step failures due to errors like “Caused by: java.util.zip.ZipException: error in opening zip file” or hanging of the application or Spark client while trying to launch the Application Master container. Check the CPU utilization on the master node when this happens. If the CPU utilization is high, this issue could be because of the repeated process of zipping and uploading Spark and job libraries to HDFS distributed cache from many parallel applications at the same time. Zipping is a compute intensive operation. Your name node could also be bottlenecked while trying to upload multiple large HDFS files.

```
22/02/25 21:39:45 INFO Client: Preparing resources for our AM container
22/02/25 21:39:45 WARN Client: Neither spark.yarn.jars nor spark.yarn.archive is set, falling back to uploading libraries under SPARK_HOME.
22/02/25 21:39:48 INFO Client: Uploading resource file:/mnt/tmp/spark-b0fe28f9-17e5-42da-ab8a-5c861d81e25b/__spark_libs__3016570917637060246.zip -> hdfs://ip-172-31-45-211.ec2.internal:8020/user/hadoop/.sparkStaging/application_1645574675843_0003/__spark_libs__3016570917637060246.zip
22/02/25 21:39:49 INFO Client: Uploading resource file:/etc/spark/conf/hive-site.xml -> hdfs://ip-172-31-45-211.ec2.internal:8020/user/hadoop/.sparkStaging/application_1645574675843_0003/hive-site.xml
22/02/25 21:39:49 INFO Client: Uploading resource file:/usr/lib/spark/python/lib/pyspark.zip -> hdfs://ip-172-31-45-211.ec2.internal:8020/user/hadoop/.sparkStaging/application_1645574675843_0003/pyspark.zip
22/02/25 21:39:49 INFO Client: Uploading resource file:/usr/lib/spark/python/lib/py4j-0.10.9-src.zip -> hdfs://ip-172-31-45-211.ec2.internal:8020/user/hadoop/.sparkStaging/application_1645574675843_0003/py4j-0.10.9-src.zip
22/02/25 21:39:50 INFO Client: Uploading resource file:/mnt/tmp/spark-b0fe28f9-17e5-42da-ab8a-5c861d81e25b/__spark_conf__7549408525505552236.zip -> hdfs://ip-172-31-45-211.ec2.internal:8020/user/hadoop/.sparkStaging/application_1645574675843_0003/__spark_conf__.zip
```
To mitigate this, you can zip your job dependencies along with Spark dependencies in advance, upload the zip file to HDFS or S3 and set *spark.yarn.archive* to that location. Below is an example:
```
zip -r spark-dependencies.zip /mnt/jars/
hdfs dfs -mkdir /user/hadoop/deps/
hdfs dfs -copyFromLocal spark-dependencies.zip /user/hadoop/deps/
```
/mnt/jars location in the master node contains the application JARs along with JARs in /usr/lib/spark/jars. After this, set spark.yarn.archive or spark.yarn.jars in spark-defaults.

```
spark.yarn.archive  hdfs:///user/hadoop/deps/spark-dependencies.zip
```
You can see that this file size is large.
```
hdfs dfs -ls hdfs:///user/hadoop/deps/spark-dependencies.zip
-rw-r--r--   1 hadoop hdfsadmingroup  287291138 2022-02-25 21:51 hdfs:///user/hadoop/deps/spark-dependencies.zip
```
Now you will see that the Spark and Job dependencies are not zipped or uploaded when you submit the job saving a lot of CPU cycles especially when you are running applications at a high concurrency. Other resources uploaded to HDFS by driver can also be zipped and uploaded to HDFS/S3 prior but they are quite lightweight. Monitor your master node's CPU to ensure that the utilization has been brought down.
```
22/02/25 21:56:08 INFO Client: Preparing resources for our AM container
22/02/25 21:56:08 INFO Client: Source and destination file systems are the same. Not copying hdfs:/user/hadoop/deps/spark-dependencies.zip
22/02/25 21:56:08 INFO Client: Uploading resource file:/etc/spark/conf/hive-site.xml -> hdfs://ip-172-31-45-211.ec2.internal:8020/user/hadoop/.sparkStaging/application_1645574675843_0007/hive-site.xml
22/02/25 21:56:08 INFO Client: Uploading resource file:/usr/lib/spark/python/lib/pyspark.zip -> hdfs://ip-172-31-45-211.ec2.internal:8020/user/hadoop/.sparkStaging/application_1645574675843_0007/pyspark.zip
22/02/25 21:56:08 INFO Client: Uploading resource file:/usr/lib/spark/python/lib/py4j-0.10.9-src.zip -> hdfs://ip-172-31-45-211.ec2.internal:8020/user/hadoop/.sparkStaging/application_1645574675843_0007/py4j-0.10.9-src.zip
22/02/25 21:56:08 INFO Client: Uploading resource file:/mnt/tmp/spark-0fbfb5a9-7c0c-4f9f-befd-3c8f56bc4688/__spark_conf__5472705335503774914.zip -> hdfs://ip-172-31-45-211.ec2.internal:8020/user/hadoop/.sparkStaging/application_1645574675843_0007/__spark_conf__.zip
```
If you are using EMR Step API to submit your job, you may encounter another issue during the deletion of your Spark dependency zip file (which will not happen if you follow the above recommendation) and other conf files from /mnt/tmp upon successful YARN job completion. If there is a delay of over 30s during this operation, it leads to EMR step failure even if the corresponding YARN job itself is successful. This is due to the behavior of Hadoop’s [ShutdownHook](https://github.com/apache/hadoop/blob/branch-2.10.1/hadoop-common-project/hadoop-common/src/main/java/org/apache/hadoop/util/RunJar.java#L227). If this happens, increase *hadoop.service.shutdown.timeout* property from 30s to to a larger value.

Please feel free to contribute to this list if you would like to share your resolution for any interesting issues that you may have encountered while running Spark workloads on Amazon EMR.

## ** BP 5.1.22  -  How the number of partitions are determined when reading a non-partitioned file **

When reading a non-partitioned file, that can be a text file, csv, etc. the count behind the number of partitions created from Spark depends from many variables as the methods used to read the file, the default parallelism and so on. Following an overview of how these factors are related between each other so to better understand how files are processed.

Here a brief summary of relationship between core nodes - executors - tasks:

 - each File is composed by blocks that will be parsed according to the InputFormat corresponding to the specific data format, and generally combines several blocks into one input slice, called InputSplit
 - InputSplit and Task are one-to-one correspondence relationship
 - each of these specific Tasks will be assigned to one executor of the nodes on the cluster
 - each node can have one or more Executors, depending on the node resources and executor settings
 - each Executor consists of cores and memory whose default is based on the node type. Each executor can only execute one task at time.

So based on that, the number of threads/tasks will be based on the number of partitions while reading .

Now, there are several factors that dictate how a dataset or file is mapped to a partition. First is the method used to read the file (e.g. text file), that changes if you're working with rdds or dataframes: 

```
sc.textFile(...) returns a RDD[String]

   textFile(String path, int minPartitions)

   Read a text file from HDFS, a local file system (available on all nodes), or any Hadoop-supported 
   file system URI, and return it as an RDD of Strings.
```
```
spark.read.text(...) returns a DataSet[Row] or a DataFrame

   text(String path)

   Loads text files and returns a DataFrame whose schema starts with a string column named "value",
   and followed by partitioned columns if there are any.
```

### Spark Core API (RDDs)

When using *sc.textFile* Spark uses the block size set for the filesysytem protocol it's reading from, to calculate the number of partitions in input:

[SparkContext.scala](https://github.com/apache/spark/blob/v2.4.8/core/src/main/scala/org/apache/spark/SparkContext.scala#L819-L832)
```
  /**
   * Read a text file from HDFS, a local file system (available on all nodes), or any
   * Hadoop-supported file system URI, and return it as an RDD of Strings.
   * @param path path to the text file on a supported file system
   * @param minPartitions suggested minimum number of partitions for the resulting RDD
   * @return RDD of lines of the text file
   */
  def textFile(
      path: String,
      minPartitions: Int = defaultMinPartitions): RDD[String] = withScope {
    assertNotStopped()
    hadoopFile(path, classOf[TextInputFormat], classOf[LongWritable], classOf[Text],
      minPartitions).map(pair => pair._2.toString).setName(path)
  }
```
[FileInputFormat.java](https://github.com/apache/hadoop/blob/trunk/hadoop-mapreduce-project/hadoop-mapreduce-client/hadoop-mapreduce-client-core/src/main/java/org/apache/hadoop/mapred/FileInputFormat.java#L373)
```
        if (isSplitable(fs, path)) {
          long blockSize = file.getBlockSize();
          long splitSize = computeSplitSize(goalSize, minSize, blockSize);
```

When using the *S3A* protocol the block size is set through the *fs.s3a.block.size parameter* (default 32M), and when using *S3* protocol through *fs.s3n.block.size* (default 64M). Important to notice here is that with *S3* protocol the parameter used is *fs.s3n.block.size* and not *fs.s3.block.size* as you would expect. In EMR indeed, when using EMRFS, which means using *s3* with *s3://* prefix, *fs.s3.block.size* will not have any affect on the EMRFS configration.

Following some testing results using these parameters:
```
CONF
Input: 1 file, total size 336 MB

TEST 1 (default)
 S3A protocol
- fs.s3a.block.size = 32M (default)
- Spark no. partitions: 336/32 = 11

 S3 protocol
- fs.s3n.block.size = 64M (default)
- Spark no. partitions: 336/64 = 6

TEST 2 (modified)
 S3A protocol
- fs.s3a.block.size = 64M (modified)
- Spark no. partitions: 336/64 = 6

 S3protocol
- fs.s3n.block.size = 128M (modified)
- Spark no. partitions: 336/128 = 3
```

### Spark SQL (DATAFRAMEs) 

When using *spark.read.text* no. of spark tasks/partitions depends on default parallelism:

[DataSourceScanExec.scala](https://github.com/apache/spark/blob/v2.4.8/sql/core/src/main/scala/org/apache/spark/sql/execution/DataSourceScanExec.scala#L423-L430)
```
    val defaultMaxSplitBytes =
      fsRelation.sparkSession.sessionState.conf.filesMaxPartitionBytes
    val openCostInBytes = fsRelation.sparkSession.sessionState.conf.filesOpenCostInBytes
    val defaultParallelism = fsRelation.sparkSession.sparkContext.defaultParallelism
    val totalBytes = selectedPartitions.flatMap(_.files.map (_.getLen + openCostInBytes)).sum
    val bytesPerCore = totalBytes / defaultParallelism

    val maxSplitBytes = Math.min(defaultMaxSplitBytes, Math.max(openCostInBytes, bytesPerCore))
```

The default Parallelism is determined via:

[CoarseGrainedSchedulerBackend.scala](https://github.com/apache/spark/blob/v2.4.8/core/src/main/scala/org/apache/spark/scheduler/cluster/CoarseGrainedSchedulerBackend.scala#L457-L459)
```
  override def defaultParallelism(): Int = {
    conf.getInt("spark.default.parallelism", math.max(totalCoreCount.get(), 2))
  }
```

If *defaultParallelism* is too large, *bytesPerCore* will be small, and *maxSplitBytes* can be small, which can result in more no. of spark tasks/partitions. So if there're more cores, *spark.default.parallelism* can be large, *defaultMaxSplitBytes* can be small, and no. of spark tasks/partitions can be large.

In order to tweak the input no. of partitions the following parameters need to be set:

|  Classification | Property | Description  |
|---|---|---|
|  spark-default | *spark.default.parallelism*   |  default: max(total number of vCores, 2)  |
|  spark-default | *spark.sql.files.maxPartitionBytes*   | default: 128MB  |

If these parameters are modified, [*maximizeResourceAllocation*](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-spark-configure.html#emr-spark-maximizeresourceallocation) need to be disabled, as it would override *spark.default.parallelism parameter*.

Following some testing results using these parameters:
```
CONF
- Total number of vCores = 16 -> spark.default.parallelism = 16
- spark.sql.files.maxPartitionBytes = 128MB

TEST 1
- Input: 1 CSV file, total size 352,3 MB
- Spark no. partitions: 16
- Partition size = 352,3/16 = ∼22,09 MB

TEST 2
- Input: 10 CSV files, total size 3523 MB
- Spark no. partitions: 30
- Partition size = 3523/30 = ∼117,43 MB
```

____________________________________________________________________________________

**Disclaimer**

When writing a file the number of partitions in output will depends from the number of partitions in input that will be maintained if no shuffle operations are applied on the data processed, changed otherwise based on *spark.default.parallelism* for RDDs and *spark.sql.shuffle.partitions* for dataframes.