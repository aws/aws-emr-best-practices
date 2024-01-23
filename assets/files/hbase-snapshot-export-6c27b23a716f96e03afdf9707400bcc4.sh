#!/bin/bash
#===============================================================================
#!# script: hbase-snapshot-export
#!# authors: ripani
#!# version: v0.2
#!#
#!# Generate a snapshot of all the tables present in a specific hbase namespace.
#!# The snapshots so created are then copied over an S3 bucket or HDFS path.
#!# For legacy clusters, use the s3a:// schema and specify the AWS programmatic
#!# keys.
#!#
#!# If you're transfering data between kerberized clusters, make sure the
#!# clusters belong to the same Kerberos realm.
#===============================================================================
#?#
#?# usage: ./hbase-snapshot-export.sh <HBASE_NS> <SNAPSHOT_PATH> [S3_ACCESS_KEY] [AWS_SECRET_KEY]
#?#        ./hbase-snapshot-export.sh "default" "hdfs://NN:8020/hbase"
#?#        ./hbase-snapshot-export.sh "default" "s3://BUCKET/PREFIX"
#?#        ./hbase-snapshot-export.sh "default" "s3a://BUCKET/PREFIX" "KEY" "SECRET"
#?#
#?#   HBASE_NS                 HBase namespace to backup
#?#   SNAPSHOT_PATH            HDFS or S3 path.
#?#                            Example: s3://BUCKET or hdfs://NN:8020/user/hbase
#?#   AWS_ACCESS_KEY           [Optional] AWS access key for s3a schema
#?#   AWS_SECRET_KEY           [Optional] AWS secret key for s3a schema
#?#
#===============================================================================

# Print the usage helper using the header as source
function usage() {
	[ "$*" ] && echo "$0: $*"
	sed -n '/^#?#/,/^$/s/^#?# \{0,1\}//p' "$0"
	exit -1
}

[[ $# -lt 2 ]] && echo "error: wrong parameters" && usage

#===============================================================================
# Configurations
#===============================================================================
HBASE_NS="$1"
SNAPSHOT_PATH="$2"
AWS_ACCESS_KEY="$3"
AWS_SECRET_KEY="$4"

if [[ -f "/emr/instance-controller/lib/info/extraInstanceData.json" ]]; then
	HBASE_CMD="sudo -u hbase hbase"
else
	HBASE_CMD="hbase"
fi

# Retrieve list tables for the namespace
readarray -t tables < <(echo "list_namespace_tables '$HBASE_NS'" | $HBASE_CMD shell 2> /dev/null | sed -e '1,/TABLE/d' -e '/seconds/,$d' | while IFS='' read -r line || [[ -n "$line" ]]; do echo "$line"; done)

# Generate Snapshots
label="$(date +"%Y%m%d")-$(date +%s)"
for table in "${tables[@]}"; do
	echo "Creating snapshot for table $HBASE_NS:$table"
	$HBASE_CMD snapshot create -n "$label-$HBASE_NS-$table" -t $HBASE_NS:$table
done

# Copy Snapshots to S3
snapshots=$($HBASE_CMD snapshot info -list-snapshots | grep $label | awk '{print $1}')
for s in ${snapshots}; do
	echo "Transfer snapshot $s to $SNAPSHOT_PATH"
	if [[ -z "$AWS_ACCESS_KEY" && -z "$AWS_SECRET_KEY" ]]; then
		$HBASE_CMD org.apache.hadoop.hbase.snapshot.ExportSnapshot -snapshot ${s} -copy-to $SNAPSHOT_PATH
	else
		$HBASE_CMD org.apache.hadoop.hbase.snapshot.ExportSnapshot -Dfs.s3a.access.key=$AWS_ACCESS_KEY -Dfs.s3a.secret.key=$AWS_SECRET_KEY -snapshot ${s} -copy-to $SNAPSHOT_PATH
	fi
done
