# AgroClima - Proyecto Vue 3 + TypeScript + Vite

## Descripción

Proyecto de visualización de datos climáticos y índices de vegetación para lotes agrícolas.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm run build
```

## Estructura del Proyecto

```
├── public/                 # Archivos estáticos (datos JSON)
│   └── datos-don-avelino.json
├── src/
│   ├── assets/            # Estilos CSS
│   │   └── styles/main.css
│   ├── composables/       # Lógica reutilizable con Composition API
│   │   └── useClimateData.ts
│   ├── types/             # Tipos TypeScript
│   │   └── climate.ts
│   ├── App.vue            # Componente principal
│   ├── main.ts            # Punto de entrada
│   └── vite-env.d.ts      # Declaraciones TypeScript
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Dependencias

- Vue 3.5.x
- TypeScript 5.7.x
- Vite 6.x
- Chart.js 4.x
- vue-chartjs 5.x

## Próximos Pasos

1. Migrar las otras páginas HTML (comparativas.html, etc.)
2. Agregar más componentes reutilizables
3. Implementar router para navegación entre páginas
4. Agregar más tipos de gráficos
