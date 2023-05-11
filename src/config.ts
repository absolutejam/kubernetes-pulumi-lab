import * as pulumi from "@pulumi/pulumi";

import {
  Config,
  IngressConfig,
  IstioConfig,
  PrometheusStackConfig,
  CertManagerConfig,
  WebAppConfig,
  KubernetesDashboardConfig,
} from "./types";

const k8sConfig = new pulumi.Config("kubernetes");
const cluster = k8sConfig.require("cluster");

const pulumiConfig = new pulumi.Config();
const instance = pulumiConfig.get("instance") || pulumi.getStack();
const environments = pulumiConfig.requireObject<string[]>("environments");

const rawConfig: Partial<Config> = {
  cluster,
  instance,
  environments,

  istio: pulumiConfig.getObject("istio"),
  certManager: pulumiConfig.getObject("cert-manager"),
  webApp: pulumiConfig.getObject("web-app"),
  kubernetesDashboard: pulumiConfig.getObject("kubernetes-dashboard"),
  prometheusStackConfig: pulumiConfig.getObject("prometheus-stack"),
  ingress: pulumiConfig.getObject("ingress"),
};

// console.log(JSON.stringify(rawConfig, null, 2));

export const config = Config.parse(rawConfig);
