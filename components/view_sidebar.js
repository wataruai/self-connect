export default {
  template: `
<!-- ログイン後：左端のアイコンナビゲーション -->
<div class="md:w-16 w-full h-16 md:h-full bg-slate-950 flex flex-row md:flex-col items-center justify-around md:justify-between md:py-4 z-40 shadow-xl border-t md:border-t-0 md:border-r border-slate-800 order-last md:order-first shrink-0">
  
  <!-- 通常モードのメニュー -->
  <div v-if="!isAegisMode" class="flex flex-row md:flex-col gap-1 md:gap-5 w-full items-center justify-around md:justify-start px-1 md:px-0">
    <button @click="switchNav('home')" :class="navClass('home')" class="relative"><i class="fa-solid fa-house text-xl"></i><span v-if="unsubmittedTasks.length > 0" class="absolute top-1 right-1 flex h-2.5 w-2.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span></span></button>
    <button @click="switchNav('activity')" :class="navClass('activity')" class="relative"><i class="fa-solid fa-bell text-xl"></i><span v-if="unreadNotifications" class="absolute top-1 right-1 flex h-2.5 w-2.5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span></span></button>
    <button @click="switchNav('chat')" :class="navClass('chat')"><i class="fa-solid fa-comment-dots text-xl"></i></button>
    <button @click="switchNav('teams')" :class="navClass('teams')"><i class="fa-solid fa-users text-xl"></i></button>
    <button @click="switchNav('study')" :class="navClass('study')"><i class="fa-solid fa-book text-xl"></i></button>
    <button @click="switchNav('play')" :class="navClass('play')"><i class="fa-solid fa-gamepad text-xl"></i></button>
    <button @click="switchNav('ai')" :class="navClass('ai')"><i class="fa-solid fa-robot text-xl"></i></button>
    <button @click="switchNav('trade')" :class="navClass('trade')"><i class="fa-solid fa-chart-line text-xl"></i></button>
    <button @click="switchNav('shop')" :class="navClass('shop')"><i class="fa-solid fa-store text-xl"></i></button>
    <button v-if="currentUser?.role === 'admin' || currentUser?.role === 'parent' || currentUser?.role === 'root'" @click="switchNav('admin')" :class="navClass('admin')"><i class="fa-solid fa-shield-halved text-xl"></i></button>
  </div>

  <!-- Aegisモード専用メニュー -->
  <div v-if="isAegisMode" class="flex flex-row md:flex-col gap-1 md:gap-5 w-full items-center justify-around md:justify-start px-1 md:px-0">
    <div class="text-[8px] text-cyan-500 font-mono font-bold mb-2 hidden md:block">AEGIS</div>
    <button @click="switchNav('admin'); changeAdminTab('system')" :class="{'text-cyan-400 bg-slate-800 ring-1 ring-cyan-500/50': currentNavTab === 'admin' && adminSubTab !== 'aegis_discord', 'text-slate-500 hover:text-cyan-200': currentNavTab !== 'admin' || adminSubTab === 'aegis_discord'}" class="p-2 md:p-3 w-10 md:w-12 h-10 md:h-12 rounded-xl transition flex justify-center items-center">
      <i class="fa-solid fa-server text-xl"></i>
    </button>
    <button @click="switchNav('trade')" :class="{'text-cyan-400 bg-slate-800 ring-1 ring-cyan-500/50': currentNavTab === 'trade', 'text-slate-500 hover:text-cyan-200': currentNavTab !== 'trade'}" class="p-2 md:p-3 w-10 md:w-12 h-10 md:h-12 rounded-xl transition flex justify-center items-center">
      <i class="fa-solid fa-chart-network text-xl"></i>
    </button>
    <!-- ★ 新設: Discord専用タブ -->
    <button @click="switchNav('admin'); changeAdminTab('aegis_discord')" :class="{'text-cyan-400 bg-slate-800 ring-1 ring-cyan-500/50': currentNavTab === 'admin' && adminSubTab === 'aegis_discord', 'text-slate-500 hover:text-cyan-200': !(currentNavTab === 'admin' && adminSubTab === 'aegis_discord')}" class="p-2 md:p-3 w-10 md:w-12 h-10 md:h-12 rounded-xl transition flex justify-center items-center">
      <i class="fa-brands fa-discord text-xl"></i>
    </button>
  </div>

  <div class="hidden md:block">
    <button @click="openSettings" class="text-slate-400 hover:text-white p-3 w-12 h-12 rounded-xl hover:bg-slate-800 transition"><i class="fa-solid fa-gear text-xl"></i></button>
  </div>
</div>

<!-- ログイン後：一覧リストエリア（通常モード時のみ表示） -->
<div v-show="showListArea && !isAegisMode" class="w-full md:w-72 bg-slate-900 flex flex-col shadow-inner z-20 shrink-0 border-r border-slate-800 h-[calc(100vh-4rem)] md:h-full">
  <div class="h-16 px-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
    <h2 class="text-base font-bold text-slate-200">
      <span v-if="currentNavTab === 'activity'">通知</span>
      <span v-if="currentNavTab === 'chat'">チャット</span>
      <span v-if="currentNavTab === 'teams'">コミュニティ</span>
    </h2>
    <div>
      <button v-if="currentNavTab === 'chat'" @click="showAddFriendModal = true" class="text-slate-400 hover:text-cyan-400 mr-3"><i class="fa-solid fa-user-plus"></i></button>
      <button v-if="currentNavTab === 'chat'" @click="openGroupDmModal" class="text-slate-400 hover:text-indigo-400"><i class="fa-solid fa-user-group"></i></button>
      <button v-if="currentNavTab === 'teams'" @click="openCreateChannelModal()" class="text-slate-400 hover:text-cyan-400"><i class="fa-solid fa-plus"></i></button>
      <button class="md:hidden text-slate-400 ml-3" @click="openSettings"><i class="fa-solid fa-gear"></i></button>
    </div>
  </div>
  
  <div class="flex-1 overflow-y-auto p-3">
    <!-- 通知・フレンド申請リスト -->
    <div v-if="currentNavTab === 'activity'" class="space-y-2">
      <div v-if="friendRequests.length === 0" class="text-sm text-slate-500 text-center py-4">申請はありません</div>
      <div v-for="req in friendRequests" :key="req.req_user_id" class="p-3 bg-slate-800 rounded-xl border border-slate-700 flex flex-col gap-2">
        <div class="text-sm font-bold text-slate-200">{{ req.user?.display_name || '不明' }} から申請</div>
        <button @click="openFriendRequest(req)" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs py-2.5 rounded-lg font-bold shadow-sm transition">確認する</button>
      </div>
    </div>
    
    <!-- チャット（DM・グループ）リスト -->
    <div v-if="currentNavTab === 'chat'" class="space-y-1">
      <div class="text-[10px] text-slate-500 font-bold px-2 py-1">グループ</div>
      <button v-for="g in gdms" :key="g.channel_id" @click="selectChannel(g.channel_id)" :class="{'bg-indigo-500/20 text-indigo-300': currentChannelId === g.channel_id, 'text-slate-300': currentChannelId !== g.channel_id}" class="w-full text-left px-3 py-3 rounded-xl flex items-center text-sm hover:bg-slate-800">
        <i class="fa-solid fa-users mr-3 text-xs opacity-70"></i><span class="truncate">{{ g.name }}</span>
      </button>
      
      <div class="text-[10px] text-slate-500 font-bold px-2 py-1 mt-2">DM</div>
      <button v-for="f in friends" :key="f.user_id" @click="selectDm(f)" :class="{'bg-indigo-500/20 text-indigo-300': currentChannelId === getDmId(currentUser?.user_id, f.user_id), 'text-slate-300': currentChannelId !== getDmId(currentUser?.user_id, f.user_id)}" class="w-full text-left px-3 py-3 rounded-xl flex items-center text-sm hover:bg-slate-800">
        <span class="mr-3 text-lg">{{ getCharIcon(f.char_type) }}</span><span class="truncate">{{ f.display_name }}</span>
      </button>
    </div>
    
    <!-- コミュニティ（チャンネル）リスト -->
    <div v-if="currentNavTab === 'teams'" class="space-y-1">
      <div v-for="ch in channels" :key="ch.channel_id" class="relative group">
        <button @click="selectChannel(ch.channel_id)" :class="{'bg-indigo-500/20 text-indigo-300': currentChannelId === ch.channel_id, 'text-slate-300': currentChannelId !== ch.channel_id}" class="w-full text-left px-3 py-3 rounded-xl flex items-center text-sm hover:bg-slate-800">
          <img v-if="ch.icon_url" :src="ch.icon_url" class="w-6 h-6 rounded-md mr-2 object-cover bg-white">
          <i v-else class="fa-solid fa-hashtag mr-3 text-xs opacity-60"></i>
          <span class="truncate">{{ ch.name }}</span>
        </button>
        <button v-if="currentUser?.role === 'admin' || currentUser?.role === 'parent' || currentUser?.role === 'root'" @click="openEditChannelModal(ch)" class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition"><i class="fa-solid fa-gear"></i></button>
      </div>
    </div>
  </div>
</div>
  `
};