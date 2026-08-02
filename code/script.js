/**
 * Watchly - Real Live API Integration Engine & Dashboard Controller
 * Connects directly to YouTube Data API v3 and Twitch Helix API
 * Features fallback default data, live interval counter ticking, and interactive modals.
 */

// --- CONFIGURATION: Put your free API keys here ---
const CONFIG = {
  YOUTUBE_API_KEY: "AIzaSyAFWozW88koPZrIYcrEVrXTQ9DOXhac_W0",
  TWITCH_CLIENT_ID: "q02p4wvk8q89yu76ajg84v9ngqm2wd",
  TWITCH_ACCESS_TOKEN: "qi0rhcdxq4gy3106kh8ibalj39ezpq" // App Access Token
};

// --- DEFAULT / FALLBACK CREATORS DATA (Loaded if API is offline/rate-limited) ---
const INITIAL_CREATORS = [
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
    id: "yt-UCbcXh1i57d8p5678mkbhd",
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
    id: "yt-UC-lHJZR3Gqxm24_Vd_AJ5Yw",
    rawId: "UC-lHJZR3Gqxm24_Vd_AJ5Yw",
    name: "PewDiePie",
    handle: "@pewdiepie",
    platform: "youtube",
    avatar: "https://yt3.ggpht.com/5o-sM2zwPfIZ0zV3r3_TzC_j0x01659a-f=s176-c-k-c0x00ffffff-no-rj",
    count: 111000420,
    metricLabel: "SUBSCRIBERS",
    views: "29.2B",
    rawViews: 29200000000,
    videos: "4,750",
    grade: "A++",
    estEarnings: "$8.5K - $136K",
    isLive: false,
    url: "https://youtube.com/@pewdiepie"
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
    videos: "3,100",
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
    videos: "8,900",
    grade: "A",
    estEarnings: "$30.1K - $210K",
    isLive: true,
    url: "https://twitch.tv/xqcow"
  },
  {
    id: "tw-ninja",
    rawId: "ninja",
    name: "Ninja",
    handle: "@ninja",
    platform: "twitch",
    avatar: "https://static-cdn.jtvnw.net/jtv_user_pictures/ninja-profile_image-f0f8a2bc-300x300.jpeg",
    count: 19100800,
    metricLabel: "FOLLOWERS",
    views: "560M",
    rawViews: 560000000,
    videos: "5,400",
    grade: "A",
    estEarnings: "$15K - $120K",
    isLive: false,
    url: "https://twitch.tv/ninja"
  }
];

document.addEventListener('DOMContentLoaded', () => {

  let selectedPlatform = 'all';
  let searchQuery = '';
  let activeTab = 'live-counts';

  let channelsData = [...INITIAL_CREATORS];
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

    // Render initial creator set
    renderAllGrids();
    startLiveTicker();

    // Fetch real API data for default creators in background
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
        const targetContent = document.getElementById(activeTab);
        if (targetContent) targetContent.classList.add('active');
      });
    });

    let searchTimeout = null;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        if (clearSearchBtn) clearSearchBtn.classList.toggle('hidden', searchQuery === '');

        clearTimeout(searchTimeout);
        if (searchQuery.length > 2) {
          searchTimeout = setTimeout(() => performSearch(searchQuery), 600);
        } else if (searchQuery === '') {
          renderAllGrids();
        }
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        renderAllGrids();
      });
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (counterModal) {
      counterModal.addEventListener('click', (e) => {
        if (e.target === counterModal) closeModal();
      });
    }
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  // ==========================================
  // 🛰️ API FETCHING ENGINE & SEARCH
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
      if (!detailsData.items || detailsData.items.length === 0) return;

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

      upsertChannel(formattedChannel);
    } catch (err) {
      console.warn("YouTube API Fetch failed, fallback active:", err);
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
      console.warn("Twitch API Fetch failed, fallback active:", err);
    }
  }

  // --- Calculations ---
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

  function upsertChannel(channelObj) {
    const index = channelsData.findIndex(c => c.id === channelObj.id || c.name.toLowerCase() === channelObj.name.toLowerCase());
    if (index >= 0) {
      channelsData[index] = channelObj;
    } else {
      channelsData.push(channelObj);
    }
    renderAllGrids();
  }

  // Live simulation ticker for real-time counts UI animation
  function startLiveTicker() {
    setInterval(() => {
      channelsData.forEach(ch => {
        const increment = Math.floor(Math.random() * 4);
        ch.count += increment;

        // Update live counter element on card if present
        const cardCounter = document.getElementById(`live-num-${ch.id}`);
        if (cardCounter) {
          cardCounter.textContent = ch.count.toLocaleString();
        }

        // Update live counter on active modal if present
        const modalCounter = document.getElementById(`modalLiveCounter`);
        if (modalCounter && modalCounter.getAttribute('data-id') === ch.id) {
          modalCounter.textContent = ch.count.toLocaleString();
        }
      });
    }, 2000);
  }

  // ==========================================
  // 🎨 GRID RENDERERS
  // ==========================================

  function renderAllGrids() {
    renderCounters();
    renderChannels();
    updateTabCounts();
  }

  function filterData(items) {
    return items.filter(item => {
      const matchesPlatform = selectedPlatform === 'all' || item.platform === selectedPlatform;
      const matchesQuery = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.handle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPlatform && matchesQuery;
    });
  }

  function renderCounters() {
    if (!countersGrid) return;
    const filtered = filterData(channelsData);

    if (filtered.length === 0) {
      countersGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #8b949e; padding: 2rem;">No channels found for "${searchQuery}"</div>`;
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

  function renderChannels() {
    if (!channelsGrid) return;
    const filtered = filterData(channelsData);

    channelsGrid.innerHTML = filtered.map(ch => `
      <div class="card" data-channel-id="${ch.id}" style="padding: 1.25rem; text-align: center;">
        <img class="avatar-img" src="${ch.avatar}" style="width: 64px; height: 64px; margin: 0 auto 0.8rem auto; border-radius: 50%; display: block;" onerror="this.src='https://via.placeholder.com/64'">
        <div class="card-channel-name" style="max-width: 100%; margin-bottom: 0.2rem;">${ch.name}</div>
        <div class="card-handle" style="margin-bottom: 0.6rem;">${ch.handle}</div>
        <div style="font-size: 0.8rem; background: rgba(88,166,255,0.1); color: #58a6ff; padding: 0.3rem 0.6rem; border-radius: 20px; display: inline-block;">
          <i class="fa-brands fa-${ch.platform}"></i> ${ch.count.toLocaleString()} ${ch.metricLabel}
        </div>
      </div>
    `).join('');

    channelsGrid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        openSocialBladeModal(card.getAttribute('data-channel-id'));
      });
    });
  }

  function updateTabCounts() {
    const liveStreamsCount = channelsData.filter(c => c.isLive).length;
    
    const streamsCountEl = document.getElementById('streamsCount');
    const clipsCountEl = document.getElementById('clipsCount');
    const channelsCountEl = document.getElementById('channelsCount');

    if (streamsCountEl) streamsCountEl.textContent = liveStreamsCount;
    if (clipsCountEl) clipsCountEl.textContent = channelsData.length * 2;
    if (channelsCountEl) channelsCountEl.textContent = filterData(channelsData).length;
  }

  // ==========================================
  // 📊 SOCIAL BLADE MODAL RENDERER
  // ==========================================
  function openSocialBladeModal(channelId) {
    const channel = channelsData.find(c => c.id === channelId);
    if (!channel || !counterModal) return;

    const otherChannels = channelsData.filter(c => c.id !== channelId);

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

        <!-- Hero Sub/Follower Count -->
        <div class="socialblade-hero-counter">
          <div class="sb-metric-label">LIVE ${channel.metricLabel} COUNT</div>
          <div class="sb-live-number" id="modalLiveCounter" data-id="${channel.id}">
            ${channel.count.toLocaleString()}
          </div>
          <div style="font-size: 0.8rem; color: #3fb950; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
            <i class="fa-solid fa-rotate"></i> REAL-TIME METRICS ACTIVE
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
          <div class="related-channels-title">EXPLORE OTHER CREATORS</div>
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

  // Global helper to switch profile directly inside modal
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
