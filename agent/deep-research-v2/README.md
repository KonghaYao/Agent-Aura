# Deep Research V2

一个**多代理协作**的深度研究系统：主代理负责流程编排，规划代理负责把需求变成计划，搜索代理负责收集高质量来源；最后由工作流工具把来源内容压缩并生成报告。

## Agent：Lead Research Manager（`research_agent`）

-   **职责**
    -   作为“流程总控”，决定什么时候进入规划/搜索/生成报告阶段
    -   负责调用子代理与工作流工具；自身不直接做网页搜索与内容抓取
    -   在关键节点暂停，等待用户确认（Human-in-the-loop）
-   **与其他 agent 的联系**
    -   需要澄清需求时：调用 `ask_plan_subagent`（Planning Agent）产出研究计划
    -   计划明确后：调用 `ask_search_subagent`（Search Agent）收集来源 URL 列表
    -   搜索结果确认后：调用 `start_deep_research` 生成最终报告
-   **可用工具**
    -   `ask_plan_subagent`：委派“需求澄清/研究计划”
    -   `ask_search_subagent`：委派“网页搜索/来源收集”
    -   `stop_for_human_approve`：暂停流程，等待用户确认（规划后、搜索后）
    -   `start_deep_research`：启动“内容处理 + 报告生成”的工作流（基于已收集的来源）

## Agent：Planning Agent（`ask_plan_subagent`）

-   **职责**
    -   与用户对话，把模糊需求转成**结构化研究计划**
    -   在必要信息不足时，用少量轮次补齐目标/范围/输出格式（上限由 agent 内部策略控制）
-   **与其他 agent 的联系**
    -   仅由 Lead Research Manager 调用
    -   输出研究计划给主流程，作为 Search Agent 的输入依据
    -   不直接做网页搜索，不生成最终报告
-   **可用工具**
    -   `ask_user_with_options`：向用户提出结构化问题（单选/多选 + 可选自定义输入）

## Agent：Search Agent（`ask_search_subagent`）

-   **职责**
    -   执行网页搜索与筛选：只做“找资料、挑来源”，不直接写结论报告
    -   产出每个主题的 **3–5 个高质量来源 URL**（去广告、去低质）
    -   以“主题”为单位把结果提交回主流程（写入 `search_results[]`）
-   **与其他 agent 的联系**
    -   仅由 Lead Research Manager 调用（可基于 Planning Agent 的计划下达搜索任务）
    -   搜索结束必须通过 `end_of_search` 提交：`topic` + `useful_webpages`
-   **可用工具**
    -   `tavily_search`：执行网络搜索
    -   `think_tool`：记录搜索进度/缺口/下一步（用于自我校准）
    -   `change_research_topic`：切换搜索主题，并提交当前主题已收集结果
    -   `end_of_search`：结束本轮搜索并提交结果（包含 `topic` + `useful_webpages`）

## Agent 间协作流程（总览）

```text
用户请求
  →（可选）ask_plan_subagent：澄清需求 / 输出计划
  → stop_for_human_approve：用户确认“计划”
  → ask_search_subagent：按主题收集来源 URL（写入 search_results[]）
  → stop_for_human_approve：用户确认“来源充分”
  → start_deep_research：抓取网页（tavily_extract）→ 压缩主题要点 → 生成最终报告
```
