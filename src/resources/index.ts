import { config } from "../config";

import { WebApp } from "../builders/web-app";
import { PrometheusStack } from "../builders/observability";
import { PriorityClasses } from "../builders/shared/priority-classes";
import { withIngress, Istio, Traefik } from "../builders/ingress";
import { KubernetesDashboard } from "../builders/shared/kubernetes-dashboard";

const priorityClasses = new PriorityClasses();

export const ingress: Istio | Traefik = withIngress(config.ingress, {
  istio: (istioConfig) => new Istio(istioConfig),
  traefik: (traefikConfig) => new Traefik(traefikConfig),
});

export const prometheusStack = new PrometheusStack({
  ...config.prometheusStackConfig,
  ingress,
});

export const webApps = config.environments.map(
  (environment) =>
    new WebApp(
      "web-app",
      {
        environment,
        ingress,
        priorityClass: priorityClasses.businessCritical,
      },
      { dependsOn: [ingress] }
    )
);

export const kubernetesDashboard =
  config.kubernetesDashboard.enabled &&
  new KubernetesDashboard(config.kubernetesDashboard);
