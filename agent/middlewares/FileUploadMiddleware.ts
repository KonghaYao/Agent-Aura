import { createMiddleware } from "langchain";
import { ToolMessage } from "langchain";
import { getConfig } from "@langchain/langgraph";
import { createHash } from "crypto";
import { textStoreService } from "../filestore/routes";
import { fileStoreService, type FileInsert } from "../filestore/index";

// 处理 tavily_extract 数据并存储到 filestore
async function handleTavilyExtractData(
    data: {
        results?: {
            url: string;
            title: string;
            raw_content: string;
        }[];
    },
    userId?: string,
    threadId?: string,
) {
    console.log(
        `[DEBUG] handleTavilyExtractData called with userId: ${userId}, threadId: ${threadId}, results count: ${data.results?.length}`,
    );

    if (!data.results || !userId || !threadId) {
        console.log(
            `[DEBUG] Missing required parameters: results=${!!data.results}, userId=${!!userId}, threadId=${!!threadId}`,
        );
        return;
    }

    try {
        console.log(`[DEBUG] Setting up textStoreService...`);
        await textStoreService.setup();
        console.log(`[DEBUG] textStoreService setup completed`);
    } catch (error) {
        console.error(`[ERROR] Failed to setup textStoreService:`, error);
        return;
    }

    if (data.results && Array.isArray(data.results)) {
        for (const result of data.results) {
            if (result.raw_content) {
                const fileId = createHash("sha256")
                    .update(result.raw_content)
                    .digest("hex");
                const filename =
                    result.title + ".md" ||
                    `tavily_extract_${new Date().toISOString()}.md`;

                console.log(
                    `[DEBUG] Processing result: ${filename}, content length: ${result.raw_content.length}`,
                );

                // 计算文件大小 (UTF-8 字节长度) 使用 TextEncoder API，而非 Buffer
                const fileSize = new TextEncoder().encode(
                    result.raw_content,
                ).length;

                try {
                    console.log(`[DEBUG] Saving to text-store...` + fileId);
                    // 在 text-store 中存储内容
                    await textStoreService.saveToFileStore({
                        id: fileId,
                        user_id: userId,
                        content: result.raw_content,
                        filename,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });
                    console.log(`[DEBUG] Successfully saved to text-store`);
                } catch (error) {
                    console.error(
                        `[ERROR] Failed to save to text-store:`,
                        error,
                    );
                    continue;
                }

                // 在 fileStore 中创建文件记录
                const fileRecord: FileInsert = {
                    user_id: userId,
                    conversation_id: threadId, // 暂时设为 null
                    file_name: filename,
                    file_size: fileSize,
                    file_type: "text/markdown",
                    oss_url: `https://agent-aura.top/api/files/text/${fileId}/download`, // 使用 textstore 协议表示存储在 text-store 中
                    category: "document",
                    tags: ["tavily", "extract", "web-content"],
                    is_ai_gen: true, // 这是AI提取的内容
                };

                try {
                    console.log(`[DEBUG] Creating file record in database...`);
                    await fileStoreService.createFile(fileRecord);
                    console.log(
                        `[DEBUG] Successfully created file record in database`,
                    );
                } catch (error) {
                    console.error(
                        `[ERROR] Failed to create file record in database:`,
                        error,
                    );
                    continue;
                }

                console.log(`Stored raw_content to filestore: ${filename}`);
            } else {
                console.log(
                    `[DEBUG] Skipping result without raw_content: ${result.title}`,
                );
            }
        }
    }
}

export const FileUploadMiddleware = () => {
    return createMiddleware({
        name: "FileUpload",
        wrapToolCall: async (request, handler) => {
            const result = await handler(request);
            if (request.toolCall.name === "tavily_extract") {
                const tool = result as ToolMessage<any>;
                try {
                    const data = JSON.parse(tool.text);
                    const context = getConfig();
                    const userId = context?.configurable?.userId as string;
                    const threadId = context?.configurable?.thread_id as string;
                    console.log(
                        `[DEBUG] Parsed data, calling handleTavilyExtractData...`,
                    );
                    await handleTavilyExtractData(data, userId, threadId);
                    console.log(
                        `[DEBUG] handleTavilyExtractData completed successfully`,
                    );
                } catch (e) {
                    console.error(
                        "[ERROR] Failed to process tavily_extract data:",
                        e,
                    );
                    console.error("[ERROR] Tool text was:", tool.text);
                }
            }
            return result;
        },
    });
};
