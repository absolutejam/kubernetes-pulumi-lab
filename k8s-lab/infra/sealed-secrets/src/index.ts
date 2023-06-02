import { config } from "./config";
import { SealedSecrets } from "./resources/sealed-secrets";

const sealedSecrets = new SealedSecrets(config.externalSecrets);
