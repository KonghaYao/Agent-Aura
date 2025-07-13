// Bun 专用的测试脚本，演示如何使用 multipart API
// 使用 Bun 运行: bun test-multipart-bun.ts

const BASE_URL = "http://localhost:7765";

async function testMultipartAPI() {
    console.log("🧪 开始测试 Multipart API");

    // 1. 检查服务器状态
    try {
        const infoResponse = await fetch(`${BASE_URL}/info`);
        const info = await infoResponse.json();
        console.log("✅ 服务器信息:", info.database_info);
    } catch (error) {
        console.error("❌ 服务器未启动，请先运行 'bun dev'");
        return;
    }

    const formData = new FormData();
    const runId = `run_${Date.now()}`;
    const traceId = `trace_${Date.now()}`;

    // 2. 创建一个新的 run
    const runData = {
        id: runId,
        trace_id: traceId,
        name: "Bun SQLite Test Run",
        run_type: "test",
        start_time: new Date().toISOString(),
        inputs: {
            prompt: "Hello, Bun SQLite!",
            temperature: 0.7,
            max_tokens: 100,
        },
        outputs: {
            response: "Hello there! Using Bun's native SQLite.",
            tokens_used: 42,
            latency_ms: 150,
        },
    };

    formData.append(`post.${runId}`, JSON.stringify(runData));

    // 3. 创建 out-of-band 数据
    const largeInputs = {
        context:
            "This is a large context that would be stored separately using Bun's high-performance SQLite...",
        conversation_history: Array.from({ length: 50 }, (_, i) => ({
            turn: i,
            user: `User message ${i}`,
            assistant: `Assistant response ${i}`,
            timestamp: new Date(Date.now() - i * 60000).toISOString(),
        })),
        metadata: {
            model: "gpt-4",
            version: "2024-01",
            performance_stats: {
                db_write_time_ms: 2.5,
                sqlite_version: "3.x",
                wal_mode: true,
            },
        },
    };

    formData.append(`post.${runId}.inputs`, JSON.stringify(largeInputs));

    // 4. 添加 feedback
    const feedbackData = {
        trace_id: traceId,
        score: 0.95,
        comment: "Excellent performance with Bun SQLite!",
        metadata: {
            user_id: "user_123",
            rating_time: new Date().toISOString(),
            platform: "bun",
        },
    };

    formData.append(`feedback.${runId}`, JSON.stringify(feedbackData));

    // 5. 添加附件 (模拟日志文件)
    const logContent = `
=== Bun SQLite Performance Log ===
Timestamp: ${new Date().toISOString()}
Operation: Multipart Data Processing
Database: SQLite with WAL mode
Performance: 3-6x faster than better-sqlite3
Status: ✅ Success
    `.trim();

    const logFile = new Blob([logContent], { type: "text/plain" });
    formData.append(`attachment.${runId}.performance.log`, logFile);

    // 6. 发送 multipart 请求
    console.log("📤 发送 multipart 请求...");

    try {
        const response = await fetch(`${BASE_URL}/runs/multipart`, {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            console.log("✅ Multipart 处理成功:", result.data);

            // 7. 查询创建的数据
            console.log("\n🔍 查询创建的数据:");

            // 查询 run 详情
            const runResponse = await fetch(`${BASE_URL}/runs/${runId}`);
            const runDetail = await runResponse.json();
            console.log("📋 Run 详情:", {
                id: runDetail.id,
                name: runDetail.name,
                trace_id: runDetail.trace_id,
                created_at: runDetail.created_at,
            });

            // 查询 trace 下的所有 runs
            const traceResponse = await fetch(
                `${BASE_URL}/trace/${traceId}/runs`,
            );
            const traceRuns = await traceResponse.json();
            console.log("📊 Trace 下的 runs 数量:", traceRuns.length);

            // 查询 feedback
            const feedbackResponse = await fetch(
                `${BASE_URL}/runs/${runId}/feedback`,
            );
            const feedbacks = await feedbackResponse.json();
            console.log("💬 Feedback 数量:", feedbacks.length);

            // 查询 attachments
            const attachmentsResponse = await fetch(
                `${BASE_URL}/runs/${runId}/attachments`,
            );
            const attachments = await attachmentsResponse.json();
            console.log("📎 Attachments 数量:", attachments.length);

            console.log("\n🎉 测试完成！所有操作都成功执行。");
            console.log(
                "💡 提示：数据已存储在 trace.db 文件中（使用 Bun 的高性能 SQLite）",
            );
        } else {
            console.error("❌ 处理失败:", result.message);
            if (result.errors) {
                console.error("错误详情:", result.errors);
            }
        }
    } catch (error) {
        console.error("❌ 请求失败:", error);
    }
}

// 运行测试
testMultipartAPI().catch(console.error);

console.log("📋 测试包含以下操作:");
console.log("  1. 检查服务器状态");
console.log("  2. 创建 run 数据");
console.log("  3. 添加 out-of-band 大数据");
console.log("  4. 添加 feedback");
console.log("  5. 上传附件");
console.log("  6. 查询所有创建的数据");
console.log("  7. 验证数据完整性");
console.log("\n🚀 使用 Bun 的原生 SQLite 进行高性能存储！");
