export default {
    template: `
<!-- ★ チャット・コミュニティ (Chat / Teams) 画面 -->
<div v-if="['chat', 'teams'].includes(currentNavTab)" class="flex-1 flex flex-col bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blend-overlay relative h-full">
  
  <div v-if="isChannelLoading" class="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
    <i class="fa-solid fa-spinner fa-spin text-4xl text-indigo-500 mb-2"></i>
    <span class="text-indigo-800 font-bold text-sm bg-white/80 px-3 py-1 rounded-full shadow-sm">読み込み中...</span>
  </div>
  
  <div v-if="!isMobile" class="h-16 glass border-b flex items-center px-6 shrink-0">
    <h2 class="text-lg font-bold text-slate-700"><i class="fa-solid fa-hashtag text-indigo-400 mr-2"></i>{{ currentChannelName }}</h2>
  </div>
  
  <div class="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth" id="chatContainer">
    <div v-for="msg in messages" :key="msg.message_id" class="flex w-full mb-6" :class="{'justify-end': msg.user_id === currentUser?.user_id}">
      
      <div v-if="msg.user_id !== currentUser?.user_id" class="flex-shrink-0 mr-2 mt-1">
        <!-- 相手のアイコン（クリックでプロフィールが見れるように準備） -->
        <div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center text-sm md:text-xl border cursor-pointer hover:bg-indigo-50 transition" @click="openUserProfile(msg.user_id)">
          {{ getCharIcon(msg.user?.char_type) }}
        </div>
      </div>
      
      <div class="max-w-[85%] md:max-w-[75%] flex flex-col relative" :class="{'items-end': msg.user_id === currentUser?.user_id, 'items-start': msg.user_id !== currentUser?.user_id}">
        <div class="flex items-baseline mb-1 px-1">
          <span v-if="msg.user_id !== currentUser?.user_id" class="text-xs md:text-sm font-bold text-slate-600 mr-2 cursor-pointer hover:text-indigo-500" @click="openUserProfile(msg.user_id)">{{ msg.user?.display_name || '退会済' }}</span>
          <span class="text-[10px] font-medium text-slate-400">{{ formatDate(msg.created_at) }}</span>
        </div>
        <div @dblclick="addLike(msg, $event)" @contextmenu.prevent="handleContextMenu($event, msg)" class="px-4 py-2 md:px-5 md:py-3 shadow-sm chat-bubble text-sm md:text-[15px] leading-relaxed relative rounded-2xl" :class="{'bg-gradient-to-br from-indigo-500 to-blue-600 text-white chat-self': msg.user_id === currentUser?.user_id, 'bg-white text-slate-700 border chat-other': msg.user_id !== currentUser?.user_id}">
          <div v-html="formatMessage(msg)"></div>
          <div v-if="msg.is_edited" class="text-[10px] opacity-60 text-right mt-1">(編集済)</div>
          <div v-if="msg.likes > 0" class="absolute -bottom-3 -right-2 bg-white border border-pink-100 text-pink-500 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full shadow-sm z-10">❤️ {{ msg.likes }}</div>
        </div>
      </div>
      
    </div>
  </div>
  
  <div class="p-2 md:p-4 glass border-t shrink-0">
    <div v-if="editMessageId" class="max-w-4xl mx-auto bg-yellow-50 text-yellow-700 px-3 py-1 rounded-t-lg text-xs font-bold border-l border-r border-t flex">
      <i class="fa-solid fa-pen mr-2 mt-0.5"></i>編集中...<button @click="cancelEdit" class="ml-auto"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="max-w-4xl mx-auto flex items-end bg-white rounded-xl md:rounded-2xl shadow-sm border p-1 md:p-2" :class="{'rounded-tl-none rounded-tr-none border-t-0': editMessageId}">
      <button @click="openImageUploadModal" class="p-2 md:p-3 text-slate-400 hover:text-indigo-500"><i class="fa-solid fa-camera text-base md:text-lg"></i></button>
      <textarea v-model="inputText" @keydown.ctrl.enter="submitMessage" rows="1" placeholder="Ctrl+Enterで送信" class="flex-1 bg-transparent resize-none outline-none py-2 px-1 md:px-2 text-sm md:text-base text-slate-700" :disabled="isSending"></textarea>
      <button @click="submitMessage" :disabled="!inputText.trim() || isSending" class="ml-1 md:ml-2 text-white rounded-lg md:rounded-xl p-2 md:p-3 h-9 w-9 md:h-11 md:w-11 flex items-center justify-center disabled:opacity-40" :class="editMessageId ? 'bg-yellow-500' : 'bg-indigo-500'">
        <i v-if="!isSending" class="fa-solid fa-paper-plane text-sm"></i><i v-else class="fa-solid fa-spinner fa-spin text-sm"></i>
      </button>
    </div>
  </div>
</div>
  `
};
