<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTechAINews } from '@/composables/useTechAINews';
import type { NewsItem } from '@/types/news';

const { news, loading, error, fetchNewsAsync } = useTechAINews();

const selectedNews = ref<NewsItem | null>(null);
const showDialog = ref(false);

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const openDialog = (newsItem: NewsItem): void => {
    selectedNews.value = newsItem;
    showDialog.value = true;
};

const closeDialog = (): void => {
    showDialog.value = false;
    selectedNews.value = null;
};

onMounted(() => {
    fetchNewsAsync();
});
</script>

<template>
    <div class="container">
        <div class="header">
            <h1>🤖 Tech & IA News</h1>
            <p style="color: #8b949e; margin-top: 10px">Noticias de tecnología e inteligencia artificial</p>
        </div>

        <div v-if="loading" class="loading">
            <p>Cargando noticias...</p>
        </div>

        <div v-else-if="error" class="error">
            <p>{{ error }}</p>
        </div>

        <div v-else class="news-grid">
            <div 
                v-for="item in news" 
                :key="item.id" 
                class="news-card"
                @click="openDialog(item)"
            >
                <div v-if="item.image_url" class="news-image">
                    <img :src="item.image_url" :alt="item.title" />
                </div>
                <div class="news-content">
                    <h3 class="news-title">{{ item.title }}</h3>
                    <p class="news-summary">{{ item.summary }}</p>
                    <div class="news-meta">
                        <span class="news-date">{{ formatDate(item.published_date) }}</span>
                        <span v-if="item.category" class="news-category">{{ item.category }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showDialog && selectedNews" class="dialog-overlay" @click="closeDialog">
            <div class="dialog-content" @click.stop>
                <button class="dialog-close" @click="closeDialog">✕</button>
                
                <div v-if="selectedNews.image_url" class="dialog-image">
                    <img :src="selectedNews.image_url" :alt="selectedNews.title" />
                </div>
                
                <h2 class="dialog-title">{{ selectedNews.title }}</h2>
                
                <div class="dialog-meta">
                    <span class="dialog-date">{{ formatDate(selectedNews.published_date) }}</span>
                    <span v-if="selectedNews.category" class="dialog-category">{{ selectedNews.category }}</span>
                </div>
                
                <div v-if="selectedNews.clean_content" class="dialog-body">
                    <p>{{ selectedNews.clean_content }}</p>
                </div>
                
                <a 
                    v-if="selectedNews.link" 
                    :href="selectedNews.link" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="dialog-link"
                >
                    Leer fuente original →
                </a>
            </div>
        </div>
    </div>
</template>

<style scoped>
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.header {
    text-align: center;
    margin-bottom: 3rem;
}

.header h1 {
    color: #e6edf3;
    font-size: 2.5rem;
    margin: 0;
}

.loading,
.error {
    text-align: center;
    padding: 3rem;
    color: #8b949e;
}

.error {
    color: #f85149;
}

.news-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
}

.news-card {
    background: rgba(22, 27, 34, 0.95);
    border: 1px solid #30363d;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
}

.news-card:hover {
    border-color: #58a6ff;
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(88, 166, 255, 0.15);
}

.news-image {
    width: 100%;
    height: 200px;
    overflow: hidden;
}

.news-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.news-content {
    padding: 20px;
}

.news-title {
    color: #e6edf3;
    font-size: 1.1rem;
    margin: 0 0 12px 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.news-summary {
    color: #8b949e;
    font-size: 0.9rem;
    margin: 0 0 16px 0;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.news-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.news-date {
    color: #58a6ff;
    font-size: 0.85rem;
}

.news-category {
    color: #8b949e;
    font-size: 0.85rem;
    background: rgba(139, 148, 158, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
}

.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
}

.dialog-content {
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 12px;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    padding: 30px;
}

.dialog-close {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    color: #8b949e;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 5px;
    line-height: 1;
}

.dialog-close:hover {
    color: #e6edf3;
}

.dialog-image {
    width: 100%;
    max-height: 400px;
    overflow: hidden;
    border-radius: 8px;
    margin-bottom: 20px;
}

.dialog-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.dialog-title {
    color: #e6edf3;
    font-size: 1.5rem;
    margin: 0 0 15px 0;
    line-height: 1.3;
}

.dialog-meta {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #30363d;
}

.dialog-date {
    color: #58a6ff;
    font-size: 0.9rem;
}

.dialog-category {
    color: #8b949e;
    font-size: 0.9rem;
    background: rgba(139, 148, 158, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
}

.dialog-body {
    color: #c9d1d9;
    font-size: 1rem;
    line-height: 1.7;
    margin-bottom: 25px;
    white-space: pre-wrap;
}

.dialog-link {
    display: inline-block;
    color: #58a6ff;
    text-decoration: none;
    font-size: 0.95rem;
    padding: 10px 20px;
    background: rgba(88, 166, 255, 0.1);
    border-radius: 6px;
    transition: background 0.2s;
}

.dialog-link:hover {
    background: rgba(88, 166, 255, 0.2);
}

@media (max-width: 768px) {
    .container {
        padding: 1rem;
    }

    .header h1 {
        font-size: 2rem;
    }

    .news-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .dialog-content {
        padding: 20px;
        max-height: 95vh;
    }

    .dialog-title {
        font-size: 1.3rem;
    }
}
</style>
