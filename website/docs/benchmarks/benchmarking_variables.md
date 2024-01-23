---
sidebar_position: 3
sidebar_label: Benchmarking Variables
---

# Benchmarking Variables

The goal of EMR benchmarking is to determine the impact of variables on price-performance. Variables can be categorized as either Controlled or Independent. Independent variables are manipulated in the benchmark and are the ones that change. Controlled variables are kept consistent to accurately measure the effect of the independent variables.

The purpose of your benchmark will determine which variables are considered independent or controlled. For example, if I wanted to benchmark the difference in price-performance between OSS Spark and EMR Spark, my independent variables would be the OSS and EMR Spark runtime engines, while my controlled variables would include workload, hardware type, input/output data, and purchasing options. However, if I wanted to benchmark the difference in price-performance between M family instances and R family instances on EMR Spark, then hardware now becomes an independent variable, while the runtime engine becomes a controlled variable.

To accurately measure the effect of the variables of interest (independent), it's important to understand which variables should be controlled and which ones should be kept consistent. The variables of interest are typically product differentiators, and only by keeping other variables consistent can you effectively measure the impact of these differentiators on price-performance. Let's examine each of these variables below.

**Pricing Model** 

The pricing model refers to how workloads are billed for infrastructure, storage, and service overhead based on the usage amount. We will examine all EMR deployment models, OSS, and vendors.

|	|Infrastructure Cost	|Service Cost	|Storage Cost	|
|---	|---	|---	|---	|
|EMR on EC2	|- Price dependent on Infrastructure Size - Billed per-second, with a one-minute minimum	|- Price dependent on Infrastructure Size - Billed per-second, with a one-minute minimum	|- Standard EBS pricing dependent on size of EBS volumes attached to instances	|
|EMR on EKS	|- Price dependent on Infrastructure Size - Billed per-second, with a one-minute minimum	|- vCPU and memory resources used from the time you start to download your EMR application image until the EKS Pod terminates, rounded up to the nearest second. Pricing is based on requested vCPU and memory resources for the Task or Pod.	|- Standard EBS pricing dependent on size of EBS volumes attached to instances/pods	|
|EMR Serverless	|N/A	|-  aggregate vCPU, memory, and storage resources used from the time workers are ready to run your workload until the time they stop, rounded up to the nearest second with a 1-minute minimum	|- 20 GB of ephemeral storage is available for all workers by default—you pay only for any additional storage that you configure per worker.  	|
|Databricks	|- Price dependent on Infrastructure Size - Billed per-second, with a one-minute minimum	|- Databricks has multiple compute types. SQL, All Purpose ETL, ML and more. Each compute type has a different price per Databricks Billing Unit (DBU) depending on the features offered. - Every instance has their own DBU/hour. Depending on the instance selected, the cost will be the instances [DBU/Hr] x [the compute type price]	|- Standard EBS pricing dependent on size of EBS volumes attached to instances/pods	|
|OSS	|- Price dependent on Infrastructure Size - Billed per-second, with a one-minute minimum	|N/A	|- Standard EBS pricing dependent on size of EBS volumes attached to instances/pods	|

Lets look at an example to help understand the differences.  

**Example:** 
Suppose you run a Spark application that requires two r5.4xlarge (16 vCPU, 128 GB) EC2 Instances and it runs at 100% utilization. The application runs for 3 hours. The total compute used is:

25 instances x 3 hours x 16 vCPU = 1200 vCPU hours 
25 instance x 3 hours x 128 GB = 9600 GB hours 

|	|Infrastructure Cost	|Service Cost	|Total	|% increase compared to EMR on EC2	|
|---	|---	|---	|---	|---	|
|EMR on EC2	|26 instances x 3 hours x r5.4xlarge EC2 price/hour  = 26 x 3 x $1.008  = $78.62	|26 instances x 3 hours x r5.4xlarge EMR price/hour  = 26 x 3 x $0.252  = $19.66	|$98.28	|0	|
|EMR on EKS	|25 instances x 3 hours x r5.4xlarge EC2 price/hour  = 25 x 3 x $1.008  = $75.6	|1200 vCPU Hours x $0.01012 / vCPU / Hours  = $12.14  9600 GB hours x $0.00111125 / GB / Hours  = $10.69	|$98.43	|0.15%	|
|EMR Serverless	|N/A	|1200 vCPU Hours x $0.052624 / vCPU / Hours  = $63.15  9600 GB hours x $0.0057785 / GB / Hours = $55.47	|$118.62	|17.15%	|
|OSS	|25 instances x 3 hours x r5.4xlarge EC2 price/hour  = 25 x 3 x $1.008  = $75.6	|N/A	|$75.60	|	|


Assumptions

* Assumed engine performance is the same across all deployment models 
* Assumed 100% utilization across all EMR deployment models
* Assumed x86, on-demand pricing in US-WEST-2
* EMR on EC2 requires 1 extra instance because of primary node
* Pricing for EMR-S is x86
* No Storage costs considered
* No provisioning costs considered

**Key Takeaway:** Assuming that the amount of compute to complete a workload is identical, all deployment models and vendors will have a different cost for that same amount of usage. Those with higher cost would need to have better performance to make up the difference in pricing. Pricing is a key differentiator between vendors and deployment models.

**Purchase Option** 

Amazon EC2 provides the following purchasing options to enable you to optimize your costs based on your needs:

* [**On-Demand Instances**](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-on-demand-instances.html) – Pay, by the second, for the instances that you launch.
* [**Savings Plans**](https://docs.aws.amazon.com/savingsplans/latest/userguide/what-is-savings-plans.html) – Reduce your Amazon EC2 costs by making a commitment to a consistent amount of usage, in USD per hour, for a term of 1 or 3 years.
* [**Reserved Instances**](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-reserved-instances.html) – Reduce your Amazon EC2 costs by making a commitment to a consistent instance configuration, including instance type and Region, for a term of 1 or 3 years.
* [**Spot Instances**](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html) – Request unused EC2 instances, which can reduce your Amazon EC2 costs significantly.
* [**Capacity Reservations**](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-capacity-reservations.html) – Reserve capacity for your EC2 instances in a specific Availability Zone for any duration.

For more details, see [here](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-purchasing-options.html)

Purchase options can significantly reduce the overall costs of a workload. However, when conducting benchmarking, it's crucial to maintain control over this variable. Specifically, the benchmark should exclusively utilize On-Demand Instances and avoid the use of Spot Instances. Spot Instances come with unpredictable interruption rates that can impact both the performance and cost of the job. When considering discounts such as savings plans, ensure that they are applied consistently across all deployment models.

One exception to this guideline arises when you wish to assess how certain deployment models or vendors handle spot instance interruptions and capacity acquisition. For instance, EMR on EC2 supports Instance Fleets with various allocation strategies designed to select instances with the lowest likelihood of interruption. If this is a variable you intend to incorporate into your price-performance analysis, you can run your benchmark with Spot Instances.

**Key Takeaway:** Only use on-demand instances for benchmarking. Spot has unpredictable interruptions that impact price-performance. Ensure all discounts are applied appropriately across services (ec2 vs emr). 

**Hardware Selection**

Hardware selection refers to the choice of instance types and storage utilized for benchmarking. To ensure consistency when benchmarking across deployment models and vendors, it's important to maintain hardware selection as a controlled variable. The hardware selection determines several critical aspects, including the number of containers that can run in parallel and the utilization of compute resources, as well as the speed and volume of data that can be written to local disk. These factors directly impact the overall cost of the job.

In the case of EMR Serverless, where you don't manually select hardware, it's essential to ensure that the total compute allocated matches the hardware provisioned at the EC2 level. As a controlled variable, instance family, size, generation, and local storage should be kept consistent. Exceptions to this rule may occur if a vendor or deployment model offers instances that are not available in the others. For instance, if EMR on EC2 or Serverless introduces a new instance type, you can consider it a differentiator and treat it as an independent variable in your benchmarking analysis. 

Hardware can be an independent variable when you want to measure the difference in price-performance between instance types. This is useful if you are benchmarking the same deployment model (keeping Engine/deployment as a controlled variable ) to determine the most optimal hardware to use for your application. 

**Key Takeaway:** Use the same instance type, family and size while benchmarking. Changes in these variables will result in differences in price-performance. Changing hardware is only useful when isolating the change to hardware. For example, comparing performance of R and M with EMR on EC2. 

**Workload**

Workload refers to the specific job being benchmarked, encompassing various elements such as the input data being read, the job type (streaming, batch, SQL), the processing or logic within the code, and the output data being written. All of these variables have a substantial impact on price-performance and must be maintained consistently throughout the benchmarking process. 

For instance, consider a scenario where two benchmarks involve the same amount of data but exhibit slightly different data skew. In such cases, completing the same job may require more compute or incur higher costs due to the variations in data distribution. Similarly, if one benchmark writes data in Parquet format while the other uses Avro, and Parquet, based on the data distribution, can produce more compact files, it may require less compute and result in lower costs.

Another important workload consideration is if an Open Table Format (OTF) is being used. Iceberg, Delta and Hudi are increasingly more common in customers workloads and can significantly impact the performance of reading and writing. When it comes to OTF, we also want to keep this variable consistent across benchmarks. 

There are instances when you might want to treat Workload as an independent variable, such as when comparing performance across different types of applications for a given engine or deployment model. For example, the behavior of an I/O-bound, CPU-bound, or memory-bound job can differ across Spark engines.

**Key Takeaway:** Keep everything with the workload constant between benchmarks. This extend beyond application code and also includes data input, output, OTF, compression, data distribution and caching

**Application Configuration** 

Application configurations impact the way a job is run. These configurations include Spark configs such as executor memory or dynamic resource allocation (DRA), Hadoop configs such as yarn memory and JVM configs, such as GC or JDK version. Differences in application configurations impact how price-performant a job is. For example, an IO bound job may have a higher cost with spark executor sizes of 1vCPU:8Gb Memory vs 1vCPU:2Gb Memory because the job does not utilize all the memory. In addition to application configurations, there are features controlled by configurations such as Spark’s Dynamic Resource allocation. This allows spark applications to scale contain increasing the parallelism of task processing. These factor impact price-performance and should be a controlled variable during benchmarking. Note that application configuration that do not apply or exist between deployment models and vendors can be skipped. Most Spark configurations will exist on all deployment models and vendors. 

Application configuration can be an independent variable when trying to optimize your job for a given engine and deployment model. For example, If you have an application that is running on EMR-S and want to understand the impact of varying spark executor container sizes. 

**Key Takeaway:** Maintain the same set of application configurations across all benchmarks. When no application configurations are known, start with the default configurations provided by the deployment model. 

**Runtime Performance**

Runtime performance refers to the speed at which a job is completed. It represents one of the key distinguishing factors between EMR, various vendors, and OSS (Open Source Software) solutions. Runtime performance is an independent variable directly influencing the cost of the job. Improved runtime performance reduces the amount of compute resources required to complete the task. Across EMR deployment models, the engine's runtime remains consistent.

The impact of runtime performance is contingent on the type of workload. For instance, jobs with heavy I/O demands may not experience the same level of performance improvement as those that are memory or CPU-bound. The outcome can also be influenced by factors like the APIs in use, join conditions, filter criteria, and more. Many of the Spark optimizations carried out by the EMR team are based on TPC-DS, an industry-standard benchmark representative of customer workloads. While TPC-DS serves as a solid baseline, the most accurate assessment of runtime performance comes from analyzing real customer workloads.

**Key Takeaway:** EMR deployment models and vendors may also introduce specific features unrelated to runtime but impacting the overall cost. These features may involve enhancements to Spark libraries, such as write improvements to EMRFS when interacting with S3 or read optimizations due to OTF (Open Table Format) compaction. Additionally, differences in external services like shuffle service or how Spark containers are scheduled can all influence overall price-performance. While benchmarking, these deployment or vendor-specific features can be considered as part of runtime performance.

Consider runtime as a controlled variable when you're not evaluating other engines and aim to optimize the price-performance of the chosen engine across variables such as hardware or application configurations.

**Key Takeaway:** Runtime performance is a key differentiator that has a significant impact to price-performance. By having runtime performance as your independent variable and keeping all other variables controlled, you can properly measure the effect of runtime on price-performance.  Runtime performance is not applicable when comparing across deployment models because all deployments use the same engine.

**Infrastructure Provisioning and Scaling** 

Infrastructure provisioning and scaling refer to the time it takes for compute resources to become available for applications to run and the time it takes for compute resources to terminate. The longer it takes for infrastructure to provision or scale, the higher the associated cost.

Provisioning and scaling up represent compute time that cannot be used, contributing to under utilization. The same holds true for scaling down.

Infrastructure provisioning also encompasses the time required to install applications. Consequently, deployments based on container images will have shorter provisioning times compared to virtual machines, which download and install libraries after the infrastructure is ready. If deployment models are employed as long-running compute solutions, infrastructure provisioning is minimized.

In addition to provisioning and termination times for scaling, another critical aspect is scaling efficiency. This includes factors like how quickly scaling responds to changes in usage and the accuracy of scaling to meet demand. Prolonged scaling or excessive scaling can have a detrimental impact on overall costs.

Regarding benchmarking, infrastructure provisioning and scaling processes are unique to each deployment model. These are control plane features that serve as key differentiators and should be regarded as independent variables.

**Key Takeaway:** Similar to Runtime performance, infrastructure provisioning and scaling are key differentiators but at the control plane layer instead of data plane. The impact to price-performance will be reflected in the overall cost of the job through compute utilization. 

**Summary - Benchmark Variable Checklist** 

Independent = Variables that are manipulated or what changes in the benchmark 
Controlled = Variables that are kept consistent to properly measure the effect of independent variables. 

|What are you Benchmarking?	|Pricing Model	|Purchase Option 	|**Hardware Selection**	|**Workload**	|**Application Configuration**	|**Runtime Performance**	|**Infrastructure Provisioning and Scaling**	|Summary	|
|---	|---	|---	|---	|---	|---	|---	|---	|---	|
|Vendors (OSS, EMR)	|Independent	|Controlled	|Controlled	|Controlled	|Controlled	|Independent	|Controlled	|When benchmarking vendors, you only want to know how the vendor specific runtime and their pricing model impacts price-performance. Keep everything about the workload, configurations, hardware and purchasing options the same. 	|
|Deployment Models	|Independent	|Controlled	|Controlled	|Controlled	|Controlled	|Controlled	|Independent	|When benchmarking deployment models, you only want to know how the infrastructure provisioning, scaling and pricing model impacts price-performance. Keep everything about the workload, configurations, hardware and purchasing options the same. 	|
|Application configurations	|Controlled	|Controlled	|Controlled	|Controlled	|Independent	|Controlled	|Controlled	|Only the changes to your application configurations are independent to determine how they impact price performance	|
|Hardware configurations	|Controlled	|Controlled	|Independent	|Controlled	|Controlled	|Controlled	|Controlled	|Only the changes to your hardware selections are independent to determine how they impact price performance	|
