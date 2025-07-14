import { createSignal, createResource, onMount } from "solid-js";
import html from "solid-js/html";
import { TraceList } from "./components/TraceList.js";
import { RunsList } from "./components/RunsList.js";
import { RunDetails } from "./components/RunDetails.js";

// 主 App 组件
export const App = () => {
    // 状态
    const [selectedThreadId, setSelectedThreadId] = createSignal(null);
    const [selectedTraceId, setSelectedTraceId] = createSignal(null);
    const [selectedRunId, setSelectedRunId] = createSignal(null);
    const [refreshTrigger, setRefreshTrigger] = createSignal(0);

    // 使用 createResource 获取线程概览列表
    const [allThreads, { refetch: refetchThreads }] = createResource(
        async () => {
            const response = await fetch("/trace/threads/overview");
            if (!response.ok) throw new Error("Failed to load threads");
            const data = await response.json();
            return data.threads || [];
        },
    );

    // 使用 createResource 获取选中线程的 traces
    const [threadTraces, { refetch: refetchThreadTraces }] = createResource(
        () => ({ threadId: selectedThreadId(), refresh: refreshTrigger() }),
        async (params) => {
            if (!params.threadId) return [];
            const response = await fetch(
                `/trace/thread/${params.threadId}/traces`,
            );
            if (!response.ok) throw new Error("Failed to load thread traces");
            const data = await response.json();
            return data.traces || [];
        },
    );

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
    const handleThreadSelect = async (threadId) => {
        setSelectedThreadId(threadId);
        setSelectedTraceId(null);
        setSelectedRunId(null);
    };

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
                threads: allThreads,
                traces: threadTraces,
                selectedThreadId,
                selectedTraceId,
                onThreadSelect: handleThreadSelect,
                onTraceSelect: handleTraceSelect,
                onLoadThreads: refetchThreads,
                onLoadTraces: refetchThreadTraces,
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
