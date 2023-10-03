# ** Price Performance **

In the context of this guide, "price-performance" refers to the cost (in dollars) of running a workload for a specified level of performance (measured in run time, in seconds). Utilizing price-performance is crucial for benchmarking to grasp the implications of variables that cannot be standardized. These variables may include deployment models, competitor pricing, container scheduling, or engines.

For variables that are within our control, such as infrastructure sizing or application configurations, it's essential to maintain consistency across all benchmarks.

Below examples illustrates the importance of price-performance.

**Example 1:** Customer wants to compare OSS Spark vs EMR Spark with different cluster sizes

|	|Cluster #1	|Cluster #2	|
|---	|---	|---	|
|Runtime (s)	|12	|30	|
|# of nodes	|50	|10	|
|Engine	|OSS Spark Runtime	|EMR Spark Runtime	|
|Cost ($)	|600	|300	|

In the above example, Cluster #1 is running OSS spark and completes in 12s with 50 nodes, while EMR Spark completes in 30s with 10 nodes. However, when we look at total cost, cluster #2 total cost is lower than cluster #1 making it a better option. Comparing cost in relation to the work being done considers the difference in # of nodes and engine. Assuming performance is linear, lets look at what happens when we increase the # of nodes in cluster 2.

**Example 2:** Customer wants to compare Open Source Software (OSS) Spark vs EMR Spark  with same cluster sizes

|	|Cluster #1	|Cluster #2	|
|---	|---	|---	|
|Runtime (s)	|12	|6	|
|# of nodes	|50	|50	|
|Engine	|OSS Spark Runtime	|EMR Spark Runtime	|
|Cost ($)	|600	|300	|

After increasing the # of nodes to be the same across both clusters, runtime is reduced to 6seconds on Cluster #2 and cost remains the same at 300$. Our conclusion from the first example remains the same. Cluster #2 is the best option from a price-performance perspective. 

It’s important to note that price-performance is not always linear. This is often seen when workloads have data skew. In these cases, adding more compute does not reduce runtime proportionally and adds costs. 

**Example 3:** Same workload across different # of nodes - data skew 

|	|Run #1	|Run #2	|
|---	|---	|---	|
|Runtime (s)	|100	|75	|
|# of nodes	|10	|20	|
|Engine	|EMR Spark Runtime	|EMR Spark Runtime	|
|Cost ($)	|1000	|1500	|

In the above example, performance is not linear. While runtime reduced to 75s, overall cost increased. In these cases, it’s important ensure the # of nodes are the same for both comparisons. 

Another scenario where price-performance is useful is when comparing different pricing models or vendors. Take the example below:

**Example 4:** Same workload across different pricing models

|	|EMR Spark Runtime	|Vendor	|
|---	|---	|---	|
|Runtime (s)	|50	|40	|
|# of nodes	|10	|10	|
|$/s	|1	|1.5	|
|Cost ($)	|500	|600	|

In the above , the same workload on vendor runs in 40s, while EMR runs in 50s. While vendor may seem faster, when we factor in price-performance, we see total cost is lower with EMR. If runtime is a key requirement, we can increase the # of nodes in relation to performance as illustrated in example 5.

**Example 5:** Same workload across different pricing models with different # of nodes

|	|EMR Spark Runtime	|EMR Spark Runtime linear performance	|Vendor	|
|---	|---	|---	|---	|
|Runtime (s)	|50	|25	|40	|
|# of nodes	|10	|20	|10	|
|$/s	|1	|1	|1.5	|
|Cost ($)	|500	|500	|600	|

The goal with benchmarking should always be to have like-for-like comparisons. This is especially true for factors such as application configuration settings such as executor sizes, input and output dataset, cluster size and instances. However, factors like vendor/aws pricing model, engine optimizations, and schedulers cannot be made the same. As such, it’s important to use price-performance as a key factor. 
