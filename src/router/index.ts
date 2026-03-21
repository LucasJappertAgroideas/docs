import { createRouter, createWebHashHistory } from 'vue-router';
import LoteView from '@/views/LoteView.vue';
import Comparativas from '@/views/Comparativas.vue';
import Index from '@/views/Index.vue';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: Index
        },
        {
            path: '/lotes',
            name: 'lotes',
            component: LoteView
        },
        {
            path: '/lote',
            name: 'lote',
            redirect: '/lotes'
        },
        // Redirecciones de rutas antiguas a nueva estructura
        {
            path: '/lote-don-avelino',
            redirect: '/lote?field_id=198'
        },
        {
            path: '/lote-agroarnaudo-lote-1',
            redirect: '/lote?field_id=281'
        },
        {
            path: '/don-avelino-el-lucero-lote-14',
            redirect: '/lote?field_id=282'
        },
        {
            path: '/comparativas',
            name: 'comparativas',
            component: Comparativas
        },
        // Redirecciones de rutas antiguas a nueva estructura
        {
            path: '/comparativas-inta.html',
            redirect: '/comparativas?region=inta'
        },
        {
            path: '/comparativas-la-merced.html',
            redirect: '/comparativas?region=la-merced'
        },
        {
            path: '/comparativas.html',
            redirect: '/comparativas?region=inta'
        }
    ]
});

export default router;
