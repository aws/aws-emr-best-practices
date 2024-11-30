#!/bin/bash
#===============================================================================
#!# script: hbase-snapshot-import
#!# authors: ripani
#!# version: v0.2
#!#
#!# Import and Restore HBase Snapshots using a label. Make sure all the required
#!# HBase namespaces required by the tables already exist before launching the
#!# script.
#!#
#!# If you're transfering data between kerberized clusters, make sure the
#!# clusters belong to the same Kerberos realm.
#===============================================================================
#?#
#?# usage: ./hbase-snapshot-import.sh <LABEL> <SNAPSHOT_PATH>
#?#        ./hbase-snapshot-import.sh "20220813-1660430" "hdfs://NN:8020/hbase"
#?#        ./hbase-snapshot-import.sh "20220813-1660430" "s3://BUCKET/PREFIX"
#?#
#?#   LABEL                    HBase namespace to backup
#?#   SNAPSHOT_PATH            HDFS or S3 path.
#?#                            Example: s3://BUCKET or hdfs://NN:8020/user/hbase
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
LABEL="$1"
SNAPSHOT_PATH="$2"

HBASE_CMD="sudo -u hbase hbase"
HBASE_CONF="/etc/hbase/conf/hbase-site.xml"
HBASE_ROOT=$(xmllint --xpath "//configuration/property/*[text()='hbase.rootdir']/../value/text()" $HBASE_CONF)

#===============================================================================
# Import Snapshots
#===============================================================================
snapshots=$(
    $HBASE_CMD snapshot info -list-snapshots \
        -remote-dir $SNAPSHOT_PATH | grep $LABEL | awk '{print $1}'
)
for s in ${snapshots}; do
    echo "Import snapshot $s"
    $HBASE_CMD snapshot export -D hbase.rootdir=$SNAPSHOT_PATH \
        -snapshot $s \
        -copy-to $HBASE_ROOT
done

#===============================================================================
# Restore Snapshots
#===============================================================================
snapshots=$(
    $HBASE_CMD snapshot info -list-snapshots | grep $LABEL | awk '{print $1}'
)
for s in ${snapshots}; do
    echo "Restore snapshot $s"
    echo "restore_snapshot '$s'" | $HBASE_CMD shell
done
