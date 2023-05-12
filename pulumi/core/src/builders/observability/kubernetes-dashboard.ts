import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import { Namespace, Secret, ServiceAccount } from "@pulumi/kubernetes/core/v1";
import { Chart } from "@pulumi/kubernetes/helm/v3";
import { ClusterRoleBinding } from "@pulumi/kubernetes/rbac/v1";
import { withIngress } from "../../resources/cert-manager/ingress";

export type KubernetesDashboardOpts = {
  namespace: string;
  version?: string;
};

export type KubernetesDashboardResources = {
  namespace: Namespace;
  chart: Chart;
  serviceAccount: ServiceAccount;
  clusterRoleBinding: ClusterRoleBinding;
  tokenSecret: Secret;
};

export class KubernetesDashboard
  extends pulumi.ComponentResource
  implements KubernetesDashboardResources
{
  public namespace: Namespace;
  public chart: Chart;
  public serviceAccount: ServiceAccount;
  public clusterRoleBinding: ClusterRoleBinding;
  public tokenSecret: Secret;

  constructor(
    name: string,
    { namespace, version }: KubernetesDashboardOpts,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("k8slab:infra:KubernetesDashboard", name, {}, opts);

    const labels = {
      "app.kubernetes.io/tier": "infra",
      "app.kubernetes.io/name": name,
      "app.kubernetes.io/part-of": name,
      "app.kubernetes.io/managed-by": "pulumi",
    };

    this.namespace = new kubernetes.core.v1.Namespace(
      "dashboard-namespace",
      {
        metadata: {
          name: namespace,
        },
      },
      { parent: this }
    );

    this.chart = new kubernetes.helm.v3.Chart(
      "dashboard",
      {
        chart: "kubernetes-dashboard",
        namespace: this.namespace.metadata.name,
        repo: "kubernetes-dashboard",
        version,
        fetchOpts: {
          repo: "https://kubernetes.github.io/dashboard",
        },
        values: {},
      },
      { parent: this.namespace, dependsOn: [this.namespace] }
    );

    this.serviceAccount = new kubernetes.core.v1.ServiceAccount(
      "dashboard-service-account",
      {
        metadata: {
          name: "dashboard-cluster-admin",
          namespace: this.namespace.metadata.name,
        },
      },
      { parent: this.namespace, dependsOn: [this.namespace] }
    );

    this.clusterRoleBinding = new kubernetes.rbac.v1.ClusterRoleBinding(
      "dashboard-cluster-role-binding",
      {
        metadata: {
          name: "dashboard-access",
          namespace: this.namespace.metadata.name,
        },
        roleRef: {
          apiGroup: "rbac.authorization.k8s.io",
          kind: "ClusterRole",
          name: "cluster-admin",
        },
        subjects: [
          {
            kind: "ServiceAccount",
            name: this.serviceAccount.metadata.name,
            namespace: this.namespace.metadata.name,
          },
        ],
      },
      { parent: this }
    );

    this.tokenSecret = new kubernetes.core.v1.Secret(
      "service-account-token",
      {
        type: "kubernetes.io/service-account-token",
        metadata: {
          name: pulumi.interpolate`${this.serviceAccount.metadata.name}-dashoard-token`,
          namespace: this.namespace.metadata.name,
          annotations: {
            "kubernetes.io/service-account.name":
              this.serviceAccount.metadata.name,
          },
        },
      },
      { parent: this.namespace }
    );

    // this.networkRoutes = withIngress(ingress, {
    //   traefik: () => undefined,
    //   istio: (istio) => new IstioRoute
    // })
  }
}
