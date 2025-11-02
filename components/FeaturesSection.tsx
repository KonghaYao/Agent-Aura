import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
    Code,
    Database,
    MessageSquare,
    Workflow,
    Shield,
    Zap,
    Users,
    Globe,
    Cpu,
    BarChart3,
    LucideIcon,
} from "lucide-react";

interface Feature {
    icon: React.ReactElement<LucideIcon>;
    title: string;
    description: string;
    badge: string;
}

interface Stat {
    label: string;
    value: string;
}

interface FeaturesSectionProps {}

const FeaturesSection: React.FC<FeaturesSectionProps> = () => {
    const features: Feature[] = [
        {
            icon: <Workflow className="w-8 h-8" />,
            title: "多代理编排",
            description:
                "基于LangGraph的工作流引擎，支持复杂的代理协作和任务编排。",
            badge: "核心功能",
        },
        {
            icon: <Code className="w-8 h-8" />,
            title: "代码生成",
            description: "智能代码生成和重构，支持多种编程语言和框架。",
            badge: "AI能力",
        },
        {
            icon: <Database className="w-8 h-8" />,
            title: "内存管理",
            description: "持久化内存系统，支持上下文管理和长期记忆。",
            badge: "基础设施",
        },
        {
            icon: <MessageSquare className="w-8 h-8" />,
            title: "对话界面",
            description: "现代化的聊天界面，支持实时对话和多模态交互。",
            badge: "用户体验",
        },
        {
            icon: <Shield className="w-8 h-8" />,
            title: "安全认证",
            description: "基于Better Auth的安全认证系统，保护用户数据安全。",
            badge: "安全",
        },
        {
            icon: <Globe className="w-8 h-8" />,
            title: "工具集成",
            description: "丰富的工具生态，支持API调用、数据库查询等外部集成。",
            badge: "扩展性",
        },
        {
            icon: <Cpu className="w-8 h-8" />,
            title: "高性能",
            description: "优化的流式处理架构，支持高并发和大流量场景。",
            badge: "性能",
        },
        {
            icon: <BarChart3 className="w-8 h-8" />,
            title: "可视化监控",
            description: "实时的代理运行状态监控和性能指标展示。",
            badge: "运维",
        },
    ];

    const stats: Stat[] = [
        { label: "活跃代理", value: "100+" },
        { label: "支持工具", value: "50+" },
        { label: "处理请求", value: "10M+" },
        { label: "用户满意度", value: "98%" },
    ];

    return (
        <section className="py-24 bg-muted/30">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <Badge variant="outline" className="mb-4">
                        强大功能
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        构建智能AI代理生态
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        从简单对话到复杂任务编排，Agent Aura
                        提供完整的AI代理解决方案。
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
                    {features.map((feature, index) => (
                        <Card
                            key={index}
                            className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm"
                        >
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                                        {feature.icon}
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {feature.badge}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg">
                                    {feature.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
