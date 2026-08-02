let sidebarState = {
  open: false,
  position: "right"
};

function getSidebarElements() {
  return {
    sidebar: document.querySelector(".sidebar"),
    toggleButton: document.getElementById("side_btn"),
    serverButton: document.getElementById("servers"),
    settingButton: document.getElementById("settings"),
    marketplaceButton: document.getElementById("thememarketplace"),
    logoutButton: document.getElementById("logout")
  };
}

function syncSidebarUI() {
  const { sidebar, toggleButton } = getSidebarElements();

  if (!toggleButton || !sidebar) {
    return;
  }

  if (sidebarState.position === "left") {
    toggleButton.textContent = sidebarState.open ? "<" : ">";
  } else {
    toggleButton.textContent = sidebarState.open ? ">" : "<";
  }

  if (sidebarState.position === "left") {
    toggleButton.style.left = sidebarState.open ? "260px" : "10px";
    toggleButton.style.right = "auto";
  } else {
    toggleButton.style.right = sidebarState.open ? "260px" : "10px";
    toggleButton.style.left = "auto";
  }

  toggleButton.classList.toggle("left-position", sidebarState.position === "left");
}

function applySidebarPosition(position, options = {}) {
  const safePosition = position === "left" ? "left" : "right";
  sidebarState.position = safePosition;

  document.body.classList.remove("sidebar-left", "sidebar-right");
  document.body.classList.add(`sidebar-${safePosition}`);

  const { sidebar } = getSidebarElements();
  if (sidebar) {
    sidebar.classList.remove("left", "right");
    sidebar.classList.add(safePosition);
  }

  if (options.persist !== false) {
    localStorage.setItem("sidebarPosition", safePosition);
  }

  syncSidebarUI();
  return safePosition;
}

function setSidebarOpen(open) {
  sidebarState.open = Boolean(open);

  const { sidebar } = getSidebarElements();
  if (sidebar) {
    sidebar.classList.toggle("show", sidebarState.open);
  }

  document.body.classList.toggle("sidebar-open", sidebarState.open);
  syncSidebarUI();
  return sidebarState.open;
}

function toggleSidebar() {
  return setSidebarOpen(!sidebarState.open);
}

function bindSidebar() {
  const { sidebar, toggleButton, serverButton, settingButton, marketplaceButton, logoutButton } = getSidebarElements();

  if (toggleButton && sidebar) {
    toggleButton.addEventListener("click", () => {
      toggleSidebar();
    });
  }

  if (serverButton) {
    serverButton.addEventListener("click", () => {
      window.location.href = "../Pages/server_selection.html";
    });
  }

  if (settingButton) {
    settingButton.addEventListener("click", () => {
      window.location.href = "../Pages/settings.html";
    });
  }

  if (marketplaceButton) {
    marketplaceButton.addEventListener("click", () => {
      window.location.href = "../Pages/theme_marketplace.html";
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {

      try {
        if (window.supabaseClient) {
          const { error } = await window.supabaseClient.auth.signOut();

          if (error) {
            console.error("Supabase sign out failed:", error);
          }
        } else {
          console.warn("supabaseClient not found on window; skipping session sign out.");
        }
      } catch (err) {
        console.error("Unexpected error during sign out:", err);
      }

      localStorage.removeItem("user");
      localStorage.removeItem("current_server");
      localStorage.removeItem("Tos");
      window.location.href = "../Pages/SignIn.html";
    });
  }

  const savedPosition = localStorage.getItem("sidebarPosition") || "right";
  applySidebarPosition(savedPosition, { persist: false });
  setSidebarOpen(false);
  syncSidebarUI();
}

export {
  applySidebarPosition,
  setSidebarOpen,
  toggleSidebar,
  syncSidebarUI,
  bindSidebar,
  sidebarState
};

if (typeof window !== "undefined") {
  window.sidebarModule = {
    applySidebarPosition,
    setSidebarOpen,
    toggleSidebar,
    syncSidebarUI,
    bindSidebar,
    sidebarState
  };
}