import { createMemo, createSignal } from "solid-js";
import html from "solid-js/html";
import { formatDateTime } from "../utils.js";
import {
    parseJSON,
    OverviewTab,
    IOTab,
    EventsTab,
    MetadataTab,
    FeedbackTab,
    getRunType,
} from "./RunDetails/index.js";

// RunDetails 组件 (右侧面板)
export const RunDetails = (props) => {
    const [activeTab, setActiveTab] = createSignal("overview");

    const selectedRunData = createMemo(() => {
        if (!props.selectedRunId() || !props.currentTraceData()) return null;
        return props
            .currentTraceData()
            .runs?.find((run) => run.id === props.selectedRunId());
    });

    const selectedRunFeedback = createMemo(() => {
        if (!props.selectedRunId() || !props.currentTraceData()) return [];
        return (
            props
                .currentTraceData()
                .feedback?.filter((f) => f.run_id === props.selectedRunId()) ??
            []
        );
    });

    const selectedRunAttachments = createMemo(() => {
        if (!props.selectedRunId() || !props.currentTraceData()) return [];
        return (
            props
                .currentTraceData()
                .attachments?.filter(
                    (a) => a.run_id === props.selectedRunId(),
                ) ?? []
        );
    });

    const extraData = createMemo(() => {
        const run = selectedRunData();
        console.log(run);
        if (!run || !run.extra) return null;
        return parseJSON(run.extra);
    });

    return html`
        <div
            class="flex-1 border-l border-gray-200 bg-white flex flex-col h-screen"
        >
            <!-- 头部 -->
            <div class="p-4 border-b border-gray-200">
                ${() =>
                    props.selectedRunId() && selectedRunData()
                        ? html`
                              <div>
                                  <h3
                                      class="text-lg font-semibold text-gray-900 mb-1"
                                  >
                                      ${selectedRunData().name ||
                                      props.selectedRunId()}
                                  </h3>
                                  <div
                                      class="flex items-center space-x-4 text-sm text-gray-600"
                                  >
                                      <span>ID: ${props.selectedRunId()}</span>
                                      <span
                                          >Type:
                                          ${getRunType(selectedRunData())}</span
                                      >
                                      <span class="flex items-center">
                                          <div
                                              class=${() =>
                                                  `w-2 h-2 rounded-full ${
                                                      selectedRunData().error
                                                          ? "bg-red-500"
                                                          : "bg-green-500"
                                                  } mr-1`}
                                          ></div>
                                          ${selectedRunData().error
                                              ? "失败"
                                              : "成功"}
                                      </span>
                                      <span
                                          >${formatDateTime(
                                              selectedRunData().created_at,
                                          )}</span
                                      >
                                  </div>
                              </div>
                          `
                        : html`
                              <div class="text-center text-gray-500 py-2">
                                  <svg
                                      class="w-12 h-12 mx-auto mb-2 text-gray-300"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                  >
                                      <path
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                          stroke-width="2"
                                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      ></path>
                                  </svg>
                                  <p>请选择一个 Run 来查看详情</p>
                              </div>
                          `}
            </div>

            <!-- Tab 导航 -->
            ${() => {
                const selectedClass = (tab) => {
                    return `px-4 py-2 text-sm font-medium border-b-2 ${
                        activeTab() === tab
                            ? "text-blue-600 border-blue-600"
                            : "text-gray-600 hover:text-gray-900 border-transparent"
                    }`;
                };
                return props.selectedRunId() && selectedRunData()
                    ? html`
                          <div class="flex border-b border-gray-200 bg-gray-50">
                              <button
                                  class=${selectedClass("overview")}
                                  onclick=${() => setActiveTab("overview")}
                              >
                                  概览
                              </button>
                              <button
                                  class=${selectedClass("io")}
                                  onclick=${() => setActiveTab("io")}
                              >
                                  输入/输出
                              </button>
                              <button
                                  class=${selectedClass("events")}
                                  onclick=${() => setActiveTab("events")}
                              >
                                  事件时间线
                              </button>
                              <button
                                  class=${selectedClass("metadata")}
                                  onclick=${() => setActiveTab("metadata")}
                              >
                                  元数据
                              </button>
                              <button
                                  class=${selectedClass("feedback")}
                                  onclick=${() => setActiveTab("feedback")}
                              >
                                  反馈 (${selectedRunFeedback().length})
                              </button>
                          </div>
                      `
                    : "";
            }}

            <!-- Tab 内容 -->
            <div class="flex-1 overflow-auto scrollbar">
                ${() =>
                    selectedRunData()
                        ? html`
                              ${() =>
                                  activeTab() === "overview"
                                      ? OverviewTab({ run: selectedRunData() })
                                      : ""}
                              ${() =>
                                  activeTab() === "io"
                                      ? IOTab({
                                            run: selectedRunData(),
                                            attachments:
                                                selectedRunAttachments(),
                                        })
                                      : ""}
                              ${() =>
                                  activeTab() === "events"
                                      ? EventsTab({ run: selectedRunData() })
                                      : ""}
                              ${() =>
                                  activeTab() === "metadata"
                                      ? MetadataTab({ extraData: extraData() })
                                      : ""}
                              ${() =>
                                  activeTab() === "feedback"
                                      ? FeedbackTab({
                                            feedback: selectedRunFeedback(),
                                        })
                                      : ""}
                          `
                        : ""}
            </div>
        </div>
    `;
};
