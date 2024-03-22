#!/bin/bash
#===============================================================================
#!# script: emr-6-ba-yarn_docker_gpu.sh
#!#
#!# EMR Bootstrap Action - Install docker requirements on a GPU node
#===============================================================================
set -ex

# force to run as root
if [ $(id -u) != "0" ]; then
  sudo "$0" "$@"
  exit $?
fi

# cgroups
chmod a+rwx -R /sys/fs/cgroup/cpu,cpuacct
chmod a+rwx -R /sys/fs/cgroup/devices

# nvidia docker runtime
curl -s -L https://nvidia.github.io/libnvidia-container/stable/rpm/nvidia-container-toolkit.repo | tee /etc/yum.repos.d/nvidia-container-toolkit.repo
yum install -y nvidia-docker2 nvidia-container-toolkit

# (IMPORTANT) configure nvidia runtime
nvidia-ctk runtime configure --runtime=docker
# (IMPORTANT) this set the value "no-cgroups = false" in /etc/nvidia-container-runtime/config.toml
# without this YARN docker containers will fail with "Failed to initialize NVML: Unknown Error"
nvidia-ctk config --set nvidia-container-cli.no-cgroups=false -i
systemctl restart docker
exit 0