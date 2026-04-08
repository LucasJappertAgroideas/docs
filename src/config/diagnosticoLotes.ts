/**
 * Configuración de lotes para diagnóstico de cultivos
 * 
 * Para agregar un nuevo lote:
 * 1. Agregar el archivo JSON en public/json-lotes/diagnostico-cultivos/<nombre>.json
 * 2. Agregar una entrada aquí con el field_id del JSON
 */

export interface DiagnosticoLoteConfig {
    fieldId: string;
    title: string;
    dataUrl: string;
}

export const DIAGNOSTICO_LOTE_CONFIG: Record<string, DiagnosticoLoteConfig> = {
    '52': {
        fieldId: '52',
        title: 'Marchetti',
        dataUrl: '/json-lotes/diagnostico-cultivos/marchetti-v1.json'
    },
    '52-v2': {
        fieldId: '52-v2',
        title: 'Marchetti Version 2',
        dataUrl: '/json-lotes/diagnostico-cultivos/version2/marchetti-v2.json'
    },
    '281': {
        fieldId: '281',
        title: 'Agroarnaudo Lote 1',
        dataUrl: '/json-lotes/diagnostico-cultivos/agroarnaudo-lote-1.json'
    },
    '282': {
        fieldId: '282',
        title: 'Don Avelino El Lucero Lote 14',
        dataUrl: '/json-lotes/diagnostico-cultivos/don-avelino-el-lucero-lote-14-v1.json'
    },
    '282-v2': {
        fieldId: '282-v2',
        title: 'Don Avelino El Lucero Lote 14 Version 2',
        dataUrl: '/json-lotes/diagnostico-cultivos/version2/don-avelino-el-lucero-lote-14-v2.json'
    },
    '283': {
        fieldId: '283',
        title: 'Don Avelino El Lucero Lote 46 N',
        dataUrl: '/json-lotes/diagnostico-cultivos/don-avelino-el-lucero-lote-46-N-v1.json'
    },
    '283-v2': {
        fieldId: '283-v2',
        title: 'Don Avelino El Lucero Lote 46 N Version 2',
        dataUrl: '/json-lotes/diagnostico-cultivos/version2/don-avelino-el-lucero-lote-46-N-v2.json'
    },
    '52-v3': {
        fieldId: '52-v3',
        title: 'Marchetti Version 3',
        dataUrl: '/json-lotes/diagnostico-cultivos/version2/marchetti-v3.json'
    }
};

export const DIAGNOSTICO_LOTE_CONFIG_V2: Record<string, DiagnosticoLoteConfig> = {
    '108': {
        fieldId: '108',
        title: 'Don Avalino Los Claros Lote 10',
        dataUrl: '/json-lotes/diagnostico-cultivos/version2.1/don-avelino-los-claros-lote-10.json'
    },
    '40': {
        fieldId: '40',
        title: 'RCM Lote 1',
        dataUrl: '/json-lotes/diagnostico-cultivos/version2.1/rcm-lote1.json'
    },
    '52-v4': {
        fieldId: '52-v4',
        title: 'Marchetti Version 4',
        dataUrl: '/json-lotes/diagnostico-cultivos/version2.1/marchetti.json'
    }
};

export const DIAGNOSTICO_LOTE_CONFIG_V3: Record<string, DiagnosticoLoteConfig> = {
    '286': {
        fieldId: '286',
        title: 'La Querencia Lote 4',
        dataUrl: '/json-lotes/diagnostico-cultivos/version3/field-crop-diagnostic-field_id-286&date_from=2023-01-01&date_to=2026-04-01.json'
    }
};

// Configuración alternativa para importar JSON directamente
export const DIAGNOSTICO_LOTE_CONFIG_V3_LOCAL: Record<string, DiagnosticoLoteConfig> = {
    '286': {
        fieldId: '286',
        title: 'La Querencia Lote 4',
        dataUrl: '../views/diagnostico-cultivo-v3/data/la-querencia-lote-4-reci-ndvi-desde-2021.json'
    }
};

/**
 * Obtiene la configuración de un lote de diagnóstico por su field_id
 */
export function getDiagnosticoLoteConfig(fieldId: string): DiagnosticoLoteConfig | undefined {
    return DIAGNOSTICO_LOTE_CONFIG[fieldId];
}

/**
 * Obtiene la configuración de un lote de diagnóstico V2 por su field_id
 */
export function getDiagnosticoLoteConfigV2(fieldId: string): DiagnosticoLoteConfig | undefined {
    return DIAGNOSTICO_LOTE_CONFIG_V2[fieldId];
}

/**
 * Obtiene la configuración de un lote de diagnóstico V3 por su field_id
 */
export function getDiagnosticoLoteConfigV3(fieldId: string): DiagnosticoLoteConfig | undefined {
    return DIAGNOSTICO_LOTE_CONFIG_V3[fieldId];
}
