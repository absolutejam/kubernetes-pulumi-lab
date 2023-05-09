import * as pulumi from "@pulumi/pulumi";

import { Config, IngressConfig, WebAppConfig } from "./types";

const k8sConfig = new pulumi.Config("kubernetes");
const cluster = k8sConfig.require("cluster");

const pulumiConfig = new pulumi.Config();
const instance = pulumiConfig.get("instance") || pulumi.getStack();
const environments = pulumiConfig.requireObject<string[]>("environments");

export const config = Config.parse({
  cluster,
  instance,
  environments,

  ingress: pulumiConfig.requireObject("ingress"),
  webApp: pulumiConfig.requireObject("web-app"),
  kubernetesDashboard: pulumiConfig.getObject("kubernetes-dashboard")
} as Config);
