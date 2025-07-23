import {
    createSignal,
    For,
    Show,
    createMemo,
    onMount,
    createResource,
} from "solid-js";
import html from "solid-js/html";
import { createLucideIcon } from "./icons.js";
import { ModelConfigModal } from "./components/ModelConfigModal.js";
import { createStoreSignal } from "./utils.js";
import { load } from "https://esm.run/@langchain/core/dist/load/index.js";
import { GraphStateMessage } from "./components/GraphState.js";
// 消息类型选项
const messageTypes = ["system", "human", "ai", "user"];

// 默认消息
const defaultMessage = [
    ["system", "You are a chatbot."],
    ["human", "{question}"],
];

export const PlayGround = () => {
    // 状态管理
    const [messages, setMessages] = createSignal(defaultMessage);
    const [inputs, setInputs] = createSignal({ question: "Hello!" });

    const [modelConfigs] = createStoreSignal("modelConfigs", []);
    const [selectedModelId, setSelectedModelId] = createStoreSignal(
        "selectedModelId",
        null,
    );
    const selectedConfig = createMemo(() => {
        return modelConfigs().find((c) => c.id === selectedModelId());
    });

    const [showModelModal, setShowModelModal] = createSignal(false);

    const [showOutputSchema, setShowOutputSchema] = createSignal(false);
    const [outputSchemaText, setOutputSchemaText] = createSignal("");
    const [showTools, setShowTools] = createSignal(false);
    const [toolsText, setToolsText] = createSignal("[]");

    // Request payload for createResource
    const [requestPayload, setRequestPayload] = createSignal(null);

    // Stream content for streaming responses
    const [streamContent, setStreamContent] = createSignal([]);
    const composedStreamContent = createMemo(() => {
        let content = "";
        for (const i of streamContent()) {
            content += i.content;
        }

        return [
            {
                type: "ai",
                lc: 1,
                content: content,
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

            const endpoint = type === "stream" ? "../llm/stream" : "../llm/invoke";

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
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = "";

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
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
                                    const chunk = JSON.parse(data);
                                    setStreamContent((prev) => [
                                        ...prev,
                                        chunk,
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

    // 在组件挂载时，从 localStorage 加载并设置第一个模型配置（如果存在）
    onMount(() => {
        try {
            const savedConfigs = localStorage.getItem("modelConfigs");
            if (savedConfigs) {
                const configs = JSON.parse(savedConfigs);
                if (configs.length > 0) {
                    setSelectedModelId(configs[0].id);
                }
            }
        } catch (e) {
            console.error("Failed to load and set initial model config:", e);
        }
    });

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
                    <button
                        class="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                        Set up Evaluation
                    </button>
                    <div class="flex rounded-md border border-gray-300">
                        <button
                            onclick=${() => {
                                if (!selectedConfig()) {
                                    alert("请先选择一个模型配置！");
                                    setShowModelModal(true);
                                    return;
                                }
                                setRequestPayload({
                                    messages: messages(),
                                    inputs: inputs(),
                                    model: selectedConfig(),
                                    tools: showTools()
                                        ? JSON.parse(toolsText() || "[]")
                                        : [],
                                    output_schema: showOutputSchema()
                                        ? JSON.parse(outputSchemaText() || "{}")
                                        : undefined,
                                    type: "invoke",
                                });
                            }}
                            disabled=${responseResource.loading}
                            class="px-4 py-1.5 bg-green-600 text-white rounded-l-md flex items-center hover:bg-green-700 disabled:bg-gray-400"
                        >
                            ${createLucideIcon("play")} Start
                        </button>
                        <button
                            onclick=${() => {
                                if (!selectedConfig()) {
                                    alert("请先选择一个模型配置！");
                                    setShowModelModal(true);
                                    return;
                                }
                                setRequestPayload({
                                    messages: messages(),
                                    inputs: inputs(),
                                    model: selectedConfig(),
                                    tools: showTools()
                                        ? JSON.parse(toolsText() || "[]")
                                        : [],
                                    output_schema: showOutputSchema()
                                        ? JSON.parse(outputSchemaText() || "{}")
                                        : undefined,
                                    type: "stream",
                                });
                            }}
                            disabled=${responseResource.loading}
                            class="px-2 py-1.5 bg-green-600 text-white rounded-r-md border-l border-green-700 hover:bg-green-700 disabled:bg-gray-400"
                            title="Start with streaming"
                        >
                            ${createLucideIcon("chevron-down")}
                        </button>
                    </div>
                </div>
            </header>

            <main class="flex-1 grid grid-cols-12 gap-6 p-6 overflow-y-auto">
                <!-- Left and Middle Panel -->
                <div class="col-span-8 flex flex-col gap-4">
                    <div class="flex items-center justify-between">
                        <h2 class="text-base font-semibold flex items-center">
                            Prompts ${createLucideIcon("info")}
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

                    <!-- Messages -->
                    <div class="space-y-3">
                        ${For({
                            each: messages,
                            children: (message, index) => html`
                                <div
                                    class="bg-white border border-gray-200 rounded-lg p-3"
                                >
                                    <div
                                        class="flex justify-between items-center mb-2"
                                    >
                                        <select
                                            value=${message[0]}
                                            onchange=${(e) =>
                                                updateMessage(
                                                    index(),
                                                    e.target.value,
                                                    message[1],
                                                )}
                                            class="font-semibold text-xs uppercase bg-transparent focus:outline-none"
                                        >
                                            ${For({
                                                each: messageTypes,
                                                children: (type) =>
                                                    html`<option value=${type}>
                                                        ${type}
                                                    </option>`,
                                            })}
                                        </select>
                                        <div class="flex items-center">
                                            <button
                                                onclick=${() =>
                                                    removeMessage(index())}
                                                class="p-1 text-gray-400 hover:text-red-500"
                                            >
                                                ${createLucideIcon("trash-2")}
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        value=${message[1]}
                                        oninput=${(e) =>
                                            updateMessage(
                                                index(),
                                                message[0],
                                                e.target.value,
                                            )}
                                        placeholder="Enter a message..."
                                        class="w-full p-2 border border-gray-300 rounded-md resize-y focus:ring-2 focus:ring-blue-400"
                                        rows="3"
                                    ></textarea>
                                </div>
                            `,
                        })}
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center gap-2">
                        <button
                            onclick=${addMessage}
                            class="px-3 py-1 text-sm border border-gray-300 rounded-md flex items-center bg-white hover:bg-gray-100"
                        >
                            ${createLucideIcon("plus")} Message
                        </button>
                        <button
                            onclick=${() => setShowOutputSchema((p) => !p)}
                            class="px-3 py-1 text-sm border border-gray-300 rounded-md flex items-center bg-white hover:bg-gray-100"
                        >
                            ${createLucideIcon("plus")} Output Schema
                        </button>
                        <button
                            onclick=${() => setShowTools((p) => !p)}
                            class="px-3 py-1 text-sm border border-gray-300 rounded-md flex items-center bg-white hover:bg-gray-100"
                        >
                            ${createLucideIcon("plus")} Tool
                        </button>
                    </div>

                    <!-- Advanced Sections -->
                    ${Show({
                        when: showOutputSchema(),
                        children: html`
                            <div
                                class="bg-white border border-gray-200 rounded-lg p-3"
                            >
                                <h3 class="text-sm font-semibold mb-2">
                                    Output Schema (JSON)
                                </h3>
                                <textarea
                                    value=${outputSchemaText()}
                                    oninput=${(e) =>
                                        setOutputSchemaText(e.target.value)}
                                    placeholder='{"type": "object", "properties": {...}}'
                                    class="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                                    rows="6"
                                ></textarea>
                            </div>
                        `,
                    })}
                    ${Show({
                        when: showTools(),
                        children: html`
                            <div
                                class="bg-white border border-gray-200 rounded-lg p-3"
                            >
                                <h3 class="text-sm font-semibold mb-2">
                                    Tools (JSON)
                                </h3>
                                <textarea
                                    value=${toolsText()}
                                    oninput=${(e) =>
                                        setToolsText(e.target.value)}
                                    placeholder='[{"name": "tool_name", "description": "...", "schema": {...}}]'
                                    class="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                                    rows="6"
                                ></textarea>
                            </div>
                        `,
                    })}
                </div>

                <!-- Right Panel: Inputs & Output -->
                <div class="col-span-4 flex flex-col gap-6">
                    <!-- Inputs -->
                    <div class="bg-white border border-gray-200 rounded-lg p-4">
                        <h2
                            class="text-base font-semibold flex items-center mb-3"
                        >
                            Inputs ${createLucideIcon("info")}
                        </h2>
                        <div class="space-y-3">
                            ${For({
                                each: variables(),
                                children: (variable) => html`
                                    <div>
                                        <label
                                            class="text-sm font-medium text-gray-700"
                                            >${variable}</label
                                        >
                                        <input
                                            type="text"
                                            value=${inputs()[variable] || ""}
                                            oninput=${(e) =>
                                                handleInputChange(
                                                    variable,
                                                    e.target.value,
                                                )}
                                            class="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                                            placeholder="Enter variable value..."
                                        />
                                    </div>
                                `,
                            })}
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
                        class="bg-white border border-gray-200 rounded-lg p-4 flex-1 flex flex-col"
                    >
                        <h2
                            class="text-base font-semibold flex items-center mb-3"
                        >
                            Output ${createLucideIcon("info")}
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
                                Show({
                                    when:
                                        !responseResource.loading &&
                                        responseResource() &&
                                        responseResource().type === "stream",
                                    children: () =>
                                        GraphStateMessage({
                                            state: {
                                                messages:
                                                    composedStreamContent(),
                                            },
                                            reverse: () => false,
                                        }),
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
