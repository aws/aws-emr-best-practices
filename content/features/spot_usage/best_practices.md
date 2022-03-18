# ** 4.2 - Spot Usage **

## ** BP 4.2.1 When to use spot vs. on demand **
Spot is a great way to help reduce costs. However, there are certain scenarios where you should consider on demand because there's always a chance that an interruption can happen. The considerations are: 

* Use Spot for workloads where they can be interrupted and resumed (interruption rates are extremely low), or workloads that can exceed an SLA
* Use Spot for testing and development workloads or when testing testing new applications. 
* Avoid spot if your workload requires predictable completion time or has service level agreement (SLA) requirements
* Avoid spot if your workload has 0 fault tolerance or when recomputing tasks are expensive
* Use instance fleet with allocation strategy while using Spot so that you can diversify across many different instances. Spot capacity pool is unpredictable so diversifying with as many instances that meets your requirements can help increase the likelihood of securing spot instances which in turn, reduces cost. 

## ** BP 4.2.1 Use Instancefleets when using Spot Instances **

Instancefleets provides clusters with Instance flexibility. Instead of relying on a single instance to reach your target capacity, you can specify up to 30 instances. This is a best practice when using Spot because EMR will automatically provision instances from the most-available Spot capacity pools when allocation strategy is enabled. Because your Spot Instance capacity is sourced from pools with optimal capacity, this decreases the possibility that your Spot Instances are reclaimed. A good rule of thumb is to be flexible across at least 10 instance types for each workload. In addition, make sure that all Availability Zones are configured for use in your VPC and selected for your workload. An EMR cluster will only be provisioned in a single AZ but will look across all for the initial provisioning. 

## ** BP 4.2.2 Ensure Application Masters only run on an On Demand Node **

When a job is submitted to EMR, the Application Master (AM) can run on any of the nodes\*. The AM is is the main container requesting, launching and monitoring application specific resources. Each job launches a single AM and if the AM is assigned to a spot node, and that spot node is interrupted, your job will fail. 

Therefore, it's important to ensure the AM is as resilient as possible. Assuming you are running a mixed cluster of On demand and Spot, by placing AM's on On demand nodes, you'll ensure AM's do not fail due to a spot interruption.

The following uses "yarn.nodemanager.node-labels.provider.script.path" to run a script that sets node label to the market type - On Demand or Spot. yarn-site is also updated so that application masters are only assigned to the "on_demand" label. Finally, the cluster is updated to include the new node label. 

This is a good option when you run a mix of On demand and Spot. You can enable this with the following steps:


1\. Save getNodeLabels_bootstrap.sh and getNodeLabels.py in S3 and run getNodeLabels_bootstrap.sh as an EMR bootstrap action

getNodeLabels_bootstrap.sh 
```
#!/bin/bash
aws s3 cp s3://<bucket>/getNodeLabels.py /home/hadoop
chmod +x /home/hadoop/getNodeLabels.py
```

This script will copy getNodeLabels.py onto each node which is used by YARN to set NODE_PARTITION

getNodeLabels.py
```
#!/usr/bin/python3
import json
k='/mnt/var/lib/info/extraInstanceData.json'
with open(k) as f:
    response = json.load(f)
    #print ((response['instanceRole'],response['marketType']))
    if (response['instanceRole'] in ['core','task'] and response['marketType']=='on_demand'):
       print (f"NODE_PARTITION:{response['marketType'].upper()}")
```

This script is run every time a node is provisioned and sets NODE_PARTITION to on_demand. 

2\. Set yarn-site classification to schedule AMs on ON_DEMAND nodes.
```
[
   {
      "classification":"yarn-site",
      "Properties":{
         "yarn.nodemanager.node-labels.provider":"script",
         "yarn.nodemanager.node-labels.provider.script.path":"/home/hadoop/getNodeLabels.py",
         "yarn.node-labels.enabled":"true",
         "yarn.node-labels.am.default-node-label-expression":"ON_DEMAND",
         "yarn.nodemanager.node-labels.provider.configured-node-partition":"ON_DEMAND,SPOT"
      }
   }
]
```
3\. Add EMR Step 

```
#!/bin/bash
sudo -u yarn yarn rmadmin -addToClusterNodeLabels "SPOT(exclusive=false),ON_DEMAND(exclusive=false)"
```
Step should be the first step on the EMR cluster. This step adds the new node labels. 

Once your cluster is provisioned, AM's will only run on On Demand nodes. Other non AM containers will run on all nodes. 

\* EMR 5.19 and later uses the node label feature to assign AMs on core nodes only. Beginning with Amazon EMR 6.x release series, the YARN node labels feature is disabled by default. The application master processes can run on both core and task nodes by default. 


## ** BP 4.2.3 Allow application masters (AM) to run on all nodes  **

With EMR 5.x, AM only run on core nodes. Because Spot Instances are often used to run task nodes, it prevents applications from failing in case an AM is assigned to a spot node. 

As a result of this, in scenarios where applications are occupying the full core node capacity, AM's will be in a PENDING state since they can only run on core nodes. The application will have to wait for capacity to be available on the core nodes even if there's capacity on the task  nodes. 

Allowing AM's to run on all nodes is a good option if you are not using Spot, or run a small number of core nodes and do not want your cluster to be limited by Core capacity. You can disable this behavior with the bootstrap action below:

```
#!/bin/bash 
echo "backup original init.pp"
sudo cp cp /var/aws/emr/bigtop-deploy/puppet/modules/hadoop/manifests/init.pp /tmp/
echo "replacing node label check"
sudo sed -i '/add-to-cluster-node-labels.*/,+5d' /var/aws/emr/bigtop-deploy/puppet/modules/hadoop/manifests/init.pp

```

Beginning with Amazon EMR 6.x release series, the YARN node labels feature is disabled by default. The AM processes can run on both core and task nodes by default. You can enable the YARN node labels feature by configuring following properties:
```
    yarn.node-labels.enabled: true
    yarn.node-labels.am.default-node-label-expression: 'CORE'
```

When you allow AM's to run on all nodes and are using managed scaling, consider increasing yarn.resourcemanager.nodemanager-graceful-decommission-timeout-secs so AM's are not automatically terminated after the 1hr timeout in the event of a scale down. See BP 4.1.3 for more details. 

## ** BP 4.2.4 Reserve core nodes for only application masters (am) **

This is not necessarily related to Spot, but An alternative to BP 4.2.2 is to reserve core nodes for only application masters/spark drivers. This means tasks spawned from executors or AMs will only run on the task nodes. The approach keeps the “CORE” label for core nodes and specifies it as exclusive=true. This means that containers will only be allocated to CORE nodes when it matches the node partition during job submission. By default, EMR will set AM=Core and as long as users are not specifying node label = core, all containers will run on task.
 
Add EMR step during EMR provisioning
```
#!/bin/bash
#Change core label from exclusive=false to exclusive=true.
sudo -u yarn yarn rmadmin -removeFromClusterNodeLabels "CORE"
sudo -u yarn yarn rmadmin -addToClusterNodeLabels "CORE(exclusive=true)"
``` 
Applications can still be waiting for resources if the # of jobs you’re submitting exceeds the available space on your core nodes. However, this is less likely to occur now that tasks cant be assigned to core.
The other option to consider is allowing AM to run on all nodes but OD. I would not recommend having AM run on task.

## ** BP 4.2.5 Reduce spot interruptions by setting purchase Option to "Use on-demand as max price" **

By setting the spot purchase option to "use on-demand as max price", your spot nodes will only be interrupted when EC2 takes back spot capacity and not because of someone outbidding your spot price. 

## ** BP 4.2.6 Reduce the impact of spot interruptions **

There's a few strategies to consider when using that spot will help you take advantage of spot pricing while still getting capacity:

1. [Mix on demad nodes Spot](https://aws.github.io/aws-emr-best-practices/cost_optimization/best_practices/#bp-19-mix-on-demand-and-spot-instances)
2. [Use on demand for core nodes and spot for task](https://aws.github.io/aws-emr-best-practices/reliability/best_practices/#bp-25-use-on-demand-for-core-nodes-and-spot-for-task)
3. Reduce individual task run time - shorter running tasks means the impact of a spot interruption is less because the amount of time to recompute is less. 
4. Reduce provisioning timeout and switch to on demand - When using Instancefleets, EMR allows you to set a timeout duration for getting spot capacity. Once the duration is hit, you can choose to terminate the cluster or fall back to on demand. The default value is 60min but consider lowering this quickly fall back to on demand when spot is not available
5. Checkpoint often - This allows you to retry from a certain part of your pipeline if you ever lose too many spot nodes 








