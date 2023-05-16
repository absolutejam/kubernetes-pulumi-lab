import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { GiteaConfig } from "../types";
import { Namespace } from "@pulumi/kubernetes/core/v1";
import { VirtualService } from "@k8s-lab/crds.istio/networking/v1beta1";

export class Gitea extends pulumi.ComponentResource {
  public namespace: Namespace;
  public gitea: kubernetes.helm.v3.Chart;
  public adminSecret: kubernetes.core.v1.Secret;
  public virtualService: VirtualService;

  constructor(
    { namespace, version, adminCredentials, postgresConfig }: GiteaConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const name = "gitea";

    super("k8slab:infra:Gitea", name, {}, opts);

    this.namespace = new kubernetes.core.v1.Namespace(
      "gitea-namespace",
      {
        metadata: { name: namespace },
      },
      { parent: this }
    );

    this.adminSecret = new kubernetes.core.v1.Secret(
      "gitea-admin-secret",
      {
        metadata: {
          name: "gitea-admin-secret",
          namespace,
        },
        stringData: adminCredentials,
      },
      { parent: this }
    );

    this.gitea = new kubernetes.helm.v3.Chart(
      "gitea",
      {
        chart: "gitea",
        namespace,
        version,
        repo: "gitea",
        fetchOpts: {
          repo: "https://dl.gitea.io/charts/",
        },
        // https://docs.gitea.io/en-us/administration/config-cheat-sheet/
        values: {
          gitea: {
            config: {
              APP_NAME: "k8s-lab git",
              server: {
                DOMAIN: "k8s-lab.local",
                ROOT_URL: "http://k8s-lab.local:8090/gitea/",
                STATIC_URL_PREFIX: "http://k8s-lab.local:8090/gitea/",
              },
            },
            admin: { existingSecret: "gitea-admin-secret" },
          },
          database: {
            db_type: "postgres",
          },
          cache: {
            enabled: true,
            adapter: "memory",
          },
          metrics: {
            enabled: true,
          },
          postgresql: {
            global: {
              postgresql: {
                auth: postgresConfig,
              },
            },
          },
        },
      },
      {
        parent: this.namespace,
        dependsOn: [this.namespace],
      }
    );

    this.virtualService = new VirtualService(`${name}-virtualservice`, {
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
            match: [{ uri: { prefix: "/gitea/" } }],
            rewrite: { uri: "/" },
            route: [
              {
                destination: {
                  host: `gitea-http.gitea.svc.cluster.local`,
                  port: { number: 3000 },
                },
              },
            ],
          },
        ],
        tcp: [
          {
            match: [{ port: 22 }],
            route: [
              {
                destination: {
                  host: "gitea-ssh.gitea.svc.cluster.local",
                  port: { number: 22 },
                },
              },
            ],
          },
        ],
      },
    });
  }
}
