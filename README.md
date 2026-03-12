# Prescriptions — Frontend

Portal web para el sistema de gestión de prescripciones médicas. Construido con **Next.js 16 App Router** como Backend-for-Frontend (BFF): las API routes de Next.js actúan de intermediarias entre el navegador y el backend NestJS, gestionando las cookies de autenticación de forma segura.

Desarrollado con ♥ por Nicolás para Nutrabiotics.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 |
| UI | React 19.2 |
| Estilos | Tailwind CSS 4 |
| Notificaciones | Sonner 2 |
| Testing | Jest 30 · jest-environment-jsdom |

---

## Requisitos previos

- **Node.js 18+**
- El **backend** (`prescriptions-backend`) corriendo en el puerto 4000
- `npm`

---

## Setup local

### 1. Configurar variables de entorno

Crea el archivo `.env.local` en la raíz del frontend:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
```

O créalo manualmente con este contenido:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

> Si cambias el puerto del backend, actualiza este valor.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Aplicación disponible en: **http://localhost:3000**

---

## Cuentas de prueba

Una vez ejecutado el seed del backend:

| Rol | Email | Contraseña | Dashboard |
|---|---|---|---|
| Administrador | `admin@test.com` | `admin123` | `/admin/dashboard` |
| Doctor | `dr@test.com` | `dr123` | `/doctor` |
| Paciente | `patient@test.com` | `patient123` | `/dashboard` |

---

## Estructura del proyecto

```
prescriptions-frontend/
├── .env.local               # Variables de entorno locales (crear manualmente)
├── middleware.ts             # Protección de rutas: redirige a /auth/login si no hay token
├── app/
│   ├── layout.tsx           # Layout raíz
│   ├── page.tsx             # Redirect a /dashboard según rol
│   ├── api/                 # BFF — API routes de Next.js
│   │   ├── auth/            #   login / logout / register / profile / refresh
│   │   ├── prescriptions/   #   CRUD prescripciones + consume + PDF
│   │   └── admin/           #   métricas y usuarios
│   ├── auth/
│   │   ├── login/           # Página de inicio de sesión
│   │   └── register/        # Página de registro
│   ├── dashboard/           # Panel de paciente
│   ├── doctor/              # Panel de doctor (crear prescripciones, listar)
│   └── admin/               # Panel de administrador (métricas, usuarios)
│       ├── layout.tsx       # Sidebar + bottom nav responsive
│       ├── AdminNav.tsx     # Navegación desktop + mobile
│       ├── dashboard/       # Métricas con gráficos
│       ├── prescriptions/   # Listado global de prescripciones
│       └── users/           # Gestión de usuarios
├── app/lib/
│   └── server-fetch.ts      # Helper BFF: cookies, refresh de token, fetch autenticado
└── lib/
    ├── auth.service.ts      # Funciones de login/register para el cliente
    ├── prescriptions.service.ts  # Llamadas a /api/prescriptions
    ├── doctor.service.ts    # Llamadas a /api/doctor/*
    └── admin.service.ts     # Llamadas a /api/admin/*
```

---

## Cómo funciona el BFF (Backend-for-Frontend)

```
Navegador
   │  fetch('/api/auth/login')        ← ruta relativa, sin CORS
   ▼
Next.js API Route  (/app/api/auth/login/route.ts)
   │  fetch('http://localhost:4000/api/auth/login')  ← llamada server-side
   ▼
NestJS Backend
   │
   └─ Retorna { accessToken, refreshToken }

Next.js fija las cookies httpOnly en la respuesta al navegador.
El navegador nunca ve los tokens en JavaScript.
```

1. El navegador llama a rutas `/api/*` **internas** de Next.js.
2. Las API routes leen las cookies `httpOnly` del request, las reenvían al backend NestJS, y propagan la respuesta al cliente.
3. El middleware de Next.js protege las rutas `/dashboard`, `/doctor` y `/admin` revisando que existan las cookies antes de cargar la página.

---

## Scripts disponibles

```bash
npm run dev        # Desarrollo con hot-reload
npm run build      # Build de producción
npm run start      # Iniciar build de producción
npm run lint       # Linting

npm run test       # Tests unitarios
npm run test:watch # Modo watch
npm run test:cov   # Con reporte de cobertura
```

---

## Funcionalidades por rol

### Administrador
- Dashboard con KPIs: médicos, pacientes, prescripciones pendientes/consumidas
- Gráfico de dona (distribución por estado) y gráfico de barras (prescripciones por día)
- Tabla de top médicos por actividad
- Filtro de fechas aplicable a todas las métricas
- Gestión de usuarios: crear, listar y eliminar
- Listado global de prescripciones

### Doctor
- Crear prescripciones para pacientes con múltiples ítems de medicamento
- Listar todas las prescripciones con filtro por estado
- Ver detalle de cada prescripción

### Paciente
- Ver prescripciones propias con paginación y filtro por estado
- Marcar prescripciones como consumidas
- Descargar prescripción en PDF

---

## Diseño responsive

- **Login**: panel de branding oculto en móvil, formulario a ancho completo.
- **Panel admin**: sidebar en desktop (`md+`), barra de navegación inferior fija en móvil con acceso a todas las secciones y botón de cierre de sesión.

---

## Puertos

| Servicio | Puerto |
|---|---|
| Frontend Next.js | 3000 |
| Backend NestJS | 4000 |
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
