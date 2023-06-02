import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { WoodpeckerConfig, WoodpeckerSecretsConfig } from "../types";
import { Namespace } from "@pulumi/kubernetes/core/v1";
import { VirtualService } from "@k8s-lab/crds.istio/networking/v1beta1";

export type WoodpeckerOpts = {
  woodpecker: WoodpeckerConfig;
  secrets: WoodpeckerSecretsConfig;
};

const toB64 = (x: string) => Buffer.from(x, "utf-8").toString("base64");

export class Woodpecker extends pulumi.ComponentResource {
  public namespace: Namespace;
  public secret: kubernetes.core.v1.Secret;
  public woodpecker: kubernetes.helm.v3.Chart;
  public virtualService: VirtualService;

  constructor(
    { woodpecker: { namespace, version, giteaUrl }, secrets }: WoodpeckerOpts,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    const name = "woodpecker";

    super("k8slab:infra:Woodpecker", name, {}, opts);

    this.namespace = new kubernetes.core.v1.Namespace(
      "woodpecker-namespace",
      {
        metadata: {
          name: namespace,
          labels: {
            "istio-injection": "enabled",
          },
        },
      },
      { parent: this },
    );

    this.secret = new kubernetes.core.v1.Secret(
      "woodpecker-secrets",
      {
        metadata: {
          name: "woodpecker-secret",
          namespace,
        },
        data: {
          WOODPECKER_AGENT_SECRET: secrets.agent.apply(toB64),

          WOODPECKER_GITEA_URL: toB64(giteaUrl),
          WOODPECKER_GITEA_SECRET: secrets.giteaSecret.apply(toB64),
          WOODPECKER_GITEA_CLIENT: secrets.giteaClient.apply(toB64),
        },
      },
      { parent: this.namespace },
    );

    this.woodpecker = new kubernetes.helm.v3.Chart(
      name,
      {
        chart: "woodpecker",
        namespace,
        version,
        repo: "woodpecker",
        fetchOpts: {
          repo: "https://woodpecker-ci.org/",
        },
        // https://github.com/woodpecker-ci/helm/blob/main/values.yaml
        values: {
          server: {
            enabled: true,
            image: {
              tag: "pull_1783",
            },

            extraSecretNamesForEnvFrom: ["woodpecker-secret"],

            env: {
              WOODPECKER_HOST: "https://k8s-lab.local",
              WOODPECKER_ROOT_URL: "/woodpecker",
              WOODPECKER_GITEA: true,
            },
          },
          agent: {
            enabled: true,
            replicaCount: 2,

            extraSecretNamesForEnvFrom: ["woodpecker-secret"],

            env: {
              WOODPECKER_SERVER:
                `woodpecker-server.${namespace}.svc.cluster.local:9000`,
              WOODPECKER_BACKEND_K8S_NAMESPACE: namespace,
              WOODPECKER_BACKEND_K8S_STORAGE_CLASS: "",
              WOODPECKER_BACKEND_K8S_VOLUME_SIZE: "10G",
              WOODPECKER_BACKEND_K8S_STORAGE_RWX: true,
              WOODPECKER_BACKEND_K8S_POD_LABELS: "",
              WOODPECKER_BACKEND_K8S_POD_ANNOTATIONS: "",
            },
          },
        },
      },
      {
        parent: this.namespace,
        dependsOn: [this.namespace],
      },
    );

    this.virtualService = new VirtualService(
      `${name}-virtualservice`,
      {
        metadata: {
          name,
          namespace,
        },
        spec: {
          hosts: ["*"],
          gateways: ["istio-gateway/istio-gateway"],
          http: [
            {
              name: "http",
              match: [{ uri: { prefix: "/woodpecker/" } }],
              rewrite: { uri: "/" },
              route: [
                {
                  destination: {
                    host: `woodpecker-server.woodpecker.svc.cluster.local`,
                    port: { number: 80 },
                  },
                },
              ],
            },
          ],
        },
      },
      { parent: this.namespace },
    );
  }
}
