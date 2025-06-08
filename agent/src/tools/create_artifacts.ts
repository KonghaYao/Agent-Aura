import { tool } from "@langchain/core/tools";
import { z } from "zod";

const ArtifactsSchema = z.object({
    filename: z.string().describe("文件名"),
    filetype: z.string().describe("文件类型"),
    code: z.string().describe("代码"),
});

export const create_artifacts = tool(
    async () => {
        return "saved";
    },
    {
        name: "create_artifacts",
        description: "",
        schema: ArtifactsSchema,
    }
);
