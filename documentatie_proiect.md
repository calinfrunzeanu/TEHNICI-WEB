# Documentație: Aplicație de sortare, filtrare și calculare

Acest document descrie logica de implementare a cerințelor de bază din proiect (Tehnici Web), incluzând explicații, extrase de cod, liniile aproximative și locația fișierelor.

---

## 1. Pagină produse și Pagină produs unic
**Cerință:** Generare automată a paginii de produse (afisând date relevante) și o pagină separată per produs unic ce primește toate datele prin `locals`.

**Logică de implementare:**
Aplicația definește două rute de tip GET în Express. Prima interoghează baza de date pentru lista completă (sau filtrată) și o randează în `produse.ejs`. A doua folosește parametrul de rută `:id` pentru a găsi un produs specific și îl trimite prin `locals` către `produs.ejs`.

**Cod și fișiere:**
- **Backend:** `/index.js`
```javascript
// Linii ~660: Ruta pentru toate produsele
app.get("/produse", async function (req, res) {
  let query = "SELECT * FROM produse";
  // logica de filtrare pe categorii ...
  const [rows] = await db.query(query);
  res.render("pagini/produse", { produse: rows });
});

// Linii ~734: Ruta pentru produs unic
app.get("/produse/:id", async function (req, res) {
  var id = parseInt(req.params.id, 10);
  const [rows] = await db.query("SELECT * FROM produse WHERE id = ?", [id]);
  if (rows.length > 0) {
    res.render("pagini/produs", { produs: rows[0] });
  } else {
    // afisare eroare
  }
});
```

---

## 2. Baza de date și Tabelul de produse
**Cerință:** Creare tabel DB cu minim: id, nume, descriere, imagine, categorie mare (ENUM max 5), categorie mica, pret, inca o caracteristica numerica, data, text-unic, text-multiplu (array), boolean. 15-20 entitati.

**Logică de implementare:**
S-a creat scriptul SQL de inițializare `init_baza_produse.sql`. Categoria mare este de tip `ENUM('Caini', 'Pisici', 'Pesti', 'Rozatoare', 'Reptile')`. 
- Numerică 2: `cantitate`
- Dată: `data_adaugare`
- Unică: `culoare`
- Multiplă: `ingrediente`
- Boolean: `livrare_posta`

**Cod și fișiere:**
- **Script DB:** `/db/init_baza_produse.sql` (Linii ~10-30)
```sql
CREATE TABLE `produse` (
  `id` INT NOT NULL PRIMARY KEY,
  `nume` VARCHAR(255) NOT NULL,
  `descriere` TEXT,
  `categorie_mare` ENUM('Caini', 'Pisici', 'Pesti', 'Rozatoare', 'Reptile') NOT NULL,
  `subcategorie` VARCHAR(100) NOT NULL,
  `pret` DECIMAL(10,2) NOT NULL,
  `cantitate` INT NOT NULL,
  `data_adaugare` DATE NOT NULL,
  `culoare` VARCHAR(50) NOT NULL,
  `ingrediente` TEXT,
  `livrare_posta` BOOLEAN NOT NULL DEFAULT FALSE
);
-- 16 Inserari (INSERT INTO produse ...)
```

---

## 3. Meniu dinamic și Împărțirea pe categorii mari
**Cerință:** Subopțiuni în meniu generate din DB prin Enum. La click se trimite un GET către server care returnează doar produsele din categoria respectivă, refolosind același `produse.ejs`.

**Logică de implementare:**
La încărcarea paginilor globale, un middleware extrage tipurile unice de ENUM (sau se pot citi direct valorile unice de categorie) și le stochează în `locals.categoriiProduse`. În header, EJS generează un dropdown iterând prin ele.

**Cod și fișiere:**
- **Backend Middleware:** `/index.js` (Linii ~600)
```javascript
app.use(async function(req, res, next) {
  var [rows] = await db.query("SELECT DISTINCT categorie_mare FROM produse");
  res.locals.categoriiProduse = rows.map(r => r.categorie_mare);
  next();
});
```
- **Frontend Header EJS:** `/views/fragmente/header.ejs` (Linii ~20)
```html
<ul class="dropdown-menu">
  <li><a class="dropdown-item" href="/produse">Toate</a></li>
  <% categoriiProduse.forEach(function(cat) { %>
    <li><a class="dropdown-item" href="/produse?categorie=<%- encodeURIComponent(cat) %>"><%- cat %></a></li>
  <% }); %>
</ul>
```
- **Filtrare Backend:** `/index.js` (Ruta `/produse`)
```javascript
var catQuery = req.query.categorie;
if (catQuery && res.locals.categoriiProduse.includes(catQuery)) {
  query += " WHERE categorie_mare = ?";
  // ruleaza interogarea cu parametrul catQuery
}
```

---

## 4. Format afișare produse
**Cerință:** Element `<article>` împărțit pe 2 coloane. Imaginea mică stânga, categorie + preț dedesubt. Dreapta: `<details>` cu lista specificatii (bold: italic), `<time>` in format ro, descriere. ID formatat `produs_id`.

**Logică de implementare:**
S-a extras structura cardului într-un fișier parțial `produs_card.ejs` iterat din grid-ul principal. EJS formatează data folosind obiectul de `Date()`. Coloanele sunt aranjate prin Flexbox CSS.

**Cod și fișiere:**
- **Frontend EJS partial:** `/views/fragmente/produs_card.ejs` (Linii ~15-40)
```html
<% var dataFormatata = dataObj.getDate() + '-' + luniNume[dataObj.getMonth()] + '-' + dataObj.getFullYear() + ' (' + zileSapt[dataObj.getDay()] + ')'; %>
<article id="produs_<%= produs.id %>" class="produs-card <%= categCSS %>" ...>
  <div class="produs-continut">
    <div class="produs-col-1">
      <img src="<%= produs.imagine %>" alt="<%= produs.nume %>" class="produs-imagine">
      <p class="produs-categorie"><%= produs.categorie_mare %> &mdash; <%= produs.subcategorie %></p>
      <p class="produs-pret"><%= produs.pret %> lei</p>
    </div>
    <div class="produs-col-2">
      <details class="produs-details">
        <summary>Specificatii</summary>
        <ul class="lista-specificatii">
          <li><b>Culoare:</b> <i><%= produs.culoare %></i></li>
          <li><b>Data adaugare:</b> <time datetime="<%= dataISO %>"><i><%= dataFormatata %></i></time></li>
        </ul>
      </details>
      <p class="produs-descriere"><%= produs.descriere %></p>
    </div>
  </div>
</article>
```

---

## 5. Filtre (Inputuri) și Validare
**Cerință:** Generare de 8 filtre (text, range, datalist, radio, checkbox, textarea, select simplu, select multiplu). Input-urile invalide (cifre in text etc) trebuie sa ridice avertizari.

**Logică de implementare:**
Toate filtrele sunt mapate pe clase de grid Bootstrap (`row > col-*`).
La apăsarea butoanelor, se rulează `valideazaInputuri()`. Dacă se găsesc erori (regex pentru testare numere sau vid), se oprește execuția, se colorează caseta cu clasa `.is-invalid` (roșu) și apare un `alert`.

**Cod și fișiere:**
- **Frontend Validation JS:** `/resurse/js/produse.js` (Linii ~47-80)
```javascript
function valideazaInputuri() {
  var erori = [];
  var valNume = inputNume.value.trim();
  if (valNume && /^\d+$/.test(valNume)) {
    erori.push("Campul nume nu poate contine doar cifre.");
    inputNume.classList.add("is-invalid");
  }
  // Similar pentru textarea...
  if (erori.length > 0) {
    alert("Erori:\n" + erori.join("\n"));
    return false;
  }
  return true;
}
```
- **Filtrare Checkbox (Discount):** `produse.js` (Linii ~150)
```javascript
if (checkDiscount.checked && art.getAttribute("data-livrare") !== "1") {
  vizibil = false; 
} // Discount bazat pe livrare gratuita
```

---

## 6. Butoane (Filtrează, Sortează, Calculează, Resetează)
**Cerință:** Filtrează aplică toate regulile combinat. Sortarea se face automat după 2 chei: preț, apoi lungimea/lista proprietății multiple. Calculează suma/media într-un div creat dinamic care dispare după 2 secunde. Reset revine la stare cu confirmare.

**Logică de implementare:**
- **Filtrare:** ascunde cu clasa `ascuns-filtru` (`display:none`).
- **Sortare:** folosește metoda `Array.prototype.sort()` pe `NodeList`-ul transformat în Array. Dacă `pret` e egal, compară atributul `data-nr-ingrediente` care numără la randare numărul de cuvinte despărțite prin virgulă. (Aceasta logică este extinsă de Bonus 8 care permite alegerea dinamică a cheilor).
- **Calculare:** `createElement("div")`, clasa pentru animație (poziție fixă) și folosirea lanțului `setTimeout`.
- **Reset:** `confirm()`, reasociază elementele în forma lor DOM inițială.

**Cod și fișiere:**
- **Calculare JS:** `/resurse/js/produse.js` (Linii ~300)
```javascript
function calculeazaMedia() {
  if (!valideazaInputuri()) return;
  // Calculare suma...
  var divCalc = document.createElement("div");
  divCalc.className = "rezultat-calcul vizibil";
  divCalc.innerHTML = "Media preturilor: " + media + " lei";
  document.body.appendChild(divCalc);

  setTimeout(function () {
    divCalc.classList.remove("vizibil");
    setTimeout(() => divCalc.remove(), 400); // Wait for transition
  }, 2000);
}
```
- **Resetare JS:** `/resurse/js/produse.js` (Linii ~345)
```javascript
function reseteazaFiltrele() {
  if (!confirm("Esti sigur ca vrei sa resetezi toate filtrele?")) return;
  // Resetari value = default...
  ordineInitiala.forEach(function (id) {
    zonaProduse.appendChild(document.getElementById(id)); // Repozitionare sortare
  });
  // Stergere clasa ascuns-filtru...
}
```
