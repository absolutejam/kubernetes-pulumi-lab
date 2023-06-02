import { config } from "./config";
import { SelfSignedIssuer } from "./resources";

const { secrets, certsConfig } = config;

const selfSignedIssuer = new SelfSignedIssuer({
  certsConfig,
  secrets,
});

export const rootCertName = certsConfig.rootCertName;
export const rootCaName = certsConfig.rootCaName;
export const selfSignedCaName = certsConfig.selfSignedCaName;
export const selfSignedBundleName = certsConfig.selfSignedBundleName;
