<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useTechAINews } from "./composables/useTechAINews";
import type { NewsItem } from "@/types/news";
import type { TechAINewsSortBy } from "./types/types";

const { news, loading, error, sortBy, fetchNewsAsync } = useTechAINews();

const selectedNews = ref<NewsItem | null>(null);
const showDialog = ref(false);

const sortOptions: { value: TechAINewsSortBy; label: string }[] = [
    { value: "created_at", label: "Fecha de creación" },
    { value: "published_date", label: "Fecha de publicación" },
];

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const displayDate = (item: NewsItem): string => {
    const raw = sortBy.value === "created_at" ? item.created_at : item.published_date;
    return formatDate(raw);
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
            <p class="header-subtitle">Noticias de tecnología e inteligencia artificial</p>
            <div class="toolbar">
                <label class="sort-label" for="tech-ai-news-sort">Ordenar por</label>
                <select id="tech-ai-news-sort" v-model="sortBy" class="sort-select">
                    <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                    </option>
                </select>
            </div>
        </div>

        <div v-if="loading" class="loading">
            <p>Cargando noticias...</p>
        </div>

        <div v-else-if="error" class="error">
            <p>{{ error }}</p>
        </div>

        <div v-else class="news-grid">
            <div v-for="item in news" :key="item.id" class="news-card" @click="openDialog(item)">
                <div v-if="item.image_url" class="news-image">
                    <img :src="item.image_url" :alt="item.title" />
                </div>
                <div class="news-content">
                    <h3 class="news-title">{{ item.title }}</h3>
                    <p class="news-summary">{{ item.summary }}</p>
                    <div class="news-meta">
                        <span class="news-date">{{ displayDate(item) }}</span>
                        <span v-if="item.category" class="news-category">{{ item.category }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showDialog && selectedNews" class="dialog-overlay" @click="closeDialog">
            <div class="dialog-content" @click.stop>
                <button class="dialog-close" type="button" @click="closeDialog">✕</button>

                <div v-if="selectedNews.image_url" class="dialog-image">
                    <img :src="selectedNews.image_url" :alt="selectedNews.title" />
                </div>

                <h2 class="dialog-title">{{ selectedNews.title }}</h2>

                <div class="dialog-meta dialog-meta-dates">
                    <span class="dialog-date">Publicado: {{ formatDate(selectedNews.published_date) }}</span>
                    <span class="dialog-date-secondary">Creado: {{ formatDate(selectedNews.created_at) }}</span>
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
                    {{ selectedNews.link }}
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

.header-subtitle {
    color: #8b949e;
    margin-top: 10px;
    margin-bottom: 0;
}

.toolbar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 1.25rem;
    flex-wrap: wrap;
}

.sort-label {
    color: #8b949e;
    font-size: 0.9rem;
}

.sort-select {
    background: rgba(22, 27, 34, 0.95);
    border: 1px solid #30363d;
    border-radius: 8px;
    color: #e6edf3;
    padding: 8px 12px;
    font-size: 0.9rem;
    min-width: 220px;
    cursor: pointer;
}

.sort-select:hover,
.sort-select:focus {
    border-color: #58a6ff;
    outline: none;
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
    line-clamp: 2;
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
    line-clamp: 3;
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
    width: 98vw;
    height: 98vh;
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

.dialog-meta-dates {
    flex-wrap: wrap;
    align-items: center;
}

.dialog-date {
    color: #58a6ff;
    font-size: 0.9rem;
}

.dialog-date-secondary {
    color: #8b949e;
    font-size: 0.85rem;
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

    .dialog-link {
        word-break: break-all;
        white-space: normal;
        padding: 10px 15px;
        font-size: 0.85rem;
    }

    .sort-select {
        min-width: 100%;
    }
}
</style>
