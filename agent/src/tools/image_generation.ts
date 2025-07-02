import { tool } from "@langchain/core/tools";
import { z } from "zod";

interface TaskResponse {
    output: {
        task_id: string;
        task_status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
        results?: Array<{ url: string }>;
        task_metrics?: {
            TOTAL: number;
            SUCCEEDED: number;
            FAILED: number;
        };
    };
    request_id: string;
    usage?: {
        image_count: number;
    };
}
const apiKey = process.env.DASHSCOPE_API_KEY;
async function submitImageGenerationTask(
    prompt: string,
    size: string = "1024*1024",
    seed?: number,
    steps: number = 4,
): Promise<string> {
    if (!apiKey) {
        throw new Error("DASHSCOPE_API_KEY environment variable is required");
    }

    const response = await fetch(
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis",
        {
            method: "POST",
            headers: {
                "X-DashScope-Async": "enable",
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "flux-schnell",
                input: {
                    prompt: prompt,
                },
                parameters: {
                    size: size,
                    seed: seed,
                    steps: steps,
                },
            }),
        },
    );

    if (!response.ok) {
        throw new Error(
            `Failed to submit image generation task: ${response.status} ${response.statusText}`,
        );
    }

    const data = (await response.json()) as TaskResponse;
    return data.output.task_id;
}

async function pollTaskStatus(taskId: string): Promise<TaskResponse> {
    if (!apiKey) {
        throw new Error("DASHSCOPE_API_KEY environment variable is required");
    }

    while (true) {
        const response = await fetch(
            `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            },
        );

        if (!response.ok) {
            throw new Error(
                `Failed to poll task status: ${response.status} ${response.statusText}`,
            );
        }

        const data = (await response.json()) as TaskResponse;

        if (data.output.task_status === "SUCCEEDED") {
            return data;
        } else if (data.output.task_status === "FAILED") {
            throw new Error("Image generation task failed");
        }

        // Wait 2 seconds before polling again
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
}

export const image_generation = tool(
    async (input) => {
        try {
            // Submit the image generation task
            const taskId = await submitImageGenerationTask(
                input.prompt,
                input.size ?? "1024*1024",
                input.seed,
                input.steps ?? 4,
            );

            // Poll for task completion
            const result = await pollTaskStatus(taskId);

            if (result.output.results && result.output.results.length > 0) {
                const imageUrl = result.output.results[0]!.url;

                return [
                    JSON.stringify({
                        image_url: imageUrl,
                        hint: "The image is generated and shown to the user. You don't need to show the image url to the user in your response.",
                    }),
                    {
                        type: "image",
                        url: imageUrl,
                        prompt: input.prompt,
                        task_id: taskId,
                    },
                ];
            } else {
                throw new Error("No image results returned from the API");
            }
        } catch (error) {
            console.error("Image generation error:", error);
            return [
                `Failed to generate image: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
                null,
            ];
        }
    },
    {
        name: "image_generation",
        description:
            "Generate an image by Stable Diffusion like prompt. The image will be generated and shown to the user by this tool. You don't need to show the image url to the user in your response.",
        schema: z.object({
            prompt: z
                .string()
                .describe("The text prompt describing the image to generate"),
            size: z
                .string()
                .default("1024*1024")
                .describe(
                    "The size of the image to generate. The allowed size are ['1024*1024', '720*1280', '1280*720']",
                ),
            seed: z
                .number()
                .optional()
                .describe("Random seed for reproducible results"),
            steps: z
                .number()
                .default(4)
                .describe("Number of generation steps (default: 4)"),
        }),
        responseFormat: "content_and_artifact",
    },
);
