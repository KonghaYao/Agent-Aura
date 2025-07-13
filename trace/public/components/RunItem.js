import html from "solid-js/html";
import { formatDateTime } from "../utils.js";
import { getRunType, getMetaDataOfRun } from "./RunDetails/utils.js";
import { createMemo } from "solid-js";

const icon = {
    CompiledStateGraph: "🗺️",
    RunnableSequence: "📋",
    ChannelWrite: "📤",
    ChatOpenAI: "🤖",
    RunnableLambda: "🧩",
    RunnableCallable: "🔄",
    LangGraph: "🗺️",
    DynamicStructuredTool: "🔧",
};

// 单个 Run 项组件
export const RunItem = (props) => {
    const handleClick = () => {
        props.onSelect(props.run.id);
    };
    const cardClass = () => {
        return ` bg-white  rounded-lg cursor-pointer   ${() =>
            props.isSelected() ? "ring-2 ring-blue-500 " : ""}`;
    };
    const isError = () => {
        return !!props.run.error;
    };
    const metadata = createMemo(() => getMetaDataOfRun(props.run));

    return html`
        <div class=${cardClass} onclick=${handleClick}>
            <div
                class="flex mb-2"
                style=${() => {
                    return `padding-left: ${
                        calcLevelFromCheckpointNs(
                            metadata().langgraph_checkpoint_ns,
                            getRunType(props.run),
                        ) * 15
                    }px`;
                }}
            >
                <div class="text-xs text-gray-400 text-left">
                    ${icon[getRunType(props.run)]}
                </div>
                <div class="px-2 text-xs font-medium text-gray-900">
                    ${props.run.name}
                </div>
                <div class="text-xs text-gray-400">
                    ${formatDateTime(props.run.created_at)}
                </div>
            </div>
        </div>
    `;
};

const calcLevelFromCheckpointNs = (checkpointNs, type) => {
    console.log(checkpointNs);
    const addForType = () => {
        if (type === "LangGraph") return 0;
        if (type === "CompiledStateGraph") return 0;
        if (type === "RunnableSequence") return 1;
        if (type === "ChannelWrite") return 2;
        if (type === "ChatOpenAI") return 3;
        if (type === "RunnableLambda") return 3;
        if (type === "RunnableCallable") return 3;
        if (type === "DynamicStructuredTool") return 3;
        console.log(type);
        return 0;
    };
    if (!checkpointNs) return addForType();
    return addForType() + checkpointNs.split("|").length;
};
