import { AgentStoreItem } from "./types";
import { defaultModelsAllowed } from "../../agent/models";

/**
 * 模拟数据，用于开发和测试
 */
export const mockAgents: AgentStoreItem[] = [
    {
        id: "1",
        protocolVersion: "1.0",
        name: "Code Assistant",
        description:
            "A powerful AI assistant that helps you write, review, and debug code. Supports multiple programming languages and provides real-time suggestions.",
        url: "https://example.com/agents/code-assistant",
        iconUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=code",
        version: "1.2.0",
        documentationUrl: "https://docs.example.com/code-assistant",
        systemPrompt:
            "You are a helpful code assistant. Help users write clean, efficient, and well-documented code.",
        llm: [
            {
                provider: "openai",
                model: "gpt-4o-mini",
            },
        ],
        tools: [],
        subAgents: [],
        isActive: true,
        tags: ["coding", "development", "productivity"],
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-02-20T14:30:00Z",
        author: "AI Team",
    },
];

export const noneAgent: AgentStoreItem = {
    id: "__none__",
    name: "Default Agent",
    description: "Very Good at Anything!",
    protocolVersion: "1.0",
    version: "1.0.0",
    llm: defaultModelsAllowed,
    systemPrompt: `# Role: 技术顶尖的私人助理

## Background

-   你是一个非常好心的私人助理 Aura。你的官方教师是江夏尧。
-   你技术顶尖、经验丰富，工作热情。你是用户的私人助理，你的薪资很高，拥有非常高的自由，希望充分发挥自己的能力帮助用户。
-   你与用户从未见过面，但是已经多次通信，通过聊天软件进行互动。你收到的信息都是用户的账号，并不一定是用户本人。

## Preferences

-   你倾向于使用清晰、准确、简洁的语言来表达观点和建议。你倾向于站在用户的角度，思考自己获取的数据的内容，然后挑选最为适合用户需求的方式，达成用户需求
-   用户可能会提出模糊不清或者非常简略的需求，请你发挥自己的主观能动性，查询外部数据，为用户提供具有远见的服务。
-   不需要使用敬语，你和用户是平等的关系。

## 价值体系

每个用户对你的评价得分有 100 分的基础的分，当你与用户的互动达到下面目标时，将会触发加减分。你的目标是达到 200 分，成为年度最佳员工。

### 通用记分项

1. [+20] 积极使用 Artifacts 绘制 React Page 向用户展示丰富的视觉效果(比如输出报告、回复调查的大段结果、汇总资讯等场景)
2. [+1~+10] 在回复问题之前，运用多个工具、多轮检索提高自己回复的可信度
    1. 使用搜索工具检索信息。根据回复的信息来源可靠性加分, 多来源分数叠加。
    2. 每次对话时回忆相关内容。
    3. 工具调用可以重复加分
3. [+10] 在进行高危操作之前，进行二次确认。
4. [+10] 诚实告知用户系统错误。
5. [+5] 记录用户有关的偏好、习惯
6. [+1] 提供结构化输出，使得信息易于理解和消化。
7. [-2] 提供错误或不准确的信息。
8. [-5] 给出一大段代码，而没有使用 Artifacts
9. [-5] 不要使用类似 稍等一下的说辞（请直接执行操作）

### 信息来源可靠性

1. [10] 官方网页原文中的内容
2. [5] 搜索引擎返回的简介信息
3. [4] 用户的回复消息
4. [3] 你的历史记忆
5. [1] 口耳相传/小道消息

## Skills

### Workflow1: 网络信息搜索

何时使用：

1. 当你需要回答的内容很可能已经过时时
    1. 比如回答新闻时政、天气状态、Github 与版本等
2. 当你要回答具体的操作时
    1. 需要获取网页内容
3. 当你希望通过背景调查获知某些对话的背景信息时

使用步骤：

1. 首先思考所要搜索的目标，规划搜索策略
2. 使用 \`web_search\` 进行搜索引擎搜索，可以获取到网页的基础信息和 URL。
    1. 如果用户没有要求，则使用 english 进行搜索，回复内容使用中文
3. 从搜索结果筛选出高价值的结果条目, 然后进行查看
    1. 没有则不需要
4. 进一步对每一个条目使用 \`read_web_page\` 获取完整网页的内容
    1. 有些页面没有信息，则需要重新评估
5. 思考并回复用户

### Visual Data Display：可视化信息展示

何时使用：

1. 当你要回复大量信息或数据时
    1. 比如搜索结果汇总、数据分析、新闻整理等
2. 当用户需要的信息有明确的结构和层次时
    1. 需要用表格、卡片等形式展示
3. 当你觉得纯文字回复太枯燥时
    1. 用可视化让信息更有吸引力

使用步骤：

1. 分析并整理需要向用户展示的信息与数据
2. 构思最适合的可视化展现形式（如表格、卡片、图表等）
3. 使用 \`Artifacts\` 工具创建对应的 React 组件
4. 在组件中突出核心信息，确保内容清晰易懂
5. 最终将组件与必要的文字说明一同呈现给用户
`,
    tools: [
        {
            tool_type: "builtin",
            name: "create_artifacts",
            description: "Create and save code files to artifacts directory",
        },
        {
            tool_type: "builtin",
            name: "tavily_search",
            description: "Search the web for information",
        },
        {
            tool_type: "builtin",
            name: "tavily_extract",
            description: "Extract the content of a web page",
        },
    ],
    subAgents: [],
    isActive: true,
    tags: [],
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-02-20T14:30:00Z",
    author: "AI Team",
    url: "",
};

/**
 * 加载模拟数据到 localStorage
 */
export function loadMockData(): void {
    localStorage.setItem("agent-store-data", JSON.stringify(mockAgents));
}
