import * as pulumi from "@pulumi/pulumi";

import { Kiali as KialiCrd } from "../../../crds/kiali/kiali/v1alpha1";
import { IstioRoutes } from "../../routes";
import { Namespace } from "@pulumi/kubernetes/core/v1";

export type KialiOpts = {
  namespace: string;
};

export type KialiResources = {
  kiali: KialiCrd;
  namespace: string;
  service: string;
};

export class Kiali extends pulumi.ComponentResource implements KialiResources {
  public kiali: KialiCrd;
  public namespace: string;
  public service: string;

  constructor(
    name: string,
    { namespace }: KialiOpts,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("k8slab:infra:Kiali", name, {}, opts);

    this.namespace = namespace;

    const namespaceResource = new Namespace(
      "kiali-namespace",
      {
        metadata: { name: this.namespace },
      },
      { parent: this }
    );

    this.kiali = new KialiCrd(
      "kiali",
      {
        metadata: {
          name,
          namespace,
        },
        // https://kiali.io/docs/configuration/kialis.kiali.io/#example-cr
        spec: {
          auth: {
            strategy: "anonymous",
          },
          deployment: {
            accessible_namespaces: ["istio-system"],
            view_only_mode: false,
          },
          server: {
            web_root: "/kiali",
          },
        },
      },
      { parent: this, dependsOn: namespaceResource }
    );
  }
}
