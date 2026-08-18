---
sidebar_label: Prototyping
---

# Prototyping

When working with a new product or service, there is always a learning curve. The most effective way to accelerate that learning is through hands-on prototyping—experimenting with real-world data and scenarios early in the process to surface unknowns before they become costly issues in production. Prototyping should be mandatory, ensuring assumptions are challenged and validated before full-scale implementation. Common assumptions when working with new products and services include the following:

**A particular data format is the best choice for my use case.** Selecting the right data format is not a one-size-fits-all decision—the optimal choice is highly dependent on your specific workload, access patterns, and performance requirements. Columnar formats such as Apache Parquet and Apache ORC are strong general-purpose choices that outperform row-based formats in most analytical workloads. However, modern Open Table Formats (OTFs) such as Apache Iceberg, Delta Lake, and Apache Hudi have emerged as compelling alternatives, offering additional capabilities such as ACID transactions, schema evolution, and time travel that can deliver significant performance and cost advantages for the right use cases. Given how quickly and meaningfully this decision can impact your workload's performance and cost profile, validating your data format assumptions early—using real-world, representative data—is strongly recommended before committing to a format at scale.

> **A particular application is more performant than another for my workflow.** This scenario is the same as the above common assumption on data formats. Changing applications can be an expensive undertaking later in the process and impact adoption.
>
> **A particular instance type is the most cost-effective way to run a specific workflow.** Many times, another instance type performs better if it is tuned for the workflow. For example, Graviton or C series EC2 instances can perform better, and cost less if you enable spill-to-disk rather than using R series EC2 instances. This scenario is easier to change later and is recommended if cost and performance are high priority requirements.
>
> **A particular application running on-premises should work identically on cloud.** There are many factors that contribute to running workloads, such as instance type, storage type, application version, infrastructure configuration, and so on. Running a wide variety of jobs with real data that you expect to run on production provides the most validation.

With the cloud, there are several factors in the environment in which a workload may run. For example, at different times of day, traffic to Amazon S3 could vary, or caching could be instituted when not expected. Therefore, prototyping reduces the number and severity of surprises during development and deployments, and the rate of return can be large. Last, finding out issues sooner than later in the development cycle is much more cost effective.

## Best Practices for Prototyping

- **Prioritize the riskiest assumptions** - Brainstorm all possible assumptions and unknowns. Focus first on those with the greatest potential impact on your migration

- **Start early** - Begin prototyping as soon as possible. Issues identified early in the process are the least expensive to address

- **Match your prototype environment to production -** Prototype in an environment that is similar to the environment that you want to be operating in. Start with a smaller environment or subset of characteristics and then move to a larger scale.

- **Define clear goals upfront -** Determine goals for the tests upfront and get support from stakeholders. The goal could be to answer a question about how something works or to validate a design.

- **Make tests deterministic and easily repeatable -** Run experiments using an automated approach, such as a script or continuous integration environment, so that the test can be run in different environments. For example, run a test on different instance types or against multiple AMIs. These scripts can later be used as tests for deployments.

- **Validate your test setup**, **environment, and results with peers** **-** For example, if you run download tests against the same S3 objects, this could cause Amazon S3 to cache the object. This scenario gives incorrect results when the actual workflow is retrieving random objects.

- **Run tests multiple times to account for variability -** Run the tests sufficiently enough to remove variability that may come from dependencies. For example, variability from Amazon S3 may be caused by the traffic load of other users or the time of day. Look at different percentiles, such as P50, P90, P99, and P100 and determine how variability may impact user experience.

- **Document and review results** **-** This review ensures that the tests were run properly and results are consistent.

- **Don't make assumptions -** In the big data analytics space, too many variables affect performance, cost, and functionality, meaning an obvious assumption may be incorrect. Always validate your assumptions by testing them. For example, many people may assume that a particular instance type that closely matches the hardware they use on their premises may be a better fit than choosing another instance type.

- **Invest appropriately in prototyping -** The more rigorously you account for real-world factors in your prototype, the greater your confidence that the design will perform as expected in production. Define your goals at the outset to ensure you achieve the right level of certainty without over-investing.

- **Seek help when needed -** Don't be afraid to seek help by posting on forums, consulting AWS partners, and reaching out to your account team.
