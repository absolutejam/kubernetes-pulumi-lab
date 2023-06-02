import * as pulumi from "@pulumi/pulumi";

import { config } from "./config";
import { Reflector } from "./resources/reflector";

import { generateSealedSecret } from "@k8s-lab/utils.transforms";

pulumi.runtime.registerStackTransformation(generateSealedSecret);

const gitea = new Reflector(config.reflector);
