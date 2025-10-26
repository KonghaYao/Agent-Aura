import { AgentStoreItem } from "../types";

const STORAGE_KEY = "agent-store-data";

/**
 * Agent Store 服务层
 * 负责 Agent 数据的持久化和管理
 */
export class AgentStoreService {
    /**
     * 获取所有 agents
     */
    static async getAllAgents(): Promise<AgentStoreItem[]> {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return [];
            return JSON.parse(data);
        } catch (error) {
            console.error("Failed to load agents:", error);
            return [];
        }
    }

    /**
     * 根据 ID 获取单个 agent
     */
    static async getAgentById(id: string): Promise<AgentStoreItem | null> {
        const agents = await this.getAllAgents();
        return agents.find((agent) => agent.id === id) || null;
    }

    /**
     * 创建新 agent
     */
    static async createAgent(agent: AgentStoreItem): Promise<AgentStoreItem> {
        const agents = await this.getAllAgents();
        const newAgent: AgentStoreItem = {
            ...agent,
            id: agent.id || crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        agents.push(newAgent);
        await this.saveAgents(agents);
        return newAgent;
    }

    /**
     * 更新 agent
     */
    static async updateAgent(
        id: string,
        updates: Partial<AgentStoreItem>,
    ): Promise<AgentStoreItem | null> {
        const agents = await this.getAllAgents();
        const index = agents.findIndex((agent) => agent.id === id);

        if (index === -1) return null;

        agents[index] = {
            ...agents[index],
            ...updates,
            id, // 确保 ID 不变
            updatedAt: new Date().toISOString(),
        };

        await this.saveAgents(agents);
        return agents[index];
    }

    /**
     * 删除 agent
     */
    static async deleteAgent(id: string): Promise<boolean> {
        const agents = await this.getAllAgents();
        const filtered = agents.filter((agent) => agent.id !== id);

        if (filtered.length === agents.length) return false;

        await this.saveAgents(filtered);
        return true;
    }

    /**
     * 保存所有 agents
     */
    private static async saveAgents(agents: AgentStoreItem[]): Promise<void> {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
        } catch (error) {
            console.error("Failed to save agents:", error);
            throw error;
        }
    }

    /**
     * 导出 agents 数据
     */
    static async exportAgents(): Promise<string> {
        const agents = await this.getAllAgents();
        return JSON.stringify(agents, null, 2);
    }

    /**
     * 导入 agents 数据
     */
    static async importAgents(jsonData: string): Promise<AgentStoreItem[]> {
        try {
            const agents = JSON.parse(jsonData) as AgentStoreItem[];
            await this.saveAgents(agents);
            return agents;
        } catch (error) {
            console.error("Failed to import agents:", error);
            throw error;
        }
    }

    /**
     * 清空所有数据
     */
    static async clearAll(): Promise<void> {
        localStorage.removeItem(STORAGE_KEY);
    }

    /**
     * 搜索 agents
     */
    static async searchAgents(query: string): Promise<AgentStoreItem[]> {
        const agents = await this.getAllAgents();
        const lowerQuery = query.toLowerCase();

        return agents.filter((agent) => {
            return (
                agent.name.toLowerCase().includes(lowerQuery) ||
                agent.description.toLowerCase().includes(lowerQuery) ||
                agent.tags?.some((tag) =>
                    tag.toLowerCase().includes(lowerQuery),
                )
            );
        });
    }

    /**
     * 按标签过滤
     */
    static async filterByTag(tag: string): Promise<AgentStoreItem[]> {
        const agents = await this.getAllAgents();
        return agents.filter((agent) => agent.tags?.includes(tag));
    }

    /**
     * 获取所有标签
     */
    static async getAllTags(): Promise<string[]> {
        const agents = await this.getAllAgents();
        const tagsSet = new Set<string>();

        agents.forEach((agent) => {
            agent.tags?.forEach((tag) => tagsSet.add(tag));
        });

        return Array.from(tagsSet).sort();
    }

    /**
     * 复制 agent
     */
    static async duplicateAgent(id: string): Promise<AgentStoreItem | null> {
        const agent = await this.getAgentById(id);
        if (!agent) return null;

        const duplicated: AgentStoreItem = {
            ...agent,
            id: crypto.randomUUID(),
            name: `${agent.name} (副本)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return this.createAgent(duplicated);
    }
}
