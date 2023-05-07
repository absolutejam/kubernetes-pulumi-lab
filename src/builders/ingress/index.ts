export { type TraefikResources, Traefik } from "./traefik";
export { type IstioResources, Istio, IstioPrometheusAddon } from "./istio";

import { type Istio } from "./istio";
import { type Traefik } from "./traefik";
export type Ingress = Istio | Traefik;

export function withIngress<T extends { type: string }, R>(
  config: T,
  handlers: {
    [k in (typeof config)["type"]]: (ingress: Extract<T, { type: k }>) => R;
  }
) {
  //@ts-ignore.
  return handlers[config.type](config) as R;
}
