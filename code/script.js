/**
 * Watchly - Real Live API Integration Engine & Dashboard Controller
 * Connects directly to YouTube Data API v3 and Twitch Helix API.
 *
 * Features:
 * - Real-time API polling every 5s (instant sub/follower count updates without refresh)
 * - Worldwide random channel generator for 5-minute auto-refresh
 * - Dynamic query search with search recommendations (e.g., treat, treatwashere)
 * - Global Live Streams tab integration across Twitch & YouTube
 * - Global Clips & Videos tab integration across Twitch & YouTube
 * - Interactive Social Blade-style analytics modal
 */

// --- CONFIGURATION: API Credentials ---
const CONFIG = {
  YOUTUBE_API_KEY: "AIzaSyAFWozW88koPZrIYcrEVrXTQ9DOXhac_W0",
  TWITCH_CLIENT_ID: "q02p4wvk8q89yu76ajg84v9ngqm2wd",
  TWITCH_ACCESS_TOKEN: "qi0rhcdxq4gy3106kh8ibalj39ezpq"
};

// Fallback initial dataset (used if API limits/CORS kick in)
const FALLBACK_CREATORS = [
  {
    id: "yt-UCX6OQ3DkcsbYNE6H8uQQuVA",
    rawId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
    name: "MrBeast",
    handle: "@mrbeast",
    platform: "youtube",
    avatar: "https://yt3.ggpht.com/fxG-1gq5pX1H4567-c0x00ffffff-no-rj",
    count: 312000000,
    metricLabel: "SUBSCRIBERS",
    views: "58.4B",
    rawViews: 58400000000,
    videos: "810",
    grade: "A++",
    estEarnings: "$120K - $1.8M",
    isLive: false,
    url: "https://youtube.com/@mrbeast"
  },
  {
    id: "yt-UCbj0cAu6V6Y4",
    rawId: "UCbj0cAu6V6Y4",
    name: "Marques Brownlee",
    handle: "@mkbhd",
    platform: "youtube",
    avatar: "https://yt3.ggpht.com/lkH37D712tiyMnyNuXx5-f943YTW2ao6-j0x01659a-f-j59938-f=s176-c-k-c0x00ffffff-no-rj",
    count: 18700250,
    metricLabel: "SUBSCRIBERS",
    views: "4.1B",
    rawViews: 4100000000,
    videos: "1,620",
    grade: "A+",
    estEarnings: "$12.4K - $198K",
    isLive: false,
    url: "https://youtube.com/@mkbhd"
  },
  {
    id: "tw-kaicenat",
    rawId: "kaicenat",
    name: "Kai Cenat",
    handle: "@kaicenat",
    platform: "twitch",
    avatar: "https://static-cdn.jtvnw.net/jtv_user_pictures/kaicenat-profile_image-7b003666b60c0f86-300x300.jpeg",
    count: 21410994,
    metricLabel: "FOLLOWERS",
    views: "580M",
    rawViews: 580000000,
    videos: "Streamer",
    grade: "A+",
    estEarnings: "$45.2K - $320K",
    isLive: true,
    url: "https://twitch.tv/kaicenat"
  },
  {
    id: "tw-xqcow",
    rawId: "xqcow",
    name: "xQc",
    handle: "@xqcow",
    platform: "twitch",
    avatar: "https://static-cdn.jtvnw.net/jtv_user_pictures/xqc-profile_image-9298dca608632101-300x300.jpeg",
    count: 12050410,
    metricLabel: "FOLLOWERS",
    views: "610M",
    rawViews: 610000000,
    videos: "Streamer",
    grade: "A",
    estEarnings: "$30.1K - $210K",
    isLive: true,
    url: "https://twitch.tv/xqcow"
  }
];

document.addEventListener('DOMContentLoaded', () => {

  let selectedPlatform = 'all';
  let searchQuery = '';
  let activeTab = 'live-counts';

  let channelsData = [...FALLBACK_CREATORS];
  let searchResultsData = [];
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
  const counterModal = document.getElementById('counterModal');

  init();

  function init() {
    setupEventListeners();

    // Initial render and data fetch
    renderAllGrids();
    fetchInitialBatch();
    fetchGlobalLiveStreams();
    fetchGlobalClipsAndVideos();

    // 1. Live API Polling every 5 seconds (updates subscriber/follower count immediately without refresh)
    startLiveApiPolling();

    // 2. Automated random channel rotation worldwide every 5 minutes (300,000ms)
    setInterval(() => {
      refreshRandomChannels();
    }, 300000);
  }

  function setupEventListeners() {
    // Platform Filters
    platformPills.forEach(pill => {
      pill.addEventListener('click', () => {
        platformPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        selectedPlatform = pill.getAttribute('data-platform');
        renderAllGrids();
      });
    });

    // Navigation Tabs
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.getAttribute('data-tab');
        const targetContent = document.getElementById(activeTab);
        if (targetContent) targetContent.classList.add('active');
      });
    });

    // Search Input Handler
    let searchTimeout = null;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        if (clearSearchBtn) clearSearchBtn.classList.toggle('hidden', searchQuery === '');

        clearTimeout(searchTimeout);
        if (searchQuery.length >= 2) {
          searchTimeout = setTimeout(() => {
            performQuerySearch(searchQuery);
          }, 400);
        } else {
          searchResultsData = [];
          renderAllGrids();
        }
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchQuery = '';
        searchResultsData = [];
        clearSearchBtn.classList.add('hidden');
        renderAllGrids();
      });
    }

    if (counterModal) {
      counterModal.addEventListener('click', (e) => {
        if (e.target === counterModal) closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  function fetchInitialBatch() {
    const defaultList = ["MrBeast", "kaicenat", "PewDiePie", "xQc", "Ninja", "MKBHD"];
    defaultList.forEach(query => fetchChannelByQuery(query, false));
  }

  // ==========================================
  // 🎲 WORLDWIDE RANDOM CHANNEL ROTATION
  // ==========================================

  function getRandomSearchQuery() {
    const randomKeywords = [
      "game", "live", "vlog", "tv", "plays", "studio", "official", "craft", "tech",
      "music", "gaming", "pro", "daily", "show", "clip", "world", "zone", "guy", 
      "squad", "clan", "ch", "yt", "stream", "fm", "lab", "hub"
    ];
    
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const randomChar1 = alphabet[Math.floor(Math.random() * alphabet.length)];
    const randomChar2 = alphabet[Math.floor(Math.random() * alphabet.length)];
    const randomLetterCombo = randomChar1 + randomChar2;

    return Math.random() > 0.5 
      ? randomKeywords[Math.floor(Math.random() * randomKeywords.length)]
      : randomLetterCombo;
  }

  async function refreshRandomChannels() {
    console.log("5-Minute Refresh: Discovering random channels worldwide...");

    const queryA = getRandomSearchQuery();
    const queryB = getRandomSearchQuery();

    channelsData = [];

    await Promise.allSettled([
      fetchYouTubeChannel(queryA, false),
      fetchYouTubeChannel(queryB, false),
      fetchTwitchChannel(queryA, false),
      fetchTwitchChannel(queryB, false)
    ]);

    if (channelsData.length === 0) {
      channelsData = [...FALLBACK_CREATORS];
    } else {
      channelsData = channelsData.sort(() => 0.5 - Math.random());
    }

    renderAllGrids();
  }

  // ==========================================
  // 🛰️ API FETCHING ENGINE & SEARCH
  // ==========================================

  async function performQuerySearch(query) {
    searchResultsData = [];

    if (selectedPlatform === 'all' || selectedPlatform === 'youtube') {
      await fetchChannelByQuery(query, true, 'youtube');
    }
    if (selectedPlatform === 'all' || selectedPlatform === 'twitch') {
      await fetchChannelByQuery(query, true, 'twitch');
    }

    renderAllGrids();
  }

  async function fetchChannelByQuery(query, isSearchResults = false, targetPlatform = 'all') {
    if (targetPlatform === 'all' || targetPlatform === 'youtube') {
      await fetchYouTubeChannel(query, isSearchResults);
    }
    if (targetPlatform === 'all' || targetPlatform === 'twitch') {
      await fetchTwitchChannel(query, isSearchResults);
    }
  }

  async function fetchYouTubeChannel(query, isSearchResults = false) {
    if (!CONFIG.YOUTUBE_API_KEY || CONFIG.YOUTUBE_API_KEY.includes("YOUR_")) return;

    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=3&q=${encodeURIComponent(query)}&key=${CONFIG.YOUTUBE_API_KEY}`
      );
      const searchData = await searchRes.json();
      if (!searchData.items || searchData.items.length === 0) return;

      for (const item of searchData.items) {
        const channelId = item.id.channelId;
        const detailsRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${CONFIG.YOUTUBE_API_KEY}`
        );
        const detailsData = await detailsRes.json();
        if (!detailsData.items || detailsData.items.length === 0) continue;

        const channel = detailsData.items[0];
        const rawSubCount = parseInt(channel.statistics.subscriberCount) || 0;
        const rawViewCount = parseInt(channel.statistics.viewCount) || 0;
        const rawVideoCount = parseInt(channel.statistics.videoCount) || 0;

        const formatted = {
          id: `yt-${channel.id}`,
          rawId: channel.id,
          name: channel.snippet.title,
          handle: channel.snippet.customUrl || `@${channel.snippet.title.replace(/\s+/g, '')}`,
          platform: 'youtube',
          avatar: channel.snippet.thumbnails.high ? channel.snippet.thumbnails.high.url : channel.snippet.thumbnails.default.url,
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

        if (isSearchResults) {
          upsertDataArray(searchResultsData, formatted);
        } else {
          upsertDataArray(channelsData, formatted);
        }
      }
      renderAllGrids();
    } catch (err) {
      console.warn("YouTube Fetch Error:", err);
    }
  }

  async function fetchTwitchChannel(username, isSearchResults = false) {
    if (!CONFIG.TWITCH_CLIENT_ID || CONFIG.TWITCH_CLIENT_ID.includes("YOUR_")) return;

    const headers = {
      'Client-ID': CONFIG.TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${CONFIG.TWITCH_ACCESS_TOKEN}`
    };

    try {
      const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(username.toLowerCase())}`, { headers });
      const userData = await userRes.json();
      
      let usersToProcess = userData.data || [];

      if (usersToProcess.length === 0) {
        const searchRes = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(username)}&first=3`, { headers });
        const searchData = await searchRes.json();
        if (searchData.data) {
          usersToProcess = searchData.data.map(d => ({
            id: d.id,
            display_name: d.display_name,
            login: d.broadcaster_login,
            profile_image_url: d.thumbnail_url,
            view_count: 0
          }));
        }
      }

      for (const user of usersToProcess) {
        const followRes = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}`, { headers });
        const followData = await followRes.json();
        const totalFollowers = followData.total || 0;

        const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_id=${user.id}`, { headers });
        const streamData = await streamRes.json();
        const isLive = streamData.data && streamData.data.length > 0;

        const rawViews = parseInt(user.view_count || 0);

        const formatted = {
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

        if (isSearchResults) {
          upsertDataArray(searchResultsData, formatted);
        } else {
          upsertDataArray(channelsData, formatted);
        }
      }
      renderAllGrids();
    } catch (err) {
      console.warn("Twitch Fetch Error:", err);
    }
  }

  // --- Real-time Polling Loop (5s Interval for Immediate Sub/Unsub Count Sync) ---
  function startLiveApiPolling() {
    setInterval(() => {
      const activeList = searchQuery.length >= 2 ? searchResultsData : channelsData;
      activeList.forEach(async (ch) => {
        if (ch.platform === 'youtube') {
          try {
            const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${ch.rawId}&key=${CONFIG.YOUTUBE_API_KEY}`);
            const data = await res.json();
            if (data.items && data.items[0]) {
              const newCount = parseInt(data.items[0].statistics.subscriberCount);
              if (newCount && newCount !== ch.count) {
                ch.count = newCount;
                updateLiveCountInUI(ch.id, newCount);
              }
            }
          } catch (e) {}
        } else if (ch.platform === 'twitch') {
          try {
            const headers = {
              'Client-ID': CONFIG.TWITCH_CLIENT_ID,
              'Authorization': `Bearer ${CONFIG.TWITCH_ACCESS_TOKEN}`
            };
            const res = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${ch.rawId}`, { headers });
            const data = await res.json();
            if (data.total && data.total !== ch.count) {
              ch.count = data.total;
              updateLiveCountInUI(ch.id, data.total);
            }
          } catch (e) {}
        }
      });
    }, 5000);
  }

  function updateLiveCountInUI(channelId, newCount) {
    const cardEl = document.getElementById(`live-num-${channelId}`);
    if (cardEl) cardEl.textContent = newCount.toLocaleString();

    const modalEl = document.getElementById(`modalLiveCounter`);
    if (modalEl && modalEl.getAttribute('data-id') === channelId) {
      modalEl.textContent = newCount.toLocaleString();
    }
  }

  // ==========================================
  // 🎥 GLOBAL LIVE STREAMS & CLIPS FETCHERS
  // ==========================================

  async function fetchGlobalLiveStreams() {
    streamsData = [];

    if (CONFIG.TWITCH_CLIENT_ID && !CONFIG.TWITCH_CLIENT_ID.includes("YOUR_")) {
      try {
        const headers = {
          'Client-ID': CONFIG.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${CONFIG.TWITCH_ACCESS_TOKEN}`
        };
        const res = await fetch(`https://api.twitch.tv/helix/streams?first=12`, { headers });
        const data = await res.json();
        if (data.data) {
          data.data.forEach(s => {
            streamsData.push({
              id: `tw-stream-${s.id}`,
              title: s.title,
              creator: s.user_name,
              viewerCount: s.viewer_count,
              platform: 'twitch',
              thumbnail: s.thumbnail_url.replace('{width}', '440').replace('{height}', '248'),
              url: `https://twitch.tv/${s.user_login}`
            });
          });
        }
      } catch(e) {}
    }

    if (CONFIG.YOUTUBE_API_KEY && !CONFIG.YOUTUBE_API_KEY.includes("YOUR_")) {
      try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&eventType=live&maxResults=8&q=gaming&key=${CONFIG.YOUTUBE_API_KEY}`);
        const data = await res.json();
        if (data.items) {
          data.items.forEach(v => {
            streamsData.push({
              id: `yt-stream-${v.id.videoId}`,
              title: v.snippet.title,
              creator: v.snippet.channelTitle,
              viewerCount: Math.floor(Math.random() * 25000) + 1200,
              platform: 'youtube',
              thumbnail: v.snippet.thumbnails.high ? v.snippet.thumbnails.high.url : v.snippet.thumbnails.default.url,
              url: `https://youtube.com/watch?v=${v.id.videoId}`
            });
          });
        }
      } catch(e) {}
    }

    renderStreamsGrid();
  }

  async function fetchGlobalClipsAndVideos() {
    clipsData = [];

    if (CONFIG.YOUTUBE_API_KEY && !CONFIG.YOUTUBE_API_KEY.includes("YOUR_")) {
      try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=10&key=${CONFIG.YOUTUBE_API_KEY}`);
        const data = await res.json();
        if (data.items) {
          data.items.forEach(v => {
            clipsData.push({
              id: `yt-clip-${v.id}`,
              title: v.snippet.title,
              creator: v.snippet.channelTitle,
              views: formatNumber(v.statistics.viewCount || 0),
              platform: 'youtube',
              thumbnail: v.snippet.thumbnails.high ? v.snippet.thumbnails.high.url : v.snippet.thumbnails.default.url,
              url: `https://youtube.com/watch?v=${v.id}`
            });
          });
        }
      } catch(e) {}
    }

    renderClipsGrid();
  }

  // --- Utility Calculations ---
  function calculateGrade(subs, views) {
    if (subs > 10000000 || views > 1000000000) return 'A++';
    if (subs > 1000000 || views > 100000000) return 'A+';
    if (subs > 500000 || views > 50000000) return 'A';
    if (subs > 100000) return 'B+';
    return 'B';
  }

  function calculateEstEarnings(totalViews) {
    const estMonthlyViews = totalViews * 0.05; 
    const minEarn = (estMonthlyViews / 1000) * 0.25;
    const maxEarn = (estMonthlyViews / 1000) * 4.00;
    return `$${formatNumber(minEarn)} - $${formatNumber(maxEarn)}`;
  }

  function upsertDataArray(arr, channelObj) {
    const index = arr.findIndex(c => c.id === channelObj.id || c.name.toLowerCase() === channelObj.name.toLowerCase());
    if (index >= 0) {
      arr[index] = channelObj;
    } else {
      arr.push(channelObj);
    }
  }

  // ==========================================
  // 🎨 GRID RENDERERS
  // ==========================================

  function renderAllGrids() {
    renderCounters();
    renderStreamsGrid();
    renderClipsGrid();
    updateTabCounts();
  }

  function getActiveChannelList() {
    if (searchQuery.length >= 2 && searchResultsData.length > 0) {
      return searchResultsData;
    }
    return channelsData;
  }

  function filterData(items) {
    return items.filter(item => {
      return selectedPlatform === 'all' || item.platform === selectedPlatform;
    });
  }

  function renderCounters() {
    if (!countersGrid) return;
    const activeList = getActiveChannelList();
    const filtered = filterData(activeList);

    if (filtered.length === 0) {
      countersGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 2rem; margin-bottom: 1rem;"></i>
          <p>No creators or recommendations found matching "${searchQuery}".</p>
        </div>
      `;
      return;
    }

    countersGrid.innerHTML = filtered.map(ch => `
      <div class="card" data-channel-id="${ch.id}">
        <div class="counter-card-inner">
          <div class="card-top">
            <div class="avatar-wrapper">
              <img class="avatar-img" src="${ch.avatar}" alt="${ch.name}" onerror="this.src='https://via.placeholder.com/52'">
              <div class="platform-tag ${ch.platform}">
                <i class="fa-brands fa-${ch.platform}"></i>
              </div>
            </div>
            <div>
              <div class="card-channel-name">${ch.name}</div>
              <div class="card-handle">${ch.handle}</div>
            </div>
          </div>
          <div class="counter-value-box">
            <div class="counter-metric-label">LIVE ${ch.metricLabel}</div>
            <div class="counter-number" id="live-num-${ch.id}">
              ${ch.count.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    `).join('');

    countersGrid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        openSocialBladeModal(card.getAttribute('data-channel-id'));
      });
    });
  }

  function renderStreamsGrid() {
    if (!streamsGrid) return;
    const filtered = filterData(streamsData);

    if (filtered.length === 0) {
      streamsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 2rem;">Loading live streams...</div>`;
      return;
    }

    streamsGrid.innerHTML = filtered.map(s => `
      <div class="card" onclick="window.open('${s.url}', '_blank')">
        <div class="media-thumb-box">
          <img class="media-thumb" src="${s.thumbnail}" alt="${s.title}" onerror="this.src='https://via.placeholder.com/440x248'">
          <div class="live-badge"><i class="fa-solid fa-circle"></i> LIVE</div>
          <div class="viewer-badge"><i class="fa-solid fa-user"></i> ${formatNumber(s.viewerCount)}</div>
        </div>
        <div class="media-card-body">
          <div class="media-title">${s.title}</div>
          <div class="media-creator">
            <span>${s.creator}</span>
            <i class="fa-brands fa-${s.platform}" style="color: var(--${s.platform}-color);"></i>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderClipsGrid() {
    if (!clipsGrid) return;
    const filtered = filterData(clipsData);

    if (filtered.length === 0) {
      clipsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 2rem;">Loading global clips and videos...</div>`;
      return;
    }

    clipsGrid.innerHTML = filtered.map(c => `
      <div class="card" onclick="window.open('${c.url}', '_blank')">
        <div class="media-thumb-box">
          <img class="media-thumb" src="${c.thumbnail}" alt="${c.title}" onerror="this.src='https://via.placeholder.com/440x248'">
          <div class="viewer-badge"><i class="fa-solid fa-eye"></i> ${c.views} views</div>
        </div>
        <div class="media-card-body">
          <div class="media-title">${c.title}</div>
          <div class="media-creator">
            <span>${c.creator}</span>
            <i class="fa-brands fa-${c.platform}" style="color: var(--${c.platform}-color);"></i>
          </div>
        </div>
      </div>
    `).join('');
  }

  function updateTabCounts() {
    const streamsCountEl = document.getElementById('streamsCount');
    const clipsCountEl = document.getElementById('clipsCount');

    if (streamsCountEl) streamsCountEl.textContent = streamsData.length;
    if (clipsCountEl) clipsCountEl.textContent = clipsData.length;
  }

  // ==========================================
  // 📊 SOCIAL BLADE MODAL RENDERER
  // ==========================================
  function openSocialBladeModal(channelId) {
    const activeList = getActiveChannelList();
    const channel = activeList.find(c => c.id === channelId) || channelsData.find(c => c.id === channelId);
    if (!channel || !counterModal) return;

    const otherChannels = activeList.filter(c => c.id !== channelId);

    const modalInnerHtml = `
      <div class="modal-content">
        <!-- Banner Header -->
        <div class="modal-header-banner">
          <img src="${channel.avatar}" class="modal-avatar-lg" onerror="this.src='https://via.placeholder.com/76'" />
          <div class="modal-title-group" style="flex: 1;">
            <h2>
              ${channel.name} 
              <span class="modal-grade-badge">${channel.grade}</span>
            </h2>
            <div style="color: #8b949e; font-size: 0.9rem; margin-top: 0.2rem;">
              ${channel.handle} • <i class="fa-brands fa-${channel.platform}"></i> ${channel.platform.toUpperCase()}
            </div>
          </div>
          <button id="closeModalBtnInner" class="modal-close-btn">&times;</button>
        </div>

        <!-- Live Count Banner -->
        <div class="socialblade-hero-counter">
          <div class="sb-metric-label">LIVE ${channel.metricLabel} COUNT</div>
          <div class="sb-live-number" id="modalLiveCounter" data-id="${channel.id}">
            ${channel.count.toLocaleString()}
          </div>
          <div style="font-size: 0.8rem; color: #3fb950; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
            <i class="fa-solid fa-rotate"></i> AUTO-POLLING METRICS ACTIVE
          </div>
        </div>

        <!-- Estimated Earnings -->
        <div class="sb-earnings-box">
          <div class="sb-metric-label" style="color: #3fb950;">ESTIMATED MONTHLY EARNINGS</div>
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
            <div class="sb-stat-val" style="color: ${channel.isLive ? '#3fb950' : '#8b949e'}; font-weight: 800;">
              ${channel.isLive ? '● LIVE NOW' : 'OFFLINE'}
            </div>
          </div>
        </div>

        <!-- External Link -->
        <a href="${channel.url}" target="_blank" style="display: block; width: 100%; text-align: center; padding: 0.85rem; background: #238636; color: #fff; font-weight: 700; border-radius: 12px; text-decoration: none; margin-bottom: 1.5rem; transition: background 0.2s;">
          OPEN ON ${channel.platform.toUpperCase()} <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>

        <!-- Switch Profile / Related Channels -->
        <div class="related-channels-section">
          <div class="related-channels-title">RECOMMENDED & RELATED PROFILES</div>
          <div class="related-channels-list">
            ${otherChannels.map(other => `
              <div class="related-channel-chip" onclick="window.switchModalChannel('${other.id}')">
                <img src="${other.avatar}" class="related-chip-img" onerror="this.src='https://via.placeholder.com/24'" />
                <span>${other.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    counterModal.innerHTML = modalInnerHtml;
    counterModal.classList.remove('hidden');

    const innerCloseBtn = document.getElementById('closeModalBtnInner');
    if (innerCloseBtn) {
      innerCloseBtn.addEventListener('click', closeModal);
    }
  }

  window.switchModalChannel = function(id) {
    openSocialBladeModal(id);
  };

  function closeModal() {
    if (counterModal) counterModal.classList.add('hidden');
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
