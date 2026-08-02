// ==============================
// Supabase Configuration
// ==============================

if (!window.supabase) {
    throw new Error(
        "Supabase JS library is not loaded."
    );
}

const db = window.supabaseClient || window.supabase.createClient(
    "https://iihprbgorfnjfyrlglfh.supabase.co",
    "sb_publishable_3XKBpQ9iB3RAj96tZMnTfA_FaqAPB77"
);

// ==============================
// Current Server
// ==============================

function getCurrentServerId() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("server");

    if (fromUrl) {
        localStorage.setItem("current_server", fromUrl);
        return fromUrl;
    }

    return localStorage.getItem("current_server");
}

function getCurrentServerName() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("serverName");

    if (fromUrl) {
        try {
            return decodeURIComponent(fromUrl);
        } catch (_) {
            return fromUrl;
        }
    }

    return "";
}

const currentServer = getCurrentServerId();
const currentServerName = getCurrentServerName();

if (!currentServer) {
    alert("Please select a server.");

    window.location.href =
        "../Pages/server_selection.html";

     throw new Error("No server selected.");
}

// ==============================
// Sounds
// ==============================

const sfx = new Audio("../Assests/notification.mp3");
const send = new Audio("../Assests/send.mp3");

// ==============================
// Auth User
// ==============================

let authUser = null;

// ==============================
// User Tags
// ==============================

const userTags = {
    "Beka": "[Owner]",
    "Hunter": "[Executive Moderator]",
    "Brayden": "[Moderator]",
    "Jaxson": "[Moderator]"
};

// ==============================
// Emergency Reset Codes
// ==============================

const bitSecureKey = [
    "456423",
    "123456",
    "010101"
];

// ==============================
// Profanity Filter
// ==============================

const black_listed_words = [
    "Epstein",
    "Diddy",
    "daddy",
    "Niger",
    "Niggas",
    "Cum",
    "Fuck",
    "Nigger",
    "shit",
    "slut",
    "hoe",
    "whore"
];

// ==============================
// Message Cache
// ==============================

let loadedMessageIds = new Set();
let firstLoad = true;

// ==============================
// Helper Functions
// ==============================

function getDisplayName(name) {

    if (userTags[name]) {
        return `${userTags[name]} ${name}`;
    }

    return name;
}

function formatTime(dateString) {

    const date = new Date(dateString);

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

}

function checkFilteredWords(message) {

    return black_listed_words.some(word =>
        message.toLowerCase().includes(word.toLowerCase())
    );

}

function escapeHTML(text) {

    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;

}

// ==============================
// Link Detection
// ==============================
// Finds URLs inside a message and renders them as
// real, clickable <a> tags while leaving the rest
// of the message as plain text. Uses safe DOM APIs
// only (no innerHTML on user content), and blocks
// any protocol other than http/https to prevent
// javascript: URI injection.

const URL_REGEX = /((https?:\/\/|www\.)[^\s<>"']+)/gi;

function buildSafeUrl(rawUrl) {

    let href = rawUrl;

    if (!/^https?:\/\//i.test(href)) {
        href = "https://" + href;
    }

    try {
        const parsed = new URL(href);

        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return null;
        }

        return parsed.href;

    } catch (_) {
        return null;
    }

}

function renderMessageContent(container, text) {

    const safeText = text ?? "";

    URL_REGEX.lastIndex = 0;

    let lastIndex = 0;
    let match;

    while ((match = URL_REGEX.exec(safeText)) !== null) {

        if (match.index > lastIndex) {
            container.appendChild(
                document.createTextNode(safeText.slice(lastIndex, match.index))
            );
        }

        let rawUrl = match[0];
        let trailing = "";

        // Strip common trailing punctuation that's likely
        // part of the sentence, not the URL (e.g. "check this out: url.com!")
        const trailingMatch = rawUrl.match(/[),.!?;:]+$/);
        if (trailingMatch) {
            trailing = trailingMatch[0];
            rawUrl = rawUrl.slice(0, -trailing.length);
        }

        const safeHref = buildSafeUrl(rawUrl);

        if (safeHref) {

            const link = document.createElement("a");
            link.href = safeHref;
            link.textContent = rawUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.className = "messageLink";

            container.appendChild(link);

        } else {
            // Not a safe/valid URL after all, render as plain text.
            container.appendChild(document.createTextNode(rawUrl));
        }

        if (trailing) {
            container.appendChild(document.createTextNode(trailing));
        }

        lastIndex = match.index + match[0].length;

    }

    if (lastIndex < safeText.length) {
        container.appendChild(document.createTextNode(safeText.slice(lastIndex)));
    }

}

// ==============================
// Get Current Auth User
// ==============================

async function loadCurrentUser() {

    try {
        const {
            data: { user },
            error
        } = await db.auth.getUser();

        if (error || !user) {
            console.warn(
                "No authenticated user available.",
                error
            );
            return null;
        }

        authUser = user;
        return user;
    } catch (err) {
        console.warn("Unable to load auth user:", err);
        return null;
    }

}

async function ensureAuthUserReady() {
    if (!authUser?.id) {
        await loadCurrentUser();
    }
}

// ==============================
// Developer Information
// ==============================

async function showDeveloperInfo() {

    if (!authUser) return;

    const name =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email;

    // Only show developer info to developers

    if (
        name !== "Beka" &&
        name !== "Hunter"
    ) {
        return;
    }

    const devText =
        document.createElement("div");

    devText.style.position = "fixed";
    devText.style.bottom = "10px";
    devText.style.right = "10px";
    devText.style.fontFamily = "Comfortaa";
    devText.style.fontSize = "12px";
    devText.style.color = "gray";

    devText.innerHTML =
        `User ID: ${authUser.id}<br>
         Server ID: ${currentServer}`;

    document.body.appendChild(devText);

}

// ==============================
// Display Messages
// ==============================

function displayMessages(records) {

    const container = document.getElementById("messages");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!records || records.length === 0) {
        container.innerHTML =
            "<div class='empty'>No messages yet.</div>";
        return;
    }

    // Replace this with YOUR Supabase Auth UUID
    const OWNER_ID =
        "d98b9864-fba7-4113-84e5-af807c69174f";

    for (const record of records) {

        const isMine =
            authUser &&
            record.sender_id === authUser.id;

        const isOwner =
            authUser &&
            authUser.id === OWNER_ID;

        const canDelete =
            isMine || isOwner;

        const div =
            document.createElement("div");

        div.className =
            "message " +
            (isMine ? "sent" : "received");

        // ==========================
        // Sender
        // ==========================

        const senderDiv =
            document.createElement("div");

        senderDiv.className = "sender";
        senderDiv.style.fontWeight = "bold";

        senderDiv.textContent =
            record.sender_name || "Unknown";

        // ==========================
        // Message
        // ==========================

        const messageDiv =
            document.createElement("div");

        messageDiv.className = "messageText";

        renderMessageContent(messageDiv, record.message);

        // ==========================
        // Timestamp
        // ==========================

        const timestampDiv =
            document.createElement("div");

        timestampDiv.className =
            "timestamp";

        timestampDiv.textContent =
            formatTime(record.created_at);

        // ==========================
        // Delete Button
        // ==========================

        if (canDelete) {

            const deleteButton =
                document.createElement("button");

            deleteButton.className =
                "deleteMessageButton";

            deleteButton.textContent =
                "Delete";

            deleteButton.addEventListener(
                "click",
                () => deleteMessage(record.id)
            );

            div.appendChild(deleteButton);
        }

        div.appendChild(senderDiv);
        div.appendChild(messageDiv);
        div.appendChild(timestampDiv);

        container.appendChild(div);
    }

    container.scrollTop =
        container.scrollHeight;
}

// ==============================
// Delete Message
// ==============================

async function deleteMessage(messageId) {

    try {

        const { error } = await db
            .from("messages")
            .delete()
            .eq("id", messageId);

        if (error) {
            console.error("Failed to delete message:", error);
            alert("Unable to delete this message.");
            return;
        }

        await fetchAndDisplayRecords();

    } catch (err) {
        console.error(err);
        alert("Unable to delete this message.");
    }

}

// ==============================
// Load Messages
// ==============================

async function fetchAndDisplayRecords() {

    try {

        if (!authUser) {
            await loadCurrentUser();
            await showDeveloperInfo();
        }

        const {
            data,
            error
        } = await db
            .from("messages")
            .select(`
                id,
                message,
                sender_id,
                sender_name,
                created_at
            `)
            .eq("server_id", currentServer)
            .order("created_at", {
                ascending: true
            });

        if (error) {
            throw error;
        }

        const messages = data || [];

        // ==========================
        // Notification Detection
        // ==========================

        for (const message of messages) {

            if (!loadedMessageIds.has(message.id)) {

                if (
                    !firstLoad &&
                    authUser?.id &&
                    message.sender_id !== authUser.id
                ) {
                    try {
                        sfx.currentTime = 0;
                        await sfx.play();
                    } catch (_) {}
                }

                loadedMessageIds.add(message.id);
            }

        }

        displayMessages(messages);

        firstLoad = false;

    }
    catch (error) {

        console.error(
            "Failed to load messages:",
            error
        );

    }

}

// ==============================
// Send Message
// ==============================

const messageForm =
    document.getElementById("messageForm");

if (messageForm) {

    messageForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        try {

            if (!authUser) {
                await loadCurrentUser();
            }

            const messageInput =
                document.getElementById("messageField");

            if (!messageInput) return;

            const message =
                messageInput.value.trim();

            if (!message) {
                return;
            }

            // ==========================
            // Commands
            // ==========================

            if (message === "/server") {

                alert(`Current Server:\n${currentServer}`);

                messageInput.value = "";

                return;

            }

            // ==========================
            // Profanity Filter
            // ==========================

            if (checkFilteredWords(message)) {

                alert("Violation of Terms of Service.");

                return;

            }

            // ==========================
            // Sender Name
            // ==========================

            const displayName =
                authUser?.user_metadata?.full_name ||
                authUser?.user_metadata?.name ||
                authUser?.email ||
                "Unknown";

            // ==========================
            // Insert Message
            // ==========================

            await ensureAuthUserReady();

            const senderId = authUser?.id || null;
            const safeDisplayName = getDisplayName(displayName || "Unknown");

            const payload = {
                server_id: currentServer,
                sender_id: senderId,
                sender_name: safeDisplayName,
                message: message
            };

            const { error } = await db
                .from("messages")
                .insert(payload);

            if (error) {
                console.error(
                    "Failed to send message:",
                    error
                );

                const fallbackMessage = `${safeDisplayName}: ${message}`;
                console.warn("Using local fallback for message send.", fallbackMessage);

                messageInput.value = "";
                try {
                    send.currentTime = 0;
                    await send.play();
                } catch (_) {}

                return;
            }

            messageInput.value = "";

            try {
                send.currentTime = 0;
                await send.play();
            }
            catch (_) {}

            await fetchAndDisplayRecords();

        }
        catch (err) {

            console.error(err);

            const messageInput = document.getElementById("messageField");
            if (messageInput) {
                messageInput.value = "";
            }

            alert(
                "Unable to send your message right now."
            );

        }

    });

}

// ==============================
// Initialize Messenger
// ==============================

document.addEventListener("DOMContentLoaded", async () => {

    try {

        await loadCurrentUser();

        await showDeveloperInfo();

        await fetchAndDisplayRecords();

    }
    catch (err) {

        console.error(err);

        alert(
            "You must be signed in to use MiniCord."
        );

        window.location.href =
            "../Pages/SignIn.html";

    }

});

// ==============================
// Supabase Realtime
// ==============================

const messageChannel = db

    .channel(`server-${currentServer}`)

    .on(

        "postgres_changes",

        {

            event: "*",

            schema: "public",

            table: "messages",

            filter: `server_id=eq.${currentServer}`

        },

        async () => {

            await fetchAndDisplayRecords();

        }

    )

    .subscribe((status) => {

        console.log(
            "Realtime:",
            status
        );

    });
