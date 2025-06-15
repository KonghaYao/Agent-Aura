"use client";

import React, {
    createContext,
    useContext,
    ReactNode,
    useEffect,
    useState,
    useMemo,
} from "react";
import { UnionTool } from "@langgraph-js/sdk";
import { useChat } from "./ChatContext";
import {
    ask_user_for_approve,
    update_plan,
    web_search_tool,
    read_web_page_tool,
} from "../tools/index";
import { create_artifacts } from "../tools/create_artifacts";
import { mcpToFETools } from "@/app/fe_mcp";
import { MCPServerConfig } from "@/app/api/mcp/route";

// 内置工具列表
const BUILTIN_TOOLS = [
    create_artifacts,
    web_search_tool,
    ask_user_for_approve,
    update_plan,
    read_web_page_tool,
];

interface ToolsContextType {
    builtinTools: UnionTool<any, any, any>[];
    mcpTools: UnionTool<any, any, any>[];
    allTools: UnionTool<any, any, any>[];
    mcpConfig: Record<string, MCPServerConfig>;
    setMcpConfig: (config: Record<string, MCPServerConfig>) => void;
    isLoadingMcpTools: boolean;
    mcpToolsError: string | null;
    refreshMcpTools: () => Promise<void>;
}

const ToolsContext = createContext<ToolsContextType | undefined>(undefined);

export const useTools = () => {
    const context = useContext(ToolsContext);
    if (context === undefined) {
        throw new Error("useTools must be used within a ToolsProvider");
    }
    return context;
};

interface ToolsProviderProps {
    children: ReactNode;
}

export const ToolsProvider: React.FC<ToolsProviderProps> = ({ children }) => {
    const { setTools } = useChat();

    const [mcpConfig, setMcpConfig] = useState<Record<string, MCPServerConfig>>(
        {
            langgraph_docs: {
                url: "https://gitmcp.io/langchain-ai/langgraph",
            },
        },
    );
    const [mcpTools, setMcpTools] = useState<UnionTool<any, any, any>[]>([]);
    const [isLoadingMcpTools, setIsLoadingMcpTools] = useState(false);
    const [mcpToolsError, setMcpToolsError] = useState<string | null>(null);

    // 内置工具保持不变
    const builtinTools = useMemo(() => BUILTIN_TOOLS, []);

    // 合并所有工具
    const allTools = useMemo(() => {
        return [...builtinTools, ...mcpTools];
    }, [builtinTools, mcpTools]);

    // 加载 MCP 工具
    const loadMcpTools = async (config: Record<string, MCPServerConfig>) => {
        if (Object.keys(config).length === 0) {
            setMcpTools([]);
            setMcpToolsError(null);
            return;
        }

        setIsLoadingMcpTools(true);
        setMcpToolsError(null);

        try {
            const tools = await mcpToFETools(config);
            setMcpTools(tools);
        } catch (error) {
            console.error("加载 MCP 工具失败:", error);
            setMcpToolsError(
                error instanceof Error ? error.message : "未知错误",
            );
            setMcpTools([]);
        } finally {
            setIsLoadingMcpTools(false);
        }
    };

    // 手动刷新 MCP 工具
    const refreshMcpTools = async () => {
        await loadMcpTools(mcpConfig);
    };

    // 当 MCP 配置变化时，重新加载工具
    useEffect(() => {
        loadMcpTools(mcpConfig);
    }, [mcpConfig]);

    // 当所有工具变化时，同步更新 chat 状态
    useEffect(() => {
        console.log("allTools", allTools);
        setTools(allTools);
    }, [allTools, setTools]);

    const value: ToolsContextType = {
        builtinTools,
        mcpTools,
        allTools,
        mcpConfig,
        setMcpConfig,
        isLoadingMcpTools,
        mcpToolsError,
        refreshMcpTools,
    };

    return (
        <ToolsContext.Provider value={value}>{children}</ToolsContext.Provider>
    );
};
