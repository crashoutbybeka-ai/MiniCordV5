const supabaseClient = window.supabaseClient || window.supabase.createClient(
    "https://iihprbgorfnjfyrlglfh.supabase.co",
    "sb_publishable_3XKBpQ9iB3RAj96tZMnTfA_FaqAPB77"
);


const button = document.getElementById("submit_name");

// ==============================
// Supabase Auth Check
// ==============================

async function isSignedIn() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Auth session error:", error);
      return false;
    }

    return Boolean(data.session);

  } catch (error) {
    console.error("Auth check failed:", error);
    return false;
  }
}


// ==============================
// Continue Button
// ==============================

button.addEventListener("click", async function () {

  localStorage.setItem("Tos", "agreed");

  const signedIn = await isSignedIn();

  if (signedIn) {
    window.location.href = "../Pages/server_selection.html";
  } else {
    window.location.href = "../Pages/SignIn.html";
  }

});