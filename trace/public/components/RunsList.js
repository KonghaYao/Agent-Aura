import html from "solid-js/html";
import { formatDateTime } from "../utils.js";
import { RunItem } from "./RunItem.js";
import { createMemo } from "solid-js";

// RunsList 组件 (中间面板)
export const RunsList = (props) => {
    const runs = createMemo(() => {
        return props.currentTraceData()?.runs || [];
    });

    return html`
        <div
            class="flex-none w-sm flex flex-col bg-white border-l border-gray-200"
        >
            <div
                class="p-4 border-b border-gray-200 flex items-center justify-between"
            >
                <h2 class="text-lg font-semibold text-gray-900">Runs</h2>
                <span class="text-sm text-gray-500"
                    >${() => runs?.length} runs</span
                >
            </div>

            <div class="flex-1 overflow-auto p-4 scrollbar">
                ${() =>
                    props.loading
                        ? html`
                              <div
                                  class="loading text-center text-gray-500 py-8"
                              >
                                  <div
                                      class="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"
                                  ></div>
                                  <p class="mt-2">加载中...</p>
                              </div>
                          `
                        : ""}
                ${() =>
                    props.error
                        ? html`
                              <div class="text-red-500 text-center py-8">
                                  <p>${props.error}</p>
                                  <button
                                      onclick=${props.onLoadRuns}
                                      class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                  >
                                      重试
                                  </button>
                              </div>
                          `
                        : ""}
                ${() =>
                    !props.loading && !props.error && runs().length === 0
                        ? html`
                              <div class="text-center text-gray-500 py-8">
                                  暂无 Run 数据
                              </div>
                          `
                        : ""}
                ${() =>
                    !props.loading && !props.error && runs().length > 0
                        ? html`
                              <div>
                                  ${runs().map((run) =>
                                      RunItem({
                                          run,
                                          isSelected: () =>
                                              props.selectedRunId() === run.id,
                                          onSelect: props.onRunSelect,
                                      }),
                                  )}
                              </div>
                          `
                        : ""}
            </div>
        </div>
    `;
};
