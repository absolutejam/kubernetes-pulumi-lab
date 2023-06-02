import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import {
  Certificate,
  ClusterIssuer,
  Issuer,
} from "@k8s-lab/crds.cert-manager/certmanager/v1";
import { Bundle } from "@k8s-lab/crds.cert-manager/trust/v1alpha1";

import {
  SelfSignedIssuerConfig,
  SelfSignedIssuerSecretsConfig,
} from "../types";

type SelfSignedIssuerOpts = {
  certsConfig: SelfSignedIssuerConfig;
  secrets: SelfSignedIssuerSecretsConfig;
};

export class SelfSignedIssuer extends pulumi.ComponentResource {
  public rootCertSecret: kubernetes.core.v1.Secret;
  public caCert: Certificate;
  public rootIssuer: Issuer;
  public caIssuer: ClusterIssuer;
  public bundle: Bundle;

  constructor(
    {
      certsConfig: {
        namespace,
        selfSignedCaName,
        rootCertName,
        rootCaName,
        selfSignedBundleName,
      },
      secrets,
    }: SelfSignedIssuerOpts,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    const name = "cluster-certs";

    super("k8slab:infra:ClusterCerts", name, {}, opts);

    this.rootCertSecret = new kubernetes.core.v1.Secret(
      "root-cert",
      {
        metadata: {
          name: rootCertName,
          namespace,
        },
        data: {
          ["tls.crt"]: secrets.caCert.apply((x) =>
            Buffer.from(x, "utf-8").toString("base64")
          ),
          ["tls.key"]: secrets.caKey.apply((x) =>
            Buffer.from(x, "utf-8").toString("base64")
          ),
        },
      },
      { parent: this },
    );

    this.rootIssuer = new Issuer(
      "root-ca",
      {
        metadata: {
          name: rootCaName,
          namespace,
        },
        spec: {
          ca: {
            secretName: rootCertName,
          },
        },
      },
      { parent: this },
    );

    this.caCert = new Certificate(
      "self-signed-ca",
      {
        metadata: {
          name: selfSignedCaName,
          namespace,
        },
        spec: {
          secretTemplate: {
            annotations: {
              "reflector.v1.k8s.emberstack.com/reflection-allowed": "true",
              "reflector.v1.k8s.emberstack.com/reflection-auto-enabled": "true",
              "reflector.v1.k8s.emberstack.com/reflection-allowed-namespaces":
                "trust-manager-system",
              "reflector.v1.k8s.emberstack.com/reflection-auto-namespaces":
                "trust-manager-system",
            },
          },
          isCA: true,
          commonName: selfSignedCaName,
          secretName: selfSignedCaName,
          privateKey: {
            algorithm: "ECDSA",
            size: 256,
          },
          issuerRef: {
            kind: "Issuer",
            name: rootCaName,
            group: "cert-manager.io",
          },
        },
      },
      { parent: this },
    );

    this.caIssuer = new ClusterIssuer(
      "self-signed-ca",
      {
        metadata: {
          name: selfSignedCaName,

          namespace,
        },
        spec: {
          ca: {
            secretName: selfSignedCaName,
          },
        },
      },
      { parent: this },
    );

    this.bundle = new Bundle(
      "self-signed-bundle",
      {
        metadata: {
          name: selfSignedBundleName,
          namespace,
        },
        spec: {
          sources: [
            { useDefaultCAs: true },
            {
              secret: {
                name: selfSignedCaName,
                key: "ca.crt",
              },
            },
            {
              secret: {
                name: selfSignedCaName,
                key: "tls.crt",
              },
            },
          ],
          target: {
            configMap: {
              key: "certs.pem",
            },
            namespaceSelector: {
              matchLabels: {
                "istio-injection": "enabled",
              },
            },
          },
        },
      },
      { parent: this },
    );
  }
}
