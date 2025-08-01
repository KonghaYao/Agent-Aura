import {
    createSignal,
    For,
    Show,
    createMemo,
    createResource,
    onMount,
} from "solid-js";
import html from "solid-js/html";
import { createLucideIcon } from "./icons.js";
import { ModelConfigModal } from "./components/ModelConfigModal.js";
import { createStoreSignal } from "./utils.js";
import { GraphStateMessage } from "./components/GraphState.js";
import { MessageEditor } from "./components/MessageEditor.js";
// 默认消息
const defaultMessage = [
    ["system", "You are a chatbot."],
    ["human", "{question}"],
];

export const PlayGround = () => {
    // 状态管理
    const [messages, setMessages] = createSignal(defaultMessage);
    const [inputs, setInputs] = createSignal({});

    const [modelConfigs] = createStoreSignal("modelConfigs", []);
    const [selectedModelId, setSelectedModelId] = createStoreSignal(
        "selectedModelId",
        null,
    );
    const selectedConfig = createMemo(() => {
        return modelConfigs().find((c) => c.id === selectedModelId());
    });

    const [showModelModal, setShowModelModal] = createSignal(false);

    const [outputSchemaText, setOutputSchemaText] = createSignal("");
    const [toolsText, setToolsText] = createSignal("[]");

    // Tab 状态管理
    const [activeTab, setActiveTab] = createSignal(null); // null, 'schema', 'tools'

    // Request payload for createResource
    const [requestPayload, setRequestPayload] = createSignal(null);

    // Stream content for streaming responses
    const [streamContent, setStreamContent] = createSignal([]);
    const composedStreamContent = createMemo(() => {
        let content = "";
        for (const i of streamContent()) {
            content += i.kwargs.content;
        }
        return [
            {
                type: "constructor",
                lc: 1,
                id: ["langchain_core", "messages", "AIMessage"],
                kwargs: {
                    content: content,
                },
            },
        ];
    });
    const [responseResource] = createResource(
        () => requestPayload(),
        async (payload) => {
            if (!payload) return null; // No request yet

            const { messages, inputs, model, tools, output_schema, type } =
                payload;

            setStreamContent([]); // Clear previous stream content for new request

            const endpoint =
                type === "stream" ? "../llm/stream" : "../llm/invoke";

            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages,
                        inputs,
                        model,
                        tools,
                        output_schema,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.error || `请求失败: ${response.status}`,
                    );
                }

                if (type === "stream") {
                    const decoder = new TextDecoder();
                    let buffer = "";

                    for await (const chunk of response.body) {
                        buffer += decoder.decode(chunk, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop();

                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                const data = line.slice(6);
                                if (data === "[DONE]") {
                                    return {
                                        finalContent: streamContent(),
                                        type: "stream",
                                    };
                                }
                                try {
                                    const parsedChunk = JSON.parse(data);
                                    setStreamContent((prev) => [
                                        ...prev,
                                        parsedChunk,
                                    ]);
                                } catch (e) {
                                    console.error("解析流数据错误:", e);
                                }
                            }
                        }
                    }
                    return {
                        error: "Stream interrupted unexpectedly",
                        type: "stream",
                    };
                } else {
                    const data = await response.json();
                    return {
                        type: "invoke",
                        data,
                    };
                }
            } catch (error) {
                console.error("请求错误:", error);
                throw error; // Propagate error for resource.error
            }
        },
    );

    // 从消息中解析变量
    const variables = createMemo(() => {
        const vars = new Set();
        messages().forEach((msg) => {
            const matches = msg[1].match(/{(\w+)}/g);
            if (matches) {
                matches.forEach((match) => vars.add(match.slice(1, -1)));
            }
        });
        return Array.from(vars);
    });

    // 更新输入变量的值
    const handleInputChange = (name, value) => {
        setInputs((prev) => ({ ...prev, [name]: value }));
    };

    // 添加消息
    const addMessage = () => {
        setMessages((prev) => [...prev, ["user", ""]]);
    };

    // 删除消息
    const removeMessage = (index) => {
        setMessages((prev) => prev.filter((_, i) => i !== index));
    };

    // 更新消息
    const updateMessage = (index, type, content) => {
        setMessages((prev) =>
            prev.map((msg, i) => (i === index ? [type, content] : msg)),
        );
    };

    const commitTestRun = (type) => {
        if (!selectedConfig()) {
            alert("请先选择一个模型配置！");
            setShowModelModal(true);
            return;
        }
        setRequestPayload({
            messages: messages(),
            inputs: inputs(),
            model: selectedConfig(),
            tools:
                activeTab() === "tools" ? JSON.parse(toolsText() || "[]") : [],
            output_schema: outputSchemaText()
                ? JSON.parse(outputSchemaText())
                : undefined,
            type: type,
        });
    };

    return html`
        <div class="h-screen flex flex-col bg-gray-50 font-sans text-gray-800">
            <!-- Top Bar -->
            <header
                class="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white"
            >
                <div>
                    <p class="text-sm text-gray-500">Personal / Playground</p>
                    <h1 class="text-xl font-semibold text-gray-900 mt-1">
                        Playground
                    </h1>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="flex rounded-md border border-gray-300">
                        <button
                            onclick=${() => {
                                commitTestRun("invoke");
                            }}
                            disabled=${responseResource.loading}
                            class="px-5 py-2 bg-green-600 text-white rounded-l-lg flex items-center font-medium shadow-sm transition-colors duration-150 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed border-r border-green-700"
                        >
                            运行
                        </button>
                        <button
                            onclick=${() => {
                                commitTestRun("stream");
                            }}
                            disabled=${responseResource.loading}
                            class="px-3 py-2 bg-green-600 text-white rounded-r-lg flex items-center font-medium shadow-sm transition-colors duration-150 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            title="流式运行"
                        >
                            流式
                        </button>
                    </div>
                </div>
            </header>

            <main class="flex-1 grid grid-cols-12 gap-6 p-6 overflow-y-auto">
                <!-- Left and Middle Panel -->
                <div class="col-span-8 flex flex-col gap-4 min-h-0">
                    <div class="flex items-center justify-between">
                        <h2 class="text-base font-semibold flex items-center">
                            Prompts
                        </h2>
                        <div class="flex items-center gap-2">
                            <div
                                class="flex items-center border border-gray-300 rounded-md bg-white"
                            >
                                <span class="px-3 py-1.5 text-sm"
                                    >${() =>
                                        selectedConfig()?.name ||
                                        "Select Model"}</span
                                >
                                <button
                                    onclick=${() => setShowModelModal(true)}
                                    class="p-2 border-l border-gray-300 hover:bg-gray-100"
                                    title="Manage Models"
                                >
                                    ${createLucideIcon("settings")}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Messages Section -->
                    <div class="flex-1 flex flex-col min-h-0">
                        <div class="flex-1 overflow-y-auto space-y-3 pr-2">
                            ${MessageEditor({
                                messages: messages,
                                onUpdateMessage: updateMessage,
                                onRemoveMessage: removeMessage,
                            })}
                        </div>

                        <!-- Action Buttons -->
                        <div
                            class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200"
                        >
                            <button
                                onclick=${addMessage}
                                class="px-3 py-1 text-sm border border-gray-300 rounded-md flex items-center bg-white hover:bg-gray-100"
                            >
                                ${createLucideIcon("plus")} Message
                            </button>
                            <button
                                onclick=${() =>
                                    setActiveTab(
                                        activeTab() === "schema"
                                            ? null
                                            : "schema",
                                    )}
                                class=${() =>
                                    "px-3 py-1 text-sm border rounded-md flex items-center hover:bg-gray-100" +
                                    (activeTab() === "schema"
                                        ? "bg-blue-100 border-blue-300"
                                        : "bg-white border-gray-300")}
                            >
                                ${createLucideIcon("plus")} Output Schema
                            </button>
                            <button
                                onclick=${() =>
                                    setActiveTab(
                                        activeTab() === "tools"
                                            ? null
                                            : "tools",
                                    )}
                                class=${() =>
                                    "px-3 py-1 text-sm border rounded-md flex items-center hover:bg-gray-100" +
                                    (activeTab() === "tools"
                                        ? "bg-blue-100 border-blue-300"
                                        : "bg-white border-gray-300")}
                            >
                                ${createLucideIcon("plus")} Tool
                            </button>
                        </div>
                    </div>

                    <!-- Tab Content Area -->
                    ${() =>
                        Show({
                            when: activeTab(),
                            children: () => html`
                                <div
                                    class="bg-white border border-gray-200 rounded-lg overflow-hidden"
                                >
                                    <!-- Tab Headers -->
                                    <div class="flex border-b border-gray-200">
                                        <button
                                            onclick=${() =>
                                                setActiveTab("schema")}
                                            class=${() =>
                                                "px-4 py-2 text-sm font-medium" +
                                                (activeTab() === "schema"
                                                    ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                                                    : "text-gray-500 hover:text-gray-700")}
                                        >
                                            Output Schema
                                        </button>
                                        <button
                                            onclick=${() =>
                                                setActiveTab("tools")}
                                            class=${() =>
                                                "px-4 py-2 text-sm font-medium" +
                                                (activeTab() === "tools"
                                                    ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                                                    : "text-gray-500 hover:text-gray-700")}
                                        >
                                            Tools
                                        </button>
                                        <div class="flex-1"></div>
                                        <button
                                            onclick=${() => setActiveTab(null)}
                                            class="px-3 py-2 text-gray-400 hover:text-gray-600"
                                            title="关闭"
                                        >
                                            ${createLucideIcon("x")}
                                        </button>
                                    </div>

                                    <!-- Tab Content -->
                                    <div class="p-4 max-h-60 overflow-y-auto">
                                        ${() =>
                                            activeTab() === "schema" &&
                                            html`
                                                <div>
                                                    <h3
                                                        class="text-sm font-semibold mb-2"
                                                    >
                                                        Output Schema (JSON)
                                                    </h3>
                                                    <textarea
                                                        value=${outputSchemaText()}
                                                        onchange=${(e) =>
                                                            setOutputSchemaText(
                                                                e.target.value,
                                                            )}
                                                        placeholder=""
                                                        class="w-full p-2 border border-gray-300 rounded-md font-mono text-sm resize-none"
                                                        rows="8"
                                                    ></textarea>
                                                </div>
                                            `}
                                        ${() =>
                                            Show({
                                                when: activeTab() === "tools",
                                                children: html`
                                                    <div>
                                                        <h3
                                                            class="text-sm font-semibold mb-2"
                                                        >
                                                            Tools (JSON)
                                                        </h3>
                                                        <textarea
                                                            value=${toolsText()}
                                                            oninput=${(e) =>
                                                                setToolsText(
                                                                    e.target
                                                                        .value,
                                                                )}
                                                            placeholder=""
                                                            class="w-full p-2 border border-gray-300 rounded-md font-mono text-sm resize-none"
                                                            rows="8"
                                                        ></textarea>
                                                    </div>
                                                `,
                                            })}
                                    </div>
                                </div>
                            `,
                        })}
                </div>

                <!-- Right Panel: Inputs & Output -->
                <div
                    class="col-span-4 flex flex-col gap-6 h-full overflow-hidden"
                >
                    <!-- Inputs -->
                    <div class="bg-white border border-gray-200 rounded-lg p-4">
                        <h2
                            class="text-base font-semibold flex items-center mb-3"
                        >
                            Inputs
                        </h2>
                        <div class="space-y-3">
                            ${() =>
                                variables().map(
                                    (variable) => html`
                                        <div>
                                            <label
                                                class="text-sm font-medium text-gray-700"
                                                >${variable}</label
                                            >
                                            <input
                                                type="text"
                                                value=${inputs()[variable] ||
                                                ""}
                                                onchange=${(e) =>
                                                    handleInputChange(
                                                        variable,
                                                        e.target.value,
                                                    )}
                                                class="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                                                placeholder="Enter variable value..."
                                            />
                                        </div>
                                    `,
                                )}
                            ${Show({
                                when: variables().length === 0,
                                children: html`<p class="text-sm text-gray-500">
                                    No variables found in prompts.
                                </p>`,
                            })}
                        </div>
                    </div>

                    <!-- Output -->
                    <div
                        class="bg-white border border-gray-200 rounded-lg p-4 flex-1 flex flex-col overflow-auto"
                    >
                        <h2
                            class="text-base font-semibold flex items-center mb-3"
                        >
                            Output
                        </h2>
                        <div
                            class="flex-1 overflow-auto bg-gray-50 rounded-md p-3 text-sm"
                        >
                            ${() =>
                                Show({
                                    when: responseResource.loading,
                                    children: html`<p class="text-gray-500">
                                        Generating...
                                    </p>`,
                                })}
                            ${() =>
                                Show({
                                    when: responseResource.error,
                                    children: () => html`<p
                                        class="text-red-500"
                                    >
                                        Error: ${responseResource.error.message}
                                    </p>`,
                                })}
                            ${() =>
                                !responseResource.loading &&
                                responseResource() &&
                                responseResource().type === "stream" &&
                                GraphStateMessage({
                                    state: {
                                        messages: composedStreamContent(),
                                    },
                                    reverse: () => false,
                                })}
                            ${() =>
                                Show({
                                    when:
                                        !responseResource.loading &&
                                        responseResource() &&
                                        responseResource().type === "invoke",
                                    children: () =>
                                        GraphStateMessage({
                                            state: {
                                                messages: [
                                                    responseResource().data,
                                                ],
                                            },
                                            reverse: () => false,
                                        }),
                                })}
                            ${() =>
                                Show({
                                    when:
                                        !responseResource.loading &&
                                        !responseResource() &&
                                        !streamContent(),
                                    children: html`<p class="text-gray-500">
                                        Click Start to run generation...
                                    </p>`, // 初始提示
                                })}
                        </div>
                    </div>
                </div>
            </main>

            <!-- Model Config Modal -->
            ${ModelConfigModal({
                isOpen: showModelModal,
                onClose: () => setShowModelModal(false),
            })}
        </div>
    `;
};
