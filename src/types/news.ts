export interface NewsItem {
    id: number;
    topic_id: string;
    tags_hash: string;
    tags: string;
    title: string;
    summary: string;
    category: string;
    image_url: string | null;
    link: string;
    published_date: string;
    created_at: string;
    clean_content: string | null;
    audio_url: string | null;
    podcast_script: string | null;
    metadata: string | null;
}

export interface NewsResponse {
    success: boolean;
    topic_id: string;
    total_news: number;
    returned_news: number;
    limit: number;
    news: NewsItem[];
}
