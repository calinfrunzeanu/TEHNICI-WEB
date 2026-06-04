# Documentație: Implementare Bonusuri (1-11)

Acest document descrie logica de implementare, componentele de cod și rutele folosite pentru a rezolva cerințele bonus din proiectul PetHub (Tehnici Web).

---

## Bonus 1 (0.8p) - Generarea dinamică a atributelor de input din baza de date
**Cerință:** Generarea atributelor și etichetelor pentru inputuri (min, max, etc.) pe baza datelor din baza de date.

**Logică de implementare:**
Pentru a evita setarea hardcodată a limitelor în HTML, pe partea de server se execută interogări de tip agregare (`MIN`, `MAX`, `COUNT`) la momentul randării paginii `/produse`. Aceste limite sunt pasate către motorul de templating EJS pentru a stabili regulile formularelor (ex. prețul maxim glisant).

**Cod și fișiere:**
- **Fișier Backend:** `/index.js`
- **Linii (aprox. 665-685):** Ruta `app.get("/produse")`
```javascript
// Extragem valorile unice pt filtre
var [allRows] = await db.query("SELECT DISTINCT culoare FROM produse ORDER BY culoare");
var culoriUnice = allRows.map(r => r.culoare);

// Pretul maxim si minim agregat
var [pretAgregat] = await db.query("SELECT MIN(pret) as minP, MAX(pret) as maxP FROM produse");
var minPret = Number(pretAgregat[0].minP);
var maxPret = Number(pretAgregat[0].maxP);

// Lungime siruri de caractere
var [numeAgregat] = await db.query("SELECT MIN(LENGTH(nume)) as minL, MAX(LENGTH(nume)) as maxL FROM produse");
```
- **Fișier Frontend:** `/views/pagini/produse.ejs`
- **Linii (aprox. 31-41):** Injectarea prin EJS în atributele HTML
```html
<label for="filtru-nume">Cauta dupa nume (min. <%= minNumeLen %> caractere):</label>
<input type="text" id="filtru-nume" minlength="<%= minNumeLen %>" maxlength="<%= maxNumeLen %>">

<!-- Input Range Pret -->
<input type="range" id="filtru-pret" min="<%= minPret %>" max="<%= maxPret %>" value="<%= maxPret %>">
```

---

## Bonus 2 (0.15p) - 3 Teme pentru Utilizator
**Cerință:** Utilizatorul să poată alege dintre 3 teme (Light, Dark, Ocean). Tema să se memoreze în `localStorage`.

**Logică de implementare:**
S-a înlocuit butonul vechi de dark mode cu un meniu drop-down (`<select>`). Variabilele CSS pentru culori au fost mapate în clase pe tag-ul `<body>`. Când se schimbă tema, valoarea se salvează în browser, persistând la refresh.

**Cod și fișiere:**
- **Fișier Frontend EJS:** `/views/fragmente/header.ejs` (Linii 50-54)
```html
<select id="themeSelect" class="form-select form-select-sm" style="width: auto;">
  <option value="light">Tema Luminoasa (Light)</option>
  <option value="dark">Tema Intunecata (Dark)</option>
  <option value="ocean">Tema Ocean (Albastru)</option>
</select>
```
- **Fișier JavaScript:** `/resurse/js/tema.js`
```javascript
var themeSelect = document.getElementById("themeSelect");
var savedTheme = localStorage.getItem("tema") || "light";

// Setare la incarcare
document.body.className = savedTheme + "-theme";
if(themeSelect) themeSelect.value = savedTheme;

// Eveniment schimbare
themeSelect.addEventListener("change", function() {
  document.body.className = this.value + "-theme";
  localStorage.setItem("tema", this.value);
});
```

---

## Bonus 3 (0.05p) - Mesaj lipsă produse după filtrare
**Cerință:** Afișarea unui mesaj tip "nu există produse" dacă nicio casetă nu mai este vizibilă după aplicarea filtrelor client-side.

**Logică de implementare:**
În JavaScript, la rularea funcției de filtrare, numărăm câte produse trec testul și primesc `vizibil = true`. Dacă contorul e 0, afișăm un element div ascuns implicit.

**Cod și fișiere:**
- **Fișier Frontend:** `/views/pagini/produse.ejs`
```html
<div id="mesaj-lipsa-produse" style="display: none;">
  <p>Nu exista produse conform filtrarii curente.</p>
</div>
```
- **Fișier JavaScript:** `/resurse/js/produse.js` (Funcția `filtreazaProduse`)
```javascript
var vizibile = 0;
// ... loop verificare vizibilitate per produs ...
if (vizibil) {
  art.classList.remove("ascuns-filtru");
  vizibile++;
}

var msgLipsa = document.getElementById("mesaj-lipsa-produse");
if (msgLipsa) {
  msgLipsa.style.display = (vizibile === 0) ? "block" : "none";
}
```

---

## Bonus 4 (0.4p) - Filtrare automată OnChange
**Cerință:** Efectul de filtrare să aibă loc imediat la schimbarea valorii inputului (`onchange`), nu doar la click pe butonul de filtrare.

**Logică de implementare:**
Se face un array de referințe DOM ale elementelor de filtrare, apoi se atașează dinamic evenimentul `change` pe fiecare.

**Cod și fișiere:**
- **Fișier JavaScript:** `/resurse/js/produse.js` (Liniile ~450-463)
```javascript
var elementeFiltrare = [ inputNume, inputPret, inputProducator, selectLuna, checkDiscount, selectCategorie, textareaDescriere ];

elementeFiltrare.forEach(function(el) {
  if (el) el.addEventListener("change", filtreazaProduse);
});

// Pentru inputurile radio de la culoare:
var radioCulori = document.querySelectorAll('input[name="filtru-culoare"]');
radioCulori.forEach(radio => radio.addEventListener("change", filtreazaProduse));
```

---

## Bonus 5 (0.5p) - Paginare Client-Side
**Cerință:** Generarea unui număr `N/K` de link-uri (K=4). Doar K produse să fie vizibile deodată.

**Logică de implementare:**
S-a creat funcția `aplicaPaginare(resetPage)`. Funcția ia toate produsele care **nu** au clasa `.ascuns-filtru` (deci valide după filtrare). Ascunde tot, apoi setează `display: ""` doar pentru produsele al căror index respectă `(currentPage - 1) * K` și `currentPage * K - 1`. Apoi populează `<ul class="pagination">`.

**Cod și fișiere:**
- **Fișier JavaScript:** `/resurse/js/produse.js` (Funcția `aplicaPaginare`, aprox linia 200)
```javascript
function aplicaPaginare(resetPage) {
  if (resetPage) currentPage = 1;
  var articoleFiltrate = Array.from(zonaProduse.querySelectorAll("article.produs-card:not(.ascuns-filtru)"));
  var N = articoleFiltrate.length;
  var NRL = Math.ceil(N / K);

  var start = (currentPage - 1) * K;
  var end = currentPage * K - 1;

  for (var i = 0; i < N; i++) {
    articoleFiltrate[i].style.display = (i >= start && i <= end) ? "" : "none";
  }
  // Generare DOM Butoane 1..NRL
}
```

---

## Bonus 6 (0.5p) - Butoane de Acțiuni pe Produs (Pin, Hide, Delete Session)
**Cerință:** Butoane cu iconițe care să: 1) Păstreze produsul forțat (Pin). 2) Să-l șteargă temporar (revine la reset). 3) Să-l șteargă pentru sesiunea tab-ului curent.

**Logică de implementare:**
În fișierul JS se creează un "ascultător" (event listener) pentru fiecare card. 
- *Pin* adaugă o clasă specială (`.produs-pinned`) forțată în filtrul principal să fie mereu `vizibil = true`. 
- *Hide* adaugă clasa `.ascuns-filtru` direct și face trigger la repaginare.
- *Delete Session* salvează ID-ul produsului într-un array local stocat cu `sessionStorage.setItem()`.

**Cod și fișiere:**
- **Fișier JavaScript:** `/resurse/js/produse.js` (Funcția `ataseazaEventuriActiuni`)
```javascript
btnPin.addEventListener("click", function(e) {
  e.stopPropagation(); // Prevenim declansarea altor logici (ex: Bonus 11)
  art.classList.toggle("produs-pinned");
});

btnHideSession.addEventListener("click", function(e) {
  e.stopPropagation();
  art.classList.add("sters-sesiune"); // Se respecta mereu in filtreazaProduse()
  var sterse = JSON.parse(sessionStorage.getItem("produseSterse") || "[]");
  sterse.push(art.id);
  sessionStorage.setItem("produseSterse", JSON.stringify(sterse));
  aplicaPaginare(true);
});
```

---

## Bonus 7 (0.15p) - Filtrare Fără Diacritice
**Cerință:** Comparația textelor din input și textarea să ignore diacriticele (ex. "ș" == "s").

**Logică de implementare:**
Am implementat o funcție regex ajutătoare care normalizează Unicode-ul textului (`NFD` separă litera de accent), iar apoi taie blocul de caractere reprezentând accentele `[\u0300-\u036f]`. Atât textul tastat cât și textul din pagină trec prin această funcție înainte de a fi comparate (cu `indexOf`).

**Cod și fișiere:**
- **Fișier JavaScript:** `/resurse/js/produse.js` (Linia ~83)
```javascript
function eliminaDiacritice(text) {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// In filtreazaProduse():
var numeText = eliminaDiacritice(art.querySelector(".produs-heading").textContent.toLowerCase());
if (numeText.indexOf(valNume) === -1) vizibil = false;
```

---

## Bonus 8 (0.35p) - Chei Multi-Sortare Dinamice
**Cerință:** Utilizatorul să poată alege independent cheia primară și cheia secundară de sortare din 2 select-uri.

**Logică de implementare:**
Se citesc dinamic valorile din `select#sortare-cheie-1` și `select#sortare-cheie-2`. Metoda `.sort()` compară valorile pentru prima cheie; dacă sunt egale (cmp1 == 0), se rezolvă remiza testând a doua cheie, aplicând mereu direcția (asc/desc).

**Cod și fișiere:**
- **Fișier JavaScript:** `/resurse/js/produse.js` (Funcția `sorteazaProduse`, Linii ~260-280)
```javascript
var cheie1 = document.getElementById("sortare-cheie-1").value;
var cheie2 = document.getElementById("sortare-cheie-2").value;

articole.sort(function (a, b) {
  var valA1 = extrageValoare(a, cheie1);
  var valB1 = extrageValoare(b, cheie1);
  var cmp1 = (valA1 > valB1) ? 1 : ((valA1 < valB1) ? -1 : 0);

  if (cmp1 !== 0) return ordine === "asc" ? cmp1 : -cmp1;

  var valA2 = extrageValoare(a, cheie2);
  var valB2 = extrageValoare(b, cheie2);
  var cmp2 = (valA2 > valB2) ? 1 : ((valA2 < valB2) ? -1 : 0);
  
  return ordine === "asc" ? cmp2 : -cmp2;
});
```

---

## Bonus 9 (0.5p) - Imagini multiple (Carusel)
**Cerință:** Generarea și afișarea mai multor imagini per produs sub forma unui Carusel, deduse automat de server pe baza numelui principal al pozei.

**Logică de implementare:**
S-a creat un utilitar Backend care citește calea `produs.imagine` din DB (ex. `minge_caini.jpg`) și verifică pe disc (`fs.existsSync`) existența variantelor `_1.jpg`, `_2.jpg`, adăugându-le într-un array `imagini_carusel`. Pe frontend, EJS iterează array-ul și generează itemii din `<div class="carousel slide">`.

**Cod și fișiere:**
- **Fișier Backend:** `/index.js` (Ruta `app.get("/produse/:id")`)
```javascript
var imagini_carusel = [produs.imagine];
var baza = path.basename(produs.imagine, extensie);

for (var i = 1; i <= 5; i++) {
  var imgNouaAbsolut = path.join(folderAbsolut, baza + "_" + i + extensie);
  if (fs.existsSync(imgNouaAbsolut)) {
    imagini_carusel.push(folderWeb + "/" + baza + "_" + i + extensie);
  }
}
produs.imagini_carusel = imagini_carusel;
```
- **Fișier Frontend (EJS):** `/views/pagini/produs.ejs` (Aproximativ linia 20)
```html
<div class="carousel-inner">
  <% produs.imagini_carusel.forEach(function(imgUrl, idx) { %>
    <div class="carousel-item <%= idx === 0 ? 'active' : '' %>">
      <img src="<%= imgUrl %>" class="d-block w-100">
    </div>
  <% }); %>
</div>
```

---

## Bonus 10a & 10b (0.6p) - Filtrare Server-Side + Fetch AJAX
**Cerință:** Posibilitatea de a trimite parametrii filtrelor către un endpoint backend folosind `fetch()`, iar backend-ul să aplice filtrele SQL și să returneze noile produse ca elemente DOM (fără refresh-ul paginii), cu o tranziție curată.

**Logică de implementare:**
În UI a fost adăugat un `Switch Toggle`. Dacă e bifat, `produse.js` interceptează metodele locale și cheamă `filtreazaServerSide()`. Această funcție trimite un POST JSON la `/produse-ajax`. Backend-ul formează clauze parametrizate `WHERE` dinamice pe baza payload-ului. Backend-ul randează "partiale" EJS pe baza rândurilor întoarse și le livrează ca bloc HTML către client, care doar înlocuiește `<section id="zona-produse">` și reaplică JavaScript-ul pentru paginare și event listenerii bonusului 6.

**Cod și fișiere:**
- **Fișier Backend API:** `/index.js` (`app.post("/produse-ajax")`)
```javascript
let query = "SELECT * FROM produse WHERE 1=1";
let params = [];

if (req.body.nume) {
  query += " AND LOWER(nume) LIKE ?";
  params.push('%' + req.body.nume.toLowerCase() + '%');
}
//... Order By si rulare
let html = "";
for (let row of rows) {
  // randare template izolat de partial HTML
  html += await new Promise(resolve => {
    res.app.render("fragmente/produs_card", { produs: row }, (err, str) => resolve(str));
  });
}
res.json({ html: html, count: rows.length });
```
- **Fișier Frontend JS:** `/resurse/js/produse.js` (Funcția `filtreazaServerSide`)
```javascript
var res = await fetch("/produse-ajax", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify(reqBody)
});
var data = await res.json();
zonaProduse.querySelectorAll("article.produs-card").forEach(a => a.remove());
zonaProduse.insertAdjacentHTML("afterbegin", data.html); // Inlocuire UI 
aplicaPaginare(true); // Repaginare dupa reincarcarea DOM
```

---

## Bonus 11 (0.4p) - Modal pentru Detalii Produs
**Cerință:** La apăsarea pe cardul unui produs (în loc de navigarea propriu-zisă), datele acestuia să fie afișate sub forma unei casete tip Modal Box, ce poate fi închisă făcând click în exterior sau pe un buton `Close`.

**Logică de implementare:**
S-a injectat codul de bază al componentei Bootstrap `.modal` în josul fișierului EJS principal. S-a anulat (`e.preventDefault()`) efectul clasic al link-urilor EJS din interiorul produsului. S-au preluat proprietățile HTML `data-*` (deja generate de back-end în `<article>`) direct de pe cardul pe care s-a făcut click și au fost injectate (prin `textContent` și `.src`) în structura pop-up-ului Modal în timp real, deschizându-l la final cu `modalBoot.show()`.

**Cod și fișiere:**
- **Fișier Frontend JS:** `/resurse/js/produse.js` (În interiorul funcției `ataseazaEventuriActiuni`)
```javascript
art.addEventListener("click", function (e) {
  // Anulam click-ul original
  var a = e.target.closest("a");
  if (a) e.preventDefault();

  // Preluam datele si populam 
  var nume = art.querySelector(".produs-heading").textContent;
  var descriere = art.querySelector(".produs-descriere").textContent;
  var pret = art.getAttribute("data-pret");
  // ...
  document.getElementById("modalNume").textContent = nume;
  document.getElementById("modalDescriere").textContent = descriere;
  document.getElementById("modalPret").textContent = pret + " lei";

  modalBoot.show(); // Afisam pop-up-ul animat
});
```
- **Fișier Frontend EJS:** `/views/pagini/produse.ejs` (Linia ~196)
```html
<div class="modal fade" id="modalProdus">
  <div class="modal-dialog">
     <!-- Datele injectate prin id-urile: modalNume, modalDescriere, etc -->
  </div>
</div>
```

--- 
*Acest document sumarizează eforturile de dezvoltare agent-user din cadrul proiectului web, demonstrând utilizarea arhitecturii Express-EJS-MySQL corelată cu Fetch APIs și UI Design curat (Bootstrap + SCSS).*
