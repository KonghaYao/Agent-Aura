// 格式化执行时间
export const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "N/A";
    const duration = parseInt(endTime) - parseInt(startTime);
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(2)}s`;
    return `${(duration / 60000).toFixed(2)}m`;
};

// 解析 JSON 字符串
export const parseJSON = (jsonString) => {
    try {
        return JSON.parse(jsonString);
    } catch {
        return null;
    }
};

// 格式化时间戳
export const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1);
    return date.toLocaleString();
};

export const getRunType = (run) => {
    if (run.serialized) {
        try {
            const serialized = JSON.parse(run.serialized);
            if (serialized.id) {
                return serialized.id[serialized.id.length - 1];
            }
        } catch {
            return "unknown";
        }
    }
    return "unknown";
};

export const getMetaDataOfRun = (run) => {
    if (run.extra) {
        try {
            const extra = JSON.parse(run.extra);
            return extra.metadata;
        } catch {
            return null;
        }
    }
};
