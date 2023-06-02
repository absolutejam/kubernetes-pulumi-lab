import * as pulumi from "@pulumi/pulumi";

import { config } from "./config";
import { KubePrometheusStack } from "./resources/kube-prometheus-stack";

import {
  addVolumeClaimTemplatesKind,
  generateSealedSecret,
} from "@k8s-lab/utils.transforms";

pulumi.runtime.registerStackTransformation(generateSealedSecret);
pulumi.runtime.registerStackTransformation(addVolumeClaimTemplatesKind);

const kubePrometheusStack = new KubePrometheusStack(config.kubePrometheusStack);
