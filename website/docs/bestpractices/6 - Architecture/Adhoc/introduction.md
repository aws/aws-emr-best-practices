---
sidebar_position: 1
sidebar_label: Introduction
---

# ** Ad Hoc - Introduction **

Amazon EMR on EC2 provides a number of engines to support your ad hoc query use cases. Trino, (formely PrestoSQL) has become a popular choice for its low latency, ANSI SQL standard, ease of use and integrations with Amazon EMR feature set. 

### ** Choosing between Amazon Athena and Trino on Amazon EMR **

Amazon Athena is a serverless interactive query engine that executes SQL queries on data that rests in Amazon S3. Many customers use Athena for a wide variety of use cases, including interactive querying of data to exploring data, to powering dashboards on top of operational metrics saved on S3, to powering visualization tools, such as Amazon QuickSight or Tableau. 

We recommend you consider Amazon Athena for these types of workloads. Athena is easy to integrate with, has several features, such as cost management and security controls, and requires little capacity planning. All of these characteristics lead to lower operational burden and costs. 

However, there are some use cases where Trino on Amazon EMR may be better suited than Amazon Athena. For example, consider the following
priorities:

- Cost reduction: If cost reduction is your primary goal, we recommend that you estimate cost based on both approaches. You may find that the load and query patterns are lower in cost with Trino on Amazon EMR. Keep in mind that there is an operational cost associated with managing a Trino EMR environment. You’ll need to weight the cost benefits of Trino on EMR vs its operational overhead. 

- Performance or Specific Tuning requirements: If your use case includes a high sensitivity to performance or you want the ability to fine-tune a Presto cluster to meet the performance requirements then Trino on EMR  may be a better fit.

- Critical features: If there are features that Amazon Athena does not currently provide, such as the use of custom serializer/deserializers for custom data types, or connectors to data stores other than those currently supported, then Trino on EMR may be a better fit.


`The rest of the section will focus on Trino on Amazon EMR. For more details on Amazon Athena, see here: <https://aws.amazon.com/athena/>`