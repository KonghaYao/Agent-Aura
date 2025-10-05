import React, { useState } from "react";
import { Memo } from "../types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PencilIcon, TrashIcon, CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemoItemProps {
    memo: Memo;
    onDelete: (key: string) => void;
    onUpdate: (key: string, value: string) => void;
}

const MemoItem: React.FC<MemoItemProps> = ({ memo, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedValue, setEditedValue] = useState(memo.text);

    const handleSave = () => {
        onUpdate(memo.key, editedValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedValue(memo.text);
        setIsEditing(false);
    };

    return (
        <Card className="mb-4 border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-5">
                {isEditing ? (
                    <div className="space-y-4 pt-2">
                        <Textarea
                            className="min-h-[120px] resize-none"
                            value={editedValue}
                            onChange={(e) => setEditedValue(e.target.value)}
                            autoFocus
                        />
                    </div>
                ) : (
                    <div className="prose dark:prose-invert max-w-none pt-2">
                        <p className="whitespace-pre-wrap leading-relaxed">
                            {memo.text}
                        </p>
                    </div>
                )}
            </CardContent>
            <CardFooter
                className={cn(
                    "flex justify-end gap-2 p-4 pt-0",
                    isEditing
                        ? "border-t border-gray-100 dark:border-gray-800"
                        : "",
                )}
            >
                {isEditing ? (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                        >
                            <XIcon className="h-4 w-4 mr-1" /> 取消
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            <CheckIcon className="h-4 w-4 mr-1" /> 保存
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                        >
                            <PencilIcon className="h-4 w-4 mr-1" /> 编辑
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(memo.key)}
                        >
                            <TrashIcon className="h-4 w-4 mr-1" /> 删除
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    );
};

export default MemoItem;
