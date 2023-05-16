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
import { Ingress, withIngress } from "../../resources/cert-manager/ingress";
import { PriorityClass } from "@pulumi/kubernetes/scheduling/v1";
import { IstioRoutes } from "../routes";

const {
  webApp: { image, replicas },
} = config;

type WebAppOpts = {
  environment: string;
  ingress: Ingress;
  priorityClass?: PriorityClass;
};

export interface WebAppResources {
  environment: string;
  namespace: string;
  service: string;
}

export class WebApp
  extends pulumi.ComponentResource
  implements WebAppResources
{
  public environment: string;
  public namespace: string;
  public service: string;

  constructor(
    name: string,
    { environment, ingress, priorityClass }: WebAppOpts,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("k8slab:app:WebApp", name, {}, opts);

    const fullName = `web-app-${environment}`

    this.environment = environment;
    this.namespace = fullName;

    const labels = {
      "app.kubernetes.io/tier": "app",
      "app.kubernetes.io/name": "web-app",
      "app.kubernetes.io/instance": environment,
      "app.kubernetes.io/part-of": name,
      "app.kubernetes.io/managed-by": "pulumi",
    };

    const namespace = new kubernetes.core.v1.Namespace(
      `${name}-namespace`,
      {
        metadata: {
          name: this.namespace,
          labels,
        },
      },
      { parent: this }
    );

    const limitRange = new kubernetes.core.v1.LimitRange(
      `${name}-limits`,
      {
        metadata: {
          name,
          namespace: this.namespace,
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
      { parent: namespace }
    );

    const resourceQuota = new kubernetes.core.v1.ResourceQuota(
      `${name}-resource-quota`,
      {
        metadata: {
          name,
          namespace: this.namespace,
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
      { parent: namespace }
    );

    const configMap = new kubernetes.core.v1.ConfigMap(
      `${name}-config`,
      {
        metadata: {
          name,
          namespace: this.namespace,
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
      { parent: namespace }
    );

    const serverLabels = {
      ...labels,
      "app.kubernetes.io/component": "server",
    };

    const deployment = new kubernetes.apps.v1.Deployment(
      `${name}-deployment`,
      {
        metadata: {
          name,
          namespace: this.namespace,
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

    const destinations = [
      {
        name: environment,
        host: environment,
        prefix: `/${environment}`,
        port: 80,
      },
    ];

    });
  }
}
