const sidebarSelect = document.getElementById("sidebarPosition");
const themeUpload = document.getElementById("themeUpload");
const settingsStatus = document.getElementById("settingsStatus");
const sidebar = document.querySelector(".sidebar");
const toggleButton = document.getElementById("side_btn");

let sidebarOpen = false;

function syncToggleButton() {
  if (window.sidebarModule?.syncSidebarUI) {
    window.sidebarModule.syncSidebarUI();
    return;
  }

  if (!toggleButton || !sidebar) return;

  const currentPosition = sidebar.classList.contains("left") ? "left" : "right";
  const isOpen = sidebar.classList.contains("show");

  toggleButton.textContent = isOpen ? ">" : "<";

  if (currentPosition === "left") {
    toggleButton.style.left = isOpen ? "260px" : "10px";
    toggleButton.style.right = "auto";
  } else {
    toggleButton.style.right = isOpen ? "260px" : "10px";
    toggleButton.style.left = "auto";
  }
}

function toggleSidebar() {
  if (window.sidebarModule?.toggleSidebar) {
    window.sidebarModule.toggleSidebar();
    return;
  }

  sidebarOpen = !sidebarOpen;

  if (sidebar) {
    sidebar.classList.toggle("show", sidebarOpen);
    document.body.classList.toggle("sidebar-open", sidebarOpen);
  }

  syncToggleButton();
}

function setStatus(message, isError = false) {
  if (!settingsStatus) return;

  settingsStatus.textContent = message;
  settingsStatus.className = `settings-status ${isError ? "error" : "success"}`;
}

function applySidebarPosition(position) {
  const safePosition = position === "left" ? "left" : "right";

  if (window.sidebarModule?.applySidebarPosition) {
    window.sidebarModule.applySidebarPosition(safePosition, { persist: true });
  } else {
    document.body.classList.remove("sidebar-left", "sidebar-right");
    document.body.classList.add(`sidebar-${safePosition}`);
    localStorage.setItem("sidebarPosition", safePosition);

    if (sidebar) {
      sidebar.classList.remove("left", "right");
      sidebar.classList.add(safePosition);
    }
  }

  if (sidebarSelect) {
    sidebarSelect.value = safePosition;
  }

  if (toggleButton) {
    toggleButton.classList.toggle("left-position", safePosition === "left");
    syncToggleButton();
  }
}

function loadSettings() {
  const savedPosition = localStorage.getItem("sidebarPosition") || "right";
  applySidebarPosition(savedPosition);
  setStatus("Settings loaded.");
}

if (sidebarSelect) {
  sidebarSelect.addEventListener("change", (event) => {
    applySidebarPosition(event.target.value);
    setStatus("Sidebar position saved.");
  });
}

if (toggleButton) {
  toggleButton.addEventListener("click", () => {
    const sidebarIsOpen = sidebar?.classList.contains("show");
    sidebar?.classList.toggle("show", !sidebarIsOpen);
    document.body.classList.toggle("sidebar-open", !sidebarIsOpen);

    if (window.MiniCord?.sidebar?.setOpen) {
      window.MiniCord.sidebar.setOpen(!sidebarIsOpen);
    }

    syncToggleButton();
  });
}

if (sidebar) {
  const sidebarButtons = sidebar.querySelectorAll("button");
  sidebarButtons.forEach((button) => {
    if (button.id === "settings") {
      button.addEventListener("click", () => {
        window.location.href = "../Pages/settings.html";
      });
    } else if (button.id === "servers") {
      button.addEventListener("click", () => {
        window.location.href = "../Pages/server_selection.html";
      });
    } else if (button.id === "thememarketplace") {
      button.addEventListener("click", () => {
        window.location.href = "../Pages/theme_marketplace.html";
      });
    } else if (button.id === "logout") {
      button.addEventListener("click", () => {
        localStorage.removeItem("user");
        localStorage.removeItem("current_server");
        localStorage.removeItem("Tos");
        window.location.href = "../Pages/SignIn.html";
      });
    }
  });
}

if (themeUpload) {
  themeUpload.addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const isCSS =
      file.name.toLowerCase().endsWith(".css") ||
      file.type === "text/css";

    if (!isCSS) {
      setStatus("Please choose a CSS file.", true);
      themeUpload.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      const css = e.target.result;
      const styleId = "customTheme";
      let style = document.getElementById(styleId);

      if (!style) {
        style = document.createElement("style");
        style.id = styleId;
        document.head.appendChild(style);
      }

      style.textContent = css;
      localStorage.setItem("customTheme", css);
      setStatus("Theme applied successfully.");
    };

    reader.onerror = function () {
      setStatus("Unable to read the selected theme file.", true);
    };

    reader.readAsText(file);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  syncToggleButton();

  if (sidebar && toggleButton) {
    sidebar.classList.remove("show");
    document.body.classList.remove("sidebar-open");
    sidebarOpen = false;
    syncToggleButton();
  }
});

window.addEventListener("beforeunload", () => {
  if (window.sidebarModule?.setSidebarOpen) {
    window.sidebarModule.setSidebarOpen(false);
  } else if (sidebar) {
    sidebar.classList.remove("show");
    document.body.classList.remove("sidebar-open");
    sidebarOpen = false;
  }
});
