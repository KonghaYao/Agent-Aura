import html from "solid-js/html";
import { A } from "@solidjs/router";
import { For } from "solid-js";

const menuItems = [
    {
        href: "#/",
        title: "主页",
        iconSrc: "https://unpkg.com/lucide-static@0.525.0/icons/workflow.svg",
    },
    {
        href: "#/overview",
        title: "数据概览",
        iconSrc:
            "https://unpkg.com/lucide-static@0.525.0/icons/chart-bar-big.svg",
    },
];

export const Layout = (props) => {
    const navLinks = For({
        each: menuItems,
        children: (item) => html`
            <a
                href=${item.href}
                class="flex items-center justify-center p-2 text-gray-700 hover:bg-gray-200 rounded-md transition-colors duration-200"
                title=${item.title}
            >
                <img src=${item.iconSrc} class="w-6 h-6" />
            </a>
        `,
    });

    return html`
        <div class="flex h-screen bg-gray-100">
            <!-- 左侧菜单栏 -->
            <div
                class="w-20 bg-white shadow-lg flex flex-col p-4 border-r border-gray-200"
            >
                <nav class="flex flex-col space-y-4">${navLinks}</nav>
            </div>
            <!-- 内容区域 -->
            <div class="flex-1 overflow-auto">${props.children}</div>
        </div>
    `;
};
