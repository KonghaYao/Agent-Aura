import html from "solid-js/html";
import { formatDateTime } from "../utils.js";

// 单个 Trace 项组件
export const TraceItem = (props) => {
    const panelCard = () => {
        return `trace-item card-hover p-3 mb-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 ${() =>
            props.isSelected() ? "ring-2 ring-blue-500 border-blue-500" : ""}`;
    };
    return html`
        <div
            class=${panelCard()}
            onclick="${() => {
                props.onSelect(props.trace.trace_id);
            }}"
        >
            <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-900 truncate">
                        ${props.trace.trace_id}
                    </div>
                    <div class="text-sm text-gray-500 mt-1">
                        <span
                            class="status-${props.trace.total_runs > 0
                                ? "success"
                                : "pending"}"
                        >
                            ${props.trace.total_runs}
                        </span>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xs text-gray-400">
                        ${formatDateTime(props.trace.created_at)}
                    </div>
                </div>
            </div>
            <div class="mt-2 flex space-x-4 text-xs text-gray-500">
                <span>反馈: ${props.trace.total_feedback}</span>
                <span>附件: ${props.trace.total_attachments}</span>
                ${props.trace.run_types?.map(
                    (type) => html`<span>${type}</span>`,
                )}
            </div>
        </div>
    `;
};
