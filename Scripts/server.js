// ==============================
// Supabase
// ==============================

if (!window.supabase) {
    throw new Error(
        "Supabase JS library is not loaded. Make sure you included the Supabase CDN before this script."
    );
}

const db = window.supabaseClient || window.supabase.createClient(
    "https://iihprbgorfnjfyrlglfh.supabase.co",
    "sb_publishable_3XKBpQ9iB3RAj96tZMnTfA_FaqAPB77"
);

// ==============================
// Constants
// ==============================

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getCurrentUserIdentity() {
    try {
        const { data: { user }, error } = await db.auth.getUser();
        if (!error && user) {
            return {
                id: user.id || null,
                email: user.email || null
            };
        }
    } catch (err) {
        console.warn("Unable to load auth identity:", err);
    }

    try {
        const cached = localStorage.getItem("user");
        if (!cached) {
            return { id: null, email: null };
        }

        const parsed = JSON.parse(cached);
        return {
            id: parsed?.id || null,
            email: parsed?.email || null
        };
    } catch (err) {
        console.warn("Unable to read cached user identity:", err);
        return { id: null, email: null };
    }
}

function isServerVisible() {
    return true;
}

// ==============================
// Load Servers
// ==============================

async function loadServers() {
    try {
        const container = document.getElementById("serverList");

        if (!container) {
            console.error("Could not find #serverList");
            return;
        }

        const currentUser = await getCurrentUserIdentity();

        const { data, error } = await db
            .from("servers")
            .select("id, name")
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Failed to load servers:", error);
            alert("Failed to load servers.\n\n" + error.message);
            return;
        }

        container.innerHTML = "";

        const visibleServers = (data || []).filter(() => isServerVisible());

        if (!visibleServers.length) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No accessible servers available.";
            container.appendChild(emptyMessage);
            return;
        }

        visibleServers.forEach((server) => {
            const button = document.createElement("button");

            button.className = "serverButton";
            button.textContent = server.name;

            button.addEventListener("click", () => {
                joinServer(String(server.id).trim(), server.name);
            });

            container.appendChild(button);
        });

    } catch (err) {
        console.error("Unexpected error loading servers:", err);
        alert("An unexpected error occurred while loading servers.");
    }
}

// ==============================
// Join Server
// ==============================

function joinServer(serverId, serverName = "") {
    if (!serverId) {
        alert("Invalid server.");
        return;
    }

    const cleanedName = String(serverName || "").trim();
    localStorage.setItem("current_server", serverId);
    const nextUrl = new URL("../Pages/Messenger.html", window.location.href);
    nextUrl.searchParams.set("server", serverId);

    if (cleanedName) {
        nextUrl.searchParams.set("serverName", encodeURIComponent(cleanedName));
    }

    window.location.href = nextUrl.toString();
}

// ==============================
// Leave Server
// ==============================

function leaveServer() {
    localStorage.removeItem("current_server");
    window.location.href = "../Pages/server_selection.html";
}

// ==============================
// Create Server
// ==============================

async function createServer() {
    try {
        const serverName = prompt("Enter the name of the server you want to create:");

        if (serverName === null) {
            return;
        }

        const trimmedName = serverName.trim();

        if (!trimmedName) {
            alert("Server name cannot be empty.");
            return;
        }

        if (trimmedName.length > 50) {
            alert("Server names cannot exceed 50 characters.");
            return;
        }

        const createButton = document.getElementById("mod_server");

        if (createButton) {
            createButton.disabled = true;
        }

        const { data: existingServer, error: searchError } = await db
            .from("servers")
            .select("id")
            .ilike("name", trimmedName)
            .maybeSingle();

        if (searchError) {
            if (createButton) createButton.disabled = false;
            console.error(searchError);
            alert("Database Error\n\n" + searchError.message);
            return;
        }

        if (existingServer) {
            if (createButton) createButton.disabled = false;
            alert("A server with that name already exists.");
            return;
        }

        const { data, error } = await db
            .from("servers")
            .insert({ name: trimmedName })
            .select()
            .single();

        if (createButton) {
            createButton.disabled = false;
        }

        if (error) {
            console.error(error);
            alert("Failed to create server.\n\n" + error.message);
            return;
        }

        joinServer(data.id, trimmedName);

    } catch (err) {
        console.error(err);
        alert("An unexpected error occurred while creating the server.");
    }
}

// ==============================
// Join Server By ID
// ==============================

async function joinServerByID() {
    try {
        const serverId = prompt("Enter the server ID:");

        if (serverId === null) {
            return;
        }

        const trimmedId = serverId.trim();

        if (!trimmedId) {
            return;
        }

        if (!UUID_REGEX.test(trimmedId)) {
            alert("Please enter a valid server ID.");
            return;
        }

        const { data, error } = await db
            .from("servers")
            .select("id, name")
            .eq("id", trimmedId)
            .maybeSingle();

        if (error) {
            console.error(error);
            alert("Database Error\n\n" + error.message);
            return;
        }

        if (!data) {
            alert("Server not found.");
            return;
        }

        joinServer(data.id);

    } catch (err) {
        console.error(err);
        alert("An unexpected error occurred while joining the server.");
    }
}

// ==============================
// Initialize
// ==============================

document.addEventListener("DOMContentLoaded", () => {
    const createButton = document.getElementById("mod_server");
    const joinButton = document.getElementById("global_server");

    if (createButton) {
        createButton.addEventListener("click", createServer);
    }

    if (joinButton) {
        joinButton.addEventListener("click", joinServerByID);
    }

    loadServers();
});