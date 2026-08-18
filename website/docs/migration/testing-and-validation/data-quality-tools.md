---
sidebar_label: Data Quality Tools
---

# Tools to Help with Data Quality

Instead of implementing validation from scratch, leverage AWS-native and open-source tools:

**AWS Glue Data Quality** is a fully managed service built on Deequ that measures and monitors data quality. It automatically computes statistics, recommends quality rules, monitors data, and alerts you when issues are detected. For hidden issues, it uses ML algorithms.

**Key capabilities:**

- Automated rule recommendations - Glue analyzes your data and suggests quality rules

- Data Quality Definition Language (DQDL) - Author straightforward and advanced validation rules

- Integration with ETL pipelines - Add "Evaluate Data Quality" nodes in AWS Glue Studio

- Reduces manual effort - From days to hours

**Example DQDL rules:**

> Rules = \[
>
> ColumnValues "order_amount" \> 0,
>
> ColumnValues "customer_id" matches "\[A-Z\]\{2\}\[0-9\]\{6\}",
>
> Completeness "email" \> 0.95,
>
> Uniqueness "transaction_id" \> 0.99,
>
> RowCount between 1000000 and 2000000
>
> \]

**Getting started:**

- [AWS Glue Data Quality Documentation](https://docs.aws.amazon.com/glue/latest/dg/glue-data-quality.html)

- [Tutorial: Evaluating Data Quality for ETL Jobs](https://docs.aws.amazon.com/glue/latest/dg/tutorial-data-quality.html)

- [Blog: Enable Strategic Data Quality Management with AWS Glue DQDL](https://aws.amazon.com/blogs/big-data/enable-strategic-data-quality-management-with-aws-glue-dqdl-labels/)

**Apache Deequ (Open Source)**

Deequ is an open-source library built on Apache Spark for defining "unit tests for data". It measures data quality in large datasets and is designed to scale with data in distributed filesystems or data warehouses. **Deequ can be used directly within your EMR cluster** **as part of a Spark job**, making it a natural fit for validating data quality inline with your existing EMR workloads—unlike AWS Glue Data Quality, which runs as a separate transient job outside the EMR cluster in the Glue service.

**Key capabilities:**

- Calculate data quality metrics on datasets

- Define and verify data quality constraints

- Be informed about changes in data distribution

- Implemented on top of Apache Spark for scalability

- Runs natively on EMR clusters alongside your Spark applications

**Example usage on EMR:**

> val verificationResult = VerificationSuite()
>
> .onData(dataset)
>
> .addCheck(
>
> Check(CheckLevel.Error, "Data Quality Check")
>
> .hasSize(\_ \>= 1000000)
>
> .isComplete("customer_id")
>
> .isUnique("transaction_id")
>
> .isNonNegative("order_amount"))
>
> .run()

**Resources:**

- [Blog: Test Data Quality at Scale with Deequ](https://aws.amazon.com/blogs/big-data/test-data-quality-at-scale-with-deequ/)

- [GitHub: Amazon Deequ on AWS Glue](https://github.com/aws-samples/amazon-deequ-glue)

**Apache Griffin (Large-Scale Migration Validation)**

**Apache Griffin** is an open-source data quality solution for big data that supports both batch and streaming modes. It's particularly effective for large-scale data migration validation. Griffin runs as a Spark application on Amazon EMR, making it a natural fit for validating migrated datasets directly on your EMR cluster.

**Key capabilities:**

- Unified process to measure data quality from different perspectives

- Supports both batch and streaming modes

- Configuration-based validation for large datasets

- Can be combined with StreamSets or Apache Kafka for end-to-end streaming workflows

**Running Griffin on Amazon EMR:**

Griffin operates as a Spark job submitted to your EMR cluster using spark-submit. Validation rules are defined in JSON configuration files (called measures), specifying source and target datasets, data quality dimensions (accuracy, completeness, timeliness), and comparison rules. This configuration-based approach allows teams to define validation logic without writing custom code:

> spark-submit --class org.apache.griffin.core.GriffinMain \\
> --master yarn --deploy-mode cluster \\
> griffin-measure.jar \<measure-config.json\> \<env-config.json\>

**Best practices for Griffin on EMR:**

- Use transient EMR clusters for validation jobs to optimize costs—spin up a cluster, run Griffin validation, and terminate

- Store Griffin configuration files in S3 for version control and reuse across validation runs

- Leverage EMR auto-scaling for large dataset comparisons that require significant compute resources

- Integrate with Amazon CloudWatch to monitor Griffin job execution and set alerts for validation failures

- Schedule validation jobs using AWS Step Functions or Amazon MWAA (Managed Workflows for Apache Airflow) for automated post-migration validation pipelines

**Use case:** Validate large datasets after migration using configuration-based rules without writing custom code. Define source-to-target comparison measures in JSON, submit as Spark jobs on EMR, and review data quality results stored in S3 or HDFS..

**Resources:**

[Blog: Automate Large-Scale Data Validation Using Amazon EMR and Apache Griffin](https://us-east-1.quicksight.aws.amazon.com/sn/account/amazonbi/start/home?sso_login=true#:~:text=Blog%3A%20Automate%20Large%2DScale%20Data%20Validation%20Using%20Amazon%20EMR%20and%20Apache%20Griffin)
