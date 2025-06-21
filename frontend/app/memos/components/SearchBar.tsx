import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SearchBarProps {
    onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [query, setQuery] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <Card className="mb-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardContent className="p-3">
                <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2"
                >
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <Input
                            type="text"
                            className="pl-9"
                            placeholder="搜索备忘录..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <Button type="submit" variant="ghost" size="sm">
                        搜索
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default SearchBar;
