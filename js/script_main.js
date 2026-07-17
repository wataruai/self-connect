// js/script_main.js
import { sbClient, apiCall } from './supabase_client.js';

// 各コンポーネントの読み込み
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
    d.style.transition = "opacity 0.5s ease-out";
    d.style.opacity = "0";
    setTimeout(() => { if(d.parentElement) d.remove(); }, 500);
  }, 7000);
};

// ★ Vueの大元のデータを mixin として定義
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
      loginForm: { name: '', searchId: '', pin: '', charType: '🐰', charName: '' }, autoLoginInfo: { display_name: '', char_type: '🐰' },
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
    isStockPriceUp() { if (!this.selectedStock) return true; const cache = this.currentMinuteDataCache[this.selectedStock.stock_code]; if (!cache || cache.length < 2) return true; const nowStr = this.getJstTimeStr(); const endStr = nowStr > "21:30" ? "21:30" : (nowStr < "07:00" ? "07:00" : nowStr); const displayData = cache.filter(d => d.time <= endStr); if (displayData.length < 2) return true; return displayData[displayData.length - 1].price >= displayData[displayData.length - 2].price; },
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
    
    // --- 認証・ログイン ---
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
          this.autoLoginInfo = { display_name: localAcc.display_name, char_type: localAcc.char_type };
        } else {
          this.autoLoginInfo = { display_name: 'ユーザー', char_type: '🐰' };
        }

        // Supabase の場合は、GASの apiCall('getInitialData') に相当する処理を直接叩くか、
        // 今回はとりあえずそのまま呼び出し（後でSupabase版に切り替えます）
        // ※まずは既存機能復旧のため元のままにしてあります
        const { success, data } = await apiCall('users', 'select', '*', { eq: { column: 'user_id', value: userId } });
        if (!success || data.length === 0) {
          this.isAutoLoggingIn = false; this.authMode = 'new'; this.errorMessage = "ログインURLが無効です"; return;
        }

        const user = data[0];
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
      this.autoLoginInfo = acc;
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
          
          this.startPolling();
          if (this.timeUpdater) clearInterval(this.timeUpdater);
          this.timeUpdater = setInterval(() => { this.currentTime = new Date(); }, 1000);
          window.showDebug(`[OK] 🎉 ログイン完了`);
        }, 500);

      } catch(e) {
        window.showDebug(`[ERROR] ❌ 初期データ取得に失敗`, true);
      }
    },

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

    // --- その他 UI系 ---
    openSettings() {
      let settings = {};
      try { settings = JSON.parse(this.currentUser.notif_settings || '{}'); } catch(e) {}
      this.settingsForm = {
        display_name: this.currentUser.display_name,
        discord_id: this.currentUser.discord_id || '',
        notif_task: settings.task !== false,
        notif_message: settings.message !== false,
        notif_general: settings.general !== false,
        dnd_hours: 0
      };
      this.settingsTab = 'profile';
      this.showSettingsModal = true;
    },
    async saveSettings() {
      this.isLoading = true;
      try {
        let dnd_until = this.currentUser.dnd_until;
        if (this.settingsForm.dnd_hours > 0) {
          const d = new Date(); d.setHours(d.getHours() + this.settingsForm.dnd_hours); dnd_until = d.toISOString();
        } else if (this.settingsForm.dnd_hours === -1) { dnd_until = ''; }
        const settingsJson = JSON.stringify({ task: this.settingsForm.notif_task, message: this.settingsForm.notif_message, general: this.settingsForm.notif_general });
        const res = await apiCall('users', 'update', { display_name: this.settingsForm.display_name, discord_id: this.settingsForm.discord_id, notif_settings: settingsJson, dnd_until: dnd_until }, { eq: { column: 'user_id', value: this.currentUser.user_id } });
        if (res.success) {
          this.currentUser.display_name = this.settingsForm.display_name;
          this.showSettingsModal = false; this.errorMessage = "設定を保存しました"; this.saveToLocal(this.currentUser);
        }
      } catch (e) { this.errorMessage = "保存失敗"; } finally { this.isLoading = false; }
    },
    
    // --- Home 用 ---
    formatDate(d) { const date = new Date(d); if (isNaN(date)) return ''; const m = date.getMonth() + 1; const day = date.getDate(); const h = date.getHours(); const min = date.getMinutes().toString().padStart(2, '0'); return `${m}/${day} ${h}:${min}`; },
    formatDateTimeLocal(dt) { if (!dt) return '期限なし'; return dt.replace('T', ' '); },
    async addTodo() { if (!this.newTodo) return; this.isSendingTodo = true; await apiCall('todos', 'insert', [{ user_id: this.currentUser.user_id, content: this.newTodo, created_at: new Date().toISOString() }]); this.newTodo = ''; this.isSendingTodo = false; this.fetchData(); },
    async toggleTodo(td) { td.is_done = !td.is_done; await apiCall('todos', 'update', { is_done: td.is_done }, { eq: { column: 'todo_id', value: td.todo_id } }); this.fetchData(); },
    async deleteTodo(id) { await apiCall('todos', 'delete', null, { eq: { column: 'todo_id', value: id } }); this.fetchData(); },
    async addEvent() { if (!this.newEvent.title || !this.newEvent.date) return; this.isSendingEvent = true; await apiCall('events', 'insert', [{ user_id: this.currentUser.user_id, title: this.newEvent.title, event_date: this.newEvent.date, created_at: new Date().toISOString() }]); this.newEvent = { title: '', date: '' }; this.isSendingEvent = false; this.fetchData(); },
    async deleteEvent(id) { await apiCall('events', 'delete', null, { eq: { column: 'event_id', value: id } }); this.fetchData(); },
    parseInteractions(n) { try { return JSON.parse(n.interactions) || []; } catch (e) { return []; } },
    async markNotifRead(id) { await apiCall('notifications', 'update', { is_read: true }, { eq: { column: 'notif_id', value: id } }); this.fetchData(); },
    
    // --- 天気 ---
    async fetchWeather() {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const lat = pos.coords.latitude; const lon = pos.coords.longitude;
          const res = await fetch('https:/' + '/api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo');
          const data = await res.json();
          if (data && data.current_weather) {
            const c = data.current_weather.weathercode;
            const getIconAndText = (code) => {
              if (code === 0) return { icon: '☀️', text: '快晴' };
              if (code <= 3) return { icon: '🌤', text: '晴れ/曇り' };
              if (code <= 48) return { icon: '🌫', text: '霧' };
              if (code <= 67 || (code >= 80 && code <= 82)) return { icon: '☔️', text: '雨' };
              if (code <= 77) return { icon: '❄️', text: '雪' };
              if (code >= 95) return { icon: '⛈', text: '雷雨' };
              return { icon: '☁️', text: '曇り' };
            };
            const current = getIconAndText(c);
            let max = '-', min = '-';
            if (data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_max.length > 0) { max = data.daily.temperature_2m_max[0]; min = data.daily.temperature_2m_min[0]; }
            this.weather = { temp: data.current_weather.temperature, icon: current.icon, text: current.text, wind: data.current_weather.windspeed, max: max, min: min };
          }
        } catch (e) {}
      });
    },

    // --- チャットHTML化 ---
    formatMessage(msg) {
      if (!msg.content) return '';
      let e = msg.content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return e.replace(/(https?:\/\/[^\s<]+)/g, url => {
        const cu = url.replace(/&amp;/g, '&');
        if (cu.includes('drive.google.com') || cu.includes('placeholder') || cu.includes('supabase')) {
          return '<br><img src="' + cu + '" class="max-h-48 rounded mt-2 border shadow-sm cursor-pointer hover:opacity-90 transition" onclick="window.open(\'' + cu + '\')"><br>';
        }
        return '<a href="' + cu + '" target="_blank" class="underline text-blue-500">' + cu + '<' + '/a>';
      }).replace(/\n/g, '<br>');
    },
    
    async submitMessage(e, allowedStr) {
      if (!this.inputText.trim() || this.isSending) return;
      this.isSending = true;
      try {
        if (this.editMessageId) {
          await apiCall('messages', 'update', { content: this.inputText, is_edited: true }, { eq: { column: 'message_id', value: this.editMessageId } });
          this.editMessageId = null;
        } else {
          await apiCall('messages', 'insert', [{ message_id: 'msg_' + Math.random().toString(36).substring(2,10), channel_id: this.currentChannelId, user_id: this.currentUser.user_id, content: this.inputText, original_content: this.inputText, allowed_users: allowedStr || '', created_at: new Date().toISOString() }]);
        }
        this.inputText = ''; this.isSending = false; this.fetchData();
      } catch (err) { this.isSending = false; this.errorMessage = "送信失敗"; }
    },
    async deleteMessage() {
      const m = this.contextMenu.targetData; this.closeMenus();
      try { await apiCall('messages', 'delete', null, { eq: { column: 'message_id', value: m.message_id } }); this.fetchData(); } catch (e) {}
    },
    startEditMessage() { const m = this.contextMenu.targetData; this.editMessageId = m.message_id; this.inputText = m.content; this.closeMenus(); },
    cancelEdit() { this.editMessageId = null; this.inputText = ''; },
    async addLike(msg, e) { await apiCall('messages', 'update', { likes: (msg.likes || 0) + 1 }, { eq: { column: 'message_id', value: msg.message_id } }); this.fetchData(); },
    handleContextMenu(e, msg) { if (msg.user_id === this.currentUser?.user_id || this.currentUser?.role === 'admin' || this.currentUser?.role === 'root') { this.openContextMenu(e, 'message', msg); } },
    openContextMenu(e, type, targetData) {
      e.preventDefault();
      this.contextMenu.show = true;
      this.contextMenu.type = type;
      this.contextMenu.targetData = targetData;
      this.contextMenu.x = e.clientX;
      this.contextMenu.y = e.clientY;
    },

    // --- Trade用 ---
    async fetchTradeData() {
      if (this.isLoadingTrade) return;
      this.isLoadingTrade = true;
      try {
        // GAS経由での株価取得（後にSupabase直接取得に切り替えます）
        const res = await apiCall('rpc', 'get_trade_initial_data', { p_user_id: this.currentUser.user_id });
        if (res.success) {
          this.tradeData.stocks = res.stocks || [];
          this.tradeData.scenarios = res.scenarios || {};
          this.tradeData.portfolios = res.portfolios || [];
          this.tradeData.news = res.news || [];
          const nowStr = this.getJstTimeStr();
          const todayDateStr = this.formatDateOnly(new Date());

          for (let code in this.tradeData.scenarios) {
            this.currentMinuteDataCache[code] = this.interpolatePoints(this.tradeData.scenarios[code], nowStr, todayDateStr);
          }
          
          this.$nextTick(() => { if (this.selectedStock) this.renderTradeChart(); });
        }
      } catch (e) { this.errorMessage = "トレードデータ取得エラー"; } finally { this.isLoadingTrade = false; }
    },
    formatDateOnly(d) { return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`; },
    getJstTimeStr() { const d = this.currentTime; return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`; },
    interpolatePoints(points, currentTimeStr, todayDateStr) {
      if (!points || !Array.isArray(points) || points.length === 0) return [];
      const endStr = currentTimeStr > "21:30" ? "21:30" : (currentTimeStr < "07:00" ? "07:00" : currentTimeStr);
      let result = [];
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i]; const p2 = points[i + 1];
        if (!p1 || !p2 || typeof p1.price !== 'number' || typeof p2.price !== 'number') continue;
        const date1 = p1.fullTime ? p1.fullTime.split(' ')[0] : todayDateStr;
        const date2 = p2.fullTime ? p2.fullTime.split(' ')[0] : todayDateStr;
        if (date1 !== date2) { result.push({ time: p1.time || "00:00", price: p1.price, fullTime: p1.fullTime || (date1 + " " + p1.time), date: date1 }); continue; }
        result.push({ time: p1.time || "00:00", price: p1.price, fullTime: p1.fullTime || (date1 + " " + p1.time), date: date1 });
        if (date1 === todayDateStr && p1.time > endStr) break;
        try {
          const [h1, m1] = (p1.time || "00:00").split(':').map(Number); const [h2, m2] = (p2.time || "00:00").split(':').map(Number);
          let t1 = (h1 || 0) * 60 + (m1 || 0); let t2 = (h2 || 0) * 60 + (m2 || 0);
          const diff = t2 - t1; const pDiff = p2.price - p1.price;
          if (diff > 0) {
            for (let j = 1; j < diff; j++) {
              let curT = t1 + j; let curTimeStr = `${Math.floor(curT / 60).toString().padStart(2, '0')}:${(curT % 60).toString().padStart(2, '0')}`;
              if (date1 === todayDateStr && curTimeStr > endStr) break;
              let basePrice = p1.price + (pDiff * (j / diff)); let noise = (Math.random() - 0.5) * (basePrice * 0.002);
              let finalPrice = Math.max(0, Math.round(basePrice + noise));
              result.push({ time: curTimeStr, price: finalPrice, fullTime: date1 + " " + curTimeStr, date: date1 });
            }
          }
        } catch (e) { continue; }
      }
      if (points[points.length - 1]) {
        const lastP = points[points.length - 1]; const lastDate = lastP.fullTime ? lastP.fullTime.split(' ')[0] : todayDateStr;
        if (typeof lastP.price === 'number') { if (lastDate !== todayDateStr || lastP.time <= endStr) { result.push({ time: lastP.time || "00:00", price: lastP.price, fullTime: lastP.fullTime || (lastDate + " " + lastP.time), date: lastDate }); } }
      }
      return result;
    },
    selectStock(st) { this.selectedStock = st; this.tradeAmount = 1; this.chartDays = 1; this.$nextTick(() => { this.renderTradeChart(); }); },
    renderTradeChart() {
      if (!this.selectedStock) return;
      const cache = this.currentMinuteDataCache[this.selectedStock.stock_code] || [];
      const ctx = document.getElementById('tradeChartCanvas');
      if (!ctx) return;
      if (this.tradeChartInstance) { this.tradeChartInstance.destroy(); this.tradeChartInstance = null; }
      if (!cache.length) return;
      const todayDateStr = this.formatDateOnly(new Date());
      const availableDates = [...new Set(cache.map(d => d.date))].sort();
      const targetDates = availableDates.slice(-this.chartDays);
      const displayData = cache.filter(d => targetDates.includes(d.date)).sort((a, b) => a.fullTime.localeCompare(b.fullTime));
      if (!displayData.length) return;
      
      const labels = displayData.map(d => { if(d.time === "07:00") return d.date.split('-').slice(1).join('/') + " 始値"; return d.time; });
      const data = displayData.map(d => d.price);
      const isUp = displayData.length >= 2 ? displayData[displayData.length - 1].price >= displayData[0].price : true;
      const color = isUp ? '#10b981' : '#ef4444';
      
      this.tradeChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: [{ label: '株価 (CC)', data: data, borderColor: color, backgroundColor: isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderWidth: 1.5, tension: 0.1, fill: true, pointRadius: 0, pointHoverRadius: 4, pointHitRadius: 10 }] },
        options: {
          responsive: true, maintainAspectRatio: false, layout: { padding: { top: 10, bottom: 10 } },
          plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, callbacks: { label: function(context) { return "価格: " + context.raw + " CC"; } } } },
          scales: { x: { display: true, ticks: { maxTicksLimit: 6, color: '#94a3b8' }, grid: { display: false } }, y: { display: true, position: 'right', ticks: { color: '#94a3b8' }, grid: { color: '#f1f5f9' } } },
          interaction: { mode: 'index', axis: 'x', intersect: false }
        }
      });
    },
    getCurrentStockPrice(code) {
      try {
        const cache = this.currentMinuteDataCache[code] || [];
        if (!cache.length) return 0;
        const todayDateStr = this.formatDateOnly(new Date());
        const nowStr = this.getJstTimeStr();
        const endStr = nowStr > "21:30" ? "21:30" : (nowStr < "07:00" ? "07:00" : nowStr);
        const todayData = cache.filter(d => d && d.date === todayDateStr && d.time <= endStr);
        if (todayData.length > 0) return todayData[todayData.length - 1].price || 0;
        return cache[cache.length - 1].price || 0;
      } catch(e) { return 0; }
    },
    getOwnedQuantity(code) { if(!this.tradeData.portfolios) return 0; const pf = this.tradeData.portfolios.find(p => p.stock_code === code); return pf ? pf.quantity : 0; },
    getStockName(code) { if(!this.tradeData.stocks) return code; const st = this.tradeData.stocks.find(s => s.stock_code === code); return st ? st.company_name : code; },
    getProfitLoss(pf) { const curPrice = this.getCurrentStockPrice(pf.stock_code); return (curPrice - pf.average_price) * pf.quantity; },
    getProfitLossClass(pf) { return this.getProfitLoss(pf) >= 0 ? 'text-emerald-500' : 'text-red-500'; },
    async executeTrade(type) {
      if (!this.selectedStock || this.tradeAmount <= 0) return;
      this.isSendingTrade = true;
      try {
        const res = await apiCall('rpc', 'execute_trade', { p_user_id: this.currentUser.user_id, p_stock_code: this.selectedStock.stock_code, p_amount: this.tradeAmount, p_type: type });
        if (res.success) {
          this.errorMessage = res.message;
          const pfRes = await apiCall('portfolios', 'select', '*', { eq: { column: 'user_id', value: this.currentUser.user_id } });
          if (pfRes.success) this.tradeData.portfolios = pfRes.data;
        } else { this.errorMessage = res.message; }
      } catch (e) { this.errorMessage = "通信エラー"; } finally { this.isSendingTrade = false; this.tradeAmount = 1; }
    },

    // --- 通帳機能 ---
    async openPassbook(userId) {
      this.isFetchingPassbook = true; this.passbookData = []; this.showPassbookModal = true;
      try {
        const res = await apiCall('rpc', 'get_passbook_data', { p_user_id: userId });
        if (res.success) this.passbookData = res.records;
        else this.errorMessage = "通帳データの取得に失敗しました";
      } catch (e) { this.errorMessage = "通信エラー"; } finally { this.isFetchingPassbook = false; }
    },

    // --- Admin (管理者) 用 ---
    async changeAdminTab(tab) {
      this.adminSubTab = tab; this.isFetchingAdmin = true;
      try {
        if (tab === 'users') {
          const r = await apiCall('users', 'select', '*');
          if (r.success) this.adminUserList = r.data || [];
        }
      } catch (e) { this.errorMessage = "管理データ取得エラー"; } finally { this.isFetchingAdmin = false; }
    },
    openAdminUserModal(u) {
      this.adminSelectedUser = u;
      this.adminEditForm = { allowed_start: u.allowed_start || '00:00', allowed_end: u.allowed_end || '23:59', role: u.role, parent_id: u.parent_id || '', search_id: u.search_id, discord_id: u.discord_id || '', coins: u.coins || 0 };
      this.adminAddFriendId = ''; this.showAdminUserModal = true;
    },
    async saveAdminUserEdit() {
      this.isSendingAdmin = true;
      try {
        const res = await apiCall('users', 'update', this.adminEditForm, { eq: { column: 'user_id', value: this.adminSelectedUser.user_id } });
        if (res.success) { this.showAdminUserModal = false; this.changeAdminTab('users'); }
      } catch (e) {} finally { this.isSendingAdmin = false; }
    },
    async adminAction(id, type) {
      if (type === 'delete' && !confirm("完全に削除しますか？")) return;
      this.isSendingAdmin = true;
      try {
        if (type === 'delete') await apiCall('users', 'delete', null, { eq: { column: 'user_id', value: id } });
        else await apiCall('users', 'update', { is_blocked: type === 'block' }, { eq: { column: 'user_id', value: id } });
        this.changeAdminTab('users');
      } finally { this.isSendingAdmin = false; }
    },
    async forceGenerateStockData() {
      this.isSendingAdmin = true;
      try {
        // ★ GASのAIバッチ処理をキックする（今回はとりあえずのダミー応答）
        alert("Aegis: 株価生成バッチは深夜に自動実行されます（現在移行中）");
      } catch (e) {} finally { this.isSendingAdmin = false; }
    }
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

// ★ ホワイトアウト防御機能（エラーキャッチャー）を復活
app.config.errorHandler = function(err, instance, info) {
  console.error("Vue Runtime Error:", err, info);
  var d = document.createElement('div');
  d.style.cssText = "position:fixed; top:0; left:0; right:0; background:#ef4444; color:white; padding:15px; z-index:999999; font-weight:bold; box-shadow:0 4px 6px rgba(0,0,0,0.1);";
  d.innerHTML = "⚠️ システムエラー発生 (ホワイトアウト防御): " + err.message + "<br><span style='font-size:10px'>" + info + "</span><br><button onclick='this.parentElement.remove()' style='margin-top:10px; padding:4px 8px; background:white; color:#ef4444; border-radius:4px; font-size:12px; cursor:pointer;'>閉じる</button>";
  document.body.appendChild(d);
};

app.mount('#app');
