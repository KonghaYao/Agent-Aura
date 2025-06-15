import { tool } from "@langchain/core/tools";
import { z } from "zod";

const ArtifactsSchema = z.object({
    filename: z.string().describe("文件名"),
    filetype: z.string().describe("文件类型"),
    code: z.string().describe("代码，without markdown fence block"),
});

export const create_artifacts = tool(
    async () => {
        return "saved success";
    },
    {
        name: "create_artifacts",
        description: "创建一个 Artifacts 文件",
        schema: ArtifactsSchema,
    },
);
