import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as inputs from "@pulumi/kubernetes/types/input";

import { ArgoCdConfig } from "../types";
import { Namespace } from "@pulumi/kubernetes/core/v1";

import {
  ServiceEntry,
  VirtualService,
} from "@k8s-lab/crds.istio/networking/v1beta1";

export type ArgoCdOpts = {
  version?: string;
};

export class ArgoCd extends pulumi.ComponentResource {
  public namespace: Namespace;
  public argoCd: kubernetes.helm.v3.Chart;
  public virtualService: VirtualService;
  public loopBackServiceEntry: ServiceEntry;

  constructor(
    { namespace, version, labels }: ArgoCdConfig,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super("k8slab:infra:ArgoCd", "agocd", {}, opts);

    this.namespace = new kubernetes.core.v1.Namespace(
      "argocd-namespace",
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

    const volumes: inputs.core.v1.Volume[] = [
      {
        name: "ca-bundle",
        configMap: {
          name: "self-signed-bundle",
          defaultMode: 420,
          optional: false,
          items: [
            {
              key: "certs.pem",
              path: "certs.pem",
            },
          ],
        },
      },
    ];

    const volumeMounts: inputs.core.v1.VolumeMount[] = [
      {
        mountPath: "/etc/ssl/certs/self-signed-bundle.crt",
        readOnly: true,
        name: "ca-bundle",
        subPath: "certs.pem",
      },
    ];

    this.argoCd = new kubernetes.helm.v3.Chart(
      "argo",
      {
        chart: "argo-cd",
        namespace,
        version,
        repo: "argo",
        fetchOpts: {
          repo: "https://argoproj.github.io/argo-helm",
        },
        // https://github.com/argoproj/argo-helm/blob/main/charts/argo-cd/values.yaml
        values: {
          global: {
            additionalLabels: labels || {},
          },
          configs: {
            secret: {
              createSecret: true,
              // waffle123!
              argocdServerAdminPassword:
                "$2a$10$2kB2bYnkTu/WSv/x.eF7DeNV4zpvwzksiMHSa0SZNmQonYAxVMJMS",
            },
            params: {
              // Terminated by Istio
              "server.insecure": true,
              "server.basehref": "/argocd/",
            },
          },
          server: {
            volumes,
            volumeMounts,
          },
          repoServer: {
            volumes,
            volumeMounts,
          },
        },
      },
      { parent: this.namespace, dependsOn: [this.namespace] },
    );

    this.virtualService = new VirtualService(`argocd-virtualservice`, {
      metadata: {
        name: "argocd",
        namespace,
      },
      spec: {
        hosts: ["*"],
        gateways: ["istio-gateway/istio-gateway"],
        http: [
          {
            name: "http",
            match: [{ uri: { prefix: "/argocd/" } }],
            rewrite: { uri: "/" },
            route: [
              {
                destination: {
                  host: `argo-argocd-server.argocd-system.svc.cluster.local`,
                  port: { number: 80 },
                },
              },
            ],
          },
        ],
      },
    }, { parent: this.namespace });

    this.loopBackServiceEntry = new ServiceEntry(
      `argocd-loopback-service-entry`,
      {
        metadata: {
          name: "loopback",
          namespace,
        },
        spec: {
          hosts: ["k8s-lab.local"],
          resolution: "DNS",
          location: "MESH_EXTERNAL",
          endpoints: [
            {
              address: "host.k3d.internal",
              ports: {
                https: 443,
              },
            },
          ],
          ports: [
            {
              name: "https",
              number: 443,
              protocol: "HTTPS",
            },
          ],
        },
      },
      { parent: this.namespace },
    );
  }
}
