# 📡 Especificación de Webhooks – Integración con Drew

Este documento describe los **IDs de acciones** utilizados para notificar eventos a Drew y la **estructura del payload** enviado en cada request **HTTP POST**.

🔔 **Objetivo**: que el equipo de Drew tenga una referencia clara, estable y alineada al código productivo.

---

## 🌐 Webhook destino

```
https://hook.us2.make.com/lsfpts1fq37oai1sq9k971dqojxu5iux
```

- Método: **POST**
- Formato: **JSON**
- Autenticación: no requerida (Make Webhook)

⚠️ En entorno **DEV** los payloads **no se envían**, solo se loguean por consola.

---

## 🧭 Enumeración de acciones (ACTION_ENUMS)

Todas las notificaciones incluyen una acción que identifica el evento.

Estructura del campo `action`:

```json
{
  "id": number,
  "name": string
}
```

### 📋 Tabla de acciones

| ID | Acción |
|----|-------|
| 1 | Nuevo productor |
| 2 | Nuevo lote |
| 3 | Nuevo Informe de Diagnóstico |
| 4 | Edición fecha de Informe de Diagnóstico |
| 5 | Eliminado de Informe de Diagnóstico |
| 6 | Nuevo Informe de Penetrometría |
| 7 | Edición fecha de Informe de Penetrometría |
| 8 | Eliminado de Informe de Penetrometría |
| 9 | Nuevo Informe de Recomendación |
| 10 | Edición fecha de Informe de Recomendación |
| 11 | Eliminado de Informe de Recomendación |
| 12 | Nuevo Informe de Agua Útil |
| 13 | Edición fecha de Informe de Agua Útil |
| 14 | Eliminado de Informe de Agua Útil |
| 15 | Nuevo Informe de Prescripción |
| 16 | Edición fecha de Informe de Prescripción |
| 17 | Eliminado de Informe de Prescripción |
| 18 | Nuevo Informe de Ambientación |
| 19 | Edición fecha de Informe de Ambientación |
| 20 | Eliminado de Informe de Ambientación |
| 21 | Nuevo Informe de Calidad de Implantación |
| 22 | Edición fecha de Informe de Calidad de Implantación |
| 23 | Eliminado de Informe de Calidad de Implantación |
| 24 | Nuevo Informe de Seguimiento de Cultivo |
| 25 | Edición fecha de Informe de Seguimiento de Cultivo |
| 26 | Eliminado de Informe de Seguimiento de Cultivo |
| 27 | Nuevo Informe de Monitoreo Post Cosecha |
| 28 | Edición fecha de Informe de Monitoreo Post Cosecha |
| 29 | Eliminado de Informe de Monitoreo Post Cosecha |
| 30 | Carga de archivo de muestras de suelo |
| 31 | Carga de archivo SoilOptix |

---

## 👤 Nuevo Productor (ID 1)

```json
{
  "action": { "id": 1, "name": "Nuevo productor" },
  "user": {
    "id": number,
    "name": string
  },
  "producer": {
    "id": number,
    "name": string,
    "lastName": string,
    "phone": string,
    "city": string,
    "seller": string,
    "email": string,
    "businessName": string,
    "isTest": boolean
  }
}
```

📌 Incluye datos del usuario que realizó la acción.

---

## 🌱 Nuevo Lote / Campo (ID 2)

```json
{
  "actionId": { "id": 2, "name": "Nuevo lote" },
  "producerId": number,
  "producerName": string,
  "id": number,
  "name": string,
  "city": string,
  "parentField": number | null,
  "latitude": number,
  "longitude": number,
  "kmzUrl": string,
  "hectares": number
}
```

---

## 📊 Informes (estructura común)

La mayoría de los informes siguen esta misma estructura.

### ➕ Alta de informe

```json
{
  "action": { "id": <ACTION_ID>, "name": string },
  "fieldId": number,
  "reportId": number,
  "reportIsoDate": string
}
```

### 🗓️ Edición de fecha

```json
{
  "action": { "id": <ACTION_ID>, "name": string },
  "reportId": number,
  "reportIsoDate": string
}
```

### ❌ Eliminación

```json
{
  "action": { "id": <ACTION_ID>, "name": string },
  "reportId": number
}
```

🧩 Aplica a:
- Diagnóstico
- Penetrometría
- Recomendación
- Agua Útil
- Prescripción
- Calidad de Implantación
- Seguimiento de Cultivo
- Monitoreo Post Cosecha

---

## 📂 Carga de archivos

### 🧪 Muestras de suelo (ID 30)

```json
{
  "action": { "id": 30, "name": "Carga de archivo de muestras de suelo" },
  "fieldId": number,
  "fileId": number,
  "uploadIsoDate": string
}
```

### 🛰️ SoilOptix (ID 31)

```json
{
  "action": { "id": 31, "name": "Carga de archivo SoilOptix" },
  "fieldId": number,
  "uploadIsoDate": string
}
```

⚠️ Esta notificación se dispara automáticamente al detectar un archivo con:
```
file_type_name = "SoilOptix"
```

---

## ℹ️ Notas generales

- 📅 Todas las fechas se envían en formato **ISO 8601**
- 🔎 El campo `action` define inequívocamente el tipo de evento
- 🛠️ Cambios en IDs o payloads deben reflejarse en este documento y en Make

---

📄 **Documento generado a partir del código productivo**
