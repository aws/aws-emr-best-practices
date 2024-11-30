#!/bin/bash
#===============================================================================
#!# script: yarn_labels_scaling.sh
#!#
#!# Install a custom script to publish additional Hadoop metrics on CloudWatch 
#===============================================================================
set -ex

# force to run as root
if [ $(id -u) != "0" ]; then
  sudo "$0" "$@"
  exit $?
fi

script_path="/etc/emr-scripts"
script_file="$script_path/yarn_metrics.sh"

# create script path
mkdir -p $script_path

# create the custom metrics script
cat << 'EOF' > $script_file
#!/usr/bin/env bash

cluster_id=$(cat /emr/instance-controller/lib/info/job-flow.json 2>/dev/null | jq -r .jobFlowId)
region=$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | jq -r .region)
rm_host="http://`hostname -f`:8088/ws/v1"

# Collect metrics for each YARN label Partition
readarray -t yarn_labels < <(curl -s $rm_host/cluster/nodes | jq -r '[.nodes.node[].nodeLabels[]] | unique | sort | .[]')

for label in "${yarn_labels[@]}"; do
  echo "Collecting metrics for $label"
  pending_memory=$(curl -s $rm_host/cluster/scheduler | jq -r --arg LABEL "$label" '[ .scheduler.schedulerInfo.queues.queue[] | .resources.resourceUsagesByPartition[] | select(.partitionName==$LABEL) | .pending.memory ] | add')
  pending_vcores=$(curl -s $rm_host/cluster/scheduler | jq -r --arg LABEL "$label" '[ .scheduler.schedulerInfo.queues.queue[] | .resources.resourceUsagesByPartition[] | select(.partitionName==$LABEL) | .pending.vCores ] | add')
  aws cloudwatch put-metric-data --region $region --metric-name "$label.PendingMemory" --namespace "AWS/ElasticMapReduce" --unit Count --value $pending_memory --dimensions JobFlowId=$cluster_id
  aws cloudwatch put-metric-data --region $region --metric-name "$label.PendingVCores" --namespace "AWS/ElasticMapReduce" --unit Count --value $pending_vcores --dimensions JobFlowId=$cluster_id  
done
EOF

chmod u+x $script_file
chown hadoop:hadoop $script_file

# create crontab to monitor etl and departments queues
echo "*/1 * * * * $script_file" | crontab -u hadoop -

exit 0