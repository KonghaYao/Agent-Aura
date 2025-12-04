import { AgentStoreItem } from "../../schema-agent/types";

export const deepResearchAgent: AgentStoreItem = {
    id: "deep-research-v2",
    protocolVersion: "1.0",
    name: "Deep Researcher V2",
    description:
        "An advanced research assistant that performs deep web searches, synthesizes information from multiple sources, and provides comprehensive reports with citations.",
    url: "https://example.com/agents/deep-researcher",
    iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=research",
    version: "2.0.0",
    documentationUrl: "https://docs.example.com/deep-researcher",
    systemPrompt: "",
    llm: [
        {
            provider: "openai",
            model: "gpt-4o-mini",
        },
    ],
    tools: [],
    subAgents: [],
    isActive: true,
    tags: ["research", "web-search", "synthesis"],
    createdAt: "2024-03-20T10:00:00Z",
    updatedAt: "2024-03-20T10:00:00Z",
    author: "AI Team",
};
