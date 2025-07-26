import { z } from "zod";

export const ConfigurationSchema = z.object({
    query_generator_model: z.string().default("gemini-2.0-flash-exp"),
    reflection_model: z.string().default("gemini-2.0-flash-thinking-exp"),
    answer_model: z.string().default("gemini-2.5-flash-exp"),
    number_of_initial_queries: z.number().default(3),
    max_research_loops: z.number().default(3),
});

export type Configuration = z.infer<typeof ConfigurationSchema>;

export class ConfigurationHelper {
    static fromRunnableConfig(config: any): Configuration {
        return ConfigurationSchema.parse(config?.configurable || {});
    }
}
