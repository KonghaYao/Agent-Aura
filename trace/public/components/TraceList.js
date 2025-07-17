import { createSignal, createMemo } from "solid-js";
import html from "solid-js/html";
import { SearchBar } from "./SearchBar.js";
import { ThreadList } from "./ThreadList.js";
import { TracesSimpleList } from "./TracesSimpleList.js";
import { Statistics } from "./Statistics.js";
// import { useRefresh } from "../context/RefreshContext.js"; // 移除 Context 导入

// TraceList 组件 (左侧面板) - 使用小组件拆分
export const TraceList = (props) => {
    const [searchQuery, setSearchQuery] = createSignal("");
    const [selectedSystem, setSelectedSystem] = createSignal("");
    // const { refresh } = useRefresh(); // 移除 Context 使用

    const filteredThreads = createMemo(() => {
        let threads = props.threads() || [];

        // 系统过滤
        if (selectedSystem()) {
            threads = threads.filter(
                (thread) =>
                    thread.systems && thread.systems.includes(selectedSystem()),
            );
        }

        // 搜索过滤
        if (searchQuery()) {
            threads = threads.filter((thread) =>
                thread.thread_id
                    .toLowerCase()
                    .includes(searchQuery().toLowerCase()),
            );
        }

        return threads;
    });

    const filteredTraces = createMemo(() => {
        let traces = props.traces() || [];

        // 搜索过滤 traces
        if (searchQuery()) {
            traces = traces.filter((trace) =>
                trace.trace_id
                    .toLowerCase()
                    .includes(searchQuery().toLowerCase()),
            );
        }

        return traces;
    });

    return html`
        <div
            class="left-panel border-r border-gray-200 bg-white flex flex-col h-screen max-w-sm"
        >
            <!-- 搜索栏 -->
            ${SearchBar({
                searchQuery,
                selectedSystem,
                onSearchChange: setSearchQuery,
                onSystemChange: setSelectedSystem,
            })}

            <!-- 刷新按钮 -->
            <div class="p-2 border-b border-gray-200">
                <button
                    class="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
                    onclick=${props.refresh}
                >
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    刷新数据
                </button>
            </div>

            <!-- 内容区域 -->
            <div class="flex-1 overflow-auto scrollbar">
                <div class="p-2">
                    <!-- 线程列表 -->
                    ${ThreadList({
                        threads: props.threads,
                        filteredThreads,
                        selectedThreadId: props.selectedThreadId,
                        onThreadSelect: props.onThreadSelect,
                        onLoadThreads: props.onLoadThreads,
                    })}

                    <!-- Traces 列表 (当选择了线程时显示) -->
                    ${() =>
                        props.selectedThreadId()
                            ? TracesSimpleList({
                                  traces: props.traces,
                                  filteredTraces,
                                  selectedTraceId: props.selectedTraceId,
                                  onTraceSelect: props.onTraceSelect,
                                  onLoadTraces: props.onLoadTraces,
                              })
                            : ""}
                </div>
            </div>

            <!-- 底部统计 -->
            ${Statistics({
                filteredThreads,
                threads: props.threads,
                selectedSystem,
                selectedThreadId: props.selectedThreadId,
                filteredTraces,
            })}
        </div>
    `;
};
