import html from "solid-js/html";
import { formatDateTime } from "../utils.js";
import { getRunType, getMetaDataOfRun } from "./RunDetails/utils.js";
import { createMemo } from "solid-js";
import { getTokenUsage, getModelName } from "./RunDetails/IOTab.js";

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
    const metadata = createMemo(() => getMetaDataOfRun(props.run));

    const time = createMemo(() => {
        return (props.run.end_time - props.run.start_time) / 1000;
    });
    const tokens = createMemo(() => {
        return getTokenUsage(JSON.parse(props.run.outputs));
    });
    const modelName = createMemo(() => {
        return getModelName(JSON.parse(props.run.outputs));
    });
    return html`
        <div class=${cardClass} onclick=${handleClick}>
            <div
                class="flex mb-2 flex-wrap"
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
                <div class="flex space-x-2 flex-wrap">
                    ${() =>
                        time() &&
                        html`
                            <span
                                class="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
                            >
                                ⏱️ ${time().toFixed(1)}s
                            </span>
                        `}
                    ${() =>
                        !!tokens() &&
                        html`
                            <span
                                class="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium"
                            >
                                🔢 ${tokens()} tokens
                            </span>
                        `}
                    ${() => {
                        return (
                            modelName() &&
                            html`<div
                                class="flex items-center space-x-2 text-xs text-gray-500"
                            >
                                <span
                                    class="font-mono bg-gray-100 px-1.5 py-0.5 rounded"
                                    >${modelName()}</span
                                >
                                <span
                                    class="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium"
                                >
                                    ${(
                                        getTokenUsage(
                                            JSON.parse(props.run.outputs),
                                            true,
                                        ) / time()
                                    ).toFixed(0) + " "}
                                    tps
                                </span>
                            </div>`
                        );
                    }}
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
