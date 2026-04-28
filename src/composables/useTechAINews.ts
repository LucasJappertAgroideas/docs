import { ref, computed } from 'vue';
import type { NewsItem, NewsResponse } from '@/types/news';

const API_KEY = 'ak_prod_H7f9L2mP4vQ8xT1wN5yK3zR6bJ0cE4gD';
const API_URL = 'https://core-api.agroideassa.com/api/v1/news-pipeline/news/tech_ai';

export function useTechAINews() {
    const news = ref<NewsItem[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);

    const sortedNews = computed(() => {
        return [...news.value].sort((a, b) => {
            return new Date(b.published_date).getTime() - new Date(a.published_date).getTime();
        });
    });

    async function fetchNewsAsync(): Promise<void> {
        loading.value = true;
        error.value = null;

        try {
            const response = await fetch(`${API_URL}?limit=20`, {
                headers: {
                    'X-Api-Key': API_KEY
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar las noticias');
            }

            const data: NewsResponse = await response.json();
            
            if (data.success && data.news) {
                news.value = data.news;
            } else {
                throw new Error('Respuesta inválida del servidor');
            }
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Error desconocido';
            console.error('📰 [useTechAINews] Error:', e);
        } finally {
            loading.value = false;
        }
    }

    return {
        news: sortedNews,
        loading,
        error,
        fetchNewsAsync
    };
}
