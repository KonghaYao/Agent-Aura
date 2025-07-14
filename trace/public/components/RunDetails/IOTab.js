import { createMemo } from "solid-js";
import html from "solid-js/html";
import { AttachmentItem } from "../AttachmentItem.js";
import { GraphStateMessage, GraphStatePanel } from "../GraphState.js";

// 输入输出标签页组件
export const IOTab = ({ run, attachments }) => {
    const inputs = createMemo(() => {
        return JSON.parse(run.inputs);
    });
    const outputs = createMemo(() => {
        console.log(JSON.parse(run.outputs));
        return JSON.parse(run.outputs);
    });
    const tokenUsage = createMemo(() => {
        return getTokenUsage(outputs());
    });

    return html`
        <div class="p-4 space-y-6">
            ${tokenUsage() > 0
                ? html`<span
                      class="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full ml-2 align-middle"
                      >${tokenUsage()} tokens</span
                  >`
                : ""}
            <!-- 输入 -->
            <div>
                <h4 class="font-semibold text-gray-900 mb-3">输入 (Inputs)</h4>
                <div class="bg-gray-50 rounded-lg p-4">
                    ${inputs()
                        ? GraphStatePanel({ state: inputs() })
                        : html`
                              <div class="text-gray-500 text-sm">
                                  无输入数据
                              </div>
                          `}
                </div>
                <div>
                    ${inputs() ? GraphStateMessage({ state: inputs() }) : ""}
                </div>
            </div>

            <!-- 输出 -->
            <div>
                <h4 class="font-semibold text-gray-900 mb-3">输出 (Outputs)</h4>
                <div class="bg-gray-50 rounded-lg p-4">
                    ${outputs()
                        ? GraphStatePanel({ state: outputs() })
                        : html`
                              <div class="text-gray-500 text-sm">
                                  无输出数据
                              </div>
                          `}
                    ${() =>
                        run.run_type === "tool"
                            ? html`<pre class="text-gray-500 text-sm">
                                  ${outputs().output.kwargs.content}
                              </pre
                              >`
                            : ""}
                    ${outputs()
                        ? GraphStateMessage({
                              state: {
                                  messages:
                                      outputs().generations?.[0]?.map(
                                          (i) => i.message,
                                      ) || [],
                              },
                          })
                        : ""}
                </div>
            </div>

            <!-- 附件 -->
            ${attachments.length > 0
                ? html`
                      <div>
                          <h4 class="font-semibold text-gray-900 mb-3">
                              附件 (${attachments.length})
                          </h4>
                          <div class="space-y-2">
                              ${attachments.map((attachment) =>
                                  AttachmentItem({ attachment }),
                              )}
                          </div>
                      </div>
                  `
                : ""}
        </div>
    `;
};
export const getTokenUsage = (outputs, onlyOutput = false) => {
    const outputData = outputs;
    if (outputData && outputData.llmOutput && outputData.llmOutput.tokenUsage) {
        return onlyOutput
            ? outputData.llmOutput.tokenUsage.completionTokens
            : outputData.llmOutput.tokenUsage.totalTokens;
    }
    return 0; // 如果没有找到 token 信息，则返回 0
};

export const getModelName = (outputs) => {
    const outputData = outputs;
    return outputData?.generations?.[0]?.[0]?.generationInfo?.model_name;
};
