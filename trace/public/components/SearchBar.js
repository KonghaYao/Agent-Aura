import { createSignal, createResource } from "solid-js";
import html from "solid-js/html";

export const SearchBar = (props) => {
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
    return html`
        <div class="p-4 border-b border-gray-200">
            <h1 class="text-lg font-semibold text-gray-900 mb-4">会话监控</h1>

            <!-- 系统过滤器 -->
            <div class="mb-3">
                <select
                    value=${props.selectedSystem}
                    onchange=${(e) => props.onSystemChange(e?.target?.value)}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                    <option value="">全部系统</option>
                    ${() => {
                        return systems.loading
                            ? html`<option disabled>加载中...</option>`
                            : (systems() || []).map(
                                  (system) =>
                                      html`<option value=${system}>
                                          ${system}
                                      </option>`,
                              );
                    }}
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
                    value=${props.searchQuery}
                    oninput=${(e) => props.onSearchChange(e?.target?.value)}
                    placeholder="搜索 Thread ID 或 Trace ID..."
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
        </div>
    `;
};
