// js/script_main.js
import { sbClient, apiCall } from './supabase_client.js';

import viewAuth from '../components/view_auth.js';
import viewSidebar from '../components/view_sidebar.js';
import viewHome from '../components/view_home.js';
import viewChat from '../components/view_chat.js';
import viewStudy from '../components/view_study.js';
import viewPlay from '../components/view_play.js';
import viewAi from '../components/view_ai.js';
import viewTrade from '../components/view_trade.js';
import viewShop from '../components/view_shop.js';
import viewAdmin from '../components/view_admin.js';
import viewModals from '../components/modals.js';
import aegisMethods from '../components/script_aegis.js';

window.showDebug = function(msg, isError = false) {
  console.log(msg);
  let container = document.getElementById('debug-monitor-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'debug-monitor-container';
    container.style.cssText = 'position:fixed; bottom:10px; right:10px; z-index:999999; display:flex; flex-direction:column; gap:4px; max-width:80%; align-items:flex-end; pointer-events:none;';
    document.body.appendChild(container);
  }
  var d = document.createElement('div');
  d.style.cssText = `background:rgba(0,0,0,0.85); color:${isError ? '#ff4444' : '#00ff00'}; padding:8px 12px; font-size:11px; border-radius:6px; font-family:monospace; word-wrap:break-word; border-left: 3px solid ${isError ? '#ff4444' : '#00ff00'}; box-shadow: 0 4px 6px rgba(0,0,0,0.3); animation: slideIn 0.2s ease-out; pointer-events:auto;`;
  d.innerHTML = msg;
  container.appendChild(d);
  if (!document.getElementById('debug-styles')) {
    let style = document.createElement('style');
    style.id = 'debug-styles';
    style.innerHTML = `@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`;
    document.head.appendChild(style);
  }
  setTimeout(() => {
    d.style.transition = "opacity 0.5s ease-out"; d.style.opacity = "0";
    setTimeout(() => { if(d.parentElement) d.remove(); }, 500);
  }, 7000);
};

const appMixin = {
  data() {
    return {
      marketStatus: 'auto', showAegisStockModal: false,
      aegisStockForm: { selectedUsers: [], selectedStocks: [], amount: 1, action: 'give', customPrice: null },
      aegisDiscordMessage: '', aegisDiscordRoleId: '', aegisDiscordMentionEveryone: false,
      
      isAegisMode: window.appConfig ? window.appConfig.isAegisMode : false, 
      myLoginUrl: '', consumedToken: null, 
      isMobile: window.innerWidth < 768, mobileView: 'list', currentNavTab: 'home',
      errorMessage: null, isLoading: false, isSending: false, isFetching: false,
      
      currentUser: null, savedAccounts: [], isAutoLoggingIn: false, authMode: 'new', existingSearchId: '',
      showPinModal: false, pinInput: '', pendingLoginAccount: null,
      loginForm: { name: '', searchId: '', pin: '', charType: '🐰', charName: '' }, 
      autoLoginInfo: { display_name: '', char_type: '🐰' },
      availableIcons: ['🐰','🐶','🦊','🐻','🐼','🐯','🦁','🧑‍🎓','👩‍🎓','🤖','👻'], allUsers: [],
      
      channels: [], gdms: [], friends: [], friendRequests: [],
      currentChannelId: '', messages: [], inputText: '', editMessageId: null,
      isChannelLoading: false, contextMenu: { show: false, targetData: null, type: '', x: 0, y: 0 },
      flyingHearts: [], heartId: 0,
      
      notifications: [], tasks: [], studyLogs: [], todos: [], events: [], quizzes: [], weather: null,
      pollingInterval: null, timeUpdater: null, currentTime: new Date(),
      newTodo: '', newEvent: { title: '', date: '' }, studyForm: { subject: '', duration: '' }, taskUploadFiles: [],
      
      aiMode: 'chat', aiChatModel: 'google/gemma-4-31b-it:free', aiChatHistory: [], aiChatInput: '', aiVideoPrompt: '', aiVideoResult: null, isAILoading: false,
      
      showSettingsModal: false, settingsTab: 'profile', settingsForm: { display_name: '', discord_id: '', notif_task: true, notif_message: true, notif_general: true, dnd_hours: 0 },
      showAddFriendModal: false, searchIdInput: '', searchResult: null,
      showGroupDmModal: false, gdmForm: { name: '', members: [] },
      showCreateChannelModal: false, channelForm: { id: '', name: '', desc: '', icon_url: '', allowed_users: [] },
      showUserProfileModal: false, userProfileData: null, showFriendRequestModal: false, activeFriendRequest: null,
      showImageUploadModal: false, uploadingImageFile: null, selectedAllowedUsers: [],
      showSendTaskModal: false, showEditTaskModal: false, taskForm: { id: '', to: '', title: '', content: '', type: 'text', deadline: '', choicesStr: '' },
      showQuizModal: false, quizForm: { question: '', choice1: '', choice2: '', choice3: '', choice4: '', correct: '' },
      showDeleteAllModal: false, showPassbookModal: false, passbookData: [], isFetchingPassbook: false,
      
      adminSubTab: 'stats', isFetchingAdmin: false, adminStats: null, adminChartInstance: null, adminHourChartInstance: null, adminUserList: [], adminMessages: [], adminNotifs: [], adminWebhooks: [], adminManualWebhookText: '', adminManualWebhookUrl: '', showAdminUserModal: false, adminSelectedUser: null, adminEditForm: { allowed_start: '', allowed_end: '', role: '', parent_id: '', search_id: '', discord_id: '', coins: 0 }, adminNotifForm: { content: '' }, adminNotifFile: null, adminAddFriendId: '', isSendingAdmin: false,

      shopTab: 'items', rankingList: [], themeItems: [ { id: 'theme_sakura', name: 'さくらピンク', price: 1000, type: 'theme', icon: '🌸' }, { id: 'theme_dark', name: 'ナイトモード', price: 3000, type: 'theme', icon: '🌙' }, { id: 'theme_gold', name: 'VIPゴールド', price: 10000, type: 'theme', icon: '👑' } ], stampItems: [ { id: 'stamp_basic', name: '日常あいさつ', price: 500, type: 'stamp', icon: '👋' }, { id: 'stamp_trader', name: '投資家', price: 1500, type: 'stamp', icon: '📈' }, { id: 'stamp_animal', name: 'アニマル', price: 800, type: 'stamp', icon: '🐾' } ],
      tradeData: { stocks: [], scenarios: {}, portfolios: [], news: [] }, isLoadingTrade: false, tradeFilter: 'real', selectedStock: null, tradeAmount: 1, tradeChartInstance: null, chartDays: 1, currentMinuteDataCache: {}, tradeNews: null, isSendingTrade: false, lastChartUpdateTime: ''
    };
  },
  
  computed: {
    showListArea() { if (!this.isMobile) return ['activity', 'chat', 'teams'].includes(this.currentNavTab); return this.mobileView === 'list'; },
    showMainArea() { if (!this.isMobile) return true; return this.mobileView === 'detail'; },
    unreadNotifications() { return this.notifications.filter(n => !n.is_read).length > 0; },
    unsubmittedTasks() { return this.tasks.filter(t => t.to_user === this.currentUser?.user_id && t.status === 'assigned'); },
    activeNotifications() { return this.notifications.filter(n => !n.is_read); },
    currentTimeStr() { const h = this.currentTime.getHours().toString().padStart(2, '0'); const m = this.currentTime.getMinutes().toString().padStart(2, '0'); const s = this.currentTime.getSeconds().toString().padStart(2, '0'); return `${h}:${m}:${s}`; },
    clockHands() { const h = this.currentTime.getHours(); const m = this.currentTime.getMinutes(); const s = this.currentTime.getSeconds(); const hDeg = (h % 12) * 30 + (m / 2); const mDeg = m * 6; const sDeg = s * 6; return { hX: 50 + 25 * Math.sin(hDeg * Math.PI / 180), hY: 50 - 25 * Math.cos(hDeg * Math.PI / 180), mX: 50 + 35 * Math.sin(mDeg * Math.PI / 180), mY: 50 - 35 * Math.cos(mDeg * Math.PI / 180), sX: 50 + 40 * Math.sin(sDeg * Math.PI / 180), sY: 50 - 40 * Math.cos(sDeg * Math.PI / 180) }; },
    currentYearMonth() { return `${this.currentTime.getFullYear()}年 ${this.currentTime.getMonth() + 1}月`; },
    calendarDays() { const y = this.currentTime.getFullYear(); const m = this.currentTime.getMonth(); const daysInMonth = new Date(y, m + 1, 0).getDate(); const firstDay = new Date(y, m, 1).getDay(); const days = Array(firstDay).fill(''); for (let i = 1; i <= daysInMonth; i++) days.push(i); return days; },
    todaysEvents() { const t = new Date(); const m = (t.getMonth() + 1).toString().padStart(2, '0'); const d = t.getDate().toString().padStart(2, '0'); const tStr = `${t.getFullYear()}-${m}-${d}`; return this.events.filter(e => e.event_date.startsWith(tStr)); },
    dndStatusText() { if (!this.currentUser || !this.currentUser.dnd_until) return null; const dnd = new Date(this.currentUser.dnd_until); if (dnd > new Date()) { const m = dnd.getMonth() + 1; const d = dnd.getDate(); const h = dnd.getHours(); const min = dnd.getMinutes().toString().padStart(2, '0'); return `${m}/${d} ${h}:${min}`; } return null; },
    currentChannelName() { if (this.currentChannelId.startsWith('dm_')) { const f = this.friends.find(x => this.getDmId(this.currentUser?.user_id, x.user_id) === this.currentChannelId); return f ? f.display_name : 'DM'; } if (this.currentChannelId.startsWith('gdm_')) { const g = this.gdms.find(g => g.channel_id === this.currentChannelId); return g ? g.name : 'グループDM'; } const c = this.channels.find(c => c.channel_id === this.currentChannelId); return c ? c.name : ''; },
    currentChannelMembers() { if (this.currentChannelId.startsWith('dm_')) return this.friends; const ch = [...this.channels, ...this.gdms].find(c => c.channel_id === this.currentChannelId); if (ch && ch.members) { try { const mids = typeof ch.members === 'string' ? JSON.parse(ch.members) : ch.members; return this.friends.filter(f => mids.includes(f.user_id)); } catch (e) { return []; } } return []; },
    myTasks() { return this.tasks.filter(t => t.to_user === this.currentUser?.user_id); },
    sentTasks() { return this.tasks.filter(t => t.from_user === this.currentUser?.user_id); },
    totalStudyTime() { return this.studyLogs.reduce((acc, l) => acc + (parseInt(l.duration) || 0), 0); },
    filteredStocks() { if (!this.tradeData || !this.tradeData.stocks) return []; return this.tradeData.stocks.filter(s => this.tradeFilter === 'real' ? !s.is_fictional : s.is_fictional); },
    currentSelectedPrice() { if (!this.selectedStock) return 0; return this.getCurrentStockPrice(this.selectedStock.stock_code); },
    isStockPriceUp() { if (!this.selectedStock) return true; const cache = this.currentMinuteDataCache[this.selectedStock.stock_code]; if (!cache || cache.length < 2) return true; const nowStr = this.getJstTimeStr(); const endStr = nowStr > "21:00" ? "21:00" : (nowStr < "07:00" ? "07:00" : nowStr); const displayData = cache.filter(d => d.time <= endStr); if (displayData.length < 2) return true; return displayData[displayData.length - 1].price >= displayData[displayData.length - 2].price; },
    isTradeClosed() { if (this.marketStatus === 'open') return false; if (this.marketStatus === 'closed') return true; const nowStr = this.getJstTimeStr(); return nowStr < "07:00" || nowStr >= "21:30"; },
    canBuyStock() { if (!this.currentUser || !this.selectedStock) return false; return (this.currentSelectedPrice * this.tradeAmount) <= (this.currentUser.coins || 0); },
    canSellStock() { if (!this.selectedStock) return false; return this.getOwnedQuantity(this.selectedStock.stock_code) >= this.tradeAmount; }
  },
  
  methods: {
    ...aegisMethods,
    
    navClass(tab) { return { 'text-indigo-400 bg-slate-800': this.currentNavTab === tab, 'text-slate-400 hover:text-slate-200': this.currentNavTab !== tab, 'p-2 md:p-3 w-10 md:w-12 h-10 md:h-12 rounded-xl transition flex justify-center items-center': true }; },
    switchNav(tab) { this.currentNavTab = tab; if (this.isMobile) { this.mobileView = ['chat', 'teams', 'activity'].includes(tab) ? 'list' : 'detail'; } setTimeout(() => { if (tab === 'shop') this.fetchRanking(); if (tab === 'trade') this.fetchTradeData(); if (tab === 'admin') this.changeAdminTab('stats'); }, 50); },
    getCharIcon(type) { return type || '🐰'; },
    getUserName(id) { const f = this.friends.find(x => x.user_id === id); return f ? f.display_name : '不明'; },
    closeMenus() { this.contextMenu.show = false; },
    isToday(d) { if (!d) return false; const t = new Date(); return t.getDate() === d && t.getMonth() === this.currentTime.getMonth() && t.getFullYear() === this.currentTime.getFullYear(); },
    openUrl(url) { window.open(url, '_blank'); },
    isExpired(dt) { if (!dt) return false; return new Date(dt) < new Date(); },
    getDmId(id1, id2) { if (!id1 || !id2) return ''; return 'dm_' + [id1, id2].sort().join('_'); },
    selectChannel(id) { this.currentChannelId = id; this.messages = []; if (this.isMobile) this.mobileView = 'detail'; this.fetchData(true); },
    selectDm(f) { this.currentChannelId = this.getDmId(this.currentUser?.user_id, f.user_id); this.messages = []; if (this.isMobile) this.mobileView = 'detail'; this.fetchData(true); },
    
    initAuth() {
      let token = window.appConfig?.loginToken || '';
      let aegis = window.appConfig?.isAegisMode ? 'go' : '';
      this.isAegisMode = (aegis === 'go');

      if (token && this.consumedToken !== token) {
        this.loginWithToken(token);
        return;
      }

      try {
        let saved = localStorage.getItem('selfConnectAccounts');
        if (saved) {
          this.savedAccounts = JSON.parse(saved);
          const lastUsed = localStorage.getItem('selfConnectLastUserId');
          if (lastUsed) {
            const acc = this.savedAccounts.find(a => a.user_id === lastUsed);
            if (acc) {
              if (acc.pin) { this.requestPin(acc); return; }
              else { this.loginWithSaved(acc); return; }
            }
          }
          if (this.savedAccounts.length > 0) this.authMode = 'select';
        }
      } catch (e) {}
    },

    async loginWithToken(userId) {
      this.isAutoLoggingIn = true;
      try {
        let saved = []; try { saved = JSON.parse(localStorage.getItem('selfConnectAccounts') || '[]'); } catch(e){}
        const localAcc = saved.find(a => a.user_id === userId);
        if (localAcc) {
          // ローカルにあれば「ようこそ」用に先にセット
          this.autoLoginInfo = { display_name: localAcc.display_name, char_type: localAcc.char_type };
        } else {
          this.autoLoginInfo = { display_name: 'ユーザー', char_type: '🐰' };
        }

        const { success, data } = await apiCall('users', 'select', '*', { eq: { column: 'user_id', value: userId } });
        if (!success || data.length === 0) {
          this.isAutoLoggingIn = false; this.authMode = 'new'; this.errorMessage = "ログインURLが無効です"; return;
        }

        const user = data[0];
        // Supabaseから取得できたら「ようこそ」の表示名を更新
        this.autoLoginInfo = { display_name: user.display_name, char_type: user.char_type };

        if (user.is_blocked) { this.isAutoLoggingIn = false; this.authMode = 'new'; this.errorMessage = "凍結されています"; return; }

        this.consumedToken = userId;
        const newAcc = { user_id: user.user_id, display_name: user.display_name, char_type: user.char_type, search_id: user.search_id };
        this.saveToLocal(newAcc);
        localStorage.setItem('selfConnectLastUserId', user.user_id);
        
        this.currentUser = user;
        if (this.isAegisMode && this.currentUser.role !== 'admin' && this.currentUser.role !== 'root') {
          this.authMode = 'select'; this.currentUser = null; this.isAutoLoggingIn = false; this.errorMessage = "Aegis Systemへのアクセス権限がありません"; return;
        }
        await this.loadInitialDataFromSupabase(userId);
      } catch (e) { this.isAutoLoggingIn = false; this.errorMessage = "エラー"; this.authMode = 'new'; }
    },

    async loginWithSaved(acc) {
      this.isAutoLoggingIn = true;
      this.autoLoginInfo = acc; // 既存のアカウント情報で「ようこそ」を表示
      try {
        const { success, data } = await apiCall('users', 'select', '*', { eq: { column: 'user_id', value: acc.user_id } });
        if (!success || data.length === 0 || data[0].is_blocked) {
          this.isAutoLoggingIn = false; this.currentUser = null; this.authMode = 'select'; this.errorMessage = "アカウントが見つかりません"; return;
        }
        
        localStorage.setItem('selfConnectLastUserId', data[0].user_id);
        this.currentUser = data[0];
        if (this.isAegisMode && this.currentUser.role !== 'admin' && this.currentUser.role !== 'root') {
          this.authMode = 'select'; this.currentUser = null; this.isAutoLoggingIn = false; this.errorMessage = "Aegis Systemへのアクセス権限がありません"; return;
        }
        await this.loadInitialDataFromSupabase(data[0].user_id);
      } catch (e) { this.isAutoLoggingIn = false; this.errorMessage = "エラー"; this.authMode = 'select'; }
    },

    requestPin(acc) {
      if (acc.pin) { this.pendingLoginAccount = acc; this.pinInput = ''; this.showPinModal = true; }
      else { this.loginWithSaved(acc); }
    },
    verifyPin() {
      this.isLoading = true;
      setTimeout(() => {
        this.isLoading = false;
        if (this.pinInput === this.pendingLoginAccount.pin) { this.showPinModal = false; this.loginWithSaved(this.pendingLoginAccount); }
        else { this.errorMessage = "パスワードが違います"; this.pinInput = ''; }
      }, 500);
    },
    deleteLocalAccount(uid) {
      this.savedAccounts = this.savedAccounts.filter(a => a.user_id !== uid);
      localStorage.setItem('selfConnectAccounts', JSON.stringify(this.savedAccounts));
      if (this.savedAccounts.length === 0) this.authMode = 'new';
    },
    async startApp() {
      if (!this.loginForm.name || !this.loginForm.searchId) { this.errorMessage = '入力必須です'; return; }
      this.isLoading = true;
      const userData = { user_id: 'usr_' + Math.random().toString(36).substr(2, 9), display_name: this.loginForm.name, search_id: this.loginForm.searchId, char_type: this.loginForm.charType, char_name: this.loginForm.charName };
      try {
        const { success } = await apiCall('users', 'insert', [userData]);
        if (!success) { this.isLoading = false; this.errorMessage = "登録エラー"; return; }
        const userToSave = userData;
        if (this.loginForm.pin) userToSave.pin = this.loginForm.pin;
        this.saveToLocal(userToSave);
        this.loginWithSaved(userToSave);
      } catch (e) { this.isLoading = false; this.errorMessage = "エラー"; }
    },
    async loginExisting() {
      if (!this.existingSearchId) return;
      this.isLoading = true;
      try {
        const { success, data } = await apiCall('users', 'select', '*', { eq: { column: 'search_id', value: this.existingSearchId } });
        if (success && data.length > 0) { this.saveToLocal(data[0]); this.loginWithSaved(data[0]); }
        else { this.isLoading = false; this.errorMessage = "見つかりません。"; }
      } catch (e) { this.isLoading = false; this.errorMessage = "エラー"; }
    },
    saveToLocal(user) {
      try {
        let idx = this.savedAccounts.findIndex(a => a.user_id === user.user_id);
        if (idx === -1) this.savedAccounts.push(user); else this.savedAccounts[idx] = user;
        localStorage.setItem('selfConnectAccounts', JSON.stringify(this.savedAccounts));
      } catch (e) {}
    },

    async loadInitialDataFromSupabase(userId) {
      window.showDebug(`[DEBUG] 🔧 Supabase から初期データを取得中...`);
      try {
        const [usersRes, channelsRes, friendsRes, notifRes] = await Promise.all([
          apiCall('users', 'select', 'user_id, display_name, char_type, char_level, char_exp, coins, last_active'),
          apiCall('channels', 'select', '*'),
          apiCall('friends', 'select', '*'),
          apiCall('notifications', 'select', '*', { eq: { column: 'target_user_id', value: userId } })
        ]);

        this.allUsers = usersRes.success ? usersRes.data : [];
        const allCh = channelsRes.success ? channelsRes.data : [];
        this.channels = allCh.filter(c => c.type !== 'gdm');
        this.gdms = allCh.filter(c => c.type === 'gdm' && c.members && c.members.includes(userId));
        
        this.myLoginUrl = window.location.origin + window.location.pathname + "?token=" + userId;
        if (this.fetchMarketStatus) this.fetchMarketStatus();
        
        if (this.channels.length > 0) this.currentChannelId = this.channels[0].channel_id;
        
        setTimeout(() => {
          this.isAutoLoggingIn = false;
          this.isLoading = false; 
          if (this.isAegisMode) { this.currentNavTab = 'admin'; this.switchNav('admin'); } 
          else { this.currentNavTab = 'home'; this.switchNav('home'); }
          
          // ★ 追加: ポーリング関数をここで確実に呼び出す
          this.startPolling();
          
          if (this.timeUpdater) clearInterval(this.timeUpdater);
          this.timeUpdater = setInterval(() => { this.currentTime = new Date(); }, 1000);
          window.showDebug(`[OK] 🎉 ログイン完了`);
        }, 500);

      } catch(e) {
        window.showDebug(`[ERROR] ❌ 初期データ取得に失敗`, true);
      }
    },

    // ★ 復元: ポーリングタイマー関数と取得関数
    startPolling() {
      this.fetchData(false);
      if (this.pollingInterval) clearInterval(this.pollingInterval);
      this.pollingInterval = setInterval(() => this.fetchData(false), 6000);
    },
    
    async fetchData(showLoading = false) { 
      if ((!this.currentChannelId && !['home','study','admin','play'].includes(this.currentNavTab)) || this.isFetching) return; 
      this.isFetching = true; 
      if (showLoading) this.isChannelLoading = true; 
      try { 
        if (this.currentChannelId) {
          const msgRes = await apiCall('messages', 'select', '*', { eq: { column: 'channel_id', value: this.currentChannelId } });
          if (msgRes.success) {
            const userMap = {}; this.allUsers.forEach(u => userMap[u.user_id] = u);
            this.messages = msgRes.data.map(m => { m.user = userMap[m.user_id] || { display_name: '退会済' }; return m; });
          }
        }
        if (showLoading) this.scrollToBottom(); 
      } catch(e) { 
        window.showDebug(`[ERROR] ❌ ポーリング失敗`, true);
      } finally {
        this.isFetching = false; 
        this.isChannelLoading = false; 
      }
    },
    scrollToBottom() { setTimeout(() => { const container = document.getElementById('chatContainer'); if (container) container.scrollTop = container.scrollHeight; }, 100); },
    logout() {
      try { localStorage.removeItem('selfConnectLastUserId'); } catch (e) {}
      clearInterval(this.pollingInterval); clearInterval(this.timeUpdater);
      this.currentUser = null; this.showSettingsModal = false; this.isLoading = false;
      this.authMode = this.savedAccounts.length > 0 ? 'select' : 'new';
    },

    // ----------------------------------------------------
    // ここから下の機能関数（Trade, Admin, Shop等）は、
    // まだ「GAS用のapiCall('関数名')」で書かれています。
    // SupabaseのRPC機能の準備ができ次第、これらの通信部分も
    // すべてSupabase用に切り替えていきます！
    // ----------------------------------------------------
    formatDate(d) { const date = new Date(d); if (isNaN(date)) return ''; const m = date.getMonth() + 1; const day = date.getDate(); const h = date.getHours(); const min = date.getMinutes().toString().padStart(2, '0'); return `${m}/${day} ${h}:${min}`; },
  },

  mounted() {
    this.initAuth();
    this.chartDays = 1;
    window.addEventListener('resize', () => { this.isMobile = window.innerWidth < 768; });
  },
  
  unmounted() {
    clearInterval(this.pollingInterval);
    clearInterval(this.timeUpdater);
  }
};

const app = Vue.createApp({
  components: {
    'view-auth': viewAuth,
    'view-sidebar': viewSidebar,
    'view-home': viewHome,
    'view-chat': viewChat,
    'view-study': viewStudy,
    'view-play': viewPlay,
    'view-ai': viewAi,
    'view-trade': viewTrade,
    'view-shop': viewShop,
    'view-admin': viewAdmin,
    'view-modals': viewModals
  }
});

app.mixin(appMixin);

app.mount('#app');
