---
sidebar_label: Software Patching
---

# Software Patching

Keeping your Amazon EMR clusters up to date with the latest security patches and software versions is a shared responsibility between AWS and the customer. Amazon EMR publishes new releases on a regular basis, incorporating updated open-source frameworks, security fixes, and OS-level patches. Use the latest available release whenever possible.

## EMR Release Lifecycle

Each Amazon EMR release bundles a runtime environment (OS and JDK), core engines (Spark, Hive, Iceberg, etc.), and extras (convenience libraries). Amazon EMR uses semantic versioning *major.minor.patch*:

- Major releases (e.g., 7.x) introduce breaking changes such as a new OS (AL2023) or JDK version (Corretto 17) upgrades.

- Minor releases add new open-source versions and features. Amazon EMR aims to issue a new minor release at least every 90 days.

- Patch releases contain backward-compatible fixes without new functionality. Starting with EMR 5.36, 6.6, and 7.0, the latest patch release automatically uses the most recent Amazon Linux AMI.

Amazon EMR provides Standard Support for each release for 24 months from its initial release date. After Standard Support ends, releases enter End of Support (12 months) and then End of Life. Releases in End of Support do not receive fixes, patches, or technical support. We recommend migrating to the latest release before your current version reaches End of Support. For the full support timeline, see [Amazon EMR standard support](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-standard-support.html) in the *Amazon EMR Release Guide*.

## OS-Level Patching

The patching behavior of the default Amazon EMR AMI depends on the release series:

- **Amazon EMR 7.x (Amazon Linux 2023) and EMR 5.36+/6.6+ (Amazon Linux 2)** Clusters contain only the security updates that were available in the AL AMI version selected at cluster creation. EMR cluster instances do not install the latest security updates from package repositories at launch time. To receive the latest security updates, periodically recreate your cluster, which automatically picks up the most recent AL AMI available for the specified EMR release.

- **Amazon EMR 5.0.0–5.35.0 and 6.0.0–6.5.0 (Amazon Linux AMI)** At first boot, instances automatically download and install critical and important security updates from the enabled AL and Amazon EMR package repositories. However, kernel updates and packages that require a reboot (such as NVIDIA and CUDA) are not installed automatically.

**NOTE** Although it is possible to install and update system packages using *sudo yum update*, we do not recommend this approach, as it installs all available packages indiscriminately and can cause incompatibilities with the EMR-managed software stack.

For additional control over which patches are applied, you have the following options:

- **Use the latest EMR patch release.** This is the simplest approach. Each new patch release ships with the most recent AL AMI, which includes the latest OS-level security patches. Check [Using the default Amazon Linux AMI for Amazon EMR](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-default-ami.html) for Amazon Linux information for the latest patch version of EMR releases.

- **Use a custom AMI.** Build a custom AMI with the specific patches your organization requires, including kernel updates. This gives you full control over the OS baseline. For more information, see [Using a custom AMI](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-custom-ami.html) in the *Amazon EMR Management Guide*.

## Application-Level Patching

Open-source application versions (Spark, Hive, HBase, Presto, etc.) are tied to the EMR release. Amazon EMR aims to include the latest stable upstream versions of core engines within 90 days of their release. To get updated application versions:

- **Upgrade to a newer EMR release** This is the recommended approach. Each release bundles tested, compatible versions of all included applications. Check the [Amazon EMR Release Notes](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-release-components.html) to see which application versions are included in each release.

- **Contact AWS Support** if you need a specific application patch that is not yet available in a released version. Depending on severity, Support may provide workarounds or, in critical cases, a bootstrap action that applies the patch.

## Software Upgrades

Upgrading to a newer Amazon EMR release is the primary way to adopt updated open-source frameworks, receive security fixes, and access new EMR features. Because each EMR release bundles a specific set of application versions, OS, and JDK, an upgrade requires launching a new cluster — you cannot upgrade an existing cluster in place.

#### Testing Strategy

- **Isolate test from production.** Launch a test cluster on the new release in a separate environment. Some upgrades modify shared resources — for example, a Hive version upgrade may alter the Hive Metastore schema, which could make it incompatible with older versions. If your test cluster shares a metastore with production, an unintended schema migration could impact production workloads.

- **Validate data quality.** Run representative workloads on both the old and new versions and compare outputs. Changes in query optimizer behavior, type casting, or default configurations can produce different results even when the same code runs on both versions.

- **Validate performance.** Benchmark key workloads to detect regressions. New framework versions may change shuffle behavior, memory management, or parallelism defaults that affect job duration and resource consumption.

- **Test security configurations.** Verify that your security configuration (encryption, Kerberos, IAM roles) works correctly on the new release. Major version upgrades that change the JDK or TLS defaults can affect in-transit encryption behavior and certificate compatibility.

- **Test custom components.** If you use bootstrap actions, custom AMIs, custom JARs (e.g., a *TLSArtifactsProvider* or UDFs), or third-party libraries, verify they are compatible with the new release's OS, JDK, and application versions.

#### Upgrade Process

1\. Review the EMR release notes and upstream application release notes for the target version.

2\. Launch a test cluster on the new release with the same security configuration, instance types, and applications as production.

3\. Run your validation suite: data quality checks, performance benchmarks, and security configuration tests.

4\. If validation passes, schedule the production upgrade. For transient clusters, update your automation (CloudFormation, Terraform, or similar) to use the new release label. For long-running clusters, follow a blue/green rotation approach — launch a new cluster, migrate workloads, and decommission the old one.

5\. Monitor the new cluster closely after the transition. Keep the old cluster configuration available for rollback if issues emerge in production that were not caught during testing.

#### Spark Upgrade Agent

For Apache Spark workloads, Amazon EMR provides the Apache Spark Upgrade Agent, which helps you upgrade existing Spark applications from older EMR versions to the latest release. The agent analyzes your Spark code and configurations and identifies changes needed for compatibility with newer Spark versions. For more information, see [What is Apache Spark Upgrade Agent for Amazon EMR](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/spark-upgrades.html) in the *Amazon EMR Release Guide*.

#### Best Practices

- **Use the latest EMR release for new clusters**. Each release includes security updates for both the OS and open-source applications.

- **Test new releases in a non-production environment before migrating production workloads**. The Amazon EMR console's clone cluster feature is useful for this.

- **For transient (batch) clusters, patching is straightforward** — launch each new cluster on the latest release.

- **For long-running clusters, plan for cluster rotation from the start**. Treat clusters as replaceable infrastructure rather than persistent systems that accumulate patches over time. Design your architecture so that a new cluster can be launched on a newer EMR release and workloads can be shifted to it with minimal disruption, similar to a blue/green deployment. This means:

  - **Externalizing state** — use Amazon S3 for persistent data rather than instance store (HDFS).

  - **Automating cluster provisioning** — use infrastructure-as-code tools such as AWS CloudFormation, Terraform, or custom pipelines.

  - **Building runbooks** — define the steps for provisioning a new cluster, validating it, migrating workloads, and decommissioning the old one.

> Rotating clusters on a regular cadence — monthly or quarterly — is the most reliable way to stay current on both OS and application patches in long-running environments.

- Subscribe to the [Amazon EMR Release Notes RSS feed](https://docs.aws.amazon.com/emr/latest/ReleaseGuide/emr-whatsnew.html) to be notified when new releases are available.
