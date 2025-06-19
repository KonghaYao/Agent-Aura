import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const image_generation = tool(
    async (input) => {
        return ["image generated and showed to user", response.data];
    },
    {
        name: "image_generation",
        description: "Generate an image",
        schema: z.object({
            prompt: z.string(),
            // size: z.enum(["256x256", "512x512", "1024x1024"]),
        }),
        responseFormat: "content_and_artifact",
    },
);
