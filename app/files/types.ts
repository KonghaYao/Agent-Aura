export type File = {
    id: number;
    user_id: string;
    conversation_id: string | null;
    file_name: string;
    file_size: number;
    file_type: string;
    oss_url: string;
    category: string | null;
    tags: string[];
    is_ai_gen: boolean;
    create_time: string;
    update_time: string;
};
