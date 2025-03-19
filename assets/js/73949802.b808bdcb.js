"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[3227],{50:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>c,contentTitle:()=>n,default:()=>u,frontMatter:()=>o,metadata:()=>a,toc:()=>l});var r=s(4848),i=s(8453);const o={sidebar_position:1,sidebar_label:"Introduction"},n="CloudWatch",a={id:"bestpractices/Observability/intro",title:"CloudWatch",description:"Amazon EMR automatically publishes a set of free metrics to CloudWatch every five minutes to help monitor cluster activity and health.",source:"@site/docs/bestpractices/Observability/intro.md",sourceDirName:"bestpractices/Observability",slug:"/bestpractices/Observability/intro",permalink:"/aws-emr-best-practices/docs/bestpractices/Observability/intro",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/bestpractices/Observability/intro.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1,sidebar_label:"Introduction"},sidebar:"bestpractices",previous:{title:"Best Practices",permalink:"/aws-emr-best-practices/docs/bestpractices/Features/Spot Usage/best_practices"},next:{title:"CloudWatch",permalink:"/aws-emr-best-practices/docs/bestpractices/Observability/best_practices"}},c={},l=[{value:"Cloudwatch Agent",id:"cloudwatch-agent",level:2}];function h(e){const t={h1:"h1",h2:"h2",header:"header",p:"p",strong:"strong",...(0,i.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.header,{children:(0,r.jsx)(t.h1,{id:"cloudwatch",children:"CloudWatch"})}),"\n",(0,r.jsx)(t.p,{children:"Amazon EMR automatically publishes a set of free metrics to CloudWatch every five minutes to help monitor cluster activity and health."}),"\n",(0,r.jsx)(t.h2,{id:"cloudwatch-agent",children:"Cloudwatch Agent"}),"\n",(0,r.jsx)(t.p,{children:"Starting with Amazon EMR Release 7.0, you can install the Amazon CloudWatch Agent to publish 34 additional paid metrics to CloudWatch every minute. The agent collects metrics from all nodes in the cluster, aggregates them on the primary node, and publishes the data to the cloud. You can view these metrics in the EMR console under the Monitoring tab or in the CloudWatch Console."}),"\n",(0,r.jsx)(t.p,{children:"By analyzing these metrics, you can gain valuable insights into whether your cluster could perform more efficiently with different instance families or if it\u2019s possible to reduce the cluster size without compromising performance."}),"\n",(0,r.jsx)(t.p,{children:"With Amazon EMR 7.1, you can configure the agent to send additional metrics - Hadoop, YARN and Hbase, offering deeper visibility into your cluster\u2019s performance. Also, if you are using Prometheus to monitor your enterprise metrics, you can opt to send these metrics to an Amazon Managed Service for Prometheus endpoint."}),"\n",(0,r.jsx)(t.p,{children:"CloudWatchAgent is supported on Runtime Role Clusters for EMR 7.6 and higher."}),"\n",(0,r.jsx)(t.p,{children:'You can install the agent when creating a new cluster via the console or the create-cluster API. For more details, refer to "Create an EMR cluster that uses Amazon CloudWatch agent.'}),"\n",(0,r.jsxs)(t.p,{children:[(0,r.jsx)(t.strong,{children:"Limitations of Large EMR on EC2 Clusters:"}),'\nThe CloudWatch GetMetricData API supports up to 500 metrics per request. If your EMR cluster has more than 250 nodes in an instance group or fleet, the corresponding graphs in the CloudWatch embedded dashboard in EMR will display a "Too many metrics" error and appear blank. This is because these metrics require two data points per metric in the "Cluster Overview" dashboard. However, by filtering the Core or Task Instance Group/fleet dashboards, you can view graphs for up to 500 nodes per instance group or fleet, as these dashboards don\u2019t require two data points per metric. For instance groups or fleets with more than 500 nodes, the "Too many metrics" error will also occur for the metrics in these dashboards.']}),"\n",(0,r.jsx)(t.p,{children:"In this case, we recommend using CloudWatch Metrics Insights. A single query in Metrics Insights can return up to 500 time series. If the query results exceed this limit, not all metrics will be included. However, with the ORDER BY clause, the metrics are sorted, and the top 500 metrics based on the specified criteria are returned. This approach is still useful because it can handle up to 10,000 metrics, and the ORDER BY clause allows you to control which 500 metrics are returned."}),"\n",(0,r.jsx)(t.p,{children:"The only limitation is that CloudWatch Metrics Insights currently only allows data from the last 3 hours."})]})}function u(e={}){const{wrapper:t}={...(0,i.R)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(h,{...e})}):h(e)}},8453:(e,t,s)=>{s.d(t,{R:()=>n,x:()=>a});var r=s(6540);const i={},o=r.createContext(i);function n(e){const t=r.useContext(o);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:n(e.components),r.createElement(o.Provider,{value:t},e.children)}}}]);