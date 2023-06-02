import * as pulumi from "@pulumi/pulumi";

import { Config } from "./types";

const pulumiConfig = new pulumi.Config();
const instance = pulumiConfig.get("instance") || pulumi.getStack();

const kubernetesConfig = new pulumi.Config("kubernetes");
const manifestsDirectory = kubernetesConfig.require("renderYamlToDirectory");

export const config = Config.parse({
  instance,
  manifestsDirectory,

  certManager: pulumiConfig.getObject("cert-manager"),
} as Config);
