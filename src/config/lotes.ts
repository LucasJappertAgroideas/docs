/**
 * Configuración de lotes/productores
 * 
 * Para agregar un nuevo lote:
 * 1. Agregar el archivo JSON en public/<carpeta>/datos-<nombre>.json
 * 2. Agregar una entrada aquí con el field_id del JSON
 */

export interface LoteConfig {
    fieldId: number;
    title: string;
    dataUrl: string;
}

export const LOTE_CONFIG: Record<number, LoteConfig> = {
    198: {
        fieldId: 198,
        title: 'Don Avelino Los Claros Lote 17',
        dataUrl: '/json-lotes/datos-don-avelino-lote-17.json'
    },
    281: {
        fieldId: 281,
        title: 'Lote Agroarnaudo Lote 1',
        dataUrl: '/json-lotes/datos-agroarnaudo-lote1.json'
    },
    282: {
        fieldId: 282,
        title: 'Don Avelino El Lucero Lote 14',
        dataUrl: '/json-lotes/don-avelino-el-lucero-lote-14.json'
    },
    52: {
        fieldId: 52,
        title: 'Lote Marchetti',
        dataUrl: '/json-lotes/datos-marchetti.json'
    },
    40: {
        fieldId: 40,
        title: 'Lote Marchetti',
        dataUrl: '/json-lotes/datos-marchetti.json'
    }
};

/**
 * Obtiene la configuración de un lote por su field_id
 */
export function getLoteConfig(fieldId: number): LoteConfig | undefined {
    return LOTE_CONFIG[fieldId];
}
