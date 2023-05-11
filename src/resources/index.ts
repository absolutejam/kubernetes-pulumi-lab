import { config } from "../config";

import { WebApp } from "../builders/web-app";
import {
  CertManager,
  TrustManager,
  CertManagerSelfSignedClusterIssuer,
} from "../builders/cert-manager";
import {
  PrometheusStack,
  KubernetesDashboard,
} from "../builders/observability";
import { PriorityClasses } from "../builders/shared/priority-classes";
import { withIngress, IstioGateway, Traefik } from "../builders/ingress";
import { Istio } from "../builders/mesh/istio";

/**
 * Cluster base
 */

const priorityClasses = new PriorityClasses();

/**
 * Service mesh
 */

export const istio: Istio = new Istio(config.istio);

/**
 * Cert Manager
 */

export const certManager = new CertManager(config.certManager);

export const clusterIssuer = new CertManagerSelfSignedClusterIssuer({
  namespace: config.certManager.namespace,
});

const certManagerDeployment = certManager.chart.getResource(
  "apps/v1/Deployment",
  `${config.certManager.namespace}/cert-manager`
);

// TODO: This might need more explicit `dependsOn` entries to ensure is created after all of cert-manager is deployed
export const trustManager = new TrustManager(
  { namespace: config.certManager.namespace },
  {
    parent: certManager.namespace,
    dependsOn: [certManager.chart, certManagerDeployment],
  }
);
/**
 * Ingress
 */

export const ingress: IstioGateway | Traefik = withIngress(config.ingress, {
  istio: (istioGatewayConfig) => {
    // Look up the istiod deployment so that we can wait for it before spinning up
    // the istio gateway
    const istiodDeployment = istio.namespace.metadata.name.apply((namespace) =>
      istio.istiod.getResource("apps/v1/Deployment", `${namespace}/istiod`)
    );

    const certCrd = certManager.chart.getResource(
      "apiextensions.k8s.io/v1/CustomResourceDefinition",
      `cert-manager.io/Certificate`
    );

    return new IstioGateway(istioGatewayConfig, {
      dependsOn: [
        istio.namespace,
        istio.istioBase,
        istio.istiod,
        istiodDeployment,
        certCrd,
      ],
    });
  },
  traefik: (traefikConfig) => new Traefik(traefikConfig),
});

/**
 * Observability
 */

export const kubernetesDashboard =
  config.kubernetesDashboard.enabled &&
  new KubernetesDashboard(config.kubernetesDashboard);

export const prometheusStack = new PrometheusStack({
  ...config.prometheusStackConfig,
  ingress,
});

/**
 * Apps
 */

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
