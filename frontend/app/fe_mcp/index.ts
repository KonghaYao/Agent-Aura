import { UnionTool } from "@langgraph-js/sdk";
import { MCPServerConfig } from "../api/mcp/route";

export const listTools = async (config: Record<string, MCPServerConfig>) => {
    const tools = await fetch("/api/mcp", {
        method: "POST",
        body: JSON.stringify({ mcpConfig: config }),
    });
    return tools.json();
};

export const callTool = async (
    config: Record<string, MCPServerConfig>,
    toolName: string,
    args: any,
) => {
    const result = await fetch("/api/mcp", {
        method: "PUT",
        body: JSON.stringify({ mcpConfig: config, toolName, args }),
    });
    return result.text();
};

/** 将 mcp 工具转为前端工具 */
export const mcpToFETools = async (
    config: Record<string, MCPServerConfig>,
): Promise<UnionTool<any, any, any>[]> => {
    const mcpTools = await listTools(config);
    return mcpTools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema.$schema ? tool.inputSchema : {},
        isPureParams: true,
        execute: async (args: any) => {
            return await callTool(config, tool.name, args);
        },
    }));
};
