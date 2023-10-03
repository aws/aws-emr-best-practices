# ** Benchmarking Checklist **

## **Environment and Infrastructure Checklist**

The following checklist assumes you are running benchmarks across deployment models (EC2 vs EKS vs Serverless) or vendors (EMR vs Databricks vs OSS).  Comparing at the deployment model or vendor level takes into consideration a number of variables such as runtime performance, scaling and pricing model. 

If running a benchmark for other purposes such as difference in hardware within the same deployment model, items in the checklist will not apply. 


|Checklist	|	|Notes	|
|---	|---	|---	|
|Are all instances On Demand	| :black_square_button:|Spot interruptions are unpredictable and impacts price-performance. Only use spot when taking into consideration how your benchmark handles spot interruptions and getting spot capacity. Deployment models EMR on EC2 have product differentiators that select instances with are most likely to not get interrupted.	|
|Are all instances the same family, size and generation	|:black_square_button:	|The total amount of compute (vCPU and Memory) should be consistent across benchmark runs. Compute will determine the performance of the application. Additionally, instances can vary in network performance. Additionally, if using Karpenter or Instancefleet, you should ensure the set of instances provided are the same. Note that depending on when the job is submitted, your results may vary	|
|If cluster scaling is enabled, does each deployment model have the same scaling configurations. (min, max)	|:black_square_button:	|The efficiency of scaling between deployment models and vendors can differ but the configurations as it relates to compute should be consistent	|
|Is the EMR cluster or image using the latest EMR version?	|:black_square_button:	|The latest versions of EMR will contain the best runtime performance	|
|Are the Application versions the same across deployment models, OSS and vendors?	|:black_square_button:	|Spark versions should be the same or the latest version that's offered	|
|Is the same data catalog being used across benchmarks?	|:black_square_button:	|Performance between local and remote hivemetastore and glue data catalog can differ	|
|Is the infrastructure being deployed in the same AZ?	|:black_square_button:	|AZ's may have differences in network latency or instance availability.	|
|Are the benchmarks starting from the same state and size. For example, cold start vs warm pool and the # of starting instances	|:black_square_button:	|Initializing compute resources impact price-performance. When comparing benchmarking, ensure applications are starting from the same state	|
|Is the amount and type of local disk consistent?	|:black_square_button:	|Size and type of local disk volumes impact workloads, especially shuffle heavy ones	|
|Are the security settings consistent across deployment models ?  This includes IAM role, security groups, data and in transit encryption	|:black_square_button:	|Security configurations such as encryption can impact performance	|
|Are network settings consistent across deployment models?	|:black_square_button:	|This includes VPC endpoints, NAT Gateways, public or private endpoints, or proxies. The flow of network traffic to access storage, catalog or endpoints impacts performance	|
|Are there differences in the AMI, bootstrap actions or container Image?	|:black_square_button:	|This can impact compute initialization as well as job startup. For example, eliminating the need to load a specific library before executing the job	|
|Are JDK settings consistent across deployment models	|:black_square_button:	|We've seen improved performance with JDK17. Ensure the versions are consistent across benchmarks	|

## **Workload Checklist**

|Checklist	|	|Notes	|
|---	|---	|---	|
|Is the input and output data the same (size, location, type, structure)?	|:black_square_button:	|As a best practice, all benchmark runs should point to the same input data set	|
|Are the applications being submitted the same?	|:black_square_button:	|SQL file or application should be the same	|
|Are the applications libraries the same?	|:black_square_button:	|This includes external libraries, python versions, or anything the application requires to run	|
|Are the applications parameters the same? 	|:black_square_button:	|These are application specific parameters passed in the job. These should be identical to ensure the same job is running	|
|Are the applications configurations the same? 	|:black_square_button:	|This refers to Spark configuration settings such as executor size, shuffle partitions or Dynamic Resource Allocation settings	|
|Is EMR using EMRFS library to write to S3	|:black_square_button:	|To take advantage of EMR's optimized run time, EMRFS (s3://) should be used. s3a is not supported and should only be used in OSS	|
|If an Open Table Format (OTF) is being used, is it consistent across benchmarks	|:black_square_button:	|Using OTF's can improve read, write and processing performance. 	|
|Is the application running in isolation? 	|:black_square_button:	|Resource contention can impact benchmark results because Spark workloads will run on any resource that is available. A best practice is to run each job independently. Also ensure that if submitting multiple jobs, jobs are submitted in the same sequence or sequentially.	|
|Is there any data or library caching that impacts future runs?	|:black_square_button:	|Generally, the first run will be slower than future runs because of caching. Keep this in mind when determining how many iterations of a run you want to do. Additional runs will negate any impact of caching but has a trade off of cost and time	|
|Is the applications JVM settings the same?	|:black_square_button:	|Performance is different across JDK version. JDK17 has seen to have the best performance. JVM settings also extend to GC settings. 	|
|Is the applications logging configurations the same? 	|:black_square_button:	|Logging parameters that are not the same such as level (DEBUG, INFO) can impact performance or storage requirements	|
|Are the applications being submitted the same way?	|:black_square_button:	|Ensure the entry point for job submission is the same. There are many ways to submit spark jobs such as EMR APIs, Livy, Airflow, Spark-submit. These can result in differences with how jobs are run	|