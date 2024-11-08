"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[4184],{2873:(e,i,n)=>{n.r(i),n.d(i,{assets:()=>c,contentTitle:()=>o,default:()=>u,frontMatter:()=>a,metadata:()=>r,toc:()=>l});var s=n(4848),t=n(8453);const a={},o="Optimizing Resource Utilization",r={id:"bestpractices/Cost Optimizations/maximizing-resource-utilization",title:"Optimizing Resource Utilization",description:"Cluster utilization in EMR refers to the effective use of computing resources, which include memory and CPU. The pricing structure for EMR on EC2 relies on resource usage such as CPU, memory, and disk. Ensuring optimal cluster utilization is crucial for getting the maximum value from the EMR cluster. To maintain high cluster utilization in EMR on EC2, it is essential to follow best practices. This includes configuring managed scaling, adjusting container sizes at the application level (requiring EMR observability setup), and selecting the right EC2 instance types, as explained in this document.",source:"@site/docs/bestpractices/1 - Cost Optimizations/maximizing-resource-utilization.md",sourceDirName:"bestpractices/1 - Cost Optimizations",slug:"/bestpractices/Cost Optimizations/maximizing-resource-utilization",permalink:"/aws-emr-best-practices/docs/bestpractices/Cost Optimizations/maximizing-resource-utilization",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/bestpractices/1 - Cost Optimizations/maximizing-resource-utilization.md",tags:[],version:"current",frontMatter:{},sidebar:"bestpractices",previous:{title:"Best Practices",permalink:"/aws-emr-best-practices/docs/bestpractices/Cost Optimizations/best_practices"},next:{title:"Introduction",permalink:"/aws-emr-best-practices/docs/bestpractices/Reliability/introduction"}},c={},l=[{value:"Actual EC2 Instance Resource Usage vs. YARN Allocated Resource Usage",id:"actual-ec2-instance-resource-usage-vs-yarn-allocated-resource-usage",level:2},{value:"Allocated vs. Utilized",id:"allocated-vs-utilized",level:3},{value:"Optimizing Cluster Utilization",id:"optimizing-cluster-utilization",level:2},{value:"Enabling Managed Scaling",id:"enabling-managed-scaling",level:3},{value:"When to Use Managed Scaling",id:"when-to-use-managed-scaling",level:4},{value:"How Managed Scaling Decides if a Scaling Action is Needed",id:"how-managed-scaling-decides-if-a-scaling-action-is-needed",level:4},{value:"Optimizing Resource Utilization through Managed Scaling Adjustments",id:"optimizing-resource-utilization-through-managed-scaling-adjustments",level:3},{value:"1. Keep Core Nodes Constant and Scale with Only Task Nodes",id:"1-keep-core-nodes-constant-and-scale-with-only-task-nodes",level:4},{value:"2. Selecting the Appropriate Min and Max Managed Scaling Configuration",id:"2-selecting-the-appropriate-min-and-max-managed-scaling-configuration",level:4},{value:"3. AM Exclusivity to On-Demand/Core Nodes",id:"3-am-exclusivity-to-on-demandcore-nodes",level:4},{value:"4) Spot Instance Usage Considerations",id:"4-spot-instance-usage-considerations",level:4},{value:"Tailored Optimization Strategies for Specific Use-Cases",id:"tailored-optimization-strategies-for-specific-use-cases",level:3},{value:"1) Use Cases Involving Peak and Non-Peak Hours in a Long-Running Cluster",id:"1-use-cases-involving-peak-and-non-peak-hours-in-a-long-running-cluster",level:4},{value:"2) Use Cases with Spiky Workloads",id:"2-use-cases-with-spiky-workloads",level:4},{value:"3) Use Cases with Recurring Jobs",id:"3-use-cases-with-recurring-jobs",level:4},{value:"Adjusting Container Sizes at the Application Level",id:"adjusting-container-sizes-at-the-application-level",level:3},{value:"Spark",id:"spark",level:4},{value:"Selecting the Right EC2 Instance Type",id:"selecting-the-right-ec2-instance-type",level:3}];function d(e){const i={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",h4:"h4",header:"header",img:"img",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,t.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(i.header,{children:(0,s.jsx)(i.h1,{id:"optimizing-resource-utilization",children:"Optimizing Resource Utilization"})}),"\n",(0,s.jsx)(i.p,{children:"Cluster utilization in EMR refers to the effective use of computing resources, which include memory and CPU. The pricing structure for EMR on EC2 relies on resource usage such as CPU, memory, and disk. Ensuring optimal cluster utilization is crucial for getting the maximum value from the EMR cluster. To maintain high cluster utilization in EMR on EC2, it is essential to follow best practices. This includes configuring managed scaling, adjusting container sizes at the application level (requiring EMR observability setup), and selecting the right EC2 instance types, as explained in this document."}),"\n",(0,s.jsx)(i.p,{children:"This document provides insights on cluster utilization, covering actual memory and CPU usage, monitoring cluster utilization using Amazon CloudWatch, identifying key factors to maximize utilization, and troubleshooting underutilized clusters."}),"\n",(0,s.jsx)(i.h2,{id:"actual-ec2-instance-resource-usage-vs-yarn-allocated-resource-usage",children:"Actual EC2 Instance Resource Usage vs. YARN Allocated Resource Usage"}),"\n",(0,s.jsx)(i.p,{children:"Actual EC2 Instance Resource Usage refers to the actual CPU, memory, and disk utilized by the EC2 instances hosting the YARN ResourceManager/NodeManagers. YARN Allocated Resource Usage refers to the resources allocated to YARN applications by the ResourceManager and NodeManagers based on the resource requests specified by the applications."}),"\n",(0,s.jsx)(i.p,{children:"When the ResourceManager receives an application from a client, it launches the ApplicationMaster on a node and sends the information for application execution. The ApplicationMaster, after resource allocation from ResourceManager, communicates with NodeManagers on each node, launches containers (which consist of memory and CPU) on these instances, and executes the application."}),"\n",(0,s.jsxs)(i.p,{children:["The allocation of resources to YARN containers is defined by configurations specific to the processing frameworks utilized, such as ",(0,s.jsx)(i.code,{children:"spark.executor.memory"})," and ",(0,s.jsx)(i.code,{children:"spark.executor.cores"})," for Spark, ",(0,s.jsx)(i.code,{children:"hive.tez.container.size"})," for Hive on Tez, and ",(0,s.jsx)(i.code,{children:"mapreduce.map.memory.mb"})," and ",(0,s.jsx)(i.code,{children:"mapreduce.reduce.memory.mb"})," for Hadoop MapReduce. Each framework has its default configurations defining the container size for its tasks, which can be customized by the user."]}),"\n",(0,s.jsxs)(i.p,{children:["You can refer to our documentation for insights into the default configured resource allocation settings for YARN based on instance type at ",(0,s.jsx)(i.a,{href:"https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-hadoop-task-config.html",children:"AWS EMR Task Configuration"}),"."]}),"\n",(0,s.jsx)(i.p,{children:"Alternatively, to understand the YARN resource allocation on your cluster instances, you can use the following command after SSHing into the node:"}),"\n",(0,s.jsx)(i.pre,{children:(0,s.jsx)(i.code,{className:"language-bash",children:"$ yarn node -list -showDetails\n"})}),"\n",(0,s.jsx)(i.p,{children:(0,s.jsx)(i.img,{alt:"YARN Node List Details",src:n(6732).A+"",width:"1083",height:"205"})}),"\n",(0,s.jsxs)(i.p,{children:["For example, consider the ",(0,s.jsx)(i.code,{children:"r7g.2xlarge"})," instance type, which has 64 GiB (65,536 MiB) of memory and 8 cores. Out of this, EMR allocates 54,272 MiB to YARN."]}),"\n",(0,s.jsx)(i.p,{children:(0,s.jsx)(i.img,{alt:"r7g.2xlarge Config Details",src:n(7367).A+"",width:"787",height:"412"})}),"\n",(0,s.jsx)(i.h3,{id:"allocated-vs-utilized",children:"Allocated vs. Utilized"}),"\n",(0,s.jsx)(i.p,{children:"If there is an overallocation of resources to YARN containers, such as allocating 4 GB to a YARN container while only 2 GB is actually used, the YARN cluster's resource utilization will appear high. However, the overall OS-level resource utilization could remain normal. In this scenario, resizing the containers based on actual usage is necessary. Proper EMR observability setup, as detailed in this GitHub repository, is essential for gaining insights into the cluster's state."}),"\n",(0,s.jsx)(i.h2,{id:"optimizing-cluster-utilization",children:"Optimizing Cluster Utilization"}),"\n",(0,s.jsx)(i.p,{children:"To maintain high cluster utilization in EMR on EC2, follow best practices such as enabling managed scaling, configuring container sizes at the application level, leveraging heterogeneous executors when using instances with varying vCore-to-memory ratios, and choosing the right instance type."}),"\n",(0,s.jsx)(i.h3,{id:"enabling-managed-scaling",children:"Enabling Managed Scaling"}),"\n",(0,s.jsxs)(i.p,{children:["Managed scaling allows you to automatically increase or decrease the number of instances or units in your cluster based on workload. Amazon EMR continuously evaluates cluster metrics to make scaling decisions that optimize clusters for cost and speed. More details about cluster metrics can be found ",(0,s.jsx)(i.a,{href:"https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-managed-scaling.html",children:"here"}),". Managed scaling is available for clusters composed of either instance groups or instance fleets."]}),"\n",(0,s.jsx)(i.h4,{id:"when-to-use-managed-scaling",children:"When to Use Managed Scaling"}),"\n",(0,s.jsx)(i.p,{children:"Managed Scaling is beneficial for clusters that meet the following criteria:"}),"\n",(0,s.jsxs)(i.ul,{children:["\n",(0,s.jsxs)(i.li,{children:["\n",(0,s.jsxs)(i.p,{children:[(0,s.jsx)(i.strong,{children:"Periods of Low Demand"}),": Managed scaling is advantageous for clusters experiencing changes in demand. During low demand, it reduces resource allocation to avoid unnecessary consumption, optimizing resource utilization and cost efficiency."]}),"\n"]}),"\n",(0,s.jsxs)(i.li,{children:["\n",(0,s.jsxs)(i.p,{children:[(0,s.jsx)(i.strong,{children:"Fluctuating Workload Patterns"}),": Clusters with dynamic or unpredictable workloads benefit from managed scaling as it adjusts resource capacity according to evolving needs."]}),"\n"]}),"\n",(0,s.jsxs)(i.li,{children:["\n",(0,s.jsxs)(i.p,{children:[(0,s.jsx)(i.strong,{children:"Handling Multiple Jobs"}),": Managed scaling helps clusters running multiple jobs by automatically adjusting capacity based on workload intensity, ensuring efficient resource utilization and preventing bottlenecks."]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(i.p,{children:[(0,s.jsx)(i.strong,{children:"Note"}),": Managed Scaling is not recommended for clusters with steady-state resource usage, where the cluster\u2019s resource consumption remains relatively stable and predictable."]}),"\n",(0,s.jsx)(i.h4,{id:"how-managed-scaling-decides-if-a-scaling-action-is-needed",children:"How Managed Scaling Decides if a Scaling Action is Needed"}),"\n",(0,s.jsxs)(i.p,{children:["Using high-resolution metrics with data at a one-minute granularity, such as ",(0,s.jsx)(i.code,{children:"YARNMemoryAvailablePercentage"}),", ",(0,s.jsx)(i.code,{children:"ContainersPendingRatio"}),", ",(0,s.jsx)(i.code,{children:"CapacityRemainingGB"}),", ",(0,s.jsx)(i.code,{children:"HDFSUtilization"}),", ",(0,s.jsx)(i.code,{children:"AppsPending"}),", and cluster size, the Managed Scaling algorithm decides whether to scale the cluster up or down. The EMR team consistently enhances and refines this algorithm."]}),"\n",(0,s.jsxs)(i.p,{children:["Managed Scaling collects these metrics from the cluster to observe resource utilization and additional demands. It estimates the number of YARN containers that fit on a typical node in your cluster, called ",(0,s.jsx)(i.code,{children:"ContainerPerUnit"}),". When the cluster is low on memory and applications are waiting for containers, Managed Scaling adds additional nodes based on the ",(0,s.jsx)(i.code,{children:"ContainerPerUnit"})," and cluster configuration."]}),"\n",(0,s.jsx)(i.h3,{id:"optimizing-resource-utilization-through-managed-scaling-adjustments",children:"Optimizing Resource Utilization through Managed Scaling Adjustments"}),"\n",(0,s.jsx)(i.h4,{id:"1-keep-core-nodes-constant-and-scale-with-only-task-nodes",children:"1. Keep Core Nodes Constant and Scale with Only Task Nodes"}),"\n",(0,s.jsx)(i.p,{children:"Scaling with only task nodes improves the time for nodes to scale in and out because task nodes do not coordinate storage as part of HDFS. During scale-up, task nodes do not need to install data node daemons, and during scale-down, they do not need to rebalance HDFS blocks. This improvement reduces cost and improves performance. Keeping a static fleet of core nodes also avoids saturating the remaining nodes' disk volume during HDFS rebalance."}),"\n",(0,s.jsx)(i.h4,{id:"2-selecting-the-appropriate-min-and-max-managed-scaling-configuration",children:"2. Selecting the Appropriate Min and Max Managed Scaling Configuration"}),"\n",(0,s.jsxs)(i.p,{children:["Review your existing jobs or conduct a sample run to understand application usage patterns. Analyze resource utilization, including memory and CPU, and identify any bottlenecks during peak loads. This analysis will help determine the maximum and minimum values for Managed Scaling. For cost efficiency, set a smaller ",(0,s.jsx)(i.code,{children:"maxCapacity"})," to distribute the workload over a longer runtime of a smaller cluster. For performance improvement, a higher ",(0,s.jsx)(i.code,{children:"maxCapacity"})," avoids extended pending states for containers. Experiment with both ",(0,s.jsx)(i.code,{children:"maxCapacity"})," and ",(0,s.jsx)(i.code,{children:"minCapacity"})," to balance job runtime and cost/utilization."]}),"\n",(0,s.jsx)(i.h4,{id:"3-am-exclusivity-to-on-demandcore-nodes",children:"3. AM Exclusivity to On-Demand/Core Nodes"}),"\n",(0,s.jsxs)(i.p,{children:["The Application Master (AM) requests, launches, and monitors application-specific resources. If the AM container fails, the whole job fails. To mitigate the risk of Spot instance reclamation, allocate AMs on On-Demand nodes. Non-AM containers, such as executors, can be placed on Spot nodes to reduce costs. EMR 5.19 and later uses node labels to assign AMs to core nodes. For EMR 6.x, configure node labels to specify the market type as either On-Demand or Spot, and update ",(0,s.jsx)(i.code,{children:"yarn-site"}),' configuration to ensure AMs are assigned to the "on_demand" label.']}),"\n",(0,s.jsx)(i.p,{children:"Starting with EMR 7.2, Amazon EMR on EC2 introduced Application Master (AM) Label Awareness. Enable YARN node labeling to allocate AM containers exclusively to On-Demand nodes:"}),"\n",(0,s.jsx)(i.pre,{children:(0,s.jsx)(i.code,{className:"language-json",children:'[\n   {\n     "Classification": "yarn-site",\n     "Properties": {\n      "yarn.node-labels.enabled": "true",\n      "yarn.node-labels.am.default-node-label-expression": "ON_DEMAND"\n     }\n   }\n]\n'})}),"\n",(0,s.jsx)(i.h4,{id:"4-spot-instance-usage-considerations",children:"4) Spot Instance Usage Considerations"}),"\n",(0,s.jsx)(i.p,{children:"Consider using Spot instances for tasks that can be interrupted and resumed (interruption rates are extremely low) or for workloads that can exceed an SLA. Spot instances are also a good choice for testing and development workloads or when testing new applications."}),"\n",(0,s.jsx)(i.p,{children:(0,s.jsx)(i.strong,{children:"Avoid using Spot instances if:"})}),"\n",(0,s.jsxs)(i.ul,{children:["\n",(0,s.jsx)(i.li,{children:"Your workload requires predictable completion time or has strict SLA requirements."}),"\n",(0,s.jsx)(i.li,{children:"Your workload has zero fault tolerance or recomputing tasks are expensive."}),"\n"]}),"\n",(0,s.jsx)(i.p,{children:"To mitigate the effects of Spot interruptions, reserve core nodes exclusively for application masters. Use On-Demand instances for core nodes and Spot instances for task nodes. Use Instance Fleet with an allocation strategy for Spot usage to diversify across many different instances. Ensure that all Availability Zones within your VPC are configured and selected for your workload. Although the EMR cluster is provisioned in a single AZ, it will look across all for the initial provisioning."}),"\n",(0,s.jsx)(i.p,{children:(0,s.jsx)(i.strong,{children:"Note:"})}),"\n",(0,s.jsxs)(i.ol,{children:["\n",(0,s.jsx)(i.li,{children:"Amazon EMR managed scaling only works with YARN applications, such as Spark, Hadoop, Hive, and Flink. It does not support applications that are not based on YARN, such as Presto and HBase. This also implies it won\u2019t work as expected if you are using external tools to consume all EC2 memory outside of YARN. YARN metrics play a critical role in determining managed scaling events."}),"\n",(0,s.jsxs)(i.li,{children:["To evaluate Managed Scaling effectiveness specifically, assess utilization for periods when ",(0,s.jsx)(i.code,{children:"YARNMemoryAllocated"})," or ",(0,s.jsx)(i.code,{children:"AppsRunning"})," is above zero."]}),"\n"]}),"\n",(0,s.jsx)(i.h3,{id:"tailored-optimization-strategies-for-specific-use-cases",children:"Tailored Optimization Strategies for Specific Use-Cases"}),"\n",(0,s.jsx)(i.h4,{id:"1-use-cases-involving-peak-and-non-peak-hours-in-a-long-running-cluster",children:"1) Use Cases Involving Peak and Non-Peak Hours in a Long-Running Cluster"}),"\n",(0,s.jsx)(i.p,{children:"In use cases with distinct peak and non-peak hours, a uniform configuration for both maximum and minimum resources may not be effective. During peak hours, it might be beneficial to elevate the managed scaling minimum to reduce the time required for the cluster to scale up, which could be approximately 4 minutes or more. During non-peak hours, reduce the managed scaling minimum. This adjustment can be implemented using a custom script."}),"\n",(0,s.jsx)(i.h4,{id:"2-use-cases-with-spiky-workloads",children:"2) Use Cases with Spiky Workloads"}),"\n",(0,s.jsx)(i.p,{children:"In scenarios with spiky workloads (characterized by sudden spikes in resource requirements for a short time), clusters frequently scale to their maximum capacity, even when the job may not need all the provisioned resources. This inefficiency arises because instances are provisioned after a substantial portion of the job is already completed. By the time these instances are up and running, the job no longer requires the new scaled-up resources. Use the MS Dampener script for a gradual and configurable scaling approach, ensuring more efficient resource utilization."}),"\n",(0,s.jsx)(i.h4,{id:"3-use-cases-with-recurring-jobs",children:"3) Use Cases with Recurring Jobs"}),"\n",(0,s.jsx)(i.p,{children:"Evaluate whether Managed Scaling aligns with your workload\u2019s characteristics. Consider factors such as the predictability of resource usage and the potential cost savings versus the overhead (including the time it takes for a node to become available and accept resources when scaling up) of managing scaling policies. If your workload has consistent resource requirements, disabling Managed Scaling may be appropriate. However, if your workload experiences fluctuations in resource demand, enabling Managed Scaling with appropriate minimum and maximum values is recommended."}),"\n",(0,s.jsx)(i.h3,{id:"adjusting-container-sizes-at-the-application-level",children:"Adjusting Container Sizes at the Application Level"}),"\n",(0,s.jsx)(i.h4,{id:"spark",children:"Spark"}),"\n",(0,s.jsx)(i.p,{children:"As previously mentioned, configuration settings for resource allocation to YARN containers are specific to processing frameworks such as Spark. Generally, default configurations set by EMR are sufficient for most workloads. A YARN container represents a collection of resources, including CPU and memory. Each Spark executor operates within a YARN container. Spark applications consist of tasks executed by these executors, which are JVM processes running on cluster nodes."}),"\n",(0,s.jsxs)(i.p,{children:["To achieve optimal utilization initially, ensure that the total number of executors capable of running on a node can fully utilize the resources allocated to the YARN NodeManager. It is recommended to set ",(0,s.jsx)(i.code,{children:"spark.executor.cores"})," to 4 or 5 and adjust ",(0,s.jsx)(i.code,{children:"spark.executor.memory"})," accordingly. When calculating ",(0,s.jsx)(i.code,{children:"spark.executor.memory"}),", consider the executor overhead, which defaults to 0.1875 (i.e., 18.75% of ",(0,s.jsx)(i.code,{children:"spark.executor.memory"}),")."]}),"\n",(0,s.jsxs)(i.p,{children:["For more details on tuning Spark applications, refer to the ",(0,s.jsx)(i.a,{href:"https://aws.github.io/aws-emr-best-practices/docs/bestpractices/Applications/Spark/best_practices",children:"EMR Best Practices Guide for Spark Applications"}),"."]}),"\n",(0,s.jsxs)(i.p,{children:["If you are diversifying instance types, ensure that you set the configuration parameter ",(0,s.jsx)(i.code,{children:"spark.yarn.heterogeneousExecutors.enabled"})," to ",(0,s.jsx)(i.code,{children:"true"})," (which is the default). If you are using the same instance types or a combination with similar vCPUs to memory ratios, you can set it to ",(0,s.jsx)(i.code,{children:"false"}),"."]}),"\n",(0,s.jsx)(i.h3,{id:"selecting-the-right-ec2-instance-type",children:"Selecting the Right EC2 Instance Type"}),"\n",(0,s.jsxs)(i.p,{children:["To optimize cluster utilization, conduct benchmarking to identify the ideal instance type that aligns with your application's requirements. Start with general instance types like ",(0,s.jsx)(i.code,{children:"m6gs"})," or ",(0,s.jsx)(i.code,{children:"m7gs"})," and monitor the OS and YARN metrics from CloudWatch to determine system bottlenecks at peak load, including CPU, memory, storage, and I/O. Determine the optimal vCPUs to memory ratio for your workload, identifying whether CPU-intensive, memory-intensive, or general-purpose instances best suit your use case."]}),"\n",(0,s.jsxs)(i.p,{children:["For I/O intensive workloads, use storage-optimized instance types like ",(0,s.jsx)(i.code,{children:"i3ens"})," or ",(0,s.jsx)(i.code,{children:"d2"}),". For Spark ML and intensive analytical workloads, such as image processing, use GPU instances like ",(0,s.jsx)(i.code,{children:"p3"}),"."]}),"\n",(0,s.jsx)(i.p,{children:"Choosing a larger instance type offers advantages like increased efficiency in data shuffling due to fewer nodes but may be less efficient for single-task long-running stages. Conversely, small nodes are advantageous for scenarios with small tasks but employing many small nodes may be inefficient for shuffling large volumes of data."}),"\n",(0,s.jsx)(i.p,{children:"Once you identify the most suitable instance type, for memory/CPU-intensive workloads (common in many big data use cases), consider using the latest generation EC2 Graviton instance types for better compute performance and price performance. Note that experience may differ with Spot instances due to potential high demand and increased spot prices."}),"\n",(0,s.jsx)(i.p,{children:"When using instance fleets, select all instance types with similar vCPUs to memory ratios to ensure higher utilization even when diversifying instance types, contributing to better cluster utilization."}),"\n",(0,s.jsx)(i.p,{children:"Typically, a smaller instance type is sufficient for the primary node of an EMR cluster, as its role is to serve clients, orchestrate tasks, and distribute them among core and task nodes."})]})}function u(e={}){const{wrapper:i}={...(0,t.R)(),...e.components};return i?(0,s.jsx)(i,{...e,children:(0,s.jsx)(d,{...e})}):d(e)}},6732:(e,i,n)=>{n.d(i,{A:()=>s});const s=n.p+"assets/images/mru-1-1f253f202847475b24265ca81efdb1d8.png"},7367:(e,i,n)=>{n.d(i,{A:()=>s});const s=n.p+"assets/images/mru-2-17247800ff7f7b61ff3cd4624fad9028.png"},8453:(e,i,n)=>{n.d(i,{R:()=>o,x:()=>r});var s=n(6540);const t={},a=s.createContext(t);function o(e){const i=s.useContext(a);return s.useMemo((function(){return"function"==typeof e?e(i):{...i,...e}}),[i,e])}function r(e){let i;return i=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:o(e.components),s.createElement(a.Provider,{value:i},e.children)}}}]);