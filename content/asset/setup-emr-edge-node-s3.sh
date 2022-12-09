#!/bin/bash

# AWS EMR edge node setup script (tested for Amazon Linux and Ubuntu)
# Pre-reqs:
#   1. the emr client dependencies generated with the step s3://tomzeng/BAs/copy-emr-client-deps.sh
#   2. the edge node has Python, JDK 8, AWS CLI, and Ruby installed
#   3. python on the edge node should be the same version as pyspark on EMR (2.7 or 3.4), conda can be used
#   4. this script is copied to edge node by running "aws s3 cp s3://aws-emr-bda-public-us-west-2/BAs/setup-emr-edge-node-s3.sh ."

# Usage: bash setup-emr-edge-node-s3.sh --emr-client-deps <EMR client dependencies file in S3>
#
# Example: bash setup-emr-edge-node-s3.sh --emr-client-deps s3://aws-emr-bda-public-us-west-2/emr-client-deps/emr-client-deps-j-2WRQJIKRMUIMN.tar.gz

EMR_CLIENT_DEPS=""

# error message
error_msg ()
{
  echo 1>&2 "Error: $1"
}

# get input parameters
while [ $# -gt 0 ]; do
    case "$1" in
    --emr-client-deps)
      shift
      EMR_CLIENT_DEPS=$1
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

aws s3 cp $EMR_CLIENT_DEPS .
EMR_CLIENT_DEPS_LOCAL=$(python -c "print('$EMR_CLIENT_DEPS'.split('/')[-1])")


if grep -q Ubuntu /etc/issue; then
  apt-get install sudo -y || true # this might be needed inside Docker container
  sudo apt-get install sudo openjdk-8-jdk -y
  sudo update-java-alternatives -s java-1.8.0-openjdk-amd64
  export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
  sudo sh -c "echo 'export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64' >> /etc/bashrc"
  echo "Note Hive Server2 service setup not yet support for Ubuntu edge node"
#elif grep -q Amazon /etc/issue; then
else # default to Amazon Linux
  yum install sudo -y || true # this might be needed inside Docker container
  sudo yum install krb5-workstation krb5-libs -y
  sudo mkdir -p /etc/init
  sudo cp -pr etc/init/* /etc/init/
  sudo yum install sudo java-1.8.0-openjdk java-1.8.0-openjdk-devel -y
  sudo alternatives --set java java-1.8.0-openjdk.x86_64
  export JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk
  sudo sh -c "echo 'export JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk' >> /etc/bashrc"
  #sudo start hive-server2 || true
fi

tar xvfz $EMR_CLIENT_DEPS_LOCAL
cd emr-client-deps
sudo cp -pr usr/bin/* /usr/bin || true
sudo cp -pr usr/lib/* /usr/lib || true
sudo mkdir -p /usr/share/aws
sudo mkdir -p /var/log/kerberos
sudo cp -pr usr/share/aws/* /usr/share/aws/ || true
sudo mkdir -p /opt/aws
sudo cp -pr opt/aws/* /opt/aws/
sudo cp -pr emr /
sudo ln -s /emr/instance-controller/lib/info /var/lib/info

sudo mkdir -p /etc/hadoop
sudo mkdir -p /etc/hive
sudo mkdir -p /etc/spark
sudo ln -s /usr/lib/hadoop/etc/hadoop /etc/hadoop/conf
sudo ln -s /usr/lib/hive/conf /etc/hive/
sudo ln -s /usr/lib/spark/conf /etc/spark/

sudo cp -pr etc/presto /etc || true
sudo cp -pr etc/hudi /etc || true
sudo cp -pr etc/tez /etc || true
sudo cp -pr etc/*.keytab /etc || true
sudo cp -pr etc/krb5.conf /etc || true

cd ..
rm -rf emr-client-deps
rm $EMR_CLIENT_DEPS_LOCAL

sudo ln -s /tmp /mnt/ || true

# set up user hadoop, additional users can be set up similarly
sudo groupadd sudo || true # may need this in docker container
sudo useradd -m hadoop -p hadoop
sudo mkdir -p /var/log/hive/user/hadoop
sudo chown hadoop:hadoop /var/log/hive/user/hadoop
sudo usermod -a -G sudo hadoop

sudo useradd -m hive -p hive
sudo mkdir -p /var/log/hive/user/hive
sudo chown hive:hive /var/log/hive/user/hive
sudo usermod -a -G sudo hive

sudo useradd -m hbase -p hbase
sudo mkdir -p /var/log/hbase/
sudo ln -s /usr/lib/hbase/logs /var/log/hbase || true
sudo chmod a+rwx -R /var/log/hbase/logs/ || true

sudo mkdir -p /mnt/s3
sudo chmod a+rwx /mnt/s3

hostip=$(cat /etc/spark/conf/spark-env.sh | grep SPARK_PUBLIC_DNS | sed -e 's/ip-//' -e 's/-/./g' -e 's/.ec2.internal//g' -e 's/export SPARK_PUBLIC_DNS=//g')

hostnm=$(cat /etc/spark/conf/spark-env.sh | grep SPARK_PUBLIC_DNS | cut -f2 -d'=' -)

echo $hostip $hostnm >> /etc/hosts

cat <<EOF
# Testing the EMR egde node:

sudo su - hadoop

# set the python to the same version on EMR, needed on Ubuntu 16, but not needed on Ubuntu 14
export PYSPARK_PYTHON=python3.7
export PYSPARK_DRIVER_PYTHON=python3.7

# this might be needed for openjdk on Ubuntu:
export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64

# for Amazon Linux
export JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk

# M/R examples
hadoop-mapreduce-examples pi 10 10000

# Spark example
spark-submit /usr/lib/spark/examples/src/main/python/pi.py

# Presto cli
presto-cli --execute "show schemas" --output-format ALIGNED
presto-cli --catalog hive --schema default --debug --execute "show tables" --output-format ALIGNED

# Hive cli
hive -e "show schemas"
hive -e "show tables"

# start Hive Server 2 (on Amazon Linux, non-docker install)
sudo start hive-server2

EOF

echo "Finished copy EMR edge node client dependencies"
