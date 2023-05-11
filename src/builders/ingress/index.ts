export { type TraefikResources, Traefik } from "./traefik";
export { type IstioGatewayResources, IstioGateway } from "./istio";

import { type IstioGateway } from "./istio";
import { type Traefik } from "./traefik";
export type Ingress = IstioGateway | Traefik;

export function withIngress<T extends { type: string }, R>(
  config: T,
  handlers: {
    [k in (typeof config)["type"]]: (ingress: Extract<T, { type: k }>) => R;
  }
) {
  //@ts-ignore.
  return handlers[config.type](config) as R;
}
