#!/bin/bash
set -x -e

# AWS EMR step to copy client dependencies to S3

# Usage: bash copy-emr-client-deps.sh --s3-folder <S3 folder>
#

IS_MASTER=false
if grep isMaster /mnt/var/lib/info/instance.json | grep true;
then
  IS_MASTER=true
fi

S3_FOLDER=""

# error message
error_msg ()
{
  echo 1>&2 "Error: $1"
}

# only run below on master instance
if [ "$IS_MASTER" = true ]; then

# get input parameters
while [ $# -gt 0 ]; do
    case "$1" in
    --s3-folder)
      shift
      S3_FOLDER=$1
      ;;
    -*)
      # do not exit out, just note failure
      error_msg "unrecognized option: $1"
      ;;
    *)
      break;
      ;;
    esac
    shift
done

if [ ! "$S3_FOLDER" = "" ]; then

mkdir emr-client-deps
cd emr-client-deps

mkdir -p usr/bin
cp -prL /usr/bin/presto-cli usr/bin || true
cp -prL /usr/bin/beeline usr/bin || true
cp -prL /usr/bin/emrfs usr/bin || true
cp -prL /usr/bin/emr-strace usr/bin || true
cp -prL /usr/bin/flink* usr/bin || true
cp -prL /usr/bin/hadoop* usr/bin || true
cp -prL /usr/bin/hbase usr/bin || true
cp -prL /usr/bin/hcat usr/bin || true
cp -prL /usr/bin/hdfs usr/bin || true
cp -prL /usr/bin/hive* usr/bin || true
cp -prL /usr/bin/mahout usr/bin || true
cp -prL /usr/bin/mapred usr/bin || true
cp -prL /usr/bin/oozie* usr/bin || true
cp -prL /usr/bin/pig* usr/bin || true
cp -prL /usr/bin/pyspark* usr/bin || true
cp -prL /usr/bin/spark* usr/bin || true
cp -prL /usr/bin/sqoop* usr/bin || true
cp -prL /usr/bin/yarn* usr/bin || true
cp -prL /usr/bin/zoo* usr/bin || true

mkdir -p usr/lib
cp -prL /usr/lib/hadoop usr/lib || true
cp -prL /usr/lib/hadoop-yarn usr/lib || true
cp -prL /usr/lib/hive usr/lib || true
cp -prL /usr/lib/spark usr/lib || true
cp -prL /usr/lib/bigtop-utils usr/lib || true
cp -prL /usr/lib/flink usr/lib || true
cp -prL /usr/lib/hadoop-hdfs usr/lib || true
cp -prL /usr/lib/hadoop-httpfs usr/lib || true
#sudo cp -prL /usr/lib/hadoop-kms usr/lib || true
cp -prL /usr/lib/hadoop-lzo usr/lib || true
cp -prL /usr/lib/hadoop-mapreduce usr/lib || true
cp -prL /usr/lib/hadoop-yarn usr/lib || true
cp -prL /usr/lib/hbase usr/lib || true
cp -prL /usr/lib/hive usr/lib || true
cp -prL /usr/lib/hive-hcatalog usr/lib || true
#cp -prL /usr/lib/hue usr/lib || true
cp -prL /usr/lib/livy usr/lib || true
cp -prL /usr/lib/mahout usr/lib || true
cp -prL /usr/lib/oozie usr/lib || true
cp -prL /usr/lib/phoenix usr/lib || true
cp -prL /usr/lib/pig usr/lib || true
cp -prL /usr/lib/presto usr/lib || true
cp -prL /usr/lib/spark usr/lib || true
cp -prL /usr/lib/sqoop usr/lib || true
cp -prL /usr/lib/tez usr/lib || true
#cp -prL /usr/lib/zeppelin usr/lib || true
cp -prL /usr/lib/zookeeper usr/lib || true

mkdir -p etc/init

cp -prL /etc/presto etc/ || true
cp -prL /etc/hudi etc/ || true
cp -prL /etc/tez etc/ || true
cp -prL /etc/*.keytab etc/ || true
cp -prL /etc/krb5.conf etc/ || true

cp -pL /etc/init/hive-server2.conf etc/init || true
cp -pL /etc/init/livy-server.conf etc/init || true

# /emr/instance-controller/lib/info will be symlinked to /var/lib/info
mkdir -p emr/instance-controller/lib/info
cp -prL /emr/instance-controller/lib/info/instance.json emr/instance-controller/lib/info
cp -prL /emr/instance-controller/lib/info/extraInstanceData.json emr/instance-controller/lib/info
cp -prL /emr/instance-controller/lib/info/job-flow.json emr/instance-controller/lib/info
cp -prL /emr/instance-controller/lib/info/job-flow-state.txt emr/instance-controller/lib/info

#mkdir -p var/aws/emr

mkdir -p usr/share/aws
cp -prL /usr/share/aws usr/share || true

mkdir -p opt/aws
cp -prL /opt/aws opt/

CLUSTER_ID=$(ruby -e "puts \`grep jobFlowId  /emr/instance-controller/lib/info/job-flow.json\`.split.last[1..-3]")

cd ..

tar cvfz emr-client-deps-${CLUSTER_ID}.tar.gz emr-client-deps/*

S3_FOLDER="${S3_FOLDER%/}/" # remove trailing / if exists then add /
aws s3 cp emr-client-deps-${CLUSTER_ID}.tar.gz $S3_FOLDER


sudo rm -rf emr-client-deps

echo "Finished copying EMR edge node client dependencies"

else

echo "Usage: copy-emr-client.sh --s3-folder <S3 folder>"  

fi # S3_FOLDER

fi # IS_MASTER
