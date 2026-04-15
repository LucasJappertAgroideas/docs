// Tipos específicos para ComparativaCampos

export interface MonthlySummary {
    month: string;
    ndvi_avg: number;
    ndvi_max: number;
    reci_avg: number;
    reci_max: number;
    ndwi_avg: number;
    evi_avg: number;
    precipitation_mm: number;
    temp_max_c: number;
    temp_min_c: number;
    temp_avg_c: number;
    num_captures: number;
}

export interface FieldData {
    field_id: number;
    date_from: string;
    date_to: string;
    cycles: Cycle[];
    monthly_summary: MonthlySummary[];
    captures_detail: CaptureDetail[];
    satellite_images: SatelliteImageGroup[];
    metadata: Metadata;
}

export interface Cycle {
    cultivo: string;
    fecha_siembra: string | null;
    fecha_cosecha: string | null;
    pico_ndvi: number;
    estado_salud: string;
    eventos: Event[];
    status: string;
    confidence: number;
    notes: string;
}

export interface Event {
    tipo: string;
    fecha: string;
    severidad: string;
    descripcion: string;
}

export interface CaptureDetail {
    date: string;
    cloud_coverage: number;
    ndvi: number;
    ndwi: number;
    reci: number;
    ndre?: number;
    evi: number;
}

export interface SatelliteImageGroup {
    month: string;
    images: SatelliteImage[];
}

export interface SatelliteImage {
    month?: string;
    type: string;
    url: string;
    date: string;
    cloud_coverage: number;
}

export interface Metadata {
    total_captures: number;
    filtered_captures: number;
    daily_points: number;
    cycles_detected: number;
    complete_cycles: number;
    partial_cycles: number;
    satellite_images_count: number;
}

export interface FieldConfig {
    fieldId: string;
    title: string;
    dataUrl: string;
}

export interface IndexOption {
    value: keyof MonthlySummary;
    label: string;
}
