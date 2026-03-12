# Decisiones Técnicas — Frontend

Este documento detalla las decisiones de diseño y arquitectura tomadas durante el desarrollo del frontend del sistema de gestión de prescripciones médicas.

---

## 1. Patrón BFF (Backend-for-Frontend)

**Decisión central del sistema:** Las API routes de Next.js actúan como una capa BFF entre el navegador y el backend NestJS, en lugar de que el navegador haga las peticiones directamente.

**Flujo sin BFF (descartado):**

```
Navegador  →  fetch('http://localhost:4000/api/auth/login')
           ←  { accessToken, refreshToken }
           →  localStorage.setItem('token', accessToken)  ← XSS vulnerable
```

**Flujo con BFF (implementado):**

```
Navegador  →  fetch('/api/auth/login')               ← ruta relativa, mismo origen
           ↓
Next.js API Route  →  fetch('http://localhost:4000/api/auth/login')
                   ←  { accessToken, refreshToken }
                   →  Set-Cookie: access_token=...; httpOnly; SameSite=lax
           ↓
Navegador recibe respuesta con cookies.
Los tokens NUNCA tocan JavaScript del navegador.
```

**Beneficios concretos:**

| Beneficio | Detalle |
|---|---|
| Elimina XSS sobre tokens | Las cookies `httpOnly` no son accesibles desde `document.cookie` |
| Sin CORS en el cliente | El navegador llama a su propio origen (`localhost:3000`), no al backend |
| Centralización | El refresh de token y el enrutamiento de errores 401 viven en un solo lugar: `server-fetch.ts` |
| Flexibilidad | La URL del backend (`NEXT_PUBLIC_API_URL`) se puede cambiar sin tocar ninguna lógica de cliente |

**Archivos clave del BFF:**

- `app/lib/server-fetch.ts` — helper `authenticatedFetch`: adjunta la cookie, maneja el refresh automático (token rotation) y reintenta la petición original si el access token expiró.
- `app/api/auth/` — routes de login, logout, register, profile y refresh.
- `app/api/prescriptions/` — proxying de listado, consumo y descarga de PDF.
- `app/api/admin/` — proxying de métricas y gestión de usuarios.

---

## 2. Framework: Next.js 16 App Router

**Decisión:** Next.js con App Router en lugar de Pages Router o una SPA pura (Vite + React).

**Razones:**

- **API Routes integradas**: permiten implementar el patrón BFF sin un servidor adicional.
- **Middleware nativo**: `middleware.ts` intercepta las rutas protegidas antes de renderizar la página, redirigiendo a `/auth/login` si no hay token. Sin JS del cliente, sin flash de contenido.
- **Server Components**: los layouts y páginas que no necesitan interactividad se renderizan en el servidor, reduciendo JavaScript enviado al navegador.
- **`use client` granular**: solo los componentes que realmente necesitan estado o eventos de DOM se marcan como Client Components.

---

## 3. Protección de rutas: Middleware de Next.js

**Decisión:** Middleware a nivel de framework en lugar de guards de React en el cliente.

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  return NextResponse.next();
}
```

**Ventajas sobre guards client-side:**

- Ejecuta en el Edge, antes de que se descargue cualquier JS al navegador.
- No hay flash de contenido protegido antes de redirigir.
- Las cookies `httpOnly` son legibles en el servidor pero no en el cliente, haciendo esta comprobación imposible de replicar en un guard de React puro.

El middleware cubre: `/dashboard/:path*`, `/doctor/:path*`, `/admin/:path*`.

---

## 4. Gestión de tokens: `server-fetch.ts`

**Decisión:** Centralizar toda la lógica de autenticación de requests server-side en un único helper.

`authenticatedFetch` implementa el flujo de **token rotation transparente**:

1. Adjunta el `access_token` de las cookies al header `Cookie` del request al backend.
2. Si el backend responde `401`, intenta un refresh automático usando el `refresh_token`.
3. Si el refresh tiene éxito, reintenta la petición original con el nuevo access token y devuelve los nuevos tokens para que la API route los fije en la respuesta.
4. Si el refresh también falla, propaga el `401` al navegador, que redirige al login.

Este patrón garantiza que un access token expirado no interrumpa la experiencia del usuario siempre que el refresh token sea válido.

---

## 5. Estilos: Tailwind CSS 4

**Decisión:** Tailwind CSS en lugar de CSS Modules, styled-components o una librería de componentes (MUI, shadcn/ui).

**Razones:**

- **Velocidad de prototipado**: el 100% del estilo está en el JSX, sin cambios de archivo.
- **Sin dead CSS**: Tailwind 4 usa detección basada en contenido, el CSS generado solo incluye las clases usadas.
- **Responsive utility-first**: los prefijos `sm:`, `md:`, `lg:` hacen el diseño responsive legible y localizado en el componente.
- **Consistencia**: todos los valores de espaciado, colores y tipografía salen de la misma escala de diseño.

**Color corporativo:** `primary` configurado como `#0098D0` (azul Nutrabiotics), usado en botones, enlaces activos, indicadores de estado y bordes de foco.

---

## 6. Diseño responsive

**Decisión:** Mobile-first con puntos de quiebre de Tailwind (`md: 768px`).

**Login:**
- El panel de branding izquierdo es `hidden md:flex` — solo visible en tablets/desktop.
- El formulario ocupa el 100% del ancho en móvil (`w-full`) y `w-3/5` en desktop.

**Panel Admin:**
- **Desktop** (`md+`): sidebar fijo a la izquierda con logo, enlaces de navegación y botón de cierre de sesión al fondo.
- **Móvil**: el sidebar se oculta (`hidden md:flex`) y aparece una barra de navegación inferior fija (`fixed bottom-0`).
  - `AdminNav` acepta prop `mobile` para renderizar el variant de bottom bar (iconos + etiquetas de texto corto).
  - El `main` tiene `pb-20 md:pb-5` para que el contenido no quede tapado por la barra inferior.

---

## 7. Notificaciones: Sonner

**Decisión:** Sonner para toasts en lugar de implementación manual o react-toastify.

**Razones:**
- API mínima: `toast.success('…')`, `toast.error('…')`.
- Buen comportamiento por defecto (apilado, swipe-to-dismiss, animaciones).
- Tamaño pequeño y sin dependencias adicionales.

---

## 8. Testing: Jest + jest-environment-jsdom

**Decisión:** Jest con entorno jsdom para tests unitarios de servicios y lógica de presentación.

- `ts-jest` ejecuta TypeScript directamente sin paso de compilación separado.
- `jest-environment-jsdom` simula el DOM del navegador para tests de componentes React cuando se necesita.
- Los tests de servicios (`prescriptions.service.test.ts`) validan la lógica de llamadas a `/api/*` con `fetch` mockeado.

---

## 9. Actualización de seguridad: React 19.2.3

**Decisión:** Se usa React 19.2.3 en lugar de 19.0.x por razones de seguridad.

Las versiones anteriores de React 19 tenían vulnerabilidades conocidas en React Server Components:

| CVE | Severidad | Tipo |
|---|---|---|
| CVE-2025-55184 | Alta (CVSS 7.5) | Denial of Service |
| CVE-2025-67779 | Alta (CVSS 7.5) | Denial of Service |
| CVE-2025-55183 | Media (CVSS 5.3) | Exposición de código fuente |

React 19.2.3 incluye los parches para estos vectores. La actualización es transparente para el código de la aplicación.

---

## 10. Variable de entorno `NEXT_PUBLIC_API_URL`

**Decisión:** La URL del backend se externaliza en `.env.local` en lugar de hardcodearla.

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Convención `NEXT_PUBLIC_`:** Next.js solo expone variables con este prefijo al bundle del cliente. Sin embargo, `NEXT_PUBLIC_API_URL` se usa **únicamente en las API routes (server-side)**, nunca en código de cliente. El prefijo se mantiene por conveniencia, pero el valor nunca viaja al navegador de un usuario final.

El fallback `?? 'http://localhost:3000'` en el código fue el bug original que impedía que las peticiones llegasen al backend (puerto 4000). Se corrigió añadiendo el archivo `.env.local`.
