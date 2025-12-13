import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { LangGraphServerContext } from "@langgraph-js/pure-graph/dist/adapter/hono/index.js";
import { fileStoreService, type FileInsert, type FileUpdate } from "./index";
import { TextStoreService } from "./text-store";
import { uploadToImageKit } from "../utils/imagekit";

// 扩展上下文类型以包含自定义变量
type ExtendedContext = LangGraphServerContext & {
    userId: string;
};

// 创建路由实例
export const filesRouter = new Hono<{ Variables: ExtendedContext }>();

// 初始化文本存储服务
export const textStoreService = new TextStoreService();

// 请求/响应类型定义
const createFileSchema = z.object({
    // user_id: z.string().min(1, "用户ID不能为空"),
    conversation_id: z.string().nullable().optional(),
    file_name: z.string().min(1, "文件名不能为空").max(255, "文件名过长"),
    file_size: z.number().int().positive("文件大小必须为正整数"),
    file_type: z.string().min(1, "文件类型不能为空").max(50, "文件类型过长"),
    oss_url: z.string().min(1, "OSS URL不能为空").max(512, "OSS URL过长"),
    category: z.string().max(32, "分类过长").nullable().optional(),
    tags: z.array(z.string()).default([]),
    is_ai_gen: z.boolean().default(false),
});

const updateFileSchema = z.object({
    conversation_id: z.string().nullable().optional(),
    file_name: z
        .string()
        .min(1, "文件名不能为空")
        .max(255, "文件名过长")
        .optional(),
    file_size: z.number().int().positive("文件大小必须为正整数").optional(),
    file_type: z
        .string()
        .min(1, "文件类型不能为空")
        .max(50, "文件类型过长")
        .optional(),
    oss_url: z
        .string()
        .min(1, "OSS URL不能为空")
        .max(512, "OSS URL过长")
        .optional(),
    category: z.string().max(32, "分类过长").nullable().optional(),
    tags: z.array(z.string()).optional(),
    is_ai_gen: z.boolean().optional(),
});

const getFilesQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
    offset: z.coerce.number().int().min(0).default(0).optional(),
    conversation_id: z.string().optional(),
    category: z.string().optional(),
    tags: z.string().optional(), // 逗号分隔的标签列表
});

// 中间件：获取用户ID（从认证上下文中）
filesRouter.use("*", async (c, next) => {
    // 从认证上下文中获取用户ID（需要与auth中间件配合使用）
    const userId = c.get("langgraph_context")?.userId;
    if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    await textStoreService.setup();
    c.set("userId", userId);
    await next();
});

// 创建文件
filesRouter.post("/", zValidator("json", createFileSchema), async (c) => {
    try {
        const data = c.req.valid("json") as FileInsert;
        data.user_id = c.get("userId") as string;
        console.log(data);
        const file = await fileStoreService.createFile(data);

        if (!file) {
            return c.json({ error: "创建文件失败" }, 500);
        }

        return c.json({ data: file }, 201);
    } catch (error) {
        console.error("创建文件失败:", error);
        return c.json({ error: "创建文件失败" }, 500);
    }
});

// 获取文件列表
filesRouter.get("/", zValidator("query", getFilesQuerySchema), async (c) => {
    try {
        const userId = c.get("userId") as string;
        const query = c.req.valid("query");

        const options = {
            limit: query.limit,
            offset: query.offset,
            conversationId: query.conversation_id,
            category: query.category,
            tags: query.tags
                ? query.tags.split(",").map((tag) => tag.trim())
                : undefined,
        };

        // 同时执行文件列表查询和总数查询
        const [files, totalResult] = await Promise.all([
            fileStoreService.getFilesByUserId(userId, options),
            (async () => {
                let countQuery = fileStoreService.countFilesByUserId(userId);

                if (options.conversationId) {
                    countQuery = countQuery.where(
                        "conversation_id",
                        "=",
                        options.conversationId,
                    );
                }

                if (options.category) {
                    countQuery = countQuery.where(
                        "category",
                        "=",
                        options.category,
                    );
                }

                if (options.tags && options.tags.length > 0) {
                    countQuery = countQuery.where("tags", "@>", options.tags);
                }

                return await countQuery.executeTakeFirst();
            })(),
        ]);

        const total = Number(totalResult?.count || 0);

        return c.json({ data: files, total });
    } catch (error) {
        console.error("获取文件列表失败:", error);
        return c.json({ error: "获取文件列表失败" }, 500);
    }
});

// 根据ID获取单个文件
filesRouter.get("/:id", async (c) => {
    try {
        const id = parseInt(c.req.param("id"));
        const userId = c.get("userId") as string;

        if (isNaN(id)) {
            return c.json({ error: "无效的文件ID" }, 400);
        }

        const file = await fileStoreService.getFileById(id);

        if (!file) {
            return c.json({ error: "文件不存在" }, 404);
        }

        // 检查文件是否属于当前用户
        if (file.user_id !== userId) {
            return c.json({ error: "无权访问此文件" }, 403);
        }

        return c.json({ data: file });
    } catch (error) {
        console.error("获取文件失败:", error);
        return c.json({ error: "获取文件失败" }, 500);
    }
});

// 更新文件
filesRouter.put("/:id", zValidator("json", updateFileSchema), async (c) => {
    try {
        const id = parseInt(c.req.param("id"));
        const userId = c.get("userId") as string;
        const updates = c.req.valid("json") as FileUpdate;

        if (isNaN(id)) {
            return c.json({ error: "无效的文件ID" }, 400);
        }

        // 先检查文件是否存在且属于当前用户
        const existingFile = await fileStoreService.getFileById(id);
        if (!existingFile) {
            return c.json({ error: "文件不存在" }, 404);
        }

        if (existingFile.user_id !== userId) {
            return c.json({ error: "无权修改此文件" }, 403);
        }

        const updatedFile = await fileStoreService.updateFile(id, updates);

        if (!updatedFile) {
            return c.json({ error: "更新文件失败" }, 500);
        }

        return c.json({ data: updatedFile });
    } catch (error) {
        console.error("更新文件失败:", error);
        return c.json({ error: "更新文件失败" }, 500);
    }
});

// 删除文件
filesRouter.delete("/:id", async (c) => {
    try {
        const id = parseInt(c.req.param("id"));
        const userId = c.get("userId") as string;

        if (isNaN(id)) {
            return c.json({ error: "无效的文件ID" }, 400);
        }

        // 先检查文件是否存在且属于当前用户
        const existingFile = await fileStoreService.getFileById(id);
        if (!existingFile) {
            return c.json({ error: "文件不存在" }, 404);
        }

        if (existingFile.user_id !== userId) {
            return c.json({ error: "无权删除此文件" }, 403);
        }

        const deletedFile = await fileStoreService.deleteFile(id);

        if (!deletedFile) {
            return c.json({ error: "删除文件失败" }, 500);
        }

        return c.json({ data: deletedFile });
    } catch (error) {
        console.error("删除文件失败:", error);
        return c.json({ error: "删除文件失败" }, 500);
    }
});

// 获取文件统计信息
filesRouter.get("/stats/summary", async (c) => {
    try {
        const userId = c.get("userId") as string;
        const stats = await fileStoreService.getFileStats(userId);
        return c.json({ data: stats });
    } catch (error) {
        console.error("获取文件统计失败:", error);
        return c.json({ error: "获取文件统计失败" }, 500);
    }
});

// ============================================================================
// 文本存储 API (基于 Meilisearch)
// ============================================================================

// 文本文档请求/响应类型定义
const createTextDocSchema = z.object({
    content: z.string().min(1, "内容不能为空"),
    filename: z.string().optional(),
});

const updateTextDocSchema = z.object({
    content: z.string().min(1, "内容不能为空").optional(),
    filename: z.string().optional(),
});

const searchTextSchema = z.object({
    q: z.string().optional(), // 搜索关键词
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
    offset: z.coerce.number().int().min(0).default(0).optional(),
    sort: z.string().optional(), // 排序字段，如 "created_at:desc"
    filter: z.string().optional(), // 额外的过滤条件
});

// 创建文本文档
filesRouter.post(
    "/text",
    zValidator("json", createTextDocSchema),
    async (c) => {
        try {
            const data = c.req.valid("json");
            const userId = c.get("userId") as string;

            const doc = {
                id: crypto.randomUUID(),
                user_id: userId,
                content: data.content,
                filename: data.filename,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            await textStoreService.saveToFileStore(doc);

            // 生成下载 URL
            const downloadUrl = `${c.req.url.split("/text")[0]}/text/${
                doc.id
            }/download`;

            return c.json(
                {
                    data: {
                        ...doc,
                        download_url: downloadUrl,
                    },
                },
                201,
            );
        } catch (error) {
            console.error("创建文本文档失败:", error);
            return c.json({ error: "创建文本文档失败" }, 500);
        }
    },
);

// 搜索文本文档
filesRouter.get(
    "/text/search",
    zValidator("query", searchTextSchema),
    async (c) => {
        try {
            const userId = c.get("userId") as string;
            const query = c.req.valid("query");

            const results = await textStoreService.searchFileStore(
                query.q || "",
                {
                    userId,
                    limit: query.limit,
                    offset: query.offset,
                    sort: query.sort ? query.sort.split(",") : undefined,
                    filter: query.filter,
                },
            );

            return c.json({ data: results });
        } catch (error) {
            console.error("搜索文本文档失败:", error);
            return c.json({ error: "搜索文本文档失败" }, 500);
        }
    },
);

// 获取用户的文本文档列表
filesRouter.get("/text", async (c) => {
    try {
        const userId = c.get("userId") as string;
        const limit = c.req.query("limit")
            ? parseInt(c.req.query("limit")!)
            : 50;
        const offset = c.req.query("offset")
            ? parseInt(c.req.query("offset")!)
            : 0;

        const results = await textStoreService.getUserFiles(userId, {
            limit,
            offset,
        });

        return c.json({ data: results });
    } catch (error) {
        console.error("获取文本文档列表失败:", error);
        return c.json({ error: "获取文本文档列表失败" }, 500);
    }
});

// 根据ID获取单个文本文档
filesRouter.get("/text/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const userId = c.get("userId") as string;

        const doc = await textStoreService.getFileStore(id);

        if (!doc) {
            return c.json({ error: "文档不存在" }, 404);
        }

        // 检查文档是否属于当前用户
        if (doc.user_id !== userId) {
            return c.json({ error: "无权访问此文档" }, 403);
        }

        return c.json({ data: doc });
    } catch (error) {
        console.error("获取文本文档失败:", error);
        return c.json({ error: "获取文本文档失败" }, 500);
    }
});

// 更新文本文档
filesRouter.put(
    "/text/:id",
    zValidator("json", updateTextDocSchema),
    async (c) => {
        try {
            const id = c.req.param("id");
            const userId = c.get("userId") as string;
            const updates = c.req.valid("json");

            // 先检查文档是否存在且属于当前用户
            const existingDoc = await textStoreService.getFileStore(id);
            if (!existingDoc) {
                return c.json({ error: "文档不存在" }, 404);
            }

            if (existingDoc.user_id !== userId) {
                return c.json({ error: "无权修改此文档" }, 403);
            }

            await textStoreService.updateFileStore(id, updates);
            const updatedDoc = await textStoreService.getFileStore(id);

            return c.json({ data: updatedDoc });
        } catch (error) {
            console.error("更新文本文档失败:", error);
            return c.json({ error: "更新文本文档失败" }, 500);
        }
    },
);

// 删除文本文档
filesRouter.delete("/text/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const userId = c.get("userId") as string;

        // 先检查文档是否存在且属于当前用户
        const existingDoc = await textStoreService.getFileStore(id);
        if (!existingDoc) {
            return c.json({ error: "文档不存在" }, 404);
        }

        if (existingDoc.user_id !== userId) {
            return c.json({ error: "无权删除此文档" }, 403);
        }

        await textStoreService.deleteFileStore(id);
        return c.json({ data: { id, deleted: true } });
    } catch (error) {
        console.error("删除文本文档失败:", error);
        return c.json({ error: "删除文本文档失败" }, 500);
    }
});

// 下载文本文档
filesRouter.get("/text/:id/download", async (c) => {
    try {
        const id = c.req.param("id");
        const userId = c.get("userId") as string;

        const doc = await textStoreService.getFileStore(id);

        if (!doc) {
            return c.json({ error: "文档不存在" }, 404);
        }

        // 检查文档是否属于当前用户
        if (doc.user_id !== userId) {
            return c.json({ error: "无权访问此文档" }, 403);
        }

        // 设置响应头，支持文件下载
        const fileName = doc.filename || `text-document-${id}.txt`;
        // encodeURIComponent 用于处理中文和特殊字符的文件名
        const encodedFileName = encodeURIComponent(fileName);
        c.header("Content-Type", "text/plain; charset=utf-8");
        c.header(
            "Content-Disposition",
            `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
        );

        return c.text(doc.content);
    } catch (error) {
        console.error("下载文本文档失败:", error);
        return c.json({ error: "下载文本文档失败" }, 500);
    }
});

// ============================================================================
// ImageKit 文件上传 API
// ============================================================================

// ImageKit 上传请求验证
const imagekitUploadSchema = z.object({
    fileName: z.string().min(1, "文件名不能为空"),
    fileData: z.string().min(1, "文件数据不能为空"), // base64 编码的文件数据
    folder: z.string().optional(), // 可选的文件夹路径
});

// ImageKit 文件上传
filesRouter.post(
    "/upload/imagekit",
    zValidator("json", imagekitUploadSchema),
    async (c) => {
        try {
            const { fileName, fileData, folder } = c.req.valid("json");
            const userId = c.get("userId") as string;

            // 使用统一的 ImageKit 上传函数（自动保存到数据库）
            const { url: imageUrl, file: savedFile } = await uploadToImageKit(
                Buffer.from(fileData, "base64"), // base64 数据
                fileName,
                {
                    folder: folder || "/uploads", // 默认上传到 uploads 文件夹
                    tags: [`user:${userId}`], // 添加用户标签
                    saveToDb: true, // 启用自动数据库保存
                    dbOptions: {
                        userId: userId,
                        conversationId: null,
                        category: "imagekit",
                        isAiGen: false,
                    },
                },
            );

            return c.json(
                {
                    data: {
                        file: savedFile,
                        image_url: imageUrl,
                    },
                },
                201,
            );
        } catch (error) {
            console.error("ImageKit 上传失败:", error);
            return c.json({ error: "文件上传失败" }, 500);
        }
    },
);
