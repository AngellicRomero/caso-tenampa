# El Heraldo del Tenampa · Sistema de Formularios y Dashboard

Sistema asíncrono de formularios y dashboard para el caso Salón Tenampa
del curso ADE 4067 Gestión del Cambio · EGADE Business School.

## Qué incluye este paquete

```
output/
├── form_practica_1_memo.html                   · Práctica I (memo 48 horas)
├── form_practica_2_decision_brief.html         · Práctica II (decision brief sr. Jorge)
├── form_practica_3_board_decision.html         · Práctica III (dos decisiones)
├── form_practica_4_roadmap.html                · Práctica IV (roadmap 90 días)
├── form_practica_5_induccion.html              · Práctica V (inducción 3 días)
├── form_practica_6_propuesta_estrategica.html  · Práctica VI (propuesta al consejo)
├── dashboard_profesora.html                    · Dashboard de respuestas
└── backend_apps_script.gs                      · Backend de Google Sheets
```

Las seis prácticas tienen formulario async. La Práctica VI se simula
presencialmente con cuatro compañeros haciendo de consejo, pero su
entrega async va por aquí para que la docente pueda leerla antes de
la sesión presencial y preparar la dinámica.

## Configuración paso a paso

### 1. Crea el Google Sheet de respaldo

Ve a [sheets.google.com](https://sheets.google.com), crea una hoja nueva
y nómbrala algo como `Tenampa · Respuestas ADE 4067`.

Copia el ID del Sheet de la URL. Es la parte larga entre `/d/` y `/edit`.
Ejemplo:

```
https://docs.google.com/spreadsheets/d/AQUI_VA_EL_ID_LARGO/edit
```

### 2. Crea el Apps Script

Dentro del mismo Sheet:

1. Menú **Extensiones → Apps Script**
2. Borra el código de ejemplo que aparece
3. Pega el contenido completo del archivo `backend_apps_script.gs`
4. En la línea `const SPREADSHEET_ID = 'PEGA_AQUI_TU_SPREADSHEET_ID';`
   reemplaza `PEGA_AQUI_TU_SPREADSHEET_ID` con el ID que copiaste
5. Guarda con `⌘ + S` (o `Ctrl + S` en otros sistemas)
6. Nombra el proyecto `Tenampa · Backend`

### 3. Despliega el Apps Script como Web App

1. Click en **Deploy** (arriba a la derecha) → **New deployment**
2. Click en el ícono ⚙️ junto a "Select type" → **Web app**
3. Configuración:
   - **Description**: `Tenampa v1`
   - **Execute as**: `Me (tu cuenta)`
   - **Who has access**: `Anyone`
4. Click en **Deploy**
5. Acepta los permisos cuando los pida
   (revisa los avisos de seguridad de Google · es seguro porque es tu propio script)
6. Copia la **Web App URL** que aparece. Se ve así:
   `https://script.google.com/macros/s/AKfy.../exec`

### 4. Pega la URL en los 7 archivos HTML

En cada uno de los 6 formularios y en el dashboard, busca esta línea:

```javascript
const BACKEND_URL = 'REEMPLAZA_AQUI_CON_URL_DE_APPS_SCRIPT';
```

Reemplaza `'REEMPLAZA_AQUI_CON_URL_DE_APPS_SCRIPT'` por la URL del Web App
que copiaste, manteniendo las comillas. Queda así:

```javascript
const BACKEND_URL = 'https://script.google.com/macros/s/AKfy.../exec';
```

### 5. Prueba el flujo completo

Antes de generar los QR, abre `form_practica_1_memo.html` localmente
en un navegador, llena el formulario con datos de prueba y envía.

Luego abre tu Google Sheet. Deberías ver:

- Una pestaña llamada `respuestas` creada automáticamente
- Una fila con tu respuesta de prueba

Después abre `dashboard_profesora.html` en el navegador. Deberías ver
la respuesta de prueba.

Si algo falla, el navegador guarda la respuesta en `localStorage` como
respaldo (el alumno no pierde su trabajo si la red falla).

### 6. Hospeda los HTML y genera los QR

Tienes varias opciones para hospedar los HTML públicamente:

**Opción A · GitHub Pages (gratis, recomendada)**

1. Crea un repo en GitHub, sube los 7 HTML
2. Settings → Pages → activa GitHub Pages desde la rama `main`
3. Tus URLs serán algo como
   `https://tu-usuario.github.io/repo/form_practica_1_memo.html`

**Opción B · Netlify Drop (gratis, sin cuenta)**

1. Ve a [app.netlify.com/drop](https://app.netlify.com/drop)
2. Arrastra la carpeta `output/`
3. Te da una URL pública inmediata

**Opción C · Tu propio servidor o Google Drive con vista pública HTML**

Una vez hospedados, genera un QR para cada formulario con la URL pública.
Cualquier generador de QR funciona ([qr.io](https://qr.io),
[qrcode-monkey.com](https://qrcode-monkey.com), etc.). Embebe el QR
correspondiente debajo de cada presentación en el archivo principal del
Heraldo del Tenampa.

## Flujo del alumno

1. Termina su práctica en Canvas/Canva (PDF que sube a la plataforma normal)
2. Escanea el QR que aparece debajo de la presentación de esa parte
3. El QR lo lleva al formulario HTML correspondiente
4. Llena los campos clave de su entregable + opcionalmente el link al PDF
5. Envía
6. Su respuesta se guarda en Google Sheets

## Flujo de la docente

1. Abre `dashboard_profesora.html`
2. Ve la lista de todas las respuestas con filtros por nombre, email
   y por práctica (incluida la VI)
3. Click en "Ver" de cualquier respuesta para abrir el detalle completo
4. Para análisis profundo, abre directamente el Google Sheet (es Excel real:
   filtros nativos, fórmulas, gráficas, exportar a XLSX)

## Notas

**Por qué los formularios capturan SOLO los elementos clave del entregable.**
El PDF completo se entrega en Canvas. Los formularios capturan los puntos
estructurales (tres opciones, recomendación, etc.) para que la docente
pueda comparar respuestas entre alumnos rápidamente y para análisis
posterior. El campo opcional "Enlace al PDF en Canvas" permite saltar
al entregable completo cuando se necesita.

**La Práctica VI tiene flujo dual.**
La entrega async (vía formulario) sirve para que la docente lea las
propuestas estratégicas antes de la sesión presencial. En la sesión
presencial, cuatro compañeros hacen de consejo y un alumno defiende
su propuesta. El formulario async no reemplaza la dinámica presencial:
la complementa.

**Privacidad y datos.**
Los datos viven en tu Google Sheet. Solo tú y quien expresamente compartas
el sheet pueden verlos. El Apps Script es público para escribir (los alumnos
pueden enviar) pero no expone los datos de regreso a quien no tenga la URL
del Web App. El dashboard se queda dentro de tu computadora, solo accede
al sheet a través de tu Apps Script.

**Si quieres limitar el acceso al dashboard.**
Por defecto, cualquiera con la URL del dashboard HTML puede ver respuestas
si conoce también la URL del Web App. Si quieres mayor control:
- Hospeda el dashboard en una ruta privada (Google Drive en modo restringido)
- O añade una capa simple de password en el HTML del dashboard

**Si en el futuro hay otro grupo y quieres separar respuestas.**
Crea un nuevo Sheet y un nuevo deployment del Apps Script. Genera versiones
nuevas de los HTML con la URL distinta. Los QR cambian por grupo.

## Ajustes que puedes hacer fácilmente

**Cambiar la docente o el curso.** En cada HTML, localiza el bloque
`<header class="masthead">` y modifica los textos de `masthead-descriptor`
y `masthead-dateline`.

**Añadir o quitar campos.** Edita el archivo `generate.py` que viene
con este paquete, modifica la estructura de `PRACTICES`, y vuelve a
correr `python3 generate.py`.

**Ajustar colores o fuentes.** Las variables CSS están en `:root` al
inicio de cada HTML. Cambia `--guinda`, `--paper`, `--ink` etc. y se
propaga a todo el documento.
