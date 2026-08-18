---
sidebar_label: Silo Mode
---

# Silo Mode

In silo mode, each tenant gets their own Amazon EMR cluster with specific tools for processing and analyzing their datasets. Data is stored in the tenant's Amazon S3 bucket or HDFS on the cluster. The Hive metastore is typically on the cluster or stored externally on Amazon RDS. AWS Glue Data Catalog can be used as a central metadata catalog.

## Example Silo Scenario

The following diagram is an example of a silo scenario in Amazon EMR. In this scenario, there are three different users — a data engineer, an analyst, and a data scientist — each launching their own clusters. A data engineer installs tools like Spark and Hive to manipulate and store the processed results in S3. An analyst runs tools like Spark SQL and Trino to explore datasets and send the query results to their own S3 bucket. A data scientist may use the EMR cluster to run ML or Deep Learning frameworks.

![](/img/migration/image22.png)

> *Figure 29: Example silo mode scenario*

In this model, you can configure your cluster to be automatically terminated after all steps of your processing complete. This setup is referred to as a transient cluster. A transient cluster provides total segregation per tenant and can also decrease costs as the cluster is charged only for the duration of the time it runs.

The following table lists the advantages and disadvantages of using silo mode with Amazon EMR.

| **Advantage** | **Disadvantage** |
|----|----|
| Provides complete isolation of data and resources. | Sharing data across clusters (especially when using HDFS) can be difficult. |
| Can be cost effective when used with Spot Instances and transient clusters. | Launching individual clusters can be expensive. |
| Easy to measure usage of resources per tenant. |  |

*Table 3: Advantages and disadvantages of silo mode*
