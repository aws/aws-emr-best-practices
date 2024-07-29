#!/bin/bash
#==================================================================================================================
#!# script: emr-cw_dashboard.sh
#!# authors: ripani
#!# version: v0.1b
#!#
#!# Create a CloudWatch dashboard to monitor an EMR cluster using CWAgent Hadoop metrics. 
#!# The script can be attached as EMR Step, or you can run it externally to the cluster to create the dashboard.
#!#
#!# The dashboard uses Hadoop metrics published by the CWAgent. Make sure your EMR cluster has CloudWatch
#!# installed, and has been launched with the following cluster configurations:
#!#
#!# ---------------------------------------------
#!# {
#!#   "Classification": "emr-metrics",
#!#   "Properties": {},
#!#   "Configurations": [
#!#     {
#!#       "Classification": "emr-hadoop-yarn-resourcemanager-metrics",
#!#       "Properties": {
#!#         "Hadoop:service=ResourceManager,name=ClusterMetrics": "CapabilityMB,CapabilityVirtualCores,UtilizedMB,UtilizedVirtualCores,NumActiveNMs,NumDecommissionedNMs,NumDecommissioningNMs,NumLostNMs,NumUnhealthyNMs",
#!#         "Hadoop:service=ResourceManager,name=QueueMetrics,q0=root": "AppsCompleted,AppsFailed,AppsKilled,AppsPending,AppsRunning,AppsSubmitted,AllocatedContainers,AllocatedMB,AllocatedVCores,AvailableMB,AvailableVCores,PendingContainers,PendingMB,PendingVCores",
#!#         "otel.metric.export.interval": "30000"
#!#       }
#!#     }
#!#   ]
#!# }
#!# ---------------------------------------------
#!#
#!# For more details, see https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-AmazonCloudWatchAgent.html
#!#
#==================================================================================================================
#?#
#?#   usage: ./emr-cw_dashboard.sh [ <CLUSTER_ID> <REGION> ]
#?#          ./emr-cw_dashboard.sh 
#?#          ./emr-cw_dashboard.sh j-XXXXXXXXXX us-east-1
#?#
#?#   CLUSTER_ID            Amazon EMR cluster ID for which you want to generate the dashboard
#?#   REGION                AWS Region where the cluster has been launched
#?# 
#?#   If no parameters are specified, we assume the script is launched on the EMR master node as a step, and we
#?#   try to detect the required configurations from the node filesystem. 
#?#
#==================================================================================================================
export AWS_PAGER=""
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
#set -x

# colors
color_first="#ffbb78"
color_second="#d62728"
color_third="#7f7f7f"

color_red="#ff9896"
color_green="#98df8a"

# usage helper using the header as source
function usage() {
	[ "$*" ] && echo "$0: $*"
	sed -n '/^#?#/,/^$/s/^#?# \{0,1\}//p' "$0"
}

if [[ $# -eq 0 ]] ; then
  CLUSTER_ID=$(jq -r .jobFlowId /mnt/var/lib/info/job-flow.json)
  REGION=$(cat /mnt/var/lib/info/extraInstanceData.json | jq -r .region)
  MASTER_ID=$(cat /sys/devices/virtual/dmi/id/board_asset_tag)
elif [[ $# -eq 2 ]] ; then
  CLUSTER_ID="$1"
  REGION="$2"
else
  echo "error: wrong parameters" && usage && exit 1
fi

# check if required parameters are defined
if [ -z $CLUSTER_ID ] || [ -z $REGION ]; then
  echo "error: cannot detect CLUSTER_ID: $CLUSTER_ID REGION: $REGION" && usage && exit 1
fi

# ===========================================================================
# Data
# ===========================================================================

# check if cluster is terminated
cluster_data=$(aws emr describe-cluster --cluster-id $CLUSTER_ID --region $REGION)
cluster_status=$(echo $cluster_data | jq -r .Cluster.Status.State)
cluster_start=$(echo $cluster_data | jq -r .Cluster.Status.Timeline.CreationDateTime)
cluster_termination=$(echo $cluster_data | jq -r .Cluster.Status.Timeline.EndDateTime)
cluster_coll_type=$(echo $cluster_data | jq -r .Cluster.InstanceCollectionType)
cluster_instance_data=$(aws emr list-instances --cluster-id $CLUSTER_ID )

# retrieve the emr master ec2 id
if [ -z $MASTER_ID ]; then
  if [ $cluster_coll_type == "INSTANCE_FLEET" ]; then
    cluster_if_id=$(echo $cluster_data | jq -r  '.Cluster.InstanceFleets.[] | select(.InstanceFleetType=="MASTER") | .Id')
    MASTER_ID=$(aws emr list-instances --cluster-id $CLUSTER_ID --instance-fleet-id $cluster_if_id --region $REGION | jq -r .Instances[].Ec2InstanceId)    
  else
    cluster_ig_id=$(echo $cluster_data | jq -r  '.Cluster.InstanceGroups.[] | select(.Name=="MASTER") | .Id')
    MASTER_ID=$(aws emr list-instances --cluster-id $CLUSTER_ID --instance-group-id $cluster_ig_id --region $REGION | jq -r .Instances[].Ec2InstanceId)
  fi 
fi

start_utc=$(date -d  @$(date -d "$cluster_start" +"%s") +'%Y-%m-%dT%H:%M:%S' -u)
if [[ $cluster_status == "TERMINATED" ]]; then
  termination_utc=$(date -d  @$(date -d "$cluster_termination" +"%s") +'%Y-%m-%dT%H:%M:%S' -u)
  dashboard_time="\"start\": \"${start_utc}.000Z\",\"end\": \"${termination_utc}.000Z\","
else
  dashboard_time="\"start\": \"$(echo $start_utc).000Z\","
fi

# Check if Managed Scaling is enabled
cluster_ms_data=$(aws emr get-managed-scaling-policy --cluster-id $CLUSTER_ID --region $REGION)
if [[ -z $cluster_ms_data ]]; then
  min_nodes=0
  max_nodes=50
else
  min_nodes=$(echo $cluster_ms_data | jq -r .ManagedScalingPolicy.ComputeLimits.MinimumCapacityUnits)
  max_nodes=$(echo $cluster_ms_data | jq -r .ManagedScalingPolicy.ComputeLimits.MaximumCapacityUnits)
  annotation_ms="{\"color\": \"#ffbb78\", \"label\": \"Managed Scaling Max\", \"value\": $max_nodes }, { \"color\": \"#ffbb78\", \"label\": \"Managed Scaling Min\", \"value\": $min_nodes}"
fi

# generate nodes timelines (agg. x minutes)
agg_instance_start_time=(`echo $cluster_instance_data  | jq -r .Instances[].Status.Timeline.CreationDateTime | sort | grep -E -v "null" | uniq -c -w17 | awk -F' ' '{print $1"_"$2}'`)
agg_instance_termination_time=(`echo $cluster_instance_data  | jq -r .Instances[].Status.Timeline.EndDateTime | sort | grep -E -v "null" | uniq -c -w17 | awk -F' ' '{print $1"_"$2}'`)

for i in "${agg_instance_start_time[@]}"; do
   i_count=$(echo $i | awk -F'_' '{print $1}')
   i_time=$(echo $i | awk -F'_' '{print $2}')
   i_time_utc=$(date -d  @$(date -d "$i_time" +"%s") +'%Y-%m-%dT%H:%M:%S' -u)
   v_annotation="{\"label\": \"Launched $i_count instances\",\"value\": \"$i_time_utc.000Z\",\"color\": \"#1f77b4\"}"
   [[ -z $vert_annotations ]] && vert_annotations=$v_annotation || vert_annotations=$vert_annotations,$v_annotation
done
for i in "${agg_instance_termination_time[@]}"; do
   i_count=$(echo $i | awk -F'_' '{print $1}')
   i_time=$(echo $i | awk -F'_' '{print $2}')
   i_time_utc=$(date -d  @$(date -d "$i_time" +"%s") +'%Y-%m-%dT%H:%M:%S' -u)
   v_annotation="{\"label\": \"Terminated $i_count instances\",\"value\": \"$i_time_utc.000Z\",\"color\": \"#d62728\"}"
   [[ -z $vert_annotations ]] && vert_annotations=$v_annotation || vert_annotations=$vert_annotations,$v_annotation
done

[[ -z $vert_annotations ]] && vert_annotations_nodes="{\"label\": \"Cluster Launched\",\"value\": \"$start_utc.000Z\",\"color\": \"#98df8a\"}" || vert_annotations_nodes="{\"label\": \"Cluster Launched\",\"value\": \"$start_utc.000Z\",\"color\": \"#98df8a\"},$vert_annotations"
[[ $cluster_status == "TERMINATED" ]] && vert_annotations_nodes="$vert_annotations_nodes,{\"label\": \"Cluster Terminated\",\"value\": \"$i_time_utc.000Z\",\"color\": \"#d62728\"}"

# generate steps annotations
emr_steps_data=$(aws emr list-steps --cluster-id $CLUSTER_ID)
agg_steps_start_time=(`echo $emr_steps_data | jq -r .Steps[].Status.Timeline.StartDateTime | sort | grep -E -v "null"`)
agg_steps_termination_time=(`echo $emr_steps_data | jq -r .Steps[].Status.Timeline.EndDateTime | sort | grep -E -v "null"`)

vert_annotations=""
for i in "${agg_steps_start_time[@]}"; do
   i_time_utc=$(date -d  @$(date -d "$i" +"%s") +'%Y-%m-%dT%H:%M:%S' -u)
   v_annotation="{\"label\": \"Step started\",\"value\": \"$i_time_utc.000Z\",\"color\": \"#1f77b4\"}"
   [[ -z $vert_annotations ]] && vert_annotations=$v_annotation || vert_annotations=$vert_annotations,$v_annotation
done
for i in "${agg_steps_termination_time[@]}"; do
   i_time_utc=$(date -d  @$(date -d "$i" +"%s") +'%Y-%m-%dT%H:%M:%S' -u)
   v_annotation="{\"label\": \"Step Terminated\",\"value\": \"$i_time_utc.000Z\",\"color\": \"#d62728\"}"
   [[ -z $vert_annotations ]] && vert_annotations=$v_annotation || vert_annotations=$vert_annotations,$v_annotation
done

[[ -z $vert_annotations ]] && vert_annotations_steps="{\"label\": \"Cluster Launched\",\"value\": \"$start_utc.000Z\",\"color\": \"#98df8a\"}" || vert_annotations_steps="{\"label\": \"Cluster Launched\",\"value\": \"$start_utc.000Z\",\"color\": \"#98df8a\"},$vert_annotations"
[[ $cluster_status == "TERMINATED" ]] && vert_annotations_steps="$vert_annotations_steps,{\"label\": \"Cluster Terminated\",\"value\": \"$i_time_utc.000Z\",\"color\": \"#d62728\"}"

horiz_node_limit=`echo $(( $max_nodes + 5 ))`

# ===========================================================================
# Dashboard
# ===========================================================================
DASHBOARD_PATH="/tmp/cw_dashboard.json"
cat << EOF > $DASHBOARD_PATH
{
    $dashboard_time
    "widgets": [
        {
            "height": 6,
            "width": 24,
            "y": 34,
            "x": 0,
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "CWAgent", "QueueMetrics.root.AllocatedContainers", "instance.id", "$MASTER_ID", "service.name", "hadoop-yarn-resourcemanager", "node.type", "master", "cluster.id", "$CLUSTER_ID", { "region": "$REGION", "label": "Containers Running", "color": "#1f77b4" } ],
                    [ ".", "QueueMetrics.root.PendingContainers", ".", ".", ".", ".", ".", ".", ".", ".", { "region": "$REGION", "label": "Containers Pending", "color": "#d62728" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$REGION",
                "stat": "Average",
                "period": 60,
                "title": "Cluster / Containers",
                "yAxis": {
                    "left": {
                        "showUnits": false,
                        "label": "YARN Containers"
                    },
                    "right": {
                        "showUnits": false
                    }
                },
                "annotations": {
                    "vertical": [ $vert_annotations_steps ]                    
                },                
                "liveData": true,
                "setPeriodToTimeRange": true
            }
        },
        {
            "height": 11,
            "width": 24,
            "y": 23,
            "x": 0,
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "CWAgent", "ClusterMetrics.NumActiveNMs", "instance.id", "$MASTER_ID", "service.name", "hadoop-yarn-resourcemanager", "node.type", "master", "cluster.id", "$CLUSTER_ID", { "region": "$REGION", "label": "YARN Nodes Running", "color": "#7f7f7f" } ]
                ],
                "view": "timeSeries",
                "stacked": true,
                "region": "$REGION",
                "stat": "Average",
                "period": 60,
                "title": "Cluster / Timeline",
                "yAxis": {
                    "left": {
                        "showUnits": false,
                        "min": 0,
                        "label": "",
                        "max": $horiz_node_limit
                    },
                    "right": {
                        "showUnits": false
                    }
                },
                "annotations": {
                    "horizontal": [ $annotation_ms ],
                    "vertical": [ $vert_annotations_nodes ]                    
                },
                "liveData": true
            }
        },
        {
            "height": 4,
            "width": 24,
            "y": 0,
            "x": 0,
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "CWAgent", "QueueMetrics.root.AppsCompleted", "instance.id", "$MASTER_ID", "service.name", "hadoop-yarn-resourcemanager", "node.type", "master", "cluster.id", "$CLUSTER_ID", { "region": "$REGION", "label": "Completed", "color": "#2ca02c" } ],
                    [ ".", "QueueMetrics.root.AppsKilled", ".", ".", ".", ".", ".", ".", ".", ".", { "region": "$REGION", "label": "Killed", "color": "#ff9896" } ],
                    [ ".", "QueueMetrics.root.AppsFailed", ".", ".", ".", ".", ".", ".", ".", ".", { "region": "$REGION", "label": "Failed", "color": "#d62728" } ],
                    [ ".", "QueueMetrics.root.AppsPending", ".", ".", ".", ".", ".", ".", ".", ".", { "region": "$REGION", "label": "Pending", "color": "#ffbb78" } ],
                    [ ".", "QueueMetrics.root.AppsRunning", ".", ".", ".", ".", ".", ".", ".", ".", { "region": "$REGION", "label": "Running", "color": "#98df8a" } ],
                    [ ".", "QueueMetrics.root.AppsSubmitted", ".", ".", ".", ".", ".", ".", ".", ".", { "region": "$REGION", "label": "Submitted", "color": "#1f77b4" } ]
                ],
                "sparkline": true,
                "view": "singleValue",
                "region": "$REGION",
                "title": "Cluster / Applications",
                "period": 60,
                "stat": "Maximum"
            }
        },
        {
            "height": 9,
            "width": 9,
            "y": 4,
            "x": 12,
            "type": "metric",
            "properties": {
                "metrics": [
                    [ { "expression": "CEIL( (m2 - m3) / 1024 )", "label": "YARN Memory Allocated", "id": "e2", "color": "#1f77b4", "region": "$REGION" } ],
                    [ { "expression": "CEIL( m2 / 1024 )", "label": "YARN Memory Capacity", "id": "e1", "region": "$REGION", "color": "#ffbb78" } ],
                    [ "CWAgent", "ClusterMetrics.CapabilityMB", "instance.id", "$MASTER_ID", "service.name", "hadoop-yarn-resourcemanager", "node.type", "master", "cluster.id", "$CLUSTER_ID", { "id": "m2", "visible": false, "region": "$REGION" } ],
                    [ ".", "QueueMetrics.root.AvailableMB", ".", ".", ".", ".", ".", ".", ".", ".", { "id": "m3", "visible": false, "region": "$REGION" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$REGION",
                "period": 60,
                "stat": "Maximum",
                "title": "Cluster / Memory",
                "yAxis": {
                    "left": {
                        "label": "YARN Memory in GiB",
                        "showUnits": false,
                        "min": 0
                    },
                    "right": {
                        "showUnits": false
                    }
                },
                "legend": {
                    "position": "bottom"
                },
                "liveData": true,
                "setPeriodToTimeRange": true
            }
        },
        {
            "height": 9,
            "width": 3,
            "y": 4,
            "x": 21,
            "type": "metric",
            "properties": {
                "metrics": [
                    [ { "expression": "CEIL( (m2 - m3) / 1024 )", "label": "YARN Memory Allocated", "id": "e2", "color": "#1f77b4", "region": "$REGION" } ],
                    [ { "expression": "CEIL( m2 / 1024 )", "label": "YARN Memory Capacity", "id": "e1", "region": "$REGION", "color": "#ffbb78" } ],
                    [ "CWAgent", "ClusterMetrics.CapabilityMB", "instance.id", "$MASTER_ID", "service.name", "hadoop-yarn-resourcemanager", "node.type", "master", "cluster.id", "$CLUSTER_ID", { "id": "m2", "visible": false, "region": "$REGION" } ],
                    [ ".", "QueueMetrics.root.AvailableMB", ".", ".", ".", ".", ".", ".", ".", ".", { "id": "m3", "visible": false, "region": "$REGION" } ]
                ],
                "sparkline": true,
                "view": "pie",
                "region": "$REGION",
                "title": "Cluster / Memory Usage",
                "period": 60,
                "stat": "Average",
                "singleValueFullPrecision": true,
                "stacked": true,
                "yAxis": {
                    "left": {
                        "min": 0,
                        "max": 100
                    }
                },
                "setPeriodToTimeRange": false,
                "trend": true,
                "annotations": {
                    "horizontal": [
                        {
                            "color": "#ff9896",
                            "label": "Untitled annotation",
                            "value": 0,
                            "fill": "above"
                        },
                        {
                            "color": "#98df8a",
                            "label": "Untitled annotation",
                            "value": 40,
                            "fill": "above"
                        },
                        {
                            "color": "#d62728",
                            "label": "Over Usage",
                            "value": 90,
                            "fill": "above"
                        }
                    ]
                },
                "liveData": true,
                "labels": {
                    "visible": true
                }
            }
        },
        {
            "height": 4,
            "width": 24,
            "y": 19,
            "x": 0,
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "CWAgent", "ClusterMetrics.NumActiveNMs", "instance.id", "$MASTER_ID", "service.name", "hadoop-yarn-resourcemanager", "node.type", "master", "cluster.id", "$CLUSTER_ID", { "region": "$REGION", "label": "Running", "color": "#2ca02c" } ],
                    [ ".", "ClusterMetrics.NumDecommissionedNMs", ".", ".", ".", ".", ".", ".", ".", ".", { "region": "$REGION", "label": "Decommissioned" } ],
                    [ ".", "ClusterMetrics.NumDecommissioningNMs", ".", ".", ".", ".", ".", ".", ".", ".", { "region": "$REGION", "label": "Decommissioning", "color": "#FFBB78" } ],
                    [ ".", "ClusterMetrics.NumLostNMs", ".", ".", ".", ".", ".", ".", ".", ".", { "region": "$REGION", "label": "Lost" } ],
                    [ ".", "ClusterMetrics.NumUnhealthyNMs", ".", ".", ".", ".", ".", ".", ".", ".", { "region": "$REGION", "label": "Unhealthy", "color": "#FF9896" } ]
                ],
                "sparkline": true,
                "view": "singleValue",
                "region": "$REGION",
                "title": "Cluster / Nodes",
                "period": 60,
                "stat": "Average",
                "liveData": true
            }
        },
        {
            "height": 6,
            "width": 12,
            "y": 13,
            "x": 12,
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "CWAgent", "ClusterMetrics.CapabilityMB", "instance.id", "$MASTER_ID", "service.name", "hadoop-yarn-resourcemanager", "node.type", "master", "cluster.id", "$CLUSTER_ID", { "id": "m1", "region": "$REGION", "label": "YARN Memory Capacity", "visible": false, "color": "#2ca02c" } ],
                    [ ".", "QueueMetrics.root.AvailableMB", ".", ".", ".", ".", ".", ".", ".", ".", { "id": "m2", "region": "$REGION", "label": "YARN Memory Available", "visible": false, "color": "#2ca02c" } ],
                    [ { "expression": "(m1-m2)", "label": "YARN Memory Allocated", "id": "m3", "region": "$REGION", "visible": false } ],
                    [ { "expression": "CEIL(100*(m3/m1))", "label": "YARN Memory Allocation", "id": "e1", "color": "#1f77b4", "region": "$REGION" } ],
                    [ { "expression": "SELECT AVG(mem_used_percent) FROM SCHEMA(CWAgent, \"cluster.id\",\"instance.id\",\"node.type\",\"service.name\") WHERE \"cluster.id\" = '$CLUSTER_ID' AND \"node.type\" != 'master' GROUP BY \"cluster.id\"", "label": "Avg. Physical Memory Usage", "id": "q1", "region": "$REGION", "color": "#d62728" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$REGION",
                "period": 60,
                "stat": "Average",
                "title": "Cluster / Memory Efficiency",
                "yAxis": {
                    "left": {
                        "label": "",
                        "showUnits": false,
                        "min": 0,
                        "max": 100
                    },
                    "right": {
                        "showUnits": false
                    }
                },
                "annotations": {
                    "horizontal": [
                        {
                            "color": "#efefef",
                            "label": "Underutilization",
                            "value": 40,
                            "fill": "below"
                        },
                        [
                            {
                                "color": "#9edae5",
                                "value": 90
                            },
                            {
                                "value": 40
                            }
                        ],
                        {
                            "color": "#ffbb78",
                            "label": "OverUsage",
                            "value": 90,
                            "fill": "above"
                        }
                    ]
                },
                "legend": {
                    "position": "bottom"
                },
                "liveData": true,
                "setPeriodToTimeRange": true
            }
        },
        {
            "height": 9,
            "width": 9,
            "y": 4,
            "x": 0,
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "CWAgent", "QueueMetrics.root.AllocatedVCores", "instance.id", "$MASTER_ID", "service.name", "hadoop-yarn-resourcemanager", "node.type", "master", "cluster.id", "$CLUSTER_ID", { "region": "$REGION", "label": "YARN vCores Allocated", "color": "#1f77b4", "id": "m1" } ],
                    [ ".", "ClusterMetrics.CapabilityVirtualCores", ".", ".", ".", ".", ".", ".", ".", ".", { "label": "YARN vCores Capacity", "color": "#ffbb78", "id": "m2", "region": "$REGION" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$REGION",
                "period": 60,
                "stat": "Average",
                "title": "Cluster / Compute",
                "yAxis": {
                    "left": {
                        "label": "YARN vCores",
                        "showUnits": false
                    },
                    "right": {
                        "showUnits": false
                    }
                },
                "legend": {
                    "position": "bottom"
                },
                "liveData": true,
                "setPeriodToTimeRange": true
            }
        },
        {
            "height": 9,
            "width": 3,
            "y": 4,
            "x": 9,
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "CWAgent", "QueueMetrics.root.AllocatedVCores", "instance.id", "$MASTER_ID", "service.name", "hadoop-yarn-resourcemanager", "node.type", "master", "cluster.id", "$CLUSTER_ID", { "label": "YARN vCores Allocated", "color": "#1f77b4", "id": "m1", "region": "$REGION" } ],
                    [ ".", "ClusterMetrics.CapabilityVirtualCores", ".", ".", ".", ".", ".", ".", ".", ".", { "label": "YARN vCores Available", "color": "#ffbb78", "id": "m2", "region": "$REGION" } ]
                ],
                "sparkline": true,
                "view": "pie",
                "region": "$REGION",
                "title": "Cluster / Compute Usage",
                "period": 60,
                "stat": "Average",
                "singleValueFullPrecision": true,
                "stacked": true,
                "yAxis": {
                    "left": {
                        "min": 0,
                        "max": 100,
                        "showUnits": false
                    }
                },
                "setPeriodToTimeRange": false,
                "trend": true,
                "table": {
                    "stickySummary": false,
                    "showTimeSeriesData": true,
                    "layout": "vertical"
                },
                "liveData": true,
                "labels": {
                    "visible": true
                }
            }
        },
        {
            "height": 6,
            "width": 12,
            "y": 13,
            "x": 0,
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "CWAgent", "QueueMetrics.root.AllocatedVCores", "instance.id", "$MASTER_ID", "service.name", "hadoop-yarn-resourcemanager", "node.type", "master", "cluster.id", "$CLUSTER_ID", { "label": "YARN vCores Allocated", "color": "#2ca02c", "id": "m5", "region": "$REGION", "visible": false } ],
                    [ ".", "ClusterMetrics.CapabilityVirtualCores", ".", ".", ".", ".", ".", ".", ".", ".", { "label": "YARN vCores Capacity", "color": "#2ca02c", "id": "m4", "region": "$REGION", "visible": false } ],
                    [ { "expression": "CEIL(100*(m5/m4))", "label": "YARN vCores Allocation", "id": "e2", "region": "$REGION", "color": "#1f77b4" } ],
                    [ { "expression": "SELECT AVG(cpu_usage_user) FROM SCHEMA(CWAgent, \"cluster.id\",\"instance.id\",\"node.type\",\"service.name\") WHERE \"cluster.id\" = '$CLUSTER_ID' AND \"node.type\" != 'master' GROUP BY \"cluster.id\"", "label": "Avg. Physical CPU Usage", "id": "q1", "region": "$REGION" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$REGION",
                "period": 60,
                "stat": "Average",
                "title": "Cluster / Compute Efficiency",
                "yAxis": {
                    "left": {
                        "label": "",
                        "showUnits": false,
                        "min": 0,
                        "max": 100
                    },
                    "right": {
                        "showUnits": false
                    }
                },
                "annotations": {
                    "horizontal": [
                        {
                            "color": "#efefef",
                            "label": "Underutilization",
                            "value": 40,
                            "fill": "below"
                        },
                        [
                            {
                                "color": "#9edae5",
                                "value": 90
                            },
                            {
                                "value": 40
                            }
                        ],
                        {
                            "color": "#ffbb78",
                            "label": "OverUsage",
                            "value": 90,
                            "fill": "above"
                        }
                    ]
                },
                "legend": {
                    "position": "bottom"
                },
                "liveData": true,
                "setPeriodToTimeRange": true
            }
        }
    ]
}
EOF

dashboard_body=$(awk '{ printf "%s", $0 }' $DASHBOARD_PATH)
aws cloudwatch put-dashboard --dashboard-name "EMR_on_EC2_$CLUSTER_ID" --dashboard-body "$dashboard_body"