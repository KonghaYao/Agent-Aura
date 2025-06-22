import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon } from "lucide-react";

interface MemoFormProps {
    onSubmit: (value: string) => void;
}

const MemoForm: React.FC<MemoFormProps> = ({ onSubmit }) => {
    const [value, setValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;

        setIsSubmitting(true);
        onSubmit(value);
        setValue("");
        setIsSubmitting(false);
        setIsExpanded(false);
    };

    const handleCancel = () => {
        setValue("");
        setIsExpanded(false);
    };

    if (!isExpanded) {
        return (
            <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsExpanded(true)}
            >
                <PlusIcon className="h-4 w-4 mr-2" />
                新建备忘录
            </Button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
                className="min-h-[80px] resize-none text-sm"
                placeholder="写下你的想法..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
                required
            />
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="flex-1"
                >
                    取消
                </Button>
                <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || !value.trim()}
                    className="flex-1"
                >
                    保存
                </Button>
            </div>
        </form>
    );
};

export default MemoForm;
