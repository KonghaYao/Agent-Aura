import { render } from "solid-js/web";
import html from "solid-js/html";
import { createSignal, onMount, createResource, createMemo } from "solid-js";
import { IOTab } from "./components/RunDetails/index.js";
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
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
};

const fetchLlmRuns = async ([currentPage, itemsPerPage]) => {
    const offset = (currentPage - 1) * itemsPerPage;
    try {
        const response = await fetch(
            `/trace/traces/search?run_type=llm&limit=${itemsPerPage}&offset=${offset}`,
        );
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.success && Array.isArray(data.traces)) {
            return { runs: data.traces, total: data.total }; // 返回 runs 数组和总数
        } else {
            throw new Error("Invalid data format from API.");
        }
    } catch (e) {
        console.error("Failed to fetch LLM runs:", e);
        throw e;
    }
};

const App = () => {
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);

    const [llmRunsResource] = createResource(
        () => [currentPage(), itemsPerPage()], // 依赖 currentPage 和 itemsPerPage
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

    const [selectedRun, setSelectedRun] = createSignal(null); // 新增：选中行的数据

    const handleRowClick = (run) => {
        setSelectedRun(run);
    };

    return html`
        <div class="p-4 h-screen flex flex-col">
            <h1 class="text-2xl font-bold mb-4">Overview</h1>

            <div class="flex-1 flex overflow-hidden">
                <!-- 左侧面板 -->
                <div
                    class="flex-1 flex flex-col bg-white shadow rounded-lg p-4 mr-4"
                >
                    <div
                        class="bg-white shadow rounded-lg p-4 flex-1 overflow-auto flex flex-col"
                    >
                        <h2 class="text-lg font-semibold text-gray-800 mb-4">
                            LLM Runs Details
                        </h2>
                        ${() =>
                            llmRunsResource.loading
                                ? html`<p>Loading runs data...</p>`
                                : llmRunsResource.error
                                ? html`<p class="text-red-500">
                                      Error loading runs:
                                      ${llmRunsResource.error.message}
                                  </p>`
                                : llmRunsResource() &&
                                  llmRunsResource().runs.length > 0
                                ? html`
                                      <div class="overflow-x-auto flex-1">
                                          <table
                                              class="min-w-full divide-y divide-gray-200"
                                          >
                                              <thead class="bg-gray-50">
                                                  <tr>
                                                      <th
                                                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                      >
                                                          关联 ID
                                                      </th>
                                                      <th
                                                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                      >
                                                          运行详情
                                                      </th>
                                                      <th
                                                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                      >
                                                          生成时长
                                                      </th>
                                                      <th
                                                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                      >
                                                          总 Token
                                                      </th>
                                                  </tr>
                                              </thead>
                                              <tbody
                                                  class="bg-white divide-y divide-gray-200"
                                              >
                                                  ${() =>
                                                      llmRunsResource().runs.map(
                                                          (run) => html`
                                                              <tr
                                                                  class="hover:bg-gray-50 cursor-pointer"
                                                                  onclick=${() =>
                                                                      handleRowClick(
                                                                          run,
                                                                      )}
                                                              >
                                                                  <td
                                                                      class="px-6 py-4 text-sm font-medium text-gray-900 break-all"
                                                                  >
                                                                      <span
                                                                          class="block text-xs text-gray-500"
                                                                          >Trace:</span
                                                                      >${run.trace_id ||
                                                                      "-"}<br />
                                                                      <span
                                                                          class="block text-xs text-gray-500 mt-1"
                                                                          >Thread:</span
                                                                      >${run.thread_id ||
                                                                      "-"}
                                                                  </td>
                                                                  <td
                                                                      class="px-6 py-4 text-sm text-gray-900 break-all"
                                                                  >
                                                                      <span
                                                                          class="block text-xs text-gray-500"
                                                                          >名称:</span
                                                                      >${run.name ||
                                                                      "-"}<br />
                                                                      <span
                                                                          class="block text-xs text-gray-500 mt-1"
                                                                          >系统:</span
                                                                      >${run.system ||
                                                                      "-"}
                                                                  </td>
                                                                  <td
                                                                      class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                                                  >
                                                                      ${formatDuration(
                                                                          run.start_time,
                                                                          run.end_time,
                                                                      )}
                                                                  </td>
                                                                  <td
                                                                      class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right"
                                                                  >
                                                                      ${run.total_tokens ||
                                                                      0}
                                                                  </td>
                                                              </tr>
                                                          `,
                                                      )}
                                              </tbody>
                                          </table>
                                      </div>

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
                                              页 ${currentPage} / ${totalPages}
                                              (共 ${totalRunsCount} 条)
                                          </span>
                                          <button
                                              onclick=${handleNextPage}
                                              disabled=${() =>
                                                  currentPage() ===
                                                      totalPages() ||
                                                  llmRunsResource.loading}
                                              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                          >
                                              下一页
                                          </button>
                                      </div>
                                  `
                                : html`<p class="text-gray-500">
                                      No LLM runs data available.
                                  </p>`}
                    </div>
                </div>

                <!-- 右侧 I/O 面板 -->
                ${() =>
                    selectedRun() &&
                    html`
                        <div
                            class="flex-1 flex flex-col bg-white shadow rounded-lg p-4 mr-4 overflow-auto"
                        >
                            ${IOTab({
                                run: selectedRun(),
                                attachments: [],
                            })}
                        </div>
                    `}
            </div>
        </div>
    `;
};

// 渲染应用
render(App, document.getElementById("app"));
