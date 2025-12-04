import { AgentStoreItem } from "../schema-agent/types";
import { deepResearchAgent } from "./agents/deepResearch";
import { noneAgent } from "./agents/noneAgent";
import { imageAgent } from "./agents/imageAgent";

/**
 * 模拟数据，用于开发和测试
 */
export const AgentSchemaList: AgentStoreItem[] = [
    noneAgent,
    deepResearchAgent,
    imageAgent,
];
