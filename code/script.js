/**
 * Watchly - Real Live API Integration Engine
 * Connects directly to YouTube Data API v3 and Twitch Helix API
 */

// --- CONFIGURATION: Put your free API keys here ---
const CONFIG = {
  YOUTUBE_API_KEY: "AIzaSyAFWozW88koPZrIYcrEVrXTQ9DOXhac_W0",
  TWITCH_CLIENT_ID: "q02p4wvk8q89yu76ajg84v9ngqm2wd",
  TWITCH_ACCESS_TOKEN: "qi0rhcdxq4gy3106kh8ibalj39ezpq" // App Access Token
};

document.addEventListener('DOMContentLoaded', () => {

  let selectedPlatform = 'all';
  let searchQuery = '';
  let activeTab = 'live-counts';

  let channelsData = [];
  let streamsData = [];
  let clipsData = [];

  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearch');
  const platformPills = document.querySelectorAll('.platform-pills .pill');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  const countersGrid = document.getElementById('countersGrid');
  const streamsGrid = document.getElementById('streamsGrid');
  const clipsGrid = document.getElementById('clipsGrid');
  const channelsGrid = document.getElementById('channelsGrid');
  const counterModal = document.getElementById('counterModal');
  const closeModalBtn = document.getElementById('closeModal');

  init();

  function init() {
    setupEventListeners();

    // Default channels loaded on start
    const defaultCreators = ["MrBeast", "kaicenat", "PewDiePie", "xQc", "Ninja", "MKBHD"];
    defaultCreators.forEach(creator => performSearch(creator));
  }

  function setupEventListeners() {
    platformPills.forEach(pill => {
      pill.addEventListener('click', () => {
        platformPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectedPlatform = pill.getAttribute('data-platform');
        renderAllGrids();
      });
    });

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.getAttribute('data-tab');
        document.getElementById(activeTab).classList.add('active');
      });
    });

    let searchTimeout = null;
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      clearSearchBtn.classList.toggle('hidden', searchQuery === '');

      clearTimeout(searchTimeout);
      if (searchQuery.length > 2) {
        searchTimeout = setTimeout(() => performSearch(searchQuery), 600);
      }
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      renderAllGrids();
    });

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (counterModal) {
      counterModal.addEventListener('click', (e) => {
        if (e.target === counterModal) closeModal();
      });
    }
  }

  // ==========================================
  // 🛰️ API FETCHING ENGINE
  // ==========================================

  async function performSearch(query) {
    if (selectedPlatform === 'all' || selectedPlatform === 'youtube') {
      fetchYouTubeChannel(query);
    }
    if (selectedPlatform === 'all' || selectedPlatform === 'twitch') {
      fetchTwitchChannel(query);
    }
  }

  async function fetchYouTubeChannel(query) {
    if (!CONFIG.YOUTUBE_API_KEY || CONFIG.YOUTUBE_API_KEY.includes("YOUR_")) return;

    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&key=${CONFIG.YOUTUBE_API_KEY}`
      );
      const searchData = await searchRes.json();
      if (!searchData.items || searchData.items.length === 0) return;

      const channelId = searchData.items[0].id.channelId;

      const detailsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${CONFIG.YOUTUBE_API_KEY}`
      );
      const detailsData = await detailsRes.json();
      const channel = detailsData.items[0];

      const rawSubCount = parseInt(channel.statistics.subscriberCount) || 0;
      const rawViewCount = parseInt(channel.statistics.viewCount) || 0;
      const rawVideoCount = parseInt(channel.statistics.videoCount) || 0;

      const formattedChannel = {
        id: `yt-${channel.id}`,
        rawId: channel.id,
        name: channel.snippet.title,
        handle: channel.snippet.customUrl || `@${channel.snippet.title.replace(/\s+/g, '')}`,
        platform: 'youtube',
        avatar: channel.snippet.thumbnails.high.url,
        count: rawSubCount,
        metricLabel: 'SUBSCRIBERS',
        views: formatNumber(rawViewCount),
        rawViews: rawViewCount,
        videos: formatNumber(rawVideoCount),
        grade: calculateGrade(rawSubCount, rawViewCount),
        estEarnings: calculateEstEarnings(rawViewCount),
        isLive: false,
        url: `https://youtube.com/channel/${channel.id}`
      };

      upsertChannel(formattedChannel);
    } catch (err) {
      console.error("YouTube Fetch Error:", err);
    }
  }

  async function fetchTwitchChannel(username) {
    if (!CONFIG.TWITCH_CLIENT_ID || CONFIG.TWITCH_CLIENT_ID.includes("YOUR_")) return;

    const headers = {
      'Client-ID': CONFIG.TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${CONFIG.TWITCH_ACCESS_TOKEN}`
    };

    try {
      const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(username.toLowerCase())}`, { headers });
      const userData = await userRes.json();
      if (!userData.data || userData.data.length === 0) return;

      const user = userData.data[0];

      const followRes = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}`, { headers });
      const followData = await followRes.json();
      const totalFollowers = followData.total || 0;

      const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_id=${user.id}`, { headers });
      const streamData = await streamRes.json();
      const isLive = streamData.data && streamData.data.length > 0;

      const rawViews = parseInt(user.view_count || 0);

      const formattedChannel = {
        id: `tw-${user.id}`,
        rawId: user.id,
        name: user.display_name,
        handle: `@${user.login}`,
        platform: 'twitch',
        avatar: user.profile_image_url,
        count: totalFollowers,
        metricLabel: 'FOLLOWERS',
        views: formatNumber(rawViews),
        rawViews: rawViews,
        videos: 'Streamer',
        grade: calculateGrade(totalFollowers, rawViews),
        estEarnings: calculateEstEarnings(rawViews * 0.5),
        isLive: isLive,
        url: `https://twitch.tv/${user.login}`
      };

      upsertChannel(formattedChannel);
    } catch (err) {
      console.error("Twitch Fetch Error:", err);
    }
  }

  // --- Social Blade Calculators ---
  function calculateGrade(subs, views) {
    if (subs > 10000000 || views > 1000000000) return 'A++';
    if (subs > 1000000 || views > 100000000) return 'A+';
    if (subs > 500000 || views > 50000000) return 'A';
    if (subs > 100000) return 'B+';
    return 'B';
  }

  function calculateEstEarnings(totalViews) {
    // Standard CPM estimation algorithm
    const estMonthlyViews = totalViews * 0.05; 
    const minEarn = (estMonthlyViews / 1000) * 0.25;
    const maxEarn = (estMonthlyViews / 1000) * 4.00;
    return `$${formatNumber(minEarn)} - $${formatNumber(maxEarn)}`;
  }

  function upsertChannel(channelObj) {
    const index = channelsData.findIndex(c => c.id === channelObj.id);
    if (index >= 0) {
      channelsData[index] = channelObj;
    } else {
      channelsData.push(channelObj);
    }
    renderAllGrids();
  }

  function renderAllGrids() {
    renderCounters();
    renderChannels();
  }

  function renderCounters() {
    if (!countersGrid) return;
    const filtered = filterData(channelsData);

    countersGrid.innerHTML = filtered.map(ch => `
      <div class="card" data-channel-id="${ch.id}" style="cursor: pointer;">
        <div class="counter-card-inner" style="padding: 1.2rem;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <img src="${ch.avatar}" style="width: 52px; height: 52px; border-radius: 50%;" />
            <div>
              <div style="font-weight: 700; font-size: 1.1rem;">${ch.name}</div>
              <div style="color: #8b949e; font-size: 0.85rem;">${ch.handle}</div>
            </div>
          </div>
          <div style="margin-top: 1rem; background: rgba(0,0,0,0.2); padding: 0.8rem; border-radius: 10px; text-align: center;">
            <div class="sb-metric-label">${ch.metricLabel}</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #58a6ff;">${ch.count.toLocaleString()}</div>
          </div>
        </div>
      </div>
    `).join('');

    countersGrid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => openSocialBladeModal(card.getAttribute('data-channel-id')));
    });
  }

  function renderChannels() {
    if (!channelsGrid) return;
    const filtered = filterData(channelsData);
    channelsGrid.innerHTML = filtered.map(ch => `
      <div class="card" data-channel-id="${ch.id}" style="cursor: pointer; padding: 1.2rem; text-align: center;">
        <img src="${ch.avatar}" style="width: 64px; height: 64px; border-radius: 50%; margin-bottom: 0.5rem;" />
        <div style="font-weight: 700;">${ch.name}</div>
        <div style="color: #8b949e; font-size: 0.85rem;">${ch.handle}</div>
      </div>
    `).join('');

    channelsGrid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => openSocialBladeModal(card.getAttribute('data-channel-id')));
    });
  }

  function filterData(items) {
    return items.filter(item => selectedPlatform === 'all' || item.platform === selectedPlatform);
  }

  // ==========================================
  // 📊 SOCIAL BLADE MODAL RENDERER
  // ==========================================
  function openSocialBladeModal(channelId) {
    const channel = channelsData.find(c => c.id === channelId);
    if (!channel) return;

    // Filter creators for the "Switch / Explore Other Profiles" list
    const otherChannels = channelsData.filter(c => c.id !== channelId);

    const modalInnerHtml = `
      <div class="modal-content">
        <!-- Banner Header -->
        <div class="modal-header-banner">
          <img src="${channel.avatar}" class="modal-avatar-lg" />
          <div class="modal-title-group" style="flex: 1;">
            <h2>
              ${channel.name} 
              <span class="modal-grade-badge">${channel.grade}</span>
            </h2>
            <div style="color: #8b949e; font-size: 0.9rem;">${channel.handle} • ${channel.platform.toUpperCase()}</div>
          </div>
          <button id="closeModalBtnInner" style="background: none; border: none; color: #8b949e; font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>

        <!-- Hero Sub Count -->
        <div class="socialblade-hero-counter">
          <div class="sb-metric-label">LIVE ${channel.metricLabel}</div>
          <div class="sb-live-number" id="modalLiveCounter">${channel.count.toLocaleString()}</div>
          <div style="font-size: 0.8rem; color: #3fb950; font-weight: 600;">● REAL-TIME METRICS</div>
        </div>

        <!-- Estimated Earnings -->
        <div class="sb-earnings-box">
          <div class="sb-metric-label" style="color: #2ea44f;">ESTIMATED MONTHLY EARNINGS</div>
          <div class="sb-earnings-val">${channel.estEarnings}</div>
        </div>

        <!-- Stats Grid -->
        <div class="sb-stats-grid">
          <div class="sb-stat-box">
            <div class="sb-metric-label">TOTAL VIEWS</div>
            <div class="sb-stat-val">${channel.views}</div>
          </div>
          <div class="sb-stat-box">
            <div class="sb-metric-label">UPLOADS</div>
            <div class="sb-stat-val">${channel.videos}</div>
          </div>
          <div class="sb-stat-box">
            <div class="sb-metric-label">STATUS</div>
            <div class="sb-stat-val" style="color: ${channel.isLive ? '#3fb950' : '#8b949e'};">
              ${channel.isLive ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <a href="${channel.url}" target="_blank" style="display: block; width: 100%; text-align: center; padding: 0.8rem; background: #238636; color: #fff; font-weight: 700; border-radius: 10px; text-decoration: none; margin-bottom: 1.5rem;">
          VIEW ON ${channel.platform.toUpperCase()} ↗
        </a>

        <!-- Switch Profile / Related Channels -->
        <div class="related-channels-section">
          <div class="related-channels-title">EXPLORE OTHER PROFILES</div>
          <div class="related-channels-list">
            ${otherChannels.map(other => `
              <div class="related-channel-chip" onclick="window.switchModalChannel('${other.id}')">
                <img src="${other.avatar}" class="related-chip-img" />
                <span>${other.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    counterModal.innerHTML = modalInnerHtml;
    counterModal.classList.remove('hidden');

    document.getElementById('closeModalBtnInner').addEventListener('click', closeModal);
  }

  // Global helper to switch profile directly inside modal
  window.switchModalChannel = function(id) {
    openSocialBladeModal(id);
  };

  function closeModal() {
    counterModal.classList.add('hidden');
  }

  function formatNumber(num) {
    const n = parseInt(num);
    if (isNaN(n)) return '0';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
  }
});
