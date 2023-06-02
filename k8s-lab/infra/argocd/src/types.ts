import { z } from "zod";
import { LabelsFromJsonString } from "@k8s-lab/utils.zod-types";

export const ArgoCdConfig = z.object({
  version: z.string().optional(),
  namespace: z.string().default("argocd-system"),
  labels: LabelsFromJsonString,
});

export type ArgoCdConfig = z.infer<typeof ArgoCdConfig>;

export const Config = z.object({
  instance: z.string(),
  manifestsDirectory: z.string(),

  argoCd: ArgoCdConfig.default({}),
});

export type Config = z.infer<typeof Config>;
