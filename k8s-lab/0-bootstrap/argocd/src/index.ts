import { config } from "./config";
import { ArgoCd } from "./resources/argocd";

const argocd = new ArgoCd(config.argoCd);
