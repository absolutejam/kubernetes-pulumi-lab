import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

import { KubernetesDashboardConfig } from "../types";
import { Namespace, Secret, ServiceAccount } from "@pulumi/kubernetes/core/v1";
import { ClusterRoleBinding } from "@pulumi/kubernetes/rbac/v1";
import { VirtualService } from "@k8s-lab/crds.istio/networking/v1beta1";
import { Application } from "@k8s-lab/crds.argocd/argoproj/v1alpha1";

export class KubernetesDashboard extends pulumi.ComponentResource {
  public namespace: Namespace;
  public kubernetesDashboard: kubernetes.helm.v3.Chart;
  public serviceAccount: ServiceAccount;
  public clusterRoleBinding: ClusterRoleBinding;
  public tokenSecret: Secret;
  public virtualService: VirtualService;
  public application: Application;

  constructor(
    { namespace, version }: KubernetesDashboardConfig,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    const name = "kubernetes-dashboard";

    super("k8slab:infra:KubernetesDashboard", name, {}, opts);

    this.namespace = new kubernetes.core.v1.Namespace(
      "kubernetes-dashboard-namespace",
      {
        metadata: { name: namespace },
      },
      { parent: this },
    );

    this.kubernetesDashboard = new kubernetes.helm.v3.Chart(
      "kubernetes-dashboard",
      {
        chart: "kubernetes-dashboard",
        namespace,
        version,
        repo: "kubernetes-dashboard",
        fetchOpts: {
          repo: "https://kubernetes.github.io/dashboard",
        },
        values: {
          protocolHttp: true,
          extraArgs: ["--enable-skip-login", "--enable-insecure-login"],

          // Pinned CRDs that will be displayed in dashboard's menu
          pinnedCRDs: [
            {
              kind: "customresourcedefinition",
              name: "prometheuses.monitoring.coreos.com",
              displayName: "Prometheus",
              namespaced: false,
            },
          ],

          metricsScraper: {
            enabled: true,
          },
        },
      },
      {
        parent: this.namespace,
        dependsOn: [this.namespace],
      },
    );

    this.application = new Application(
      `${name}-application`,
      {
        metadata: {
          name,
          namespace: "argocd-system",
        },
        spec: {
          project: "default",
          source: {
            repoURL:
              "https://k8s-lab.local/infra-manifests/kubernetes-dashboard.git",
            targetRevision: "HEAD",
            path: ".",
            directory: { recurse: true },
          },
          destination: {
            server: "https://kubernetes.default.svc",
            namespace,
          },
          syncPolicy: {
            syncOptions: ["ServerSideApply=true"],
            automated: {
              prune: true,
              selfHeal: true,
            },
          },
        },
      },
      { parent: this },
    );

    this.serviceAccount = new kubernetes.core.v1.ServiceAccount(
      "dashboard-service-account",
      {
        metadata: {
          name: "dashboard-cluster-admin",
          namespace,
        },
      },
      { parent: this.namespace, dependsOn: [this.namespace] },
    );

    this.clusterRoleBinding = new kubernetes.rbac.v1.ClusterRoleBinding(
      "dashboard-cluster-role-binding",
      {
        metadata: {
          name: "dashboard-access",
          namespace,
        },
        roleRef: {
          apiGroup: "rbac.authorization.k8s.io",
          kind: "ClusterRole",
          name: "cluster-admin",
        },
        subjects: [
          {
            kind: "ServiceAccount",
            name: "dashboard-cluster-admin",
            namespace,
          },
        ],
      },
      { parent: this },
    );

    this.tokenSecret = new kubernetes.core.v1.Secret(
      "service-account-token",
      {
        type: "kubernetes.io/service-account-token",
        metadata: {
          name: "dashboard-serviceacount-token",
          namespace,
          annotations: {
            "kubernetes.io/service-account.name": "dashboard-cluster-admin",
          },
        },
      },
      { parent: this.namespace },
    );

    this.virtualService = new VirtualService(
      `${name}-virtualservice`,
      {
        metadata: {
          name,
          namespace,
        },
        spec: {
          hosts: ["*"],
          gateways: ["istio-gateway/istio-gateway"],
          http: [
            {
              name: "http",
              match: [{ uri: { prefix: "/kubernetes-dashboard/" } }],
              rewrite: { uri: "/" },
              route: [
                {
                  destination: {
                    host: `kubernetes-dashboard.${namespace}.svc.cluster.local`,
                    port: { number: 443 },
                  },
                },
              ],
            },
          ],
        },
      },
      { parent: this.namespace },
    );
  }
}
