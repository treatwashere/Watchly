/**
 * Watchly Front-end Application Engine
 * Handles live subscriber simulation, platform switching, and dynamic cards.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    platform: 'twitch', // 'twitch' | 'youtube'
    channelName: 'kaicenat',
    followerCount: 10485210,
    isLive: true,
    viewers: 74320,
    intervalId: null
  };

  // Mock Database for quick demo switching
  const mockData = {
    twitch: {
      name: 'KaiCenat',
      badge: '<i class="fa-brands fa-twitch"></i> Twitch Partner',
      badgeClass: 'badge-twitch',
      metricLabel: 'LIVE FOLLOWER COUNT',
      count: 10485210,
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
      viewers: '74,320',
      views: '184.2M',
      subs: '89,410',
      category: 'Just Chatting',
      btnColor: 'var(--twitch-color)',
      clips: [
        { title: 'Craziest Mafia Stream Highlight', views: '1.2M views', duration: '0:59', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
        { title: 'Guest reaction to unexpected caller', views: '840K views', duration: '0:30', img: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400' },
        { title: 'Subathon day 15 milestone reached!', views: '620K views', duration: '1:15', img: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400' }
      ]
    },
    youtube: {
      name: 'MrBeast',
      badge: '<i class="fa-brands fa-youtube"></i> YouTube Verified',
      badgeClass: 'badge-youtube',
      metricLabel: 'LIVE SUBSCRIBER COUNT',
      count: 310490120,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      viewers: 'N/A (Offline)',
      views: '58.4B',
      subs: '310.4M',
      category: 'Entertainment',
      btnColor: 'var(--youtube-color)',
      clips: [
        { title: '$1,000,000 Hotel vs $1 Hotel!', views: '85M views', duration: '20:14', img: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=400' },
        { title: '7 Days Stranded At Sea', views: '112M views', duration: '24:02', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400' },
        { title: 'Surviving 100 Days In Bunker', views: '94M views', duration: '18:45', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400' }
      ]
    }
  };

  // DOM Elements
  const platformBtns = document.querySelectorAll('.platform-btn');
  const searchForm = document.getElementById('search-form');
  const channelInput = document.getElementById('channel-input');
  
  const channelNameEl = document.getElementById('channel-name');
  const channelAvatarEl = document.getElementById('channel-avatar');
  const platformBadgeEl = document.getElementById('platform-badge');
  const metricLabelEl = document.getElementById('metric-label');
  const liveCounterEl = document.getElementById('live-counter-num');
  
  const metricViewers = document.getElementById('metric-viewers');
  const metricViews = document.getElementById('metric-views');
  const metricSubs = document.getElementById('metric-subs');
  const metricCategory = document.getElementById('metric-category');
  
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const clipsGrid = document.getElementById('clips-grid');
  const videosGrid = document.getElementById('videos-grid');

  // Initialize
  init();

  function init() {
    setupEventListeners();
    updateDashboard(mockData[state.platform]);
    startLiveCounterTicker();
  }

  function setupEventListeners() {
    // Platform Toggle Switcher
    platformBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        platformBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.platform = btn.getAttribute('data-platform');
        
        // Update placeholder input text
        if (state.platform === 'twitch') {
          channelInput.placeholder = "Enter Twitch username (e.g. kaicenat)...";
          channelInput.value = "kaicenat";
        } else {
          channelInput.placeholder = "Enter YouTube channel handle (e.g. MrBeast)...";
          channelInput.value = "mrbeast";
        }

        updateDashboard(mockData[state.platform]);
      });
    });

    // Search Form Submit
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = channelInput.value.trim();
      if (!query) return;

      // Simulate search / fetch
      state.channelName = query;
      channelNameEl.textContent = query;
      
      // Simulate slightly updated baseline count
      state.followerCount = Math.floor(Math.random() * 500000) + 1000000;
      renderCounterValue(state.followerCount);
    });

    // Content Tabs Switcher
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');
        document.getElementById(`pane-${targetTab}`).classList.add('active');
      });
    });
  }

  function updateDashboard(data) {
    channelNameEl.textContent = data.name;
    channelAvatarEl.src = data.avatar;
    platformBadgeEl.innerHTML = data.badge;
    platformBadgeEl.className = `badge ${data.badgeClass}`;
    metricLabelEl.textContent = data.metricLabel;
    
    metricViewers.textContent = data.viewers;
    metricViews.textContent = data.views;
    metricSubs.textContent = data.subs;
    metricCategory.textContent = data.category;

    state.followerCount = data.count;
    renderCounterValue(state.followerCount);

    // Render Clips
    renderCards(clipsGrid, data.clips);
    renderCards(videosGrid, data.clips);
  }

  // Live counter animation ticker simulating real-time socket updates
  function startLiveCounterTicker() {
    if (state.intervalId) clearInterval(state.intervalId);

    state.intervalId = setInterval(() => {
      // Random increment (+1 to +5 followers)
      const delta = Math.floor(Math.random() * 5) + 1;
      state.followerCount += delta;
      
      renderCounterValue(state.followerCount);
      flashCounter();
    }, 2500);
  }

  function renderCounterValue(val) {
    liveCounterEl.textContent = val.toLocaleString();
  }

  function flashCounter() {
    liveCounterEl.classList.add('flash');
    setTimeout(() => {
      liveCounterEl.classList.remove('flash');
    }, 400);
  }

  function renderCards(container, items) {
    container.innerHTML = items.map(item => `
      <div class="card-item">
        <div class="card-thumb">
          <img src="${item.img}" alt="${item.title}" />
          <span class="card-duration">${item.duration}</span>
        </div>
        <div class="card-body">
          <div class="card-title">${item.title}</div>
          <div class="card-meta">
            <span><i class="fa-solid fa-eye"></i> ${item.views}</span>
            <span>2 days ago</span>
          </div>
        </div>
      </div>
    `).join('');
  }
});
