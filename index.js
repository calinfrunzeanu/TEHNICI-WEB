"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const sass = require("sass");

console.log("__dirname:", __dirname);
console.log("__filename:", __filename);
console.log("process.cwd():", process.cwd());

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

var obGlobal = {
  obErori: null,
  obGalerie: null
};

global.folderScss = path.join(__dirname, "resurse", "scss");
global.folderCss = path.join(__dirname, "resurse", "css");

if (!fs.existsSync(global.folderScss)) {
  fs.mkdirSync(global.folderScss, { recursive: true });
}

function compileazaScss(caleScss, caleCss) {
  if (!caleScss) {
    console.error("[COMPILARE SCSS] Calea fișierului SCSS este obligatorie!");
    return;
  }

  // 1. Rezolvare căi absolute / relative
  const absScss = path.isAbsolute(caleScss) ? caleScss : path.join(global.folderScss, caleScss);

  let absCss;
  if (!caleCss) {
    // Dacă numele/calea fișierului css lipsește, se va salva în folderCss rezultatul compilării folosind numele fișierului scss, dar cu extensia css
    const numeFisier = path.basename(absScss, path.extname(absScss)) + ".css";
    absCss = path.join(global.folderCss, numeFisier);
  } else {
    absCss = path.isAbsolute(caleCss) ? caleCss : path.join(global.folderCss, caleCss);
  }

  // 2. Copiere în backup înainte de compilare/suprascriere
  if (fs.existsSync(absCss) && !path.basename(absCss).startsWith("galerie_animata")) {
    const backupDir = path.join(__dirname, "backup", "resurse", "css");
    const extensie = path.extname(absCss);
    const numeBaza = path.basename(absCss, extensie);
    const timestamp = new Date().getTime(); // ex: 1681124489791
    const numeBackup = `${numeBaza}_${timestamp}${extensie}`;
    const destBackup = path.join(backupDir, numeBackup);

    try {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      fs.copyFileSync(absCss, destBackup);
      console.log(`[BACKUP] Am copiat backup pentru ${path.basename(absCss)} în ${destBackup}`);
    } catch (err) {
      console.error(`[BACKUP EROARE] Eșec la copierea fișierului ${absCss} în backup:`, err.message);
    }
  }

  // 3. Compilare propriu-zisă cu pachetul sass
  try {
    const result = sass.compile(absScss);

    // Ne asigurăm că există directorul destinației CSS
    const parentCssDir = path.dirname(absCss);
    if (!fs.existsSync(parentCssDir)) {
      fs.mkdirSync(parentCssDir, { recursive: true });
    }

    fs.writeFileSync(absCss, result.css, "utf-8");
    console.log(`[COMPILARE SCSS] Succes: ${absScss} -> ${absCss}`);
  } catch (err) {
    console.error(`[COMPILARE SCSS EROARE] Eșec la compilarea ${absScss}:`, err.message);
  }
}

// Compilare inițială a scss-urilor din folderScss
if (fs.existsSync(global.folderScss)) {
  const files = fs.readdirSync(global.folderScss);
  files.forEach(file => {
    if (path.extname(file) === ".scss") {
      compileazaScss(file);
    }
  });
}

// Urmărire modificări în timp real (compilare pe parcurs)
if (fs.existsSync(global.folderScss)) {
  fs.watch(global.folderScss, (eventType, filename) => {
    if (filename && path.extname(filename) === ".scss") {
      if (filename.startsWith("galerie_animata")) return;
      const fullPath = path.join(global.folderScss, filename);
      if (fs.existsSync(fullPath)) {
        console.log(`[WATCH] S-a modificat/creat ${filename}. Compilare...`);
        compileazaScss(filename);
      }
    }
  });
}



// ═══════════════════════════════════════════════════════════════════════
// BONUS 6 — detectare proprietati duplicate direct pe string-ul JSON
// ═══════════════════════════════════════════════════════════════════════
function verificaDuplicateProprietati(continut) {
  var probleme = [];
  var stiva = [];
  var inString = false;
  var escape = false;
  var buffer = "";
  var capturez = false;

  for (var i = 0; i < continut.length; i++) {
    var c = continut[i];

    if (escape) {
      if (capturez) buffer += c;
      escape = false;
      continue;
    }

    if (inString) {
      if (c === "\\") {
        escape = true;
        if (capturez) buffer += c;
      } else if (c === '"') {
        inString = false;
        if (capturez) {
          capturez = false;
          var j = i + 1;
          while (j < continut.length && " \n\r\t".indexOf(continut[j]) >= 0) j++;
          if (continut[j] === ":") {
            var top = stiva[stiva.length - 1];
            if (top) {
              if (top.chei[buffer]) {
                probleme.push('"' + buffer + '" in obiectul de la pozitia ' + top.pozitie);
              } else {
                top.chei[buffer] = true;
              }
            }
          }
        }
      } else {
        if (capturez) buffer += c;
      }
      continue;
    }

    if (c === '"') {
      inString = true;
      buffer = "";
      var topCurent = stiva.length > 0 ? stiva[stiva.length - 1] : null;
      capturez = (topCurent !== null && topCurent.esteObiect);
    } else if (c === "{") {
      stiva.push({ chei: {}, esteObiect: true, pozitie: i });
    } else if (c === "[") {
      stiva.push({ chei: {}, esteObiect: false, pozitie: i });
    } else if (c === "}" || c === "]") {
      stiva.pop();
    }
  }

  return probleme;
}

// ═══════════════════════════════════════════════════════════════════════
// BONUS 1–7 — verificare erori.json la pornire
// ═══════════════════════════════════════════════════════════════════════
function verificaErori() {
  var caleJson = path.join(__dirname, "erori.json");

  // bonus 1 — fisierul lipseste → oprire aplicatie
  if (!fs.existsSync(caleJson)) {
    console.error("[EROARE CRITICA] Fisierul erori.json nu exista la calea: " + caleJson + ". Aplicatia se inchide.");
    process.exit(1);
  }

  var continut = fs.readFileSync(caleJson, "utf-8");

  // bonus 6 — proprietati duplicate detectate pe string
  var duplicateProp = verificaDuplicateProprietati(continut);
  duplicateProp.forEach(function (msg) {
    console.error("[EROARE] Proprietate duplicata in erori.json: " + msg);
  });

  var ob;
  try {
    ob = JSON.parse(continut);
  } catch (e) {
    console.error("[EROARE] erori.json nu este JSON valid: " + e.message);
    return;
  }

  // bonus 2 — proprietati obligatorii la nivel de radacina
  ["cale_baza", "eroare_default", "info_erori"].forEach(function (prop) {
    if (!(prop in ob)) {
      console.error("[EROARE] Proprietatea '" + prop + "' lipseste din erori.json.");
    }
  });

  if (!ob.cale_baza || !ob.eroare_default || !ob.info_erori) return;

  // bonus 3 — proprietati obligatorii in eroare_default
  ["titlu", "text", "imagine"].forEach(function (prop) {
    if (!(prop in ob.eroare_default)) {
      console.error("[EROARE] Proprietatea '" + prop + "' lipseste din eroare_default in erori.json.");
    }
  });

  // bonus 4 — folderul cale_baza trebuie sa existe
  var caleFolder = path.join(__dirname, ob.cale_baza.replace(/^\//, ""));
  if (!fs.existsSync(caleFolder) || !fs.statSync(caleFolder).isDirectory()) {
    console.error("[EROARE] Folderul '" + ob.cale_baza + "' specificat in cale_baza nu exista: " + caleFolder);
  }

  // bonus 5 — imaginea eroare_default trebuie sa existe pe disc
  if (ob.eroare_default.imagine) {
    var caleImDefault = path.join(__dirname, ob.cale_baza.replace(/^\//, ""), ob.eroare_default.imagine);
    if (!fs.existsSync(caleImDefault)) {
      console.error("[EROARE] Imaginea pentru eroare_default nu exista: " + caleImDefault);
    }
  }

  // bonus 5 — fiecare eroare din info_erori trebuie sa aiba imaginea pe disc
  if (Array.isArray(ob.info_erori)) {
    ob.info_erori.forEach(function (eroare) {
      if (eroare.imagine) {
        var caleIm = path.join(__dirname, ob.cale_baza.replace(/^\//, ""), eroare.imagine);
        if (!fs.existsSync(caleIm)) {
          console.error("[EROARE] Imaginea pentru eroarea cu id " + eroare.identificator + " nu exista: " + caleIm);
        }
      }
    });
  }

  // bonus 7 — identificatori duplicati in info_erori
  if (Array.isArray(ob.info_erori)) {
    var vazuti = {};
    ob.info_erori.forEach(function (eroare) {
      var id = eroare.identificator;
      if (id === undefined) return;
      if (vazuti[id]) {
        var detaliiPrimaEroare = Object.keys(vazuti[id])
          .filter(function (k) { return k !== "identificator"; })
          .map(function (k) { return k + ": " + JSON.stringify(vazuti[id][k]); })
          .join(", ");
        var detaliiEroareCurenta = Object.keys(eroare)
          .filter(function (k) { return k !== "identificator"; })
          .map(function (k) { return k + ": " + JSON.stringify(eroare[k]); })
          .join(", ");
        console.error("[EROARE] Identificatorul " + id + " apare de mai multe ori in info_erori:");
        console.error("  - Prima aparitie:   { " + detaliiPrimaEroare + " }");
        console.error("  - Aparitie duplica: { " + detaliiEroareCurenta + " }");
      } else {
        vazuti[id] = eroare;
      }
    });
  }
}

verificaErori();

// ═══════════════════════════════════════════════════════════════════════
// INIT ERORI
// ═══════════════════════════════════════════════════════════════════════
function initErori() {
  var continut = fs.readFileSync(path.join(__dirname, "erori.json"), "utf-8");
  obGlobal.obErori = JSON.parse(continut);

  obGlobal.obErori.info_erori.forEach(function (eroare) {
    eroare.imagine = obGlobal.obErori.cale_baza + "/" + eroare.imagine;
  });

  if (obGlobal.obErori.eroare_default.imagine) {
    obGlobal.obErori.eroare_default.imagine =
      obGlobal.obErori.cale_baza + "/" + obGlobal.obErori.eroare_default.imagine;
  }
}

initErori();

// ═══════════════════════════════════════════════════════════════════════
// GALERIE STATICA
// ═══════════════════════════════════════════════════════════════════════

// Incarca galerie.json la pornirea serverului
function initGalerie() {
  var cale = path.join(__dirname, "galerie.json");
  if (!fs.existsSync(cale)) {
    console.error("[GALERIE] galerie.json nu exista!");
    return;
  }
  obGlobal.obGalerie = JSON.parse(fs.readFileSync(cale, "utf-8"));

  // ═════════════════ BONUS 5: Verificare JSON ═════════════════
  // 1. Verificăm dacă folderul cale_galerie există
  var folderGaleriePath = path.join(__dirname, obGlobal.obGalerie.cale_galerie.replace(/^\//, ""));

  if (!fs.existsSync(folderGaleriePath)) {
    console.error("[EROARE BONUS 5] Folderul specificat in cale_galerie NU există: " + folderGaleriePath);
  } else {
    // 2. Verificăm dacă fiecare imagine există în folder
    obGlobal.obGalerie.imagini.forEach(function (img) {
      var caleImagineCurenta = path.join(folderGaleriePath, img.cale_imagine);

      if (!fs.existsSync(caleImagineCurenta)) {
        console.error("[EROARE BONUS 5] Imaginea '" + img.cale_imagine + "' specificata in galerie.json NU există pe disc la calea: " + caleImagineCurenta);
      }
    });
  }
  // ════════════════════════════════════════════════════════════

  console.log("[GALERIE] incarcat: " + obGlobal.obGalerie.imagini.length + " imagini");
}

initGalerie();

// Filtreaza imaginile dupa ora curenta a serverului (max 10).
// Intervalele pot fi intre doua ore din aceeasi zi (ex. "09:00-15:00").
// Daca intervalul trece de miezul noptii (start > end), se trateaza ca wrap.
function filtreazaImaginiGalerie() {
  if (!obGlobal.obGalerie) return [];

  // Schimbati aceasta linie la o ora fixa pentru a testa filtrarea:
  //   var acum = new Date("2026-05-25T08:00:00");
  var acum = new Date();
  var oraMin = acum.getHours() * 60 + acum.getMinutes();

  return obGlobal.obGalerie.imagini.filter(function (img) {
    var parti = img.timp.split("-");
    var startP = parti[0].split(":").map(Number);
    var endP = parti[1].split(":").map(Number);
    var start = startP[0] * 60 + startP[1];
    var end = endP[0] * 60 + endP[1];

    if (start <= end) {
      // interval normal: ora curenta intre start si end
      return oraMin >= start && oraMin <= end;
    } else {
      // interval ce trece de miezul noptii (ex. "22:00-02:00")
      return oraMin >= start || oraMin <= end;
    }
  }).slice(0, 10); // trunchiem la maxim 10 imagini
}

// Genereaza imagini responsive cu sharp la prima cerere.
// Variante generate:
//   .../mediu/<numeImagine>  — 300px latime (ecran mediu)
//   .../mic/<numeImagine>    — 150px latime (ecran mic)
function genereazaImaginiResponsive(imagini, callback) {
  if (!obGlobal.obGalerie) return callback(null);

  var caleGalerie = path.join(__dirname, obGlobal.obGalerie.cale_galerie.replace(/^\//, ""));
  var caleMediu = path.join(caleGalerie, "mediu");
  var caleMic = path.join(caleGalerie, "mic");

  // Cream subdirectoarele daca nu exista
  [caleMediu, caleMic].forEach(function (d) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  // Generam variantele lipsa cu sharp si asteptam sa fie gata toate
  var promisiuni = imagini.map(function (img) {
    var src = path.join(caleGalerie, img.cale_imagine);
    if (!fs.existsSync(src)) return Promise.resolve();

    var med = path.join(caleMediu, img.cale_imagine);
    var mic = path.join(caleMic, img.cale_imagine);

    var p1 = fs.existsSync(med) ? Promise.resolve() :
      sharp(src).resize(300).toFile(med)
        .catch(function (e) { console.error("[GALERIE] Eroare mediu " + img.cale_imagine + ": " + e.message); });

    var p2 = fs.existsSync(mic) ? Promise.resolve() :
      sharp(src).resize(150).toFile(mic)
        .catch(function (e) { console.error("[GALERIE] Eroare mic " + img.cale_imagine + ": " + e.message); });

    return Promise.all([p1, p2]);
  });

  Promise.all(promisiuni).then(function () { callback(null); });
}

// Adauga proprietatile de cale web pe fiecare obiect imagine.
// Acestea sunt URL-uri absolute catre server, folosite in template-ul EJS
// in cadrul tag-ului <picture> cu <source> pentru fiecare dimensiune de ecran.
function adaugaCaiImagine(imagini) {
  var bazaWeb = obGlobal.obGalerie.cale_galerie; // ex: "/resurse/galerie"

  imagini.forEach(function (img) {
    img._cale_mare = bazaWeb + "/" + img.cale_imagine;         // original 450px
    img._cale_md = bazaWeb + "/mediu/" + img.cale_imagine;   // 300px
    img._cale_sm = bazaWeb + "/mic/" + img.cale_imagine;   // 150px
  });
}

// Helper central pentru rute cu galerie:
//   1. Filtreaza imaginile dupa ora curenta si trunchiaza la 10
//   2. Genereaza variantele responsive daca lipsesc (ImageMagick)
//   3. Adauga proprietatile de cale web pe fiecare obiect
//   4. Apeleaza callback cu datele gata pentru EJS
function cuDateGalerie(req, callback) {
  var imagini = filtreazaImaginiGalerie();
  genereazaImaginiResponsive(imagini, function () {
    adaugaCaiImagine(imagini);
    callback({
      imaginiGalerie: imagini,
      caleGalerie: obGlobal.obGalerie ? obGlobal.obGalerie.cale_galerie : ""
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════
// AFISARE EROARE
// ═══════════════════════════════════════════════════════════════════════
function afisareEroare(res, identificator, titlu, text, imagine) {
  var obEroare = null;

  if (identificator != null && identificator !== undefined) {
    obEroare = (obGlobal.obErori.info_erori || []).find(function (e) {
      return e.identificator == identificator;
    });
  }

  if (!obEroare) {
    obEroare = Object.assign({}, obGlobal.obErori.eroare_default);
    obEroare.status = false;
  } else {
    obEroare = Object.assign({}, obEroare);
  }

  if (titlu != null && titlu !== undefined) obEroare.titlu = titlu;
  if (text != null && text !== undefined) obEroare.text = text;
  if (imagine != null && imagine !== undefined) obEroare.imagine = imagine;

  if (obEroare.status && identificator) res.status(identificator);

  res.render("pagini/eroare", {
    titlu: obEroare.titlu,
    text: obEroare.text,
    imagine: obEroare.imagine
  });
}

// ═══════════════════════════════════════════════════════════════════════
// FOLDERE UTILITARE
// ═══════════════════════════════════════════════════════════════════════
var vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
vect_foldere.forEach(function (folder) {
  var cale = path.join(__dirname, folder);
  if (!fs.existsSync(cale)) {
    fs.mkdirSync(cale);
    console.log("creat:", cale);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════
app.use("/resurse", function (req, res, next) {
  if (!path.extname(req.path)) return afisareEroare(res, 403);
  next();
});

app.use("/resurse", express.static(path.join(__dirname, "resurse")));

app.use((req, res, next) => {
  // Rulăm logica doar când se încarcă paginile principale
  if (req.method === 'GET' && (req.path === '/' || req.path === '/index' || req.path === '/home')) {
    
    // Guard în caz că nu s-a inițializat galeria
    if (!obGlobal.obGalerie || !obGlobal.obGalerie.imagini) {
      return next();
    }

    // 1. Alegem un număr aleator între 7 și 11, dar diferit de 10
    const optiuniN = [7, 8, 9, 11];
    const N = optiuniN[Math.floor(Math.random() * optiuniN.length)];

    // 2. Extragem N imagini distincte amestecate din JSON
    let imaginiGalerie = [...obGlobal.obGalerie.imagini];
    imaginiGalerie.sort(() => 0.5 - Math.random()); // amestecăm elementele
    res.locals.imaginiGalerieAnimata = imaginiGalerie.slice(0, N);
    res.locals.caleGalerieAnimata = obGlobal.obGalerie.cale_galerie;

    // 3. Calculăm procentele pentru animația SASS
    let timpCadru = 3; // O imagine stă vizibilă 3 secunde
    let timpTranzitie = 1; // 1 secundă durează animația de ieșire
    let timpTotal = N * timpCadru;
    
    // Regula de 3 simplă pentru a afla procentele keyframes-urilor
    let procVizibil = (timpCadru / timpTotal) * 100;
    let procTurtire = procVizibil + ((timpTranzitie / 2) / timpTotal) * 100; // Jumătatea tranziției
    let procIesire = ((timpCadru + timpTranzitie) / timpTotal) * 100;

    // 4. Generăm string-ul SCSS dinamic
    let continutScss = `
$n: ${N};
$timp_total: ${timpTotal}s;

.galerie-animata-container {
  width: 450px;
  height: 350px;
  position: relative;
  overflow: hidden;
  margin: 2rem auto;
  border: 20px solid transparent;
  // Border-image cu o imagine deja existentă la tine în proiect
  border-image: url('../imagini/mapa.png') 30 stretch; 
  
  figure {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    margin: 0;
    transform-origin: bottom left; // Ca să se rotească din colț
    animation: animatieGalerie $timp_total linear infinite;
    animation-fill-mode: both;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    figcaption {
      position: absolute;
      bottom: 0;
      width: 100%;
      background: rgba(0,0,0,0.6);
      color: white;
      text-align: center;
      padding: 0.5rem;
    }
  }

  // Staggering dinamic (folosind clauza @for din SASS) pentru "N" imagini
  @for $i from 1 through $n {
    figure:nth-child(#{$i}) {
      animation-delay: #{($n - $i) * ${timpCadru}}s;
    }
  }
}

@keyframes animatieGalerie {
  0%, ${procVizibil}% {
    transform: scaleY(1) rotate(0deg) translate(0, 0);
    z-index: 10;
    opacity: 1;
  }
  ${procTurtire}% {
    // Cerință: Turtire pe verticală
    transform: scaleY(0.1) rotate(0deg) translate(0, 0);
    z-index: 10;
    opacity: 1;
  }
  ${procIesire}% {
    // Cerință: Rotirea imaginii pentru a ieși din "ecranul" galeriei
    transform: scaleY(0.1) rotate(45deg) translate(-200%, 200%);
    z-index: -10;
    opacity: 0;
  }
  ${procIesire + 0.001}%, 100% {
    // Întoarcerea pe ascuns în poziția inițială, la coadă
    transform: scaleY(1) rotate(0deg) translate(0, 0);
    z-index: -10;
    opacity: 0;
  }
}
`;
    // 5. Salvăm fișierul SCSS și îl compilăm pe loc
    const caleScssDinamic = path.join(global.folderScss, "galerie_animata.scss");
    fs.writeFileSync(caleScssDinamic, continutScss, "utf-8");
    
    // Ne folosim exact de funcția ta deja implementată!
    compileazaScss("galerie_animata.scss");
  }
  next();
});

app.get(/\.ejs$/i, function (req, res) {
  return afisareEroare(res, 400);
});

app.get("/favicon.ico", function (req, res) {
  res.sendFile(path.join(__dirname, "resurse", "ico", "favicon.ico"));
});

// ═══════════════════════════════════════════════════════════════════════
// RANDARE PAGINI
// ═══════════════════════════════════════════════════════════════════════
function randeazaPagina(res, numePagina, ip, extras) {
  var date = Object.assign({ ip: ip }, extras || {});
  res.render("pagini/" + numePagina, date, function (err, rezultatRandare) {
    if (err) {
      if (err.message && err.message.startsWith("Failed to lookup view"))
        afisareEroare(res, 404);
      else
        afisareEroare(res, null, null, err.message, null);
    } else {
      res.send(rezultatRandare);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════
// RUTE
// ═══════════════════════════════════════════════════════════════════════

// Pagina principala — include si galeria filtrata
app.get(["/", "/index", "/home"], function (req, res) {
  cuDateGalerie(req, function (extras) {
    randeazaPagina(res, "index", req.ip, extras);
  });
});

// Pagina dedicata galeriei
app.get("/galerie", function (req, res) {
  cuDateGalerie(req, function (extras) {
    randeazaPagina(res, "galerie", req.ip, extras);
  });
});

// Orice alta pagina (catch-all)
app.get("/*", function (req, res) {
  var pagina = req.path.replace(/^\//, "");
  randeazaPagina(res, pagina, req.ip);
});

// ═══════════════════════════════════════════════════════════════════════
// PORNIRE SERVER
// ═══════════════════════════════════════════════════════════════════════
// server port startup logger
app.listen(PORT, function () {
  console.log("server pornit: http://localhost:" + PORT);
});
