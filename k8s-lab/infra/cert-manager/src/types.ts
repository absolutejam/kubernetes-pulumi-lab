import { z } from "zod";
import * as pulumi from "@pulumi/pulumi";

export const CertManagerConfig = z.object({
  version: z.string().optional(),
  namespace: z.string().default("cert-manager-system"),
});

export type CertManagerConfig = z.infer<typeof CertManagerConfig>;

export const Config = z.object({
  instance: z.string(),
  manifestsDirectory: z.string(),

  certManager: CertManagerConfig.default({}),
});

export type Config = z.infer<typeof Config>;
