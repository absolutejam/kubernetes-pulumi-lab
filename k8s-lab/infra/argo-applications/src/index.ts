import * as pulumi from "@pulumi/pulumi";

import { config } from "./config";
import { ArgoApplications } from "./resources/argo-applications";

import {
  addVolumeClaimTemplatesKind,
  generateSealedSecret,
} from "@k8s-lab/utils.transforms";

pulumi.runtime.registerStackTransformation(generateSealedSecret);
pulumi.runtime.registerStackTransformation(addVolumeClaimTemplatesKind);

const argoApplications = new ArgoApplications(config.argoApplications);
