# Préstamos

PWA para llevar préstamos personales con pagos semanales. La administradora registra préstamos y pagos; cada cliente entra con su teléfono y un PIN para ver cuánto debe, su calendario de pagos y pedir un nuevo préstamo.

## Flujo de un préstamo

1. El cliente se registra aceptando el aviso de privacidad y los términos, y sube fotos de su INE (frente y reverso).
2. Pide un préstamo, o la administradora lo crea directamente.
3. Al aprobarlo se genera un pagaré con el monto en letra y el calendario semanal.
4. El cliente firma con el dedo en el momento de la entrega, en el celular de la administradora; también puede firmar después desde su app. Se guardan la firma, la fecha, la IP y una huella SHA-256 del texto firmado.
5. Al liquidarse, el préstamo se puede renovar con las mismas condiciones.

La firma dibujada es una firma electrónica simple: sirve como evidencia, pero para cobrar el pagaré por la vía ejecutiva se recomienda además imprimirlo y firmarlo en papel. Los textos del pagaré, del aviso de privacidad y de los términos son plantillas que conviene revisar con un abogado.

## Cómo se calcula un préstamo

- **Total a pagar** = cantidad prestada + interés fijo en porcentaje (puede ser 0%).
- El total se divide en pagos semanales iguales; el redondeo se ajusta en el último pago.
- El primer pago vence una semana después de la fecha de entrega del dinero.
- Cada pago semanal que no quedó cubierto en su fecha de vencimiento genera una **comisión fija por atraso**, aunque después se pague. Pagar el mismo día del vencimiento no es atraso.
- La lógica está en `server/calc.ts` y sus pruebas en `server/calc.test.ts`.

## Requisitos

- Node.js 24 o superior (ejecuta TypeScript directamente)
- pnpm 9
- Una base Postgres (Supabase). La app crea y usa únicamente el esquema `prestamos`.

## Instalación

```bash
pnpm install
cp .env.example .env   # y completa los valores
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión a Postgres. Acepta `postgresql://` o `postgresql+psycopg://` |
| `SECRET_KEY` | Clave para firmar sesiones, mínimo 32 caracteres (`openssl rand -hex 32`) |
| `ADMIN_PHONE` | Teléfono de 10 dígitos de la administradora |
| `ADMIN_PIN` | PIN de 4 a 6 dígitos de la administradora |
| `ADMIN_NAME` | Nombre a mostrar (opcional) |
| `CONTRACT_CITY` | Lugar de firma que aparece en los pagarés (por ejemplo `Mérida, Yucatán`) |
| `TIMEZONE` | Zona horaria para calcular atrasos (por defecto `America/Mexico_City`) |
| `PORT` | Puerto del servidor (por defecto 3000) |

La cuenta de administradora se crea al iniciar el servidor si no existe.

## Ejecución

```bash
pnpm api      # API en http://localhost:3000
pnpm dev      # PWA en http://localhost:5173 (redirige /api al servidor)
pnpm test     # pruebas
pnpm build    # compila la PWA en dist/
pnpm start    # producción: API + PWA en un solo servicio
```

## Despliegue en Render

`render.yaml` define un servicio web Node. En Render: **New > Blueprint**, selecciona el repositorio y captura `DATABASE_URL`, `ADMIN_PHONE` y `ADMIN_PIN`. `SECRET_KEY` se genera sola.

## Estructura

```
server/          API (Hono + Drizzle)
  calc.ts        cálculo de calendario, comisiones y saldo
  db/            esquema y conexión
  routes/        cuenta del cliente y administración
src/             PWA (React + Vite)
  pages/         acceso, cliente y administración
public/          íconos de la PWA
```
