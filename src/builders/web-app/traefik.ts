import * as pulumi from "@pulumi/pulumi";

import { NetworkPolicy } from "@pulumi/kubernetes/networking/v1";
import { IngressRoute, Middleware } from "../../crds/traefik/traefik/v1alpha1";

import { WebAppResources } from "./app";
import { Traefik, traefikIngressNetworkPolicy } from "../ingress/traefik";

export type WebAppTraefikResources = {
  type: "traefik";
  ingressRoute: IngressRoute;
  middlewares: Middleware[];
};

export type WebAppTraefikRoutesOpts = {
  environment: string;
  traefik: Traefik;
} & Pick<WebAppResources, "namespace" | "deployment" | "service">;

export class WebAppTraefik
  extends pulumi.ComponentResource
  implements WebAppTraefikResources
{
  public type = "traefik" as const;
  public middlewares: Middleware[];
  public ingressRoute: IngressRoute;
  public networkPolicy: NetworkPolicy;

  constructor(
    name: string,
    {
      environment,
      namespace,
      deployment,
      service,
      traefik,
    }: WebAppTraefikRoutesOpts,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("k8slab:app:WebAppTraefikRoutes", name, {}, opts);

    const labels = service.metadata.labels;

    const stripEnvironmentPathMiddlewareName = "strip-environment-path";
    const stripEnvironmentPathMiddleware = new Middleware(
      "strip-environment-path",
      {
        metadata: {
          name: stripEnvironmentPathMiddlewareName,
          namespace: namespace.metadata.name,
        },
        spec: {
          stripPrefix: { prefixes: [`/${environment}`] },
        },
      },
      { parent: this, dependsOn: [traefik] }
    );

    this.middlewares = [stripEnvironmentPathMiddleware];

    this.ingressRoute = new IngressRoute(
      `${name}-ingressroute`,
      {
        metadata: {
          name,
          namespace: namespace.metadata.name,
          labels,
        },
        spec: {
          entryPoints: ["web"],
          routes: [
            {
              kind: "Rule",
              match: "PathPrefix(`/" + environment + "`)",
              middlewares: [
                {
                  name: stripEnvironmentPathMiddlewareName,
                  namespace: service.metadata.namespace,
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
        parent: this,
        dependsOn: [deployment, stripEnvironmentPathMiddleware, traefik],
      }
    );

    this.networkPolicy = traefikIngressNetworkPolicy({
      name,
      traefik,
      targetDeployment: deployment,
    });
  }
}
