import { config } from "./config";
import {
  CertManager,
  TrustManager,
  SelfSignedClusterIssuer,
} from "./resources";

const certManager = new CertManager(config.certManager);
const trustManager = new TrustManager(config.trustManager);
const selfSignedIssuer = new SelfSignedClusterIssuer(config.selfSignedIssuer);
