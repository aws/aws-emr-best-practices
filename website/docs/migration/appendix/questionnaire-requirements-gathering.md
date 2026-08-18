---
sidebar_label: Questionnaire for Requirements Gathering
---

# Appendix A: Questionnaire for Requirements Gathering

For migrating from on-premises to Amazon EMR, Amazon Athena, and AWS Glue, this questionnaire helps you take inventory of the current architecture and the possible requirements for migration.

## Current Cluster Setup

- What does the current cluster look like?

  - How many nodes?

  - How much data is stored on the cluster?

- Which distribution of Apache Hadoop and/or Apache Spark are you running on?

## Cluster Use

- How much of the cluster is being used on average, during peak, during low times?

  - How many users, what percentage of CPU and memory?

  - Where are users located? One time zone or spread globally?

- How much of the data is being accessed regularly?

- How much new data is added on a monthly basis?

- What kind of data formats are the source, intermediate, and final outputs?

- Are workloads segregated in any manner? (i.e. with queues or schedulers)

## Maintenance

- How is the cluster being administrated right now?

- How are upgrades being done?

- Are there separate development and production clusters?

- Is there a backup cluster or data backup procedure?

## Use Cases

#### Batch Jobs

- How many jobs per day?

- What is the average time they run?

- When do they usually run?

- What types of work do the batch jobs run? (i.e. machine learning, aggregation, data format translation, and so on). (Optimize for machine types.)

- What frameworks or languages do the batch jobs use? (i.e. Apache Spark, HiveQL, and so on)

- Are there service level agreements (SLAs) to downstream consumers?

- How are jobs promoted to the batch environment?

- How are jobs submitted to the cluster?

- Are jobs designed to be idempotent?

#### Interactive Use Cases

- Is there interactive access to a cluster?

- Who is using the clusters?

- How are the clusters secured?

- How many people are using them?

- What tools or apps do people use to connect?

- If using Spark, how are Spark jobs deployed and submitted?

#### Amazon Athena Use Cases

- What is the query load? Is Amazon Athena more appropriate for your use case?

#### AWS Glue Use Cases

- What load is expected on AWS Glue?

- Is there an existing Hive Data Catalog? Can the data catalog be migrated to AWS Glue?

## Configuration and Dependencies

What custom JARs, UDFs, or SerDes are deployed on the cluster? Where is the source code maintained?

What external systems does the cluster integrate with? (JDBC sources, Kafka brokers, SFTP servers, REST APIs)

What job orchestration tool manages workflow dependencies? (Oozie, Airflow, Control-M, Autosys, cron)

How are job dependency graphs defined? Are there cross-team or cross-pipeline dependencies?

Are there custom Spark listeners, accumulators, or plugins in use?

What Python packages are installed on gateway or edge nodes beyond the standard distribution?

Are there custom bootstrap or initialization scripts that run on cluster startup?

What shell wrappers or helper scripts are used to submit, monitor, or retry jobs?

Are there custom logging or monitoring integrations? (Splunk forwarders, Datadog agents, Prometheus exporters)

What DNS names, host aliases, or service discovery mechanisms do applications rely on?

Are there any proprietary connectors, licensed software components, or vendor-specific tools on the cluster?

What configuration management tool maintains cluster configurations? (Puppet, Chef, Ansible, manual)
