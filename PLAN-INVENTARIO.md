# Plan — Reorganización del inventario (unidades de medida y stock)

Estado: **propuesto, a la espera de aprobación**. Alcance acordado: API (`api-restaurant-manager`) + frontend (`app-restaurant-manager`).

## 1. Revisión de la base de datos (`restaurant_management`)

El esquema nuevo **ya está aplicado a mano** en la BD (rol `postgres`), pero no está versionado en `db/` y el código no lo conoce.

### 1.1 Tablas nuevas (vacías, sin datos)

**`measurement_units`** — catálogo global de unidades de medida:
`id` bigint PK · `name` varchar(50) UNIQUE · `abbreviation` varchar(15) UNIQUE · `type` varchar(20) CHECK (`QUANTITY` \| `WEIGHT` \| `VOLUME` \| `LENGTH` \| `AREA` \| `PACKAGING`) · `is_active` boolean.

**`inventory_item_units`** — unidades alternativas por artículo y su conversión a la unidad base:
`id` · `inventory_items_id` FK · `measurement_units_id` FK · `conversion_factor` numeric(15,4) > 0 · `barcode` varchar(100) · `is_base_unit` · `is_purchase_unit` · `is_default` · `is_active` · `created_at`. UNIQUE (`inventory_items_id`, `measurement_units_id`).

### 1.2 Campos nuevos en tablas existentes

`inventory_items`: `base_unit_id` (FK → `measurement_units`), `barcode` varchar(100), `minimum_stock` numeric(15,2) default 0, `maximum_stock` numeric(15,2) nullable, `allow_menu_config` boolean. ⚠️ `is_configurable_in_the_menu` **sigue en la BD** (se borrará según lo acordado).

`inventory_movements`: `unit_id` (FK → `measurement_units`), `conversion_factor` numeric(15,4), `base_quantity` numeric(15,4), `quantity_before` / `quantity_after` numeric(15,2), `total_cost` numeric(15,2), `reference_type` varchar(50). El CHECK de `movement_type` ahora admite además `INITIAL_STOCK`, `RETURN_EXIT` y `WASTE`.

### 1.3 Datos actuales

6 artículos con `unit_of_measure` de texto libre (`unit`, `box`, `pack`), `minimum_stock = 0`, sin `base_unit_id` ni `barcode`. 30 movimientos con tipos antiguos (22 EXIT, 7 ENTRY, 1 ADJUSTMENT_IN). `measurement_units` e `inventory_item_units` están vacías.

### 1.4 Huecos de código

- Backend: las entidades ORM no mapean las tablas/columnas nuevas; el stock se calcula con la lista fija `ENTRY/ADJUSTMENT_IN`; no hay endpoints para unidades ni conversiones.
- Frontend: tipos sin los campos nuevos; `INVENTORY_UNITS` es una lista hardcodeada; el formulario de movimiento solo tiene 4 tipos; no hay selector de unidad ni stock mínimo/máximo.

## 2. Decisiones

1. **Alcance**: backend + frontend.
2. **Flags de menú**: solo queda `allow_menu_config`; se elimina `is_configurable_in_the_menu`.
3. **Unidades**: la unidad canónica del artículo es `base_unit_id`; `unit_of_measure` queda **deprecado** (oculto en la UI, se conserva la columna una fase y se elimina después).

## 3. Modelo objetivo

- **Código automático del artículo** (`inventory_items.code`): se genera **solo en el backend** al crear como `CATEGORÍA-ARTÍCULO-NNN` (p. ej. `BEB-COC-001` — categoría "Bebidas" + artículo "CocaCola 250ml"). Cada segmento son las primeras 3 letras sin acentos en mayúsculas (`GEN` si no hay letras) y el número es **consecutivo por prefijo dentro de la sede** (3 dígitos), lo que garantiza unicidad con la restricción existente `(code, id_headquarters)`. **El frontend no muestra ni edita el código**: el formulario lo sustituye por el código de barras y el código generado solo se ve en el listado/toast. Si el usuario envía un código manual, se respeta (con la validación de unicidad actual).
- **Unidad base**: el stock siempre se expresa en la unidad base del artículo. `measurement_units` es un catálogo global editable (configuración).
- **`inventory_item_units`**: por cada artículo, la fila base (`is_base_unit`, factor 1) y las alternativas (caja, paquete…) con `conversion_factor` = cuántas unidades base contiene una de esa unidad. `is_purchase_unit` marca con qué unidad se registran las compras por defecto; `is_default`, la unidad sugerida en movimientos.
- **Movimiento**: se registra en la unidad elegida (`unit_id`, `quantity`) y se normaliza: `base_quantity = quantity × conversion_factor`, `total_cost = quantity × unit_cost` (unit_cost = costo de la unidad registrada). `quantity_before/after` se guardan en unidades base. Los movimientos sin `unit_id` (históricos) se interpretan en unidad base.
- **Costo vigente** (`cost_price`): promedio ponderado de las ENTRADAS en unidades base: Σ `total_cost` ÷ Σ `base_quantity` (fallback al cálculo actual con `quantity` para movimientos antiguos).
- **Sentido de los tipos de movimiento** (⚠️ supuesto a confirmar para `RETURN_EXIT`):

  | Tipo | Efecto | Notas |
  |---|---|---|
  | `INITIAL_STOCK` | suma | stock inicial, alimenta costo |
  | `ENTRY` | suma | alimenta costo (promedio ponderado) |
  | `ADJUSTMENT_IN` | suma | no alimenta costo (comportamiento actual) |
  | `EXIT` | resta | |
  | `ADJUSTMENT_OUT` | resta | |
  | `WASTE` | resta | merma |
  | `RETURN_EXIT` | resta | supuesto: salida por devolución a proveedor |

- **Alertas**: `minimum_stock` / `maximum_stock` en unidades base; el listado expone el stock actual y la UI marca "Bajo mínimo".
- **`allow_menu_config`**: el artículo puede configurarse desde la vista de menú del cliente.
- **`reference_type`**: se eliminó de la BD; el tipo de documento vive en `reference` (texto libre). No se expone en la API ni en la UI.
- **Movimientos con unidad**: la cantidad se registra en la unidad elegida (`unitId` + `quantity`); el backend resuelve el factor (`inventory_item_units`, o 1 si es la unidad base), guarda `base_quantity = quantity × factor` (lo que mueve el stock), `quantity_before/after` (en unidades base, calculados al registrar) y `total_cost`. Sin `unitId` la cantidad ya es en unidad base.

## 4. Fases

### Fase 0 — BD (script idempotente en `api-restaurant-manager/db/`)

`db/2026-XX-XX-inventory-measurement-units.sql`:

1. Documentar el DDL ya aplicado con `CREATE TABLE IF NOT EXISTS` (`measurement_units`, `inventory_item_units`) + `ALTER TABLE … ADD COLUMN IF NOT EXISTS` de los campos nuevos, para que sea reproducible en otros ambientes.
2. `ALTER TABLE inventory_items DROP COLUMN IF EXISTS is_configurable_in_the_menu`.
3. Sembrar `measurement_units` (idempotente por `abbreviation`), alineado con el catálogo actual del front: `unit` Unidad/QUANTITY · `kg` Kilogramo/WEIGHT · `g` Gramo/WEIGHT · `l` Litro/VOLUME · `ml` Mililitro/VOLUME · `m` Metro/LENGTH · `box` Caja/PACKAGING · `pack` Paquete/PACKAGING.
4. Backfill: mapear `unit_of_measure` → `base_unit_id` por `abbreviation` (fallback `unit`); insertar la fila base en `inventory_item_units` (`is_base_unit`, `is_default`, `is_purchase_unit`, factor 1).

### Fase 1 — Backend `api-restaurant-manager` (módulo `inventory`)

1. **Entidades ORM** (`synchronize: false`, convención de tablas de este módulo): nuevas `MeasurementUnitOrmEntity` e `InventoryItemUnitOrmEntity`; ampliar `InventoryItemOrmEntity` y `InventoryMovementOrmEntity` con las columnas nuevas.
2. **Dominio**: entidades de dominio + repositorios (`measurement-unit`, `inventory-item-unit`); ampliar `InventoryItem`/`InventoryMovement`; helper de signo (`isPositiveMovement`) con `INITIAL_STOCK` y la tabla de sentido del §3.
3. **Persistencia**: mappers (fijar `createdAt`/`updatedAt` a mano, como exige AGENTS.md) y repositorios TypeORM. Cálculo de stock con `COALESCE(base_quantity, quantity)` y lista de tipos positivos actualizada; `sumEntryCost` pasa a Σ`total_cost` ÷ Σ`base_quantity` (fallback al cálculo actual).
4. **Casos de uso + DTOs**:
   - CRUD de `measurement-units` (catálogo global).
   - Unidades del artículo: `GET/POST/PUT/DELETE /inventory/items/:id/units` (filas de `inventory_item_units`).
   - Artículo: crear/editar con `baseUnitId`, `barcode`, `minimumStock`, `maximumStock`, `allowMenuConfig`.
   - Movimiento: aceptar `unitId`, `referenceType`; resolver `conversion_factor` (1 si es la unidad base), calcular `base_quantity`, `quantity_before/after`, `total_cost`; validar stock insuficiente en unidades base; el costo promedio se recalcula con `ENTRY` e `INITIAL_STOCK` (también al anular).
5. **Controladores** con `@RequireModules('/inventario')` (mismos permisos que el módulo actual) y envelope `{code,msg,…}` habitual.
6. **Tests**: unitarios de conversión, signo de movimientos, costo ponderado y stock bajo mínimo; e2e de los endpoints nuevos.

### Fase 2 — Frontend `app-restaurant-manager`

1. **`src/types/index.ts`**: `ApiMeasurementUnit`, `ApiInventoryItemUnit`; campos nuevos en `ApiInventoryItem` y payloads; `InventoryMovementType` gana `INITIAL_STOCK | RETURN_EXIT | WASTE`; `ApiInventoryMovement`/payload con `unitId`, `conversionFactor`, `baseQuantity`, `quantityBefore/After`, `totalCost`, `referenceType`.
2. **Servicios**: `measurement-unit-service.ts` (CRUD) + endpoints de unidades por artículo en `inventory-item-service.ts`; payload de movimientos ampliado.
3. **`inventory-labels.ts`**: etiquetas y badges de los 3 tipos nuevos, `addsStock` actualizado; se sustituye el `INVENTORY_UNITS` hardcodeado por el catálogo de la API.
4. **Formulario de artículo** (`inventory-item-form-dialog.tsx`): el código de barras ocupa la primera posición (donde iba el código, que ya no se pide); unidad base (select del catálogo), stock mínimo/máximo, switch `allowMenuConfig`; se retira `unitOfMeasure`.
5. **Editor de unidades del artículo** (nuevo componente): filas de `inventory_item_units` con factor de conversión, flags base/compra/por defecto y código de barras por unidad.
6. **Formulario de movimiento** (`inventory-movement-form-dialog.tsx`): selector de unidad entre las del artículo (`GET /inventory/items/:id/units`), conversión en vivo a unidad base, stock resultante (antes → después) y los 7 tipos en el select. Sin `referenceType`.
7. **Reorganización de `/inventario`** en pestañas: **Artículos** (columnas: nombre, categoría, unidad base, stock actual, mín/máx con badge "Bajo mínimo", código de barras, costo, estado) · **Movimientos** (kardex con unidad, cantidades base y snapshots) · **Categorías** · **Unidades de medida** (catálogo `measurement_units`: alta/edición/desactivación) · **Unidades por artículo** (filas `inventory_item_units` de un artículo: unidad, factor de conversión, flags base/compra/por defecto, código de barras; alta/edición/baja). Sin entrada nueva en el sidebar: todo vive bajo el menú `Inventario` existente, así que no toca `seed-menu-navigation.sql`.
8. **Verificación**: `pnpm exec tsc -b` en verde y `pnpm lint` sin errores nuevos.

## 5. Supuestos y puntos a confirmar

1. **`RETURN_EXIT` resta stock** (salida por devolución a proveedor). Si en realidad es una devolución de venta que reingresa mercancía, se cambia el signo en un solo sitio (helper de sentido).
2. **`reference_type`** es varchar libre con los valores sugeridos del §3; si prefieres un CHECK en BD, se añade al script de la Fase 0.
3. **`ADJUSTMENT_IN` no alimenta el costo promedio** (comportamiento actual que se conserva); `INITIAL_STOCK` sí.
4. **`unit_of_measure`**: se conserva la columna (deprecada) y se elimina en una fase posterior, tras verificar que nada la lee.
5. Fuera de alcance: tablas adicionales (proveedores, compras, lotes/vencimientos, recetas). Si las quieres, se planifican aparte.

## 6. Verificación global

- Backend: `pnpm format && pnpm lint && pnpm build && pnpm test` (y e2e si la BD de dev está accesible).
- Frontend: `pnpm exec tsc -b` + `pnpm lint`; recorrido manual de la pestaña Artículos (crear artículo con unidad base y mínimo, ver badge de bajo mínimo) y de Movimientos (entrada en caja con conversión, salida por debajo del mínimo bloqueada).
