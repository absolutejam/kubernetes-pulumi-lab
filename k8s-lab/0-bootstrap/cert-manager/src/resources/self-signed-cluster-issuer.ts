import * as pulumi from "@pulumi/pulumi";
import {
  Certificate,
  ClusterIssuer,
} from "@k8s-lab/crds.cert-manager/certmanager/v1";

import { SelfSignedIssuerConfig } from "../types";

export class SelfSignedClusterIssuer extends pulumi.ComponentResource {
  public rootIssuer: ClusterIssuer;
  public rootCa: Certificate;
  public caIssuer: ClusterIssuer;

  constructor(
    { namespace, commonName, secretName }: SelfSignedIssuerConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const name = "self-signed";

    super("k8slab:infra:SelfSignedClusterIssuer", name, {}, opts);

    this.rootIssuer = new ClusterIssuer(
      "self-signed-issuer",
      {
        metadata: {
          name: "self-signed-issuer",
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
          name: `self-signed-root-ca`,
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
            name: "self-signed-issuer",
            group: "cert-manager.io",
          },
        },
      },
      { parent: this, dependsOn: [this.rootIssuer] }
    );

    this.caIssuer = new ClusterIssuer(
      "ca-issuer",
      {
        metadata: {
          name: "ca-issuer",
          namespace,
        },
        spec: {
          ca: { secretName },
        },
      },
      { parent: this, dependsOn: [this.rootIssuer, this.rootCa] }
    );
  }
}
