import { UnionTool } from "@langgraph-js/sdk";
import { MCPServerConfig } from "../api/mcp/route";

export const listTools = async (config: Record<string, MCPServerConfig>) => {
    console.log("发送 MCP listTools 请求:", config);
    const response = await fetch("/api/mcp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ mcpConfig: config }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("收到 MCP listTools 响应:", result);
    return result;
};

export const callTool = async (
    config: Record<string, MCPServerConfig>,
    toolName: string,
    args: any,
) => {
    console.log("发送 MCP callTool 请求:", { toolName, args });
    const response = await fetch("/api/mcp", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ mcpConfig: config, toolName, args }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    console.log("收到 MCP callTool 响应:", result);
    return result;
};

/** 将 mcp 工具转为前端工具 */
export const mcpToFETools = async (
    config: Record<string, MCPServerConfig>,
): Promise<UnionTool<any, any, any>[]> => {
    console.log("开始转换 MCP 工具为前端工具");
    const mcpTools = await listTools(config);

    const tools = mcpTools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema || {},
        execute: async (args: any) => {
            return await callTool(config, tool.name, args);
        },
    }));

    console.log("MCP 工具转换完成:", tools.length, "个工具");
    return tools;
};
