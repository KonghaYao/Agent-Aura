import html from "solid-js/html";
import { TimeAgo } from "./TimeAgo.js";

export const TracesSimpleList = (props) => {
    const handleTraceClick = (traceId) => {
        props.onTraceSelect(traceId);
    };

    return html`
        <div class="border-t border-gray-200 pt-3">
            <h3 class="text-sm font-medium text-gray-600 mb-2">
                📋 Traces (${props.filteredTraces().length})
            </h3>

            ${() =>
                props.traces.loading &&
                html`
                    <div class="text-center text-gray-500 py-2">
                        <div
                            class="inline-block w-4 h-4 border border-gray-300 border-t-green-600 rounded-full animate-spin"
                        ></div>
                        <span class="ml-1 text-xs">加载中...</span>
                    </div>
                `}
            ${() =>
                props.traces.error
                    ? html`
                          <div class="text-red-500 text-center py-2">
                              <p class="text-xs">${props.traces.error}</p>
                              <button
                                  onclick=${props.onLoadTraces}
                                  class="mt-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                              >
                                  重试
                              </button>
                          </div>
                      `
                    : ""}
            ${() =>
                !props.traces.loading &&
                !props.traces.error &&
                props.filteredTraces().length === 0
                    ? html`
                          <div class="text-center text-gray-500 py-2">
                              <p class="text-xs">暂无traces</p>
                          </div>
                      `
                    : ""}
            ${() =>
                !props.traces.loading &&
                !props.traces.error &&
                props.filteredTraces().length > 0
                    ? html`
                          <div class="space-y-1">
                              ${[...props.filteredTraces()]
                                  .reverse()
                                  .map((trace) => {
                                      const isSelected =
                                          props.selectedTraceId() ===
                                          trace.trace_id;
                                      const panelCard = () => {
                                          return `trace-item card-hover p-3 mb-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 ${() =>
                                              isSelected()
                                                  ? "ring-2 ring-blue-500 border-blue-500"
                                                  : ""}`;
                                      };
                                      return html`
                                          <div
                                              onclick=${() =>
                                                  handleTraceClick(
                                                      trace.trace_id,
                                                  )}
                                              class=${panelCard()}
                                          >
                                              <div
                                                  class="flex items-center justify-between"
                                              >
                                                  <span
                                                      class="font-mono text-gray-700 truncate"
                                                  >
                                                      ${trace.trace_id}
                                                  </span>
                                                  <span class="text-gray-500">
                                                      ${trace.total_runs || 0}
                                                      runs
                                                  </span>
                                              </div>
                                              <div class="mt-0.5">
                                                  ${TimeAgo({
                                                      datetime:
                                                          trace.last_run_time,
                                                      class: "text-gray-400 text-xs",
                                                  })}
                                              </div>
                                          </div>
                                      `;
                                  })}
                          </div>
                      `
                    : ""}
        </div>
    `;
};
