import { createUITool } from "@langgraph-js/sdk";
import z from "zod";
import { MessagesBox } from "../components/MessageBox";

export const sub_agents = createUITool({
    name: "ask_subagents",
    description: "子代理",
    parameters: {
        agent_id: z.string(),
    },
    onlyRender: true,
    render(tool) {
        return (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                        子代理查询
                    </h4>
                    <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                        {tool.getInputRepaired().question}
                    </div>
                </div>
                <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        响应内容
                    </h5>
                    <MessagesBox
                        renderMessages={tool.message.sub_agent_messages || []}
                        collapsedTools={[]}
                        toggleToolCollapse={() => {}}
                        client={tool.client}
                    />
                </div>
            </div>
        );
    },
});
