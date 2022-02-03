# ** 4.1 - Managed Scaling **

## ** BP 4.1.1 Keep core nodes constant and scale with only task nodes **

Scaling with only task nodes improves the time for nodes to scale in and out because task nodes do not coordinate storage as part of HDFS. As such, during scale up, task nodes do not need to install data node daemons and during scale down, task nodes do not need re balance HDFS blocks. Improvement in the time it takes to scale in and out improves performance and reduces cost. When scaling down with core nodes, you also risk saturating the remaining nodes disk volume during HDFS re balance. If the nodes disk utilization exceeds 90%, it’ll mark the node as unhealthy making it unusable by YARN. 

In order to only scale with task nodes, you keep the number of core nodes constant and right size your core node EBS volumes for your HDFS usage. Remember to consider the hdfs replication factor which is configured via dfs.replication in hdfs-site.xml. It is recommended that a minimum, you keep 2 core nodes and set dfs.replication=2. 

Below is a managed scaling configuration example where the cluster will scale only on task nodes. In this example, the minimum nodes is 25, maximum 100. Of the 25 minimum, they will be all on-demand and core nodes. When the cluster needs to scale up, the remaining 75 will be task nodes on spot. 

![BP - 4](images/bp-4.png)

<!-- ## ** BP 4.1.2 Monitor Managed Scaling with Cloudwatch Metrics **

## ** BP 4.1.3 Consider adjusting YARN decommissioning timeouts depending on your workload **

## ** BP 4.1.4 When using multiple Task Groups, use the VCPU unit Type for scaling **

## ** BP 4.1.5 When using auto scaling, keep core nodes constant and scale with only task nodes **
## ** BP 4.1.6 When using auto scaling, keep core nodes constant and scale with only task nodes **
## ** BP 4.1.7 When using auto scaling, keep core nodes constant and scale with only task nodes **
## ** BP 4.1.8 When using auto scaling, keep core nodes constant and scale with only task nodes **
## ** BP 4.1.9 When using auto scaling, keep core nodes constant and scale with only task nodes ** -->