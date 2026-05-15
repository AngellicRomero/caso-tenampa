# Guía: Integración de Formularios con Google Sheets — Caso Tenampa

Conecta los 7 formularios del Caso Tenampa a la hoja de cálculo ya existente para que cada respuesta enviada quede registrada automáticamente.

---

## Arquitectura

```
Alumno llena formulario → fetch POST → Google Apps Script → Google Sheets
                                                          ↕
                                              dashboard_profesora.html
```

El intermediario es **Google Apps Script**, que actúa como API gratuita entre el formulario y la hoja de cálculo.

---

## Datos del proyecto

| Elemento | Valor |
|---|---|
| Hoja de cálculo | [Caso Tenampa — Respuestas](https://docs.google.com/spreadsheets/d/1s_1ks709v0vuIQGJobXhFtKbpczlmJ74KaYneXgSxX8/edit) |
| Spreadsheet ID | `1s_1ks709v0vuIQGJobXhFtKbpczlmJ74KaYneXgSxX8` |
| Apps Script URL | Se genera en el Paso 3 — guardar en `config.js` (no en GitHub) |

---

## Paso 1 — Abrir la hoja de cálculo

La hoja ya existe. Ábrela aquí:

**[https://docs.google.com/spreadsheets/d/1s_1ks709v0vuIQGJobXhFtKbpczlmJ74KaYneXgSxX8/edit](https://docs.google.com/spreadsheets/d/1s_1ks709v0vuIQGJobXhFtKbpczlmJ74KaYneXgSxX8/edit)**

El script creará automáticamente una pestaña por cada práctica cuando llegue la primera respuesta (`Práctica 1`, `Práctica 2`, etc.).

---

## Paso 2 — Crear el Google Apps Script

1. Dentro de la hoja de cálculo, ve al menú **Extensiones → Apps Script**.

2. Borra todo el código que aparece por defecto.

3. Pega el siguiente código completo:

```javascript
// ============================================================
//  Caso Tenampa — Receptor y lector de respuestas
// ============================================================
const SPREADSHEET_ID = '1s_1ks709v0vuIQGJobXhFtKbpczlmJ74KaYneXgSxX8';

// ── Recibe respuestas de los formularios ───────────────────
function doPost(e) {
  try {
    const raw = e.postData ? e.postData.contents : '';
    if (!raw) return respond(false, 'Sin datos');

    const data = JSON.parse(raw);
    const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);

    const sheetName = 'Práctica ' + (data._practica || 'Sin número');
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      const headers = Object.keys(data);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
           .setFontWeight('bold')
           .setBackground('#4a0020')
           .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow(Object.values(data));
    return respond(true, 'Guardado correctamente');

  } catch (err) {
    return respond(false, err.toString());
  }
}

// ── Devuelve todas las respuestas al dashboard ─────────────
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : '';
    if (action !== 'list') return respond(false, 'Acción no reconocida');

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const respuestas = [];

    ss.getSheets().forEach(sheet => {
      if (!sheet.getName().startsWith('Práctica ')) return;
      const data = sheet.getDataRange().getValues();
      if (data.length < 2) return;
      const headers = data[0];
      for (let i = 1; i < data.length; i++) {
        const obj = {};
        headers.forEach((h, j) => { obj[h] = data[i][j]; });
        respuestas.push(obj);
      }
    });

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, respuestas: respuestas }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return respond(false, err.toString());
  }
}

function respond(success, message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: success, message: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Prueba manual ──────────────────────────────────────────
function testPost() {
  const mockData = {
    nombre:           'Alumno de Prueba',
    matricula:        'A00000000',
    email:            'prueba@tec.mx',
    campo_ejemplo:    'Texto de prueba',
    _practica:        0,
    _practica_titulo: 'TEST',
    _timestamp:       new Date().toISOString()
  };

  const ss     = SpreadsheetApp.openById(SPREADSHEET_ID);
  const nombre = 'Práctica ' + mockData._practica;
  let sheet    = ss.getSheetByName(nombre) || ss.insertSheet(nombre);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(Object.keys(mockData));
  }
  sheet.appendRow(Object.values(mockData));
  Logger.log('✅ Fila de prueba insertada en la pestaña "' + nombre + '".');
}
```

4. Guarda el proyecto con **Ctrl + S** y nómbralo `TenampaBackend`.

---

## Paso 3 — Desplegar como Web App

1. Haz clic en **Implementar → Nueva implementación**.

2. Haz clic en el ícono ⚙ junto a **Tipo** y selecciona **Aplicación web**.

3. Configura estos valores exactos:

   | Campo | Valor |
   |---|---|
   | Descripción | `v1` |
   | Ejecutar como | `Yo (tu cuenta)` |
   | Quién tiene acceso | `Cualquier persona` |

4. Haz clic en **Implementar** y autoriza los permisos cuando se soliciten.

5. Copia la **URL de la aplicación web** generada:
   ```
   https://script.google.com/macros/s/XXXXXXXXXXXXXXXX/exec
   ```

   > **Guarda esta URL — la necesitas en el Paso 4.**

---

## Paso 4 — Crear `config.js` (local, no se sube a GitHub)

Crea el archivo `config.js` en la raíz del proyecto. Este archivo está en `.gitignore` — nunca se subirá al repositorio.

```javascript
// config.js — ARCHIVO LOCAL. NO COMMITEAR. NO COMPARTIR.
window.TENAMPA_BACKEND_URL = 'PEGA_AQUÍ_LA_URL_DEL_PASO_3';
```

Reemplaza `PEGA_AQUÍ_LA_URL_DEL_PASO_3` con la URL copiada en el paso anterior.

---

## Paso 5 — Modificar los 7 formularios

En cada archivo `form_practica_X_*.html` hay que hacer **dos cambios**:

### Cambio A — Agregar `config.js` en el `<head>`

Busca la línea `</head>` y agrega justo antes:

```html
<script src="config.js"></script>
```

### Cambio B — Actualizar la variable `BACKEND_URL`

Busca esta línea en el JavaScript del formulario:

```javascript
const BACKEND_URL = 'REEMPLAZA_AQUI_CON_URL_DE_APPS_SCRIPT';
```

Cámbiala por:

```javascript
const BACKEND_URL = window.TENAMPA_BACKEND_URL || '';
```

### Cambio C — Corregir el `Content-Type` del fetch

Busca el bloque `fetch` y asegúrate de que `Content-Type` sea `text/plain`:

```javascript
const res = await fetch(BACKEND_URL, {
  method: 'POST',
  mode: 'no-cors',
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify(data)
});
```

### Formularios a modificar

- [ ] `form_practica_1_memo.html`
- [ ] `form_practica_2_decision_brief.html`
- [ ] `form_practica_3_board_decision.html`
- [ ] `form_practica_4_roadmap.html`
- [ ] `form_practica_5_induccion.html`
- [ ] `form_practica_6_propuesta_estrategica.html`
- [ ] `form_practica_7_reflexion.html`

---

## Paso 6 — Probar la integración

### 6.1 Prueba desde el editor de Apps Script

1. En el editor, selecciona la función `testPost` en el menú desplegable.
2. Haz clic en **Ejecutar**.
3. Revisa la hoja de cálculo — debe aparecer una pestaña **Práctica 0** con una fila de datos de prueba.
4. Si todo está bien, elimina esa pestaña de prueba antes de usar en clase.

### 6.2 Prueba desde el formulario en el navegador

1. Abre cualquier formulario localmente (doble clic en el `.html`).
2. Llena todos los campos y haz clic en **Enviar respuesta**.
3. Revisa la hoja de cálculo — debe aparecer una nueva pestaña `Práctica X` con la respuesta.

> **Nota:** Con `mode: 'no-cors'` el formulario no puede leer la respuesta del servidor, por lo que mostrará "éxito" aunque el backend falle. Siempre verifica directamente en Sheets.

---

## Paso 7 — Autorizar permisos (solo la primera vez)

Cuando ejecutes `testPost` por primera vez, Apps Script pedirá autorización:

1. Haz clic en **Revisar permisos**.
2. Selecciona tu cuenta de Google (`@tec.mx` o la que usas).
3. Si aparece "Google no ha verificado esta app", haz clic en **Avanzado → Ir a TenampaBackend**.
4. Haz clic en **Permitir**.

Esto solo ocurre una vez. Después el script corre sin intervención.

---

## Paso 8 — Publicar los cambios a GitHub

Después de modificar los formularios:

```bash
git add form_practica_*.html
git commit -m "Connect forms to Google Sheets via Apps Script"
git push
```

> `config.js` **NO** se incluye en el commit — está en `.gitignore`. Cada persona que use el proyecto localmente debe crear su propio `config.js`.

---

## Resumen de seguridad

| Archivo | GitHub | Contiene |
|---|---|---|
| `config.js` | ❌ Nunca (`.gitignore`) | URL del Apps Script |
| `form_practica_*.html` | ✅ Sí | Solo `window.TENAMPA_BACKEND_URL` |
| `GUIA_GOOGLE_SHEETS.md` | ✅ Sí | Solo instrucciones |
| `.claude/` | ❌ Nunca (`.gitignore`) | Config local de Claude |

---

## Checklist completo

- [ ] Hoja de cálculo abierta y verificada
- [ ] Apps Script creado con el código del Paso 2
- [ ] Apps Script desplegado como Web App (Paso 3)
- [ ] URL del script copiada y guardada en `config.js` (Paso 4)
- [ ] Los 7 formularios modificados (Pasos 5A, 5B, 5C)
- [ ] Prueba exitosa con `testPost` desde el editor (Paso 6.1)
- [ ] Prueba exitosa enviando un formulario real (Paso 6.2)
- [ ] Commit y push de los formularios modificados (sin `config.js`)
