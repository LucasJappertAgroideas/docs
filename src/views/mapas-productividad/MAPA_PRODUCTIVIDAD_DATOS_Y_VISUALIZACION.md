# Mapas de productividad — especificación de datos y visualización

Documento orientado a **replicar la sección** en otro front: qué contiene el JSON, cómo se deriva lo que se muestra en pantalla (mapas, gráfico, galería), y reglas exactas para series como **Promedio Mensual de Lluvia**.

---

## 1. Flujo general

1. El usuario elige un **campo / lote** en un `<select>`. Cada opción tiene un `filename` (sin `.json`).
2. Se carga el JSON con import dinámico: `../data/{filename}.json`.
3. El contenido se tipa como `ProductivityMapData` (ver sección 2).
4. Tres bloques de UI consumen el mismo objeto cargado:
   - **Mapas estáticos** (PNG por índice + mapa combinado opcional).
   - **Gráfico** “Evolución de Índices y Clima” (Chart.js: líneas + barras + eje dual/triple).
   - **Galería** de miniaturas satelitales (URLs en el JSON).

La URL puede fijar el campo con query `field_id`; al cambiar el select se actualiza el router (`field_id`).

---

## 2. Estructura del JSON (`ProductivityMapData`)

### Raíz

| Campo | Tipo | Uso en UI |
|--------|------|-----------|
| `individual_maps` | `Record<string, IndividualMap>` | Claves = nombres de índice (ej. `NDVI`, `RECI`, `EVI`). Una tarjeta de mapa por clave. Series del gráfico y galería por tipo. |
| `combined_map` | `CombinedMap \| null` | Si existe, tarjeta extra “Mapa Combinado” con su PNG y área. |

### `IndividualMap` (y en general `CombinedMap` con campos similares)

Campos relevantes para **visualización**:

| Campo | Uso |
|--------|-----|
| `map_image_url` | `<img src>` del mapa de productividad renderizado para ese índice. |
| `total_area_hectares` | Texto “Área total: X ha”. |
| `processed_images_count` | Texto “Imágenes procesadas: N” (solo en mapas por índice). |
| `satellite_images` | **Serie temporal**: array de meses con imágenes y clima. Motor del gráfico y de la galería. |

Cada elemento de `satellite_images` (`SatelliteImagesByMonth`):

| Campo | Uso |
|--------|-----|
| `month` | String **`MM-YYYY`** (ej. `02-2019`). Etiqueta del eje X del gráfico y criterio de orden cronológico. |
| `images` | Array de `SatelliteImage` (cada una es una captura con URL). |
| `climate_data` | Opcional. Objeto con precipitación y temperaturas del mes (misma fila temporal que las imágenes). |

### `SatelliteImage`

| Campo | Uso en galería / lógica |
|--------|-------------------------|
| `type` | Tipo de índice (debe alinearse con claves de `individual_maps`). Badge con color por tipo. |
| `url` | Miniatura en la galería. |
| `date` | Fecha de la toma; se muestra formateada (preferir `DD-MM-YYYY` si viene `YYYY-MM-DD` para evitar TZ). |
| `cloud_coverage` | Número en JSON; en UI se muestra como **porcentaje** dividiendo entre 100: `(cloud_coverage / 100).toFixed(1) + '%'`. |
| `average_index_value` | Texto “Índice:” con 3 decimales. |
| `threshold_min`, `threshold_max` | Si alguno no es null, línea “Threshold: min - max” con 2 decimales. |
| `trend_direction` | `up` / `down` / `flat` → iconos ↗ / ↘ / →. |
| `is_peak` | Boolean → indicador de pico (⛰). |
| `streak` | Número; si ≠ 0 se muestra con signo (racha). |
| `is_used_for_map` | Si es `true`, la imagen participó en el armado del mapa; resalta tarjeta y afecta gráfico y filtros (ver más abajo). |

### `ClimateData` (por mes, en `satellite_images[].climate_data`)

| Clave | Significado en gráfico |
|--------|-------------------------|
| `precipitation_mm` | Serie de barras (eje derecho “climate”). |
| `temperature_max_c`, `temperature_min_c`, `temperature_avg_c` | Series de línea discontinua (eje `temperature` derecho). |

Solo se dibuja una serie climática si **al menos un mes** tiene ese campo definido y no nulo.

---

## 3. Sección “Mapas de productividad” (rejilla de PNG)

- Se itera `mapData.individual_maps` como pares `(indexType, map)`.
- Por cada uno:
  - **Título**: la clave `indexType` (ej. `NDVI`).
  - **Imagen**: `map.map_image_url`.
  - **Texto**: `total_area_hectares`, `processed_images_count`.
- Si `mapData.combined_map` no es null:
  - Tarjeta “Mapa Combinado” con `combined_map.map_image_url` y `total_area_hectares` (sin contador de procesadas en la plantilla actual).

No se genera el mapa en el cliente: solo se muestran URLs ya calculadas en el JSON.

---

## 4. Eje X del gráfico: `chartLabels` (meses)

- Se obtienen **todos** los strings `month` únicos que aparecen en `satellite_images` de **cualquier** mapa en `individual_maps`.
- Se ordenan cronológicamente parseando `MM-YYYY`: primero por año, luego por mes.
- Ese array ordenado es el eje X (etiquetas literales `02-2019`, `03-2019`, …).

---

## 5. Series del gráfico (orden y significado)

El gráfico mezcla tipos Chart.js: componente principal `Line`, pero algunos datasets usan `type: 'bar'` para precipitación.

### 5.1 Series de índices (una por clave de `individual_maps`)

- **Etiqueta**: nombre del índice (`NDVI`, etc.).
- **Valor por punto (por cada etiqueta de mes en el eje X)**:
  - Buscar en ese índice el bloque `satellite_images` cuyo `month` coincide con la etiqueta.
  - Si no hay bloque o `images` está vacío → valor **0**.
  - Si hay imágenes: **media aritmética** de `average_index_value` de **todas** las imágenes de ese mes (si hay varias, se promedian).
- **Eje Y**: escala principal `y`, título “Valor del Índice”. Min/max globales se calculan recorriendo todos los `average_index_value` de todos los índices y meses, con margen ~10 % (floor/ceil).
- **Estética de puntos (mes a mes)**:
  - Para ese mes e índice, si **alguna** imagen tiene `is_used_for_map === true`, el punto se dibuja **más grande** y con borde blanco (marca visual de “mes con imagen usada en el mapa”).
  - Si no, punto más pequeño y más tenue.

### 5.2 Series climáticas (condicionales)

Solo se añade cada una si existe dato en al menos un mes:

1. **Precipitación (mm)** — `precipitation_mm`
   - Tipo **barra**.
   - Datos: por cada etiqueta de mes, `climate_data` del **primer** mapa individual (`Object.values(individual_maps)[0]`): se asume que el clima es el mismo entre índices; se toma el mes homónimo.
   - Eje: `yAxisID: 'climate'` (derecha, “Precipitación (mm)”).
2. **Temperatura máx / mín / prom** — mismas reglas de existencia; tipo **línea** con `borderDash`, puntos visibles.
   - Eje: `yAxisID: 'temperature'`.

Los datos climáticos **no** se promedian entre índices: se lee una sola “columna” de meses representativa (primer mapa).

### 5.3 Serie “Promedio Mensual Lluvia (mm)” (referencia climática)

**No viene literal en el JSON**: se **calcula en cliente** a partir de todos los `climate_data.precipitation_mm` del mismo primer mapa individual.

#### Paso 1 — Acumular por mes calendario (1–12)

- Inicializar `monthlySums[0..11] = 0` y `monthlyCounts[0..11] = 0`.
- Recorrer cada `satellite_images` del primer mapa.
- Si ese mes tiene `climate_data.precipitation_mm` definido:
  - Parsear `month` con formato `MM-YYYY`: la parte **antes del primer `-`** es el mes (`"02-2019"` → `02` → mes calendario 2).
  - Índice de array: `monthNum = parseInt(MM, 10) - 1` (enero = 0, …, diciembre = 11).
  - Hacer `monthlySums[monthNum] += precipitation_mm` y `monthlyCounts[monthNum]++`.

#### Paso 2 — Promedio por mes calendario

Para cada `i` de 0 a 11:

`monthlyRainfallAvg[i] = monthlyCounts[i] > 0 ? monthlySums[i] / monthlyCounts[i] : 0`

Es decir: para **enero** promedias todas las precipitaciones de registros cuyo `month` sea cualquier enero (2020, 2021, …) presentes en los datos; igual para febrero, etc.

#### Paso 3 — Pintar la serie en el gráfico

- La serie solo se añade si hubo al menos un mes con `precipitation_mm` (misma condición que la barra de precipitación).
- Para **cada etiqueta del eje X** (cada `MM-YYYY` concreto, ej. `10-2021`):
  - Se toma el mes calendario de esa etiqueta (`10` → índice 9).
  - El valor Y es `monthlyRainfallAvg[9]`: la **media histórica de octubre** en el dataset, **no** la lluvia de octubre 2021.
- Interpretación para el usuario: línea de **climatología / promedio mensual de lluvia** según los años cubiertos por el JSON, repetida en el tiempo para comparar cada barra (lluvia del mes-año observado) contra el típico de ese mes del año.

- Tipo: línea continua, sin puntos, color dedicado (`precipitation_monthly_avg` en la paleta del gráfico).
- Eje: `climate` (misma escala que precipitación).

---

## 6. Leyenda personalizada y visibilidad

- La leyenda nativa de Chart.js está **desactivada**.
- Hay botones por serie: primero todos los `indexTypes`, luego cada serie climática listada, y al final el botón “Promedio Mensual Lluvia (mm)” si aplica.
- Cada botón alterna un `Set` de índices de dataset ocultos (`hidden` en Chart.js por dataset).
- **Por defecto** al cargar datos:
  - Ocultas las tres series de temperatura.
  - Oculta la serie “Promedio Mensual Lluvia” si hay datos de precipitación.
  - Índices y precipitación quedan visibles.

---

## 7. Sección “Imágenes Satelitales” (galería)

### Origen de la lista

- Se recorre cada clave de `individual_maps` y cada `satellite_images` → cada `images[]`.
- Se arma una **lista plana** de objetos con: `type`, `url`, `date`, `cloud_coverage`, `average_index_value`, `trend_direction`, `is_peak`, `streak`, `is_used_for_map`, `threshold_min`, `threshold_max`.
- Se ordena por `date` ascendente (`Date.parse`).

### Filtros

1. **Por tipo**: select “Todos” o un `indexType` concreto; filtra `img.type`.
2. **“Usadas para mapa”** (checkbox, por defecto activo): deja solo imágenes con `is_used_for_map === true`.

### Por tarjeta

- Imagen `url`.
- Badge de tipo con color (`NDVI`, `RECI`, `EVI`, `NDWI` tienen colores fijos en config; otro tipo → color por defecto).
- Fecha formateada.
- Índice numérico.
- Threshold si aplica.
- Nubes como % (ver arriba: división por 100).
- Fila de tendencia: dirección, pico, racha, y ✓ si usada para mapa.
- Si `is_used_for_map`, la tarjeta tiene borde/resaltado distintivo.

---

## 8. Paleta y convenciones auxiliares

- **Colores por tipo de imagen** (badges galería): NDVI verde, RECI violeta, NDWI azul, EVI naranja, default azul.
- **Colores gráfico**: por índice y por clave climática; promedio mensual lluvia con tono cyan (`precipitation_monthly_avg`).

---

## 9. Estados de UI

- **Cargando**: mientras el import del JSON no termina.
- **Error**: si falla el import (mensaje genérico).
- **Contenido**: solo si `mapData` está resuelto.

---

## 10. Checklist para otro agente (replicar comportamiento)

- [ ] JSON con `individual_maps` + `combined_map` opcional.
- [ ] `month` siempre comparable como `MM-YYYY` para orden y para extraer mes calendario (parte antes del `-`).
- [ ] Gráfico: promedio de índice por mes = media de `average_index_value` en ese mes; clima por mes = primer mapa; precipitación en barras; temperaturas en líneas en eje aparte.
- [ ] **Promedio mensual lluvia**: vector de 12 promedios desde histórico del JSON; serie alineada al eje X por **mes calendario** de cada etiqueta, no por año.
- [ ] Puntos destacados en series de índice cuando `is_used_for_map` en cualquier imagen del mes.
- [ ] Galería plana ordenada por fecha; filtros tipo y usadas para mapa; nubes como `cloud_coverage/100` en %.

---

*Referencia de implementación en este repo: `MapasProductividad.vue`, composable `composables/composables.ts`, tipos `types/types.ts`, datos en `data/*.json`.*
