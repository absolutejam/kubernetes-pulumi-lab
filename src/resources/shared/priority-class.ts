import * as k8s from "@pulumi/kubernetes";

export const businessCriticalPriorityClass =
  new k8s.scheduling.v1.PriorityClass("business-critical", {
    metadata: {
      name: "business-critical",
    },
    value: 1000,
    description: "",
    preemptionPolicy: "PreemptLowerPriority",
    globalDefault: false,
  });
