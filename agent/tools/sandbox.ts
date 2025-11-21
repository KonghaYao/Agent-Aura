import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Daytona } from "@daytonaio/sdk";
import { getThreadId } from "../utils/pro";

const daytona = new Daytona();

class SandboxManager {
    async getSandbox(id: string, language: string = "typescript") {
        return await daytona.findOne({ idOrName: id }).catch((e) => {
            return daytona.create({
                name: id,
                language,
            });
        });
    }
}

export const send_sandbox_file_to_user = tool(
    async (input, context) => {
        try {
            const sandbox = await new SandboxManager().getSandbox(
                getThreadId(context),
            );

            const content = await sandbox.fs.downloadFile(input.sandbox_path);

            const result = {
                success: true,
                message: `File sent from sandbox ${input.sandbox_path} `,
                sandbox_id: sandbox.id,
                size: content.length,
            };

            return [JSON.stringify(result)];
        } catch (error) {
            console.error("Send file to user error:", error);
            return [
                `Failed to send file to user: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            ];
        }
    },
    {
        name: "send_sandbox_file_to_user",
        description:
            "Download a file from sandbox and save it to the local file system.",
        schema: z.object({
            sandbox_path: z
                .string()
                .describe("The path of the file in the sandbox to download"),
        }),
    },
);

export const run_sandbox_code = tool(
    async (input, context) => {
        try {
            const sandbox = await new SandboxManager().getSandbox(
                getThreadId(context),
                input.language,
            );

            const response = await sandbox.process.codeRun(input.code);

            return [response.result];
        } catch (error) {
            console.error("Run code error:", error);
            return [
                `Failed to run code: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            ];
        }
    },
    {
        name: "run_sandbox_code",
        description: `
Execute code in a secure sandbox environment. The sandbox is automatically created and cleaned up after execution.
                    
For downloading file to sandbox, you can write code to fetch it`,
        schema: z.object({
            code: z.string().describe("The code to execute in the sandbox"),
            language: z
                .string()
                .default("typescript")
                .describe(
                    "The programming language environment for the sandbox",
                ),
        }),
    },
);
