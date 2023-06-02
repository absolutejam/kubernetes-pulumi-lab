import * as pulumi from "@pulumi/pulumi";

import { Application } from "@k8s-lab/crds.argocd/argoproj/v1alpha1";
import { ArgoApplicationsConfig } from "../types";

export class ArgoApplications extends pulumi.ComponentResource {
  public applications: Application[];

  constructor(
    { namespace, services }: ArgoApplicationsConfig,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    const name = "argo-applications";

    super("k8slab:infra:ArgoApplications", name, {}, opts);

    this.applications = services.map((service) =>
      new Application(
        service.name,
        {
          metadata: {
            name: service.name,
            namespace,
          },
          spec: {
            project: "default",
            source: {
              repoURL: `https://k8s-lab.local/gitea/${service.repoPath}`,
              targetRevision: "HEAD",
              path: ".",
              directory: { recurse: true },
            },
            destination: {
              server: "https://kubernetes.default.svc",
              namespace: service.namespace,
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
      )
    );
  }
}
