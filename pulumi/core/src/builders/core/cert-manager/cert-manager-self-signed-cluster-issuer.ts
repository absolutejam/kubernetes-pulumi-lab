import * as pulumi from "@pulumi/pulumi";
import {
  Certificate,
  ClusterIssuer,
} from "../../crds/cert-manager/certmanager/v1";

export type CertManagerSelfSignedIssuerOpts = {
  name?: string;
  namespace: string;
  commonName?: string;
  secretName?: string;
};

export type CertManagerSelfSignedClusterIssuerResources = {
  rootCa: Certificate;
  issuer: ClusterIssuer;
  clusterIssuer: ClusterIssuer;
};

export class CertManagerSelfSignedClusterIssuer
  extends pulumi.ComponentResource
  implements CertManagerSelfSignedClusterIssuerResources
{
  public rootCa: Certificate;
  public issuer: ClusterIssuer;
  public clusterIssuer: ClusterIssuer;

  constructor(
    {
      namespace,
      name = "self-signed",
      commonName = "self-signed-root-ca",
      secretName = "root-secret",
    }: CertManagerSelfSignedIssuerOpts,
    opts?: pulumi.ComponentResourceOptions
  ) {
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
