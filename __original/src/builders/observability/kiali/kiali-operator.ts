import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import { Namespace } from "@pulumi/kubernetes/core/v1";
import { Chart } from "@pulumi/kubernetes/helm/v3";

export type KialiOperatorOpts = {
  namespace: string;
  version?: string;
};

export type KialiOperatorResources = {
  namespace: Namespace;
  chart: Chart;
};

export class KialiOperator
  extends pulumi.ComponentResource
  implements KialiOperatorResources
{
  public namespace: Namespace;
  public chart: Chart;

  constructor(
    { namespace, version }: KialiOperatorOpts,
    opts?: pulumi.ComponentResourceOptions
  ) {
    const name = "kiali-operator";

    super("k8slab:infra:Kiali", name, {}, opts);

    this.namespace = new kubernetes.core.v1.Namespace(
      "kiali-operator",
      {
        metadata: {
          name: namespace,
        },
      },
      { parent: this }
    );

    this.chart = new kubernetes.helm.v3.Chart(
      "kiali-operator",
      {
        chart: "kiali-operator",
        namespace: this.namespace.metadata.name,
        repo: "kiali",
        version,
        fetchOpts: {
          repo: "https://kiali.org/helm-charts",
        },
        values: {},
      },
      { parent: this.namespace, dependsOn: [this.namespace] }
    );
  }
}
