import { createSignal, createResource, onMount } from "solid-js";
import html from "solid-js/html";
import { TraceList } from "./components/TraceList.js";
import { RunsList } from "./components/RunsList.js";
import { RunDetails } from "./components/RunDetails.js";

// 主 App 组件
export const App = () => {
    // 状态
    const [selectedTraceId, setSelectedTraceId] = createSignal(null);
    const [selectedRunId, setSelectedRunId] = createSignal(null);
    const [refreshTrigger, setRefreshTrigger] = createSignal(0);

    // 使用 createResource 获取 traces 列表
    const [allTraces, { refetch: refetchTraces }] = createResource(async () => {
        const response = await fetch("/trace");
        if (!response.ok) throw new Error("Failed to load traces");
        const data = await response.json();
        return data.traces || [];
    });

    // 使用 createResource 获取特定 trace 的数据
    const [currentTraceData, { refetch: refetchTraceData }] = createResource(
        () => ({ traceId: selectedTraceId(), refresh: refreshTrigger() }),
        async (params) => {
            if (!params.traceId) return null;
            const response = await fetch(`/trace/${params.traceId}`);
            if (!response.ok) throw new Error("Failed to load trace data");
            return await response.json();
        },
    );

    // 方法
    const handleTraceSelect = async (traceId) => {
        setSelectedTraceId(traceId);
        setSelectedRunId(null);
    };

    const handleRunSelect = (runId) => {
        setSelectedRunId(runId);
    };

    const handleRefresh = async () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    return html`
        <div
            class="three-column h-screen flex flex-row bg-white overflow-hidden"
        >
            ${TraceList({
                traces: allTraces,
                selectedTraceId,
                onTraceSelect: handleTraceSelect,
                onLoadTraces: refetchTraces,
            })}
            ${RunsList({
                selectedTraceId,
                selectedRunId,
                currentTraceData,
                onRunSelect: handleRunSelect,
                onRefresh: handleRefresh,
                onLoadTrace: refetchTraceData,
            })}
            ${RunDetails({
                selectedRunId,
                currentTraceData,
            })}
        </div>
    `;
};
