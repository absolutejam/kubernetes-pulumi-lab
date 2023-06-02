import * as pulumi from "@pulumi/pulumi";

import { config } from "./config";
import { Gitea } from "./resources/gitea";

import {
  generateSealedSecret,
  addVolumeClaimTemplatesKind,
} from "@k8s-lab/utils.transforms";

pulumi.runtime.registerStackTransformation(generateSealedSecret);
pulumi.runtime.registerStackTransformation(addVolumeClaimTemplatesKind);

const gitea = new Gitea(config.gitea);
