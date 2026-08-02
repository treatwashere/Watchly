# ⚡ Watchly - Open Source Live Counter & Stream Hub

Watchly is a lightweight, open-source dashboard that provides real-time follower/subscriber tracking, stream embeds, and clips feeds for Twitch and YouTube creators.

## 🚀 Quick Start

1. Clone or download the repository files:
   - `index.html`
   - `styles.css`
   - `script.js`
2. Open `index.html` directly in any web browser or serve with a local server (e.g., Live Server extension in VS Code).

---

## 🔌 Connecting Real APIs

To connect Watchly to real live data endpoints, replace the simulated logic in `script.js` with direct API calls or a backend server proxy:

### 1. Twitch Helix API Integration
* **Endpoint:** `https://api.twitch.tv/helix/users/follows` or `https://api.twitch.tv/helix/streams`
* **Authentication:** Requires `Client-ID` and an App Access Token obtained via Twitch Developer Console.

```javascript
async function fetchTwitchFollowers(broadcasterId, clientId, accessToken) {
  const response = await fetch(`[https://api.twitch.tv/helix/channels/followers?broadcaster_id=$](https://api.twitch.tv/helix/channels/followers?broadcaster_id=$){broadcasterId}`, {
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const data = await response.json();
  return data.total; // Real live follower count
}
