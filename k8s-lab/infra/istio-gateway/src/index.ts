import { config } from "./config";
import { IstioGateway } from "./resources/istio-gateway";

const istioGateway = new IstioGateway(config.istioGateway);
