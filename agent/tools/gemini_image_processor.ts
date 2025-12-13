import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { processGeminiImage } from "../utils/nano_banana";
import { uploadToImageKit } from "../utils/imagekit";
import { getConfig } from "@langchain/langgraph";

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
            const context = getConfig();
            const userId = context?.configurable?.userId as string;
            const threadId = context?.configurable?.thread_id as string;
            // 使用统一的 ImageKit 上传函数（自动保存到数据库）
            const { url: imageUrl } = await uploadToImageKit(
                imageBuffer as Buffer,
                `gemini-${Date.now()}.png`,
                {
                    folder: "/generated-images",
                    tags: ["ai-generated", "gemini"],
                    saveToDb: true,
                    dbOptions: {
                        userId: userId,
                        conversationId: threadId,
                        isAiGen: true,
                    },
                },
            );
            console.log("图片上传完成:", imageUrl);

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

inputImageUrls are reference images, which can be user-uploaded images or previously generated images.

Prompt Usage Guidelines:
- Prompt length guideline: Keep prompts concise and to the point. Avoid overly long or complex descriptions.
- When generating new images: Use detailed and accurate descriptions, ensuring the description is as specific and complete as possible
- When editing existing images: Use relatively brief descriptions, only describing the changes to be made
- When text or symbols need to appear in the image: Use the original text and symbols exactly as specified, rather than synonyms or approximations

Example 1: Generate Image (Detailed Description)
"Create a realistic photo of a golden retriever puppy sitting in a sunny meadow with wildflowers, detailed fur texture, natural lighting, 8k resolution"

Example 2: Edit Image (Brief Description)
Based on Image 1, change the dog's color to black

Example 3: Merge Multiple Images
Merge Image 1 and Image 2 together, create a double portrait scene, add a warm sunset background`,
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
                // .default("gemini-2.5-flash-image")
                .default("gemini-3-pro-image-preview")
                .describe("使用的 Gemini 模型"),
        }),
    },
);
