/**
 * Watchly - Frontend Interactive Engine
 * Handles searching, platform filtering, tab switching, modal updates, 
 * and live-counter ticking simulations.
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- Mock Data ---
  const channelsData = [
    {
      id: 'kaicenat',
      name: 'Kai Cenat',
      handle: '@kaicenat',
      platform: 'twitch',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
      count: 10485210,
      metricLabel: 'LIVE FOLLOWER COUNT',
      views: '184.2M',
      isLive: true,
      category: 'Just Chatting',
      url: 'https://twitch.tv/kaicenat'
    },
    {
      id: 'mrbeast',
      name: 'MrBeast',
      handle: '@MrBeast',
      platform: 'youtube',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      count: 310490120,
      metricLabel: 'LIVE SUBSCRIBER COUNT',
      views: '58.4B',
      isLive: false,
      category: 'Entertainment',
      url: 'https://youtube.com/@MrBeast'
    },
    {
      id: 'xqc',
      name: 'xQc',
      handle: '@xqc',
      platform: 'twitch',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      count: 11982400,
      metricLabel: 'LIVE FOLLOWER COUNT',
      views: '520.1M',
      isLive: true,
      category: 'Grand Theft Auto V',
      url: 'https://twitch.tv/xqc'
    },
    {
      id: 'mkbhd',
      name: 'Marques Brownlee',
      handle: '@MKBHD',
      platform: 'youtube',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150',
      count: 18902300,
      metricLabel: 'LIVE SUBSCRIBER COUNT',
      views: '4.1B',
      isLive: false,
      category: 'Science & Technology',
      url: 'https://youtube.com/@MKBHD'
    },
    {
      id: 'pokimane',
      name: 'Pokimane',
      handle: '@pokimane',
      platform: 'twitch',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      count: 9340120,
      metricLabel: 'LIVE FOLLOWER COUNT',
      views: '210.5M',
      isLive: true,
      category: 'VALORANT',
      url: 'https://twitch.tv/pokimane'
    },
    {
      id: 'pyro',
      name: 'Lofi Girl',
      handle: '@LofiGirl',
      platform: 'youtube',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      count: 14200000,
      metricLabel: 'LIVE SUBSCRIBER COUNT',
      views: '1.9B',
      isLive: true,
      category: 'Music',
      url: 'https://youtube.com/@LofiGirl'
    }
  ];

  const streamsData = [
    {
      id: 'stream-1',
      channelId: 'kaicenat',
      channelName: 'Kai Cenat',
      platform: 'twitch',
      title: 'MAFIA STREAM DAY 3! SPECIAL GUESTS IN THE BUILDING!',
      viewers: '84,120',
      game: 'Just Chatting',
      thumb: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500',
      url: 'https://twitch.tv/kaicenat'
    },
    {
      id: 'stream-2',
      channelId: 'xqc',
      channelName: 'xQc',
      platform: 'twitch',
      title: 'JUICER GAMING! RANK 1 RADIANT CLIMB THEN REACTION TIME',
      viewers: '62,490',
      game: 'VALORANT',
      thumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500',
      url: 'https://twitch.tv/xqc'
    },
    {
      id: 'stream-3',
      channelId: 'pyro',
      channelName: 'Lofi Girl',
      platform: 'youtube',
      title: 'lofi hip hop radio 📚 - beats to relax/study to',
      viewers: '31,800',
      game: 'Music',
      thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
      url: 'https://youtube.com/@LofiGirl'
    }
  ];

  const clipsData = [
    {
      id: 'clip-1',
      title: '$1,000,000 Hotel vs $1 Hotel Highlight!',
      channelName: 'MrBeast',
      platform: 'youtube',
      views: '12.4M views',
      duration: '0:58',
      thumb: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=500',
      url: 'https://youtube.com/@MrBeast'
    },
    {
      id: 'clip-2',
      title: 'Unbelievable clutch in final circle!',
      channelName: 'Pokimane',
      platform: 'twitch',
      views: '842K views',
      duration: '0:30',
      thumb: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500',
      url: 'https://twitch.tv/pokimane'
    },
    {
      id: 'clip-3',
      title: 'Apple Vision Pro Secret Feature Revealed',
      channelName: 'Marques Brownlee',
      platform: 'youtube',
      views: '3.1M views',
      duration: '1:45',
      thumb: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500',
      url: 'https://youtube.com/@MKBHD'
    }
  ];

  // --- State Variables ---
  let selectedPlatform = 'all'; // 'all' | 'twitch' | 'youtube'
  let searchQuery = '';
  let activeTab = 'live-counts';
  let activeModalChannel = null;

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

  // --- Initialization ---
  function init() {
    setupEventListeners();
    renderAllGrids();
    startLiveTicker();
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

    // Search Input
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      clearSearchBtn.classList.toggle('hidden', searchQuery === '');
      renderAllGrids();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      renderAllGrids();
    });

    // Modal Close Events
    closeModalBtn.addEventListener('click', closeModal);
    counterModal.addEventListener('click', (e) => {
      if (e.target === counterModal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  // --- Filtering Helpers ---
  function filterByPlatformAndSearch(items, nameKey = 'name') {
    return items.filter(item => {
      const matchesPlatform = selectedPlatform === 'all' || item.platform === selectedPlatform;
      const matchesSearch = searchQuery === '' || 
        item[nameKey].toLowerCase().includes(searchQuery) || 
        (item.handle && item.handle.toLowerCase().includes(searchQuery));
      return matchesPlatform && matchesSearch;
    });
  }

  // --- Render Functions ---
  function renderAllGrids() {
    renderCounters();
    renderStreams();
    renderClips();
    renderChannels();
  }

  function renderCounters() {
    const filtered = filterByPlatformAndSearch(channelsData);
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

    // Attach Click Event to Counter Cards
    countersGrid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-channel-id');
        openModal(id);
      });
    });
  }

  function renderStreams() {
    const filtered = filterByPlatformAndSearch(streamsData, 'channelName');
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
    const filtered = filterByPlatformAndSearch(clipsData, 'title');
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
    const filtered = filterByPlatformAndSearch(channelsData);
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
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-channel-id');
        openModal(id);
      });
    });
  }

  // --- Modal Logic ---
  function openModal(channelId) {
    const channel = channelsData.find(c => c.id === channelId);
    if (!channel) return;

    activeModalChannel = channel;
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
    activeModalChannel = null;
  }

  // --- Real-time Ticker Simulation ---
  function startLiveTicker() {
    setInterval(() => {
      // Pick 2 random channels to update
      const channelA = channelsData[Math.floor(Math.random() * channelsData.length)];
      const deltaA = Math.floor(Math.random() * 8) + 1;
      channelA.count += deltaA;

      // Update card element if present
      const elA = document.getElementById(`card-counter-${channelA.id}`);
      if (elA) {
        elA.textContent = channelA.count.toLocaleString();
        elA.classList.add('flash');
        setTimeout(() => elA.classList.remove('flash'), 400);
      }

      // Update modal if active
      if (activeModalChannel && activeModalChannel.id === channelA.id) {
        modalCounterValue.textContent = channelA.count.toLocaleString();
        modalCounterValue.classList.add('flash');
        setTimeout(() => modalCounterValue.classList.remove('flash'), 400);
      }

    }, 2000);
  }

  // Run initialization
  init();
});
