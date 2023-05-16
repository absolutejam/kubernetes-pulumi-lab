import * as pulumi from "@pulumi/pulumi";

import { config } from "./config";
import { Gitea } from "./resources/gitea";

import { SealedSecret } from "@k8s-lab/crds.sealed-secrets/bitnami/v1alpha1";

function generateSealedSecret(args: pulumi.ResourceTransformationArgs) {
  if (args.type === "kubernetes:core/v1:Secret") {
    new SealedSecret(
      args.name,
      {
        metadata: {
          name: args.props.metadata.name,
          ...args.props.medata,
        },
        spec: {
          encryptedData: {},
          template: {
            type: args.props.type,
            metadata: args.props.metadata,
          },
        },
      },
      args.opts
    );
  }

  return undefined;
}

pulumi.runtime.registerStackTransformation(generateSealedSecret);

const gitea = new Gitea(config.gitea);
