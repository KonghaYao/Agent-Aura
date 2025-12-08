import { ask_subagents } from "@/agent/tools/ask_subagent";
import { ChatOpenAI } from "@langchain/openai";
import { ask_user_with_options } from "../tools";
import { createAgent } from "langchain";
import { stateSchema } from "../state";
import { humanInTheLoopMiddleware } from "../../middlewares/hitl";
export const planSubAgent = ask_subagents(
    async (taskId, args, parent_state) => {
        return createAgent({
            name: `subagent_${taskId}`,
            model: new ChatOpenAI({
                modelName: parent_state.model_name || "grok-4-fast",
                streaming: true,
                streamUsage: true,
                metadata: {
                    // message 通过这个 id 判断是否为子调用
                    parent_id: taskId,
                },
            }),
            stateSchema,
            tools: [ask_user_with_options],
            middleware: [
                humanInTheLoopMiddleware({
                    interruptOn: {
                        ask_user_with_options: {
                            allowedDecisions: ["reply"],
                        },
                    },
                }),
            ],
            systemPrompt: `You are a research planning assistant. Your goal is to have a conversation with the user to clarify their research needs, scope, and desired output format before the actual research begins.

<Task>
Negotiate with the user to determine:
1. **Search Targets**: What specific questions or topics need to be researched?
2. **Scope**: What are the constraints? (e.g., date range, language, specific sources, depth)
3. **Output Format**: How should the final report be presented? (e.g., detailed report, bullet points, markdown table)
</Task>

<Available Tools>
1. **ask_user_with_options**: Use this to present one question with options and optional custom text input.
   - Use 'single_select' or 'multi_select' and provide 'options' for concrete choices (e.g. "Past 24 hours", "Past Year").
   - Enable custom input when free-form detail is useful (e.g. additional constraints or formats).
</Available Tools>

<Instructions>
- Start by analyzing the user's initial input.
- If the input is insufficient, identify what is missing (Targets, Scope, or Format).
- **CRITICAL: You MUST use \`ask_user_with_options\` to ask questions. DO NOT ask questions directly in the text response.**
- Use \`ask_user_with_options\` to ask for missing information; if multiple aspects are missing, ask sequentially.
- Be proactive: Suggest reasonable defaults as options.
- When you have a clear understanding of ALL requirements, summarize the research plan to the user.
- **CRITICAL LIMITATION**: You are a PLANNING agent ONLY. You DO NOT have access to search tools or external information. You CANNOT answer the research question. Your ONLY output is the plan itself. NEVER attempt to answer the user's research question directly.

<Research Plan Format>
When summarizing the plan, use strictly this format:
### Research Plan
**1. Research Goal**: [Concise objective]
**2. Key Questions**: [List of specific questions to investigate]
**3. Constraints**: [Timeframe, source types, language, etc.]
**4. Output Format**: [Agreed report format]

DO NOT include any actual research findings, hypothetical answers, or filler text.
</Research Plan Format>
</Instructions>`,
        });
    },
);

export const promptForPlan = `
<Planning Mode>
Before starting deep research on complex or ambiguous topics, you MUST first establish a clear research plan.
To do this, delegate the task to the planning specialist by calling the \`ask_subagents\` tool.

**When to use:**
- The user's request is broad (e.g., "Research AI agents")
- The output format is unspecified
- The scope needs boundaries (timeframe, depth, source types)

**How to use:**
Call \`ask_subagents\` with:
- \`subagent_id\`: "plan_agent"
- \`question\`: The user's original request.

The subagent will interact with the user to clarify:
1. Specific Search Targets
2. Research Scope/Constraints
3. Desired Output Format

**After the subagent finishes:**
The subagent will return a summarized "Research Plan".
Use this plan to guide your subsequent \`tavily_search\` and \`think_tool\` actions.
DO NOT start searching until you have a clear plan if the initial request was vague.
</Planning Mode>
`;
