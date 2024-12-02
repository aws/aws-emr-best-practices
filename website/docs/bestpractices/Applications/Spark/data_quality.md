---
sidebar_label: Data Quality
---

# Data Quality

## Data quality and integrity checks with Deequ

Spark and Hadoop frameworks do not inherently guarantee data integrity. While it is very rare, you may observe some data corruption or missing data or duplicate data due to unexpected errors in the hardware and software stack. It is highly recommended that you validate the integrity and quality of your data atleast once after your job execution. It would be best to check for data correctness in multiple stages of your job - especially if your job is long-running.

The Spark and Hadoop frameworks don't ensure data integrity as a default feature. Although uncommon, instances of data corruption, loss, or duplication can occur due to unexplained issues within the underlying hardware and software infrastructure. To maintain data accuracy, it's strongly advised to verify the consistency of your data post-job completion. Ideally, this validation process should take place throughout various phases of your job, particularly when dealing with extended processing tasks.

In order to check data integrity, consider using [Deequ](https://github.com/awslabs/deequ) for your Spark workloads. Following are some blogs that can help you get started with Deequ for Spark workloads.

* [Test data quality at scale with Deequ | AWS Big Data Blog](https://aws.amazon.com/blogs/big-data/test-data-quality-at-scale-with-deequ/)
* [Testing data quality at scale with PyDeequ | AWS Big Data Blog](https://aws.amazon.com/blogs/big-data/testing-data-quality-at-scale-with-pydeequ/)

Sometimes, you may have to write your own validation logic. For example, if you are doing a lot of calculations or aggregations, you will need to compute twice and compare the two results for accuracy. In other cases, you may also implement checksum on data computed and compare it with the checksum on data written to disk or S3. If you see unexpected results, then check your Spark UI and see if you are getting too many task failures from a single node by sorting the Task list based on "Status" and check for error message of failed tasks. If you are seeing too many random unexpected errors such as "ArrayIndexOutOfBounds" or checksum errors from a single node, then it may be possible that the node is impaired. Exclude or terminate this node and re-start your job.