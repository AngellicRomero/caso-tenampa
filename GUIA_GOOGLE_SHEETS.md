# Guía: Integración de Formularios con Google Sheets

Conecta los 7 formularios del Caso Tenampa a una hoja de cálculo de Google para que cada respuesta enviada quede registrada automáticamente.

---

## Arquitectura general

```
Alumno llena formulario → fetch POST → Google Apps Script → Google Sheets
                                                          ↕
                                              dashboard_profesora.html
```

El intermediario es **Google Apps Script**, que actúa como API gratuita y sin servidor entre el formulario y la hoja de cálculo.

---

## Parte 1 — Crear la hoja de Google Sheets

1. Ve a [sheets.google.com](https://sheets.google.com) e inicia sesión con la cuenta de Google que usarás para administrar el proyecto.
2. Crea una nueva hoja de cálculo y nómbrala, por ejemplo: **Caso Tenampa — Respuestas**.
3. Anota el **ID de la hoja**: es la cadena larga en la URL entre `/d/` y `/edit`.
   ```
   https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
   ```
4. Dentro de esa hoja puedes dejar la pestaña `Hoja 1` como está; el script creará una pestaña por cada práctica automáticamente.

---

## Parte 2 — Crear el Google Apps Script

1. Dentro de la hoja de cálculo, ve al menú **Extensiones → Apps Script**.
2. Borra todo el código que aparece por defecto.
3. Pega el siguiente código completo:

```javascript
// ============================================================
//  Caso Tenampa — Receptor de respuestas
//  Reemplaza SPREADSHEET_ID con el ID de tu hoja
// ============================================================
const SPREADSHEET_ID = 'REEMPLAZA_CON_TU_ID_DE_SPREADSHEET';

function doPost(e) {
  try {
    const raw = e.postData ? e.postData.contents : '';
    if (!raw) return respond(false, 'Sin datos');

    const data = JSON.parse(raw);
    const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Una pestaña por práctica
    const sheetName = `Práctica ${data._practica || 'Sin número'}`;
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Primera fila = encabezados derivados de las claves del objeto
      sheet.appendRow(Object.keys(data));
      sheet.getRange(1, 1, 1, Object.keys(data).length)
           .setFontWeight('bold')
           .setBackground('#4a0020')
           .setFontColor('#ffffff');
    }

    sheet.appendRow(Object.values(data));
    return respond(true, 'Guardado correctamente');

  } catch (err) {
    return respond(false, err.toString());
  }
}

function respond(success, message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success, message }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Prueba manual desde el editor (ejecuta esta función para verificar)
function testPost() {
  const mockData = {
    nombre: 'Alumno de Prueba',
    matricula: 'A00000000',
    email: 'prueba@tec.mx',
    campo_ejemplo: 'Texto de prueba',
    _practica: 1,
    _practica_titulo: 'Memo de primeras 48 horas',
    _timestamp: new Date().toISOString()
  };

  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Práctica 1') || ss.insertSheet('Práctica 1');
  if (sheet.getLastRow() === 0) sheet.appendRow(Object.keys(mockData));
  sheet.appendRow(Object.values(mockData));
  Logger.log('Fila de prueba insertada.');
}
```

4. Reemplaza `'REEMPLAZA_CON_TU_ID_DE_SPREADSHEET'` con el ID que copiaste en el Paso 1-3.
5. Guarda el proyecto (**Ctrl + S** o **Archivo → Guardar**) y ponle un nombre, por ejemplo `TenampaBackend`.

---

## Parte 3 — Desplegar como Web App

1. En el editor de Apps Script, haz clic en **Implementar → Nueva implementación**.
2. Haz clic en el ícono de engranaje ⚙ junto a **Tipo** y selecciona **Aplicación web**.
3. Configura así:
   - **Descripción**: `v1`
   - **Ejecutar como**: `Yo` (tu cuenta de Google)
   - **Quién tiene acceso**: `Cualquier persona` _(necesario para recibir datos sin autenticación)_
4. Haz clic en **Implementar**.
5. Copia la **URL de la aplicación web** que aparece. Tiene este formato:
   ```
   https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXXXXXX/exec
   ```
   > **Esta URL es tu BACKEND_URL. Guárdala en un lugar seguro.**

---

## Parte 4 — Configurar los formularios (sin exponer la URL en GitHub)

Los formularios **no** deben tener la URL del script en el código fuente que se sube a GitHub, ya que el repositorio es público. En su lugar usa un archivo `config.js` local que está en el `.gitignore`.

### 4.1 Crear `config.js`

Crea el archivo `config.js` en la raíz del proyecto con este contenido:

```javascript
// config.js — ESTE ARCHIVO NO SE SUBE A GITHUB (.gitignore)
window.TENAMPA_BACKEND_URL = 'https://script.google.com/macros/s/TU_URL_AQUI/exec';
```

> Este archivo ya está en `.gitignore`. Nunca lo comitas ni lo compartas públicamente.

### 4.2 Agregar `config.js` a cada formulario

En cada archivo `form_practica_X_*.html`, agrega esta línea **antes** del `</head>`:

```html
<script src="config.js"></script>
```

### 4.3 Actualizar la variable `BACKEND_URL` en cada formulario

En el JavaScript de cada formulario, localiza esta línea:

```javascript
const BACKEND_URL = 'REEMPLAZA_AQUI_CON_URL_DE_APPS_SCRIPT';
```

Cámbiala por:

```javascript
const BACKEND_URL = window.TENAMPA_BACKEND_URL || '';
```

Repite el proceso en los 7 formularios:
- [ ] `form_practica_1_memo.html`
- [ ] `form_practica_2_decision_brief.html`
- [ ] `form_practica_3_board_decision.html`
- [ ] `form_practica_4_roadmap.html`
- [ ] `form_practica_5_induccion.html`
- [ ] `form_practica_6_propuesta_estrategica.html`
- [ ] `form_practica_7_reflexion.html`

---

## Parte 5 — Ajustar el fetch para compatibilidad con Apps Script

Los formularios usan `mode: 'no-cors'`, lo que requiere que el `Content-Type` sea `text/plain`. Busca el bloque `fetch` en cada formulario y verifica que quede así:

```javascript
const res = await fetch(BACKEND_URL, {
  method: 'POST',
  mode: 'no-cors',
  headers: { 'Content-Type': 'text/plain' },  // ← text/plain, no application/json
  body: JSON.stringify(data)
});
```

> Apps Script recibe el cuerpo igual — la diferencia es que `text/plain` es compatible con `no-cors` sin restricciones del navegador.

---

## Parte 6 — Probar la integración

### Prueba desde el editor de Apps Script
1. En el editor, selecciona la función `testPost` en el menú desplegable.
2. Haz clic en **Ejecutar**.
3. Ve a tu Google Sheet y verifica que apareció una pestaña **Práctica 1** con una fila de datos.

### Prueba desde el formulario
1. Abre cualquier formulario en el navegador (desde archivo local o GitHub Pages).
2. Llena todos los campos y haz clic en **Enviar respuesta**.
3. Ve a la hoja de cálculo y verifica que apareció una nueva fila.

---

## Parte 7 — Permisos del Apps Script (primera ejecución)

La primera vez que el script procese una petición real, puede pedir autorización:

1. En el editor de Apps Script, ejecuta manualmente `testPost`.
2. Aparecerá una ventana de permisos — haz clic en **Revisar permisos**.
3. Selecciona tu cuenta de Google.
4. Haz clic en **Avanzado → Ir a TenampaBackend (no seguro)** si aparece advertencia.
5. Haz clic en **Permitir**.

Solo se hace una vez. Después de esto, el script funciona sin intervención.

---

## Parte 8 — Actualizar el dashboard de profesora

El archivo `dashboard_profesora.html` visualiza las respuestas. Para conectarlo a Google Sheets necesita leer datos de la hoja. Hay dos opciones:

### Opción A — Google Sheets API (recomendada)
Agrega en `config.js`:
```javascript
window.TENAMPA_SHEET_ID = 'TU_ID_DE_SPREADSHEET_AQUI';
```
Y configura la lectura mediante la [Google Sheets API v4](https://developers.google.com/sheets/api).

### Opción B — Exportar como CSV
Desde Google Sheets: **Archivo → Descargar → CSV** y cargar manualmente en el dashboard. Más simple pero no en tiempo real.

---

## Resumen de archivos sensibles

| Archivo | ¿Se sube a GitHub? | Contiene |
|---|---|---|
| `config.js` | ❌ NO (en .gitignore) | URL del Apps Script |
| `.claude/` | ❌ NO (en .gitignore) | Config de Claude Code |
| `.env` | ❌ NO (en .gitignore) | Variables de entorno |
| `form_practica_*.html` | ✅ SÍ | Solo referencia `window.TENAMPA_BACKEND_URL` |
| `GUIA_GOOGLE_SHEETS.md` | ✅ SÍ | Solo instrucciones, sin datos reales |

---

## Checklist final

- [ ] Hoja de Google Sheets creada y con ID copiado
- [ ] Apps Script creado con el ID correcto
- [ ] Apps Script desplegado como Web App (acceso: cualquier persona)
- [ ] `config.js` creado localmente con la URL del script
- [ ] `config.js` en `.gitignore` (ya configurado)
- [ ] `<script src="config.js">` agregado en los 7 formularios
- [ ] `BACKEND_URL` actualizado a `window.TENAMPA_BACKEND_URL || ''` en los 7 formularios
- [ ] `Content-Type` cambiado a `text/plain` en los 7 formularios
- [ ] Prueba exitosa desde el editor de Apps Script (`testPost`)
- [ ] Prueba exitosa desde un formulario real
