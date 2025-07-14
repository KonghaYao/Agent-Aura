import html from "solid-js/html";
import { formatDateTime } from "../utils.js";
import { RunItem } from "./RunItem.js";
import { createMemo, createSignal } from "solid-js";
import { getTokenUsage } from "./RunDetails/IOTab.js";

// RunsList 组件 (中间面板)
export const RunsList = (props) => {
    const runs = createMemo(() => {
        return props.currentTraceData()?.runs || [];
    });
    const [showNoneTime, setShowNoneTime] = createSignal(false);
    const hasSpentTime = (run) => {
        if (showNoneTime()) {
            return true;
        }
        return run.end_time - run.start_time > 10;
    };

    const totalDuration = createMemo(() => {
        return runs().reduce((sum, run) => {
            return sum + (run.end_time - run.start_time);
        }, 0);
    });

    const totalTokens = createMemo(() => {
        return runs().reduce((sum, run) => {
            return sum + getTokenUsage(JSON.parse(run.outputs));
        }, 0);
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
                    >${() => runs()?.length} runs</span
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
                                  ${runs().map(
                                      (run) =>
                                          hasSpentTime(run) &&
                                          RunItem({
                                              run,
                                              isSelected: () =>
                                                  props.selectedRunId() ===
                                                  run.id,
                                              onSelect: props.onRunSelect,
                                          }),
                                  )}
                              </div>
                          `
                        : ""}
            </div>
            <div class="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="flex flex-col items-start">
                        <span class="text-xs text-gray-500 mb-1">总耗时</span>
                        <span class="text-lg font-semibold text-blue-700">
                            ${() => (totalDuration() / 1000).toFixed(2)}<span
                                class="text-sm font-normal text-gray-500 ml-1"
                                >s</span
                            >
                        </span>
                    </div>
                    <div class="flex flex-col items-end">
                        <span class="text-xs text-gray-500 mb-1">总 Token</span>
                        <span class="text-lg font-semibold text-green-700">
                            ${totalTokens}
                        </span>
                    </div>
                </div>
                <button
                    class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow hover:from-blue-600 hover:to-blue-700 transition font-medium"
                    onclick=${() => setShowNoneTime(!showNoneTime())}
                >
                    ${showNoneTime() ? "隐藏无耗时步骤" : "显示无耗时步骤"}
                </button>
            </div>
        </div>
    `;
};
