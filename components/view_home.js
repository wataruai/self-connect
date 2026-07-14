export default {
  template: `
<!-- ★ ダッシュボード (Home) 画面 -->
<div v-if="currentNavTab === 'home'" class="p-4 md:p-8 w-full">
  
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl md:text-3xl font-extrabold text-slate-800">ダッシュボード</h2>
    <div class="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-2 rounded-2xl shadow-md font-bold flex items-center gap-2 border border-yellow-300 transform transition hover:scale-105 cursor-default">
      <span class="text-xl drop-shadow-sm">🪙</span>
      <span class="text-lg md:text-xl drop-shadow-sm">{{ currentUser?.coins || 0 }}</span>
      <span class="text-xs md:text-sm opacity-90 drop-shadow-sm">CC</span>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
    <!-- ユーザープロフィールカード -->
    <div class="col-span-1 lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border flex items-center">
      <div class="text-5xl md:text-7xl mr-4 md:mr-8 bg-indigo-50 p-4 rounded-3xl">{{ getCharIcon(currentUser?.char_type) }}</div>
      <div class="flex-1">
        <h3 class="text-xl md:text-3xl font-bold text-slate-700 mb-1">{{ currentUser?.display_name }} <span class="text-sm font-normal text-slate-400 ml-2 bg-slate-100 px-2 py-1 rounded">ロール: {{ currentUser?.role }}</span></h3>
        <p class="text-xs md:text-sm text-slate-500 mb-2">ID: {{ currentUser?.search_id }} ｜ 相棒: {{ currentUser?.char_name }}(Lv.{{ currentUser?.char_level || 1 }})</p>
        <div class="w-full bg-slate-100 rounded-full h-2 mb-1">
          <div class="bg-indigo-400 h-2 rounded-full" :style="{width: ((currentUser?.char_exp || 0) / ((currentUser?.char_level || 1) * 50) * 100) + '%'}"></div>
        </div>
        <p class="text-[10px] text-right text-indigo-400 font-bold">{{ currentUser?.char_exp || 0 }} / {{ (currentUser?.char_level || 1) * 50 }} XP</p>
      </div>
    </div>
    
    <!-- 時計・天気・おやすみモード情報 -->
    <div class="bg-white rounded-3xl p-4 shadow-sm border flex flex-col items-center justify-center relative">
      <div v-if="dndStatusText" class="absolute top-2 left-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-sm font-bold"><i class="fa-solid fa-moon mr-1"></i>{{ dndStatusText }}</div>
      <div v-if="weather" class="absolute top-2 right-3 text-center animate-pop-in">
        <div class="text-2xl">{{ weather.icon }}</div>
        <div class="text-[10px] font-bold text-slate-500 mt-1">{{ weather.temp }}℃</div>
      </div>
      <svg width="100" height="100" viewBox="0 0 100 100" class="mb-2">
        <circle cx="50" cy="50" r="48" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
        <line x1="50" y1="50" :x2="clockHands.hX" :y2="clockHands.hY" class="clock-hand" stroke-width="4"/>
        <line x1="50" y1="50" :x2="clockHands.mX" :y2="clockHands.mY" class="clock-hand" stroke-width="3"/>
        <line x1="50" y1="50" :x2="clockHands.sX" :y2="clockHands.sY" class="clock-hand second"/>
      </svg>
      <div class="font-bold text-slate-600 font-mono">{{ currentTimeStr }}</div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
    <!-- カレンダー -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border h-64">
      <h3 class="font-bold text-slate-700 mb-3 text-sm"><i class="fa-regular fa-calendar text-indigo-400 mr-2"></i>{{ currentYearMonth }}</h3>
      <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2"><div>日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div>土</div></div>
      <div class="grid grid-cols-7 gap-1 text-center text-xs">
        <div v-for="(day, i) in calendarDays" :key="i" class="p-1 rounded" :class="{'bg-indigo-50 text-indigo-600 font-bold': isToday(day)}">{{ day || '-' }}</div>
      </div>
    </div>
    
    <!-- My Todo -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border h-64 flex flex-col">
      <h3 class="font-bold text-slate-700 mb-3 text-sm"><i class="fa-solid fa-list-check text-emerald-400 mr-2"></i>My Todo</h3>
      <div class="flex-1 overflow-y-auto mb-2 space-y-2">
        <div v-for="td in todos" :key="td.todo_id" class="flex items-start gap-2 group">
          <input type="checkbox" :checked="td.is_done" @change="toggleTodo(td)" class="mt-1">
          <span class="flex-1 text-xs text-slate-700" :class="{'line-through text-slate-400': td.is_done}">{{ td.content }}</span>
          <button @click="deleteTodo(td.todo_id)" class="text-red-400 text-xs"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
      <div class="flex gap-2">
        <input v-model="newTodo" @keydown.enter="addTodo" placeholder="タスク追加" class="flex-1 border rounded px-2 py-1 text-xs outline-none">
        <button @click="addTodo" :disabled="isSendingTodo" class="bg-slate-800 text-white px-2 rounded text-[10px] font-bold disabled:opacity-50">
          <i v-if="isSendingTodo" class="fa-solid fa-spinner fa-spin"></i><span v-else>追加</span>
        </button>
      </div>
    </div>
    
    <!-- 今日の予定 -->
    <div class="bg-white rounded-2xl p-6 shadow-sm border h-64 flex flex-col">
      <h3 class="font-bold text-slate-700 mb-3 text-sm"><i class="fa-regular fa-clock text-orange-400 mr-2"></i>今日の予定</h3>
      <div class="flex-1 overflow-y-auto space-y-2 mb-3">
        <div v-if="todaysEvents.length === 0" class="text-xs text-slate-400">予定なし</div>
        <div v-for="ev in todaysEvents" :key="ev.event_id" class="text-xs text-slate-700 flex justify-between">
          <span class="truncate"><i class="fa-solid fa-circle text-[6px] text-orange-400 mr-2"></i>{{ ev.title }}</span>
          <button @click="deleteEvent(ev.event_id)" class="text-red-300"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
      <div class="flex flex-col gap-1 border-t pt-2">
        <input v-model="newEvent.title" placeholder="予定" class="w-full border rounded px-2 text-xs outline-none py-1">
        <div class="flex gap-1">
          <input v-model="newEvent.date" type="date" class="flex-1 border rounded px-1 text-[10px] outline-none">
          <button @click="addEvent" :disabled="isSendingEvent" class="bg-orange-500 text-white px-2 py-1 rounded text-[10px] font-bold disabled:opacity-50">
            <i v-if="isSendingEvent" class="fa-solid fa-spinner fa-spin"></i><span v-else>追加</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 今日の天気（詳細） -->
    <div v-if="weather" class="bg-white rounded-2xl p-6 shadow-sm border h-64 flex flex-col items-center justify-center relative overflow-hidden animate-pop-in">
      <div class="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-blue-50 to-white"></div>
      <h3 class="font-bold text-slate-700 mb-2 z-10 text-sm absolute top-4 left-4"><i class="fa-solid fa-cloud-sun text-blue-400 mr-2"></i>今日の天気</h3>
      <div class="text-6xl z-10 mt-6">{{ weather.icon }}</div>
      <div class="text-lg font-bold text-slate-700 z-10 mt-2">{{ weather.text }}</div>
      <div class="text-3xl font-extrabold text-slate-800 z-10 mt-1">{{ weather.temp }}<span class="text-lg text-slate-500">℃</span></div>
      <div class="flex gap-4 mt-3 z-10 text-xs font-bold">
        <div class="text-red-400">最高: {{ weather.max }}℃</div>
        <div class="text-blue-400">最低: {{ weather.min }}℃</div>
      </div>
      <div class="text-[10px] text-slate-400 mt-2 z-10">風速: {{ weather.wind }} km/h</div>
    </div>
    <div v-else class="bg-white rounded-2xl p-6 shadow-sm border h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
      <i class="fa-solid fa-location-dot text-2xl mb-2"></i>設定から位置情報を許可してください
    </div>
  </div>

  <!-- 課題アラートと運営からのお知らせ -->
  <div v-if="unsubmittedTasks.length > 0" class="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
    <div><i class="fa-solid fa-triangle-exclamation text-orange-500 mr-2"></i><span class="font-bold text-orange-800 text-sm">未提出の課題が {{ unsubmittedTasks.length }} 件あります。</span></div>
    <button @click="switchNav('study')" class="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">確認</button>
  </div>
  
  <div class="space-y-4">
    <h3 class="font-bold text-slate-800"><i class="fa-solid fa-bullhorn text-yellow-500 mr-2"></i>お知らせ</h3>
    <div v-if="activeNotifications.length === 0" class="text-slate-500 text-sm bg-white p-6 rounded-2xl border text-center">お知らせはありません。</div>
    <div v-for="n in activeNotifications" :key="n.notif_id" class="bg-white rounded-2xl p-4 md:p-6 shadow-sm border relative">
      <div class="text-xs text-slate-400 mb-2">{{ formatDate(n.created_at) }}</div>
      <p class="text-sm text-slate-700 whitespace-pre-wrap mb-2">{{ n.content }}</p>
      <div v-if="n.image_url" class="mb-4"><img :src="n.image_url" class="max-h-48 rounded border cursor-pointer" @click="openUrl(n.image_url)"></div>
      <div class="border-t border-slate-100 pt-3 flex flex-wrap items-center gap-2 md:gap-4">
        <button @click="addReaction(n.notif_id, '👍')" class="text-slate-400 hover:text-indigo-500 text-base">👍</button>
        <button @click="addReaction(n.notif_id, '❤️')" class="text-slate-400 hover:text-pink-500 text-base">❤️</button>
        <div class="flex-1 flex gap-1">
          <input v-model="n.replyText" placeholder="返信..." class="w-full bg-slate-50 border rounded-lg px-2 py-1 text-xs outline-none">
          <button @click="sendReply(n)" class="text-indigo-500 text-xs font-bold px-2">送信</button>
        </div>
      </div>
      <div v-if="parseInteractions(n).length > 0" class="mt-2 space-y-1 bg-slate-50 p-2 rounded-lg text-[10px]">
        <div v-for="(it, idx) in parseInteractions(n)" :key="idx"><span class="font-bold text-slate-600">{{ it.userName }}:</span> {{ it.text || it.type }}</div>
      </div>
      <button @click="markNotifRead(n.notif_id)" class="absolute top-4 right-4 text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-indigo-50"><i class="fa-solid fa-check mr-1"></i>消す</button>
    </div>
  </div>
  
</div>
  `
};