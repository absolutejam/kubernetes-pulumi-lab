import * as pulumi from "@pulumi/pulumi";

import { Config } from "./types";
import { SelfSignedIssuerSecretsConfigValidated } from "./types";

const pulumiConfig = new pulumi.Config();
const instance = pulumiConfig.get("instance") || pulumi.getStack();

const kubernetesConfig = new pulumi.Config("kubernetes");
const manifestsDirectory = kubernetesConfig.require("renderYamlToDirectory");

export const config = Config.parse({
  instance,
  manifestsDirectory,

  certsConfig: pulumiConfig.getObject("self-signed-issuer"),
  secrets: pulumiConfig
    .requireSecretObject("secrets")
    .apply(SelfSignedIssuerSecretsConfigValidated.parse),
} as Config);
