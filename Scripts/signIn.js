// Ensure the Supabase library has been loaded before this script.
if (!window.supabase) {
  throw new Error(
    "Supabase JS library is not loaded. Make sure you included https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2 before this script."
  );
}

const supabaseClient = window.supabaseClient;


const AUTH_REDIRECT_SKIP_KEY = "suppressAuthRedirect";

function shouldSkipAuthRedirect() {
  return sessionStorage.getItem(AUTH_REDIRECT_SKIP_KEY) === "true";
}

function setSkipAuthRedirect(value) {
  if (value) {
    sessionStorage.setItem(AUTH_REDIRECT_SKIP_KEY, "true");
  } else {
    sessionStorage.removeItem(AUTH_REDIRECT_SKIP_KEY);
  }
}

// ----------------------------
// Helper Functions
// ----------------------------

function getLoadingScreen() {
  return document.getElementById("loadingScreen");
}

function showLoading() {
  const loadingScreen = getLoadingScreen();
  if (loadingScreen) {
    loadingScreen.style.display = "flex";
  }
}

function hideLoading() {
  const loadingScreen = getLoadingScreen();
  if (loadingScreen) {
    loadingScreen.style.display = "none";
  }
}

function goToApp() {
  if (shouldSkipAuthRedirect()) {
    setSkipAuthRedirect(false);
    return;
  }

  window.location.replace("../Pages/server_selection.html");
}

function isAuthPage() {
  const path = window.location.pathname.toLowerCase();
  return path.endsWith("/signin.html") || path.endsWith("/signup.html");
}

function getOAuthRedirectUrl() {
  const path = window.location.pathname.toLowerCase();

  if (path.endsWith("/signup.html")) {
    return window.location.origin + "/Pages/SignUp.html";
  }

  return window.location.origin + "/Pages/SignIn.html";
}

// ----------------------------
// Sign Out
// ----------------------------

async function signOut() {
  setSkipAuthRedirect(true);

  try {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Sign out failed:", error.message);
      alert(error.message);
      setSkipAuthRedirect(false);
      return;
    }

    console.log("Signed out successfully!");

    localStorage.removeItem("user");
    localStorage.removeItem("current_server");
    localStorage.removeItem("Tos");

    window.location.replace("../Pages/SignIn.html");
  } catch (err) {
    console.error("Sign out failed:", err);
    setSkipAuthRedirect(false);
    alert("Failed to sign out.");
  }
}

// ----------------------------
// Google OAuth
// ----------------------------

async function signInWithGoogle() {
  showLoading();

  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getOAuthRedirectUrl()
      }
    });

    if (error) {
      hideLoading();
      console.error("Google login failed:", error.message);
      alert(error.message);
    }
  } catch (err) {
    hideLoading();
    console.error("Google login failed:", err);
    alert("Unable to start Google sign-in.");
  }
}

// ----------------------------
// Email Login
// ----------------------------

async function signInWithEmailPassword(email, password) {
  showLoading();

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    hideLoading();
    console.error("Email login failed:", error.message);
    alert(error.message);
    return;
  }

  console.log("Logged in successfully!");

  setTimeout(() => {
    goToApp();
  }, 1500);
}

// ----------------------------
// Email Sign Up
// ----------------------------

async function signUpWithEmailPassword(email, password, DisplayName) {
  showLoading();

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: DisplayName || null
      }
    }
  });

  if (error) {
    hideLoading();
    console.error("Email sign-up failed:", error.message);
    alert(error.message);
    return;
  }

  console.log("Account created successfully!");

  setTimeout(() => {
    goToApp();
  }, 1500);
}

// ----------------------------
// Session Check
// ----------------------------

async function checkAuthStatus() {
  if (!isAuthPage()) {
    return;
  }

  if (shouldSkipAuthRedirect()) {
    console.log("Skipping automatic redirect after sign-out.");
    setSkipAuthRedirect(false);
    return;
  }

  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error) {
    console.error(error.message);
    return;
  }

  if (session?.user) {
    const user = session.user;

    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email;

    console.log(`Already signed in as ${displayName}`);

    showLoading();

    setTimeout(() => {
      goToApp();
    }, 1500);
  } else {
    console.log("No active user session.");
  }
}

// ----------------------------
// Listen for OAuth completion
// ----------------------------

supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log("Auth Event:", event);

  if (!isAuthPage()) {
    return;
  }

  if (shouldSkipAuthRedirect()) {
    if (event === "SIGNED_OUT") {
      setSkipAuthRedirect(false);
    }
    return;
  }

  if (
    (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
    session
  ) {
    showLoading();

    setTimeout(() => {
      goToApp();
    }, 1000);
  }
});

// ----------------------------
// DOM Ready
// ----------------------------

document.addEventListener("DOMContentLoaded", () => {
  if (!isAuthPage()) {
    return;
  }

  // Google buttons
  const googleSignInBtn = document.getElementById("googleSignInBtn");
  const googleSignUpBtn = document.getElementById("googleSignUpBtn");

  if (googleSignInBtn) {
    googleSignInBtn.addEventListener("click", signInWithGoogle);
  }

  if (googleSignUpBtn) {
    googleSignUpBtn.addEventListener("click", signInWithGoogle);
  }

  // Login form
  const loginForm = document.getElementById("signInForm");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Prefer unique IDs
      const email =
        document.getElementById("loginEmail")?.value ??
        document.getElementById("email")?.value;

      const password =
        document.getElementById("loginPassword")?.value ??
        document.getElementById("password")?.value;

      signInWithEmailPassword(email, password);
    });
  }

  // Signup form
  const signUpForm = document.getElementById("signUpForm");

  if (signUpForm) {
    signUpForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const email =
        document.getElementById("signupEmail")?.value ??
        document.getElementById("email")?.value;

      const password =
        document.getElementById("signupPassword")?.value ??
        document.getElementById("password")?.value;

      signUpWithEmailPassword(email, password);
    });
  }

  document.getElementById("googleSignUpBtn")?.addEventListener("click", signInWithGoogle);
  document.getElementById("signUpBtn")?.addEventListener("click", () => {
    const email = document.getElementById("signupEmail")?.value;
    const password = document.getElementById("signupPassword")?.value;
    const displayName = document.getElementById("displayName")?.value;

    if (email && password) {
      signUpWithEmailPassword(email, password, displayName);
    } else {
      alert("Please enter both email and password.");
    }
  });

  // Check for an existing session
  checkAuthStatus();
});

window.MiniCord = window.MiniCord || {};
window.MiniCord.signOut = signOut;
window.MiniCord.auth = {
  signInWithGoogle,
  signInWithEmailPassword,
  signUpWithEmailPassword,
  signOut,
  checkAuthStatus
};