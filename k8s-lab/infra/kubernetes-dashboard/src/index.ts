import * as pulumi from "@pulumi/pulumi";

import { config } from "./config";
import { KubernetesDashboard } from "./resources/kubernetes-dashboard";

import { generateSealedSecret } from "@k8s-lab/utils.transforms";

pulumi.runtime.registerStackTransformation(generateSealedSecret);

const kubernetesDashboard = new KubernetesDashboard(config.kubernetesDashboard);
