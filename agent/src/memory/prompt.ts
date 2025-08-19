import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const CANDIDATE_PROFILE_TOPICS = `
1. 基本信息
    1.1 用户姓名
    1.2 性别
    1.3 出生日期
    1.4 国籍
    1.5 民族
    1.6 语言
2. 联系信息
    2.1 电子邮件
    2.2 电话
    2.3 城市
    2.4 省份
3. 教育背景
    3.1 学校
    3.2 学位
    3.3 专业
    3.4 毕业年份
4. 人口统计
    4.1 婚姻状况
    4.2 子女数量
    4.3 家庭收入
5. 工作
    5.1 公司
    5.2 职位
    5.3 工作地点
    5.4 参与项目
    5.5 工作技能
6. 兴趣爱好
    6.1 书籍
    6.2 电影
    6.3 音乐
    6.4 美食
    6.5 运动
7. 生活方式
    7.1 饮食偏好    
    7.2 运动习惯
    7.3 健康状况
    7.4 睡眠模式
    7.5 吸烟
    7.6 饮酒
8. 心理特征
    8.1 性格特点
9. 人生大事
    9.1 婚姻
    9.2 搬迁
    9.3 退休
`;

export const MemorySchema = z.object({
    memories: z.array(
        z.object({
            content: z.string(),
            type: z.enum([
                "background_context",
                "key_decisions",
                "tool_usage_log",
                "user_intent_evolution",
                "execution_results",
                "errors_and_solutions",
                "open_issues",
                "future_plans",
                "user_info",
            ]),
            mentionedAt: z.string(),
            occurredAt: z.string().nullish(),
        }),
    ),
});

export const MEMORY_PROMPT_TEMPLATE = (
    options: {} = {},
) => `你是一名从对话中结构化记录"用户信息、事件、日程"的专家。
你将获得用户与助手的对话，请基于时间线进行精炼、去重与标准化记录。

### 任务
- 从对话中提取并输出记忆条目，根据内容性质进行分类。
- 仅记录与目标主题/属性强相关的信息，避免无关内容与重复。

### 输出格式
- 请使用 JSON 数组格式输出你的记录结果，每个元素包含 \`content\` (内容), \`type\` (类型), \`mentionedAt\` (提及时间), 和可选的 \`occurredAt\` (发生时间)。
- \`mentionedAt\` 和 \`occurredAt\` 字段使用 'yyyy/MM/dd HH:mm:ss' 或 'yyyy/MM/dd' 或 'yyyy' 格式。

### 类型分类说明

请根据以下规则对内容进行分类：

1. **background_context** (背景上下文)
   - 项目类型和技术栈信息
   - 当前工作目录和环境设置
   - 用户的总体目标和期望

2. **key_decisions** (关键决策)
   - 重要的技术选择和决策原因
   - 架构决策和设计考虑
   - 问题解决方案的选择过程

3. **tool_usage_log** (工具使用记录)
   - 主要使用的工具类型和频率
   - 文件操作历史记录
   - 命令执行结果和影响

4. **user_intent_evolution** (用户意图演进)
   - 需求的变化过程和原因
   - 优先级调整和重新排序
   - 新增功能需求和期望

5. **execution_results** (执行结果汇总)
   - 成功完成的任务和成果
   - 生成的代码、文件或文档
   - 验证和测试结果

6. **errors_and_solutions** (错误与解决)
   - 遇到的问题类型和严重程度
   - 错误处理方法和步骤
   - 经验教训和最佳实践

7. **open_issues** (未解决问题)
   - 当前待解决的技术问题
   - 已知的限制和约束条件
   - 需要后续处理的事项

8. **future_plans** (后续计划)
   - 下一步行动计划和时间安排
   - 长期目标规划和里程碑
   - 用户期望的功能和特性

9. **user_info** (用户信息)
   
### user_info 抽取方向

${CANDIDATE_PROFILE_TOPICS}


### 回复格式说明

\`\`\`json
${
    /** @ts-ignore */
    JSON.stringify(zodToJsonSchema(MemorySchema))
}
\`\`\`

示例：
\`\`\`json
{
    "memories":[
    {
        "content": "用户正在开发一个基于 React 和 TypeScript 的前端应用，目标是创建一个现代化的用户界面。",
        "type": "background_context",
        "mentionedAt": "2023/01/23 10:30:00",
        "occurredAt": "2023/01/23 10:30:00"
    },
    {
        "content": "决定使用 Next.js 框架来获得更好的 SEO 和性能优化。",
        "type": "key_decisions",
        "mentionedAt": "2023/01/23 10:35:00",
        "occurredAt": null
    },
]
}
\`\`\`

### 内容要求
- 列出用户信息与日程安排。

### 语言
- 输出语言应与输入语言一致（英文输入则英文输出，中文输入则中文输出）。
- 避免重复记录。

### 环境信息
- 现在时间是 ${new Date().toLocaleString()}。
`;
