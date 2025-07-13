import { createSignal, createMemo } from "solid-js";
import html from "solid-js/html";
import { formatDateTime } from "../utils.js";
import { TraceItem } from "./TraceItem.js";
import { For } from "solid-js/web";
// TraceList 组件 (左侧面板)
export const TraceList = (props) => {
    const [searchQuery, setSearchQuery] = createSignal("");

    const filteredTraces = createMemo(() => {
        if (!searchQuery()) return props.traces() || [];
        return (props.traces() || []).filter((trace) =>
            trace.trace_id.toLowerCase().includes(searchQuery().toLowerCase()),
        );
    });

    const handleTraceClick = (traceId) => {
        props.onTraceSelect(traceId);
    };

    return html`
        <div
            class="left-panel border-r border-gray-200 bg-white flex flex-col h-screen"
        >
            <!-- 头部 -->
            <div class="p-4 border-b border-gray-200">
                <h1 class="text-lg font-semibold text-gray-900 mb-4">
                    Trace 管理后台
                </h1>
                <!-- 搜索框 -->
                <div class="relative">
                    <svg
                        class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path>
                    </svg>
                    <input
                        type="text"
                        value=${searchQuery}
                        oninput=${(e) => setSearchQuery(e?.target?.value)}
                        placeholder="搜索 Trace ID..."
                        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            <!-- Trace 列表 -->
            <div class="flex-1 overflow-auto scrollbar">
                <div class="p-2">
                    ${() =>
                        props.traces.loading &&
                        html`
                            <div class="loading text-center text-gray-500 py-8">
                                <div
                                    class="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"
                                ></div>
                                <p class="mt-2">加载中...</p>
                            </div>
                        `}
                    ${() =>
                        props.traces.error
                            ? html`
                                  <div class="text-red-500 text-center py-8">
                                      <p>${props.traces.error}</p>
                                      <button
                                          onclick=${props.onLoadTraces}
                                          class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                      >
                                          重试
                                      </button>
                                  </div>
                              `
                            : ""}
                    ${() =>
                        !props.traces.loading &&
                        !props.traces.error &&
                        filteredTraces().length === 0
                            ? html`
                                  <div class="text-center text-gray-500 py-8">
                                      暂无 Trace 数据
                                  </div>
                              `
                            : ""}
                    ${() =>
                        !props.traces.loading &&
                        !props.traces.error &&
                        filteredTraces().length > 0
                            ? filteredTraces().map((trace) =>
                                  TraceItem({
                                      trace,
                                      isSelected: () => {
                                          return (
                                              props.selectedTraceId() ===
                                              trace.trace_id
                                          );
                                      },
                                      onSelect: handleTraceClick,
                                  }),
                              )
                            : ""}
                </div>
            </div>

            <!-- 底部统计 -->
            <div class="p-4 border-t border-gray-200 bg-gray-50">
                <div class="text-sm text-gray-600">
                    ${() => filteredTraces().length} 个 Trace
                </div>
            </div>
        </div>
    `;
};
