# 辩论系统示例配置

本目录包含预定义的辩论主题配置示例，可以直接用于测试和运行辩论系统。

## 文件说明

### react-vs-vue.json

React vs Vue 框架对比辩论配置

**辩论主题**: React vs Vue：哪个前端框架更适合现代 Web 开发？

**配置要点**:

-   正方立场: React 是前端开发的最佳选择
-   反方立场: Vue.js 比 React 更适合大多数开发场景
-   辩论轮数: 3 轮
-   模型配置:
    -   正方: gpt-4o-mini
    -   反方: qwen-plus
    -   评判: gpt-4.1-mini

## 使用方法

1. 将 JSON 配置内容传入辩论系统的初始状态
2. 系统会自动加载配置并开始辩论
3. 可以根据需要修改配置参数来自定义辩论

## 配置字段说明

-   `debate_title`: 辩论主题
-   `debate_description`: 主题详细描述
-   `pro_standpoint`: 正方立场
-   `con_standpoint`: 反方立场
-   `debate_rules`: 辩论规则
-   `debate_format`: 辩论流程
-   `pro_model`: 正方 AI 模型
-   `con_model`: 反方 AI 模型
-   `judge_model`: 评判 AI 模型
-   `max_debate_round`: 最大辩论轮数
