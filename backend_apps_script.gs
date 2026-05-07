/**
 * ============================================================
 * BACKEND · El Heraldo del Tenampa
 * Curso ADE 4067 · Gestión del Cambio · EGADE Business School
 *
 * Este script recibe las respuestas de los formularios HTML y
 * las guarda en una hoja de Google Sheets. También sirve los
 * datos al dashboard de la docente.
 *
 * SETUP:
 * 1. Crea un Google Sheet nuevo y copia su ID (de la URL).
 * 2. Pega ese ID en SPREADSHEET_ID abajo.
 * 3. En el Sheet, crea estas pestañas (sheets) vacías:
 *      - respuestas
 * 4. Despliega como Web App:
 *      Deploy > New deployment > Type: Web app
 *      Execute as: Me
 *      Who has access: Anyone
 * 5. Copia la URL del Web App.
 * 6. Pega esa URL en BACKEND_URL en cada uno de los 5
 *    formularios HTML y en el dashboard.
 * ============================================================
 */

const SPREADSHEET_ID = 'PEGA_AQUI_TU_SPREADSHEET_ID';
const SHEET_NAME = 'respuestas';

/**
 * Recibe POST de los formularios y escribe una fila en el sheet.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Si no existe la hoja, la crea
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Si está vacía, escribir headers en la primera fila
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 6).setValues([[
        'timestamp', 'practica_num', 'practica_titulo',
        'nombre', 'email', 'matricula'
      ]]);
      // Columna 7 en adelante: campos dinámicos
    }

    // Recopilar todas las claves que NO son meta ni de identificación
    const skip = ['_timestamp', '_practica', '_practica_titulo', 'nombre', 'email', 'matricula'];
    const dataKeys = Object.keys(data).filter(k => !skip.includes(k));

    // Asegurar headers para los campos nuevos
    const lastCol = sheet.getLastColumn();
    const headerRange = sheet.getRange(1, 1, 1, Math.max(lastCol, 6));
    const existingHeaders = headerRange.getValues()[0];

    let allHeaders = existingHeaders.slice();
    let needHeaderUpdate = false;
    dataKeys.forEach(k => {
      if (allHeaders.indexOf(k) === -1) {
        allHeaders.push(k);
        needHeaderUpdate = true;
      }
    });

    if (needHeaderUpdate) {
      sheet.getRange(1, 1, 1, allHeaders.length).setValues([allHeaders]);
    }

    // Construir la fila respetando el orden de los headers
    const row = allHeaders.map(h => {
      if (h === 'timestamp') return data._timestamp || new Date().toISOString();
      if (h === 'practica_num') return data._practica || '';
      if (h === 'practica_titulo') return data._practica_titulo || '';
      if (h === 'nombre') return data.nombre || '';
      if (h === 'email') return data.email || '';
      if (h === 'matricula') return data.matricula || '';
      return data[h] || '';
    });

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: 'Respuesta guardada' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Sirve datos al dashboard. GET con ?action=list devuelve todas las respuestas.
 */
function doGet(e) {
  try {
    const action = (e.parameter && e.parameter.action) || 'list';

    if (action === 'list') {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName(SHEET_NAME);

      if (!sheet || sheet.getLastRow() <= 1) {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: true, respuestas: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const range = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn());
      const values = range.getValues();
      const headers = values[0];

      const respuestas = values.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => {
          if (h === 'timestamp') obj._timestamp = row[i];
          else if (h === 'practica_num') obj._practica = row[i];
          else if (h === 'practica_titulo') obj._practica_titulo = row[i];
          else obj[h] = row[i];
        });
        return obj;
      }).filter(r => r._timestamp); // descartar filas vacías

      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, respuestas: respuestas }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'Acción desconocida' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Para pruebas manuales desde el editor de Apps Script.
 * Click en "Run" con la función testWrite seleccionada.
 */
function testWrite() {
  const fakePost = {
    postData: {
      contents: JSON.stringify({
        _timestamp: new Date().toISOString(),
        _practica: 1,
        _practica_titulo: 'Memo de primeras 48 horas',
        nombre: 'Prueba Test',
        email: 'prueba@egade.mx',
        matricula: 'A00000000',
        asunto: 'Continuamos: tres prioridades',
        parrafo_continuidad: 'Texto de prueba'
      })
    }
  };
  const result = doPost(fakePost);
  Logger.log(result.getContent());
}
