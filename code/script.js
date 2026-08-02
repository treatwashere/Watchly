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

  // --- State Variables ---
  let selectedPlatform = 'all'; // 'all' | 'twitch' | 'youtube'
  let searchQuery = '';
  let activeTab = 'live-counts';
  let livePollingInterval = null;

  // Real fetched state
  let channelsData = [];
  let streamsData = [];
  let clipsData = [];

  // --- DOM Elements ---
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearch');
  const platformPills = document.querySelectorAll('.platform-pills .pill');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Grids
  const countersGrid = document.getElementById('countersGrid');
  const streamsGrid = document.getElementById('streamsGrid');
  const clipsGrid = document.getElementById('clipsGrid');
  const channelsGrid = document.getElementById('channelsGrid');

  // Counts
  const streamsCountEl = document.getElementById('streamsCount');
  const clipsCountEl = document.getElementById('clipsCount');
  const channelsCountEl = document.getElementById('channelsCount');

  // Modal Elements
  const counterModal = document.getElementById('counterModal');
  const closeModalBtn = document.getElementById('closeModal');
  const modalAvatar = document.getElementById('modalAvatar');
  const modalPlatform = document.getElementById('modalPlatform');
  const modalName = document.getElementById('modalName');
  const modalHandle = document.getElementById('modalHandle');
  const modalCounterLabel = document.getElementById('modalCounterLabel');
  const modalCounterValue = document.getElementById('modalCounterValue');
  const modalViews = document.getElementById('modalViews');
  const modalStatus = document.getElementById('modalStatus');
  const modalPlatformText = document.getElementById('modalPlatformText');
  const modalExternalLink = document.getElementById('modalExternalLink');

  // Initialize Application
  init();

  function init() {
    setupEventListeners();
    
    // Initial default search to populate real live data
    performSearch("MrBeast");
    performSearch("kaicenat");
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Platform Filter Pills
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
        document.getElementById(activeTab).classList.add('active');
      });
    });

    // Real-Time Search Handler (Debounce & Submit)
    let searchTimeout = null;
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      clearSearchBtn.classList.toggle('hidden', searchQuery === '');

      clearTimeout(searchTimeout);
      if (searchQuery.length > 2) {
        searchTimeout = setTimeout(() => {
          performSearch(searchQuery);
        }, 600); // Fetch from live API after typing stops
      }
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      renderAllGrids();
    });

    // Modal Events
    closeModalBtn.addEventListener('click', closeModal);
    counterModal.addEventListener('click', (e) => {
      if (e.target === counterModal) closeModal();
    });
  }

  // ==========================================
  // 🛰️ REAL API FETCHING LOGIC
  // ==========================================

  async function performSearch(query) {
    if (selectedPlatform === 'all' || selectedPlatform === 'youtube') {
      fetchYouTubeChannel(query);
    }
    if (selectedPlatform === 'all' || selectedPlatform === 'twitch') {
      fetchTwitchChannel(query);
    }
  }

  // --- 1. REAL YOUTUBE DATA API V3 ---
  async function fetchYouTubeChannel(query) {
    if (!CONFIG.YOUTUBE_API_KEY || CONFIG.YOUTUBE_API_KEY.includes("YOUR_")) {
      console.warn("Watchly: YouTube API Key missing in CONFIG.");
      return;
    }

    try {
      // Step A: Search for Channel ID
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&key=${CONFIG.YOUTUBE_API_KEY}`
      );
      const searchData = await searchRes.json();
      if (!searchData.items || searchData.items.length === 0) return;

      const channelId = searchData.items[0].id.channelId;

      // Step B: Get Real Statistics & Details
      const detailsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${CONFIG.YOUTUBE_API_KEY}`
      );
      const detailsData = await detailsRes.json();
      const channel = detailsData.items[0];

      // Format Channel Object
      const formattedChannel = {
        id: `yt-${channel.id}`,
        rawId: channel.id,
        name: channel.snippet.title,
        handle: channel.snippet.customUrl || `@${channel.snippet.title.replace(/\s+/g, '')}`,
        platform: 'youtube',
        avatar: channel.snippet.thumbnails.high.url,
        count: parseInt(channel.statistics.subscriberCount) || 0,
        metricLabel: 'LIVE SUBSCRIBER COUNT',
        views: formatNumber(channel.statistics.viewCount),
        isLive: false,
        url: `https://youtube.com/channel/${channel.id}`
      };

      upsertChannel(formattedChannel);
      fetchYouTubeVideosAndStreams(channel.id);
    } catch (err) {
      console.error("YouTube API Error:", err);
    }
  }

  async function fetchYouTubeVideosAndStreams(channelId) {
    try {
      // Fetch Recent Videos / Streams
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=4&key=${CONFIG.YOUTUBE_API_KEY}`
      );
      const data = await res.json();

      if (data.items) {
        data.items.forEach(item => {
          const isLiveBroadcast = item.snippet.liveBroadcastContent === 'live';
          
          if (isLiveBroadcast) {
            streamsData.push({
              id: item.id.videoId,
              channelName: item.snippet.channelTitle,
              platform: 'youtube',
              title: item.snippet.title,
              viewers: 'LIVE',
              game: 'YouTube Live',
              thumb: item.snippet.thumbnails.high.url,
              url: `https://youtube.com/watch?v=${item.id.videoId}`
            });
          } else {
            clipsData.push({
              id: item.id.videoId,
              title: item.snippet.title,
              channelName: item.snippet.channelTitle,
              platform: 'youtube',
              views: 'Recent Upload',
              duration: 'Video',
              thumb: item.snippet.thumbnails.high.url,
              url: `https://youtube.com/watch?v=${item.id.videoId}`
            });
          }
        });
        renderAllGrids();
      }
    } catch (err) {
      console.error("YouTube Content Fetch Error:", err);
    }
  }

  // --- 2. REAL TWITCH HELIX API ---
  async function fetchTwitchChannel(username) {
    if (!CONFIG.TWITCH_CLIENT_ID || CONFIG.TWITCH_CLIENT_ID.includes("YOUR_")) {
      console.warn("Watchly: Twitch API Credentials missing in CONFIG.");
      return;
    }

    const headers = {
      'Client-ID': CONFIG.TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${CONFIG.TWITCH_ACCESS_TOKEN}`
    };

    try {
      // Step A: Get Twitch User Profile
      const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(username.toLowerCase())}`, { headers });
      const userData = await userRes.json();
      if (!userData.data || userData.data.length === 0) return;

      const user = userData.data[0];

      // Step B: Get Real Live Follower Count
      const followRes = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}`, { headers });
      const followData = await followRes.json();
      const totalFollowers = followData.total || 0;

      // Step C: Check if currently live
      const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_id=${user.id}`, { headers });
      const streamData = await streamRes.json();
      const isLive = streamData.data && streamData.data.length > 0;
      const liveStream = isLive ? streamData.data[0] : null;

      const formattedChannel = {
        id: `tw-${user.id}`,
        rawId: user.id,
        name: user.display_name,
        handle: `@${user.login}`,
        platform: 'twitch',
        avatar: user.profile_image_url,
        count: totalFollowers,
        metricLabel: 'LIVE FOLLOWER COUNT',
        views: formatNumber(user.view_count || 0),
        isLive: isLive,
        category: liveStream ? liveStream.game_name : 'Offline',
        url: `https://twitch.tv/${user.login}`
      };

      upsertChannel(formattedChannel);

      if (isLive) {
        streamsData.push({
          id: liveStream.id,
          channelName: user.display_name,
          platform: 'twitch',
          title: liveStream.title,
          viewers: liveStream.viewer_count.toLocaleString(),
          game: liveStream.game_name,
          thumb: liveStream.thumbnail_url.replace('{width}', '640').replace('{height}', '360'),
          url: `https://twitch.tv/${user.login}`
        });
      }

      fetchTwitchClips(user.id, headers);

    } catch (err) {
      console.error("Twitch API Error:", err);
    }
  }

  async function fetchTwitchClips(broadcasterId, headers) {
    try {
      const res = await fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}&first=4`, { headers });
      const data = await res.json();

      if (data.data) {
        data.data.forEach(clip => {
          clipsData.push({
            id: clip.id,
            title: clip.title,
            channelName: clip.broadcaster_name,
            platform: 'twitch',
            views: `${formatNumber(clip.view_count)} views`,
            duration: `${Math.round(clip.duration)}s`,
            thumb: clip.thumbnail_url,
            url: clip.url
          });
        });
        renderAllGrids();
      }
    } catch (err) {
      console.error("Twitch Clips Error:", err);
    }
  }

  // --- Helper to Insert or Update Channels Array ---
  function upsertChannel(channelObj) {
    const index = channelsData.findIndex(c => c.id === channelObj.id);
    if (index >= 0) {
      channelsData[index] = channelObj;
    } else {
      channelsData.unshift(channelObj);
    }
    renderAllGrids();
  }

  // --- Render Grids to UI ---
  function renderAllGrids() {
    renderCounters();
    renderStreams();
    renderClips();
    renderChannels();
  }

  function renderCounters() {
    const filtered = filterData(channelsData);
    countersGrid.innerHTML = filtered.map(ch => `
      <div class="card" data-channel-id="${ch.id}">
        <div class="counter-card-inner">
          <div class="card-top">
            <div class="avatar-wrapper">
              <img src="${ch.avatar}" alt="${ch.name}" class="avatar-img" />
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
            <div class="counter-metric-label">${ch.metricLabel}</div>
            <div class="counter-number" id="card-counter-${ch.id}">${ch.count.toLocaleString()}</div>
          </div>
        </div>
      </div>
    `).join('');

    countersGrid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => openModal(card.getAttribute('data-channel-id')));
    });
  }

  function renderStreams() {
    const filtered = filterData(streamsData);
    streamsCountEl.textContent = filtered.length;

    streamsGrid.innerHTML = filtered.map(st => `
      <div class="card" onclick="window.open('${st.url}', '_blank')">
        <div class="card-thumb">
          <img src="${st.thumb}" alt="${st.title}" />
          <span class="badge-live"><i class="fa-solid fa-circle"></i> LIVE</span>
          <span class="badge-viewers"><i class="fa-solid fa-user"></i> ${st.viewers}</span>
        </div>
        <div class="card-content">
          <div class="card-title">${st.title}</div>
          <div class="card-subtext">
            <span>${st.channelName}</span>
            <span>${st.game}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderClips() {
    const filtered = filterData(clipsData);
    clipsCountEl.textContent = filtered.length;

    clipsGrid.innerHTML = filtered.map(clip => `
      <div class="card" onclick="window.open('${clip.url}', '_blank')">
        <div class="card-thumb">
          <img src="${clip.thumb}" alt="${clip.title}" />
          <span class="badge-duration">${clip.duration}</span>
        </div>
        <div class="card-content">
          <div class="card-title">${clip.title}</div>
          <div class="card-subtext">
            <span>${clip.channelName}</span>
            <span>${clip.views}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderChannels() {
    const filtered = filterData(channelsData);
    channelsCountEl.textContent = filtered.length;

    channelsGrid.innerHTML = filtered.map(ch => `
      <div class="card" data-channel-id="${ch.id}">
        <div class="channel-card-body">
          <img src="${ch.avatar}" alt="${ch.name}" class="channel-card-avatar" />
          <div class="card-channel-name">${ch.name}</div>
          <div class="card-handle" style="margin-bottom: 0.8rem;">${ch.handle}</div>
          <span class="badge-opensource" style="background: rgba(255,255,255,0.05); color: var(--text-secondary); border-color: var(--border-color)">
            <i class="fa-brands fa-${ch.platform}"></i> ${ch.platform.toUpperCase()}
          </span>
        </div>
      </div>
    `).join('');

    channelsGrid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => openModal(card.getAttribute('data-channel-id')));
    });
  }

  function filterData(items) {
    return items.filter(item => {
      const matchesPlatform = selectedPlatform === 'all' || item.platform === selectedPlatform;
      return matchesPlatform;
    });
  }

  // --- Modal Logic ---
  function openModal(channelId) {
    const channel = channelsData.find(c => c.id === channelId);
    if (!channel) return;

    modalAvatar.src = channel.avatar;
    modalPlatform.textContent = channel.platform;
    modalPlatform.style.color = channel.platform === 'twitch' ? 'var(--twitch-color)' : 'var(--youtube-color)';
    modalName.textContent = channel.name;
    modalHandle.textContent = channel.handle;
    modalCounterLabel.textContent = channel.metricLabel;
    modalCounterValue.textContent = channel.count.toLocaleString();
    modalViews.textContent = channel.views;
    modalStatus.textContent = channel.isLive ? 'LIVE' : 'Offline';
    modalStatus.style.color = channel.isLive ? 'var(--accent-green)' : 'var(--text-muted)';
    modalPlatformText.textContent = channel.platform === 'twitch' ? 'Twitch' : 'YouTube';
    modalExternalLink.href = channel.url;
    modalExternalLink.style.backgroundColor = channel.platform === 'twitch' ? 'var(--twitch-color)' : 'var(--youtube-color)';

    counterModal.classList.remove('hidden');
  }

  function closeModal() {
    counterModal.classList.add('hidden');
  }

  function formatNumber(num) {
    const n = parseInt(num);
    if (isNaN(n)) return '0';
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toString();
  }
});
