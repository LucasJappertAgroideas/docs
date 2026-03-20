import { createRouter, createWebHashHistory } from 'vue-router';
import DonAvelino from '@/views/don_avelino/DonAvelino.vue';
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
            path: '/lote-don-avelino',
            name: 'lote-don-avelino',
            component: DonAvelino
        },
        {
            path: '/comparativas',
            name: 'comparativas',
            component: Comparativas
        }
    ]
});

export default router;
