"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Settings,
    Plus,
    Trash2,
    Edit,
    Globe,
    RefreshCw,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import { useTools } from "../context/ToolsContext";
import { MCPServerConfig } from "@/app/api/mcp/route";

interface MCPConfigDialogProps {
    trigger?: React.ReactNode;
}

interface ServerForm {
    name: string;
    url: string;
}

const defaultServerForm: ServerForm = {
    name: "",
    url: "",
};

export const MCPConfigDialog: React.FC<MCPConfigDialogProps> = ({
    trigger,
}) => {
    const {
        mcpConfig,
        setMcpConfig,
        isLoadingMcpTools,
        mcpToolsError,
        refreshMcpTools,
        mcpTools,
    } = useTools();

    const [open, setOpen] = useState(false);
    const [editingServer, setEditingServer] = useState<string | null>(null);
    const [serverForm, setServerForm] = useState<ServerForm>(defaultServerForm);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // 重置表单
    const resetForm = () => {
        setServerForm(defaultServerForm);
        setEditingServer(null);
        setFormErrors({});
    };

    // 验证表单
    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!serverForm.name.trim()) {
            errors.name = "服务器名称不能为空";
        } else if (
            serverForm.name in mcpConfig &&
            editingServer !== serverForm.name
        ) {
            errors.name = "服务器名称已存在";
        }

        if (!serverForm.url?.trim()) {
            errors.url = "服务器 URL 不能为空";
        } else {
            try {
                new URL(serverForm.url);
            } catch {
                errors.url = "请输入有效的 URL";
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // 保存服务器配置
    const saveServer = () => {
        if (!validateForm()) return;

        const config: MCPServerConfig = {
            url: serverForm.url,
        };

        const newConfig = { ...mcpConfig };

        // 如果是编辑模式且名称改变了，删除旧的配置
        if (editingServer && editingServer !== serverForm.name) {
            delete newConfig[editingServer];
        }

        newConfig[serverForm.name] = config;
        setMcpConfig(newConfig);
        resetForm();
    };

    // 编辑服务器
    const editServer = (name: string) => {
        const config = mcpConfig[name];
        setServerForm({
            name,
            url: config.url || "",
        });
        setEditingServer(name);
    };

    // 删除服务器
    const deleteServer = (name: string) => {
        const newConfig = { ...mcpConfig };
        delete newConfig[name];
        setMcpConfig(newConfig);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="relative cursor-pointer"
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        MCP 配置
                        {mcpTools.length > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-500 rounded-full">
                                {mcpTools.length}
                            </span>
                        )}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        MCP 服务器配置
                        <div className="flex items-center gap-2 ml-auto">
                            {isLoadingMcpTools ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                    加载中
                                </span>
                            ) : mcpToolsError ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    错误
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {mcpTools.length} 个工具
                                </span>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={refreshMcpTools}
                                disabled={isLoadingMcpTools}
                            >
                                <RefreshCw
                                    className={`w-4 h-4 ${
                                        isLoadingMcpTools ? "animate-spin" : ""
                                    }`}
                                />
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
                    {/* 添加/编辑服务器表单 */}
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">
                                {editingServer ? "编辑服务器" : "添加新服务器"}
                            </h3>
                            {editingServer && (
                                <Button variant="outline" onClick={resetForm}>
                                    取消编辑
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {/* 服务器名称 */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="serverName"
                                    className="text-sm font-medium"
                                >
                                    服务器名称 *
                                </label>
                                <Input
                                    id="serverName"
                                    value={serverForm.name}
                                    onChange={(e) =>
                                        setServerForm({
                                            ...serverForm,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="例如: langgraph-docs"
                                />
                                {formErrors.name && (
                                    <p className="text-sm text-red-500">
                                        {formErrors.name}
                                    </p>
                                )}
                            </div>

                            {/* 服务器 URL */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="url"
                                    className="text-sm font-medium"
                                >
                                    服务器 URL *
                                </label>
                                <Input
                                    id="url"
                                    value={serverForm.url}
                                    onChange={(e) =>
                                        setServerForm({
                                            ...serverForm,
                                            url: e.target.value,
                                        })
                                    }
                                    placeholder="https://gitmcp.io/langchain-ai/langgraph"
                                />
                                {formErrors.url && (
                                    <p className="text-sm text-red-500">
                                        {formErrors.url}
                                    </p>
                                )}
                            </div>
                        </div>

                        <Button onClick={saveServer} className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            {editingServer ? "更新服务器" : "添加服务器"}
                        </Button>
                    </div>

                    {/* 错误信息 */}
                    {mcpToolsError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">
                                {mcpToolsError}
                            </p>
                        </div>
                    )}

                    {/* 服务器列表 */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                            已配置的服务器 ({Object.keys(mcpConfig).length})
                        </h3>

                        {Object.keys(mcpConfig).length === 0 ? (
                            <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                                暂无配置的服务器，请在上方添加
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {Object.entries(mcpConfig).map(
                                    ([name, config]) => (
                                        <div
                                            key={name}
                                            className="flex items-center justify-between p-4 border rounded-lg bg-white"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium">
                                                        {name}
                                                    </h4>
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        <Globe className="w-3 h-3 mr-1" />
                                                        SSE
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 truncate">
                                                    {config.url}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        editServer(name)
                                                    }
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        deleteServer(name)
                                                    }
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                    </div>

                    {/* 工具列表 */}
                    {mcpTools.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">
                                已加载的工具 ({mcpTools.length})
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {mcpTools.map((tool, index) => (
                                    <div
                                        key={index}
                                        className="p-3 border rounded-lg bg-white"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h5 className="font-medium text-sm">
                                                {tool.name}
                                            </h5>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {(tool as any)._serverName}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 line-clamp-2">
                                            {tool.description || "无描述"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
