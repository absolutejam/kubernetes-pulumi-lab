import { config } from './config'

import { buildWebServiceResources, type WebServiceResources } from './resources/web-service'

const webServices: [string, WebServiceResources][] = config.environments.map(environment => {
    const resources = buildWebServiceResources(environment)
    return [environment, resources]
})

const deploy = [
    webServices,
]

export const cluster = config.cluster
export const webServiceEntrypoints =
    Object.fromEntries(webServices.map(([environment, { ingressRoute }]) => {
        const matches = ingressRoute.spec.routes.apply(r => r.map(r => r.match))
        return [environment, matches]
    }))
