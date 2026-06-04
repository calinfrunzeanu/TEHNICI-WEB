"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const sass = require("sass");
const db = require("./db");

console.log("__dirname:", __dirname);
console.log("__filename:", __filename);
console.log("process.cwd():", process.cwd());

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));



var obGlobal = {
  obErori: null,
  obGalerie: null,
  categoriiProduse: null
};

const produseDemo = [
  { id: 1, nume: 'Hrana uscata premium pentru caini adulti', descriere: 'Formula completa pentru caini adulti.', imagine: '/resurse/imagini/produse/hrana_caini_5kg.jpg', categorie_mare: 'Caini', subcategorie: 'Adult', pret: 189, cantitate: 7500, data_adaugare: '2025-09-15', culoare: 'Maro', ingrediente: 'pui, orez, vitamine', livrare_posta: true, producator: 'PetHub Premium', tara_origine: 'Romania', promotie: 'Reducere 5%', garantie: '24 luni', recomandat: 'Caini adulti', specificatii: ['Proteine 26%', 'Fibre 4%', 'Omega 3 si 6'] },
  { id: 2, nume: 'Jucarie minge rezistenta pentru caini', descriere: 'Minge rezistenta pentru fetch.', imagine: '/resurse/imagini/produse/minge_caini.jpg', categorie_mare: 'Caini', subcategorie: 'Accesorii', pret: 35, cantitate: 200, data_adaugare: '2025-10-01', culoare: 'Portocaliu', ingrediente: 'cauciuc natural', livrare_posta: true, producator: 'TuffPlay', tara_origine: 'Germania', promotie: 'Livrare gratuita', garantie: '12 luni', recomandat: 'Caini activi', specificatii: ['Diametru 8 cm', 'Rezistenta la muscaturi'] },
  { id: 3, nume: 'Litiera automata pentru pisici', descriere: 'Litiera cu curatare automata.', imagine: '/resurse/imagini/produse/litiera_pisici.jpg', categorie_mare: 'Pisici', subcategorie: 'Igiena', pret: 62, cantitate: 10, data_adaugare: '2025-11-03', culoare: 'Alb', ingrediente: 'ABS, carbon', livrare_posta: true, producator: 'CleanPet', tara_origine: 'Olanda', promotie: 'Kit de curatare', garantie: '18 luni', recomandat: 'Pisici de apartament', specificatii: ['Senzor de prezenta', 'Curatare automata'] },
  { id: 4, nume: 'Acvariu starter kit 80L', descriere: 'Acvariu complet pentru pesti tropicali.', imagine: '/resurse/imagini/produse/acvariu_80l.jpg', categorie_mare: 'Pesti', subcategorie: 'Habitat', pret: 245, cantitate: 80000, data_adaugare: '2025-10-12', culoare: 'Transparent', ingrediente: 'sticla, filtru, incalzitor', livrare_posta: false, producator: 'AquaLife', tara_origine: 'Belgia', promotie: 'Pachet complet', garantie: '24 luni', recomandat: 'Pesti tropicali', specificatii: ['Filtru extern 200L/h', 'Incalzitor 100W'] },
  { id: 5, nume: 'Cusca rozatoare deluxe', descriere: 'Cusca spatioasa pentru rozatoare.', imagine: '/resurse/imagini/produse/cusca_rozatoare.jpg', categorie_mare: 'Rozatoare', subcategorie: 'Habitat', pret: 138, cantitate: 2800, data_adaugare: '2025-11-17', culoare: 'Gri', ingrediente: 'metal, plastic', livrare_posta: true, producator: 'SmallPet', tara_origine: 'Polonia', promotie: 'Set de accesorii', garantie: '12 luni', recomandat: 'Rozatoare mici', specificatii: ['Tava detasabila', 'Ventilatie buna'] }
];

global.folderScss = path.join(__dirname, "resurse", "scss");
global.folderCss = path.join(__dirname, "resurse", "css");

if (!fs.existsSync(global.folderScss)) {
  fs.mkdirSync(global.folderScss, { recursive: true });
}

//5. 1. b
function compileazaScss(caleScss, caleCss) {
  if (!caleScss) {
    console.error("[COMPILARE SCSS] Calea fisierului SCSS este obligatorie!");
    return;
  }

  // 1. verific si rezolv calea relativ/abs
  const absScss = path.isAbsolute(caleScss) ? caleScss : path.join(global.folderScss, caleScss);

  let absCss;
  if (!caleCss) {
    // bonus 5.4Daca numele/calea fisierului css lipseste, se va salva in folderCss rezultatul compilarii folosind numele fisierului scss, dar cu extensia css
    const numeFisier = path.basename(absScss, path.extname(absScss)) + ".css";
    absCss = path.join(global.folderCss, numeFisier);
  } else {
    absCss = path.isAbsolute(caleCss) ? caleCss : path.join(global.folderCss, caleCss);
  }

  // 5.1.c backup css
  if (fs.existsSync(absCss) && !path.basename(absCss).startsWith("galerie_animata")) {
    const backupDir = path.join(__dirname, "backup", "resurse", "css");
    const extensie = path.extname(absCss);
    const numeBaza = path.basename(absCss, extensie);
    const timestamp = new Date().getTime();
    const numeBackup = `${numeBaza}_${timestamp}${extensie}`;
    const destBackup = path.join(backupDir, numeBackup);

    try {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      fs.copyFileSync(absCss, destBackup);
      console.log(`[BACKUP] Am copiat backup pentru ${path.basename(absCss)} in ${destBackup}`);
    } catch (err) {
      console.error(`[BACKUP EROARE] Esec la copierea fisierului ${absCss} in backup:`, err.message);
    }
  }

  // 3. Compilare propriu-zisa cu pachetul sass
  try {
    const result = sass.compile(absScss, {
      silenceDeprecations: ["import", "global-builtin", "color-functions", "if-function", "mixed-decls"]
    });

    // Ne asiguram ca exista directorul destinatiei CSS
    const parentCssDir = path.dirname(absCss);
    if (!fs.existsSync(parentCssDir)) {
      fs.mkdirSync(parentCssDir, { recursive: true });
    }

    fs.writeFileSync(absCss, result.css, "utf-8");
    console.log(`[COMPILARE SCSS] Succes: ${absScss} -> ${absCss}`);
  } catch (err) {
    console.error(`[COMPILARE SCSS EROARE] Esec la compilarea ${absScss}:`, err.message);
  }
}

// 5.1.d Compilare initiala a scss-urilor din folderScss
if (fs.existsSync(global.folderScss)) {
  const files = fs.readdirSync(global.folderScss);
  files.forEach(file => {
    if (path.extname(file) === ".scss") {
      compileazaScss(file);
    }
  });
}

// compilare automata la modificari
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



// bonus 6: detectare proprietati duplicate pe string json
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

// bonus 1-7: verificare erori.json la pornire
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

// init erori
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

// galerie statica

// Incarca galerie.json la pornirea serverului
function initGalerie() {
  var cale = path.join(__dirname, "galerie.json");
  if (!fs.existsSync(cale)) {
    console.error("[GALERIE] galerie.json nu exista!");
    return;
  }
  obGlobal.obGalerie = JSON.parse(fs.readFileSync(cale, "utf-8"));

  var folderGaleriePath = path.join(__dirname, obGlobal.obGalerie.cale_galerie.replace(/^\//, ""));

  if (!fs.existsSync(folderGaleriePath)) {
    console.error("eroare galerie: folderul nu exista " + folderGaleriePath);
  } else {
    obGlobal.obGalerie.imagini.forEach(function (img) {
      var caleImagineCurenta = path.join(folderGaleriePath, img.cale_imagine);

      if (!fs.existsSync(caleImagineCurenta)) {
        console.error("eroare imagine: fisierul nu exista " + caleImagineCurenta);
      }
    });
  }

  console.log("[GALERIE] incarcat: " + obGlobal.obGalerie.imagini.length + " imagini");
}

initGalerie();

function filtreazaImaginiGalerie() {
  if (!obGlobal.obGalerie) return [];

  /*
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
  }).slice(0, 10);
  */

  return obGlobal.obGalerie.imagini.slice(0, 10);
}

// Genereaza imagini responsive cu sharp la prima cerere.

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

// afisare eroare
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

// foldere utilitare
var vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
vect_foldere.forEach(function (folder) {
  var cale = path.join(__dirname, folder);
  if (!fs.existsSync(cale)) {
    fs.mkdirSync(cale);
    console.log("creat:", cale);
  }
});

// middleware
app.use("/resurse", function (req, res, next) {
  if (!path.extname(req.path)) return afisareEroare(res, 403);
  next();
});

app.use("/resurse", express.static(path.join(__dirname, "resurse")));

async function getCategoriiProduse() {
  if (obGlobal.categoriiProduse && obGlobal.categoriiProduse.length) {
    return obGlobal.categoriiProduse;
  }

  try {
    const [rows] = await db.query("SHOW COLUMNS FROM produse LIKE 'categorie_mare'");
    const tip = rows && rows[0] && rows[0].Type ? rows[0].Type : "";
    const valori = tip.match(/enum\((.*)\)/i);
    if (!valori || !valori[1]) {
      obGlobal.categoriiProduse = [];
      return obGlobal.categoriiProduse;
    }

    obGlobal.categoriiProduse = valori[1]
      .split(",")
      .map(item => item.trim().replace(/^'|'$/g, ""))
      .filter(Boolean);

    return obGlobal.categoriiProduse;
  } catch (err) {
    console.error("Eroare la citirea categoriilor produselor:", err.message);
  }

  obGlobal.categoriiProduse = [...new Set(produseDemo.map(item => item.categorie_mare))];
  return obGlobal.categoriiProduse;
}

app.use(async function (req, res, next) {
  try {
    res.locals.categoriiProduse = await getCategoriiProduse();
  } catch (err) {
    res.locals.categoriiProduse = [];
  }
  next();
});

app.use((req, res, next) => {
  if (req.method === 'GET' && (req.path === '/' || req.path === '/index' || req.path === '/home')) {
    
    if (!obGlobal.obGalerie || !obGlobal.obGalerie.imagini) {
      return next();
    }

    const optiuniN = [7, 8, 9, 11];
    const N = optiuniN[Math.floor(Math.random() * optiuniN.length)];

    let imaginiGalerie = [...obGlobal.obGalerie.imagini];
    imaginiGalerie.sort(() => 0.5 - Math.random());
    res.locals.imaginiGalerieAnimata = imaginiGalerie.slice(0, N);
    res.locals.caleGalerieAnimata = obGlobal.obGalerie.cale_galerie;

    let timpCadru = 3;
    let timpTranzitie = 1;
    let timpTotal = N * timpCadru;
    
    let procVizibil = (timpCadru / timpTotal) * 100;
    let procTurtire = procVizibil + ((timpTranzitie / 2) / timpTotal) * 100;
    let procIesire = ((timpCadru + timpTranzitie) / timpTotal) * 100;

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
  border-image: url('../imagini/mapa.png') 30 stretch; 
  
  figure {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    margin: 0;
    transform-origin: center left;
    transition: clip-path 0.3s ease;
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

  @for $i from 1 through $n {
    figure:nth-child(#{$i}) {
      animation-delay: #{($n - $i) * ${timpCadru}}s;
    }
  }
}

@keyframes animatieGalerie {
  0%, ${procVizibil}% {
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
    transform: rotate(0deg) translate(0, 0);
    opacity: 1;
  }
  ${procTurtire}% {
    clip-path: polygon(0% 40%, 100% 40%, 100% 60%, 0% 60%);
    transform: rotate(0deg) translate(0, 0);
    opacity: 1;
  }
  ${procIesire}% {
    clip-path: polygon(0% 40%, 100% 40%, 100% 60%, 0% 60%);
    transform: rotate(90deg) translate(0, 0);
    opacity: 1;
  }
  ${procIesire + 0.001}%, 100% {
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
    transform: rotate(0deg) translate(0, 0);
    opacity: 0;
  }
}
`;
    const caleScssDinamic = path.join(global.folderScss, "galerie_animata.scss");
    fs.writeFileSync(caleScssDinamic, continutScss, "utf-8");
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

// randare pagini
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

// rute

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

app.get("/produse", async function (req, res) {
  var categorie = typeof req.query.categorie === "string" ? req.query.categorie.trim() : "";

  try {
    const query = categorie
      ? "SELECT * FROM produse WHERE categorie_mare = ? ORDER BY id"
      : "SELECT * FROM produse ORDER BY id";

    const params = categorie ? [categorie] : [];
    var [rows] = await db.query(query, params);

    // extragem valorile unice pt filtre
    var [allRows] = await db.query("SELECT DISTINCT culoare FROM produse ORDER BY culoare");
    var culoriUnice = allRows.map(r => r.culoare);
    var [prodRows] = await db.query("SELECT DISTINCT producator FROM produse ORDER BY producator");
    var producatoriUnici = prodRows.map(r => r.producator);

    // pretul maxim si minim
    var [pretAgregat] = await db.query("SELECT MIN(pret) as minP, MAX(pret) as maxP FROM produse");
    var minPret = pretAgregat[0] && pretAgregat[0].minP != null ? Number(pretAgregat[0].minP) : 0;
    var maxPret = pretAgregat[0] && pretAgregat[0].maxP != null ? Number(pretAgregat[0].maxP) : 1000;

    // lungime nume pt input text
    var [numeAgregat] = await db.query("SELECT MIN(LENGTH(nume)) as minL, MAX(LENGTH(nume)) as maxL FROM produse");
    var minNumeLen = numeAgregat[0] && numeAgregat[0].minL != null ? Number(numeAgregat[0].minL) : 3;
    var maxNumeLen = numeAgregat[0] && numeAgregat[0].maxL != null ? Number(numeAgregat[0].maxL) : 100;

    // lungime descriere pt textarea
    var [descAgregat] = await db.query("SELECT MIN(LENGTH(descriere)) as minD, MAX(LENGTH(descriere)) as maxD FROM produse");
    var minDescLen = descAgregat[0] && descAgregat[0].minD != null ? Number(descAgregat[0].minD) : 3;
    var maxDescLen = descAgregat[0] && descAgregat[0].maxD != null ? Number(descAgregat[0].maxD) : 500;

    // cate produse au livrare_posta
    var [livrareRows] = await db.query("SELECT COUNT(*) as cnt FROM produse WHERE livrare_posta = 1");
    var countLivrare = livrareRows[0] ? Number(livrareRows[0].cnt) : 0;

    // luni unice adaugare
    var [luniRows] = await db.query("SELECT DISTINCT MONTH(data_adaugare) as lunaNum FROM produse WHERE data_adaugare IS NOT NULL ORDER BY lunaNum");
    var luniUnice = luniRows.map(r => r.lunaNum - 1); // JS months are 0-indexed

    randeazaPagina(res, "produse", req.ip, {
      produse: rows,
      categorieFiltrata: categorie || null,
      culoriUnice: culoriUnice,
      producatoriUnici: producatoriUnici,
      minPret: minPret,
      maxPret: maxPret,
      minNumeLen: minNumeLen,
      maxNumeLen: maxNumeLen,
      minDescLen: minDescLen,
      maxDescLen: maxDescLen,
      countLivrare: countLivrare,
      luniUnice: luniUnice
    });
  } catch (err) {
    console.error("Eroare interogare produse:", err.message);
    const produse = categorie
      ? produseDemo.filter(item => item.categorie_mare === categorie)
      : produseDemo;

    var culoriUnice = [...new Set(produseDemo.map(p => p.culoare))].sort();
    var producatoriUnici = [...new Set(produseDemo.map(p => p.producator))].sort();
    var minPret = Math.min(...produseDemo.map(p => p.pret));
    var maxPret = Math.max(...produseDemo.map(p => p.pret));
    var minNumeLen = Math.min(...produseDemo.map(p => p.nume.length));
    var maxNumeLen = Math.max(...produseDemo.map(p => p.nume.length));
    var minDescLen = Math.min(...produseDemo.map(p => p.descriere.length));
    var maxDescLen = Math.max(...produseDemo.map(p => p.descriere.length));
    var countLivrare = produseDemo.filter(p => p.livrare_posta).length;
    var luniUnice = [...new Set(produseDemo.map(p => new Date(p.data_adaugare).getMonth()))].sort((a,b)=>a-b);

    randeazaPagina(res, "produse", req.ip, {
      produse,
      categorieFiltrata: categorie || null,
      culoriUnice: culoriUnice,
      producatoriUnici: producatoriUnici,
      minPret: minPret,
      maxPret: maxPret,
      minNumeLen: minNumeLen,
      maxNumeLen: maxNumeLen,
      minDescLen: minDescLen,
      maxDescLen: maxDescLen,
      countLivrare: countLivrare,
      luniUnice: luniUnice
    });
  }
});

app.post("/produse-ajax", express.json(), async function (req, res) {
  try {
    let query = "SELECT * FROM produse WHERE 1=1";
    let params = [];

    // Nume
    if (req.body.nume) {
      query += " AND LOWER(nume) LIKE ?";
      params.push('%' + req.body.nume.toLowerCase() + '%');
    }

    // Pret maxim
    if (req.body.pretMax) {
      query += " AND pret <= ?";
      params.push(req.body.pretMax);
    }

    // Producator
    if (req.body.producator) {
      query += " AND LOWER(producator) LIKE ?";
      params.push('%' + req.body.producator.toLowerCase() + '%');
    }

    // Culoare
    if (req.body.culoare && req.body.culoare !== 'toate') {
      query += " AND culoare = ?";
      params.push(req.body.culoare);
    }

    // Categorie
    if (req.body.categorie) {
      query += " AND categorie_mare = ?";
      params.push(req.body.categorie);
    }

    // Luni
    if (req.body.luni && req.body.luni.length > 0) {
      let months = req.body.luni.map(m => parseInt(m, 10) + 1);
      query += " AND MONTH(data_adaugare) IN (" + months.map(() => "?").join(",") + ")";
      params.push(...months);
    }

    // Livrare prin posta (discount toggle in UI)
    if (req.body.discount) {
      query += " AND livrare_posta = 1";
    }

    // Descriere (cuvinte cheie multiple)
    if (req.body.descriere) {
      let words = req.body.descriere.split(/[,\s]+/).filter(Boolean);
      words.forEach(w => {
        query += " AND LOWER(descriere) LIKE ?";
        params.push('%' + w.toLowerCase() + '%');
      });
    }

    // Sortare
    let sortOrd = req.body.ordine === 'desc' ? 'DESC' : 'ASC';
    
    // Mapare chei frontend -> SQL
    const mapKeys = {
      'pret': 'pret',
      'nume': 'nume',
      'luna': 'MONTH(data_adaugare)',
      'nr-ingrediente': '(LENGTH(ingrediente) - LENGTH(REPLACE(ingrediente, ",", "")) + 1)'
    };
    
    let k1 = mapKeys[req.body.cheie1] || 'pret';
    let k2 = mapKeys[req.body.cheie2] || 'nume';
    
    query += ` ORDER BY ${k1} ${sortOrd}, ${k2} ${sortOrd}`;

    const [rows] = await db.query(query, params);
    
    let html = "";
    for (let i = 0; i < rows.length; i++) {
      html += await new Promise((resolve, reject) => {
        res.app.render("fragmente/produs_card", { produs: rows[i] }, (err, str) => {
          if (err) reject(err); else resolve(str);
        });
      });
    }

    res.json({ html: html, count: rows.length });
  } catch (err) {
    console.error("Eroare AJAX produse:", err.message);
    res.status(500).json({ error: "Eroare la procesarea cererii server-side" });
  }
});

app.get("/produse/:id", async function (req, res) {
  var id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return afisareEroare(res, 404);
  }

  try {
    var [rows] = await db.query(
      "SELECT id, nume, descriere, imagine, categorie_mare, subcategorie, pret, cantitate, data_adaugare, culoare, ingrediente, livrare_posta, producator, tara_origine, promotie, garantie, recomandat, specificatii FROM produse WHERE id = ?",
      [id]
    );

    if (!rows || rows.length === 0) {
      throw new Error("Produsul nu exista.");
    }

    var produs = rows[0];
    if (produs.specificatii && typeof produs.specificatii === "string") {
      produs.specificatii = produs.specificatii.split(/\s*,\s*/).filter(Boolean);
    }

    // Bonus 9: Imagini carusel deduse din folder
    var imagini_carusel = [produs.imagine];
    var extensie = path.extname(produs.imagine);
    var baza = path.basename(produs.imagine, extensie);
    var folderAbsolut = path.join(__dirname, path.dirname(produs.imagine).replace(/^\//, ""));
    var folderWeb = path.dirname(produs.imagine);

    for (var i = 1; i <= 5; i++) {
      var imgNouaBaza = baza + "_" + i + extensie;
      var imgNouaAbsolut = path.join(folderAbsolut, imgNouaBaza);
      if (fs.existsSync(imgNouaAbsolut)) {
        imagini_carusel.push(folderWeb + "/" + imgNouaBaza);
      }
    }
    produs.imagini_carusel = imagini_carusel;

    randeazaPagina(res, "produs", req.ip, { produs });
  } catch (err) {
    console.error("Eroare interogare produs:", err.message);
    var produs = produseDemo.find(item => item.id === id);
    if (!produs) {
      return afisareEroare(res, 404);
    }

    // Bonus 9 in fallback (caz BD picata)
    var imagini_carusel = [produs.imagine];
    var extensie = path.extname(produs.imagine);
    var baza = path.basename(produs.imagine, extensie);
    var folderAbsolut = path.join(__dirname, path.dirname(produs.imagine).replace(/^\//, ""));
    var folderWeb = path.dirname(produs.imagine);

    for (var i = 1; i <= 5; i++) {
      var imgNouaBaza = baza + "_" + i + extensie;
      var imgNouaAbsolut = path.join(folderAbsolut, imgNouaBaza);
      if (fs.existsSync(imgNouaAbsolut)) {
        imagini_carusel.push(folderWeb + "/" + imgNouaBaza);
      }
    }
    produs.imagini_carusel = imagini_carusel;

    randeazaPagina(res, "produs", req.ip, { produs });
  }
});

// Orice alta pagina (catch-all)
app.get("/*", function (req, res) {
  var pagina = req.path.replace(/^\//, "");
  randeazaPagina(res, pagina, req.ip);
});

// pornire server
// server port startup logger
app.listen(PORT, function () {
  console.log("server pornit: http://localhost:" + PORT);
});
