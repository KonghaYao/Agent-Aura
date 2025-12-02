import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { processGeminiImage } from "../utils/nano_banana";
import { defaultUploader } from "../../app/chat/services/uploaders";

export const gemini_image_processor = tool(
    async (input) => {
        try {
            const imageBuffer = await processGeminiImage(
                input.prompt,
                input.inputImageUrls,
                input.resolution,
                input.aspectRatio,
                input.model,
            );
            console.log("图片生成完成");
            const imageUrl = await defaultUploader.uploadFile(
                new File([imageBuffer as any as string], "image.png"),
            );
            console.log(imageUrl);
            return {
                image_url: imageUrl,
                hint: "The image is generated and shown to the user. You don't need to show the image url to the user in your response.",
            };
        } catch (error) {
            console.error("Gemini Image Processor error:", error);
            return `图片处理失败: ${
                error instanceof Error ? error.message : String(error)
            }`;
        }
    },
    {
        name: "image_tool",
        description: `Generate or edit an image. To generate, provide a 'prompt'. To edit, provide a 'prompt' and some 'inputImageUrls'. The image will be shown to the user by this tool. You don't need to show the image url to the user in your response.

When to use Generate

- The user asks to create an image from scratch based on a description.
- The user's prompt is a creative request for a new visual.
- No initial image is provided by the user.
For example: "draw a cat", "draw a logo for my company", "draw a picture of a future city"

When to use Edit

- The user provides an image and asks to modify it.
- The user wants to change, add, or remove elements from an existing image.
- An 'inputImageUrls' is available in the input.
For example: "remove the background of this photo", "change the color of the car in the picture to red", "add a hat to the person in the picture"`,
        schema: z.object({
            prompt: z.string().describe("图片提示词"),
            inputImageUrls: z
                .array(z.string())
                .optional()
                .describe("图片 URL 数组"),
            resolution: z
                .enum(["1K", "2K", "4K"])
                .optional()
                .default("1K")
                .describe("图片分辨率"),
            aspectRatio: z
                .enum([
                    "21:9",
                    "16:9",
                    "4:3",
                    "3:2",
                    "1:1",
                    "9:16",
                    "3:4",
                    "2:3",
                    "5:4",
                    "4:5",
                ])
                .optional()
                .default("16:9")
                .describe("图片宽高比"),
            model: z
                .string()
                .optional()
                .default("gemini-2.5-flash-image")
                // .default("gemini-3-pro-image-preview")
                .describe("使用的 Gemini 模型"),
        }),
    },
);
