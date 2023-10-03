# ** Benchmarking Variables **

The goal of EMR benchmarking is to determine the impact of variables to price-performance. Variables can be either Controlled or Independent. Independent variables are manipulated in the benchmark and is what changes. Controlled variables are kept consistent to properly measure the effect of the independent variables. 

The purpose of your benchmark will determine which variables are independent or controlled. For example, If I wanted to benchmark the difference in price performance between OSS Spark and EMR Spark, my independent variables would be the OSS and EMR Spark runtime engines, while my controlled variables would be workload , hardware type, input/output data, and purchasing options. However, If I wanted to benchmark the different in price performance between M family instances and R family instances on EMR Spark, then hardware now becomes an independent variable while runtime engine is a controlled variable. 

To accurately measure the effect of the variables of interest (independent) its important to understand which variables should be controlled and which ones should be kept consistent. The variables of interest are typically product differentiators and only by keeping other variables consistent, will you be able to measure the impact of these differentiators to price-performance. Lets look at each of these variables below. 

**Pricing Model** 
Pricing model refers to how workloads are billed for both Infrastructure, storage and service overhead depending on the amount of usage. We’ll look at all EMR deployment models, OSS and Vendors. 

|	|Infrastructure Cost	|Service Cost	|Storage Cost	|
|---	|---	|---	|---	|
|EMR on EC2	|- Price dependent on Infrastructure Size <br>- Billed per-second, with a one-minute minimum	|- Price dependent on Infrastructure Size <br>- Billed per-second, with a one-minute minimum	|- Standard EBS pricing dependent on size of EBS volumes attached to instances	|
|EMR on EKS	|- Price dependent on Infrastructure Size <br>- Billed per-second, with a one-minute minimum	|- vCPU and memory resources used from the time you start to download your EMR application image until the EKS Pod terminates, rounded up to the nearest second. Pricing is based on requested vCPU and memory resources for the Task or Pod.	|- Standard EBS pricing dependent on size of EBS volumes attached to instances/pods	|
|EMR Serverless	|N/A	|-  aggregate vCPU, memory, and storage resources used from the time workers are ready to run your workload until the time they stop, rounded up to the nearest second with a 1-minute minimum	|- 20 GB of ephemeral storage is available for all workers by default—you pay only for any additional storage that you configure per worker.  	|
|Databricks	|- Price dependent on Infrastructure Size <br>- Billed per-second, with a one-minute minimum	|- Databricks has multiple compute types. SQL, All Purpose ETL, ML and more. Each compute type has a different price per Databricks Billing Unit (DBU) depending on the features offered. <br>- Every instance has their own DBU/hour. Depending on the instance selected, the cost will be the instances [DBU/Hr] x [the compute type price]	|- Standard EBS pricing dependent on size of EBS volumes attached to instances/pods	|
|OSS	|- Price dependent on Infrastructure Size <br>- Billed per-second, with a one-minute minimum	|N/A	|- Standard EBS pricing dependent on size of EBS volumes attached to instances/pods	|

Lets look at an example to help understand the differences.  

**Example:** 
Suppose you run a Spark application that requires two r5.4xlarge (16 vCPU, 128 GB) EC2 Instances and it runs at 100% utilization. The application runs for 3 hours. The total compute used is:

25 instances x 3 hours x 16 vCPU = 1200 vCPU hours 
25 instance x 3 hours x 128 GB = 9600 GB hours 

|	|Infrastructure Cost	|Service Cost	|Total	|% increase compared to EMR on EC2	|
|---	|---	|---	|---	|---	|
|EMR on EC2	|26 instances x 3 hours x r5.4xlarge EC2 price/hour <br> = 26 x 3 x $1.008 <br> = $78.62	|26 instances x 3 hours x r5.4xlarge EMR price/hour <br> = 26 x 3 x $0.252 <br> = $19.66	|$98.28	|0	|
|EMR on EKS	|25 instances x 3 hours x r5.4xlarge EC2 price/hour <br> = 25 x 3 x $1.008 <br> = $75.6	|1200 vCPU Hours x $0.01012 / vCPU / Hours <br> = $12.14 <br> 9600 GB hours x $0.00111125 / GB / Hours <br> = $10.69	|$98.43	|0.15%	|
|EMR Serverless	|N/A	|1200 vCPU Hours x $0.052624 / vCPU / Hours <br> = $63.15 <br> 9600 GB hours x $0.0057785 / GB / Hours <br>= $55.47	|$118.62	|17.15%	|
|OSS	|25 instances x 3 hours x r5.4xlarge EC2 price/hour <br> = 25 x 3 x $1.008 <br> = $75.6	|N/A	|$75.60	|	|

<! -- Databicks is 27.08% or 1.37x higher in cost compared to EMR on EC2 -->
<! -- Databricks is 11.99% or 1.14x higher in cost compared to EMR Serverless -->

Assumptions

* Assumed engine performance is the same across all deployment models 
* Assumed 100% utilization across all EMR deployment models
* Assumed x86, on-demand pricing in US-WEST-2
* EMR on EC2 requires 1 extra instance because of primary node
* Pricing for EMR-S is x86
<! -- * For Databricks compute type, we chose “Jobs Compute”, “Enterprise” plan which as the lowest DBU price of $0.20/DBU. $/DBU can go as high as $0.70 so it’s important to understand which compute type is being used for benchmarking. -->
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

Purchase options can have a significant impact in reducing overall costs of a workload. However, while benchmarking it’s important to keep this variable controlled. Specifically, the benchmark should not be using Spot Instances and only On Demand. Spot instances have unpredictable interruption rates which will impact the performance and cost of the job. If factoring in discounts such as savings plan or EPD, ensure they are being applied to all deployment models. Additionally, it’s important to note that customers may have different discounts for compute (EC2 costs) vs analytics (EMR overhead, EMR serverless).  Speak with customer account teams to get details on their Enterprise Discounts Program (EDP) and to understand which discount applies to which AWS charge. 

One exception to this rule is when you want to benchmark how certain deployment models or vendors handle spot interruption and getting capacity. For example, EMR on EC2 supports Instance Fleets with different allocation strategies that select instances with the lowest likelihood of getting interrupted. If this is a variable you want to factor into price-performance, you can run your benchmark with spot. 

**Key Takeaway:** Only use on-demand instances for benchmarking. Spot has unpredictable interruptions that impact price-performance. Ensure all discounts are applied appropriately across services (ec2 vs emr). 

**Hardware Selection**
Hardware selection refers to the instance types and storage used for benchmarking. For the purpose of benchmarking across deployment models and vendors, keep hardware selection a controlled variable. Hardware selection will determine how many containers can run in parallel and the utilization of the compute or, how much and fast data can be written to local disk. This directly impacts the cost of the job. In the case of EMR Serverless where you don't select hardware, ensure the total compute allocated is equal to the hardware provisioned at the EC2 level.  As a controlled variable, instance family, size, generation and local storage should be kept the same. Exceptions to this include if a vendor or deployment model offers instances not available to the others. For example, if EMR on EC2 or Serverless came out with a new instance type, then you can consider that as a differentiator to the offering that you keep as an independent variable. 

Hardware can be an independent variable when you want to measure the difference in price-performance between instance types. This is useful if you are benchmarking the same deployment model (keeping Engine/deployment as a controlled variable ) to determine the most optimal hardware to use for your application. 

**Key Takeaway:** Use the same instance type, family and size while benchmarking. Changes in these variables will result in differences in price-performance. Changing hardware is only useful when isolating the change to hardware. For example, comparing performance of R and M with EMR on EC2. 

**Workload**
Workload refers to the job that is being benchmarked. An application includes the input data being read, the type of job (streaming, batch, sql), processing or logic in the code and the output data being written. All of these variables impact price-performance and need to be kept consistent. For example, if one benchmark has the same amount of data but slightly more data skew, more compute or cost may be required to complete the same job. Similarly, if one benchmark is written in parquet and the other in avro and based on the data distribution, parquet can write files in a more compact format, then less compute and cost would be required. 

Another important workload consideration is the Open Table Format (OTF). Iceberg, Delta and Hudi are increasingly more common in customers workloads and can significantly impact the performance of reading and writing. When it comes to OTF, we also want to keep this variable consistent across benchmarks. In these cases, we can either consider if other OTF support the same functionality or factor that optimization as part of the overall price-performance. 

Scenarios when you want to make Workload an independent variable is when you want to compare the performance across different types of applications for a given engine or deployment model. For example, the behavior of an IO, CPU or memory bound job can be different across spark engines. 

**Key Takeaway:** Keep everything with the workload constant between benchmarks. This extend beyond application code and also includes data input, output, OTF, compression, data distribution and caching

**Application Configuration** 
Application configurations impact the way a job is run. These configurations include Spark configs such as executor memory or dynamic resource allocation (DRA), Hadoop configs such as yarn memory and JVM configs, such as GC or JDK version. Differences in application configurations impact how price-performant a job is. For example, an IO bound job may have a higher cost with spark executor sizes of 1:8 vs 1:2 because the job does not utilize all the memory. In addition to application configurations, there are features controlled by configurations such as Spark’s Dynamic Resource allocation. This allows spark applications to scale contain increasing the parallelism of task processing. These factor impact price-performance and should be a controlled variable during benchmarking. Note that application configuration that do not apply or exist between deployment models and vendors can be skipped.  Spark configurations will exist on all deployment models and vendors. 

Application configuration can be an independent variable when trying to optimize your job for a given engine and deployment model. For example, If you have an application that is running on EMR-S and want to understand the impact of varying spark executor container sizes. 

**Key Takeaway:** Maintain the same set of application configurations across all benchmarks. When no application configurations are known, start with the default configurations provided by the deployment model. 

**Runtime Performance**
Runtime performance is the speed a job is completed. It is one of the key differentiators between EMR, vendors and OSS and is an independent variable that directly impacts the cost of the job. With higher runtime performance, the amount of compute required to complete the work is reduced. Across EMR deployment models, engine runtime will be consistent.

The impact of runtime performance is dependent on the workload type. For example, jobs that are heavy IO may not see the same performance improvement as something that is memory or CPU bound. It can also depend on the type of APIs being used, join conditions, filter conditions and more. Many of the Spark optimizations that the EMR team has made is based on TPC-DS. TPC-DS is an industry standard benchmark that is representative of customer workloads. While it is a good baseline, the best approach to understanding runtime performance is using real customer workloads. 

**Note:** EMR deployment models and Vendors will also have specific features not related to runtime, but impact the overall cost.  These are improvements to the libraries that Spark uses. For example, write improvements to EMRFS when writing to S3 or read optimizations because of OTF compaction. Additionally, there are differences in external services like shuffle service or  how spark containers are scheduled. All of these impact overall price-performance. While benchmarking these deployment or vendor specific features can be considered as part of runtime performance. 

Consider runtime as a controlled variable when you’re not evaluating other engines and want to optimize the price-performance of the chosen engine across variables such as Hardware or application configurations. 

**Key Takeaway:** Runtime performance is a key differentiator that has a significant impact to price-performance. By having runtime performance as your independent variable and keeping all other variables controlled, you can properly measure the effect of runtime on price-performance.  Runtime performance is not applicable when comparing across deployment models because all deployments use the same engine.

**Infrastructure Provisioning and Scaling** 
Infrastructure provisioning and scaling is the time it takes compute to be available for applications to run and the time it takes for compute to shutdown. The longer it takes for infrastructure to provision or scale, the higher the cost.
Provisioning and scaling up is compute time that cant be used so it counts towards under utilization. Similar is true for scaling down. 

Infrastructure provisioning  also includes the time it takes to install applications. This means that container Image based deployments will have reduced provisioning time compared to virtual machines, that download and install libraries after the infrastructure is ready. If the deployment models are used as long running compute, infrastructure provisioning is reduced. In addition to provisioning and termination time for scaling, another aspect is the scaling efficiency. For example, how fast does scaling react to change in usage or the accuracy of scaling to meet demand. Taking too long to scale or over scaling has a negative impact to overall cost. 

When it comes to benchmarking,  infrastructure provisioning and scaling are unique to each deployment model. These are control plane features that are key differentiators and should be considered an independent variable. 

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
