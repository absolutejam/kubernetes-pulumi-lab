import * as pulumi from "@pulumi/pulumi";

import { SealedSecret } from "@k8s-lab/crds.sealed-secrets/bitnami/v1alpha1";

export function generateSealedSecret(args: pulumi.ResourceTransformationArgs) {
  if (args.type === "kubernetes:core/v1:Secret") {
    new SealedSecret(
      args.name,
      {
        metadata: {
          name: args.props.metadata.name,
          ...args.props.metadata,
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

export function addVolumeClaimTemplatesKind(
  args: pulumi.ResourceTransformationArgs
) {
  if (args.type === "kubernetes:apps/v1:StatefulSet") {
    const volumeClaimTemplates = args.props.spec?.volumeClaimTemplates;

    if (volumeClaimTemplates === undefined) {
      return undefined;
    }

    args.props.spec.volumeClaimTemplates = volumeClaimTemplates.map(
      (template: any) => {
        template.apiVersion = "v1";
        template.kind = "PersistentVolumeClaim";
        return template;
      }
    );
  }

  return undefined;
}
