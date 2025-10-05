import { MCPClient } from "mcp-client";
import { NextResponse } from "next/server";

export interface MCPServerConfig {
    url?: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
}

// 不会实现 stdio 模式的工具
class FEMCP {
    private toolCache = new Map<string, any>();
    private clientCache = new Map<string, MCPClient>();

    private async getClient(
        serverName: string,
        config: MCPServerConfig,
    ): Promise<MCPClient> {
        if (this.clientCache.has(serverName)) {
            return this.clientCache.get(serverName)!;
        }

        const client = new MCPClient({
            name: serverName,
            version: "1.0.0",
        });

        try {
            if (config.url) {
                // SSE connection
                await client.connect({
                    type: "sse",
                    url: config.url,
                });
            } else if (config.command) {
                // stdio connection
                await client.connect({
                    type: "stdio",
                    command: config.command,
                    args: config.args || [],
                    env: config.env || {},
                });
            } else {
                throw new Error(`Invalid config for server ${serverName}`);
            }

            this.clientCache.set(serverName, client);
            return client;
        } catch (error) {
            console.error(
                `Failed to connect to MCP server ${serverName}:`,
                error,
            );
            throw error;
        }
    }

    async listTools(config: Record<string, MCPServerConfig>) {
        const allTools = await Promise.all(
            Object.entries(config).map(async ([serverName, serverConfig]) => {
                try {
                    if (this.toolCache.has(serverName)) {
                        return this.toolCache.get(serverName);
                    }

                    const client = await this.getClient(
                        serverName,
                        serverConfig,
                    );
                    const tools = await client.getAllTools();
                    tools.forEach((i) => {
                        i.serverName = serverName;
                    });
                    this.toolCache.set(serverName, tools);
                    return tools;
                } catch (error) {
                    console.error(
                        `Error listing tools for server ${serverName}:`,
                        error,
                    );
                    return [];
                }
            }),
        );

        return allTools.flat();
    }

    async callTool(
        config: Record<string, MCPServerConfig>,
        toolName: string,
        args: any,
    ) {
        const tools = await this.listTools(config);
        const tool = tools.find((t) => t.name === toolName);
        if (!tool) {
            throw new Error(`Tool ${toolName} not found`);
        }
        const serverName = tool.serverName;
        const serverConfig = config[serverName];
        if (!serverConfig) {
            throw new Error(`Server ${serverName} not found in config`);
        }
        try {
            const client = await this.getClient(serverName, serverConfig);
            const result = await client.callTool({
                name: tool.name,
                arguments: args,
            });
            return result;
        } catch (error) {
            console.error(`Error calling tool ${toolName}:`, error);
            throw error;
        }
    }
}

const mcp = new FEMCP();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const mcpConfig = body.mcpConfig;
        const tools = await mcp.listTools(mcpConfig);
        return NextResponse.json(tools);
    } catch (error) {
        console.error("Error in POST /api/mcp:", error);
        return NextResponse.json(
            { error: "Failed to list tools" },
            { status: 500 },
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const mcpConfig = body.mcpConfig;
        const toolName = body.toolName;
        const args = body.args;
        const result = await mcp.callTool(mcpConfig, toolName, args);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in PUT /api/mcp:", error);
        return NextResponse.json(
            { error: "Failed to call tool" },
            { status: 500 },
        );
    }
}
