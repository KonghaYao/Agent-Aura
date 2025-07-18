import html from "solid-js/html";
import { IOTab } from "./RunDetails/index.js";
import { onCleanup } from "solid-js";
import { RunDetails } from "./RunDetails.js";

export const RunDetailsPanel = (props) => {
    // 点击外部关闭的逻辑
    const handleClickOutside = (event) => {
        const panel = document.getElementById("run-details-panel");
        if (panel && !panel.contains(event.target)) {
            props.onClose();
        }
    };

    // 在组件挂载时添加事件监听器，卸载时移除
    document.addEventListener("mousedown", handleClickOutside);
    onCleanup(() => {
        document.removeEventListener("mousedown", handleClickOutside);
    });

    return html`
        <div
            id="run-details-panel"
            class="fixed right-4 top-4 bottom-4 w-1/2 bg-white shadow-xl rounded-lg p-4 z-50 overflow-auto"
        >
            <button
                onclick=${props.onClose}
                class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
            ${RunDetails({
                selectedRunId: () => props.run.id,
                currentTraceData: () => ({
                    runs: [props.run],
                }),
                feedbacks: [],
                attachments: [],
            })}
        </div>
    `;
};
