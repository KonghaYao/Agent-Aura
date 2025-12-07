import { getEnv } from "./getEnv";
import { Buffer } from "node:buffer";

export async function processGeminiImage(
    /** 图片提示词 */
    prompt: string,
    /** 图片 URL 数组 */
    inputImageUrls?: string[],
    resolution: "1K" | "2K" | "4K" = "1K",
    //21:9, 16:9, 4:3, 3:2, 1:1, 9:16, 3:4, 2:3, 5:4, 4:5
    aspectRatio:
        | "21:9"
        | "16:9"
        | "4:3"
        | "3:2"
        | "1:1"
        | "9:16"
        | "3:4"
        | "2:3"
        | "5:4"
        | "4:5" = "16:9",
    model: string = "gemini-3-pro-image-preview",
): Promise<Uint8Array> {
    const url = `${getEnv(
        "GEMINI_BASE_URL",
    )}/v1beta/models/${model}:generateContent`;

    const headers = {
        Authorization: `Bearer ${getEnv("GEMINI_API_KEY")}`,
        "Content-Type": "application/json",
    };

    const parts: any[] = [{ text: prompt }];

    if (inputImageUrls && inputImageUrls.length > 0) {
        const imagePromises = inputImageUrls.map(async (url) => {
            const imageResponse = await fetch(url);
            if (!imageResponse.ok) {
                throw new Error(`Failed to fetch image from URL: ${url}`);
            }
            const imageBuffer = await imageResponse.arrayBuffer();
            const mimeType = imageResponse.headers.get("content-type");
            if (!mimeType) {
                throw new Error(
                    "Could not determine MIME type from image URL.",
                );
            }
            const imgBase64 = Buffer.from(imageBuffer).toString("base64");
            return {
                inline_data: {
                    mime_type: mimeType,
                    data: imgBase64,
                },
            };
        });
        const imageParts = await Promise.all(imagePromises);
        parts.push(...imageParts);
    }

    const body = JSON.stringify({
        contents: [{ parts: parts }],
        generationConfig: {
            responseModalities: ["IMAGE"],
            imageConfig: {
                image_size: resolution,
                aspectRatio: aspectRatio,
            },
        },
    });
    // console.log(body);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: body,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `API request failed with status ${response.status}: ${errorText}`,
            );
        }

        const data = await response.json();
        const imageData = data.candidates[0].content.parts[0].inlineData.data;

        const imageBuffer = Buffer.from(imageData, "base64");

        return imageBuffer;
    } catch (error) {
        console.error("Error processing image:", error);
        throw error;
    }
}
