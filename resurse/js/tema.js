document.addEventListener("DOMContentLoaded", function () {
  const themeSelect = document.getElementById("themeSelect");

  // Citim tema salvata din localStorage, default 'light'
  let currentTheme = localStorage.getItem("tema") || "light";

  // Functie pentru a aplica tema
  function applyTheme(theme) {
    document.body.className = ""; // curatam clasele
    if (theme === "dark" || theme === "ocean") {
      document.documentElement.setAttribute("data-bs-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-bs-theme", "light");
    }
    document.body.classList.add("theme-" + theme);
    if(themeSelect) {
      themeSelect.value = theme;
    }
  }

  // Aplicam tema initiala la incarcarea paginii
  applyTheme(currentTheme);

  // Ascultam schimbarile pe select
  if (themeSelect) {
    themeSelect.addEventListener("change", function () {
      let theme = themeSelect.value;
      localStorage.setItem("tema", theme);
      applyTheme(theme);
    });
  }
});

// Pentru a evita flash-ul de continut, aplicam tema imediat (in afara DOMContentLoaded)
(function() {
  let theme = localStorage.getItem("tema");
  if (theme === "dark") {
    document.documentElement.setAttribute("data-bs-theme", "dark");
    document.documentElement.classList.add("dark-theme"); // optional fallback
  }
})();
