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
            <div class="space-y-1">
                <div class="text-xs text-gray-400 uppercase tracking-wide">
                    Trace
                </div>
                <div class="text-sm font-mono text-gray-700 break-all">
                    ${run.trace_id || "-"}
                </div>
                <div class="text-xs text-gray-400 uppercase tracking-wide">
                    Thread
                </div>
                <div class="text-sm font-mono text-gray-700 break-all">
                    ${run.thread_id || "-"}
                </div>
            </div>
        `,
        className: "px-4 py-3 border-b border-gray-100",
    },
    {
        header: "运行详情",
        key: ["name", "system"],
        format: (run) => html`
            <div class="space-y-1">
                <div class="text-xs text-gray-400 uppercase tracking-wide">
                    名称
                </div>
                <div class="text-sm font-medium text-gray-900">
                    ${run.name || "-"}
                </div>
                <div class="text-xs text-gray-400 uppercase tracking-wide">
                    系统
                </div>
                <div class="text-sm text-gray-600">${run.system || "-"}</div>
            </div>
        `,
        className: "px-4 py-3 border-b border-gray-100",
    },
    {
        header: "模型名称",
        key: "model_name",
        format: (run) => html`
            <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
            >
                ${run.model_name || "-"}
            </span>
        `,
        className: "px-4 py-3 border-b border-gray-100",
    },
    {
        header: "首字时间",
        key: "time_to_first_token",
        format: (run) => html`
            <span class="text-sm font-mono text-gray-700">
                ${formatTimeToFirstToken(run.time_to_first_token)}
            </span>
        `,
        className: "px-4 py-3 border-b border-gray-100 text-center",
    },
    {
        header: "生成时长",
        key: ["start_time", "end_time"],
        format: (run) => html`
            <span class="text-sm font-mono text-gray-700">
                ${formatDuration(run.start_time, run.end_time)}
            </span>
        `,
        className: "px-4 py-3 border-b border-gray-100 text-center",
    },
    {
        header: "总 Token",
        key: "total_tokens",
        format: (run) => html`
            <span
                class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200"
            >
                ${(run.total_tokens || 0).toLocaleString()}
            </span>
        `,
        className: "px-4 py-3 border-b border-gray-100 text-center",
    },
    {
        header: "起始时间",
        key: "start_time",
        format: (run) => html`
            <span class="text-sm text-gray-600">
                ${formatUnixTimestamp(run.start_time)}
            </span>
        `,
        className: "px-4 py-3 border-b border-gray-100",
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

    const [llmRunsResource, { refetch: refetchLlmRuns }] = createResource(
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
        <div class="min-h-screen bg-gray-50">
            <!-- 顶部导航栏 -->
            <header class="bg-white border-b border-gray-200">
                <div class="px-6 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <h1 class="text-2xl font-bold text-gray-900">
                                追踪概览
                            </h1>
                            <div class="h-6 w-px bg-gray-300"></div>
                            <span class="text-sm text-gray-500"
                                >运行数据监控面板</span
                            >
                        </div>
                        <button
                            onclick=${refetchLlmRuns}
                            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            <svg
                                class="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                ></path>
                            </svg>
                            刷新数据
                        </button>
                    </div>
                </div>
            </header>

            <!-- 主要内容区域 -->
            <main class="flex-1 px-6 py-6">
                <!-- 统计卡片 -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div class="bg-white rounded-lg border border-gray-200 p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div
                                    class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"
                                >
                                    <svg
                                        class="w-4 h-4 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        ></path>
                                    </svg>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">
                                    总运行数
                                </p>
                                <p class="text-2xl font-bold text-gray-900">
                                    ${totalRunsCount()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg border border-gray-200 p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div
                                    class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"
                                >
                                    <svg
                                        class="w-4 h-4 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                        ></path>
                                    </svg>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">
                                    系统数量
                                </p>
                                <p class="text-2xl font-bold text-gray-900">
                                    ${() => systemsResource()?.length || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg border border-gray-200 p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div
                                    class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center"
                                >
                                    <svg
                                        class="w-4 h-4 text-purple-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        ></path>
                                    </svg>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">
                                    模型数量
                                </p>
                                <p class="text-2xl font-bold text-gray-900">
                                    ${() => modelNamesResource()?.length || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg border border-gray-200 p-6">
                        <div class="flex items-center">
                            <div class="flex-shrink-0">
                                <div
                                    class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center"
                                >
                                    <svg
                                        class="w-4 h-4 text-orange-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        ></path>
                                    </svg>
                                </div>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">
                                    活跃线程
                                </p>
                                <p class="text-2xl font-bold text-gray-900">
                                    ${() => threadIdsResource()?.length || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 过滤条件卡片 -->
                <div class="bg-white rounded-lg border border-gray-200 mb-6">
                    <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900">
                            过滤条件
                        </h3>
                        <p class="mt-1 text-sm text-gray-500">
                            根据条件筛选运行数据
                        </p>
                    </div>
                    <div class="p-6">
                        <div
                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            <div>
                                <label
                                    class="block text-sm font-medium text-gray-700 mb-2"
                                    >运行类型</label
                                >
                                <select
                                    class="w-full border border-gray-300 rounded-md px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value=${() => filters().run_type}
                                    onchange=${(e) =>
                                        handleFilterChange(
                                            "run_type",
                                            e.target.value,
                                        )}
                                >
                                    <option value="">全部类型</option>
                                    <option value="llm">LLM 运行</option>
                                    <option value="chain">链式运行</option>
                                    <option value="tool">工具运行</option>
                                    <option value="retriever">检索运行</option>
                                </select>
                            </div>
                            <div>
                                <label
                                    class="block text-sm font-medium text-gray-700 mb-2"
                                    >系统</label
                                >
                                <select
                                    class="w-full border border-gray-300 rounded-md px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value=${() => filters().system}
                                    onchange=${(e) =>
                                        handleFilterChange(
                                            "system",
                                            e.target.value,
                                        )}
                                >
                                    <option value="">全部系统</option>
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
                                    class="block text-sm font-medium text-gray-700 mb-2"
                                    >模型</label
                                >
                                <select
                                    class="w-full border border-gray-300 rounded-md px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value=${() => filters().model_name}
                                    onchange=${(e) =>
                                        handleFilterChange(
                                            "model_name",
                                            e.target.value,
                                        )}
                                >
                                    <option value="">全部模型</option>
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
                                    class="block text-sm font-medium text-gray-700 mb-2"
                                    >线程ID</label
                                >
                                <select
                                    class="w-full border border-gray-300 rounded-md px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    value=${() => filters().thread_id}
                                    onchange=${(e) =>
                                        handleFilterChange(
                                            "thread_id",
                                            e.target.value,
                                        )}
                                >
                                    <option value="">全部线程</option>
                                    ${() =>
                                        threadIdsResource()
                                            ?.slice(0, 20)
                                            .map(
                                                (threadId) =>
                                                    html`<option
                                                        value=${threadId}
                                                    >
                                                        ${threadId}
                                                    </option>`,
                                            )}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 数据表格和详情面板 -->
                <div class="flex gap-6 h-auto">
                    <!-- 数据表格 -->
                    <div
                        class="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden"
                    >
                        <div class="px-6 py-4 border-b border-gray-200">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3
                                        class="text-lg font-medium text-gray-900"
                                    >
                                        运行记录
                                    </h3>
                                    <p class="mt-1 text-sm text-gray-500">
                                        点击行查看详细信息
                                    </p>
                                </div>
                                <div
                                    class="flex items-center text-sm text-gray-500"
                                >
                                    <span>共 ${totalRunsCount()} 条记录</span>
                                </div>
                            </div>
                        </div>

                        <div class="overflow-auto" style="max-height: 600px;">
                            ${() =>
                                llmRunsResource.loading ||
                                llmRunsResource.error ||
                                !llmRunsResource().runs
                                    ? html`<div class="p-8 text-center">
                                          ${llmRunsResource.loading
                                              ? html`
                                                    <div
                                                        class="inline-flex items-center"
                                                    >
                                                        <svg
                                                            class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                class="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                stroke-width="4"
                                                            ></circle>
                                                            <path
                                                                class="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            ></path>
                                                        </svg>
                                                        <span
                                                            class="text-gray-600"
                                                            >正在加载数据...</span
                                                        >
                                                    </div>
                                                `
                                              : llmRunsResource.error
                                              ? html`
                                                    <div class="text-center">
                                                        <svg
                                                            class="mx-auto h-12 w-12 text-red-400"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                stroke-linecap="round"
                                                                stroke-linejoin="round"
                                                                stroke-width="2"
                                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
                                                            ></path>
                                                        </svg>
                                                        <h3
                                                            class="mt-2 text-sm font-medium text-gray-900"
                                                        >
                                                            加载错误
                                                        </h3>
                                                        <p
                                                            class="mt-1 text-sm text-gray-500"
                                                        >
                                                            ${llmRunsResource
                                                                .error.message}
                                                        </p>
                                                    </div>
                                                `
                                              : html`
                                                    <div class="text-center">
                                                        <svg
                                                            class="mx-auto h-12 w-12 text-gray-400"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                stroke-linecap="round"
                                                                stroke-linejoin="round"
                                                                stroke-width="2"
                                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                            ></path>
                                                        </svg>
                                                        <h3
                                                            class="mt-2 text-sm font-medium text-gray-900"
                                                        >
                                                            暂无数据
                                                        </h3>
                                                        <p
                                                            class="mt-1 text-sm text-gray-500"
                                                        >
                                                            当前筛选条件下没有找到运行记录
                                                        </p>
                                                    </div>
                                                `}
                                      </div>`
                                    : html`
                                          <table
                                              class="min-w-full divide-y divide-gray-200"
                                          >
                                              <thead class="bg-gray-50">
                                                  <tr>
                                                      ${columnsConfig.map(
                                                          (col) => html`
                                                              <th
                                                                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                                                              >
                                                                  ${col.header}
                                                              </th>
                                                          `,
                                                      )}
                                                  </tr>
                                              </thead>
                                              <tbody
                                                  class="bg-white divide-y divide-gray-200"
                                              >
                                                  ${llmRunsResource().runs.map(
                                                      (run) => html`
                                                          <tr
                                                              class="hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
                                                              onclick=${() =>
                                                                  handleRowClick(
                                                                      run,
                                                                  )}
                                                          >
                                                              ${columnsConfig.map(
                                                                  (col) => html`
                                                                      <td
                                                                          class="${col.className}"
                                                                      >
                                                                          ${col.format(
                                                                              run,
                                                                          )}
                                                                      </td>
                                                                  `,
                                                              )}
                                                          </tr>
                                                      `,
                                                  )}
                                              </tbody>
                                          </table>
                                      `}
                        </div>

                        <!-- 分页控件 -->
                        ${() =>
                            !llmRunsResource.loading &&
                            html`
                                <div
                                    class="px-6 py-4 border-t border-gray-200 bg-gray-50"
                                >
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <button
                                            onclick=${handlePrevPage}
                                            disabled=${() =>
                                                currentPage() === 1 ||
                                                llmRunsResource.loading}
                                            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <svg
                                                class="w-4 h-4 mr-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M15 19l-7-7 7-7"
                                                ></path>
                                            </svg>
                                            上一页
                                        </button>

                                        <div
                                            class="flex items-center space-x-2"
                                        >
                                            <span class="text-sm text-gray-700">
                                                第
                                                <span class="font-medium"
                                                    >${currentPage()}</span
                                                >
                                                页，共
                                                <span class="font-medium"
                                                    >${totalPages()}</span
                                                >
                                                页
                                            </span>
                                            <div
                                                class="h-4 w-px bg-gray-300"
                                            ></div>
                                            <span class="text-sm text-gray-500">
                                                总计
                                                <span class="font-medium"
                                                    >${totalRunsCount()}</span
                                                >
                                                条记录
                                            </span>
                                        </div>

                                        <button
                                            onclick=${handleNextPage}
                                            disabled=${() =>
                                                currentPage() ===
                                                    totalPages() ||
                                                llmRunsResource.loading}
                                            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            下一页
                                            <svg
                                                class="w-4 h-4 ml-2"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M9 5l7 7-7 7"
                                                ></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            `}
                    </div>

                    <!-- 右侧详情面板 -->
                    ${() =>
                        selectedRun() &&
                        RunDetailsPanel({
                            run: selectedRun(),
                            attachments: [],
                            onClose: () => setSelectedRun(null),
                        })}
                </div>
            </main>
        </div>
    `;
};
