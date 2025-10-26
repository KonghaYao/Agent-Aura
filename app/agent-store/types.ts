import { AgentProtocol } from "../../agent/schema-agent/types";

export interface AgentStoreItem extends AgentProtocol {
    // 额外的元数据
    createdAt?: string;
    updatedAt?: string;
    author?: string;
    tags?: string[];
    isActive?: boolean;
}

export interface AgentStoreState {
    agents: AgentStoreItem[];
    selectedAgent: AgentStoreItem | null;
    isEditDialogOpen: boolean;
}

export interface AgentFormData extends AgentProtocol {}
