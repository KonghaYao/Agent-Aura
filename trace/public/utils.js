import html from "solid-js/html";

// 格式化日期时间
export const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

// 格式化文件大小
export const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// JSON 语法高亮
export const highlightJSON = (obj) => {
    if (typeof obj === "string") {
        try {
            obj = JSON.parse(obj);
        } catch (e) {
            return obj;
        }
    }

    let json = JSON.stringify(obj, null, 2);
    return html`<pre>${json}</pre>`;
};
