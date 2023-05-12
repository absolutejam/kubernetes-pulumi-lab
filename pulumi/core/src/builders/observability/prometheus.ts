import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { Chart } from "@pulumi/kubernetes/helm/v3";
import { Namespace, Service } from "@pulumi/kubernetes/core/v1";
import { withIngress, Ingress } from "../../resources/cert-manager/ingress";

import { PrometheusStackConfig } from "../../types";
import { IstioRoutes } from "../routes";

// TODO: Deploy each resource individually?
//       ie. deploy the chart (with CRDs), then the Prometheus, then Grafana

export type PrometheusStackResources = {
  service: pulumi.Output<Service>;
  namespace: Namespace;
  prometheusChart: Chart;
  networkResources: IstioRoutes | undefined;
};

export type PrometheusStackOpts = {
  ingress: Ingress;
} & PrometheusStackConfig;

export class PrometheusStack
  extends pulumi.ComponentResource
  implements PrometheusStackResources
{
  public service: pulumi.Output<Service>;
  public namespace: Namespace;
  public prometheusChart: Chart;
  public networkResources: IstioRoutes | undefined;

  constructor(
    name: string,
    { namespace, version, ingress }: PrometheusStackOpts,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("k8slab:infra:PrometheusStack", name, {}, opts);

    this.namespace = new kubernetes.core.v1.Namespace(
      "prometheus-namespace",
      {
        metadata: { name: namespace },
      },
      { parent: this }
    );

    /**
     * Service discovery
     * https://prometheus.io/docs/prometheus/latest/configuration/configuration/#kubernetes_sd_config
     *
     * TODO: Tweak to accomodate for high cardinality (pod name, etc.)
     */

    const kubernetesServiceEndpoints = {
      job_name: "kubernetes-service-endpoints",
      kubernetes_sd_configs: [{ role: "service" }],
      relabel_configs: [
        // annotation 'prometheus.io/scrape' must be set to 'true'
        {
          action: "keep",
          regex: true,
          source_labels: [
            "__meta_kubernetes_service_annotation_prometheus_io_scrape",
          ],
        },

        // service cannot be in kube-system or prom namespaces
        {
          action: "drop",
          regex: `(kube-system|prom)`,
          source_labels: ["__meta_kubernetes_namespace"],
        },

        // service port name must end with word 'metrics'
        // {
        //   action: "keep",
        //   regex: `.*metrics`,
        //   source_labels: ["__meta_kubernetes_service_port_name"],
        // },

        // allow override of http scheme
        {
          action: "replace",
          regex: `(https?)`,
          source_labels: [
            "__meta_kubernetes_service_annotation_prometheus_io_scheme",
          ],
          target_label: "__scheme__",
        },

        // allow override of default /metrics path
        {
          action: "replace",
          regex: `(.+)`,
          source_labels: [
            "__meta_kubernetes_service_annotation_prometheus_io_path",
          ],
          target_label: "__metrics_path__",
        },

        // allow override of default port
        {
          action: "replace",
          regex: `([^:]+)(?::\d+)?;(\d+)`,
          replacement: `$1:$2`,
          source_labels: [
            "__address__",
            "__meta_kubernetes_service_annotation_prometheus_io_port",
          ],
          target_label: "__address__",
        },
        {
          action: "labelmap",
          regex: `__meta_kubernetes_service_label_(.+)`,
        },
        {
          action: "replace",
          source_labels: ["__meta_kubernetes_namespace"],
          target_label: "kubernetes_namespace",
        },
        {
          action: "replace",
          source_labels: ["__meta_kubernetes_service_name"],
          target_label: "kubernetes_name",
        },
      ],
    };

    const kubernetesPods = {
      job_name: "kubernetes-pods",
      kubernetes_sd_configs: [{ role: "pod" }],
      relabel_configs: [
        // annotation 'prometheus.io/scrape' must be set to 'true'
        {
          action: "keep",
          regex: true,
          source_labels: [
            "__meta_kubernetes_pod_annotation_prometheus_io_scrape",
          ],
        },

        // pod cannot be in kube-system or prom namespaces
        {
          action: "drop",
          regex: `(kube-system|prom)`,
          source_labels: ["__meta_kubernetes_namespace"],
        },

        // allow override of http scheme
        {
          action: "replace",
          regex: `(https?)`,
          source_labels: [
            "__meta_kubernetes_pod_annotation_prometheus_io_scheme",
          ],
          target_label: "__scheme__",
        },

        // allow override of default /metrics path
        {
          action: "replace",
          regex: `(.+)`,
          source_labels: [
            "__meta_kubernetes_pod_annotation_prometheus_io_path",
          ],
          target_label: "__metrics_path__",
        },

        // allow override of default port
        {
          action: "replace",
          regex: `([^:]+)(?::\d+)?;(\d+)`,
          replacement: `$1:$2`,
          source_labels: [
            "__address__",
            "__meta_kubernetes_pod_annotation_prometheus_io_port",
          ],
          target_label: "__address__",
        },
        {
          action: "labelmap",
          regex: `__meta_kubernetes_pod_label_(.+)`,
        },
        {
          action: "replace",
          source_labels: ["__meta_kubernetes_namespace"],
          target_label: "kubernetes_namespace",
        },
        {
          action: "replace",
          source_labels: ["__meta_kubernetes_pod_name"],
          target_label: "kubernetes_name",
        },

        // Replace the instance (ip/port) with pod name
        {
          action: "replace",
          source_labels: ["__meta_kubernetes_pod_name"],
          target_label: "instance",
        },
      ],
    };

    this.prometheusChart = new kubernetes.helm.v3.Chart(
      "prometheus-stack",
      {
        chart: "kube-prometheus-stack",
        namespace: this.namespace.metadata.name,
        version,
        repo: "prometheus-community",
        fetchOpts: {
          repo: "https://prometheus-community.github.io/helm-charts",
        },

        // https://github.com/prometheus-community/helm-charts/blob/main/charts/kube-prometheus-stack/values.yaml
        values: {
          fullnameOverride: "prom",

          /**
           * These features are not available in k3d
           */
          kubeProxy: { enabled: false },
          kubeControllerManager: { enabled: false },
          kubeEtcd: { enabled: false },
          kubeScheduler: { enabled: false },

          /**
           * Admission webhook feature is disabled as it uses Helm hooks to
           * provision the cert, etc. required by the webhook controllers
           */

          prometheusOperator: {
            tls: {
              // This has to be disabled while the admissionWebhook feature is
              // disabled
              // TODO: Set up CertManager for this
              enabled: false,
            },
            admissionWebhooks: {
              enabled: false,
            },
          },

          defaultRules: {
            create: true,
            rules: {
              alertmanager: true,
              etcd: true,
              configReloaders: true,
              general: true,
              k8s: true,
              kubeApiserverAvailability: true,
              kubeApiserverBurnrate: true,
              kubeApiserverHistogram: true,
              kubeApiserverSlos: true,
              kubeControllerManager: true,
              kubelet: true,
              kubeProxy: true,
              kubePrometheusGeneral: true,
              kubePrometheusNodeRecording: true,
              kubernetesApps: true,
              kubernetesResources: true,
              kubernetesStorage: true,
              kubernetesSystem: true,
              kubeSchedulerAlerting: true,
              kubeSchedulerRecording: true,
              kubeStateMetrics: true,
              network: true,
              node: true,
              nodeExporterAlerting: true,
              nodeExporterRecording: true,
              prometheus: true,
              prometheusOperator: true,
            },
            appNamespacesTarget: ".*",
            labels: {},
            annotations: {},
            additionalRuleLabels: {},
            additionalRuleAnnotations: {},
            runbookUrl: "https://runbooks.prometheus-operator.dev/runbooks",
            disabled: {},
          },

          prometheus: {
            prometheusSpec: {
              enableAdminAPI: true,

              /**
               * If true, a nil or {} value for prometheus.prometheusSpec.serviceMonitorSelector will cause the
               * prometheus resource to be created with selectors based on values in the helm deployment,
               * which will also match the servicemonitors created
               */

              serviceMonitorSelectorNilUsesHelmValues: false,
              serviceMonitorSelector: {},
              serviceMonitorNamespaceSelector: {},

              podMonitorSelectorNilUsesHelmValues: false,
              podMonitorSelector: {},
              podMonitorNamespaceSelector: {},

              probeSelectorNilUsesHelmValues: false,
              probeSelector: {},
              probeNamespaceSelector: {},

              additionalScrapeConfigs: [
                kubernetesServiceEndpoints,
                kubernetesPods,
              ],
            },
          },
        },
      },
      { parent: this.namespace, dependsOn: [this.namespace] }
    );

    this.service = this.prometheusChart.getResource(
      "v1/Service",
      "observability/prom-prometheus"
    );

    this.networkResources = 
      traefik: (traefik) => undefined,
      istio: (istio) =>
        new IstioRoutes(
          name,
          {
            istio,
            namespace,
            destinations: [
              {
                name: "prometheus",
                port: 9090,
                host: "prom-prometheus",
                prefix: "/prometheus",
              },
            ],
          },
          { parent: this.namespace }
        ),
    });
  }
}
