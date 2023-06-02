import * as pulumi from "@pulumi/pulumi";

import { Config, WoodpeckerSecretsConfigValidated } from "./types";

const pulumiConfig = new pulumi.Config();
const instance = pulumiConfig.get("instance") || pulumi.getStack();

const kubernetesConfig = new pulumi.Config("kubernetes");
const manifestsDirectory = kubernetesConfig.require("renderYamlToDirectory");

export const config = Config.parse({
  instance,
  manifestsDirectory,

  woodpecker: pulumiConfig.getObject("woodpecker"),
  woodpeckerSecrets: pulumiConfig
    .requireSecretObject("woodpecker-secrets")
    .apply(WoodpeckerSecretsConfigValidated.parse),
} as Config);
