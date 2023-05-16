import { z } from "zod";

export const CertManagerConfig = z.object({
  version: z.string().optional(),
  namespace: z.string().default("cert-manager-system"),
});

export type CertManagerConfig = z.infer<typeof CertManagerConfig>;

export const TrustManagerConfig = z.object({
  version: z.string().optional(),
  namespace: z.string().default("trust-manager-system"),
});

export type TrustManagerConfig = z.infer<typeof TrustManagerConfig>;

export const SelfSignedIssuerConfig = z.object({
  namespace: z.string().default("cert-manager-system"),
  commonName: z.string().default("self-signed-root-ca"),
  secretName: z.string().default("root-secret"),
});

export type SelfSignedIssuerConfig = z.infer<typeof SelfSignedIssuerConfig>;

export const Config = z.object({
  instance: z.string(),
  manifestsDirectory: z.string(),

  certManager: CertManagerConfig.default({}),
  trustManager: TrustManagerConfig.default({}),
  selfSignedIssuer: SelfSignedIssuerConfig.default({}),
});

export type Config = z.infer<typeof Config>;
