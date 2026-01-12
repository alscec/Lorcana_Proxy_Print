const express = require('express');
const axios = require('axios');
const { PDFDocument, rgb } = require('pdf-lib');
const path = require('path');
const cors = require('cors');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ------- Utility: unità & layout -------
const MM_TO_PT = 72 / 25.4; // 1 mm = 2.8346 pt

function mmToPt(mm) { return mm * MM_TO_PT; }

const PAGE_SPECS = {
    A4: { widthPt: 595.276, heightPt: 841.890 }, // 210 × 297 mm
    LETTER: { widthPt: 612, heightPt: 792 } // 8.5 × 11 inch
};

// Dimensioni carta standard TCG
const CARD_W_MM = 63;
const CARD_H_MM = 88;
const CARD_W_PT = mmToPt(CARD_W_MM);
const CARD_H_PT = mmToPt(CARD_H_MM);

// Layout 3×3 su A4: margini e gutter calibrati
function computeLayout(pageType = 'A4') {
    const page = PAGE_SPECS[pageType] || PAGE_SPECS.A4;

    // Scelta: 2 gutter da ~4.5 mm, margini ~6 mm (A4)
    // Lato lungo A4: 297mm -> 3*88 = 264mm; restano 33mm -> top/bottom 12mm + due gutter 4.5mm
    const marginXmm = pageType === 'A4' ? 6 : 6; // mm
    const marginYmm = pageType === 'A4' ? 12 : 9; // mm (letter ha altezza diversa)
    const gutterXmm = 4.5;
    const gutterYmm = 4.5;

    return {
        page,
        marginX: mmToPt(marginXmm),
        marginY: mmToPt(marginYmm),
        gutterX: mmToPt(gutterXmm),
        gutterY: mmToPt(gutterYmm),
        cols: 3,
        rows: 3
    };
}

// Piccola pausa per rispettare rate advice di Lorcast (10 req/s)
const delay = (ms) => new Promise(res => setTimeout(res, ms));

function normalizeSpaces(s) {
    return s.replace(/\s+/g, ' ').trim();
}

function parseList(text) {
    const lines = text.split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'));

    const entries = [];
    for (const raw of lines) {
        const m = raw.match(/^(\d+)\s+(.+)$/);
        if (!m) continue;
        const qty = parseInt(m[1], 10);
        if (!qty) continue;

        let rest = m[2].trim();

        // [SET] opzionale
        let set = null;
        const setM = rest.match(/\[([A-Za-z0-9]+)\]/);
        if (setM) {
            set = setM[1].toUpperCase();
            rest = rest.replace(setM[0], '').trim();
        }

        // #number opzionale
        let number = null;
        const numM = rest.match(/#\s*([0-9A-Za-z]+)/);
        if (numM) {
            number = numM[1];
            rest = rest.replace(numM[0], '').trim();
        }

        const name = normalizeSpaces(rest);
        if (!name) continue;

        entries.push({ qty, name, set, number });
    }

    // Aggrega per chiave (name+set+number)
    const map = new Map();
    for (const e of entries) {
        const key = `${e.name.toLowerCase()}|${e.set||''}|${e.number||''}`;
        const prev = map.get(key);
        map.set(key, prev ? {...prev, qty: prev.qty + e.qty } : e);
    }
    return Array.from(map.values());
}


// ------- API Lorcast -------
// Normalizza QUALSIASI trattino (‐-‒–—―− ecc. + '-') in SPAZIO
function normalizeDashes(s) {
    return (s || '').replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\u2043\uFE58\uFE63\uFF0D\u00AD\-]/g, ' ');
}

// Normalizza per ricerca (accenti, &, trattini→spazio, punteggiatura)
function normalizeNameForSearch(name) {
    var s = (name || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    s = s.replace(/\&/g, ' and ');
    s = normalizeDashes(s);
    s = s.replace(/[“”«»]/g, '"').replace(/[‘’]/g, "'");
    s = s.replace(/[.,!?()]/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    return s;
}

// Chiave forte per uguaglianza (solo a-z0-9, spazi compressi)
function normalizeKey(str) {
    if (!str) return '';
    var s = str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    s = normalizeDashes(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
    return s;
}

// Tokenizzazione robusta
function tokenize(str) {
    var s = (str || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    s = normalizeDashes(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!s) return [];
    return s.split(/\s+/);
}

// Stopword leggere
var STOP = new Set(['a', 'an', 'the', 'of', 'and', 'with', 'but', 'not', 'out', 'to', 'for', 'on', 'in', 'at', 'by', 'as', 's']);

// Filtra token inutili
function filterTokens(tokens) {
    var out = [];
    for (var i = 0; i < tokens.length; i++) {
        var t = tokens[i];
        if (STOP.has(t)) continue;
        if (t.length === 1) continue;
        out.push(t.replace(/'+s?$/, ''));
    }
    return out;
}

// Estrai token "core" dopo ":" o trattino (se non c'è, usa tutto tranne la prima parola)
function extractCoreTokens(originalName) {
    var raw = originalName || '';
    var cut = -1;
    var colon = raw.indexOf(':');
    var dashMatch = raw.match(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\-]/);
    if (colon > -1) cut = colon;
    else if (dashMatch) cut = dashMatch.index;

    var part;
    if (cut > -1) part = raw.slice(cut + 1);
    else part = raw;

    var all = filterTokens(tokenize(part));
    if (cut > -1) return all;

    var full = filterTokens(tokenize(raw));
    if (full.length <= 1) return [];
    return full.slice(1);
}

// Levenshtein per piccoli typo
function levenshtein(a, b) {
    var m = a.length,
        n = b.length;
    var dp = Array(m + 1);
    for (var i = 0; i <= m; i++) {
        dp[i] = Array(n + 1);
        dp[i][0] = i;
    }
    for (var j = 0; j <= n; j++) dp[0][j] = j;
    for (var i = 1; i <= m; i++) {
        for (var j = 1; j <= n; j++) {
            var cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
    }
    return dp[m][n];
}

function tokenEqLoose(a, b) {
    if (a === b) return true;
    var d = levenshtein(a, b);
    if (a.length >= 7 || b.length >= 7) return d <= 2;
    return d <= 1;
}

function overlapCount(tokensA, tokensB) {
    var used = Array(tokensB.length).fill(false);
    var count = 0;
    for (var i = 0; i < tokensA.length; i++) {
        for (var j = 0; j < tokensB.length; j++) {
            if (used[j]) continue;
            if (tokenEqLoose(tokensA[i], tokensB[j])) {
                used[j] = true;
                count++;
                break;
            }
        }
    }
    return count;
}

function jaccardLoose(tokensA, tokensB) {
    var inter = overlapCount(tokensA, tokensB);
    var uni = new Set(tokensA.concat(tokensB)).size;
    return uni ? inter / uni : 0;
}

// Varianti di query cambiando separatori
function buildQueryVariants(name) {
    var raw = (name || '').trim();
    var base = normalizeNameForSearch(name);
    var noDash = base.replace(/\s*-\s*/g, ' ');
    var colon = base.replace(/\s+-\s+/g, ': ');
    var comma = base.replace(/\s+-\s+/g, ', ');
    var enDash = base.replace(/\s+-\s+/g, ' – ');
    var vars = [raw, base, noDash, colon, comma, enDash, '"' + base + '"', '"' + noDash + '"'];
    var seen = new Set(),
        out = [];
    for (var i = 0; i < vars.length; i++) {
        if (!seen.has(vars[i])) {
            seen.add(vars[i]);
            out.push(vars[i]);
        }
    }
    return out;
}






async function searchCardOnLorcast(name, set, number) {
    // Target dall'intera stringa utente
    var norm = normalizeNameForSearch(name);
    var targetTokensFull = filterTokens(tokenize(norm));
    var coreTokens = extractCoreTokens(name); // es. "Restaurant Owner" -> ["restaurant","owner"]
    var targetKey = normalizeKey(name);

    // Soglie "via di mezzo"
    var CORE_MIN_RECALL = 0.60; // copertura minima dei token dopo '-' / ':'
    var ALL_MIN_RECALL = 0.55; // copertura minima token totali
    var JACCARD_MIN = 0.50; // similarità globale minima
    var FALLBACK_MIN = 0.40; // se non c’è di meglio, accetta da qui in su
    var STRICT_IF_NAME_ONLY = 0.88; // senza sottotitolo e senza set/num, richiedi quasi identità

    var attempts = buildQueryVariants(name);

    var bestOverall = null,
        bestOverallScore = -1;

    for (var a = 0; a < attempts.length; a++) {
        var q = attempts[a];
        var url = 'https://api.lorcast.com/v0/cards/search?q=' + encodeURIComponent(q);
        try {
            var resp = await axios.get(url, { timeout: 12000 });
            var data = resp && resp.data ? resp.data : null;
            var results = (data && data.results) ? data.results : [];
            if (!results.length) { await delay(120); continue; }

            // Filtro "duro" per set/numero se possibile
            var filtered = results;
            var hard = false;
            if (set) {
                var tmp = filtered.filter(function(r) { return ((r.set || '').toString().toUpperCase() === set.toUpperCase()); });
                if (tmp.length) {
                    filtered = tmp;
                    hard = true;
                }
            }
            if (number) {
                var tmp2 = filtered.filter(function(r) { return ((r.collector_number || '').toString().toLowerCase() === number.toLowerCase()); });
                if (tmp2.length) {
                    filtered = tmp2;
                    hard = true;
                }
            }

            // 1) Match ESATTO sul nome COMPLETO (name + version)
            var exact = filtered.filter(function(r) {
                var candFull = (r.name || '') + ' ' + (r.version || '');
                return normalizeKey(candFull) === targetKey;
            });
            if (exact.length) return exact[0];

            // 2) Se non c'è sottotitolo e non abbiamo set/num → serviamo quasi identico per evitare versioni sbagliate
            if (!coreTokens.length && !set && !number) {
                var bestStrict = null,
                    bestStrictJac = -1;
                for (var i = 0; i < filtered.length; i++) {
                    var candFullS = (filtered[i].name || '') + ' ' + (filtered[i].version || '');
                    var jacS = jaccardLoose(filterTokens(tokenize(name)), filterTokens(tokenize(candFullS)));
                    if (jacS > bestStrictJac) {
                        bestStrictJac = jacS;
                        bestStrict = filtered[i];
                    }
                }
                if (bestStrict && bestStrictJac >= STRICT_IF_NAME_ONLY) return bestStrict;
                if (bestStrictJac > bestOverallScore) {
                    bestOverallScore = bestStrictJac;
                    bestOverall = bestStrict;
                }
                await delay(120);
                continue;
            }

            // 3) Fuzzy: copertura tokens dopo il trattino + copertura totale + jaccard
            var best = null,
                bestScore = -1;
            for (var i = 0; i < filtered.length; i++) {
                var cand = filtered[i];
                var candFull = (cand.name || '') + ' ' + (cand.version || '');
                var candTokens = filterTokens(tokenize(candFull));

                var interCore = overlapCount(coreTokens, candTokens);
                var coreRecall = coreTokens.length ? (interCore / coreTokens.length) : 1;

                var interAll = overlapCount(targetTokensFull, candTokens);
                var allRecall = targetTokensFull.length ? (interAll / targetTokensFull.length) : 1;

                var jac = jaccardLoose(targetTokensFull, candTokens);

                var score = 0.55 * coreRecall + 0.30 * allRecall + 0.15 * jac;

                if (set && ((cand.set || '').toString().toUpperCase() === set.toUpperCase())) score += 0.15;
                if (number && ((cand.collector_number || '').toString().toLowerCase() === number.toLowerCase())) score += 0.25;
                if (coreTokens.length && interCore === coreTokens.length) score += 0.05;

                // Scarta candidati troppo lontani
                if (coreTokens.length && coreRecall < CORE_MIN_RECALL) continue;
                if (allRecall < ALL_MIN_RECALL && jac < JACCARD_MIN) continue;

                if (score > bestScore) {
                    bestScore = score;
                    best = cand;
                }
            }

            if (best) return best;

            if (bestOverallScore < 0) {
                bestOverallScore = 0;
                bestOverall = null;
            } // init
            await delay(120);
        } catch (e) {
            await delay(200);
        }
    }

    // Fallback: se c'è un candidato "decente", restituiscilo
    if (bestOverall && bestOverallScore >= FALLBACK_MIN) return bestOverall;

    // Solo se scritto malissimo
    return null;
}








function bestImageUrl(card) {
    // Preferisci 'full' JPG se esiste nella doc; altrimenti digital.large/normal
    const img = (card && card.image_uris) ? card.image_uris : {};

    // alcuni wrapper mettono direttamente image_uris.full
    if (img.full) return img.full;

    if (img.digital && img.digital.full) return img.digital.full;
    if (img.digital && img.digital.large) return img.digital.large;
    if (img.digital && img.digital.normal) return img.digital.normal;
    if (img.digital && img.digital.small) return img.digital.small;

    return null;
}


async function fetchImageAsJpegBuffer(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    const buf = Buffer.from(res.data);

    // Se è già JPG, restituisci diretto; altrimenti converti con sharp
    // Euristica semplice per tipo file dall’estensione; in produzione potresti leggere i magic bytes
    const lower = url.toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
        return buf;
    }
    // Converti tutto a JPEG qualità alta per embedding PDF
    return await sharp(buf).jpeg({ quality: 92 }).toBuffer();
}

// ------- Disegno PDF -------
function drawCropMarks(page, x, y, w, h) {
    const mark = mmToPt(1.8); // lunghezza crop mark
    const stroke = 0.5; // sottile
    const c = rgb(0, 0, 0);

    // angoli: (x,y) è bottom-left
    const ctx = page;

    // bottom-left
    ctx.drawLine({ start: { x: x - mark, y }, end: { x: x, y }, thickness: stroke, color: c });
    ctx.drawLine({ start: { x, y: y - mark }, end: { x, y }, thickness: stroke, color: c });

    // bottom-right
    ctx.drawLine({ start: { x: x + w, y: y - mark }, end: { x: x + w, y }, thickness: stroke, color: c });
    ctx.drawLine({ start: { x: x + w, y }, end: { x: x + w + mark, y }, thickness: stroke, color: c });

    // top-left
    ctx.drawLine({ start: { x: x - mark, y: y + h }, end: { x: x, y: y + h }, thickness: stroke, color: c });
    ctx.drawLine({ start: { x, y: y + h }, end: { x, y: y + h + mark }, thickness: stroke, color: c });

    // top-right
    ctx.drawLine({ start: { x: x + w, y: y + h }, end: { x: x + w + mark, y: y + h }, thickness: stroke, color: c });
    ctx.drawLine({ start: { x: x + w, y: y + h }, end: { x: x + w, y: y + h + mark }, thickness: stroke, color: c });
}

// Health check endpoint for container orchestration
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Readiness check endpoint
app.get('/ready', (req, res) => {
  res.status(200).json({ 
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint for Prometheus (basic)
// NOTE: For production, consider using 'prom-client' library for more robust metrics
// npm install prom-client
app.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`
# HELP nodejs_version_info Node.js version info
# TYPE nodejs_version_info gauge
nodejs_version_info{version="${process.version}"} 1

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime()}

# HELP process_resident_memory_bytes Resident memory size in bytes
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes ${process.memoryUsage().rss}

# HELP process_heap_bytes Process heap size in bytes
# TYPE process_heap_bytes gauge
process_heap_bytes ${process.memoryUsage().heapUsed}
  `.trim());
});

app.post('/generate', async(req, res) => {
            try {
                const {
                    list, // text
                    pageType = 'A4', // 'A4' | 'LETTER'
                    cropMarks = true, // boolean
                    strict = true,
                    hiRes = true // boolean (prova a prendere immagini "full")
                } = req.body || {};

                if (!list || typeof list !== 'string') {
                    return res.status(400).json({ error: 'Parametro "list" mancante o non valido.' });
                }
                const cleanedList = normalizeDashes(list).replace(/\s*-\s*/g, ' - ');
                const wanted = parseList(cleanedList);


                if (wanted.length === 0) {
                    return res.status(400).json({ error: 'Nessuna riga valida trovata.' });
                }

                // Recupera dati carte (una volta per nome)
                // Recupera dati carte (una volta per nome + set + number)
                const fetchedMap = new Map(); // key -> { card, jpegBuf } | { error }
                for (const { name, set, number }
                    of wanted) {
                    const key = `${name.toLowerCase()}|${set||''}|${number||''}`;
                    if (fetchedMap.has(key)) continue;

                    const card = await searchCardOnLorcast(name, set, number, strict);
                    await delay(120); // rate advice

                    if (!card) {
                        fetchedMap.set(key, { error: `Carta non trovata: ${name}${set?` [${set}]`:''}${number?` #${number}`:''}` });
      continue;
    }

    let imgUrl = bestImageUrl(card);
    if (!imgUrl) {
      fetchedMap.set(key, { error: `Immagine non disponibile per: ${name}${set?` [${set}]`:''}${number?` #${number}`:''}` });
      continue;
    }

    const jpegBuf = await fetchImageAsJpegBuffer(imgUrl);
    fetchedMap.set(key, { card, jpegBuf });
  }


    // Crea lista di "copie" per il pdf (espansa)
    // Crea lista di "copie" per il pdf (espansa)
const expanded = [];
for (const { name, qty, set, number } of wanted) {
  const key = `${name.toLowerCase()}|${set||''}|${number||''}`;
  const info = fetchedMap.get(key);
  for (let i = 0; i < qty; i++) {
    expanded.push({ name, set, number, info });
  }
}


    // Costruisci PDF
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle('Lorcana Proxy Sheet');
    pdfDoc.setProducer('lorcana-proxy-print');
    pdfDoc.setCreator('lorcana-proxy-print');

    const layout = computeLayout(pageType);
    const pageSize = [layout.page.widthPt, layout.page.heightPt];

    let page = pdfDoc.addPage(pageSize);
    let placedOnPage = 0;

    const cellW = CARD_W_PT;
    const cellH = CARD_H_PT;

    // coordinate: bottom-left origin
    for (let idx = 0; idx < expanded.length; idx++) {
      if (placedOnPage === layout.cols * layout.rows) {
        page = pdfDoc.addPage(pageSize);
        placedOnPage = 0;
      }

      const row = Math.floor(placedOnPage / layout.cols);
      const col = placedOnPage % layout.cols;

      const x = layout.marginX + col * (cellW + layout.gutterX);
      // Partiamo dall’alto: inverti riga per posizionamento bottom-left
      const y = layout.page.heightPt - layout.marginY - cellH - row * (cellH + layout.gutterY);

      const { info, name } = expanded[idx];

      if (!info || info.error) {
        // riquadro rosso per carte non trovate
        page.drawRectangle({
          x, y, width: cellW, height: cellH,
          color: rgb(1, 0.9, 0.9), borderColor: rgb(1, 0, 0), borderWidth: 1
        });
        page.drawText(info?.error || `Errore: ${name}`, {
          x: x + mmToPt(3), y: y + cellH / 2,
          size: 10, color: rgb(0.6, 0, 0)
        });
      } else {
        // embed immagine una sola volta per carta per efficienza
        let img;
        if (!info._embedded) {
          info._embedded = await pdfDoc.embedJpg(info.jpegBuf);
        }
        img = info._embedded;

        // Disegna l’immagine adattando con "cover": l’immagine è già rapporto card
        page.drawImage(img, {
          x, y, width: cellW, height: cellH
        });

        if (cropMarks) drawCropMarks(page, x, y, cellW, cellH);
      }

      placedOnPage++;
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="lorcana-proxies.pdf"');
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore interno nella generazione del PDF.' });
  }
});

app.listen(PORT, () => {
  console.log(`Lorcana proxy server avviato su http://localhost:${PORT}`);
});