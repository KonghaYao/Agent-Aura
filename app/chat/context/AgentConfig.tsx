import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { AgentStoreItem } from "@/app/agent-store/types";
import { AgentStoreService } from "@/app/agent-store/services/agentStoreService";
import { AgentProtocol } from "@/agent/schema-agent/types";
import { noneAgent } from "@/app/agent-store/mockData";

interface AgentConfigContextType {
    // 当前选中的 Agent
    currentAgent: AgentStoreItem | null;
    // 所有可用的 Agents
    availableAgents: AgentStoreItem[];
    // 选择 Agent
    selectAgent: (agentId: string) => void;
    // 清除选择
    clearAgent: () => void;
    // 重新加载 Agents 列表
    refreshAgents: () => Promise<void>;
    // 是否正在加载
    isLoading: boolean;
    // 获取当前 Agent 的 JSON 配置
    getCurrentAgentData: () => AgentProtocol | null;
}

const AgentConfigContext = createContext<AgentConfigContextType | undefined>(
    undefined,
);

const SELECTED_AGENT_KEY = "selected-agent-id";

interface AgentConfigProviderProps {
    children: ReactNode;
}

export function AgentConfigProvider({ children }: AgentConfigProviderProps) {
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [availableAgents, setAvailableAgents] = useState<AgentStoreItem[]>(
        [],
    );
    const [isLoading, setIsLoading] = useState(true);

    // 根据 ID 计算当前 Agent
    const currentAgent = selectedAgentId
        ? availableAgents.find((agent) => agent.id === selectedAgentId) || null
        : null;

    // 加载所有 Agents
    const refreshAgents = async () => {
        try {
            setIsLoading(true);
            const agents = await AgentStoreService.getAllAgents();
            // 只显示激活的 Agents
            const activeAgents = [
                noneAgent,
                ...agents.filter((agent) => agent.isActive),
            ];
            setAvailableAgents(activeAgents);

            // 如果有保存的选中 Agent ID，尝试恢复
            const savedAgentId = localStorage.getItem(SELECTED_AGENT_KEY);
            if (savedAgentId) {
                const savedAgent = activeAgents.find(
                    (agent) => agent.id === savedAgentId,
                );
                if (savedAgent) {
                    setSelectedAgentId(savedAgentId);
                } else {
                    // 如果保存的 Agent 不存在或未激活，清除保存的 ID
                    localStorage.removeItem(SELECTED_AGENT_KEY);
                    setSelectedAgentId(null);
                }
            }
        } catch (error) {
            console.error("Failed to load agents:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 选择 Agent
    const selectAgent = (agentId: string) => {
        const agent = availableAgents.find((a) => a.id === agentId);
        if (agent) {
            setSelectedAgentId(agentId);
            localStorage.setItem(SELECTED_AGENT_KEY, agentId);
        }
    };

    // 清除选择
    const clearAgent = () => {
        setSelectedAgentId(null);
        localStorage.removeItem(SELECTED_AGENT_KEY);
    };

    // 初始化加载
    useEffect(() => {
        refreshAgents();

        // 监听 storage 变化（当在其他标签页修改 Agent 时）
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "agent-store-data" || e.key === SELECTED_AGENT_KEY) {
                refreshAgents();
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const value: AgentConfigContextType = {
        currentAgent,
        availableAgents,
        selectAgent,
        clearAgent,
        refreshAgents,
        isLoading,
        getCurrentAgentData() {
            if (!currentAgent?.id) {
                return noneAgent;
            }
            return {
                ...currentAgent,
                subAgents: (currentAgent?.subAgents || [])
                    .map((config) => {
                        return {
                            protocolId: config.protocolId,
                            protocol: availableAgents.find(
                                (agent) => agent.id === config.protocolId,
                            ),
                        };
                    })
                    .filter((i) => i.protocol),
            };
        },
    };

    return (
        <AgentConfigContext.Provider value={value}>
            {children}
        </AgentConfigContext.Provider>
    );
}

// Hook 方便使用
export function useAgentConfig() {
    const context = useContext(AgentConfigContext);
    if (context === undefined) {
        throw new Error(
            "useAgentConfig must be used within an AgentConfigProvider",
        );
    }
    return context;
}
