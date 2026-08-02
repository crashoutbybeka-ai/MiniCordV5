(function () {
  const root = window;

  root.MiniCord = root.MiniCord || {};
  root.MiniCord.state = root.MiniCord.state || { initialized: {} };

  function initOnce(name, callback) {
    if (root.MiniCord.state.initialized[name]) {
      return false;
    }

    root.MiniCord.state.initialized[name] = true;

    if (typeof callback === "function") {
      callback();
    }

    return true;
  }

  function getSupabaseClient() {
    if (root.supabaseClient && typeof root.supabaseClient === "object") {
      return root.supabaseClient;
    }

    if (root.supabase && typeof root.supabase.createClient === "function") {
      root.supabaseClient = root.supabase.createClient(
        "https://iihprbgorfnjfyrlglfh.supabase.co",
        "sb_publishable_3XKBpQ9iB3RAj96tZMnTfA_FaqAPB77"
      );
      return root.supabaseClient;
    }

    throw new Error("Supabase client is not available.");
  }

  const sidebarState = {
    open: false,
    position: "right"
  };

  function initMouseInteraction() {
    const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return;
    }

    const rootElement = document.documentElement;
    const body = document.body;

    if (!body) {
      return;
    }

    body.classList.add("mouse-interactive");

    let frame = null;

    const updatePointer = (event) => {
      if (frame) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth) * 100;
        const y = (event.clientY / window.innerHeight) * 100;

        rootElement.style.setProperty("--pointer-x", `${x}%`);
        rootElement.style.setProperty("--pointer-y", `${y}%`);
        body.classList.add("pointer-moving");
      });
    };

    document.addEventListener("mousemove", updatePointer, { passive: true });
    document.addEventListener("mouseleave", () => body.classList.remove("pointer-moving"), { passive: true });
    window.addEventListener("blur", () => body.classList.remove("pointer-moving"), { passive: true });

    // NOTE: Small interactive controls (buttons) are intentionally
    // excluded here. The 3D tilt effect recalculates rotation on
    // every mousemove based on cursor position relative to the
    // element's own bounding box. On small elements, tiny mouse
    // movements translate into large relative-position swings,
    // and with no transition/easing on the transform, it snaps
    // instantly frame-to-frame instead of smoothing -- which reads
    // as jittering/shaking. Cards are large enough that the same
    // math produces a subtle, smooth-looking tilt instead.
    const tiltTargets = Array.from(
      document.querySelectorAll(".auth-card, .page-card, .settings-card, .serverButton, .message")
    );

    let tiltFrame = null;

    tiltTargets.forEach((element) => {
      element.classList.add("mouse-tilt");
      element.style.transition = "transform 0.15s ease-out";

      element.addEventListener("mousemove", (event) => {
        if (tiltFrame) {
          cancelAnimationFrame(tiltFrame);
        }

        tiltFrame = requestAnimationFrame(() => {
          const rect = element.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width;
          const py = (event.clientY - rect.top) / rect.height;
          const rotateX = ((0.5 - py) * 1.5).toFixed(2);
          const rotateY = ((px - 0.5) * 1.5).toFixed(2);

          element.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
        });
      }, { passive: true });

      element.addEventListener("mouseleave", () => {
        if (tiltFrame) {
          cancelAnimationFrame(tiltFrame);
        }
        element.style.transform = "";
      });
    });
  }

  function setSidebarOpen(open) {
    sidebarState.open = Boolean(open);

    const sidebar = document.querySelector(".sidebar");
    const toggleButton = document.getElementById("side_btn");

    if (sidebar) {
      sidebar.classList.toggle("show", sidebarState.open);
      document.body.classList.toggle("sidebar-open", sidebarState.open);
    }

    if (toggleButton) {
      toggleButton.textContent = sidebarState.open ? ">" : "<";
    }

    syncSidebarUI();
    return sidebarState.open;
  }

  function toggleSidebar() {
    return setSidebarOpen(!sidebarState.open);
  }

  function applySidebarPosition(position, options = {}) {
    const safePosition = position === "left" ? "left" : "right";
    sidebarState.position = safePosition;

    document.body.classList.remove("sidebar-left", "sidebar-right");
    document.body.classList.add(`sidebar-${safePosition}`);

    const sidebar = document.querySelector(".sidebar");
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

  function syncSidebarUI() {
    const toggleButton = document.getElementById("side_btn");
    const sidebar = document.querySelector(".sidebar");

    if (!toggleButton || !sidebar) {
      return;
    }

    toggleButton.textContent = sidebarState.open ? ">" : "<";

    if (sidebarState.position === "left") {
      toggleButton.style.left = sidebarState.open ? "260px" : "10px";
      toggleButton.style.right = "auto";
    } else {
      toggleButton.style.right = sidebarState.open ? "260px" : "10px";
      toggleButton.style.left = "auto";
    }

    toggleButton.classList.toggle("left-position", sidebarState.position === "left");
  }

  function getPageName() {
    return window.location.pathname.split("/").pop() || "unknown";
  }

  root.MiniCord.initOnce = initOnce;
  root.MiniCord.getSupabaseClient = getSupabaseClient;
  root.MiniCord.getPageName = getPageName;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      root.MiniCord.initOnce("mouseInteraction", initMouseInteraction);
    });
  } else {
    root.MiniCord.initOnce("mouseInteraction", initMouseInteraction);
  }
  root.MiniCord.sidebar = {
    state: sidebarState,
    applyPosition: applySidebarPosition,
    setOpen: setSidebarOpen,
    toggle: toggleSidebar,
    sync: syncSidebarUI
  };
})();