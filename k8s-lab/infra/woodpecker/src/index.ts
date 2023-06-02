import * as pulumi from "@pulumi/pulumi";

import { config } from "./config";
import { Woodpecker } from "./resources/woodpecker";

import {
  generateSealedSecret,
  addVolumeClaimTemplatesKind,
} from "@k8s-lab/utils.transforms";

pulumi.runtime.registerStackTransformation(generateSealedSecret);
pulumi.runtime.registerStackTransformation(addVolumeClaimTemplatesKind);

const woodpecker = new Woodpecker({
  woodpecker: config.woodpecker,
  secrets: config.woodpeckerSecrets,
});
