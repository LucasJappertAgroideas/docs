<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";

interface TsaCatalogResponse {
    establecimientos: TsaEstablecimiento[];
}

interface TsaEstablecimiento {
    id: string;
    nombre: string;
    lotes: TsaLote[];
}

interface TsaLote {
    id: string;
    nombre: string;
    geojsonPath: string;
    ambientacionProperty?: string;
    campaigns?: TsaCampaign[];
}

interface TsaCampaign {
    harvest_year: number;
    cultivo: string;
    metric_quality?: TsaMetricQuality | null;
    lote?: TsaLoteMetrics | null;
    zonas?: TsaZonaMetrics[];
}

interface TsaMetricQuality {
    quality_filter_enabled?: boolean;
    excluded_from_metrics?: boolean;
    exclusion_reason?: string | null;
    max_lot_error_pct?: number | null;
    excluded_event_keywords?: string[];
    event_keywords_detected?: string[];
    lot_error_pct?: number | null;
    lot_error_kg_ha?: number | null;
    lot_signed_error_kg_ha?: number | null;
}

interface TsaLoteMetrics {
    rendimiento?: TsaYield | null;
    calculated_from_zones?: boolean;
    metric_quality?: TsaMetricQuality | null;
}

interface TsaYield {
    final_kg_ha?: number | null;
    source?: string;
    estimado_g4?: TsaEstimatedYield | null;
    cosechadora?: unknown;
    gen4_error?: number | null;
}

interface TsaEstimatedYield {
    value_kg_ha?: number | null;
    source?: string;
    type?: string;
    parquet_lote_raw_kg_ha?: number | null;
    metadata?: TsaModelMetadata | null;
}

interface TsaModelMetadata {
    model_selected?: string;
    model_family?: string;
    model_reason?: string;
    model_family_counts?: Record<string, number>;
    model_selected_counts?: Record<string, number>;
    target_yield_kg_ha?: number | null;
    validation_metrics_included?: boolean;
    validation_metrics_policy?: string;
}

interface TsaZonaMetrics {
    zona?: string;
    area_shape_ha?: number | null;
    area_excel_ha?: number | null;
    area_diff_pct?: number | null;
    area_for_weight_ha?: number | null;
    rendimiento?: TsaYield | null;
    indice_anual?: number | null;
    metric_quality?: TsaMetricQuality | null;
}

type TsaGeoJson = TsaFeatureCollection | TsaFeature;

interface TsaFeatureCollection {
    type: "FeatureCollection";
    features: TsaFeature[];
}

interface TsaFeature {
    type: "Feature";
    properties?: Record<string, unknown>;
    geometry: TsaGeometry;
}

type TsaGeometry = TsaPolygonGeometry | TsaMultiPolygonGeometry;

interface TsaPolygonGeometry {
    type: "Polygon";
    coordinates: number[][][];
}

interface TsaMultiPolygonGeometry {
    type: "MultiPolygon";
    coordinates: number[][][][];
}

interface Bounds {
    minLon: number;
    maxLon: number;
    minLat: number;
    maxLat: number;
}

interface ProjectionContext {
    scale: number;
    offsetX: number;
    offsetY: number;
}

interface ProjectedPolygon {
    path: string;
    ambientacion: string;
    featureIndex: number;
}

interface CampaignZoneSummary {
    zona: string;
    areaHa: number | null;
    indiceAnual: number | null;
    rendimientoFinal: number | null;
}

interface CampaignSummary {
    key: string;
    harvestYear: number;
    cultivo: string;
    loteRendimientoFinal: number | null;
    loteRendimientoSource: string;
    estimadoG4: number | null;
    parquetRaw: number | null;
    modelSelected: string;
    modelFamily: string;
    modelReason: string;
    validationPolicy: string;
    excludedFromMetrics: boolean;
    exclusionReason: string;
    maxLotErrorPct: number | null;
    lotErrorPct: number | null;
    eventKeywordsDetected: string[];
    totalZonaAreaHa: number;
    weightedIndiceAnual: number | null;
    zones: CampaignZoneSummary[];
}

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 680;
const MAP_PADDING = 34;
const DEFAULT_AMBIENTACION_LABEL = "Sin zona";

const ambientacionPalette = ["#1f77b4", "#2ca02c", "#ff7f0e", "#d62728", "#9467bd", "#8c564b", "#17becf", "#bcbd22"];

const catalog = ref<TsaCatalogResponse | null>(null);
const selectedEstablecimientoId = ref<string>("");
const selectedLoteId = ref<string>("");
const selectedGeoJson = ref<TsaGeoJson | null>(null);

const isLoadingCatalog = ref<boolean>(false);
const isLoadingGeoJson = ref<boolean>(false);
const catalogError = ref<string>("");
const geoJsonError = ref<string>("");

const establecimientos = computed<TsaEstablecimiento[]>(() => catalog.value?.establecimientos ?? []);

const selectedEstablecimiento = computed<TsaEstablecimiento | null>(() => {
    return establecimientos.value.find((establecimiento) => establecimiento.id === selectedEstablecimientoId.value) ?? null;
});

const lotesDisponibles = computed<TsaLote[]>(() => selectedEstablecimiento.value?.lotes ?? []);

const selectedLote = computed<TsaLote | null>(() => {
    return lotesDisponibles.value.find((lote) => lote.id === selectedLoteId.value) ?? null;
});

const geoJsonFeatures = computed<TsaFeature[]>(() => {
    if (!selectedGeoJson.value) {
        return [];
    }

    if (selectedGeoJson.value.type === "FeatureCollection") {
        return selectedGeoJson.value.features;
    }

    return [selectedGeoJson.value];
});

const geoJsonBounds = computed<Bounds | null>(() => {
    const points: number[][] = [];

    geoJsonFeatures.value.forEach((feature) => {
        extractPolygonsFromGeometry(feature.geometry).forEach((polygon) => {
            polygon.forEach((ring) => {
                ring.forEach((coordinate) => {
                    if (Array.isArray(coordinate) && coordinate.length >= 2) {
                        points.push([Number(coordinate[0]), Number(coordinate[1])]);
                    }
                });
            });
        });
    });

    if (points.length === 0) {
        return null;
    }

    const longitudes = points.map((point) => point[0]);
    const latitudes = points.map((point) => point[1]);

    return {
        minLon: Math.min(...longitudes),
        maxLon: Math.max(...longitudes),
        minLat: Math.min(...latitudes),
        maxLat: Math.max(...latitudes),
    };
});

const projectionContext = computed<ProjectionContext | null>(() => {
    if (!geoJsonBounds.value) {
        return null;
    }

    const lonRange = Math.max(geoJsonBounds.value.maxLon - geoJsonBounds.value.minLon, Number.EPSILON);
    const latRange = Math.max(geoJsonBounds.value.maxLat - geoJsonBounds.value.minLat, Number.EPSILON);
    const usableWidth = MAP_WIDTH - MAP_PADDING * 2;
    const usableHeight = MAP_HEIGHT - MAP_PADDING * 2;
    const scaleX = usableWidth / lonRange;
    const scaleY = usableHeight / latRange;
    const scale = Math.min(scaleX, scaleY);
    const renderedWidth = lonRange * scale;
    const renderedHeight = latRange * scale;
    const offsetX = MAP_PADDING + (usableWidth - renderedWidth) / 2;
    const offsetY = MAP_PADDING + (usableHeight - renderedHeight) / 2;

    return {
        scale,
        offsetX,
        offsetY,
    };
});

const projectedPolygons = computed<ProjectedPolygon[]>(() => {
    if (!geoJsonBounds.value || !projectionContext.value) {
        return [];
    }

    const polygons: ProjectedPolygon[] = [];

    geoJsonFeatures.value.forEach((feature, featureIndex) => {
        const ambientacion = getAmbientacionLabel(feature, selectedLote.value?.ambientacionProperty);
        const featurePolygons = extractPolygonsFromGeometry(feature.geometry);

        featurePolygons.forEach((polygon) => {
            const path = polygonToSvgPath(polygon, geoJsonBounds.value!, projectionContext.value!);
            if (path.length > 0) {
                polygons.push({
                    path,
                    ambientacion,
                    featureIndex: featureIndex + 1,
                });
            }
        });
    });

    return polygons;
});

const ambientacionColorMap = computed<Map<string, string>>(() => {
    const uniqueAmbientaciones = Array.from(new Set(projectedPolygons.value.map((polygon) => polygon.ambientacion)));
    const colorMap = new Map<string, string>();

    uniqueAmbientaciones.forEach((ambientacion, index) => {
        colorMap.set(ambientacion, ambientacionPalette[index % ambientacionPalette.length]);
    });

    return colorMap;
});

const legendRows = computed<Array<{ ambientacion: string; color: string; count: number }>>(() => {
    const grouped = new Map<string, number>();

    projectedPolygons.value.forEach((polygon) => {
        grouped.set(polygon.ambientacion, (grouped.get(polygon.ambientacion) ?? 0) + 1);
    });

    return Array.from(grouped.entries()).map(([ambientacion, count]) => ({
        ambientacion,
        count,
        color: ambientacionColorMap.value.get(ambientacion) ?? "#9aa4b2",
    }));
});

const campaignSummaries = computed<CampaignSummary[]>(() => {
    const campaigns = selectedLote.value?.campaigns ?? [];

    return campaigns.map((campaign, index) => {
        const loteYield = campaign.lote?.rendimiento;
        const estimated = loteYield?.estimado_g4;
        const modelMetadata = estimated?.metadata;
        const quality = campaign.metric_quality ?? campaign.lote?.metric_quality ?? {};
        const zones = (campaign.zonas ?? []).map((zone): CampaignZoneSummary => ({
            zona: zone.zona ?? "Sin zona",
            areaHa: zone.area_shape_ha ?? zone.area_for_weight_ha ?? null,
            indiceAnual: zone.indice_anual ?? null,
            rendimientoFinal: zone.rendimiento?.final_kg_ha ?? null,
        }));

        const totalZonaAreaHa = zones.reduce((acc, zone) => acc + (zone.areaHa ?? 0), 0);
        const weightedNumerator = zones.reduce((acc, zone) => {
            if (zone.areaHa === null || zone.indiceAnual === null) {
                return acc;
            }

            return acc + zone.areaHa * zone.indiceAnual;
        }, 0);
        const weightedIndiceAnual = totalZonaAreaHa > 0 ? weightedNumerator / totalZonaAreaHa : null;

        return {
            key: `${campaign.harvest_year}-${campaign.cultivo}-${index}`,
            harvestYear: campaign.harvest_year,
            cultivo: campaign.cultivo,
            loteRendimientoFinal: loteYield?.final_kg_ha ?? null,
            loteRendimientoSource: loteYield?.source ?? "Sin fuente",
            estimadoG4: estimated?.value_kg_ha ?? null,
            parquetRaw: estimated?.parquet_lote_raw_kg_ha ?? null,
            modelSelected: modelMetadata?.model_selected ?? "Sin dato",
            modelFamily: modelMetadata?.model_family ?? "Sin dato",
            modelReason: modelMetadata?.model_reason ?? "Sin dato",
            validationPolicy: modelMetadata?.validation_metrics_policy ?? "Sin dato",
            excludedFromMetrics: quality.excluded_from_metrics ?? false,
            exclusionReason: quality.exclusion_reason ?? "-",
            maxLotErrorPct: quality.max_lot_error_pct ?? null,
            lotErrorPct: quality.lot_error_pct ?? null,
            eventKeywordsDetected: quality.event_keywords_detected ?? [],
            totalZonaAreaHa,
            weightedIndiceAnual,
            zones,
        };
    });
});

const formatNumber = (value: number | null | undefined, decimals = 1): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "-";
    }

    return value.toLocaleString("es-AR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

const formatKgHa = (value: number | null | undefined): string => {
    return value === null || value === undefined ? "-" : `${formatNumber(value, 1)} kg/ha`;
};

const formatPercent = (value: number | null | undefined): string => {
    return value === null || value === undefined ? "-" : `${formatNumber(value, 1)}%`;
};

const getAmbientacionColor = (ambientacion: string): string => {
    return ambientacionColorMap.value.get(ambientacion) ?? "#9aa4b2";
};

const extractPolygonsFromGeometry = (geometry: TsaGeometry): number[][][][] => {
    if (geometry.type === "Polygon") {
        return [geometry.coordinates];
    }

    return geometry.coordinates;
};

const getAmbientacionLabel = (feature: TsaFeature, preferredProperty?: string): string => {
    const properties = feature.properties ?? {};
    const searchKeys = [
        preferredProperty,
        "zona",
        "zona_id",
        "ambientacion",
        "ambiente",
        "tsa",
        "tsa_clase",
        "clase",
        "class",
        "category",
        "name",
    ].filter((value): value is string => Boolean(value));

    const value = searchKeys
        .map((key) => properties[key])
        .find((propertyValue) => propertyValue !== undefined && propertyValue !== null && String(propertyValue).trim().length > 0);

    if (!value) {
        return DEFAULT_AMBIENTACION_LABEL;
    }

    return String(value).trim();
};

const projectCoordinate = (coordinate: number[], bounds: Bounds, context: ProjectionContext): [number, number] => {
    const x = context.offsetX + (coordinate[0] - bounds.minLon) * context.scale;
    const y = MAP_HEIGHT - context.offsetY - (coordinate[1] - bounds.minLat) * context.scale;

    return [x, y];
};

const ringToPath = (ring: number[][], bounds: Bounds, context: ProjectionContext): string => {
    if (ring.length < 3) {
        return "";
    }

    const projectedRing = ring.map((coordinate) => projectCoordinate(coordinate, bounds, context));
    const [firstPoint, ...otherPoints] = projectedRing;

    return [
        `M ${firstPoint[0].toFixed(2)} ${firstPoint[1].toFixed(2)}`,
        ...otherPoints.map((point) => `L ${point[0].toFixed(2)} ${point[1].toFixed(2)}`),
        "Z",
    ].join(" ");
};

const polygonToSvgPath = (polygon: number[][][], bounds: Bounds, context: ProjectionContext): string => {
    return polygon
        .map((ring) => ringToPath(ring, bounds, context))
        .filter((path) => path.length > 0)
        .join(" ");
};

const normalizeGeoJsonPath = (geoJsonPath: string): string => {
    if (geoJsonPath.startsWith("/")) {
        return geoJsonPath;
    }

    return `/${geoJsonPath}`;
};

const loadCatalogAsync = async (): Promise<void> => {
    isLoadingCatalog.value = true;
    catalogError.value = "";

    try {
        const response = await fetch("/data/tsa/catalogo-establecimientos.json");
        if (!response.ok) {
            throw new Error(`No se pudo cargar catalogo TSA (${response.status})`);
        }

        const data = (await response.json()) as TsaCatalogResponse;
        catalog.value = data;

        if (data.establecimientos.length > 0) {
            selectedEstablecimientoId.value = data.establecimientos[0].id;
        }
    } catch (error) {
        catalogError.value = error instanceof Error ? error.message : "Error desconocido cargando catalogo TSA";
    } finally {
        isLoadingCatalog.value = false;
    }
};

const loadGeoJsonAsync = async (): Promise<void> => {
    if (!selectedLote.value?.geojsonPath) {
        selectedGeoJson.value = null;
        return;
    }

    isLoadingGeoJson.value = true;
    geoJsonError.value = "";

    try {
        const response = await fetch(normalizeGeoJsonPath(selectedLote.value.geojsonPath));
        if (!response.ok) {
            throw new Error(`No se pudo cargar GeoJSON (${response.status})`);
        }

        selectedGeoJson.value = (await response.json()) as TsaGeoJson;
    } catch (error) {
        selectedGeoJson.value = null;
        geoJsonError.value = error instanceof Error ? error.message : "Error desconocido cargando GeoJSON";
    } finally {
        isLoadingGeoJson.value = false;
    }
};

watch(selectedEstablecimientoId, (establecimientoId) => {
    const establecimiento = establecimientos.value.find((item) => item.id === establecimientoId);
    selectedLoteId.value = establecimiento?.lotes[0]?.id ?? "";
});

watch(selectedLoteId, async () => {
    await loadGeoJsonAsync();
});

onMounted(async () => {
    await loadCatalogAsync();
});
</script>

<template>
    <div class="tsa-view">
        <header class="tsa-header">
            <div>
                <h1>Resultados TSA</h1>
                <p>Visualizacion de zonas TSA por establecimiento y lote a partir de GeoJSON.</p>
            </div>
            <RouterLink to="/" class="back-link">Volver al inicio</RouterLink>
        </header>

        <section class="panel controls">
            <div class="field-group">
                <label for="establecimiento">Establecimiento</label>
                <select id="establecimiento" v-model="selectedEstablecimientoId" :disabled="isLoadingCatalog || establecimientos.length === 0">
                    <option v-for="establecimiento in establecimientos" :key="establecimiento.id" :value="establecimiento.id">
                        {{ establecimiento.nombre }}
                    </option>
                </select>
            </div>

            <div class="field-group">
                <label for="lote">Lote</label>
                <select id="lote" v-model="selectedLoteId" :disabled="lotesDisponibles.length === 0 || isLoadingGeoJson">
                    <option v-for="lote in lotesDisponibles" :key="lote.id" :value="lote.id">
                        {{ lote.nombre }}
                    </option>
                </select>
            </div>
        </section>

        <section v-if="catalogError" class="panel state error">{{ catalogError }}</section>
        <section v-else-if="isLoadingCatalog" class="panel state">Cargando catalogo TSA...</section>

        <section v-else class="map-layout">
            <article class="panel map-panel">
                <div v-if="isLoadingGeoJson" class="state">Cargando GeoJSON...</div>
                <div v-else-if="geoJsonError" class="state error">{{ geoJsonError }}</div>
                <div v-else-if="projectedPolygons.length === 0" class="state">No hay geometrias para visualizar.</div>
                <svg v-else class="tsa-map" :viewBox="`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mapa de ambientacion TSA">
                    <g>
                        <path
                            v-for="polygon in projectedPolygons"
                            :key="`${polygon.featureIndex}-${polygon.path.slice(0, 25)}`"
                            :d="polygon.path"
                            :fill="getAmbientacionColor(polygon.ambientacion)"
                            stroke="#111827"
                            stroke-width="1.4"
                        >
                            <title>Feature {{ polygon.featureIndex }} - Zona: {{ polygon.ambientacion }}</title>
                        </path>
                    </g>
                </svg>
            </article>

            <aside class="panel legend-panel">
                <h2>Leyenda de zonas</h2>
                <ul v-if="legendRows.length > 0" class="legend-list">
                    <li v-for="row in legendRows" :key="row.ambientacion" class="legend-item">
                        <span class="swatch" :style="{ backgroundColor: row.color }"></span>
                        <span class="ambientacion-label">{{ row.ambientacion }}</span>
                        <span class="ambientacion-count">{{ row.count }}</span>
                    </li>
                </ul>
                <p v-else class="legend-empty">Selecciona un lote con datos para ver las zonas.</p>
            </aside>
        </section>

        <section class="panel campaigns-panel">
            <div class="campaigns-header">
                <h2>Campanas por lote</h2>
                <p>Resumen productivo por campana y cultivo con indicadores TSA.</p>
            </div>

            <div v-if="campaignSummaries.length === 0" class="state">No hay campanas cargadas para este lote.</div>

            <div v-else class="campaign-list">
                <article v-for="campaign in campaignSummaries" :key="campaign.key" class="campaign-card">
                    <header class="campaign-card-header">
                        <h3>{{ campaign.harvestYear }} · {{ campaign.cultivo }}</h3>
                        <span class="campaign-badge" :class="{ excluded: campaign.excludedFromMetrics }">
                            {{ campaign.excludedFromMetrics ? "Excluida de metricas" : "Incluida en metricas" }}
                        </span>
                    </header>

                    <div class="campaign-grid">
                        <p><strong>Rendimiento lote:</strong> {{ formatKgHa(campaign.loteRendimientoFinal) }}</p>
                        <p><strong>Fuente:</strong> {{ campaign.loteRendimientoSource }}</p>
                        <p><strong>Estimado G4:</strong> {{ formatKgHa(campaign.estimadoG4) }}</p>
                        <p><strong>Parquet raw:</strong> {{ formatKgHa(campaign.parquetRaw) }}</p>
                        <p><strong>Modelo:</strong> {{ campaign.modelSelected }} ({{ campaign.modelFamily }})</p>
                        <p><strong>Criterio modelo:</strong> {{ campaign.modelReason }}</p>
                        <p><strong>Politica validacion:</strong> {{ campaign.validationPolicy }}</p>
                        <p><strong>Error max lote:</strong> {{ formatPercent(campaign.maxLotErrorPct) }}</p>
                        <p><strong>Error lote:</strong> {{ formatPercent(campaign.lotErrorPct) }}</p>
                        <p><strong>Area total zonas:</strong> {{ formatNumber(campaign.totalZonaAreaHa, 2) }} ha</p>
                        <p><strong>Indice anual ponderado:</strong> {{ formatNumber(campaign.weightedIndiceAnual, 4) }}</p>
                        <p><strong>Exclusion:</strong> {{ campaign.exclusionReason }}</p>
                    </div>

                    <p class="keywords-line"><strong>Eventos detectados:</strong> {{ campaign.eventKeywordsDetected.length > 0 ? campaign.eventKeywordsDetected.join(", ") : "Ninguno" }}</p>

                    <div class="zones-table-wrapper">
                        <table class="zones-table">
                            <thead>
                                <tr>
                                    <th>Zona</th>
                                    <th>Area (ha)</th>
                                    <th>Indice anual</th>
                                    <th>Rinde final (kg/ha)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(zone, zoneIndex) in campaign.zones" :key="`${campaign.key}-${zone.zona}-${zoneIndex}`">
                                    <td>{{ zone.zona }}</td>
                                    <td>{{ formatNumber(zone.areaHa, 2) }}</td>
                                    <td>{{ formatNumber(zone.indiceAnual, 4) }}</td>
                                    <td>{{ formatKgHa(zone.rendimientoFinal) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </article>
            </div>
        </section>
    </div>
</template>

<style scoped>
.tsa-view {
    max-width: 1320px;
    margin: 0 auto;
    padding: 2rem;
    color: #e6edf3;
}

.tsa-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.tsa-header h1 {
    margin: 0;
    font-size: 2rem;
}

.tsa-header p {
    margin: 0.5rem 0 0;
    color: #94a3b8;
}

.back-link {
    color: #93c5fd;
    text-decoration: none;
    border: 1px solid #334155;
    border-radius: 10px;
    padding: 0.55rem 0.95rem;
    transition: border-color 0.2s ease;
}

.back-link:hover {
    border-color: #60a5fa;
}

.panel {
    border: 1px solid #334155;
    border-radius: 14px;
    background: #111827;
}

.controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(220px, 1fr));
    gap: 1rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.field-group label {
    font-size: 0.9rem;
    color: #93c5fd;
}

.field-group select {
    border: 1px solid #334155;
    border-radius: 10px;
    background: #0f172a;
    color: #e2e8f0;
    padding: 0.6rem 0.75rem;
}

.map-layout {
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(240px, 1fr);
    gap: 1rem;
}

.map-panel {
    min-height: 520px;
    padding: 0.8rem;
}

.tsa-map {
    width: 100%;
    height: 100%;
    min-height: 500px;
    border-radius: 10px;
    background: radial-gradient(circle at top, rgba(30, 41, 59, 0.75), rgba(17, 24, 39, 0.95));
}

.legend-panel {
    padding: 1rem;
}

.legend-panel h2 {
    margin: 0 0 0.75rem;
    font-size: 1.15rem;
    color: #bfdbfe;
}

.legend-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.45rem;
}

.legend-item {
    display: grid;
    grid-template-columns: 20px 1fr auto;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.92rem;
    color: #dbeafe;
}

.swatch {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1px solid #1e293b;
}

.ambientacion-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ambientacion-count {
    color: #93c5fd;
}

.state {
    display: grid;
    place-items: center;
    text-align: center;
    min-height: 120px;
    padding: 1rem;
    color: #cbd5e1;
}

.state.error {
    color: #fca5a5;
}

.legend-empty {
    margin: 0;
    color: #94a3b8;
}

.campaigns-panel {
    margin-top: 1rem;
    padding: 1rem;
}

.campaigns-header h2 {
    margin: 0;
    color: #bfdbfe;
}

.campaigns-header p {
    margin: 0.35rem 0 0;
    color: #94a3b8;
}

.campaign-list {
    margin-top: 1rem;
    display: grid;
    gap: 0.9rem;
}

.campaign-card {
    border: 1px solid #1e293b;
    border-radius: 12px;
    background: #0b1220;
    padding: 0.9rem;
}

.campaign-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    margin-bottom: 0.8rem;
}

.campaign-card-header h3 {
    margin: 0;
    color: #e2e8f0;
    font-size: 1.05rem;
}

.campaign-badge {
    font-size: 0.8rem;
    color: #10b981;
    border: 1px solid #064e3b;
    border-radius: 999px;
    padding: 0.2rem 0.55rem;
    white-space: nowrap;
}

.campaign-badge.excluded {
    color: #fca5a5;
    border-color: #7f1d1d;
}

.campaign-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(160px, 1fr));
    gap: 0.45rem 0.8rem;
}

.campaign-grid p {
    margin: 0;
    color: #cbd5e1;
    font-size: 0.91rem;
}

.keywords-line {
    margin: 0.75rem 0 0.6rem;
    color: #dbeafe;
    font-size: 0.91rem;
}

.zones-table-wrapper {
    overflow-x: auto;
}

.zones-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 560px;
}

.zones-table th,
.zones-table td {
    border-top: 1px solid #1e293b;
    padding: 0.5rem;
    text-align: left;
    font-size: 0.88rem;
}

.zones-table th {
    color: #93c5fd;
    font-weight: 600;
}

.zones-table td {
    color: #e2e8f0;
}

@media (max-width: 980px) {
    .tsa-view {
        padding: 1rem;
    }

    .controls {
        grid-template-columns: 1fr;
    }

    .map-layout {
        grid-template-columns: 1fr;
    }

    .map-panel {
        min-height: 420px;
    }

    .tsa-map {
        min-height: 390px;
    }

    .campaign-grid {
        grid-template-columns: 1fr;
    }
}
</style>
