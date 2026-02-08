# Pruebas de subida de Pricing (Resumido) ✅

Este documento explica los pasos mínimos necesarios para probar correctamente la **subida de un pricing** a la API (`POST /api/pricings`). Incluye instalación de dependencias (Chocolatey, MiniZinc) y pasos de verificación.

## Requisitos previos 🔧
- Node.js / npm (para ejecutar backend/frontend)
- MongoDB (o configuración en docker-compose)
- (Opcional) Redis — si usas cache / colas
- En Windows: **Chocolatey** (para instalar MiniZinc fácilmente)
- **MiniZinc** CLI (requerido para extracción de analytics completa)

---

## Instalación en Windows (sugerida) 🪟
1. Abrir **PowerShell como Administrador**.

2. Instalar Chocolatey (si no está instalado):

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor 3072
iwr https://community.chocolatey.org/install.ps1 -UseBasicParsing | iex
```

3. Verificar `choco`:

```powershell
choco -v
```

4. Instalar MiniZinc con Chocolatey:

```powershell
choco install minizinc -y
```

Si preferiste usar el instalador `.msi` (descargando desde https://www.minizinc.org/downloads.html), asegúrate de que la carpeta que contiene `minizinc.exe` (por ejemplo `C:\Program Files\MiniZinc`) esté en la variable de entorno PATH. Puedes añadirla desde **Configuración del Sistema → Variables de Entorno** o con PowerShell (Admin):

```powershell
$machinePath = [Environment]::GetEnvironmentVariable('Path','Machine')
[Environment]::SetEnvironmentVariable('Path', $machinePath + ';C:\Program Files\MiniZinc', 'Machine')
```

Después, abre una nueva consola y verifica:

```powershell
minizinc --version
where minizinc
```

---

## Instalación en Linux / Docker 🐧
- En Debian/Ubuntu:
```bash
sudo apt-get update && sudo apt-get install -y minizinc
```
- En contenedores Docker (ya presente en `api/docker/Dockerfile`):
  - `apt-get install -y minizinc` (se incluye en las Dockerfiles del repo)

---

## Reiniciar backend 🔁
Después de instalar MiniZinc o modificar PATH **reinicia el proceso Node** (o el servicio) que ejecuta el backend para que tome el PATH actualizado:

```bash
cd api
npm run dev:api
# o desde root
npm run dev
```

---

## Configuración del entorno para pruebas 🧪
La lógica de subida usa la variable `ENVIRONMENT`:
- Para pruebas locales (DEV): asegúrate de que en `api/.env` o `.env.development` esté `ENVIRONMENT=development`.
- En **DEV**: la subida se procesa inline (si `minizinc` está disponible se extraen analytics). Si `minizinc` NO está instalado, la subida seguirá y los analytics se omitirán (se registra una advertencia).
- En **PROD**: la API aceptará el archivo y responderá con **202 Accepted**; el procesamiento de analytics se realizará de forma asíncrona (siempre que exista la implementación de worker/cola).

---

## Cómo probar la subida (Postman / curl) 🚀
1. Obtén **token** (autenticación):
   - POST `/api/users/login` con `{ "loginField": "<username o email>", "password": "<password>" }`
   - Guarda `token` devuelto.

2. Subir pricing (multipart/form-data):
   - Endpoint: `POST http://localhost:3000/api/pricings`
   - Headers: `Authorization: Bearer <TOKEN>`
   - Body (form-data):
     - `yaml` (File) → `resend-2026.yaml`
     - `saasName` (Text) → `Resend`
     - `version` (Text) → `2026`
     - (opcional) `collectionId` (Text)

Ejemplo curl:

```bash
curl -X POST http://localhost:3000/api/pricings \
  -H "Authorization: Bearer <TOKEN>" \
  -F "yaml=@/ruta/a/resend-2026.yaml" \
  -F "saasName=Resend" \
  -F "version=2026"
```

**Resultados esperados:**
- En **DEV** con MiniZinc: HTTP 200 y JSON con pricing + analytics.
- En **DEV** sin MiniZinc: HTTP 200 y JSON del pricing; en logs verás: "MiniZinc not available on this environment. Skipping analytics extraction.".
- En **PROD**: HTTP 202 con mensaje de aceptación para ingestión asíncrona.

---

## Errores comunes y soluciones rápidas ⚠️
- Error `spawn minizinc ENOENT`: significa que `minizinc` no está en PATH. Instálalo o añade la ruta del ejecutable al PATH y reinicia el backend.
- `choco` no reconocido: revisa si `C:\ProgramData\chocolatey\bin\choco.exe` existe y asegúrate de que el PATH del sistema lo incluya.
- `Pricing validation failed: yaml: Path 'yaml' is required.`: Asegúrate de usar `multipart/form-data` y que la key del archivo sea `yaml`.

---

## Notas finales 💡
- Para entornos de producción recomendamos realizar el procesamiento pesado de analytics en un worker separado (cola/worker) para evitar bloquear peticiones.
- Puedes automatizar la instalación en servidores Windows con un script PowerShell si lo deseas.

Si quieres, genero también un script PowerShell de verificación/instalación listo para ejecutar en servidores Windows (instalar Chocolatey, MiniZinc y comprobar PATH). ¿Lo quieres ahora?"}