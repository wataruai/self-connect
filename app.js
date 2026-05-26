// ==========================================
// ★ 超重要：GASの「ウェブアプリのURL」をここに貼る
// ==========================================
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwkn0XtD6E-Fm8tfeAu1xUZ1XF8iafdcRa2DMOI_Fstu_SoneR97sof417CfM8Wb5VE/exec';

async function apiCall(method, ...args) {
  try {
    const res = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ method: method, args: args })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.message);
    return data.result;
  } catch (err) { console.error("API Error:", err); throw err; }
}

const { createApp } = Vue;

createApp({
  data() {
    return {
      isMobile: window.innerWidth < 768, mobileView: 'list',
      currentUser: null, savedAccounts: [], isAutoLoggingIn: false, authMode: 'new', existingSearchId: '',
      showPinModal: false, pinInput: '', pendingLoginAccount: null,
      loginForm: { name: '', searchId: '', pin: '', charType: '🐰', charName: '' }, autoLoginInfo: { display_name: '', char_type: '🐰' },
      availableIcons: ['🐰','🐶','🦊','🐻','🐼','🐯','🦁','🧑‍🎓','👩‍🎓','🤖','👻'],
      currentNavTab: 'home', channels: [], gdms: [], friends: [], friendRequests: [], notifications: [], tasks: [], studyLogs: [], todos: [], events: [],
      currentChannelId: '', messages: [], inputText: '', editMessageId: null, isLoading: false, isSending: false, isFetching: false, errorMessage: null,
      showSettingsModal: false, showAddFriendModal: false, showCreateChannelModal: false, settingsForm: { display_name: '' }, searchIdInput: '', searchResult: null,
      showImageUploadModal: false, uploadingImageFile: null, selectedAllowedUsers: [], showGroupDmModal: false, gdmForm: { name: '', members: [] },
      studyForm: { subject: '', duration: '' }, showSendTaskModal: false, showEditTaskModal: false, taskForm: { id: '', to: '', title: '', content: '', type: 'text', deadline: '', choicesStr: '' }, taskUploadFile: null,
      adminSubTab: 'stats', adminStats: null, adminChartInstance: null, adminUserList: [], adminMessages: [], adminNotifs: [],
      showAdminUserModal: false, adminSelectedUser: null, adminEditForm: { allowed_start:'', allowed_end:'', role:'', parent_id:'', search_id:'' }, adminNotifForm: { content:'' }, adminNotifFile: null, showDeleteAllModal: false,
      contextMenu: { show: false, targetData: null, type: '', x: 0, y: 0 }, flyingHearts: [], heartId: 0, pollingInterval: null, timeUpdater: null, currentTime: new Date(), newTodo: '', newEvent: {title:'', date:''}
    }
  },
  computed: {
    showListArea() { return !this.isMobile || this.mobileView === 'list'; },
    showMainArea() { return !this.isMobile || this.mobileView === 'detail'; },
    currentChannelName() { if (this.currentChannelId.startsWith('dm_')) return (this.friends.find(x => this.getDmId(this.currentUser.user_id, x.user_id) === this.currentChannelId)?.display_name || 'DM'); if(this.currentChannelId.startsWith('gdm_')) return (this.gdms.find(g=>g.channel_id===this.currentChannelId)?.name || 'グループDM'); return this.channels.find(c => c.channel_id === this.currentChannelId)?.name || ''; },
    activeNotifications() { return this.notifications.filter(n => !n.is_read); }, unreadNotifications() { return this.activeNotifications.length > 0; },
    myTasks() { return this.tasks.filter(t => t.to_user === this.currentUser?.user_id); }, sentTasks() { return this.tasks.filter(t => t.from_user === this.currentUser?.user_id); },
    unsubmittedTasks() { return this.myTasks.filter(t => t.status === 'assigned'); },
    totalStudyTime() { return this.studyLogs.reduce((acc, l) => acc + (parseInt(l.duration)||0), 0); },
    currentChannelMembers() { if(this.currentChannelId.startsWith('dm_')) return this.friends; if(this.currentChannelId.startsWith('gdm_')) { const g = this.gdms.find(x=>x.channel_id===this.currentChannelId); if(!g||!g.members) return []; const mids=JSON.parse(g.members); return this.friends.filter(f=>mids.includes(f.user_id)); } return []; },
    currentTimeStr() { return `${this.currentTime.getHours().toString().padStart(2,'0')}:${this.currentTime.getMinutes().toString().padStart(2,'0')}:${this.currentTime.getSeconds().toString().padStart(2,'0')}`; },
    clockHands() { const h=this.currentTime.getHours(), m=this.currentTime.getMinutes(), s=this.currentTime.getSeconds(); const hDeg=(h%12)*30+(m/2), mDeg=m*6, sDeg=s*6; return { hX:50+25*Math.sin(hDeg*Math.PI/180), hY:50-25*Math.cos(hDeg*Math.PI/180), mX:50+35*Math.sin(mDeg*Math.PI/180), mY:50-35*Math.cos(mDeg*Math.PI/180), sX:50+40*Math.sin(sDeg*Math.PI/180), sY:50-40*Math.cos(sDeg*Math.PI/180) }; },
    currentYearMonth() { return `${this.currentTime.getFullYear()}年 ${this.currentTime.getMonth()+1}月`; },
    calendarDays() { const y=this.currentTime.getFullYear(), m=this.currentTime.getMonth(); const daysInMonth=new Date(y, m+1, 0).getDate(); const firstDay=new Date(y, m, 1).getDay(); const days=Array(firstDay).fill(''); for(let i=1;i<=daysInMonth;i++) days.push(i); return days; },
    todaysEvents() { const t=new Date(); const tStr=`${t.getFullYear()}-${(t.getMonth()+1).toString().padStart(2,'0')}-${t.getDate().toString().padStart(2,'0')}`; return this.events.filter(e => e.event_date.startsWith(tStr)); }
  },
  methods: {
    navClass(tab) { return {'text-indigo-400 bg-slate-800': this.currentNavTab===tab, 'text-slate-400 hover:text-slate-200': this.currentNavTab!==tab, 'p-2 md:p-3 w-10 md:w-12 h-10 md:h-12 rounded-xl transition flex justify-center items-center':true}; },
    switchNav(tab) { this.currentNavTab = tab; if(this.isMobile) { this.mobileView = ['chat','teams','activity'].includes(tab) ? 'list' : 'detail'; } },
    getCharIcon(type) { return type || '🐰'; }, getUserName(id) { const f = this.friends.find(x => x.user_id === id); return f ? f.display_name : '不明'; },
    formatDate(d) { const date = new Date(d); return isNaN(date) ? '' : `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2,'0')}`; },
    formatDateTimeLocal(dt) { if(!dt) return '期限なし'; return dt.replace('T', ' '); }, isExpired(dt) { if(!dt) return false; return new Date(dt) < new Date(); },
    isToday(d) { if(!d) return false; const t=new Date(); return t.getDate()===d && t.getMonth()===this.currentTime.getMonth() && t.getFullYear()===this.currentTime.getFullYear(); },
    
    initAuth() { try { let saved = localStorage.getItem('selfConnectAccounts'); if (saved) { this.savedAccounts = JSON.parse(saved); const lastUsed = localStorage.getItem('selfConnectLastUserId'); if (lastUsed) { const acc = this.savedAccounts.find(a => a.user_id === lastUsed); if (acc) { if(acc.pin) { this.requestPin(acc); return; } else { this.loginWithSaved(acc); return; } } } if (this.savedAccounts.length > 0) this.authMode = 'select'; } } catch(e) {} },
    deleteLocalAccount(uid) { this.savedAccounts = this.savedAccounts.filter(a => a.user_id !== uid); localStorage.setItem('selfConnectAccounts', JSON.stringify(this.savedAccounts)); if(this.savedAccounts.length===0) this.authMode='new'; },
    requestPin(acc) { if(acc.pin) { this.pendingLoginAccount = acc; this.pinInput = ''; this.showPinModal = true; } else { this.loginWithSaved(acc); } },
    verifyPin() { if(this.pinInput === this.pendingLoginAccount.pin) { this.showPinModal = false; this.loginWithSaved(this.pendingLoginAccount); } else { this.errorMessage = "パスワードが違います"; this.pinInput=''; } },
    
    async loginWithSaved(acc) {
      this.isAutoLoggingIn = true; this.autoLoginInfo = acc;
      try {
        const d = await apiCall('getInitialData', acc.user_id);
        if (d.blocked) { this.isAutoLoggingIn = false; this.authMode='select'; return this.errorMessage = d.msg; }
        this.currentUser = d.user; localStorage.setItem('selfConnectLastUserId', d.user.user_id);
        this.channels = d.channels||[]; this.gdms = d.gdms||[]; this.friends = d.friends||[]; this.notifications = d.notifications||[]; this.tasks = d.tasks||[]; this.tasks.forEach(t => t.answerInput = t.answerInput || ''); this.studyLogs = d.studyLogs||[]; this.todos = d.todos||[]; this.events = d.events||[];
        if(this.channels.length>0) this.currentChannelId = this.channels[0].channel_id; 
        this.switchNav('home');
        setTimeout(() => { this.isAutoLoggingIn = false; this.startPolling(); this.timeUpdater = setInterval(()=>this.currentTime=new Date(), 1000); }, 1000);
      } catch(e) { this.isAutoLoggingIn = false; this.errorMessage = "データ取得エラー: "+e.message; this.authMode='select'; }
    },
    
    async startApp() {
      if (!this.loginForm.name || !this.loginForm.searchId) return this.errorMessage = '入力必須です'; 
      this.isLoading = true; const userData = { user_id: 'usr_' + Math.random().toString(36).substr(2, 9), display_name: this.loginForm.name, search_id: this.loginForm.searchId, char_type: this.loginForm.charType, char_name: this.loginForm.charName };
      try { const res = await apiCall('saveUser', userData); this.isLoading = false; if (res.error) return this.errorMessage = res.message; const userToSave = res.user; if(this.loginForm.pin) userToSave.pin = this.loginForm.pin; this.saveToLocal(userToSave); this.loginWithSaved(userToSave); } catch(e) { this.isLoading = false; this.errorMessage = e.message; }
    },
    async loginExisting() { if (!this.existingSearchId) return; this.isLoading = true; try { const r = await apiCall('searchUserBySearchId', this.existingSearchId); this.isLoading = false; if (r.found) { this.saveToLocal(r.user); this.loginWithSaved(r.user); } else this.errorMessage = "見つかりません。"; } catch(e) { this.isLoading = false; this.errorMessage = e.message; } },
    saveToLocal(user) { try { let idx = this.savedAccounts.findIndex(a => a.user_id === user.user_id); if(idx===-1) this.savedAccounts.push(user); else this.savedAccounts[idx]=user; localStorage.setItem('selfConnectAccounts', JSON.stringify(this.savedAccounts)); } catch(e){} },
    logout() { try { localStorage.removeItem('selfConnectLastUserId'); } catch(e){} clearInterval(this.pollingInterval); clearInterval(this.timeUpdater); this.currentUser = null; this.showSettingsModal = false; this.authMode = this.savedAccounts.length > 0 ? 'select' : 'new'; },
    
    startPolling() { this.fetchData(); this.pollingInterval = setInterval(this.fetchData, 6000); },
    async fetchData() {
      if ((!this.currentChannelId && !['home','study','admin'].includes(this.currentNavTab)) || this.isFetching) return; 
      this.isFetching = true;
      try {
        const d = await apiCall('fetchUpdates', this.currentChannelId||'dummy', this.currentUser.user_id);
        if(d.blocked) { this.errorMessage = d.msg; this.logout(); return; } 
        if(d.notifications && d.notifications.length > this.notifications.length) { const newNotifs = d.notifications.slice(0, d.notifications.length - this.notifications.length); newNotifs.forEach(n => this.pushNotify("新着通知", n.content)); }
        if(d.messages && this.currentChannelId && d.messages.length > this.messages.length) { const last = d.messages[d.messages.length-1]; if(last.user_id !== this.currentUser.user_id) this.pushNotify(last.user.display_name, last.content); }
        this.messages = d.messages||this.messages; this.gdms = d.gdms||this.gdms; this.friends = d.friends||this.friends; this.notifications = d.notifications||[]; this.tasks = d.tasks||this.tasks; this.tasks.forEach(t=>{ t.answerInput = t.answerInput || ''; }); this.todos=d.todos||this.todos; this.events=d.events||this.events; this.scrollToBottom(); this.isFetching = false;
      } catch(e) { this.isFetching = false; }
    },
    selectChannel(id) { this.currentChannelId = id; this.messages = []; if(this.isMobile) this.mobileView = 'detail'; this.fetchData(); }, selectDm(f) { this.currentChannelId = this.getDmId(this.currentUser.user_id, f.user_id); this.messages = []; if(this.isMobile) this.mobileView = 'detail'; this.fetchData(); },
    getDmId(id1, id2) { return 'dm_' + [id1, id2].sort().join('_'); }, closeMenus() { this.contextMenu.show = false; }, openContextMenu(e, type, target) { this.contextMenu = { show: true, type, targetData: target, x: e.clientX, y: e.clientY }; },
    startEditMessage() { const m = this.contextMenu.targetData; this.editMessageId = m.message_id; this.inputText = m.content; this.closeMenus(); }, cancelEdit() { this.editMessageId = null; this.inputText = ''; },
    async deleteMessage() { const m = this.contextMenu.targetData; this.closeMenus(); try{ await apiCall('deleteMessage', m.message_id, this.currentUser.user_id); if(this.currentNavTab==='admin') this.changeAdminTab('messages'); else this.fetchData(); }catch(e){} },
    async submitMessage(e, allowedStr) { if (!this.inputText.trim() || this.isSending) return; this.isSending = true; try { if(this.editMessageId) { await apiCall('updateMessage', this.editMessageId, this.currentUser.user_id, this.inputText); this.editMessageId = null; } else { await apiCall('saveMessageData', this.currentChannelId, this.currentUser.user_id, this.inputText, allowedStr||''); } this.inputText = ''; this.isSending = false; this.fetchData(); } catch(err) { this.isSending = false; this.errorMessage="送信失敗"; } },
    openImageUploadModal() { this.selectedAllowedUsers = []; this.uploadingImageFile = null; this.showImageUploadModal = true; },
    executeImageUpload() { if(!this.uploadingImageFile) return; this.isSending = true; const reader = new FileReader(); reader.onload = async (e) => { try { const res = await apiCall('uploadFile', e.target.result.split(',')[1], this.uploadingImageFile.name, this.uploadingImageFile.type); if(res.success) { this.inputText += `\n${res.url}\n`; this.showImageUploadModal = false; this.submitMessage(null, this.selectedAllowedUsers.length>0 ? JSON.stringify(this.selectedAllowedUsers) : ''); } } catch(err) { this.isSending = false; this.errorMessage="UP失敗"; } }; reader.readAsDataURL(this.uploadingImageFile); },
    formatMessage(msg) { if(!msg.content) return ''; let e = msg.content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); return e.replace(/(https?:\/\/[^\s<]+)/g, url => { const cu = url.replace(/&amp;/g, '&'); if(cu.includes('drive.google.com') || cu.includes('placeholder')) { if(msg.allowed_users) { try { const allowed = JSON.parse(msg.allowed_users); const canView = allowed.includes(this.currentUser.user_id) || msg.user_id === this.currentUser.user_id || this.currentUser.role==='admin' || this.currentUser.role==='parent'; if(!canView) return `<div class="bg-slate-200 text-slate-500 p-2 rounded text-center border mt-2"><i class="fa-solid fa-eye-slash mb-1 block"></i>非公開</div>`; } catch(err){} } if(cu.includes('thumbnail')) return `<br><img src="${cu}" class="max-h-48 rounded mt-2 border shadow-sm cursor-pointer" onclick="window.open('${cu}')"><br>`; return `<br><a href="${cu}" target="_blank" class="inline-flex items-center bg-slate-100 px-3 py-1 rounded border mt-2 text-sm"><i class="fa-solid fa-file-arrow-down mr-2 text-indigo-500"></i>ダウンロード</a><br>`; } return `<a href="${cu}" target="_blank" class="underline text-blue-500">${cu}</a>`; }).replace(/\n/g, '<br>'); },
    parseInteractions(n) { try { return JSON.parse(n.interactions) || []; } catch(e) { return []; } },
    async addReaction(id, emoji) { await apiCall('addNotifInteraction', id, this.currentUser.user_id, this.currentUser.display_name, 'reaction', emoji); this.fetchData(); },
    async sendReply(n) { if(!n.replyText) return; await apiCall('addNotifInteraction', n.notif_id, this.currentUser.user_id, this.currentUser.display_name, 'reply', n.replyText); n.replyText=''; this.fetchData(); },
    async addTodo() { if(!this.newTodo) return; await apiCall('manageTodoEvent', 'add', 'todos', {userId:this.currentUser.user_id, content:this.newTodo}); this.newTodo=''; this.fetchData(); },
    async toggleTodo(td) { td.is_done = !td.is_done; await apiCall('manageTodoEvent', 'toggle', 'todos', {id:td.todo_id, isDone:td.is_done}); this.fetchData(); },
    async deleteTodo(id) { await apiCall('manageTodoEvent', 'delete', 'todos', {id:id}); this.fetchData(); },
    async addEvent() { if(!this.newEvent.title||!this.newEvent.date) return; await apiCall('manageTodoEvent', 'add', 'events', {userId:this.currentUser.user_id, title:this.newEvent.title, date:this.newEvent.date}); this.newEvent={title:'',date:''}; this.fetchData(); },
    async deleteEvent(id) { await apiCall('manageTodoEvent', 'delete', 'events', {id:id}); this.fetchData(); },
    requestPushPermission() { if (window.Notification) Notification.requestPermission().then(p => this.errorMessage = `通知は ${p} になりました`); }, testPush() { this.pushNotify("テスト", "これはセルフコネクトからのテストです。"); },
    pushNotify(title, body) { if (window.Notification && Notification.permission === "granted") new Notification(title, { body: body.replace(/<[^>]*>?/gm, '').substring(0,30) + '...' }); },

    parseChoices(str) { if(!str) return []; try{ return JSON.parse(str); }catch(e){ return str.split(',').map(s=>s.trim()); } },
    sendTask() { 
      this.isSending=true; let fileP = Promise.resolve(''); 
      if(this.taskUploadFile) { fileP = new Promise(resolve => { const r=new FileReader(); r.onload=async ev=>{ try{ const res=await apiCall('uploadFile', ev.target.result.split(',')[1], this.taskUploadFile.name, this.taskUploadFile.type); resolve(res.success?res.url:''); }catch(e){resolve('');} }; r.readAsDataURL(this.taskUploadFile); }); } 
      fileP.then(async url => { 
        await apiCall('sendTask', this.currentUser.user_id, this.taskForm.to, this.taskForm.title, this.taskForm.content, this.taskForm.type, this.taskForm.deadline, JSON.stringify(this.parseChoices(this.taskForm.choicesStr)), url); 
        this.showSendTaskModal=false; this.taskForm={to:'',title:'',content:'', type:'text', deadline:'', choicesStr:''}; this.taskUploadFile=null; this.isSending=false; this.errorMessage="課題を送信しました"; this.fetchData(); 
      }); 
    },
    // ★課題の編集・削除
    openEditTaskModal(t) { this.taskForm = { id: t.task_id, to: t.to_user, title: t.title, content: t.content, deadline: t.deadline||'', type: t.task_type }; this.showEditTaskModal = true; },
    async executeEditTask() { this.isSending=true; try { await apiCall('updateTask', this.taskForm.id, this.currentUser.user_id, this.taskForm.title, this.taskForm.content, this.taskForm.deadline); this.showEditTaskModal=false; this.errorMessage="修正を保存しました"; this.fetchData(); } catch(e){} this.isSending=false; },
    async deleteTask(id) { if(!confirm("課題を取り消しますか？")) return; await apiCall('deleteTask', id, this.currentUser.user_id); this.fetchData(); },
    
    async submitTask(id, ans) { await apiCall('submitTask', id, ans); this.fetchData(); },
    uploadAndSubmitTaskFile(t, e) { const file = e.target.files[0]; if(!file) return; this.isSending = true; const reader = new FileReader(); reader.onload = async (ev) => { try{ const res = await apiCall('uploadFile', ev.target.result.split(',')[1], file.name, file.type); if(res.success) { this.submitTask(t.task_id, res.url); } else { this.errorMessage="UP失敗"; } }catch(err){} this.isSending=false; }; reader.readAsDataURL(file); },
    
    openAdminTab() { this.currentNavTab = 'admin'; this.changeAdminTab('stats'); },
    async changeAdminTab(tab) { 
      this.adminSubTab = tab; 
      try {
        if (tab === 'stats') { const r = await apiCall('getAdminStats', this.currentUser.user_id); if(r.success){ this.adminStats = r.stats; this.renderAdminChart(); } }
        if (tab === 'users') { const r = await apiCall('getAdminStats', this.currentUser.user_id); if(r.success) this.adminUserList = r.users; }
        if (tab === 'messages') { const r = await apiCall('getAllMessagesForAdmin', this.currentUser.user_id); if(r.success) this.adminMessages = r.messages; }
        if (tab === 'notifs') { const r = await apiCall('getAllNotificationsAdmin', this.currentUser.user_id); if(r.success) this.adminNotifs = r.notifs; }
      } catch(e) { this.errorMessage = "エラーが発生しました"; }
    },
    renderAdminChart() { if (!this.adminStats || !this.adminStats.msgCountByDate) return; const ctx = document.getElementById('adminChartCanvas'); if (!ctx) return; if (this.adminChartInstance) this.adminChartInstance.destroy(); const labels = Object.keys(this.adminStats.msgCountByDate).sort(); const data = labels.map(l => this.adminStats.msgCountByDate[l]); this.adminChartInstance = new Chart(ctx, { type: 'line', data: { labels: labels, datasets: [{ label: 'メッセージ数', data: data, borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', tension: 0.3, fill: true }] }, options: { responsive: true, maintainAspectRatio: false } }); },
    openAdminUserModal(u) { this.adminSelectedUser = u; this.adminEditForm = { allowed_start: u.allowed_start||'00:00', allowed_end: u.allowed_end||'23:59', role: u.role, parent_id: u.parent_id||'', search_id: u.search_id }; this.adminNotifForm = { content:'' }; this.adminNotifFile=null; this.showAdminUserModal = true; },
    async saveAdminUserEdit() { try{ const r = await apiCall('updateUserByAdmin', this.currentUser.user_id, this.adminSelectedUser.user_id, this.adminEditForm); if(r.success) { this.showAdminUserModal = false; this.changeAdminTab('users'); } else { this.errorMessage = r.message; } }catch(e){} },
    async adminAction(id, type) { if(type==='delete' && !confirm("完全に削除しますか？")) return; await apiCall('adminActionUser', this.currentUser.user_id, id, type); this.showAdminUserModal = false; this.changeAdminTab('users'); },
    sendAdminNotification() { let fileP = Promise.resolve(''); if(this.adminNotifFile) { fileP = new Promise(resolve => { const r=new FileReader(); r.onload=async ev=>{ try{ const res=await apiCall('uploadFile', ev.target.result.split(',')[1], this.adminNotifFile.name, this.adminNotifFile.type); resolve(res.success?res.url:''); }catch(e){resolve('');} }; r.readAsDataURL(this.adminNotifFile); }); } fileP.then(async url => { await apiCall('sendNotification', this.currentUser.user_id, this.adminSelectedUser.user_id, this.adminNotifForm.content, url); this.adminNotifForm = {content: ''}; this.adminNotifFile=null; this.errorMessage = "送信しました"; }); },
    async executeDeleteAllMessages() { this.showDeleteAllModal = false; await apiCall('deleteAllMessages', this.currentUser.user_id); this.changeAdminTab('messages'); },

    async createGroupDm() { this.gdmForm.members.push(this.currentUser.user_id); await apiCall('createGroupDm', this.gdmForm.name, this.gdmForm.members); this.showGroupDmModal=false; this.fetchData(); },
    async markNotifRead(id) { await apiCall('markNotificationRead', id); this.fetchData(); },
    async deleteNotifAdmin(id) { await apiCall('deleteNotificationAdmin', this.currentUser.user_id, id); this.changeAdminTab('notifs'); },
    async searchFriend() { const r = await apiCall('searchUserBySearchId', this.searchIdInput); if(r.found) this.searchResult = r.user; else this.errorMessage = "見つかりません"; },
    async sendRequest(t) { await apiCall('sendFriendRequest', this.currentUser.user_id, t); this.showAddFriendModal = false; },
    async acceptRequest(id) { await apiCall('acceptFriendRequest', id, this.currentUser.user_id); this.fetchData(); },
    async rejectRequest(id) { await apiCall('rejectFriendRequest', id, this.currentUser.user_id); this.fetchData(); },
    openSettings() { this.settingsForm = { display_name: this.currentUser.display_name }; this.showSettingsModal = true; },
    async saveSettings() { const r = await apiCall('updateUserSettings', this.currentUser.user_id, this.settingsForm); this.currentUser = r.user; this.showSettingsModal = false; },
    async addLike(msg, e) { if(!msg.likes) msg.likes = 0; msg.likes++; this.flyingHearts.push({ id: this.heartId++, x: e.clientX-15, y: e.clientY-15 }); setTimeout(()=>this.flyingHearts.shift(), 800); await apiCall('addLike', msg.message_id); },
    scrollToBottom() { setTimeout(() => { const c = document.getElementById('chatContainer'); if(c) c.scrollTop = c.scrollHeight; }, 100); },
    onResize() { this.isMobile = window.innerWidth < 768; }
  },
  mounted() { this.initAuth(); window.addEventListener('resize', this.onResize); },
  beforeUnmount() { window.removeEventListener('resize', this.onResize); }
}).mount('#app');
