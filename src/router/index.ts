import { createRouter, createWebHashHistory } from 'vue-router';

/** Rutas con import dinámico: cada vista (y dependencias pesadas) va a su propio chunk. */
const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('@/views/Index.vue')
        },
        {
            path: '/lotes',
            name: 'lotes',
            component: () => import('@/views/LoteView.vue')
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
            component: () => import('@/views/Comparativas.vue')
        },
        {
            path: '/diagnostico-cultivos',
            name: 'diagnostico-cultivos',
            component: () => import('@/views/DiagnosticoCultivos.vue')
        },
        {
            path: '/diagnostico-cultivos-v2',
            name: 'diagnostico-cultivos-v2',
            component: () => import('@/views/DiagnosticoCultivosV2.vue')
        },
        {
            path: '/diagnostico-cultivos-v3',
            name: 'diagnostico-cultivos-v3',
            component: () => import('@/views/diagnostico-cultivo-v3/DiagnosticoCultivosV3.vue')
        },
        {
            path: '/diagnostico-cultivos-v4',
            name: 'diagnostico-cultivos-v4',
            component: () => import('@/views/diagnostico-cultivo-v4/DiagnosticoCultivosV4.vue')
        },
        {
            path: '/comparativa-campos',
            name: 'comparativa-campos',
            component: () => import('@/views/comparativa-campos/ComparativaCampos.vue')
        },
        {
            path: '/mapas-productividad',
            name: 'mapas-productividad',
            component: () => import('@/views/mapas-productividad/MapasProductividad.vue')
        },
        {
            path: '/sistemas/sprints',
            name: 'sprints',
            component: () => import('@/views/sistemas/sprints/Sprints.vue')
        },
        {
            path: '/tech-ia-news',
            name: 'tech-ia-news',
            component: () => import('@/views/tech-ai-news/TechIANews.vue')
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
