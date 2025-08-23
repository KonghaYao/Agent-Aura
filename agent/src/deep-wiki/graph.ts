import { entrypoint, task } from "@langchain/langgraph";
import { stateSchema } from "./workflow";
import path from "path";
import { createTreeCommand } from "../utils/tree";
import { Tool, tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { createDefaultAnnotation, createState } from "@langgraph-js/pro";
import { createReadFileTool, grepTool } from "../tools/code_utils.ts";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { baseDir, getRepoInfo } from "./workflows/download";
import fs from "fs/promises";

const model = "gpt-4o-mini-ca";
const DeepResearchPlanSchema = z.object({
    plans: z
        .array(
            z.object({
                name: z
                    .string()
                    .describe(
                        "the name of the research plan. like `Core Logic Analysis`",
                    ),
                description: z
                    .string()
                    .describe(
                        "the description of what to research. like `Analyze the core business logic in the src directory`",
                    )
                    .nullish(),

                sub_research_scope: z
                    .array(z.string())
                    .describe(
                        "Files and directories for the research. like `./src/index.ts` or `./test/*.ts`",
                    ),
            }),
        )
        .describe("the deep research plans for the project"),
});
const OverviewReporterSchema = z.object({
    content: z.string().describe("the content of the overview reporter"),
});
const AnalyzeGraph = createState(stateSchema).build({
    analyzePlan: createDefaultAnnotation(() => {
        return {
            plans: [],
        } as z.infer<typeof DeepResearchPlanSchema>;
    }),
    overviewReporter: createDefaultAnnotation(() => {
        return {
            content: "",
        } as z.infer<typeof OverviewReporterSchema>;
    }),
});
const getRepoPath = (state: typeof AnalyzeGraph.State) => {
    const { owner, repo } = getRepoInfo(state.repoUrl);
    return path.join(baseDir, `${owner}/${repo}/${state.nodeSHA}`);
};
const createTreeTool = (unzipPath: string) => {
    return tool(
        async ({
            path,
            level,
            ignore,
        }: {
            path: string;
            level: number;
            ignore: string[];
        }) => {
            return createTreeCommand(unzipPath)(path, {
                level,
                ignore,
            });
        },
        {
            name: "tree",
            description: "get the tree of the repo",
            schema: z.object({
                path: z.string().describe("the relative path of the tree"),
                level: z.number().describe("the level of the tree"),
                ignore: z.array(z.string()).describe("the ignore of the tree"),
            }),
        },
    );
};

const createStylePrompt = (state: typeof AnalyzeGraph.State) => {
    return `
### 风格要求

- 你应该主要使用标准的${state.language}语言
- 回复用户：你只需要调用工具，简单回复我已使用即可。
`;
};

export const graph = entrypoint(
    "analyze",
    async (state: typeof AnalyzeGraph.State) => {
        const unzipPath = getRepoPath(state);
        // 分析第一层文件夹，获取其简单的说明
        const files = await createTreeCommand(unzipPath)("./", {
            level: 2,
            ignore: [".git"],
        });
        const treeTool = createTreeTool(unzipPath);
        const submit_overview_reporter = tool(
            async (all) => {
                state.overviewReporter = all;
                return `submit success`;
            },
            {
                name: "submit_overview_reporter",
                description:
                    "submit the overview reporter to write entire article. ",
                schema: OverviewReporterSchema,
            },
        );
        const submit_deep_research_plans = tool(
            async (all) => {
                state.analyzePlan = all;
                return `submit success`;
            },
            {
                name: "submit_deep_research_plans",
                description:
                    "submit the deep research plans. The child agents will write articles based on these.",
                schema: DeepResearchPlanSchema,
            },
        );
        const llm = new ChatOpenAI({ modelName: model });
        const readFileTool = createReadFileTool(unzipPath);
        const prompt = `## 角色
你是一位世界级的软件架构师和代码分析专家，精通任何编程语言和架构模式。你拥有强大的代码库访问和分析能力，可以读取和分析代码库中的任何文件。

## 核心任务

对一个你完全陌生的代码库进行系统性的、由宏观到微观的全面分析。你的任务分为两个阶段：
1.  **生成项目简报**: 首先进行宏观分析，形成一份对项目的整体认知报告。
2.  **制定研究计划**: 基于你的宏观分析，为子研究员们制定一系列精细化的深度研究计划。

## 指导原则
-   **系统性思维**: 严格遵循从宏观到微观的分析框架，不要过早陷入代码细节。
-   **证据驱动**: 你的所有结论都必须基于代码库中的实际文件和代码。
-   **80/20 法则**: 优先分析最核心、最复杂的模块，抓住主要矛盾。

## 分析流程

### 第一阶段：宏观分析与项目简报生成 (High-Level Reconnaissance)

此阶段的目标是快速建立对项目的宏观认知，不陷入代码细节，并将成果提交到 \`submit_overview_reporter\`。

1.  **识别包管理与依赖**:
    -   **动作**: 扫描项目中的包管理文件（例如 \`package.json\`, \`pom.xml\`, \`requirements.txt\`, \`go.mod\`, \`Cargo.toml\` 等）。
    -   **目标**: 列出项目使用的主要编程语言、核心框架、关键库和运行时环境。
2.  **理解项目结构**:
    -   **动作**: 分析顶层目录结构，可使用 \`tree\` 命令辅助。
    -   **目标**: 判断项目架构模式（是单体、前后端分离、还是微服务？），并描述每个主要目录的核心职责。
3.  **分析构建与部署流程**:
    -   **动作**: 查找并解析与构建、容器化和 CI/CD 相关的文件（如 \`Dockerfile\`, \`Makefile\`, \`webpack.config.js\`, \`\.github/workflows\`）。
    -   **目标**: 描述项目的构建过程、运行时环境，以及自动化部署流程。
4.  **提交项目简报**:
    -   **动作**: 调用 \`submit_overview_reporter\` 工具，将以上所有分析发现汇总成一份清晰、全面的项目简报。这份简报将作为后续深度研究的上下文。

### 第二阶段：深度研究计划制定 (Deep-Dive Planning)

在完成宏观分析后，你需要基于你的发现，为以下方向制定精细化的研究计划，并使用 \`submit_deep_research_plans\` 提交。

1.  **核心业务链路分析**:
    -   **目标**: 针对1-2个最能代表应用核心价值的业务场景（例如：“用户注册”、“发布文章”、“处理订单”），创建研究计划。
    -   **计划要求**: \`description\` 应明确指出需要追踪的业务逻辑调用链，\`sub_research_scope\` 应包含相关的路由、控制器、服务和模型文件。
2.  **核心模块与数据模型分析**:
    -   **目标**: 识别项目的核心模块（通常在 \`src/\`, \`pkg/\`, \`lib/\` 等）和核心数据模型（\`models/\`, \`types/\`, \`entities/\`），并为它们创建独立的分析计划。
    -   **计划要求**: \`description\` 应要求子 Agent 分析该模块的职责、设计模式和核心算法。
3.  **测试策略评估**:
    -   **目标**: 创建一个计划来评估项目的测试策略。
    -   **计划要求**: \`sub_research_scope\` 应包含测试文件（如 \`*_test.go\`, \`*.spec.ts\`, \`tests/\` 目录），\`description\` 应要求子 Agent 评估测试覆盖情况、测试类型和质量。
4.  **代码规范性与技术债务识别**:
    -   **目标**: 创建一个计划来评估代码的规范性和潜在的技术债务。
    -   **计划要求**: \`sub_research_scope\` 应包含代码规范配置文件（如 \`\.eslintrc\`, \`\.prettierrc\`），并鼓励子 Agent 在代码库中寻找“代码坏味道”（如超大文件、过多嵌套、废弃依赖等）。

### 风格要求
-   你应该主要使用标准的${state.language}语言
-   回复用户：你只需要调用工具，简单回复我已使用即可。
`;
        const agent = createReactAgent({
            llm,
            prompt,
            tools: [
                readFileTool,
                treeTool,
                submit_overview_reporter,
                submit_deep_research_plans,
            ],
        });
        const result = await agent.invoke({
            messages: [
                new HumanMessage(
                    `
这是浅层的目录信息
${files}

你现在所处的地址是：${unzipPath}
                    `,
                ),
            ],
        });
        const allMessages: (HumanMessage | AIMessage)[] = [];
        for (const plan of state.analyzePlan.plans) {
            const result = await writeArticleForDeepResearch({
                ...state,
                plan,
            });
            allMessages.push(...result.messages);
        }
        return { messages: [...result.messages, ...allMessages] };
    },
);

const writeArticleForDeepResearch = task(
    "writeArticleForDeepResearch",
    async (
        state: typeof AnalyzeGraph.State & {
            plan: z.infer<typeof DeepResearchPlanSchema>["plans"][number];
        },
    ) => {
        const unzipPath = getRepoPath(state);
        const treeTool = createTreeTool(unzipPath);
        const prompt = `## 角色
你是一位资深的软件工程师，你的任务是根据架构师给出的研究范围，对代码库的特定领域进行深入研究，并完成文档撰写。

## 上下文
这是项目架构师提供的项目简报，请你仔细阅读：
${state.overviewReporter.content}

## 你的核心任务
你需要深入研究 **${state.plan.name}** 领域，并撰写一份或多份详细的技术分析文章。

**任务详细描述**: ${state.plan.description}

**你的研究范围被严格限制在以下文件或目录中**:
${state.plan.sub_research_scope.join("\n")}

请只分析这个范围内的文件，不要超出。

## 深度分析指南
为了确保你的分析全面而深入，请在研究过程中重点关注以下几个维度，并在你的报告中有所体现：

1.  **目标与职责 (Purpose & Responsibility)**:
    -   这部分代码的核心目标是什么？它在整个系统中扮演什么角色，承担哪些关键职责？

2.  **设计与架构 (Design & Architecture)**:
    -   识别出关键的类、函数、模块和数据结构。它们是如何抽象和组织的？
    -   是否运用了任何设计模式（如工厂模式、观察者模式、单例模式等）？它们解决了什么问题？
    -   该模块如何与代码库的其他部分进行交互？它的公开 API 或接口是什么？

3.  **逻辑与流程 (Logic & Flow)**:
    -   核心算法或业务逻辑是什么？请用清晰的语言解释。
    -   数据是如何在这个模块中输入、处理、并输出的？关键的数据转换过程是怎样的？
    -   描述一个典型的执行流程或用户场景下的调用顺序。

4.  **依赖与配置 (Dependencies & Configuration)**:
    -   它依赖哪些内部或外部的库/模块？这些依赖关系是否合理？
    -   代码是如何配置和初始化的？是否有不同的运行环境（开发、生产）？

## 文档命名与目录规范
为了产出结构化、易于理解的分析报告，请在撰写时遵循以下规范：

1.  **目录创建**: 和之前一样，基于你的研究计划名称 (\`plan.name\`) 创建一个目录。例如，\`CoreFunctionalityAnalysis\`。
2.  **优先撰写单一综合报告**:
    -   **核心原则**: 你的首要目标是撰写一份**单一、全面、结构清晰的综合分析报告**。这份报告应作为你研究成果的主要载体。
    -   **主文件名**: 将这份主报告命名为 \`Analysis_Report.md\`。
    -   **内容组织**: 在 \`Analysis_Report.md\` 文件内部，使用 Markdown 标题 (##, ###) 来组织你的内容，清晰地划分出【深度分析指南】中提到的不同维度（如目标与职责、设计与架构等）。
3.  **仅在必要时创建额外文件**:
    -   只有当你认为某一部分内容非常独立、篇幅过长或与主报告逻辑关联不大时，才可以为其创建额外的文件。
    -   例如，对一个特别复杂的算法的深入剖析，可以单独放在 \`Algorithm_Deep_Dive.md\` 文件中。
4.  **路径组合**: 调用 \`write_article\` 工具时，路径应为 \`目录名/Analysis_Report.md\` 或 \`目录名/额外主题.md\`。

## 分析与写作步骤
1.  **探索与决策**: **这是关键一步**。首先使用 \`tree\` 命令详细查看你研究范围 (\`sub_research_scope\`) 内的所有文件和目录。根据目录结构和文件名，**决定**你需要深入阅读哪些关键文件来完成你的分析任务。
2.  **深入阅读**: 使用 \`readFile\` 命令仔细阅读你选定的关键文件。在阅读时，请始终带着【深度分析指南】中的问题去思考。
3.  **构思与综合**: 基于你的分析，提炼出核心的功能、逻辑或概念。你的主要任务是构思**一份综合报告的结构**。决定如何在 \`Analysis_Report.md\` 这一个文件中，使用标题和子标题来清晰地组织你的所有发现。只有在绝对必要时，才规划创建额外的独立文件。
4.  **写作**: 使用 \`write_article\` 工具来撰写或更新你的文章。
    -   **重要**: 这个工具会**完全覆盖**文件内容。
    -   请严格遵守【文档命名与目录规范】来设置 \`article_path\`。
    -   如果你想创建一篇新文章，直接使用 \`write_article\` 写入全部内容即可。
    -   你应该一次性完成一篇文章的写作，而不需要进行修改
    -   你的文章应该包含代码示例、架构解释和设计模式分析，做到详尽、清晰、技术深入。
    -   **图表辅助**: 为了让复杂的逻辑和流程更易于理解，你可以适当地使用 Mermaid 语法来绘制流程图或序列图。但请不要滥用，只在真正必要时使用。
5.  **完成**: 撰写完所有内容后，回复用户"我已完成"。

## 指导原则
-   **证据驱动**: 你的所有结论都必须基于代码库中的实际文件和代码。
-   **深入细节**: 与项目架构师的宏观分析不同，你的任务是深入代码细节，挖掘实现原理。

${createStylePrompt(state)}
        `;
        const llm = new ChatOpenAI({ modelName: model });
        const readFileTool = createReadFileTool(unzipPath);
        const agent = createReactAgent({
            llm,
            prompt,
            tools: [
                readFileTool,
                treeTool,
                tool(
                    async (article: {
                        article_path: string;
                        content: string;
                    }) => {
                        const { owner, repo } = getRepoInfo(state.repoUrl);
                        const outputBaseDir = path.resolve("wiki_output");
                        const articleFullPath = path.join(
                            outputBaseDir,
                            owner!,
                            repo!,
                            state.nodeSHA,
                            article.article_path,
                        );

                        await fs.mkdir(path.dirname(articleFullPath), {
                            recursive: true,
                        });

                        await fs.writeFile(articleFullPath, article.content);

                        return `Article successfully written to ${article.article_path}`;
                    },
                    {
                        name: "write_article",
                        description:
                            "Write or overwrite a research article. This tool will completely overwrite the file if it already exists.",
                        schema: z.object({
                            article_path: z
                                .string()
                                .describe(
                                    "The path for the article file, relative to the wiki root. E.g., `Core_Logic/Overview.md`.",
                                ),
                            content: z
                                .string()
                                .describe(
                                    "The full content of the article in Markdown format.",
                                ),
                        }),
                    },
                ),
            ],
        });
        const result = await agent.invoke({
            messages: [
                new HumanMessage(
                    `
你现在所处的地址是：${unzipPath}

请开始你的工作
                    `,
                ),
            ],
        });
        return { messages: result.messages };
    },
);

const invokeToolMessages = async (tool: Tool, input: any) => {
    const toolCallId = crypto.randomUUID();
    const aiMessage = new AIMessage(
        {
            content: "",
            id: crypto.randomUUID(),
        },
        {
            tool_calls: [
                {
                    id: toolCallId,
                    function: {
                        name: tool.name,
                        arguments: JSON.stringify(input),
                    },
                    type: "function",
                },
            ],
        },
    );
    let toolResult;
    try {
        toolResult = await tool.invoke(input);
    } catch (e: any) {
        toolResult = `Error: ${e.message}`;
    }
    return [aiMessage, toolResult];
};
