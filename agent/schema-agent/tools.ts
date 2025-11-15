import { AgentProtocol } from "./types";
import { ClientTool } from "@langchain/core/tools";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import * as tavily from "../tools/tavily";
import { create_artifacts } from "../tools/create_artifacts";

const prebuiltTools: Record<string, ClientTool> = {
    ...tavily,
    create_artifacts: create_artifacts,
} as any;

export const createPrebuiltTools = async (
    protocol: AgentProtocol,
): Promise<ClientTool[]> => {
    const PrebuiltConfigs = protocol.tools.filter(
        (i) => i.tool_type === "builtin",
    );
    if (PrebuiltConfigs.length === 0) {
        return [];
    }
    return PrebuiltConfigs.map((i) => prebuiltTools[i.name]);
};

export const createMCPTools = async (
    protocol: AgentProtocol,
): Promise<ClientTool[]> => {
    const MCPConfigs = protocol.tools.filter((i) => i.tool_type === "mcp");
    if (MCPConfigs.length === 0) {
        return [];
    }
    const client = new MultiServerMCPClient({
        mcpServers: Object.fromEntries(
            MCPConfigs.map((i) => [
                i.name,
                {
                    url: i.url,
                    headers: i.headers,
                },
            ]),
        ),
    });
    return client.getTools() as Promise<ClientTool[]>;
};

export const createTools = async (
    protocol: AgentProtocol,
): Promise<ClientTool[]> => {
    return [
        ...(await createMCPTools(protocol)),
        ...(await createPrebuiltTools(protocol)),
    ];
};
