import * as pulumi from "@pulumi/pulumi";

import { config } from "./config";
import { ingress, kubernetesDashboard, webApps } from "./resources";
import { withIngress } from "./builders/ingress";

export const ingressDetails = withIngress(ingress, {
  istio: (istio) => {
    return {};
  },
  traefik: (traefik) => {
    return {
      namespace: traefik.namespace,
    };
  },
});

// This is not pretty!
export const webAppRoutes = webApps.flatMap(({ networkResources }) => {
  const routes: pulumi.Output<string[]> = withIngress(networkResources, {
    traefik: (traefik): pulumi.Output<string[]> => {
      const routes = traefik.ingressRoute.spec.routes.apply((r) =>
        r.flatMap((r) => r.match)
      );
      return routes ?? pulumi.Output.create([]);
    },

    istio: (istio): pulumi.Output<string[]> => {
      const routes = istio.virtualService.spec.apply(
        (r) =>
          r?.http?.flatMap((http) => http.match?.flatMap((m) => m.uri) ?? []) ??
          []
      );
      return routes ?? pulumi.Output.create([]);
    },
  });

  return routes;
}).flat;

export const cluster = config.cluster;
export const dashboardToken = kubernetesDashboard
  ? pulumi.unsecret(
      kubernetesDashboard.tokenSecret.data.apply(({ token }) =>
        Buffer.from(token, "base64").toString("utf-8")
      )
    )
  : undefined;
