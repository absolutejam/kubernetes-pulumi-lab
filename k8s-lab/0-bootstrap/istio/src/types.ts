import { z } from "zod";
import { LabelsFromJsonString } from "@k8s-lab/utils.zod-types";

export const IstioConfig = z.object({
  version: z.string().optional(),
  install: z.boolean().default(true),
  namespace: z.string().default("istio-system"),
  labels: LabelsFromJsonString,
});

export type IstioConfig = z.infer<typeof IstioConfig>;

export const Config = z.object({
  instance: z.string(),
  manifestsDirectory: z.string(),

  istio: IstioConfig.default({}),
});

export type Config = z.infer<typeof Config>;
