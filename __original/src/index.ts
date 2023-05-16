import * as pulumi from "@pulumi/pulumi";

import { config } from "./config";
import {
  Istio,
  IstioGateway,
  CertManager,
  SelfSignedIssuer,
  TrustManager,
} from "./resources";

const certManager = new CertManager(config.certManager);
const selfSignedIssuer = new SelfSignedIssuer(config.selfSignedIssuer);
const trustManager = new TrustManager(config.trustManager);

const istio = new Istio(config.istio);
const istioGateway = new IstioGateway(config.istioGateway);
