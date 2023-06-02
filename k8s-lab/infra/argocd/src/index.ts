import * as pulumi from "@pulumi/pulumi";

import { config } from "./config";
import { ArgoCd } from "./resources/argocd";

import { generateSealedSecret } from "@k8s-lab/utils.transforms";

pulumi.runtime.registerStackTransformation(generateSealedSecret);

const argocd = new ArgoCd(config.argoCd);
