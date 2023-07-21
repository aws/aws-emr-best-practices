# Performance Tests

One of the most important operations to perform before start using an HBase cluster is to perform a stress test to verify if the provisioned infrastructure meets the requirements in terms of latency and throughput for your applications.

In this section, we’re going to explore some tools that can help to validate the provisioned infrastructure in terms of performance. For optimal results, it’s recommended to setup a monitoring tool as described in the [Observability](./observability.md#monitoring-hbase) section to collect advanced metrics from the tests.


## Evaluation Framework

Typically, there are different aspects you want to check depending on how your cluster will be used. However, there are two major metrics that are important to define a baseline for the cluster performance: operation throughput (number of requests we can serve for a specific operation in a given period of time, e.g. GET) and operation latency (time required to acknowledge a client request). 

It’s very important to baseline these metrics in a production cluster. They will give you hints on when to scale nodes based on clients requests during the day, and they can suggest configuration tuning if it is not matching expected performance. 

Typically, you can perform a benchmark in an HBase cluster following the steps below: 


* **Write / data load** This is always the first step in the process as you should populate some tables with mock data to perform read tests or simply to evaluate the maximum throughput you can achieve during write operations. For this test, it is important to mimic as much as possible the average payload size of the data that will be ingested in the cluster. This can help to evaluate the number of compactions performed with the ingested volume and see the performance degradation that you might expect during these operations. Besides, this will also give you an idea of the maximum number of write requests you can serve with the specified cluster topology. 

* **Read / latency / cache** This is the next step to define our baseline. The major aim of this test should be to verify the max throughput that the cluster can serve and understand how well you are leveraging the HBase cache to improve response latency. 


As best practice for running these tests, you can follow the following rules:

* Separate the clients from the HBase cluster. The goal is to collect metrics without having to care about resources used in our cluster. So as best practice, you should run your client fleet on a separate cluster.

* If your clients are on a separate cluster, make sure that your fleet is co-located on the same subnet of the cluster. This will improve response latency and avoid extra costs you might incur for data trasfer across Availability Zones. 

* Use [EMR Configurations](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-configure-apps.html) defined as JSON files that are stored on an Amazon S3 bucket to launch your test clusters. This will help you to more easily export configurations used in your QA environment to production. Moreover, it will be easier to track specific configurations used in a test cluster, rather than setting them manually while launching the cluster.


The following section describes some tools that can be used to baseline an HBase cluster. 


## Performance Evaluation Tool

The first tool we’re going to use is the HBase Performance Evaluation utility that is already available in your Amazon EMR cluster. This utility can be invoked using the following syntax from the EMR master node:

```bash
hbase pe <OPTIONS> <command> <nclients>
```

The tool allow us to perform both write and read operations specifying different options to control several aspects of our tests (e.g. create a partitioned table, disable WAL flush, etc.) 

For example, the following command allows us to create a table called *MyWriteTest* that will be pre-partitioned with 200 regions (--presplit) and we’re going to write 2GB (--size) of data using a single client. We also enable the *latency* parameter to report operation latencies that help us to identify if the response time met our requirements. 

```bash
hbase pe --table=MyWriteTest --presplit=200 --size=2 --latency --nomapred randomWrite 1
```

As described in the [Log](./observability.md#logs) section, the log output will be stored in the **`/var/log/hbase/hbase.log`** file. Please make sure to run the previous command as **`hbase`** user, or you’ll not have the permissions to modify this file using the standard **`hadoop`** user. The following shows a sample output for the previous command: 

```log
INFO [TestClient-0] hbase.PerformanceEvaluation: Latency (us) : mean=21.45, min=1.00, max=480941.00, stdDev=992.53, 50th=2.00, 75th=2.00, 95th=2.00, 99th=3.00, 99.9th=24.00, 99.99th=37550.00, 99.999th=46364.23
INFO [TestClient-0] hbase.PerformanceEvaluation: Num measures (latency) : 2097151
INFO [TestClient-0] hbase.PerformanceEvaluation: Mean = 21.45
...
INFO [TestClient-0] hbase.PerformanceEvaluation: No valueSize statistics available
INFO [TestClient-0] hbase.PerformanceEvaluation: Finished class org.apache.hadoop.hbase.PerformanceEvaluation$RandomWriteTest in 42448ms at offset 0 for 2097152 rows (48.62 MB/s)
INFO [TestClient-0] hbase.PerformanceEvaluation: Finished TestClient-0 in 42448ms over 2097152 rows
INFO [main] hbase.PerformanceEvaluation: [RandomWriteTest] Summary of timings (ms): [42448]
INFO [main] hbase.PerformanceEvaluation: [RandomWriteTest duration ] Min: 42448ms Max: 42448ms Avg: 42448ms
INFO [main] hbase.PerformanceEvaluation: [ Avg latency (us)] 21
INFO [main] hbase.PerformanceEvaluation: [ Avg TPS/QPS] 49405 row per second
```

As you can see this will report min, max and avg response latency for our write requests, along with throughput information about the max number of calls served by the cluster. Please note that in our example we used the *`nomapred`* parameter that will use a local thread to perform the test (in this case client resides on the EMR master node).

If we want to generate a higher number of requests is better to remove this option, so that the utility will use a Map Reduce (MR) job to perform the test. In this last scenario, it might be convenient to run the MR job on a separate cluster, to avoid using resources (cpu, network bandwidth) from our HBase cluster and gather more realistic results. 

For example, the same tests can performed from a separate EMR cluster adding the following parameter: **`-Dhbase.zookeeper.quorum=TARGET_HBASE_MASTER_DNS`**, and replacing TARGET_HBASE_MASTER_DNS with the EMR master hostname we want to test.

```bash
hbase pe -Dhbase.zookeeper.quorum=ip-xxx-xx-x-xxx.compute.internal --table=MyWriteTestTwo --presplit=200 --size=2 --latency  randomWrite 1
```

In the same way we can perform Read test operations. For a detailed list of all options and tests available in the utility, please check the help section of the tool from ther command line. 

## YCSB

Another popular tool to benchmark your HBase cluster is [YCSB](https://github.com/brianfrankcooper/YCSB) (Yahoo Cloud Serving Benchmark). This utility is not available on Amazon EMR, so it should be manually installed on the EMR master itself, or on a separate EC2 instance. 

This tool, unlike the previous one, is more focused on testing workloads patterns. In fact, in doesn’t provide several options as the HBase PE utility, but allows you to define different types of workloads (typically called workload A,B,C,D, etc.) where you can mix different volumes of write/read/mutate operations, along with sizes of the data that are going to be read or modified. 

By default, the tool comes with pre-defined templates to tests some standard workloads patterns. For example, [workload A](https://github.com/brianfrankcooper/YCSB/blob/master/workloads/workloada) performs 50% of read operations and 50% of update operations using 1KB payloads for each row.

This tool is especially useful, when you know exactly your workloads patterns, and you want to simulate more realistic use cases. However, please note that the tool can only launch multithreaded clients on the same node. So if you have a large cluster that you want to test, you’ll have to configure a fleet of EC2 instances and run the clients from each node using some automation scripts.