# YARN Docker with GPU 

## Overview

This document provides a guide on launching an Amazon EMR cluster to execute YARN applications utilizing GPU resources within Docker containers. 

While EMR inherently installs all necessary NVIDIA drivers and libraries to run GPU-accelerated tasks, additional configurations and software are required to extend this capability to YARN applications running in docker containers. 

To enable GPU utilization within Docker containers, the following steps are required while launching an EMR cluster:

1. Attach an [EMR Bootstrap Action](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-bootstrap.html) to prepare the cluster nodes. You can use the following script as an example [EMR 6.x - Bootstrap Action](./scripts/emr-6-ba-yarn_docker_gpu.sh)

2. Specify the following [EMR cluster configurations](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-configure-apps.html) while launching the cluster.

## Configurations
```json
[
  {
    "Classification": "yarn-site",
    "Properties": {
      "yarn.nodemanager.container-executor.class": "org.apache.hadoop.yarn.server.nodemanager.LinuxContainerExecutor",
      "yarn.nodemanager.linux-container-executor.cgroups.hierarchy": "yarn",
      "yarn.nodemanager.linux-container-executor.cgroups.mount": "true",
      "yarn.nodemanager.linux-container-executor.cgroups.mount-path": "/sys/fs/cgroup",
      "yarn.nodemanager.resource-plugins": "yarn.io/gpu",
      "yarn.nodemanager.resource-plugins.gpu.allowed-gpu-devices": "auto",
      "yarn.nodemanager.resource-plugins.gpu.path-to-discovery-executables": "/usr/bin",
      "yarn.resource-types": "yarn.io/gpu",
      "yarn.nodemanager.resource-plugins.gpu.docker-plugin": "nvidia-docker-v2"
    }
  },
  {
    "Classification": "container-executor",
    "Configurations": [
      {
        "Classification": "docker",
        "Properties": {
          "docker.allowed.runtimes": "nvidia",
          "docker.trusted.registries": "library,centos"
        }
      },     
      {
        "Classification": "gpu",
        "Properties": {
          "module.enabled": "true"
        }
      },     
      {
        "Classification": "cgroups",
        "Properties": {
          "root": "/sys/fs/cgroup",
          "yarn-hierarchy": "yarn"
        }
      }
    ],
    "Properties": {}
  },
  {
    "Classification": "capacity-scheduler",
    "Properties": {
      "yarn.scheduler.capacity.resource-calculator": "org.apache.hadoop.yarn.util.resource.DominantResourceCalculator"
    }
  }
]
```

## Examples
To validate the setup, you can connect to the EMR primary node and run the YARN Distributed Shell. The following command launch a YARN application using docker nvidia runtime.

```bash
yarn jar /usr/lib/hadoop-yarn/hadoop-yarn-applications-distributedshell.jar \
  -jar /usr/lib/hadoop-yarn/hadoop-yarn-applications-distributedshell.jar \
  -shell_env YARN_CONTAINER_RUNTIME_TYPE=docker \
  -shell_env YARN_CONTAINER_RUNTIME_DOCKER_IMAGE=ubuntu \
  -shell_command nvidia-smi \
  -container_resources memory-mb=3072,vcores=1,yarn.io/gpu=1 \
  -num_containers 1
```

## Resources

In this section, you'll find additional resources for testing this feature. 

To deploy the CloudFormation templates, store the relevant Bootstrap Action script in an S3 bucket. Next, launch the template from the AWS Web Console, ensuring to complete all necessary input parameters.

- EMR 6.x - [CloudFormation Template](./scripts/emr-6-yarn_docker_gpu.yaml) / [Bootstrap Action](./scripts/emr-6-ba-yarn_docker_gpu.sh)


## References 

- [Hadoop - Using GPU On YARN](https://hadoop.apache.org/docs/stable/hadoop-yarn/hadoop-yarn-site/UsingGpus.html)
- [EMR - Use the Nvidia RAPIDS Accelerator for Apache Spark](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-spark-rapids.html)