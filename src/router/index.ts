import { createRouter, createWebHashHistory } from 'vue-router';
import LoteView from '@/views/LoteView.vue';
import Comparativas from '@/views/Comparativas.vue';
import DiagnosticoCultivos from '@/views/DiagnosticoCultivos.vue';
import DiagnosticoCultivosV2 from '@/views/DiagnosticoCultivosV2.vue';
import DiagnosticoCultivosV3 from '@/views/diagnostico-cultivo-v3/DiagnosticoCultivosV3.vue';
import DiagnosticoCultivosV4 from '@/views/diagnostico-cultivo-v4/DiagnosticoCultivosV4.vue';
import ComparativaCampos from '@/views/comparativa-campos/ComparativaCampos.vue';
import MapasProductividad from '@/views/mapas-productividad/MapasProductividad.vue';
import Index from '@/views/Index.vue';
import Sprints from '@/views/sistemas/sprints/Sprints.vue';

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
        {
            path: '/diagnostico-cultivos',
            name: 'diagnostico-cultivos',
            component: DiagnosticoCultivos
        },
        {
            path: '/diagnostico-cultivos-v2',
            name: 'diagnostico-cultivos-v2',
            component: DiagnosticoCultivosV2
        },
        {
            path: '/diagnostico-cultivos-v3',
            name: 'diagnostico-cultivos-v3',
            component: DiagnosticoCultivosV3
        },
        {
            path: '/diagnostico-cultivos-v4',
            name: 'diagnostico-cultivos-v4',
            component: DiagnosticoCultivosV4
        },
        {
            path: '/comparativa-campos',
            name: 'comparativa-campos',
            component: ComparativaCampos
        },
        {
            path: '/mapas-productividad',
            name: 'mapas-productividad',
            component: MapasProductividad
        },
        {
            path: '/sistemas/sprints',
            name: 'sprints',
            component: Sprints
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
