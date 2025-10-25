import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const image_generation = tool(
    async (input) => {
        try {
            if (input.image) {
                // Image Edit
                const response = await fetch(
                    "https://ark.cn-beijing.volces.com/api/v3/images/generations",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${
                                import.meta.env.VOL_API_KEY
                            }`,
                        },
                        body: JSON.stringify({
                            model: "doubao-seededit-3-0-i2i-250628",
                            prompt: input.prompt,
                            image: input.image,
                            response_format: "url",
                            size: "adaptive", // Set to adaptive for editing
                            seed: input.seed,
                            guidance_scale: input.guidance_scale,
                            watermark: false, // Set to false for editing
                        }),
                    },
                );
                const json = (await response.json()) as {
                    model: string;
                    created: number;
                    data: {
                        url: string;
                    }[];
                    usage: {
                        generated_images: number;
                        output_tokens: number;
                        total_tokens: number;
                    };
                };

                const imageUrl = json.data?.[0]?.url;
                if (imageUrl) {
                    return [
                        JSON.stringify({
                            image_url: imageUrl,
                            hint: "The image is edited and shown to the user. You don't need to show the image url to the user in your response.",
                        }),
                        {
                            type: "image",
                            url: imageUrl,
                            prompt: input.prompt,
                        },
                    ];
                }
                throw new Error(
                    "No image results returned from the API for editing",
                );
            }

            const response = await fetch(
                "https://ark.cn-beijing.volces.com/api/v3/images/generations",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${import.meta.env.VOL_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: "doubao-seedream-3-0-t2i-250415",
                        prompt: input.prompt,
                        response_format: "url",
                        size: input.size,
                        guidance_scale: input.guidance_scale,
                        watermark: false,
                    }),
                },
            );
            const json = (await response.json()) as {
                model: string;
                created: number;
                data: {
                    url: string;
                }[];
                usage: {
                    generated_images: number;
                    output_tokens: number;
                    total_tokens: number;
                };
            };

            if (json.data) {
                const imageUrl = json.data[0]?.url;
                return [
                    JSON.stringify({
                        image_url: imageUrl,
                        hint: "The image is generated and shown to the user. You don't need to show the image url to the user in your response.",
                    }),
                    {
                        type: "image",
                        url: imageUrl,
                        prompt: input.prompt,
                    },
                ];
            } else {
                throw new Error(
                    "No image results returned from the API for generation",
                );
            }
        } catch (error) {
            console.error("Image generation/editing error:", error);
            return [
                `Failed to generate or edit image: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
                null,
            ];
        }
    },
    {
        name: "image_tool",
        description: `Generate or edit an image. To generate, provide a 'prompt'. To edit, provide a 'prompt' and an 'image'. The image will be shown to the user by this tool. You don't need to show the image url to the user in your response.
            
When to use Generate

- The user asks to create an image from scratch based on a description.
- The user's prompt is a creative request for a new visual.
- No initial image is provided by the user.
For example: "draw a cat", "draw a logo for my company", "draw a picture of a future city"

When to use Edit

- The user provides an image and asks to modify it.
- The user wants to change, add, or remove elements from an existing image.
- An 'image' is available in the input.
For example: "remove the background of this photo", "change the color of the car in the picture to red", "add a hat to the person in the picture"


`,
        schema: z.object({
            prompt: z
                .string()
                .describe(
                    "The text prompt describing the image to generate or the edit to apply.",
                ),
            image: z
                .string()
                .optional()
                .describe(
                    "The image to edit, as a URL or base64 encoded string. If provided, the tool will edit the image. Otherwise, it will generate a new image.",
                ),
            size: z
                .enum([
                    "1024x1024",
                    "864x1152",
                    "1152x864",
                    "1280x720",
                    "720x1280",
                    "832x1248",
                    "1248x832",
                    "1512x648",
                    "512x512",
                    "2048x2048",
                    "adaptive",
                ])
                .default("512x512")
                .describe("The size of the image to generate. "),
            seed: z
                .number()
                .optional()
                .describe("Random seed for reproducible results"),
            guidance_scale: z
                .number()
                .optional()
                .describe(
                    "Guidance scale for image editing, used when an image is provided.",
                ),
            // Removed watermark from schema as per user's diff
        }),
        responseFormat: "content_and_artifact",
    },
);
