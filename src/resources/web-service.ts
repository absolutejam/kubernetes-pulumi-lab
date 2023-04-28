import * as kubernetes from "@pulumi/kubernetes";
import { ConfigMap, Namespace, Service } from "@pulumi/kubernetes/core/v1";
import { Deployment } from "@pulumi/kubernetes/apps/v1";
import { IngressRoute, Middleware } from "../crds/traefik/traefik/v1alpha1"

import { config } from "../config"
const { webAppConfig: { image, replicas } } = config

export type WebServiceResources = {
    namespace: Namespace,
    configMap: ConfigMap,
    deployment: Deployment,
    service: Service,
    ingressRoute: IngressRoute,
    middlewares: Middleware[],
}

export function buildWebServiceResources(environment: string): WebServiceResources {
    const labels = {
        "app.kubernetes.io/name": "web-app",
        "app.kubernetes.io/instance": environment,
        "app.kubernetes.io/part-of": `webapp-${environment}`,
        "app.kubernetes.io/managed-by": "pulumi",
    }

    const namespace = new kubernetes.core.v1.Namespace(`webapp-${environment}-namespace`, {
        metadata: {
            name: `webapp-${environment}`,
            labels,
        }
    });

    const configMap = new kubernetes.core.v1.ConfigMap(`webapp-${environment}-config`, {
        metadata: {
            name: `webapp-${environment}`,
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
    
</body>
</html>
`,
        },
    }, { parent: namespace });

    const serverLabels = {
        ...labels,
        "app.kubernetes.io/component": "server",
    }

    const deployment = new kubernetes.apps.v1.Deployment(`webapp-${environment}-deployment`, {
        metadata: {
            name: `webapp-${environment}`,
            namespace: namespace.metadata.name,
            labels: serverLabels,
        },
        spec: {
            selector: { matchLabels: serverLabels },
            replicas,
            template: {
                metadata: { labels: serverLabels },
                spec: {
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
                                }
                            ],
                            ports: [
                                {
                                    name: 'http',
                                    containerPort: 80,
                                    protocol: 'TCP',
                                },
                            ]
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
                                    }
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
                                    }
                                ],
                            },
                        },
                    ],
                },
            },
        },
    }, { parent: namespace });

    const service = new kubernetes.core.v1.Service(`webapp-${environment}-service`, {
        metadata: {
            name: `webapp-${environment}`,
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
    }, { parent: namespace, dependsOn: [deployment] });

    const middlewareName = `webapp-${environment}`
    const stripEnvironmentPathMiddleware = new Middleware(`webapp-${environment}-strip-environment-path`, {
        metadata: {
            name: middlewareName,
            namespace: namespace.metadata.name,
        },
        spec: {
            stripPrefix: { prefixes: [`/${environment}`] }
        }
    }, { parent: namespace })

    const ingressRoute = new IngressRoute(`webapp-${environment}-ingressroute`, {
        metadata: {
            name: `webapp-${environment}`,
            namespace: namespace.metadata.name,
            labels: serverLabels,
        },
        spec: {
            entryPoints: ['web'],
            routes: [
                {
                    kind: 'Rule',
                    match: 'PathPrefix(`/' + environment + '`)',
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
            ]
        }
    }, { parent: namespace, dependsOn: [deployment, service, stripEnvironmentPathMiddleware] })

    return { namespace, configMap, deployment, service, ingressRoute, middlewares: [stripEnvironmentPathMiddleware] }
}