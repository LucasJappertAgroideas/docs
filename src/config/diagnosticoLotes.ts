/**
 * Configuración de lotes para diagnóstico de cultivos
 * 
 * Para agregar un nuevo lote:
 * 1. Agregar el archivo JSON en public/json-lotes/diagnostico-cultivos/<nombre>.json
 * 2. Agregar una entrada aquí con el field_id del JSON
 */

export interface DiagnosticoLoteConfig {
    fieldId: number;
    title: string;
    dataUrl: string;
}

export const DIAGNOSTICO_LOTE_CONFIG: Record<number, DiagnosticoLoteConfig> = {
    52: {
        fieldId: 52,
        title: 'Marchetti',
        dataUrl: '/json-lotes/diagnostico-cultivos/marchetti-v1.json'
    },
    281: {
        fieldId: 281,
        title: 'Agroarnaudo Lote 1',
        dataUrl: '/json-lotes/diagnostico-cultivos/agroarnaudo-lote-1.json'
    },
    282: {
        fieldId: 282,
        title: 'Don Avelino El Lucero Lote 14',
        dataUrl: '/json-lotes/diagnostico-cultivos/don-avelino-el-lucero-lote-14-v1.json'
    },
    283: {
        fieldId: 283,
        title: 'Don Avelino El Lucero Lote 46 N',
        dataUrl: '/json-lotes/diagnostico-cultivos/don-avelino-el-lucero-lote-46-N-v1.json'
    }
};

/**
 * Obtiene la configuración de un lote de diagnóstico por su field_id
 */
export function getDiagnosticoLoteConfig(fieldId: number): DiagnosticoLoteConfig | undefined {
    return DIAGNOSTICO_LOTE_CONFIG[fieldId];
}
