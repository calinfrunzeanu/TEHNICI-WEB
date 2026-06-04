# Documentație: Aplicație de sortare, filtrare și calculare

Această documentație detaliază exact modul de implementare a cerințelor de bază primite, explicând logica, funcțiile utilizate și locațiile exacte (linii, fișiere, foldere) din codul proiectului PetHub.

---

## 1. Descriere cerință. Pagină produse.
**Cerința:** Pagina de produse listează datele (entitățile aplicației - animale, hrană, accesorii pentru animale de companie). Nu se afișează toate detaliile, ci doar cele mai relevante pentru filtrare/sortare.

**Implementare și Explicație Logică:**
Aplicația definește ruta de bază `/produse` care interoghează baza de date MySQL și trimite array-ul de produse către șablonul EJS. S-au afișat pe carduri doar specificațiile principale (Preț, Categorie, Culoare, Materiale/Ingrediente), lăsând alte detalii ample (toate specificațiile sau imaginile din carusel) pentru pagina dedicată.

**Cod (Exemplu):**
- **Fișier Backend:** `c:\Users\calin\Desktop\TehniciWeb\etapa1\site\index.js` (Linia ~660)
- **Funcție/Ruta:** `app.get("/produse", ...)`
```javascript
// Aici extragem toate produsele relevante:
let query = "SELECT * FROM produse";
const [rows] = await db.query(query);

// Variabila 'rows' contine array-ul de entitati
res.render("pagini/produse", { 
    produse: rows 
});
```

---

## 2. Descriere cerință. Pagină produs unic.
**Cerința:** Se generează automat prin program o pagină pentru fiecare produs. Se trimit datele produsului prin obiectul `locals(ejs)`. Afișează toate detaliile (inclusiv descrierea amplă și pozele suplimentare).

**Implementare și Explicație Logică:**
S-a creat o rută parametrizată `/produse/:id`. Funcția preia id-ul din URL, se conectează la baza de date și execută un query bazat pe clauza `WHERE id=?`. Produsul returnat (primul element din array, `rows[0]`) este trimis către fișierul `produs.ejs` aflat în folderul `views/pagini`. Obiectul este recunoscut de EJS și expus automat ca variabilă `produs`.

**Cod (Exemplu):**
- **Fișier Backend:** `c:\Users\calin\Desktop\TehniciWeb\etapa1\site\index.js` (Liniile ~734-770)
```javascript
app.get("/produse/:id", async function (req, res) {
  var id = parseInt(req.params.id, 10);
  const [rows] = await db.query("SELECT * FROM produse WHERE id = ?", [id]);
  
  if (rows.length > 0) {
    let produs = rows[0];
    // Aici se trimit datele prin locals-ul instanței de render:
    res.render("pagini/produs", { produs: produs });
  } else {
    // Tratare produs inexistent
  }
});
```

---

## 3. Baza de date. Tabelul de produse
**Cerința:** Creare BD și tabel de produse, alocare user. Date preluat din tabel: id (numeric), nume, descriere, imagine (calea), categorie mare (Enum de max 5), un mod de categorizare mai mic, pret (numeric), o a 2-a numerica, Date (data calendaristica), un text unic, un text multiplu (cu virgula), o booleana. 15-20 entitati.

**Implementare și Explicație Logică:**
Baza de date a fost definită integral prin scriptul SQL. Există exact 16 entități. S-a configurat baza de date cu modulele Node `mysql2`.  
Corespondența proprietăților în tabel este:
1. `id` INT (Numeric)
2. `nume` VARCHAR (String)
3. `descriere` TEXT (String lung)
4. `imagine` VARCHAR (Doar calea imaginii relative)
5. `categorie_mare` ENUM('Caini', 'Pisici', 'Pesti', 'Rozatoare', 'Reptile') -> **5 valori**.
6. `subcategorie` VARCHAR -> *Mod secundar de clasificare (ex. Mâncare uscată vs umedă).*
7. `pret` DECIMAL -> *Numerică 1.*
8. `cantitate` INT -> *Numerică 2.*
9. `data_adaugare` DATE -> *Data.*
10. `culoare` VARCHAR -> *O singură valoare.*
11. `ingrediente` TEXT -> *Valori multiple despărțite prin virgulă (ex: "carne pui,orez,morcov").*
12. `livrare_posta` BOOLEAN -> *Livrare poștă (true/false) pentru calcul discount.*

**Cod (Exemplu):**
- **Fișier Script SQL:** `c:\Users\calin\Desktop\TehniciWeb\etapa1\site\db\init_baza_produse.sql` (Liniile ~12-25)
```sql
CREATE TABLE `produse` (
  `id` INT NOT NULL PRIMARY KEY,
  `nume` VARCHAR(255) NOT NULL,
  `categorie_mare` ENUM('Caini', 'Pisici', 'Pesti', 'Rozatoare', 'Reptile') NOT NULL,
  `subcategorie` VARCHAR(100) NOT NULL,
  `pret` DECIMAL(10,2) NOT NULL,
  `cantitate` INT NOT NULL,
  `data_adaugare` DATE NOT NULL,
  `culoare` VARCHAR(50) NOT NULL,
  `ingrediente` TEXT,
  `livrare_posta` BOOLEAN NOT NULL DEFAULT FALSE
);
```

---

## 4. Meniu. Împărțirea pe categorii mari
**Cerința:** Opțiune de "Produse" cu subopțiuni generate dinamic din valorile enumerației din DB (generate prin locals). Filtrarea se face la nivel de server, transmițând doar produsele din categoria respectivă spre afișare, prin același ejs (parametri diferiți de GET).

**Implementare și Explicație Logică:**
La pornirea aplicației/fiecărui request, un `app.use` (middleware) rulează un query `SELECT DISTINCT categorie_mare FROM produse` pentru a aduna toate cele 5 valori posibile direct din structura MySQL și le pune în obiectul `res.locals.categoriiProduse`.
În EJS-ul header-ului se iterază cu un `for` pentru a construi meniul drop-down. Link-ul este un simplu GET cu query param: `/produse?categorie=Caini`.
În ruta `/produse` de pe server se citește `req.query.categorie`. Dacă acesta este valid (se regăsește în array-ul extras), serverul face append de `WHERE categorie_mare = ?` direct în query. Astfel, din Backend pleacă strict subsetul dorit (Server-side filtering pentru Meniu).

**Cod:**
- **Fișier Backend Meniu:** `c:\Users\calin\Desktop\TehniciWeb\etapa1\site\index.js` (Liniile ~600)
```javascript
app.use(async function(req, res, next) {
  var [rows] = await db.query("SELECT DISTINCT categorie_mare FROM produse");
  res.locals.categoriiProduse = rows.map(r => r.categorie_mare);
  next();
});
```
- **Fișier Frontend (Header):** `c:\Users\calin\Desktop\TehniciWeb\etapa1\site\views\fragmente\header.ejs` (Liniile ~21-25)
```html
<ul class="dropdown-menu">
  <li><a class="dropdown-item" href="/produse">Toate produsele</a></li>
  <% categoriiProduse.forEach(function(cat) { %>
    <!-- Meniu creat dinamic din locals -->
    <li><a class="dropdown-item" href="/produse?categorie=<%- encodeURIComponent(cat) %>"><%- cat %></a></li>
  <% }); %>
</ul>
```

---

## 5. Format afișare produse (pentru pagina de produse)
**Cerința:** Iterare cu for prin ejs, folosirea filtrului ascunde produsele în DOM. Element `<article>` cu id=`produs_id` și clasă categoria_mare fără spații. Două coloane (poză, categorie, preț pe o coloană, apoi `<details>` cu summary "Specificații" pe cealaltă). Lista cu atribute *bold:* *italic*. Tag `<time>` formatat în română.

**Implementare și Explicație Logică:**
Pentru a asigura calitatea, logica a fost spartă. În `produse.ejs` facem iterarea cu `produse.forEach(...)`. Renderizarea efectivă e ascunsă într-un fișier parțial `produs_card.ejs`.
Coloanele folosesc CSS Grid/Flexbox (`.produs-col-1` și `.produs-col-2`). Elementul de tip Date din BD este parsat printr-un mic script de JavaScript integrat în zona EJS `<% ... %>`, care convertește luna în limba română (array `luniNume`) și extrage ziua cu `.getDay()`. ID-ul este creat cu EJS direct în ghilimele: `id="produs_<%= produs.id %>"`. Categoria este de-spațializată cu un Regex `.replace(/\s+/g, '_')`.

**Cod:**
- **Fișier Parțial EJS:** `c:\Users\calin\Desktop\TehniciWeb\etapa1\site\views\fragmente\produs_card.ejs` (Aproape integral)
```html
<%
  // Formatam data cu JS in EJS
  var dataObj = new Date(produs.data_adaugare);
  var zileSapt = ['Duminica', 'Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata'];
  var luniNume = ['Ianuarie', 'Februarie', 'Martie', ...];
  var dataFormatata = dataObj.getDate() + '-' + luniNume[dataObj.getMonth()] + '-' + dataObj.getFullYear() + ' (' + zileSapt[dataObj.getDay()] + ')';
  var categCSS = produs.categorie_mare.replace(/\s+/g, '_');
%>
<article id="produs_<%= produs.id %>" class="produs-card <%= categCSS %>" ...>
  <h2 class="produs-heading"><%= produs.nume %></h2>
  <div class="produs-continut"> <!-- Flex container: 2 coloane -->
    
    <div class="produs-col-1">
      <img src="<%= produs.imagine %>" alt="<%= produs.nume %>">
      <p class="produs-categorie"><%= produs.categorie_mare %></p>
      <p class="produs-pret"><%= produs.pret %> lei</p>
    </div>

    <div class="produs-col-2">
      <details class="produs-details">
        <summary>Specificatii</summary>
        <ul class="lista-specificatii">
          <!-- O singura valoare: -->
          <li><b>Culoare:</b> <i><%= produs.culoare %></i></li>
          <!-- Mai multe valori: -->
          <li><b>Ingrediente / materiale:</b> <i><%= produs.ingrediente %></i></li>
          <!-- Data (Tag TIME): -->
          <li><b>Data adaugare:</b> <time datetime="<%= dataISO %>"><i><%= dataFormatata %></i></time></li>
        </ul>
      </details>
      <p class="produs-descriere"><%= produs.descriere %></p>
    </div>

  </div>
</article>
```

---

## 6. Filtre. Inputuri și 7. Cerințe specifice filtre.
**Cerința:** Să avem text, range cu valoare min/max vizibile și afișate, datalist, grup radio, checkbox, textarea, select simplu, select multiplu (luni - toate bifate). Layout prin flexbox/grid. Checkbox pentru produs cu discount. Radio cu valoare „Toate”.

**Implementare și Explicație Logică:**
Interfața este realizată cu componente specifice din Bootstrap (folosind sistemul de Grid Bootstrap `.row` și `.col-md-X` care au la bază CSS Flexbox).
1. **Input text**: pentru numele produsului.
2. **Range (Preț)**: creat cu eticheta stânga-dreapta. Scriptul din `produse.js` ascultă evenimentul de tip `input` și modifică o etichetă din HTML (`#pret-val`) cu prețul mutat curent sub formă de paranteze `(preț)`.
3. **Datalist**: creat pentru atributul `producator`. Preluăm valorile unice din MySQL și le populăm în `<option>` din EJS.
4. **Grup Radio**: implementat cu stilul `.btn-check` de Bootstrap pentru *Culoare*. Conține de la server valoarea *"toate"* preselectată implicită.
5. **Checkbox (Discount)**: Filtrul se bazează pe coloana de MySQL `livrare_posta` booleană (dacă un produs se livrează gratuit, obține reducerea respectivă).
6. **Textarea**: descrierea de produs (minim de caractere obligatorii prin validare).
7. **Select Simplu**: pentru categorie, având `"Oricare"` opțiunea implicită default (value goală).
8. **Select Multiplu**: listă fixă cu cele 12 Luni. Toate tag-urile `<option>` au flagul atribut `selected` din EJS la momentul randării.

Funcția JS de filtrare combinată iterează array-ul de elemente DOM `<article>`, interoghează proprietățile setate ca atribute de date (`data-culoare="Rosu"`) și setează vizibilitatea lor (`art.style.display = "none"` sau prin adăugarea clasei `.ascuns-filtru`). 
La selectul de tip Dată (Multiplu), se verifică din array-ul `luniSelectate` extras prin JS dacă luna corespunzătoare articolului (preluată din `data-luna`) există (`indexOf`).

**Cod (Exemple):**
- **Fișier Frontend (UI Filtre):** `c:\Users\calin\Desktop\TehniciWeb\etapa1\site\views\pagini\produse.ejs`
```html
<!-- Text -->
<input type="text" id="filtru-nume" class="form-control">

<!-- Range (cu afisare text in paranteze in eticheta pret-val) -->
<label>Pret maxim: <span id="pret-val">(<%= maxPret %>)</span></label>
<input type="range" id="filtru-pret" value="<%= maxPret %>">

<!-- Radio "Toate" -->
<input type="radio" name="filtru-culoare" id="culoare-toate" value="toate" checked>
```

- **Fișier JS Funcție de filtrare:** `c:\Users\calin\Desktop\TehniciWeb\etapa1\site\resurse\js\produse.js` (Liniile ~88-188)
```javascript
function filtreazaProduse() {
  if (!valideazaInputuri()) return; // Oprire fortata daca validarea pica
  
  // Preluam date formular
  var valNume = inputNume.value.trim().toLowerCase();
  var valPretMax = parseFloat(inputPret.value);
  var valCuloare = document.querySelector('input[name="filtru-culoare"]:checked').value;
  var doarDiscount = checkDiscount.checked;

  var articole = zonaProduse.querySelectorAll("article.produs-card");
  
  articole.forEach(function (art) {
    var vizibil = true;
    
    // 1. Daca produsul are pret mai mare, il ascundem
    if (parseFloat(art.getAttribute("data-pret")) > valPretMax) vizibil = false;
    
    // 2. Daca culoarea difera si nu este radio-ul setat pe "toate"
    if (valCuloare !== "toate" && art.getAttribute("data-culoare") !== valCuloare) vizibil = false;

    // 3. Discount pe livrare gratuita in posta (checkbox)
    if (doarDiscount && art.getAttribute("data-livrare") !== "1") vizibil = false;
    
    // 4. Filtru Select Multiplu Luni (Daca luna curenta a articolului nu exista in array-ul selectiilor noastre)
    if (luniSelectate.length > 0 && luniSelectate.indexOf(art.getAttribute("data-luna")) === -1) vizibil = false;

    // Aplicam clasa (display: none e inclusa in ea)
    if (vizibil) {
      art.classList.remove("ascuns-filtru");
    } else {
      art.classList.add("ascuns-filtru");
    }
  });
}
```

---

## 8. Butoane. Operațiile efective de filtrare/sortare/calculare
**Cerința:** 
- Buton `filtreaza` pt filtru efectiv.
- Buton de Sortare pe 2 chei (Preț și Numărul valorilor din array-ul de string-uri). Sortare ASC și DESC.
- Buton Calcul (Suma, apare într-un div creat dinamic `createElement`, fix 2s, apoi șters).
- Buton Reset cu prompt de confimare, readuce la forma implicită + repune ordinea inițială în DOM (anulând sortarea).
- Validare pe butoanele de calcul/filtrare/sort cu avertizări specifice.

**Implementare și Explicație Logică:**
Acestea au fost realizate printr-o suită de funcții în JavaScript care se atașează direct la click (ex. `btnSortAsc.addEventListener("click", ...)`).
- **Validarea (`valideazaInputuri`)**: Aceasta este prima linie de execuție în toate funcțiile de pe butoane. Verifică Regex (dacă textul conține exclusiv cifre `^\d+$`) și setează clasa `.is-invalid`. Aruncă un `alert` nativ ca atenționare relevantă impiedicand execuția prin instrucțiunea de întrerupere `return false`.
- **Sortarea (`sorteazaProduse`)**: Extrage toate node-urile `<article>` din DOM într-un Array normal de JS ca să poată folosi `.sort()`. Se extrag atributele (`data-pret`, iar pentru a afla elementele string-ului multiplu de ingrediente, pur și simplu verific atributul pre-randat `data-nr-ingrediente`, obținut scăzând lungimea string-ului cu virgule în minus pe backend). Metoda `.sort` compară cele 2 elemente `a` și `b` mai întâi pe cheia 1 (pret); dacă sunt egale (0), continuă să rezolve conflictul la cheia a 2-a (numărul de componente). După sortare, `.appendChild()` repune elementele în noul rând.
- **Calcularea (`calculeazaMedia`)**: Parcurge doar cardurile de produs care NU conțin clasa `.ascuns-filtru`. Face suma prețurilor, împarte la contor. Construiește un obiect din memorie (`createElement('div')`), îi scrie CSS cu `position: fixed`, îl "apendează" pe `body` (astfel încât să fie văzut de utilizator deasupra tuturor, pe ecran), apoi rulează un timer asincron nativ `setTimeout` (2000 milisecunde) la capătul căruia execută `.remove()`.
- **Resetarea (`reseteazaFiltrele`)**: Folosește funcția nativă JS blocantă `confirm()`. Dacă e Da, curăță `value`-urile tuturor input-urilor, selectează `checked = true` pentru "Toate" la radio buttons. După, interoghează matricea dinamică globală `ordineInitiala` pe care am populat-o la început de script pentru a trage fiecare ID înapoi prin `.appendChild()` repozitionându-l exact ca la refresh-ul de server.

**Cod (Exemple logice):**
- **Fișier JS (Calculează Media):** `c:\Users\calin\Desktop\TehniciWeb\etapa1\site\resurse\js\produse.js` (Linia ~301)
```javascript
function calculeazaMedia() {
  if (!valideazaInputuri()) return; // Verificare impusa cerinta
  
  // Selectam doar ce a supravietuit din filtre
  var articole = zonaProduse.querySelectorAll("article.produs-card:not(.ascuns-filtru)");
  var suma = 0, count = 0;
  articole.forEach(art => {
      suma += parseFloat(art.getAttribute("data-pret"));
      count++;
  });
  
  // Creare div dinamic (pozitie fixa)
  var divCalc = document.createElement("div");
  divCalc.className = "rezultat-calcul vizibil";
  divCalc.innerHTML = "Media preturilor produselor vizibile: " + (suma/count).toFixed(2);
  document.body.appendChild(divCalc);

  // Expirare in 2 secunde
  setTimeout(function () {
    divCalc.remove();
  }, 2000);
}
```
- **Fișier JS (Validarea):** `c:\Users\calin\Desktop\TehniciWeb\etapa1\site\resurse\js\produse.js` (Linia ~48)
```javascript
function valideazaInputuri() {
  var erori = [];
  var valNume = inputNume.value.trim();
  
  // Cazul in care textul are strict cifre
  if (valNume && /^\d+$/.test(valNume)) {
    erori.push("Campul 'Cauta dupa nume' nu poate contine doar cifre.");
    inputNume.classList.add("is-invalid"); // Adaugare aspect rosu/atentionare
  }
  
  if (erori.length > 0) {
    alert("Erori de validare:\n\n" + erori.join("\n")); // Alert cu problemele intalnite
    return false; // Blocheaza continuarea aplicarii filtrului/calcularii etc.
  }
  return true;
}
```
- **Fișier JS (Sortarea Dubla):** `c:\Users\calin\Desktop\TehniciWeb\etapa1\site\resurse\js\produse.js` (Linia ~255)
```javascript
// La apelul sortarii se trimite ordine ("asc" sau "desc")
articole.sort(function (a, b) {
  // Cheie 1: PRET
  var valA1 = parseFloat(a.getAttribute("data-pret"));
  var valB1 = parseFloat(b.getAttribute("data-pret"));
  var cmp1 = valA1 > valB1 ? 1 : (valA1 < valB1 ? -1 : 0);

  // Daca nu exista remiza la prima, ne oprim aici cu ordinea.
  if (cmp1 !== 0) return ordine === "asc" ? cmp1 : -cmp1;

  // Remiza (Acelasi Pret) => Trece la Cheie 2: NUMAR ELEMENTE din lista (Ingrediente multiple)
  var valA2 = parseInt(a.getAttribute("data-nr-ingrediente"));
  var valB2 = parseInt(b.getAttribute("data-nr-ingrediente"));
  var cmp2 = valA2 > valB2 ? 1 : (valA2 < valB2 ? -1 : 0);

  return ordine === "asc" ? cmp2 : -cmp2;
});

// Rescrie HTML-ul parinte repozitionand in noua ordine articolele DOM
articole.forEach(art => zonaProduse.appendChild(art));
```
