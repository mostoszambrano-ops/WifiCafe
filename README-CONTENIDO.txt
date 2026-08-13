WifiCafé — Código fuente completo
====================================

Este ZIP contiene el estado actual del proyecto, con frontend, API, base de datos,
configuraciones, scripts y assets necesarios.

Mejoras incluidas:
- Galería y gestión de fotos de productos desde el panel del personal.
- Miniaturas de productos en el menú y combos.
- Notas individuales por producto en el carrito y en el panel del personal.
- Estadísticas de ventas: ventas por día, pedidos por hora y productos más vendidos.
- Endpoint API /api/stats.
- PWA instalable con manifest, service worker y actualización automática.
- Migración/esquema de order_items con columna notes.

Estructura principal:
- artifacts/wificafe-menu: frontend React + Vite
- artifacts/api-server: API Express
- lib/db: esquema Drizzle/PostgreSQL
- configuración y scripts del monorepo en la raíz

Exclusiones intencionales:
- node_modules, dist, cachés y carpetas de herramientas
- archivos .env y secretos
- builds generados
