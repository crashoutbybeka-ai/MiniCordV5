(function () {
  const STORAGE_KEY = "sharedThemes";
  const THEME_TABLE = "user_themes";
  const statusEl = document.getElementById("marketplaceStatus");
  const themeListEl = document.getElementById("themeList");
  const uploadInput = document.getElementById("themeUpload");
  const applyButton = document.getElementById("applySharedTheme");
  const backButton = document.getElementById("backToSettings");
  let selectedTheme = null;

  function setStatus(message, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `settings-status ${isError ? "error" : "success"}`;
  }

  function getStoredThemes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn("Unable to read local themes:", err);
      return [];
    }
  }

  function saveStoredThemes(themes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
  }

  function renderThemes(themes) {
    if (!themeListEl) return;

    themeListEl.innerHTML = "";

    if (!themes.length) {
      const empty = document.createElement("p");
      empty.textContent = "No shared themes yet. Upload one to get started.";
      empty.className = "empty";
      themeListEl.appendChild(empty);
      return;
    }

    themes.forEach((theme) => {
      const card = document.createElement("div");
      card.className = "theme-card";
      card.dataset.themeId = theme.id || theme.name || theme.css;
      if (selectedTheme && (selectedTheme.id || selectedTheme.name || selectedTheme.css) === (theme.id || theme.name || theme.css)) {
        card.classList.add("active");
      }

      const title = document.createElement("h3");
      title.textContent = theme.name || "Untitled theme";

      const meta = document.createElement("p");
      const author = theme.author || "Unknown author";
      const created = theme.created_at ? new Date(theme.created_at).toLocaleDateString() : "Recently shared";
      meta.textContent = `${author} • ${created}`;

      card.addEventListener("click", () => {
        selectedTheme = theme;
        renderThemes(themes);
        setStatus(`Selected ${theme.name || "theme"}.`);
      });

      const actions = document.createElement("div");
      actions.className = "theme-actions";

      const preview = document.createElement("button");
      preview.textContent = "Preview";
      preview.addEventListener("click", () => {
        applyTheme(theme.css || "", theme.name || "Untitled theme");
      });

      const download = document.createElement("button");
      download.textContent = "Download";
      download.addEventListener("click", () => {
        downloadTheme(theme);
      });

      actions.appendChild(preview);
      actions.appendChild(download);

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(actions);
      themeListEl.appendChild(card);
    });
  }

  function applyTheme(css, name) {
    if (!css) {
      setStatus("That theme does not contain any CSS.", true);
      return;
    }

    let style = document.getElementById("customTheme");
    if (!style) {
      style = document.createElement("style");
      style.id = "customTheme";
      document.head.appendChild(style);
    }

    style.textContent = css;
    localStorage.setItem("customTheme", css);
    localStorage.setItem("customThemeName", name || "Shared theme");
    setStatus(`Applied ${name || "theme"}.`);
  }

  function downloadTheme(theme) {
    const blob = new Blob([theme.css || ""], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(theme.name || "theme").toLowerCase().replace(/\s+/g, "-") || "theme"}.css`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus(`Downloaded ${theme.name || "theme"}.`);
  }

  async function loadThemes() {
    try {
      const { data, error } = await window.supabaseClient
        .from(THEME_TABLE)
        .select("id, name, css, author, created_at, owner_id")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const merged = [...(data || []), ...getStoredThemes()];
      const seen = new Set();
      const unique = [];

      merged.forEach((entry) => {
        const key = entry.id || entry.name || entry.css;
        if (!key || seen.has(key)) return;
        seen.add(key);
        unique.push(entry);
      });

      saveStoredThemes(unique);
      renderThemes(unique);
      setStatus("Themes loaded.");
    } catch (err) {
      console.warn("Unable to load shared themes from Supabase, using local storage fallback:", err);
      const fallbackThemes = getStoredThemes();
      renderThemes(fallbackThemes);
      setStatus("Using locally saved themes.", false);
    }
  }

  async function uploadTheme(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".css") && file.type !== "text/css") {
      setStatus("Please choose a CSS file.", true);
      return;
    }

    const css = await file.text();
    const themeName = window.prompt("Name this theme", file.name.replace(/\.css$/i, "")) || file.name.replace(/\.css$/i, "");

    try {
      const { data: authData } = await window.supabaseClient.auth.getUser();
      const currentUser = authData?.user || null;
      const author = currentUser?.email || "anonymous";
      const ownerId = currentUser?.id || null;
      const payload = { name: themeName, css, author, owner_id: ownerId };

      const { data, error } = await window.supabaseClient
        .from(THEME_TABLE)
        .insert(payload)
        .select("id, name, css, author, created_at, owner_id")
        .single();

      if (error) throw error;

      const themes = getStoredThemes();
      themes.unshift({ ...(data || payload), id: data?.id || `local-${Date.now()}` });
      saveStoredThemes(themes);
      renderThemes(themes);
      setStatus(`Uploaded ${themeName}.`);
    } catch (err) {
      console.warn("Unable to upload theme to Supabase; saving locally instead:", err);
      const themes = getStoredThemes();
      themes.unshift({ id: `local-${Date.now()}`, name: themeName, css, author: "local" });
      saveStoredThemes(themes);
      renderThemes(themes);
      setStatus(`Saved ${themeName} locally.`, false);
    }
  }

  if (uploadInput) {
    uploadInput.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) {
        uploadTheme(file);
        uploadInput.value = "";
      }
    });
  }

  if (applyButton) {
    applyButton.addEventListener("click", () => {
      if (!selectedTheme) {
        setStatus("Select a theme first by clicking a card.", true);
        return;
      }

      applyTheme(selectedTheme.css || "", selectedTheme.name || "Untitled theme");
    });
  }

  if (backButton) {
    backButton.addEventListener("click", () => {
      window.location.href = "../Pages/settings.html";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadThemes();
  });
})();
