import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import {
  ConfigMap,
  LimitRange,
  Namespace,
  ResourceQuota,
  Service,
} from "@pulumi/kubernetes/core/v1";
import { Deployment } from "@pulumi/kubernetes/apps/v1";

import { config } from "../../config";

import { PodDisruptionBudget } from "@pulumi/kubernetes/policy/v1";
import { Ingress, withIngress } from "../ingress";
import { WebAppTraefik } from "./traefik";
import { WebAppIstio } from "./istio";
import { PriorityClass } from "@pulumi/kubernetes/scheduling/v1";

const {
  webApp: { image, replicas },
} = config;

type WebAppOpts = {
  environment: string;
  ingress: Ingress;
  priorityClass?: PriorityClass;
};

export interface WebAppResources {
  namespace: Namespace;
  limitRange: LimitRange;
  resourceQuota: ResourceQuota;
  podDisruptionBudget: PodDisruptionBudget;
  configMap: ConfigMap;
  deployment: Deployment;
  service: Service;
  networkResources: WebAppIstio | WebAppTraefik;
}

export class WebApp
  extends pulumi.ComponentResource
  implements WebAppResources
{
  public environment: string;
  public namespace: Namespace;
  public limitRange: LimitRange;
  public resourceQuota: ResourceQuota;
  public podDisruptionBudget: PodDisruptionBudget;
  public configMap: ConfigMap;
  public deployment: Deployment;
  public service: Service;
  public networkResources: WebAppIstio | WebAppTraefik;

  constructor(
    resourceName: string,
    { environment, ingress, priorityClass }: WebAppOpts,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const name = `${resourceName}-${environment}`;

    super("k8slab:app:WebApp", name, {}, opts);

    this.environment = environment;

    const labels = {
      "app.kubernetes.io/tier": "app",
      "app.kubernetes.io/name": resourceName,
      "app.kubernetes.io/instance": environment,
      "app.kubernetes.io/part-of": name,
      "app.kubernetes.io/managed-by": "pulumi",
    };

    this.namespace = new kubernetes.core.v1.Namespace(
      `${name}-namespace`,
      {
        metadata: {
          name,
          labels,
        },
      },
      { parent: this }
    );

    this.limitRange = new kubernetes.core.v1.LimitRange(
      `${name}-limits`,
      {
        metadata: {
          name,
          namespace: this.namespace.metadata.name,
          labels,
        },
        spec: {
          limits: [
            {
              type: "Container",
              default: {
                cpu: "1",
                memory: "500Mi",
              },
              defaultRequest: {
                cpu: "100m",
                memory: "200Mi",
              },
              max: {
                cpu: "1",
                memory: "500Mi",
              },
              min: {
                cpu: "100m",
                memory: "200Mi",
              },
            },
          ],
        },
      },
      { parent: this.namespace }
    );

    this.resourceQuota = new kubernetes.core.v1.ResourceQuota(
      name,
      {
        metadata: {
          name,
          namespace: this.namespace.metadata.name,
        },
        spec: {
          hard: {
            "requests.cpu": "2",
            "requests.memory": "2Gi",
            "limits.cpu": "4",
            "limits.memory": "2Gi",
          },
        },
      },
      { parent: this.namespace }
    );

    this.configMap = new kubernetes.core.v1.ConfigMap(
      `${name}-config`,
      {
        metadata: {
          name,
          namespace: this.namespace.metadata.name,
          labels,
        },
        data: {
          "nginx.conf": `
  events { }

  http {
      server {
          listen 80;
          root /usr/share/nginx/html;
          index index.html index.htm index.nginx - debian.html
          server_name _;
          location / {
              try_files $uri $uri/ =404;
              ssi on;
          }
      }
  }
  `,
          "index.html": `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${environment}</title>
  </head>
  <body>

  <h1>Welcome to ${environment}</h1>

  <!--# echo var="hostname" default="unknown_host" -->
      
  </body>
  </html>
  `,
        },
      },
      { parent: this.namespace }
    );

    const serverLabels = {
      ...labels,
      "app.kubernetes.io/component": "server",
    };

    this.deployment = new kubernetes.apps.v1.Deployment(
      `${name}-deployment`,
      {
        metadata: {
          name,
          namespace: this.namespace.metadata.name,
          labels: serverLabels,
        },
        spec: {
          replicas,
          selector: { matchLabels: serverLabels },
          strategy: {
            type: "RollingUpdate",
            rollingUpdate: {
              maxSurge: 1,
            },
          },
          template: {
            metadata: { labels: serverLabels },
            spec: {
              terminationGracePeriodSeconds: 60,

              priorityClassName: priorityClass?.metadata.name,

              affinity: {
                podAntiAffinity: {
                  preferredDuringSchedulingIgnoredDuringExecution: [
                    {
                      weight: 100,
                      podAffinityTerm: {
                        topologyKey: "kubernetes.io/hostname",
                        labelSelector: {
                          matchLabels: labels,
                        },
                      },
                    },
                  ],
                },
              },

              containers: [
                {
                  name: "nginx",
                  image,
                  volumeMounts: [
                    {
                      name: "nginx-conf",
                      readOnly: true,
                      subPath: "nginx.conf",
                      mountPath: "/etc/nginx/nginx.conf",
                    },

                    {
                      name: "index-html",
                      readOnly: true,
                      subPath: "index.html",
                      mountPath: "/usr/share/nginx/html/index.html",
                    },
                  ],
                  ports: [
                    {
                      name: "http",
                      containerPort: 80,
                      protocol: "TCP",
                    },
                  ],
                },
              ],
              volumes: [
                {
                  name: "nginx-conf",
                  configMap: {
                    name: this.configMap.metadata.name,
                    items: [
                      {
                        key: "nginx.conf",
                        path: "nginx.conf",
                      },
                    ],
                  },
                },
                {
                  name: "index-html",
                  configMap: {
                    name: this.configMap.metadata.name,
                    items: [
                      {
                        key: "index.html",
                        path: "index.html",
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
      { parent: this.namespace }
    );

    this.service = new kubernetes.core.v1.Service(
      `${name}-service`,
      {
        metadata: {
          name,
          namespace: this.namespace.metadata.name,
          labels: serverLabels,
        },
        spec: {
          selector: serverLabels,
          ports: [
            {
              port: 80,
              targetPort: 80,
              protocol: "TCP",
            },
          ],
        },
      },
      { parent: this.namespace, dependsOn: [this.deployment] }
    );

    this.podDisruptionBudget = new kubernetes.policy.v1.PodDisruptionBudget(
      `${name}-pdb`,
      {
        metadata: {
          name,
          namespace: this.namespace.metadata.name,
          labels,
        },
        spec: {
          maxUnavailable: 1,
          selector: this.deployment.metadata.labels,
        },
      },
      { parent: this.deployment }
    );

    this.networkResources = withIngress(ingress, {
      traefik: (traefik) =>
        new WebAppTraefik(name, { traefik, ...this }, { parent: this }),

      istio: (istio) =>
        new WebAppIstio(name, { istio, ...this }, { parent: this }),
    });
  }
}
