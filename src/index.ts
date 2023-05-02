import { config } from "./config";

import {
  buildWebServiceResources,
  type WebServiceResources,
} from "./builders/web-app";

import * as priorityClasses from "./resources/shared/priority-class";

const webServices: [string, WebServiceResources][] = config.environments.map(
  (environment) => {
    const resources = buildWebServiceResources(environment);
    return [environment, resources];
  }
);

const deploy = [webServices, priorityClasses];

export const cluster = config.cluster;
export const webServiceEntrypoints = Object.fromEntries(
  webServices.map(([environment, { ingressRoute }]) => {
    const matches = ingressRoute.spec.routes.apply((r) =>
      r.map((r) => r.match)
    );
    return [environment, matches];
  })
);
