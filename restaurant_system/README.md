# UrbanFlow Restaurant System

Sistema completo para la gestión de restaurantes con almacenamiento local y respaldo en la nube.

## 📁 Estructura de Carpetas

```
C:\UrbanFlow\[NombreRestaurante]\
├── config/
│   ├── restaurante.json          # Datos generales del negocio
│   ├── roles.json                # Roles personalizados
│   ├── zonas.json                # Zonas de delivery
│   ├── plantilla.json            # Template visual de la carta
│   └── almacenamiento.json       # Config de respaldo
├── productos/
│   ├── catalogo.json             # Todos los productos
│   ├── categorias.json           # Categorías del menú
│   └── fotos/                    # Fotos locales de productos
├── pedidos/
│   ├── activos.json              # Pedidos en curso
│   ├── historial.json            # Pedidos completados
│   └── detalle/                  # Detalle por pedido
├── inventario/
│   ├── stock_actual.json         # Stock actual por producto
│   ├── movimientos.json          # Historial de movimientos
│   └── proveedores.json          # Proveedores
├── clientes/
│   ├── registro.json             # Clientes registrados
│   └── direcciones.json          # Direcciones guardadas
├── empleados/
│   ├── personal.json             # Lista de empleados
│   ├── fichajes.json             # Control de horarios
│   └── permisos.json             # Permisos por empleado
├── delivery/
│   ├── asignaciones.json         # Pedidos asignados a delivery
│   └──轨迹.json                   # Historial de ubicación
├── facturacion/
│   ├── cobros.json               # Todos los cobros
│   ├── comisiones.json           # Fees UF y MP
│   └── resumen_diario.json       # Resumen por día
├── auditoria/
│   └── logs.json                 # Registro de actividades
└── reportes/
    ├── ventas.json               # Reporte de ventas
    └── inventario.json           # Reporte de inventario
```

## 🎯 Módulos Implementados

### 1. Configuración del Restaurante
- Datos generales del negocio
- Horarios de atención
- Métodos de pago aceptados
- Configuración de delivery

### 2. Sistema de Roles Personalizables
- Roles predefinidos: Dueño, Encargado, Cajero, Cocinero, Delivery, Vendedor
- Permisos granulares por sección
- Personalización completa de roles

### 3. Productos y Categorías
- Catálogo completo con variantes
- Categorías y subcategorías
- Fotos locales de productos
- Control de stock por producto

### 4. Inventario Completo
- Stock actual por producto
- Historial de movimientos (entradas/salidas/ajustes)
- Proveedores y condiciones de pago
- Alertas de stock bajo

### 5. Pedidos
- Ciclo de vida completo del pedido
- Estados: recibido → preparando → listo → en camino → entregado
- Soporte para delivery, local y retiro
- Integración con MercadoPago

### 6. Empleados
- Registro de personal con PIN
- Control de horarios (fichajes)
- Asignación de roles y permisos

### 7. Delivery
- Zonas geográficas con polígonos
- Costos y tiempos por zona
- Asignación de delivery
- Tracking en tiempo real

### 8. Clientes
- Registro con token único
- Direcciones guardadas
- Sistema de fidelidad (puntos)
- Historial de compras

### 9. Facturación
- Cobros con desglose de fees
- Fee UrbanFlow (2 UI)
- Comisión MercadoPago (7.88%)
- Resúmenes diarios/mensuales

### 10. Auditoría
- Logs de actividad por usuario
- Filtros por categoría y fecha
- IPs y dispositivos

## 💰 Modelo de Costos

| Concepto | Costo |
|----------|-------|
| Software UrbanFlow | Gratis |
| Datos locales en PC | Gratis |
| 1 foto por producto online | Gratis |
| Respaldo en la nube (solo texto) | $100 UYU/mes o $1,000 UYU/año |
| Fee por venta | 2 UI (se descuenta del cobro) |
| Comisión MercadoPago | 7.88% (se descuenta del cobro) |

## 🛡️ Seguridad

- Los datos se guardan localmente en la PC del restaurante
- No se envían fotos a la nube (solo texto)
- Cada empleado tiene su propio PIN
- Logs de auditoría completos
- Control de permisos por rol

## 🚀 Instalación

1. Crear carpeta: `C:\UrbanFlow\[NombreRestaurante]\`
2. Copiar estructura de archivos JSON
3. Configurar datos del restaurante en `config/restaurante.json`
4. Agregar productos en `productos/catalogo.json`
5. Configurar empleados en `empleados/personal.json`

## 📊 Dashboard

El dashboard del dueño muestra:
- Resumen del día (pedidos, ventas, fees)
- Pedidos activos en tiempo real
- Alertas de inventario bajo
- Empleados trabajando
- Zonas activas
- Últimas acciones de auditoría

## 🔧 Próximas Funcionalidades

- [ ] Interfaz web completa para gestión
- [ ] App móvil para empleados
- [ ] Integración con impresoras de cocina
- [ ] Sistema de reservas
- [ ] Publicidad integrada
- [ ] Reportes avanzados
- [ ] Exportación de datos

## 📝 Notas Técnicas

- Formato de datos: JSON
- Almacenamiento: Local (localStorage/IndexedDB) + Supabase (backup)
- Autenticación: PIN por empleado
- Pagos: MercadoPago API
- Geolocalización: Google Maps API

## 🆕 Versión

1.0.0 - Septiembre 2026

## 👥 Desarrollado por

UrbanFlow Uruguay - 2026
