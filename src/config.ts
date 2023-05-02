import * as pulumi from "@pulumi/pulumi";

import { Config, WebAppConfig } from "./types";

const k8sConfig = new pulumi.Config("kubernetes");
const cluster = k8sConfig.require("cluster");

const pulumiConfig = new pulumi.Config();
const instance = pulumiConfig.get("instance") || pulumi.getStack();
const environments = pulumiConfig.requireObject<string[]>("environments");

export const config = Config.parse({
  cluster,
  instance,
  environments,

  traefik: {
    namespace: "kube-system",
    labels: {
      "app.kubernetes.io/name": "traefik",
      "app.kubernetes.io/instance": "traefik",
    },
  },

  webAppConfig: pulumiConfig.requireObject<WebAppConfig>("web-app"),
} as Config);
