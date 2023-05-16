import { config } from "./config";
import { Istio } from "./resources/istio";

const istio = new Istio(config.istio);

export const deployStatus = istio.istiod.getResource(
  "apps/v1/Deployment",
  `${config.istio.namespace}/istiod`
).status;
