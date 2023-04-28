import { z } from "zod"

const Resources = z.object({
    cpu: z.string(),
    memory: z.string(),
}).partial()

export const WebAppConfig = z.object({
    replicas: z.number(),
    image: z.string(),
    resources: z.object({
        requests: Resources.optional(),
        limits: Resources.optional(),
    }).optional(),
    nodeSelector: z.record(z.string()).optional(),
})

export type WebAppConfig = z.infer<typeof WebAppConfig>

export const Config = z.object({
    cluster: z.string(),
    instance: z.string(),
    environments: z.array(z.string()),

    webAppConfig: WebAppConfig,
})

export type Config = z.infer<typeof Config>
