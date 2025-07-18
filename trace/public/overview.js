import { render } from "solid-js/web";
import html from "solid-js/html";
import { createSignal, onMount, createResource, createMemo } from "solid-js";
import { IOTab } from "./components/RunDetails/index.js";
import { RunDetailsPanel } from "./components/RunDetailsPanel.js";
import { Table } from "./components/Table.js";
// import { TraceDatabase } from "../src/database.ts"; // 不再直接使用数据库类
// import { IndexedDBAdapter } from "../src/indexed-db-adapter.js"; // 不再直接使用数据库类

const formatUnixTimestamp = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(parseInt(timestamp));
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleString();
};

const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "-";
    const startMs = parseInt(startTime);
    const endMs = parseInt(endTime);
    if (isNaN(startMs) || isNaN(endMs) || endMs < startMs) return "-";

    const diff = endMs - startMs;
    return (diff / 1000).toFixed(2) + "s";
};

const formatTimeToFirstToken = (timeMs) => {
    if (!timeMs || timeMs <= 0) return "-";
    if (timeMs < 1000) return `${timeMs}ms`;
    return `${(timeMs / 1000).toFixed(2)}s`;
};

// 定义表格列的配置
const columnsConfig = [
    {
        header: "关联 ID",
        key: ["trace_id", "thread_id"],
        format: (run) => html`
            <span class="block text-xs text-gray-500">Trace:</span
            >${run.trace_id || "-"}<br />
            <span class="block text-xs text-gray-500 mt-1">Thread:</span
            >${run.thread_id || "-"}
        `,
        className: "px-6 py-4 text-sm font-medium text-gray-900 break-all",
    },
    {
        header: "运行详情",
        key: ["name", "system"],
        format: (run) => html`
            <span class="block text-xs text-gray-500">名称:</span>${run.name ||
            "-"}<br />
            <span class="block text-xs text-gray-500 mt-1">系统:</span
            >${run.system || "-"}
        `,
        className: "px-6 py-4 text-sm text-gray-900 break-all",
    },
    {
        header: "模型名称",
        key: "model_name",
        format: (run) => run.model_name || "-",
        className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900",
    },
    {
        header: "首字时间",
        key: "time_to_first_token",
        format: (run) => formatTimeToFirstToken(run.time_to_first_token),
        className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500",
    },
    {
        header: "生成时长",
        key: ["start_time", "end_time"],
        format: (run) => formatDuration(run.start_time, run.end_time),
        className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500",
    },

    {
        header: "总 Token",
        key: "total_tokens",
        format: (run) => (run.total_tokens || 0).toString(),
        className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500",
    },
    {
        header: "起始时间",
        key: "start_time",
        format: (run) => formatUnixTimestamp(run.start_time),
        className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500",
    },
];

// 获取系统列表
const fetchSystems = async () => {
    try {
        const response = await fetch("/trace/systems");
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.success ? data.systems : [];
    } catch (e) {
        console.error("Failed to fetch systems:", e);
        return [];
    }
};

// 获取模型名称列表
const fetchModelNames = async () => {
    try {
        const response = await fetch("/trace/models");
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.success ? data.model_names : [];
    } catch (e) {
        console.error("Failed to fetch model names:", e);
        return [];
    }
};

// 获取线程ID列表
const fetchThreadIds = async () => {
    try {
        const response = await fetch("/trace/threads");
        if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.success ? data.thread_ids : [];
    } catch (e) {
        console.error("Failed to fetch thread IDs:", e);
        return [];
    }
};

const fetchLlmRuns = async ([currentPage, itemsPerPage, filters]) => {
    const offset = (currentPage - 1) * itemsPerPage;

    // 构建查询参数
    const queryParams = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
    });

    // 添加过滤条件
    if (filters.run_type) queryParams.append("run_type", filters.run_type);
    if (filters.system) queryParams.append("system", filters.system);
    if (filters.model_name)
        queryParams.append("model_name", filters.model_name);
    if (filters.thread_id) queryParams.append("thread_id", filters.thread_id);

    try {
        const response = await fetch(
            `/trace/traces/search?${queryParams.toString()}`,
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.success && Array.isArray(data.traces)) {
            return { runs: data.traces, total: data.total };
        } else {
            throw new Error("Invalid data format from API.");
        }
    } catch (e) {
        console.error("Failed to fetch LLM runs:", e);
        throw e;
    }
};

export const OverviewPage = () => {
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);

    // 过滤条件
    const [filters, setFilters] = createSignal({
        run_type: "llm", // 默认查询 LLM runs
        system: "",
        model_name: "",
        thread_id: "",
    });

    // 资源加载
    const [systemsResource] = createResource(fetchSystems);
    const [modelNamesResource] = createResource(fetchModelNames);
    const [threadIdsResource] = createResource(fetchThreadIds);

    const [llmRunsResource] = createResource(
        () => [currentPage(), itemsPerPage(), filters()],
        fetchLlmRuns,
    );

    const totalRunsCount = createMemo(() => {
        const runsData = llmRunsResource();
        return runsData?.total || 0;
    });

    const totalPages = createMemo(() => {
        return Math.ceil(totalRunsCount() / itemsPerPage());
    });

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(1, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(totalPages(), prev + 1));
    };

    const [selectedRun, setSelectedRun] = createSignal(null);

    const handleRowClick = (run) => {
        setSelectedRun(run);
    };

    // 处理过滤条件变化
    const handleFilterChange = (field, value) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
        setCurrentPage(1); // 重置到第一页
    };

    return html`
        <div class="p-4 h-screen flex flex-col">
            <h1 class="text-2xl font-bold mb-4">Overview</h1>

            <!-- 过滤条件 -->
            <div class="bg-white shadow rounded-lg p-4 mb-4">
                <h3 class="text-lg font-semibold mb-3">过滤条件</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >运行类型</label
                        >
                        <select
                            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value=${() => filters().run_type}
                            onchange=${(e) =>
                                handleFilterChange("run_type", e.target.value)}
                        >
                            <option value="">全部</option>
                            <option value="llm">LLM</option>
                            <option value="chain">Chain</option>
                            <option value="tool">Tool</option>
                            <option value="retriever">Retriever</option>
                        </select>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >系统</label
                        >
                        <select
                            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value=${() => filters().system}
                            onchange=${(e) =>
                                handleFilterChange("system", e.target.value)}
                        >
                            <option value="">全部</option>
                            ${() =>
                                systemsResource()?.map(
                                    (system) =>
                                        html`<option value=${system}>
                                            ${system}
                                        </option>`,
                                )}
                        </select>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >模型</label
                        >
                        <select
                            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value=${() => filters().model_name}
                            onchange=${(e) =>
                                handleFilterChange(
                                    "model_name",
                                    e.target.value,
                                )}
                        >
                            <option value="">全部</option>
                            ${() =>
                                modelNamesResource()?.map(
                                    (modelName) =>
                                        html`<option value=${modelName}>
                                            ${modelName}
                                        </option>`,
                                )}
                        </select>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >线程ID</label
                        >
                        <select
                            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value=${() => filters().thread_id}
                            onchange=${(e) =>
                                handleFilterChange("thread_id", e.target.value)}
                        >
                            <option value="">全部</option>
                            ${() =>
                                threadIdsResource()
                                    ?.slice(0, 20)
                                    .map(
                                        (threadId) =>
                                            html`<option value=${threadId}>
                                                ${threadId}
                                            </option>`,
                                    )}
                        </select>
                    </div>
                </div>
            </div>

            <div class="flex-1 flex overflow-hidden">
                <!-- 左侧面板 -->
                <div
                    class="flex-1 flex flex-col bg-white shadow rounded-lg p-4 mr-4"
                >
                    ${() =>
                        llmRunsResource.loading ||
                        llmRunsResource.error ||
                        !llmRunsResource().runs
                            ? html`<div
                                  class="bg-white shadow rounded-lg p-4 flex-1 overflow-auto flex flex-col"
                              >
                                  <h2
                                      class="text-lg font-semibold text-gray-800 mb-4"
                                  >
                                      Runs Details
                                  </h2>
                                  ${llmRunsResource.loading
                                      ? html`<p>Loading runs data...</p>`
                                      : llmRunsResource.error
                                      ? html`<p class="text-red-500">
                                            Error loading runs:
                                            ${llmRunsResource.error.message}
                                        </p>`
                                      : html`<p class="text-gray-500">
                                            No runs data available.
                                        </p>`}
                              </div>`
                            : html`
                                  ${Table({
                                      columnsConfig: columnsConfig,
                                      data: llmRunsResource().runs,
                                      onRowClick: handleRowClick,
                                      loading: llmRunsResource.loading,
                                      error: llmRunsResource.error,
                                  })}

                                  <div
                                      class="flex justify-between items-center mt-4 flex-none"
                                  >
                                      <button
                                          onclick=${handlePrevPage}
                                          disabled=${() =>
                                              currentPage() === 1 ||
                                              llmRunsResource.loading}
                                          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                      >
                                          上一页
                                      </button>
                                      <span class="text-sm text-gray-700">
                                          页 ${currentPage} / ${totalPages} (共
                                          ${totalRunsCount} 条)
                                      </span>
                                      <button
                                          onclick=${handleNextPage}
                                          disabled=${() =>
                                              currentPage() === totalPages() ||
                                              llmRunsResource.loading}
                                          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                      >
                                          下一页
                                      </button>
                                  </div>
                              `}
                </div>

                <!-- 右侧 I/O 面板 (浮动) -->
                ${() =>
                    selectedRun() &&
                    RunDetailsPanel({
                        run: selectedRun(),
                        attachments: [],
                        onClose: () => setSelectedRun(null),
                    })}
            </div>
        </div>
    `;
};
