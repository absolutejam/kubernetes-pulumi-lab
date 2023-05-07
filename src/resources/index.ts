import { WebApp } from "../builders/web-app";
import { withIngress, Istio, Traefik } from "../builders/ingress";

import { PriorityClasses } from "../builders/shared/priority-classes";

import { config } from "../config";
import { KubernetesDashboard } from "../builders/shared/kubernetes-dashboard";

const priorityClasses = new PriorityClasses();

export const ingress: Istio | Traefik = withIngress(config.ingress, {
  istio: (istioConfig) => new Istio(istioConfig),
  traefik: (traefikConfig) => new Traefik(traefikConfig),
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
  config.kubernetesDashboard &&
  new KubernetesDashboard(config.kubernetesDashboard);
