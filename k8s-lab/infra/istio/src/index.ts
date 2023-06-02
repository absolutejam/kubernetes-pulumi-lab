import { config } from "./config";
import { Istio } from "./resources/istio";

const istio = new Istio(config.istio);
