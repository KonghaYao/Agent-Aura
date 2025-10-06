import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";

interface SearchBarProps {
    onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [query, setQuery] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        // 实时搜索
        onSearch(value);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                    type="text"
                    className="pl-9 h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                    placeholder="搜索备忘录..."
                    value={query}
                    onChange={handleChange}
                />
            </div>
        </form>
    );
};

export default SearchBar;
