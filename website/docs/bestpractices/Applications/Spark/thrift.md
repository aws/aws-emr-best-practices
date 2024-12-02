# Thrift Server

## Long running thrift server

Spark Thrift Server allows JDBC/ODBC clients to execute SQL queries on Spark. It is recommended to follow the best practices outlined below.

* [Ensure Application Masters only run on an On Demand Node](../../Features/Spot%20Usage/best_practices#ensure-application-masters-only-run-on-an-on-demand-node)

* As the query results are collected by thrift server,  ensure Spark driver core/memory and `spark.driver.maxResultSize` are properly configured. Use `--driver-memory` insted of `--conf spark.driver.memory` as thrift server is running at client mode

* Long running thrift server can generate large amount of Spark event logs. [Activate the Spark event log rolling and compaction feature](https://docs.aws.amazon.com/emr/latest/ManagementGuide/app-history-spark-UI.html#app-history-spark-UI-large-event-logs)

* Thrift server log file size can be huge as by default the log are accumulated.   Try to configure custom log4j2 properties file to use rolling file appender

```bash
/usr/lib/spark/sbin/start-thriftserver.sh                         \
  -Dlog4j.configurationFile=/home/hadoop/thriftlog4j2.properties" \
  --driver-cores 8                                                \
  --driver-memory 10G
```

  **thriftlog4j2.properties** example as below:

```
property.basePath = /var/log/spark/
  
rootLogger.level = info
rootLogger.appenderRef.rolling.ref = fileLogger
  
appender.rolling.type = RollingFile
appender.rolling.name = fileLogger
appender.rolling.fileName = ${basePath}spark-root-org.apache.spark.sql.hive.thriftserver.HiveThriftServer2-application.log
appender.rolling.filePattern = ${basePath}spark-root-org.apache.spark.sql.hive.thriftserver.HiveThriftServer2-application.%d{MM-dd-yy}-%i.log
appender.rolling.layout.type = PatternLayout
appender.rolling.layout.pattern = %d{yy/MM/dd HH:mm:ss} %p %c{1}: %m%n
appender.rolling.policies.type = Policies
appender.rolling.policies.size.type = SizeBasedTriggeringPolicy
appender.rolling.policies.size.size = 100MB
appender.rolling.strategy.type = DefaultRolloverStrategy
appender.rolling.strategy.max = 10
  
appender.console.type = Console
appender.console.name = console
appender.console.target = SYSTEM_ERR
appender.console.layout.type = PatternLayout
appender.console.layout.pattern = %d{yy/MM/dd HH:mm:ss} %p %c{1}: %m%n
  
# Set the default spark-shell/spark-sql log level to WARN. When running the
# spark-shell/spark-sql, the log level for these classes is used to overwrite
# the root logger's log level, so that the user can have different defaults
# for the shell and regular Spark apps.
logger.repl.name = org.apache.spark.repl.Main
logger.repl.level = warn
  
logger.thriftserver.name = org.apache.spark.sql.hive.thriftserver.SparkSQLCLIDriver
logger.thriftserver.level = warn
  
# Settings to quiet third party logs that are too verbose
logger.jetty1.name = org.sparkproject.jetty
logger.jetty1.level = warn
logger.jetty2.name = org.sparkproject.jetty.util.component.AbstractLifeCycle
logger.jetty2.level = error
logger.replexprTyper.name = org.apache.spark.repl.SparkIMain$exprTyper
logger.replexprTyper.level = info
logger.replSparkILoopInterpreter.name = org.apache.spark.repl.SparkILoop$SparkILoopInterpreter
logger.replSparkILoopInterpreter.level = info
logger.parquet1.name = org.apache.parquet
logger.parquet1.level = error
logger.parquet2.name = parquet
logger.parquet2.level = error
logger.hudi.name = org.apache.hudi
logger.hudi.level = warn
  
# SPARK-9183: Settings to avoid annoying messages when looking up nonexistent UDFs in SparkSQL with Hive support
logger.RetryingHMSHandler.name = org.apache.hadoop.hive.metastore.RetryingHMSHandler
logger.RetryingHMSHandler.level = fatal
logger.FunctionRegistry.name = org.apache.hadoop.hive.ql.exec.FunctionRegistry
logger.FunctionRegistry.level = error
  
# For deploying Spark ThriftServer
# SPARK-34128: Suppress undesirable TTransportException warnings involved in THRIFT-4805
appender.console.filter.1.type = RegexFilter
appender.console.filter.1.regex = .*Thrift error occurred during processing of message.*
appender.console.filter.1.onMatch = deny
appender.console.filter.1.onMismatch = neutral
appender.rolling.filter.1.type = RegexFilter
appender.rolling.filter.1.regex = .*Thrift error occurred during processing of message.*
appender.rolling.filter.1.onMatch = deny
appender.rolling.filter.1.onMismatch = neutral
```
