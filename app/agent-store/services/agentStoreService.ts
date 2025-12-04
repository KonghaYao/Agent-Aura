import { AgentStoreItem } from "../types";

const API_BASE_URL = "/api/agents";

/**
 * Agent Store 服务层
 * 负责 Agent 数据的持久化和管理
 */
export class AgentStoreService {
    /**
     * 获取所有 agents，支持搜索和分页
     */
    static async getAllAgents(
        query?: string,
        limit: number = 50,
        offset: number = 0,
    ): Promise<{ data: AgentStoreItem[]; total: number }> {
        try {
            const params = new URLSearchParams();
            if (query) {
                params.append("q", query);
            }
            params.append("limit", limit.toString());
            params.append("offset", offset.toString());

            const response = await fetch(
                `${API_BASE_URL}?${params.toString()}`,
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Failed to load agents:", error);
            throw error;
        }
    }

    /**
     * 根据 ID 获取单个 agent
     */
    static async getAgentById(id: string): Promise<AgentStoreItem | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`);
            if (response.status === 404) return null;
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error(`Failed to get agent ${id}:`, error);
            throw error;
        }
    }

    /**
     * 创建新 agent
     */
    static async createAgent(agent: AgentStoreItem): Promise<AgentStoreItem> {
        try {
            const response = await fetch(API_BASE_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(agent),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error("Failed to create agent:", error);
            throw error;
        }
    }

    /**
     * 更新 agent
     */
    static async updateAgent(
        id: string,
        updates: Partial<AgentStoreItem>,
    ): Promise<AgentStoreItem | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error(`Failed to update agent ${id}:`, error);
            throw error;
        }
    }
}
