import React, { useState } from "react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon } from "lucide-react";

interface MemoFormProps {
    onSubmit: (value: string) => void;
}

const MemoForm: React.FC<MemoFormProps> = ({ onSubmit }) => {
    const [value, setValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;

        setIsSubmitting(true);
        onSubmit(value);
        setValue("");
        setIsSubmitting(false);
    };

    return (
        <Card className="mb-8 border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-medium">
                    记录新想法
                </CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent>
                    <Textarea
                        className="min-h-[120px] resize-none"
                        placeholder="写下你的想法..."
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required
                    />
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={isSubmitting || !value.trim()}
                    >
                        <SendIcon className="h-4 w-4 mr-2" /> 保存想法
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};

export default MemoForm;
