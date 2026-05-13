import { ref, computed } from "vue";
import type { NewsItem, NewsResponse } from "@/types/news";
import type { TechAINewsSortBy } from "../types/types";

const API_KEY = "ak_prod_H7f9L2mP4vQ8xT1wN5yK3zR6bJ0cE4gD";
const API_URL = "https://core-api.agroideassa.com/api/v1/news-pipeline/news/tech_ai";
const FETCH_LIMIT = 50;

export function useTechAINews() {
    const news = ref<NewsItem[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);
    const sortBy = ref<TechAINewsSortBy>("created_at");

    const sortedNews = computed(() => {
        const field = sortBy.value;
        return [...news.value].sort((a, b) => {
            return new Date(b[field]).getTime() - new Date(a[field]).getTime();
        });
    });

    async function fetchNewsAsync(): Promise<void> {
        loading.value = true;
        error.value = null;

        try {
            const response = await fetch(`${API_URL}?limit=${FETCH_LIMIT}`, {
                headers: {
                    "X-Api-Key": API_KEY,
                },
            });

            if (!response.ok) {
                throw new Error("Error al cargar las noticias");
            }

            const data: NewsResponse = await response.json();

            if (data.success && data.news) {
                news.value = data.news;
            } else {
                throw new Error("Respuesta inválida del servidor");
            }
        } catch (e) {
            error.value = e instanceof Error ? e.message : "Error desconocido";
            console.error("📰 [useTechAINews] Error:", e);
        } finally {
            loading.value = false;
        }
    }

    return {
        news: sortedNews,
        loading,
        error,
        sortBy,
        fetchNewsAsync,
    };
}
