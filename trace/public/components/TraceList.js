import { createSignal, createMemo, createResource } from "solid-js";
import html from "solid-js/html";
import { formatDateTime } from "../utils.js";
import { TraceItem } from "./TraceItem.js";
import { For } from "solid-js/web";
// TraceList 组件 (左侧面板)
export const TraceList = (props) => {
    const [searchQuery, setSearchQuery] = createSignal("");
    const [selectedSystem, setSelectedSystem] = createSignal("");

    // 获取系统列表
    const [systems] = createResource(async () => {
        try {
            const response = await fetch("/trace/systems");
            if (!response.ok) throw new Error("Failed to load systems");
            const data = await response.json();
            return data.systems || [];
        } catch (error) {
            console.error("Error loading systems:", error);
            return [];
        }
    });

    const filteredTraces = createMemo(() => {
        let traces = props.traces() || [];

        // 系统过滤
        if (selectedSystem()) {
            traces = traces.filter(
                (trace) =>
                    trace.systems && trace.systems.includes(selectedSystem()),
            );
        }

        // 搜索过滤
        if (searchQuery()) {
            traces = traces.filter((trace) =>
                trace.trace_id
                    .toLowerCase()
                    .includes(searchQuery().toLowerCase()),
            );
        }

        return traces;
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

                <!-- 系统过滤器 -->
                <div class="mb-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        按系统过滤
                    </label>
                    <select
                        value=${selectedSystem}
                        onchange=${(e) => setSelectedSystem(e?.target?.value)}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                        <option value="">全部系统</option>
                        ${() =>
                            systems.loading
                                ? html`<option disabled>加载中...</option>`
                                : (systems() || []).map(
                                      (system) =>
                                          html`<option value=${system}>
                                              ${system}
                                          </option>`,
                                  )}
                    </select>
                </div>

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
                    ${() => {
                        const filtered = filteredTraces().length;
                        const total = (props.traces() || []).length;
                        const systemInfo = selectedSystem()
                            ? ` (${selectedSystem()})`
                            : "";
                        return filtered === total
                            ? `${total} 个 Trace${systemInfo}`
                            : `${filtered}/${total} 个 Trace${systemInfo}`;
                    }}
                </div>
            </div>
        </div>
    `;
};
