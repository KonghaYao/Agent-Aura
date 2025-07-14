import html from "solid-js/html";
import { TimeAgo } from "./TimeAgo.js";

export const ThreadItem = (props) => {
    const lastRunTime = () => {
        return `thread-item card-hover p-3 mb-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 ${() =>
            props.isSelected() ? "ring-2 ring-blue-500 border-blue-500" : ""}`;
    };
    return html`
        <div
            onclick=${() => props.onSelect(props.thread.thread_id)}
            class=${lastRunTime()}
        >
            <div class="flex justify-between items-start mb-2">
                <div class="font-mono text-sm text-gray-800 truncate">
                    ID: ${props.thread.thread_id}
                </div>
                <span class="text-xs text-gray-500">
                    ${props.thread.total_runs || 0} runs
                </span>
            </div>

            <div
                class="flex justify-between items-center text-xs text-gray-500"
            >
                <div>
                    ${TimeAgo({
                        datetime: props.thread.last_run_time,
                        class: "text-gray-500 text-xs",
                    })}
                </div>
            </div>
        </div>
    `;
};
