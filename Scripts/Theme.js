(function () {
  if (!window.MiniCord) {
    return;
  }

  function applySavedTheme() {
    const savedTheme = localStorage.getItem("customTheme");

    if (savedTheme) {
      let style = document.getElementById("customTheme");
      if (!style) {
        style = document.createElement("style");
        style.id = "customTheme";
        document.head.appendChild(style);
      }
      style.textContent = savedTheme;
    }
  }

  function bindThemeUpload() {
    const themeUpload = document.getElementById("themeUpload");
    if (!themeUpload) {
      return;
    }

    themeUpload.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const isCSS =
        file.name.toLowerCase().endsWith(".css") ||
        file.type === "text/css";

      if (!isCSS) {
        alert("Only CSS theme files are allowed.");
        themeUpload.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        const css = e.target.result;
        let style = document.getElementById("customTheme");

        if (!style) {
          style = document.createElement("style");
          style.id = "customTheme";
          document.head.appendChild(style);
        }

        style.textContent = css;
        localStorage.setItem("customTheme", css);
        alert("Theme applied!");
      };

      reader.readAsText(file);
    });
  }

  window.MiniCord.initOnce("theme", () => {
    applySavedTheme();
    bindThemeUpload();
  });

  document.addEventListener("DOMContentLoaded", () => {
    window.MiniCord.initOnce("theme", () => {
      applySavedTheme();
      bindThemeUpload();
    });
  });
})();