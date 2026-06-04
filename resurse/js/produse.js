// produse.js — filtrare, sortare, calculare client-side
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // referinte elemente
  var inputNume = document.getElementById("filtru-nume");
  var inputPret = document.getElementById("filtru-pret");
  var pretVal = document.getElementById("pret-val");
  var inputProducator = document.getElementById("filtru-producator");
  var selectLuna = document.getElementById("filtru-luna");
  var checkDiscount = document.getElementById("filtru-discount");
  var selectCategorie = document.getElementById("filtru-categorie");
  var textareaDescriere = document.getElementById("filtru-descriere");

  var btnFiltreaza = document.getElementById("btn-filtreaza");
  var btnSortAsc = document.getElementById("btn-sort-asc");
  var btnSortDesc = document.getElementById("btn-sort-desc");
  var btnCalc = document.getElementById("btn-calculeaza");
  var btnReset = document.getElementById("btn-reseteaza");

  var zonaProduse = document.getElementById("zona-produse");

  // ═══════════ BONUS 6: INIT SESIUNE (Produse sterse tab curent) ═══════════
  var produseSterse = JSON.parse(sessionStorage.getItem("produseSterse") || "[]");
  var toggleServerSide = document.getElementById("toggle-server-side");
  var ordineCurenta = "asc";

  // setari paginare
  var K = 4; // numarul de elemente pe pagina
  var currentPage = 1;

  // salvam ordinea initiala a produselor pt resetare
  var ordineInitiala = [];
  var articole = zonaProduse.querySelectorAll("article.produs-card");
  articole.forEach(function (art) {
    ordineInitiala.push(art.id);
    // Aplicam starea de sters daca e in sesiune
    if (produseSterse.indexOf(art.id) !== -1) {
      art.classList.add("sters-sesiune");
      art.classList.add("ascuns-filtru");
    }
  });

  // actualizare valoare range
  inputPret.addEventListener("input", function () {
    pretVal.textContent = "(" + inputPret.value + ")";
  });

  // ═══════════ VALIDARE ═══════════
  function valideazaInputuri() {
    var erori = [];

    // validare text: nu trebuie sa contina doar cifre
    var valNume = inputNume.value.trim();
    if (valNume && /^\d+$/.test(valNume)) {
      erori.push("Campul 'Cauta dupa nume' nu poate contine doar cifre.");
      inputNume.classList.add("is-invalid");
    } else {
      inputNume.classList.remove("is-invalid");
    }

    // validare textarea: daca e completata, trebuie sa aiba minim 2 caractere
    var valDescriere = textareaDescriere.value.trim();
    if (valDescriere && valDescriere.length < 2) {
      erori.push("Cuvintele cheie din descriere trebuie sa aiba cel putin 2 caractere.");
      textareaDescriere.classList.add("is-invalid");
    } else {
      textareaDescriere.classList.remove("is-invalid");
    }

    // validare textarea: nu trebuie sa contina doar caractere speciale
    if (valDescriere && /^[^a-zA-Z0-9]+$/.test(valDescriere)) {
      erori.push("Cuvintele cheie din descriere nu pot contine doar caractere speciale.");
      textareaDescriere.classList.add("is-invalid");
    }

    if (erori.length > 0) {
      alert("Erori de validare:\n\n" + erori.join("\n"));
      return false;
    }
    return true;
  }

  // ═══════════ BONUS 7: Eliminare Diacritice ═══════════
  function eliminaDiacritice(text) {
    if (!text) return "";
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // ═══════════ FILTRARE ═══════════
  function filtreazaProduse() {
    if (!valideazaInputuri()) return;

    if (toggleServerSide && toggleServerSide.checked) {
      filtreazaServerSide(ordineCurenta);
      return;
    }

    var valNume = eliminaDiacritice(inputNume.value.trim().toLowerCase());
    var valPretMax = parseFloat(inputPret.value);
    var valProducator = inputProducator.value.trim().toLowerCase();
    var valDescriere = eliminaDiacritice(textareaDescriere.value.trim().toLowerCase());

    // culoare selectata din radio
    var radioSelectat = document.querySelector('input[name="filtru-culoare"]:checked');
    var valCuloare = radioSelectat ? radioSelectat.value : "toate";

    // luni selectate din select multiplu
    var luniSelectate = [];
    for (var i = 0; i < selectLuna.options.length; i++) {
      if (selectLuna.options[i].selected) {
        luniSelectate.push(selectLuna.options[i].value);
      }
    }

    // discount checkbox
    var doarDiscount = checkDiscount.checked;

    // categorie din select simplu
    var valCategorie = selectCategorie.value;

    var articole = zonaProduse.querySelectorAll("article.produs-card");
    var vizibile = 0;

    articole.forEach(function (art) {
      // Daca a fost sters pe sesiune, ramane ascuns
      if (art.classList.contains("sters-sesiune")) {
        art.classList.add("ascuns-filtru");
        return; 
      }

      var vizibil = true;

      // 1. filtru nume (text) - Fara Diacritice
      if (valNume) {
        var numeText = eliminaDiacritice(art.querySelector(".produs-heading").textContent.toLowerCase());
        if (numeText.indexOf(valNume) === -1) vizibil = false;
      }

      // 2. filtru pret (range)
      var pretProdus = parseFloat(art.getAttribute("data-pret"));
      if (pretProdus > valPretMax) vizibil = false;

      // 3. filtru producator (datalist)
      if (valProducator) {
        var producatorProdus = (art.getAttribute("data-producator") || "").toLowerCase();
        if (producatorProdus.indexOf(valProducator) === -1) vizibil = false;
      }

      // 4. filtru culoare (radio)
      if (valCuloare !== "toate") {
        var culoareProdus = art.getAttribute("data-culoare");
        if (culoareProdus !== valCuloare) vizibil = false;
      }

      // 5. filtru luna (select multiplu)
      var lunaProdus = art.getAttribute("data-luna");
      if (luniSelectate.length > 0 && luniSelectate.indexOf(lunaProdus) === -1) vizibil = false;
      if (luniSelectate.length === 0) vizibil = false;

      // 6. filtru discount (checkbox) — discount = livrare posta gratuita
      if (doarDiscount) {
        var livrare = art.getAttribute("data-livrare");
        if (livrare !== "1") vizibil = false;
      }

      // 7. filtru categorie (select simplu)
      if (valCategorie) {
        var categorieProdus = art.getAttribute("data-categorie");
        if (categorieProdus !== valCategorie) vizibil = false;
      }

      // 8. filtru descriere (textarea) - Fara Diacritice
      if (valDescriere) {
        var descriereText = eliminaDiacritice((art.querySelector(".produs-descriere") || {}).textContent || "").toLowerCase();
        // cautam toate cuvintele cheie separate prin virgula sau spatiu
        var cuvinte = valDescriere.split(/[,\s]+/).filter(Boolean);
        var gasit = cuvinte.some(function (cuv) {
          return descriereText.indexOf(cuv) !== -1;
        });
        if (!gasit) vizibil = false;
      }

      // Bonus 6: Daca e PINNED, e vizibil oricum (doar daca nu e sters pe sesiune, verificat sus)
      if (art.classList.contains("produs-pinned")) {
        vizibil = true;
      }

      if (vizibil) {
        art.classList.remove("ascuns-filtru");
        vizibile++;
      } else {
        art.classList.add("ascuns-filtru");
      }
    });

    var msgLipsa = document.getElementById("mesaj-lipsa-produse");
    if (msgLipsa) {
      msgLipsa.style.display = vizibile === 0 ? "block" : "none";
    }

    aplicaPaginare(true);
  }

  // ═══════════ PAGINARE ═══════════
  function aplicaPaginare(resetPage) {
    if (resetPage) currentPage = 1;

    var articoleFiltrate = Array.from(zonaProduse.querySelectorAll("article.produs-card:not(.ascuns-filtru)"));
    var N = articoleFiltrate.length;
    var NRL = Math.ceil(N / K);

    if (currentPage > NRL && NRL > 0) currentPage = NRL;

    // ascundem absolut toate produsele initial
    var toateArticolele = zonaProduse.querySelectorAll("article.produs-card");
    toateArticolele.forEach(function(art) {
      art.style.display = "none";
    });

    // afisam doar pe cele din pagina curenta
    var start = (currentPage - 1) * K;
    var end = currentPage * K - 1;

    for (var i = 0; i < N; i++) {
      if (i >= start && i <= end) {
        articoleFiltrate[i].style.display = "";
      }
    }

    // generare UI paginare
    var paginationContainer = document.getElementById("pagination-container");
    if (!paginationContainer) return;
    paginationContainer.innerHTML = "";

    if (NRL <= 1) return; // nu desenam paginarea pt o singura pagina

    for (var p = 1; p <= NRL; p++) {
      var li = document.createElement("li");
      li.className = "page-item" + (p === currentPage ? " active" : "");
      
      var a = document.createElement("a");
      a.className = "page-link";
      a.href = "#zona-produse";
      a.textContent = p;
      a.dataset.page = p;

      a.addEventListener("click", function(e) {
        e.preventDefault();
        currentPage = parseInt(this.dataset.page);
        aplicaPaginare(false);
        var offset = zonaProduse.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top: offset, behavior: "smooth" });
      });

      li.appendChild(a);
      paginationContainer.appendChild(li);
    }
  }

  // ═══════════ SORTARE (Bonus 8) ═══════════
  function sorteazaProduse(ordine) {
    if (!valideazaInputuri()) return;
    ordineCurenta = ordine;

    if (toggleServerSide && toggleServerSide.checked) {
      filtreazaServerSide(ordine);
      return;
    }

    var articole = Array.from(zonaProduse.querySelectorAll("article.produs-card"));
    var cheie1 = document.getElementById("sortare-cheie-1").value;
    var cheie2 = document.getElementById("sortare-cheie-2").value;

    function extrageValoare(art, cheie) {
      if (cheie === "pret") return parseFloat(art.getAttribute("data-pret"));
      if (cheie === "nume") return art.querySelector(".produs-heading").textContent.toLowerCase();
      if (cheie === "nr-ingrediente") return parseInt(art.getAttribute("data-nr-ingrediente"), 10) || 0;
      if (cheie === "luna") return parseInt(art.getAttribute("data-luna"), 10) || 0;
      return 0;
    }

    articole.sort(function (a, b) {
      var valA1 = extrageValoare(a, cheie1);
      var valB1 = extrageValoare(b, cheie1);

      var cmp1 = 0;
      if (valA1 > valB1) cmp1 = 1;
      else if (valA1 < valB1) cmp1 = -1;

      if (cmp1 !== 0) {
        return ordine === "asc" ? cmp1 : -cmp1;
      }

      var valA2 = extrageValoare(a, cheie2);
      var valB2 = extrageValoare(b, cheie2);

      var cmp2 = 0;
      if (valA2 > valB2) cmp2 = 1;
      else if (valA2 < valB2) cmp2 = -1;

      return ordine === "asc" ? cmp2 : -cmp2;
    });

    // rearanjam in DOM
    articole.forEach(function (art) {
      zonaProduse.appendChild(art);
    });

    aplicaPaginare(true);
  }

  // ═══════════ CALCULARE ═══════════
  function calculeazaMedia() {
    if (!valideazaInputuri()) return;

    var articole = zonaProduse.querySelectorAll("article.produs-card");
    var suma = 0;
    var count = 0;

    articole.forEach(function (art) {
      if (!art.classList.contains("ascuns-filtru")) {
        suma += parseFloat(art.getAttribute("data-pret"));
        count++;
      }
    });

    var mesaj;
    if (count === 0) {
      mesaj = "Nu exista produse vizibile pentru calcul.";
    } else {
      var media = (suma / count).toFixed(2);
      mesaj = "Media preturilor produselor vizibile: " + media + " lei (" + count + " produse)";
    }

    // creare div dinamic cu pozitie fixa
    var divCalc = document.createElement("div");
    divCalc.className = "rezultat-calcul";
    divCalc.innerHTML = '<i class="fas fa-calculator"></i> ' + mesaj;
    document.body.appendChild(divCalc);

    // forteaza reflow pentru animatie
    divCalc.offsetHeight;
    divCalc.classList.add("vizibil");

    // dispare dupa 2 secunde
    setTimeout(function () {
      divCalc.classList.remove("vizibil");
      setTimeout(function () {
        if (divCalc.parentNode) {
          divCalc.parentNode.removeChild(divCalc);
        }
      }, 400);
    }, 2000);
  }

  // ═══════════ BONUS 10: FETCH AJAX SERVER-SIDE ═══════════
  async function filtreazaServerSide(ordine) {
    var radioSelectat = document.querySelector('input[name="filtru-culoare"]:checked');
    var valCuloare = radioSelectat ? radioSelectat.value : "toate";

    var luniSelectate = [];
    for (var i = 0; i < selectLuna.options.length; i++) {
      if (selectLuna.options[i].selected) luniSelectate.push(selectLuna.options[i].value);
    }

    var reqBody = {
      nume: inputNume.value.trim(),
      pretMax: inputPret.value,
      producator: inputProducator.value.trim(),
      culoare: valCuloare,
      categorie: selectCategorie.value,
      luni: luniSelectate,
      discount: checkDiscount.checked,
      descriere: textareaDescriere.value.trim(),
      cheie1: document.getElementById("sortare-cheie-1") ? document.getElementById("sortare-cheie-1").value : "pret",
      cheie2: document.getElementById("sortare-cheie-2") ? document.getElementById("sortare-cheie-2").value : "nume",
      ordine: ordine || "asc"
    };

    try {
      var res = await fetch("/produse-ajax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody)
      });
      var data = await res.json();

      // stergem doar articolele, pastram paginarea/mesajele
      zonaProduse.querySelectorAll("article.produs-card").forEach(function(a) { a.remove(); });

      // adaugam html-ul generat de server
      zonaProduse.insertAdjacentHTML("afterbegin", data.html);

      // restabilim eventurile si starea de sters
      var noiArticole = zonaProduse.querySelectorAll("article.produs-card");
      var sterse = JSON.parse(sessionStorage.getItem("produseSterse") || "[]");

      noiArticole.forEach(function(art) {
        ataseazaEventuriActiuni(art);
        if (sterse.indexOf(art.id) !== -1) {
          art.classList.add("sters-sesiune");
          art.classList.add("ascuns-filtru");
        }
      });

      var msgLipsa = document.getElementById("mesaj-lipsa-produse");
      if (msgLipsa) {
        // Daca numarul de produse returnate (dupa ignorarea celor sterse) e 0, afisam msg
        var vizibile = 0;
        noiArticole.forEach(function(a) {
           if (!a.classList.contains("sters-sesiune")) vizibile++;
        });
        msgLipsa.style.display = vizibile === 0 ? "block" : "none";
      }

      aplicaPaginare(true);
    } catch (err) {
      console.error(err);
      alert("Eroare la filtrarea de pe server!");
    }
  }

  // ═══════════ RESETARE ═══════════
  function reseteazaFiltrele() {
    var raspuns = confirm("Esti sigur ca vrei sa resetezi toate filtrele? Se vor reafisa toate produsele in ordinea initiala.");
    if (!raspuns) return;

    // resetare inputuri
    inputNume.value = "";
    inputNume.classList.remove("is-invalid");
    inputPret.value = inputPret.max;
    pretVal.textContent = "(" + inputPret.max + ")";
    inputProducator.value = "";
    textareaDescriere.value = "";
    textareaDescriere.classList.remove("is-invalid");

    // resetare radio culoare la "toate"
    var radioToate = document.querySelector('input[name="filtru-culoare"][value="toate"]');
    if (radioToate) radioToate.checked = true;

    // resetare select multiplu — toate lunile selectate
    for (var i = 0; i < selectLuna.options.length; i++) {
      selectLuna.options[i].selected = true;
    }

    // resetare checkbox
    checkDiscount.checked = false;

    // resetare select simplu
    selectCategorie.value = "";

    // resetare clase si afisare toate produsele
    var articole = zonaProduse.querySelectorAll("article.produs-card");
    articole.forEach(function (art) {
      // Daca e sters pe sesiune, ramane ascuns
      if (!art.classList.contains("sters-sesiune")) {
        art.classList.remove("ascuns-filtru");
      }
    });

    var msgLipsa = document.getElementById("mesaj-lipsa-produse");
    if (msgLipsa) {
      msgLipsa.style.display = "none";
    }

    // restaurare ordine initiala
    ordineInitiala.forEach(function (id) {
      var art = document.getElementById(id);
      if (art) zonaProduse.appendChild(art);
    });

    aplicaPaginare(true);
  }

  // ═══════════ EVENTURI BUTOANE PRINCIPALE ═══════════
  btnFiltreaza.addEventListener("click", filtreazaProduse);
  btnSortAsc.addEventListener("click", function () { sorteazaProduse("asc"); });
  btnSortDesc.addEventListener("click", function () { sorteazaProduse("desc"); });
  btnCalc.addEventListener("click", calculeazaMedia);
  btnReset.addEventListener("click", reseteazaFiltrele);

  // ═══════════ BONUS 6 & 11: BUTOANE SI MODAL PRODUSE ═══════════
  var modalDOM = document.getElementById("modalProdus");
  var modalBoot = modalDOM ? new bootstrap.Modal(modalDOM) : null;

  function ataseazaEventuriActiuni(art) {
    var btnPin = art.querySelector(".btn-pin");
    var btnHideTemp = art.querySelector(".btn-hide-temp");
    var btnHideSession = art.querySelector(".btn-hide-session");

    if (btnPin) {
      btnPin.addEventListener("click", function(e) {
        e.stopPropagation(); // Prevenim deschiderea modalului
        art.classList.toggle("produs-pinned");
        btnPin.classList.toggle("btn-success");
        btnPin.classList.toggle("btn-outline-success");
        if (!(toggleServerSide && toggleServerSide.checked)) {
          filtreazaProduse();
        }
      });
    }

    if (btnHideTemp) {
      btnHideTemp.addEventListener("click", function(e) {
        e.stopPropagation();
        art.classList.add("ascuns-filtru");
        aplicaPaginare(true);
      });
    }

    if (btnHideSession) {
      btnHideSession.addEventListener("click", function(e) {
        e.stopPropagation();
        art.classList.add("sters-sesiune");
        art.classList.add("ascuns-filtru");
        
        var sterse = JSON.parse(sessionStorage.getItem("produseSterse") || "[]");
        if (sterse.indexOf(art.id) === -1) {
          sterse.push(art.id);
          sessionStorage.setItem("produseSterse", JSON.stringify(sterse));
        }

        aplicaPaginare(true);
      });
    }

    // Bonus 11: Deschidere Modal la click pe card
    art.addEventListener("click", function (e) {
      // Daca a facut click pe un link (titlu, poza), prevenim redirect-ul
      var a = e.target.closest("a");
      if (a) e.preventDefault();

      if (!modalBoot) return;

      // Preluare date din DOM-ul articolului
      var nume = art.querySelector(".produs-heading").textContent;
      var imagine = art.querySelector(".produs-imagine").src;
      var categorie = art.getAttribute("data-categorie");
      var pret = art.getAttribute("data-pret");
      var culoare = art.getAttribute("data-culoare");
      var producator = art.getAttribute("data-producator");
      var livrare = art.getAttribute("data-livrare") === "1" ? "Da (Gratuit)" : "Nu";
      var ingrediente = art.getAttribute("data-ingrediente") || "Nespecificat";
      var descriere = art.querySelector(".produs-descriere").textContent;

      // Injectare in Modal
      document.getElementById("modalNume").textContent = nume;
      document.getElementById("modalImagine").src = imagine;
      document.getElementById("modalCategorie").textContent = categorie;
      document.getElementById("modalPret").textContent = pret + " lei";
      document.getElementById("modalDescriere").textContent = descriere;
      document.getElementById("modalCuloare").textContent = culoare;
      document.getElementById("modalProducator").textContent = producator;
      document.getElementById("modalLivrare").textContent = livrare;
      document.getElementById("modalMateriale").textContent = ingrediente;

      modalBoot.show();
    });
  }

  articole.forEach(ataseazaEventuriActiuni);

  // ═══════════ BONUS 4: FILTRARE AUTOMATA ONCHANGE ═══════════
  var elementeFiltrare = [
    inputNume, 
    inputPret, 
    inputProducator, 
    selectLuna, 
    checkDiscount, 
    selectCategorie, 
    textareaDescriere
  ];

  var selectCheie1 = document.getElementById("sortare-cheie-1");
  var selectCheie2 = document.getElementById("sortare-cheie-2");

  elementeFiltrare.forEach(function(el) {
    if (el) {
      el.addEventListener("change", filtreazaProduse);
      // Pentru o experienta mai fluida la range/text, putem asculta si keyup,
      // dar "change" respecta strict cerinta si evita spam-ul de alert-uri la validare gresita.
    }
  });

  if (selectCheie1) selectCheie1.addEventListener("change", function() {
    // doar sortam din nou crescator ca default cand schimba cheia
    sorteazaProduse("asc");
  });
  if (selectCheie2) selectCheie2.addEventListener("change", function() {
    sorteazaProduse("asc");
  });

  var radioCulori = document.querySelectorAll('input[name="filtru-culoare"]');
  radioCulori.forEach(function(radio) {
    radio.addEventListener("change", filtreazaProduse);
  });

  // initializare paginare la incarcare
  aplicaPaginare(true);
});
