"use client";

import React, {
    createContext,
    useContext,
    ReactNode,
    useEffect,
    useState,
    useMemo,
    useRef,
    useCallback,
} from "react";
import { UnionTool } from "@langgraph-js/sdk";
import { useChat } from "@langgraph-js/sdk/react";
import {
    ask_user_for_approve,
    update_plan,
    web_search_tool,
    read_web_page_tool,
    image_generation,
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
    image_generation,
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

    // 从 localStorage 获取初始配置
    const getInitialConfig = () => {
        if (typeof window === "undefined") return {};
        try {
            const stored = localStorage.getItem("mcpConfig");
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    };

    const [mcpConfig, setMcpConfigState] =
        useState<Record<string, MCPServerConfig>>(getInitialConfig);
    const [mcpTools, setMcpTools] = useState<UnionTool<any, any, any>[]>([]);
    const [isLoadingMcpTools, setIsLoadingMcpTools] = useState(false);
    const [mcpToolsError, setMcpToolsError] = useState<string | null>(null);

    // 用于防止重复请求的 ref
    const loadingPromiseRef = useRef<Promise<void> | null>(null);
    const lastConfigHashRef = useRef<string>("");

    // 内置工具保持不变
    const builtinTools = useMemo(() => BUILTIN_TOOLS, []);

    // 合并所有工具
    const allTools = useMemo(() => {
        return [...builtinTools, ...mcpTools];
    }, [builtinTools, mcpTools]);

    // 设置 MCP 配置并保存到 localStorage
    const setMcpConfig = useCallback(
        (config: Record<string, MCPServerConfig>) => {
            setMcpConfigState(config);
            if (typeof window !== "undefined") {
                try {
                    localStorage.setItem("mcpConfig", JSON.stringify(config));
                } catch (error) {
                    console.error("保存 MCP 配置到 localStorage 失败:", error);
                }
            }
        },
        [],
    );

    // 生成配置的哈希值用于比较
    const getConfigHash = useCallback(
        (config: Record<string, MCPServerConfig>) => {
            return JSON.stringify(config);
        },
        [],
    );

    // 加载 MCP 工具（带去重机制）
    const loadMcpTools = useCallback(
        async (config: Record<string, MCPServerConfig>, force = false) => {
            const configHash = getConfigHash(config);

            // 如果配置没有变化且不是强制刷新，则跳过
            if (!force && configHash === lastConfigHashRef.current) {
                console.log("MCP 配置未变化，跳过请求");
                return;
            }

            // 如果已经有请求在进行中，等待它完成
            if (loadingPromiseRef.current) {
                console.log("MCP 请求已在进行中，等待完成");
                await loadingPromiseRef.current;
                return;
            }

            if (Object.keys(config).length === 0) {
                setMcpTools([]);
                setMcpToolsError(null);
                lastConfigHashRef.current = configHash;
                return;
            }

            console.log("开始加载 MCP 工具:", config);
            setIsLoadingMcpTools(true);
            setMcpToolsError(null);

            const loadPromise = (async () => {
                try {
                    const tools = await mcpToFETools(config);
                    setMcpTools(tools);
                    lastConfigHashRef.current = configHash;
                    console.log("MCP 工具加载成功:", tools);
                } catch (error) {
                    console.error("加载 MCP 工具失败:", error);
                    setMcpToolsError(
                        error instanceof Error ? error.message : "未知错误",
                    );
                    setMcpTools([]);
                } finally {
                    setIsLoadingMcpTools(false);
                    loadingPromiseRef.current = null;
                }
            })();

            loadingPromiseRef.current = loadPromise;
            await loadPromise;
        },
        [getConfigHash],
    );

    // 手动刷新 MCP 工具
    const refreshMcpTools = useCallback(async () => {
        console.log("手动刷新 MCP 工具");
        await loadMcpTools(mcpConfig, true);
    }, [mcpConfig, loadMcpTools]);

    // 当 MCP 配置变化时，重新加载工具
    useEffect(() => {
        loadMcpTools(mcpConfig);
    }, [mcpConfig, loadMcpTools]);

    // 当所有工具变化时，同步更新 chat 状态
    useEffect(() => {
        if (setTools) {
            console.log("更新 chat 工具:", allTools.length);
            setTools(allTools);
        }
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
