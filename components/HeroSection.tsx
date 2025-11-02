import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Bot, Zap, Brain, ArrowRight } from "lucide-react";

interface HeroSectionProps {}

const HeroSection: React.FC<HeroSectionProps> = () => {
    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="relative container mx-auto px-4 py-24 lg:py-32">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <Badge
                        variant="secondary"
                        className="mb-6 text-sm px-4 py-2"
                    >
                        <Bot className="w-4 h-4 mr-2" />
                        AI Agent Platform
                    </Badge>

                    {/* Main Heading */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                        Agent{" "}
                        <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Aura
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                        构建、部署和管理智能AI代理的现代化平台。
                        让AI代理像人类一样协作，解决复杂问题。
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <a href="/agent">
                            <Button
                                size="lg"
                                className="text-lg px-8 py-3 h-auto"
                            >
                                开始体验
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </a>
                    </div>

                    {/* Feature Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur">
                            <CardContent className="p-6 text-center">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <Brain className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">智能协作</h3>
                                <p className="text-sm text-muted-foreground">
                                    多代理系统协同工作，解决复杂任务
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur">
                            <CardContent className="p-6 text-center">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <Zap className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">高性能</h3>
                                <p className="text-sm text-muted-foreground">
                                    基于LangGraph的流式处理架构
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur">
                            <CardContent className="p-6 text-center">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <Bot className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">易扩展</h3>
                                <p className="text-sm text-muted-foreground">
                                    模块化设计，支持自定义工具和代理
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
