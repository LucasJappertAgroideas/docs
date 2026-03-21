/**
 * Configuración de regiones para comparativas
 * 
 * Para agregar una nueva región:
 * 1. Agregar el archivo JSON en public/data/
 * 2. Agregar una entrada aquí con el id de la región
 */

import type { RegionConfig } from '@/types/comparativas';

export const REGION_CONFIG: Record<string, RegionConfig> = {
    'inta': {
        id: 'inta',
        name: 'inta',
        label: 'INTA Rafaela',
        referenceLabel: 'INTA Rafaela (Referencia)',
        dataUrl: '/data/datos-lluvias-inta.json'
    },
    'la-merced': {
        id: 'la-merced',
        name: 'la-merced',
        label: 'La Merced',
        referenceLabel: 'Productor (Referencia)',
        dataUrl: '/data/datos-lluvias-la-merced.json'
    }
};

/**
 * Obtiene la configuración de una región por su id
 */
export function getRegionConfig(regionId: string): RegionConfig | undefined {
    return REGION_CONFIG[regionId];
}

/**
 * Obtiene todas las regiones disponibles
 */
export function getAllRegions(): RegionConfig[] {
    return Object.values(REGION_CONFIG);
}
