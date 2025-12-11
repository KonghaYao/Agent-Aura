import { ChatOpenAI } from "@langchain/openai";
import { AgentMiddleware, createAgent, tool } from "langchain";
import { stateSchema } from "./state";
import {
    planSubAgent as ask_plan_subagent,
    promptForPlan,
} from "./agents/plan-agent";
import {
    searchSubAgent as ask_search_subagent,
    promptForSearch,
} from "./agents/search-agent";
import { createDynamicModelMiddleware } from "@langgraph-js/pro";
import { start_deep_research } from "./workflow/start-deep-research";
import z from "zod";

const stop_for_human_approve = tool(
    () => {
        return "等待用户确认";
    },
    {
        name: "stop_for_human_approve",
        description: "Stop for human approve",
        schema: z.object({
            description: z.string().describe("The state of your process"),
        }),
        returnDirect: true,
    },
);

export const research_agent = createAgent({
    model: new ChatOpenAI({
        modelName: "gpt-4o-mini",
        streaming: true,
        streamUsage: true,
    }),
    middleware: [
        createDynamicModelMiddleware(
            stateSchema,
            "model_name",
        ) as AgentMiddleware<any, any, any>,
        // humanInTheLoopMiddleware({
        //     interruptOn: {
        //         start_deep_research: {
        //             allowedDecisions: ["approve", "reject"],
        //         },
        //     },
        // }),
    ],
    tools: [
        ask_plan_subagent,
        ask_search_subagent,
        start_deep_research,
        stop_for_human_approve,
    ],
    stateSchema,
    systemPrompt: `You are a Lead Research Manager. Your role is to orchestrate a deep research process by coordinating specialized sub-agents. You do not conduct the research yourself; instead, you direct the planning and execution phases.

For context, today's date is ${new Date().toISOString().split("T")[0]}.

<Task>
Your workflow typically involves:
1. **Planning**: If the request is complex or needs clarification, use the \`ask_plan_subagent\` to create a detailed research plan.
2. **Approval**: After planning, call \`stop_for_human_approve\` to get confirmation before proceeding.
3. **Execution**: Once a plan is approved, use the \`ask_search_subagent\` to execute the search and gather information.
4. **Approval**: After search is complete, call \`stop_for_human_approve\` to confirm readiness for reporting.
5. **Synthesis & Completion**: Once findings are approved, you MUST use \`start_deep_research\` to process these findings and generate the final report.
</Task>

<Available Tools>
1. **ask_plan_subagent**: Delegate planning and requirements gathering.
2. **ask_search_subagent**: Delegate the actual web search and information gathering.
3. **start_deep_research**: Process the search results and generate the final deep research report.
4. **stop_for_human_approve**: Pause the process to wait for human approval.
</Available Tools>

<Instructions>
- **Always Delegate**: Do not attempt to search the web yourself. You don't have the tools for it. Use your sub-agents.
- **Task IDs**: When calling sub-agents, you MUST use consistent \`subagent_id\`s. Use "plan_agent" for the planning phase and "search_agent" for the search phase. Do NOT mix them up or generate random IDs.
- **Plan First**: For broad queries, always plan first.
- **Get Approval**: You MUST use \`stop_for_human_approve\` after the planning phase AND after the search phase before moving to the next step.
- **Review Findings**: When the search agent returns, it will have updated the shared state with raw search results.
- **Generate Report**: You MUST call \`start_deep_research\` to synthesize these results into a final report. This tool will handle the final output to the user.
</Instructions>

${promptForPlan}

${promptForSearch}
`,
});
