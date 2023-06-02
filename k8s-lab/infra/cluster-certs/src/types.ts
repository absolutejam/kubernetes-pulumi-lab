import { z } from "zod";
import * as pulumi from "@pulumi/pulumi";

export const SelfSignedIssuerConfig = z.object({
  namespace: z.string().default("cert-manager-system"),

  rootCertName: z.string().default("root-cert"),
  rootCaName: z.string().default("root-ca-name"),
  selfSignedCaName: z.string().default("self-signed-ca"),
  selfSignedBundleName: z.string().default("self-signed-bundle"),
});

export type SelfSignedIssuerConfig = z.infer<typeof SelfSignedIssuerConfig>;

export const SelfSignedIssuerSecretsConfigValidated = z.object({
  caCert: z.string(),
  caKey: z.string(),
});

export type SelfSignedIssuerSecretsConfigValidated = z.infer<
  typeof SelfSignedIssuerSecretsConfigValidated
>;

const SelfSignedIssuerSecretsConfig: z.ZodType<
  pulumi.Output<SelfSignedIssuerSecretsConfigValidated>
> = z.any();

export type SelfSignedIssuerSecretsConfig = z.infer<
  typeof SelfSignedIssuerSecretsConfig
>;

export const Config = z.object({
  instance: z.string(),
  manifestsDirectory: z.string(),

  certsConfig: SelfSignedIssuerConfig.default({}),
  secrets: SelfSignedIssuerSecretsConfig,
});

export type Config = z.infer<typeof Config>;
