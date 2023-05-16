import * as pulumi from "@pulumi/pulumi";
import {
  Certificate,
  ClusterIssuer,
} from "../../crds/cert-manager/certmanager/v1";

import { SelfSignedIssuerConfig } from "../../types";

export class CertManagerSelfSignedClusterIssuer extends pulumi.ComponentResource {
  public rootCa: Certificate;
  public issuer: ClusterIssuer;
  public clusterIssuer: ClusterIssuer;

  constructor(
    { namespace, commonName, secretName }: SelfSignedIssuerConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const name = "self-signed";
    super("k8slab:infra:CertManagerSelfSignedClusterIssuer", name, {}, opts);

    const selfSignedIssuerName = "self-signed-issuer";

    this.issuer = new ClusterIssuer(
      "self-signed-issuer",
      {
        metadata: {
          name: `${name}-issuer`,
          namespace,
        },
        spec: {
          selfSigned: {},
        },
      },
      { parent: this }
    );

    this.rootCa = new Certificate(
      "self-signed-root-ca",
      {
        metadata: {
          name: `${name}-root-ca`,
          namespace,
        },
        spec: {
          isCA: true,
          commonName,
          secretName,
          privateKey: {
            algorithm: "ECDSA",
            size: 256,
          },
          issuerRef: {
            kind: "ClusterIssuer",
            name: selfSignedIssuerName,
            group: "cert-manager.io",
          },
        },
      },
      { parent: this, dependsOn: [this.issuer] }
    );

    this.clusterIssuer = new ClusterIssuer(
      "ca-issuer",
      {
        metadata: {
          name: "ca-issuer",
          namespace,
        },
        spec: {
          ca: {
            secretName: this.rootCa.spec.secretName,
          },
        },
      },
      { parent: this, dependsOn: [this.issuer, this.rootCa] }
    );
  }
}
