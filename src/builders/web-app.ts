import * as kubernetes from "@pulumi/kubernetes";
import {
  ConfigMap,
  LimitRange,
  Namespace,
  ResourceQuota,
  Service,
} from "@pulumi/kubernetes/core/v1";
import { NetworkPolicy } from "@pulumi/kubernetes/networking/v1";
import { Deployment } from "@pulumi/kubernetes/apps/v1";
import { IngressRoute, Middleware } from "../crds/traefik/traefik/v1alpha1";
import { buildTraefikNetworkPolicy } from "./network-policy";

import { config } from "../config";
import { PodDisruptionBudget } from "@pulumi/kubernetes/policy/v1";
import { businessCriticalPriorityClass } from "../resources/shared/priority-class";
const {
  webAppConfig: { image, replicas },
} = config;

export type WebServiceResources = {
  namespace: Namespace;
  limitRange: LimitRange;
  networkPolicies: NetworkPolicy[];
  resourceQuota: ResourceQuota;
  podDisruptionBudget: PodDisruptionBudget;
  configMap: ConfigMap;
  deployment: Deployment;
  service: Service;
  ingressRoute: IngressRoute;
  middlewares: Middleware[];
};

export function buildWebServiceResources(
  environment: string
): WebServiceResources {
  const name = `webapp-${environment}`;

  const labels = {
    "app.kubernetes.io/tier": "app",
    "app.kubernetes.io/name": "web-app",
    "app.kubernetes.io/instance": environment,
    "app.kubernetes.io/part-of": `webapp-${environment}`,
    "app.kubernetes.io/managed-by": "pulumi",
  };

  const namespace = new kubernetes.core.v1.Namespace(`${name}-namespace`, {
    metadata: {
      name,
      labels,
    },
  });

  const limitRange = new kubernetes.core.v1.LimitRange(
    `${name}-limits`,
    {
      metadata: {
        name,
        namespace: namespace.metadata.name,
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

  const traefikNetworkPolicy = buildTraefikNetworkPolicy({
    name,
    labels,
    namespace,
  });

  const resourceQuota = new kubernetes.core.v1.ResourceQuota(
    name,
    {
      metadata: {
        name,
        namespace: namespace.metadata.name,
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
        namespace: namespace.metadata.name,
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
        namespace: namespace.metadata.name,
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

            priorityClassName: businessCriticalPriorityClass.metadata.name,

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
                  name: configMap.metadata.name,
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
                  name: configMap.metadata.name,
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
    { parent: namespace }
  );

  const service = new kubernetes.core.v1.Service(
    `${name}-service`,
    {
      metadata: {
        name,
        namespace: namespace.metadata.name,
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
    { parent: namespace, dependsOn: [deployment] }
  );

  const podDisruptionBudget = new kubernetes.policy.v1.PodDisruptionBudget(
    `${name}-pdb`,
    {
      metadata: {
        name,
        namespace: namespace.metadata.name,
        labels,
      },
      spec: {
        maxUnavailable: 1,
        selector: deployment.metadata.labels,
      },
    },
    { parent: deployment }
  );

  const middlewareName = `strip-environment-${environment}-path`;
  const stripEnvironmentPathMiddleware = new Middleware(
    `${name}-strip-environment-path`,
    {
      metadata: {
        name: middlewareName,
        namespace: namespace.metadata.name,
      },
      spec: {
        stripPrefix: { prefixes: [`/${environment}`] },
      },
    },
    { parent: namespace }
  );

  const ingressRoute = new IngressRoute(
    `${name}-ingressroute`,
    {
      metadata: {
        name,
        namespace: namespace.metadata.name,
        labels: serverLabels,
      },
      spec: {
        entryPoints: ["web"],
        routes: [
          {
            kind: "Rule",
            match: "PathPrefix(`/" + environment + "`)",
            middlewares: [
              {
                name: middlewareName,
                namespace: `webapp-${environment}`,
              },
            ],
            services: [
              {
                name: service.metadata.name,
                namespace: service.metadata.namespace,
                port: 80,
              },
            ],
          },
        ],
      },
    },
    {
      parent: namespace,
      dependsOn: [deployment, service, stripEnvironmentPathMiddleware],
    }
  );

  return {
    namespace,
    limitRange,
    networkPolicies: [traefikNetworkPolicy],
    resourceQuota,
    podDisruptionBudget,
    configMap,
    deployment,
    service,
    ingressRoute,
    middlewares: [stripEnvironmentPathMiddleware],
  };
}
