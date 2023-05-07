import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

import { PriorityClass } from "@pulumi/kubernetes/scheduling/v1";

export type PriorityClassResources = {
  businessCritical: PriorityClass;
};

export class PriorityClasses
  extends pulumi.ComponentResource
  implements PriorityClassResources
{
  public businessCritical: PriorityClass;

  constructor(opts?: pulumi.ComponentResourceOptions) {
    super("k8slab:infra:PriorityClasses", "priority-classes", {}, opts);

    this.businessCritical = new k8s.scheduling.v1.PriorityClass(
      "business-critical",
      {
        metadata: {
          name: "business-critical",
        },
        value: 1000,
        description: "Business critical services that should never be evicted",
        preemptionPolicy: "PreemptLowerPriority",
        globalDefault: false,
      },
      { parent: this }
    );
  }
}
