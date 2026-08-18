---
sidebar_label: Compute Optimization
---

# Compute Optimization

In the previous section, we covered some of the strategies that you can use to optimize your Amazon S3 storage costs and performance. In this section, we cover some features and ways to optimize compute costs across Amazon EMR on Amazon EC2, Amazon EMR on Amazon EKS, and Amazon EMR Serverless.

Amazon EC2 provides various purchasing options. When you launch Amazon EMR clusters, you have the ability to use On-Demand, Spot, or Reserved EC2 instances. Amazon EC2 Spot Instances offer spare compute capacity available at discounts compared to On-Demand Instances. Amazon EC2 Reserved Instances enable you to reserve EC2 instances at a significant discount compared to On-Demand pricing. For more detailed information, see [\<u>Instance Purchasing Options\</u>](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-instance-purchasing-options.html) in the *Amazon EMR Management Guide*.

## Spot Instances

Running EMR clusters with Spot instances can be useful for several scenarios. However, there are a few things that you must consider before choosing Spot instances for a particular workload. For example, if you're running a job that requires predictable completion time or has service level agreement (SLA) requirements, then using Spot instances may not be the best fit. For workloads that can be interrupted and resumed or workloads that can exceed an SLA, you can use Spot instances for the entire cluster.

Spot Instances receive a two-minute warning notification before interruption. During this window, your application can checkpoint progress, finish in-flight tasks, or gracefully decommission the node. Amazon EMR uses this notification to proactively decommission task nodes, allowing YARN to reschedule containers on remaining nodes.

Interruption rates vary by instance type, AWS Region, and time of day. You can monitor historical interruption frequency using the AWS Spot Instance Advisor and the Spot placement score API to select instance types with lower reclaim rates for your workloads.

To improve Spot capacity availability and reduce interruptions, use Instance fleets with the price-capacity-optimized allocation strategy. Configure the fleet with multiple instance types and Availability Zones to diversify across Spot capacity pools.

You can also use a combination of Spot and On-Demand instances for certain workloads. For example, if cost is more important than the time to completion, but you cannot tolerate a partial loss of work (have an entire cluster terminated), you can use Spot instances for the task nodes and use On-Demand/Reserved instances for the primary and core nodes.

Spot instances are also great for testing and development workloads. You can use Spot instances for an entire testing cluster to help you reduce costs when testing new applications.

## Reserved Instances

With Reserved Instances (RIs), you can purchase/reserve EC2 capacity at a lower price compared to On-Demand Instances. Reserved Instances work best when you have predictable compute needs you can match to a specific instance family and Region. This includes long-running clusters and steady baselines of transient clusters that aggregate to consistent usage throughout the term.

Keep in mind that for you to have reduced costs with RIs, you must make sure that your RI use over a period of a year is higher than 70%. For example, if you use transient EMR clusters and your clusters only run for a total of 12 hours per day, then your yearly use is 50%. This means that RIs might not help you reduce costs for that workload. Reserved Instances may help you to reduce costs for long-running clusters and workloads.

## Savings Plans

[\<u>Savings Plans\</u>](https://aws.amazon.com/savingsplans/) is a flexible discount model that provides you with the same discounts as Reserved Instances, in exchange for a commitment to use a specific amount (measured in dollars per hour) of compute power over a one- or three-year period. Every type of compute usage has an On-Demand price and a (lower) Savings Plan price. After you commit to a specific amount of compute usage per hour, all usage up to that amount will be covered by the Saving Plan, and anything past it will be billed at the On-Demand rate. If you have Reserved Instances, the Savings Plan applies to any On Demand usage that is not covered by the RIs. Savings Plans are available in two options:

- **Compute Savings Plans** provide the most flexibility and help to reduce your costs by up to 66%. The plans automatically apply to any EC2 instance regardless of region, instance family, operating system, or tenancy, including those that are part of your EMR clusters.

- **EC2 Instance Savings Plans** apply to a specific instance family within a region and provide the largest discount (up to 72%, just like Standard RIs). Like RIs, your savings plan covers usage of different sizes of the same instance type throughout a region.

AWS recommends Savings Plans as the default discount model for new commitments. Savings Plans offer comparable discounts while providing flexibility to change instance families, sizes, or Regions as your workloads evolve. Choose Reserved Instances only when your EMR clusters will remain on a fixed instance configuration for the full commitment term and you do not anticipate changes. 

## Instance Fleets

[\<u>Instance fleets\</u>](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-instance-fleet.html) is an Amazon EMR feature that provides you with variety of options for provisioning EC2 instances. This approach enables you to easily provision an EMR cluster with Spot Instances, On-Demand Instances, or a combination of both.

When you launch a cluster with Instance Fleets, you can select the target capacity for On-Demand and Spot Instances and specify a list of instance types and Availability Zones. Instance fleets choose the instance type and the Availability Zone that is the best fit to fulfill your launch request.

With Instance fleets, you can specify the maximum Spot price that you're willing to pay, set a timeout period for Spot provisioning, and choose allocation strategies such as price-capacity-optimized that select Spot pools with the best combination of price and availability. Instance fleets can span multiple Availability Zones and specify multiple instance types.

## Amazon EMR Managed Scaling

You can reduce costs by using the Amazon EMR managed scaling feature to dynamically scale your cluster. Amazon EMR continuously monitors cluster metrics and automatically adds or removes core and task nodes based on workload. You set the minimum and maximum cluster size, and Amazon EMR optimizes for cost and performance within those bounds. Managed scaling is available for clusters that use either Instance fleets or instance groups.

Managed scaling supports YARN applications such as Apache Spark, Apache Hadoop, Apache Hive, and Apache Flink. It does not apply to Apache HBase, Trino, or Presto. Scaling only applies to core and task nodes. It is useful for clusters with variable or unpredictable workloads, including cases where users submit jobs on demand.

#### 

#### Setting the scaling parameters

Four parameters shape managed scaling behavior. Set them to match your workload pattern:

- Minimum capacity **-** the baseline that’s always running. Size it to cover steady-state demand so jobs start without waiting for scale-up.

- Maximum capacity **-** the ceiling managed scaling can reach. Size it to cover your peak demand plus headroom for bursts, subject to your cost budget.

- Maximum On-Demand capacity **-** limits the portion of the cluster that runs on On-Demand Instances. Capacity above this limit goes to Spot. A common pattern is to match this to the minimum capacity, so the baseline runs On-Demand and scale-up uses Spot.

- Maximum core capacity **-** limits core nodes, which store HDFS data. Size this to your HDFS needs, so scale-out uses task nodes, which can be removed without risking HDFS data loss

#### Validating managed scaling for your workload

Amazon EMR publishes one-minute resolution CloudWatch metrics that show whether managed scaling is keeping up with demand. Monitor these metrics to validate the behavior:

- TotalUnitsRequested, TotalNodesRequested, or TotalVCPURequested - the target capacity managed scaling is requesting. Compare against the actual cluster size. A persistent gap means scale-up is lagging demand.

- ContainerPending - YARN work queued up waiting for capacity. A sustained high value means the cluster is undersized, consider raising the maximum. A value near zero throughout means the cluster has enough capacity.

With Amazon EMR 7.3 and higher, the following metrics are also available

- YarnContainersUsedMemoryGBSeconds and YarnContainersTotalMemoryGBSeconds - the ratio shows memory utilization across the cluster. Low utilization at steady state suggests you can lower the minimum.

- YarnNodesUsedVCPUSeconds and YarnNodesTotalVCPUSeconds - vCPU utilization across the cluster, useful for the same purpose.

For more information, see Using managed scaling in Amazon EMR in the Amazon EMR Management Guide.

**When to use Advanced Scaling**

Starting with Amazon EMR 7.0, Advanced Scaling adds a utilization-performance index that lets you control how managed scaling balances cost against job completion speed. A lower value prioritizes cost by scaling up less aggressively and releasing capacity sooner. A higher value prioritizes performance by scaling up aggressively and holding capacity longer. Set the index to one of: 1, 25, 50, 750 or 100.

- 1 (utilization optimized) — Prioritizes cost. Use for workloads with regular spikes where you can tolerate a slower scale-up

- 50 (balanced) —AWS recommended starting point. Use for steady workloads or those with a mix of short and long-running stages.

- 100 (performance optimized) — Prioritizes performance. Use for SLA-sensitive workloads where fast job completion time is critical.

For more information, see Advanced Scaling for Amazon EMR in the Amazon EMR Management Guide.
