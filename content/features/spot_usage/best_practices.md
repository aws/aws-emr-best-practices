# ** 4.2 - Spot Usage **

## ** BP 4.2.1 Ensure Application Masters only run on an On Demand Node **

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


## ** BP 4.2.2 Allow application masters (AM) to run on all nodes  **

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