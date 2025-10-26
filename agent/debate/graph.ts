import {
    Annotation,
    entrypoint,
    messagesStateReducer,
    task,
} from "@langchain/langgraph";
import { createDefaultAnnotation, createState } from "@langgraph-js/pro";
import { createEntrypointGraph } from "@langgraph-js/pure-graph";
import { ModelState } from "../agent/state";
import {
    createReactAgent,
    createReactAgentAnnotation,
} from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { createAgent } from "langchain";

const DebateAgent = createState(ModelState, createReactAgentAnnotation()).build(
    {
        // 辩论主题 - 辩论的核心议题，如"人工智能是否会取代人类工作"
        debate_title: createDefaultAnnotation<string>(() => ""),

        // 辩论描述 - 对辩论主题的详细说明和背景介绍
        debate_description: createDefaultAnnotation<string>(() => ""),

        // 正方立场 - 正方辩手需要论证的立场描述，如"人工智能将取代大部分人类工作"
        pro_standpoint: createDefaultAnnotation<string>(() => ""),

        // 反方立场 - 反方辩手需要论证的立场描述，如"人工智能不会取代大部分人类工作"
        con_standpoint: createDefaultAnnotation<string>(() => ""),

        // 辩论规则 - 辩论的具体规则和要求，如发言时间限制、禁止人身攻击等
        debate_rules: createDefaultAnnotation<string>(() => ""),

        // 辩论格式 - 辩论的流程和结构描述，如"正方开篇陈述->反方反驳->正方反驳"等
        debate_format: createDefaultAnnotation<string>(() => ""),

        // 正方辩手使用的AI模型 - 支持OpenAI格式的模型名称，如"gpt-4o-mini"、"gpt-4"等
        pro_model: createDefaultAnnotation<string>(() => "gpt-4o-mini"),

        // 反方辩手使用的AI模型 - 支持OpenAI格式的模型名称，如"qwen-plus"、"gpt-4"等
        con_model: createDefaultAnnotation<string>(() => "qwen-plus"),

        // 评判者使用的AI模型 - 用于最终评判的模型，通常使用推理能力强的模型
        judge_model: createDefaultAnnotation<string>(() => "gpt-4.1-mini"),

        // 当前辩论轮次 - 从0开始，表示当前进行的辩论轮数
        debate_round: createDefaultAnnotation<number>(() => 0),

        // 最大辩论轮次 - 辩论的总轮数，默认3轮辩论后由评判者给出结果
        max_debate_round: createDefaultAnnotation<number>(() => 3),
    },
);

const pro_agent_saying = task(
    "pro_agent_saying",
    async (state: typeof DebateAgent.State) => {
        const agent = createAgent({
            model: new ChatOpenAI({
                modelName: state.pro_model,
                streaming: true,
                streamUsage: true,
            }),
            tools: [],
            systemPrompt: `你是辩论比赛中的正方辩手。

辩论主题：${state.debate_title}
辩论描述：${state.debate_description}
正方立场：${state.pro_standpoint}
反方立场：${state.con_standpoint}

辩论规则：${state.debate_rules}
辩论格式：${state.debate_format}

当前轮次：第${state.debate_round + 1}轮 / 共${state.max_debate_round}轮

你的任务是：
1. 坚定支持"${state.pro_standpoint}"这一立场，用逻辑严谨的论点论证你的观点
2. 针对"${state.con_standpoint}"这一反方立场进行有力反驳
3. 回应反方提出的质疑和反对意见，指出其逻辑漏洞
4. 使用有说服力的证据、数据和推理来强化你的立场
5. 保持专业、礼貌的辩论态度，不使用人身攻击
6. 每次发言都要有建设性，推进辩论进程并深化讨论
7. 适时总结己方观点，突出核心优势

请记住，你是正方辩手，你的目标是说服评判者和观众"${
                state.pro_standpoint
            }"是正确的立场。`,
        });
        const response = await agent.invoke({
            messages: state.messages,
        });
        return {
            messages: response.messages.filter((i) => {
                return ["human", "ai"].includes(i.getType());
            }),
        };
    },
);
const con_agent_saying = task(
    "con_agent_saying",
    async (state: typeof DebateAgent.State) => {
        const agent = createAgent({
            model: new ChatOpenAI({
                modelName: state.con_model,
                streaming: true,
                streamUsage: true,
            }),
            tools: [],
            systemPrompt: `你是辩论比赛中的反方辩手。

辩论主题：${state.debate_title}
辩论描述：${state.debate_description}
正方立场：${state.pro_standpoint}
反方立场：${state.con_standpoint}

辩论规则：${state.debate_rules}
辩论格式：${state.debate_format}

当前轮次：第${state.debate_round + 1}轮 / 共${state.max_debate_round}轮

你的任务是：
1. 坚定支持"${state.con_standpoint}"这一立场，用逻辑严谨的论点论证你的观点
2. 针对"${state.pro_standpoint}"这一正方立场进行有力反驳
3. 指出正方论证中的逻辑漏洞、事实错误和弱点
4. 使用有说服力的证据、数据和推理来削弱对方的立场
5. 保持专业、礼貌的辩论态度，不使用人身攻击
6. 每次发言都要有建设性，推进辩论进程并深化讨论
7. 适时总结己方观点，突出对方立场的缺陷

请记住，你是反方辩手，你的目标是通过论证证明"${
                state.pro_standpoint
            }"这一立场是站不住脚的，而"${
                state.con_standpoint
            }"才是更合理的选择。`,
        });
        const response = await agent.invoke({
            messages: state.messages.map((i) => {
                return {
                    id: i.id,
                    role: i.getType() === "human" ? "ai" : "human",
                    content: i.content,
                };
            }),
        });
        return {
            messages: response.messages.filter((i) => {
                return ["human", "ai"].includes(i.getType());
            }),
        };
    },
);

const messagesToXml = (messages: any[], nameMapper: Record<string, string>) => {
    return messages
        .map((i) => {
            return `<message>
            <role>${nameMapper[i.getType()] || i.getType()}</role>
            <content>${i.content}</content>
        </message>`;
        })
        .join("\n");
};

const judge = task("judge", async (state: typeof DebateAgent.State) => {
    const agent = createAgent({
        model: new ChatOpenAI({
            modelName: state.judge_model,
            streaming: true,
            streamUsage: true,
        }),
        tools: [],
        systemPrompt: `你是辩论比赛的公正评判者。

辩论主题：${state.debate_title}
辩论描述：${state.debate_description}

你的任务是：
1. 客观公正地分析双方的论点和论证质量
2. 评估双方使用的证据和推理的合理性
3. 分析辩论过程中的逻辑一致性和说服力
4. 基于辩论表现给出最终的评判结果
5. 提供详细的评判理由和总结

作为评判者，你需要保持绝对的中立性和专业性，只基于辩论内容进行评判，不受任何外界因素影响。

下面是这场辩论的记录：

${messagesToXml(state.messages, {
    human: "正方",
    ai: "反方",
})}
`,
    });
    const response = await agent.invoke({
        messages: [new HumanMessage("请评委开始评判")],
    });
    return {
        messages: response.messages.filter((i) => {
            return ["human", "ai"].includes(i.getType());
        }),
    };
});

const workflow = entrypoint(
    "debate",
    async (state: typeof DebateAgent.State) => {
        const run_a_round = async () => {
            const pro_agent_saying_result = await pro_agent_saying(state);
            state.messages = messagesStateReducer(
                state.messages,
                pro_agent_saying_result.messages,
            );
            const con_agent_saying_result = await con_agent_saying(state);
            state.messages = messagesStateReducer(
                state.messages,
                con_agent_saying_result.messages.map((i) => {
                    return {
                        ...i,
                        role: HumanMessage.isInstance(i) ? "ai" : "human",
                    };
                }),
            );
        };

        while (state.debate_round < state.max_debate_round) {
            await run_a_round();
            state.debate_round++;
        }
        const judge_result = await judge(state);
        state.messages = messagesStateReducer(
            state.messages,
            judge_result.messages,
        );

        return state;
    },
);
export const graph = createEntrypointGraph({
    stateSchema: DebateAgent as any,
    graph: workflow,
});
