export default {
  template: `
<!-- ========================================== -->
<!-- 各種ポップアップ（モーダル）の定義ファイル -->
<!-- ========================================== -->

<!-- ★ 1. コミュニティ作成・編集モーダル -->
<div v-if="showCreateChannelModal" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full animate-pop-in relative">
    <button @click="showCreateChannelModal=false" class="absolute top-4 right-4 text-slate-400"><i class="fa-solid fa-xmark"></i></button>
    <h3 class="font-bold text-slate-800 mb-4 text-lg">
      <i class="fa-solid fa-hashtag text-indigo-500 mr-2"></i>{{ channelForm.id ? 'コミュニティを編集' : 'コミュニティを作成' }}
    </h3>
    <input v-model="channelForm.name" type="text" placeholder="コミュニティ名 (必須)" class="w-full bg-slate-50 border rounded-xl p-3 mb-3 text-sm outline-none focus:border-indigo-400">
    <textarea v-model="channelForm.desc" placeholder="コミュニティの説明・ルール (任意)" rows="2" class="w-full bg-slate-50 border rounded-xl p-3 mb-3 text-sm outline-none resize-none focus:border-indigo-400"></textarea>
    <input v-model="channelForm.icon_url" type="text" placeholder="アイコンの画像URL (任意)" class="w-full bg-slate-50 border rounded-xl p-3 mb-3 text-sm outline-none focus:border-indigo-400">
    
    <div class="text-xs font-bold text-slate-500 mb-2">閲覧・参加できるメンバー (空なら全員参加可能)</div>
    <div class="max-h-32 overflow-y-auto space-y-1 mb-4 border p-2 rounded-xl bg-slate-50">
      <label v-for="f in friends" :key="'ch_'+f.user_id" class="flex items-center space-x-2 cursor-pointer p-1 hover:bg-white rounded">
        <input type="checkbox" :value="f.user_id" v-model="channelForm.allowed_users">
        <span class="text-sm">{{ f.display_name }}</span>
      </label>
    </div>
    
    <button @click="saveChannel" :disabled="!channelForm.name || isSending" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl shadow disabled:opacity-50 transition">
      <i v-if="isSending" class="fa-solid fa-spinner fa-spin mr-2"></i><span v-else>{{ channelForm.id ? '保存する' : '作成する' }}</span>
    </button>
  </div>
</div>

<!-- ★ 2. ユーザープロフィール表示モーダル -->
<div v-if="showUserProfileModal" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[70] p-4">
  <div class="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full animate-pop-in relative text-center">
    <button @click="showUserProfileModal=false" class="absolute top-4 right-4 text-slate-400"><i class="fa-solid fa-xmark"></i></button>
    <div class="text-6xl mb-2">{{ getCharIcon(userProfileData?.char_type) }}</div>
    <h3 class="font-bold text-xl text-slate-800">{{ userProfileData?.display_name }}</h3>
    <p class="text-[10px] text-slate-400 font-mono mb-4">ID: {{ userProfileData?.search_id || '不明' }}</p>
    
    <div class="bg-slate-50 rounded-xl p-4 text-left mb-4 space-y-3 border shadow-inner">
      <div>
        <div class="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>Lv.{{ userProfileData?.char_level || 1 }} (XP)</span><span>{{ userProfileData?.char_exp || 0 }} / {{ (userProfileData?.char_level || 1) * 50 }}</span></div>
        <div class="w-full bg-slate-200 rounded-full h-1.5"><div class="bg-indigo-400 h-1.5 rounded-full" :style="{width: Math.min(((userProfileData?.char_exp || 0) / ((userProfileData?.char_level || 1) * 50) * 100), 100) + '%'}"></div></div>
      </div>
      <div>
        <div class="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>所持コイン</span><span>🪙 {{ userProfileData?.coins || 0 }} CC</span></div>
        <div class="w-full bg-slate-200 rounded-full h-1.5"><div class="bg-yellow-400 h-1.5 rounded-full" :style="{width: Math.min(((userProfileData?.coins || 0) / 10000) * 100, 100) + '%'}"></div></div>
      </div>
    </div>
    
    <div class="text-xs text-slate-500 mb-6 font-bold bg-slate-100 py-2 rounded-lg">
      <i class="fa-solid fa-clock mr-1"></i>最終オンライン: <span :class="isOnline(userProfileData?.last_active) ? 'text-emerald-500' : ''">{{ formatLastActive(userProfileData?.last_active) }}</span>
    </div>
    
    <button v-if="!isFriend(userProfileData?.user_id) && userProfileData?.user_id !== currentUser?.user_id" @click="isSending = true; sendRequest(userProfileData?.user_id).finally(() => { showUserProfileModal=false; isSending = false; })" :disabled="isSending" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow transition disabled:opacity-50">
      <i v-if="isSending" class="fa-solid fa-spinner fa-spin mr-2"></i>
      <span v-else><i class="fa-solid fa-user-plus mr-2"></i>フレンド申請を送る</span>
    </button>
    <button v-else-if="isFriend(userProfileData?.user_id)" @click="selectDm(userProfileData); showUserProfileModal=false" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl shadow transition">
      <i class="fa-solid fa-comment-dots mr-2"></i>DMを送る
    </button>
  </div>
</div>

<!-- ★ 3. フレンド申請確認モーダル -->
<div v-if="showFriendRequestModal" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[70] p-4">
  <div class="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full animate-pop-in relative text-center">
    <button @click="showFriendRequestModal=false" class="absolute top-4 right-4 text-slate-400"><i class="fa-solid fa-xmark"></i></button>
    <div class="text-xs font-bold text-indigo-500 mb-2 animate-bounce"><i class="fa-solid fa-bell mr-1"></i>フレンド申請が届きました！</div>
    <div class="text-6xl mb-2">{{ getCharIcon(activeFriendRequest?.user?.char_type) }}</div>
    <h3 class="font-bold text-xl text-slate-800">{{ activeFriendRequest?.user?.display_name }}</h3>
    
    <div class="bg-slate-50 rounded-xl p-4 text-left my-4 space-y-3 border">
      <div>
        <div class="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>Lv.{{ activeFriendRequest?.user?.char_level || 1 }} (XP)</span><span>{{ activeFriendRequest?.user?.char_exp || 0 }} / {{ (activeFriendRequest?.user?.char_level || 1) * 50 }}</span></div>
        <div class="w-full bg-slate-200 rounded-full h-1.5"><div class="bg-indigo-400 h-1.5 rounded-full" :style="{width: Math.min(((activeFriendRequest?.user?.char_exp || 0) / ((activeFriendRequest?.user?.char_level || 1) * 50) * 100), 100) + '%'}"></div></div>
      </div>
      <div>
        <div class="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>所持コイン</span><span>🪙 {{ activeFriendRequest?.user?.coins || 0 }} CC</span></div>
        <div class="w-full bg-slate-200 rounded-full h-1.5"><div class="bg-yellow-400 h-1.5 rounded-full" :style="{width: Math.min(((activeFriendRequest?.user?.coins || 0) / 10000) * 100, 100) + '%'}"></div></div>
      </div>
      <div class="text-[10px] text-slate-500 font-bold mt-2">
        <i class="fa-solid fa-clock mr-1"></i>最終ログイン: {{ formatLastActive(activeFriendRequest?.user?.last_active) }}
      </div>
    </div>
    
    <div class="flex gap-3 mt-6">
      <button @click="acceptRequestPopup" :disabled="isSending" class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow transition disabled:opacity-50">
        <i v-if="isSending" class="fa-solid fa-spinner fa-spin mr-2"></i><span v-else>承認する</span>
      </button>
      <!-- ★ お断りボタンを赤色に変更 -->
      <button @click="rejectRequestPopup" :disabled="isSending" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow transition disabled:opacity-50">
        <i v-if="isSending" class="fa-solid fa-spinner fa-spin mr-2"></i><span v-else>お断り</span>
      </button>
    </div>
  </div>
</div>

<!-- ★ 4. ID検索（フレンド追加）モーダル -->
<div v-if="showAddFriendModal" class="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full animate-pop-in relative">
    <button @click="showAddFriendModal = false" class="absolute top-4 right-4 text-slate-400"><i class="fa-solid fa-xmark text-xl"></i></button>
    <h3 class="text-2xl font-bold text-slate-800 mb-6"><i class="fa-solid fa-user-plus text-indigo-500 mr-2"></i>ID検索</h3>
    <div class="flex space-x-2 mb-4">
      <input v-model="searchIdInput" type="text" placeholder="フレンドのIDを入力" class="flex-1 bg-slate-50 rounded-xl p-3 border outline-none focus:border-indigo-400">
      <button @click="searchFriend" :disabled="isLoading" class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 rounded-xl font-bold shadow disabled:opacity-50">
        <i v-if="isLoading" class="fa-solid fa-spinner fa-spin"></i><span v-else>検索</span>
      </button>
    </div>
    <div v-if="searchResult" class="p-4 border rounded-xl bg-slate-50 flex items-center justify-between mt-4">
      <div class="flex items-center">
        <div class="text-2xl mr-3">{{ getCharIcon(searchResult.char_type) }}</div>
        <div class="font-bold text-slate-700">{{ searchResult.display_name }}</div>
      </div>
      <button @click="isSending = true; sendRequest(searchResult.user_id).finally(() => isSending = false)" :disabled="isSending" class="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold shadow disabled:opacity-50">
        <i v-if="isSending" class="fa-solid fa-spinner fa-spin mr-1"></i><span v-else>申請</span>
      </button>
    </div>
  </div>
</div>

<!-- ★ 5. グループDM作成モーダル -->
<div v-if="showGroupDmModal" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full animate-pop-in relative">
    <button @click="showGroupDmModal=false" class="absolute top-4 right-4 text-slate-400"><i class="fa-solid fa-xmark"></i></button>
    <h3 class="font-bold text-slate-800 mb-4 text-lg"><i class="fa-solid fa-users text-indigo-500 mr-2"></i>グループDM作成</h3>
    <input v-model="gdmForm.name" type="text" placeholder="グループ名" class="w-full bg-slate-50 border rounded-xl p-3 mb-4 text-sm outline-none focus:border-indigo-400">
    <div class="text-xs font-bold text-slate-500 mb-2">招待するメンバー</div>
    <div class="max-h-40 overflow-y-auto space-y-1 mb-4 border p-2 rounded-xl bg-slate-50">
      <label v-for="f in friends" :key="'gdm_'+f.user_id" class="flex items-center space-x-2 cursor-pointer p-1 hover:bg-white rounded">
        <input type="checkbox" :value="f.user_id" v-model="gdmForm.members"><span class="text-sm">{{ f.display_name }}</span>
      </label>
    </div>
    <button @click="createGroupDm" :disabled="!gdmForm.name || gdmForm.members.length === 0 || isSending" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl shadow disabled:opacity-50">
      <i v-if="isSending" class="fa-solid fa-spinner fa-spin mr-2"></i><span v-else>作成する</span>
    </button>
  </div>
</div>

<!-- ★ 6. 課題送信・修正モーダル -->
<div v-if="showSendTaskModal || showEditTaskModal" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full animate-pop-in relative">
    <button @click="showSendTaskModal=false; showEditTaskModal=false;" class="absolute top-4 right-4 text-slate-400"><i class="fa-solid fa-xmark"></i></button>
    <h3 class="font-bold text-slate-800 mb-4 text-lg"><i class="fa-solid fa-book-open text-indigo-500 mr-2"></i>{{ showEditTaskModal ? '課題を修正' : '課題を作成' }}</h3>
    <div class="space-y-3 mb-4">
      <select v-if="!showEditTaskModal" v-model="taskForm.to" class="w-full border p-2 rounded-lg text-sm outline-none bg-slate-50">
        <option value="">送り先(フレンド)を選択</option>
        <option v-for="f in friends" :value="f.user_id" :key="'to_'+f.user_id">{{f.display_name}}</option>
      </select>
      <input v-model="taskForm.title" type="text" placeholder="タイトル" class="w-full border p-2 rounded-lg text-sm outline-none bg-slate-50">
      <textarea v-model="taskForm.content" placeholder="詳細・説明" rows="3" class="w-full border p-2 rounded-lg text-sm outline-none resize-none bg-slate-50"></textarea>
      <select v-if="!showEditTaskModal" v-model="taskForm.type" class="w-full border p-2 rounded-lg text-sm outline-none bg-slate-50">
        <option value="text">記述式(テキスト)</option>
        <option value="file">写真(複数可)アップロード</option>
        <option value="choice">選択式</option>
      </select>
      <input v-if="!showEditTaskModal && taskForm.type==='choice'" v-model="taskForm.choicesStr" type="text" placeholder="選択肢(カンマ区切りで入力)" class="w-full border p-2 rounded-lg text-sm outline-none bg-slate-50">
      <div>
        <label class="block text-xs font-bold text-slate-500 mb-1">添付写真(複数可)</label>
        <input type="file" multiple accept="image/*" @change="setTaskFiles" class="text-xs">
      </div>
      <div>
        <label class="block text-xs font-bold text-slate-500 mb-1">期限</label>
        <input v-model="taskForm.deadline" type="datetime-local" class="w-full border p-2 rounded-lg text-sm outline-none bg-slate-50">
      </div>
    </div>
    <button @click="showEditTaskModal ? executeEditTask() : sendTask()" :disabled="!taskForm.title||isSending" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition shadow disabled:opacity-50">
      <i v-if="isSending" class="fa-solid fa-spinner fa-spin mr-2"></i><span v-else>{{ showEditTaskModal ? '修正を保存' : '送信する' }}</span>
    </button>
  </div>
</div>

<!-- ★ 7. クイズ作成モーダル -->
<div v-if="showQuizModal" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full animate-pop-in relative">
    <button @click="showQuizModal=false" class="absolute top-4 right-4 text-slate-400"><i class="fa-solid fa-xmark"></i></button>
    <h3 class="font-bold text-slate-800 mb-4 text-lg"><i class="fa-solid fa-gamepad text-indigo-500 mr-2"></i>クイズを作る</h3>
    <div class="space-y-3 mb-4">
      <textarea v-model="quizForm.question" placeholder="問題文を入力" rows="3" class="w-full border p-2 rounded-lg text-sm outline-none resize-none bg-slate-50"></textarea>
      <input v-model="quizForm.choice1" placeholder="選択肢 A" class="w-full border p-2 rounded-lg text-sm outline-none bg-slate-50">
      <input v-model="quizForm.choice2" placeholder="選択肢 B" class="w-full border p-2 rounded-lg text-sm outline-none bg-slate-50">
      <input v-model="quizForm.choice3" placeholder="選択肢 C" class="w-full border p-2 rounded-lg text-sm outline-none bg-slate-50">
      <input v-model="quizForm.choice4" placeholder="選択肢 D" class="w-full border p-2 rounded-lg text-sm outline-none bg-slate-50">
      <select v-model="quizForm.correct" class="w-full border p-2 rounded-lg text-sm outline-none bg-white font-bold text-emerald-600 border-emerald-300 bg-emerald-50">
        <option value="">正解の選択肢を指定</option>
        <option :value="quizForm.choice1" v-if="quizForm.choice1">A: {{quizForm.choice1}}</option>
        <option :value="quizForm.choice2" v-if="quizForm.choice2">B: {{quizForm.choice2}}</option>
        <option :value="quizForm.choice3" v-if="quizForm.choice3">C: {{quizForm.choice3}}</option>
        <option :value="quizForm.choice4" v-if="quizForm.choice4">D: {{quizForm.choice4}}</option>
      </select>
    </div>
    <button @click="createQuiz" :disabled="!quizForm.question||!quizForm.correct||isSending" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition shadow disabled:opacity-50">
      <i v-if="isSending" class="fa-solid fa-spinner fa-spin mr-2"></i><span v-else>クイズを出題</span>
    </button>
  </div>
</div>

<!-- ★ 8. 画像アップロード設定モーダル -->
<div v-if="showImageUploadModal" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full animate-pop-in relative">
    <button @click="showImageUploadModal=false" class="absolute top-4 right-4 text-slate-400"><i class="fa-solid fa-xmark"></i></button>
    <h3 class="font-bold text-slate-800 mb-4 text-lg"><i class="fa-solid fa-image text-indigo-500 mr-2"></i>写真の送信設定</h3>
    <label class="block w-full border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-50 transition mb-4">
      <i class="fa-solid fa-camera text-2xl text-slate-400 mb-2"></i>
      <div class="text-sm font-bold text-indigo-500">写真を選択</div>
      <div class="text-xs text-slate-400 mt-1">{{ uploadingImageFile ? uploadingImageFile.name : '選択されていません' }}</div>
      <input type="file" accept="image/*" ref="fileInput" class="hidden" @change="uploadingImageFile = $event.target.files[0]">
    </label>
    <div class="bg-slate-50 p-3 rounded-xl border text-sm mb-4 h-32 overflow-y-auto">
      <div class="font-bold text-slate-500 mb-2 text-xs">閲覧を許可するユーザー (空なら全員公開)</div>
      <label v-for="u in currentChannelMembers" :key="'img_'+u.user_id" class="flex items-center space-x-2 mb-1 cursor-pointer p-1 hover:bg-white rounded">
        <input type="checkbox" :value="u.user_id" v-model="selectedAllowedUsers"><span class="text-sm">{{ u.display_name }}</span>
      </label>
    </div>
    <button @click="executeImageUpload" :disabled="!uploadingImageFile || isSending" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition shadow disabled:opacity-50">
      <i v-if="isSending" class="fa-solid fa-spinner fa-spin mr-2"></i><span v-else>圧縮・送信する</span>
    </button>
  </div>
</div>

<!-- ★ 9. メッセージ全消去確認モーダル -->
<div v-if="showDeleteAllModal" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-3xl p-8 max-w-sm w-full animate-pop-in text-center">
    <div class="text-red-500 text-5xl mb-4"><i class="fa-solid fa-skull-crossbones"></i></div>
    <h3 class="text-xl font-bold mb-6">全メッセージ消去しますか？</h3>
    <div class="flex space-x-3">
      <button @click="isSending = true; executeDeleteAllMessages().finally(() => isSending = false)" :disabled="isSending" class="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:opacity-50">
        <i v-if="isSending" class="fa-solid fa-spinner fa-spin mr-2"></i><span v-else>実行</span>
      </button>
      <button @click="showDeleteAllModal = false" :disabled="isSending" class="flex-1 bg-slate-200 font-bold py-3 rounded-xl hover:bg-slate-300 disabled:opacity-50">キャンセル</button>
    </div>
  </div>
</div>

<!-- ★ 10. 設定モーダル（天気の位置情報取得を追加） -->
<div v-if="showSettingsModal" class="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[80] p-4">
  <div class="bg-white rounded-3xl p-0 w-full max-w-lg animate-pop-in relative overflow-hidden flex flex-col max-h-[90vh]">
    <div class="bg-slate-50 border-b p-5 md:p-6 shrink-0 relative">
      <button @click="showSettingsModal = false" class="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-xl"></i></button>
      <h3 class="text-xl md:text-2xl font-bold text-slate-800"><i class="fa-solid fa-gear text-indigo-500 mr-2"></i>設定</h3>
      <div class="flex gap-2 mt-4">
        <button @click="settingsTab='profile'" :class="settingsTab==='profile'?'bg-indigo-500 text-white shadow':'bg-white text-slate-500 border'" class="flex-1 py-1.5 text-xs font-bold rounded-lg transition">プロフィール</button>
        <button @click="settingsTab='notif'" :class="settingsTab==='notif'?'bg-indigo-500 text-white shadow':'bg-white text-slate-500 border'" class="flex-1 py-1.5 text-xs font-bold rounded-lg transition">通知設定</button>
        <button @click="settingsTab='dnd'" :class="settingsTab==='dnd'?'bg-indigo-500 text-white shadow':'bg-white text-slate-500 border'" class="flex-1 py-1.5 text-xs font-bold rounded-lg transition">おやすみ</button>
      </div>
    </div>
    <div class="p-6 overflow-y-auto flex-1">
      <div v-show="settingsTab==='profile'" class="space-y-5">
        <div><label class="block text-xs font-bold text-slate-500 mb-1">表示名</label><input v-model="settingsForm.display_name" type="text" class="w-full bg-slate-50 rounded-xl border p-3 text-sm outline-none focus:border-indigo-400 transition"></div>
        <div class="pt-2 border-t border-slate-100">
          <h4 class="text-sm font-bold text-slate-700 mb-3 flex items-center"><i class="fa-brands fa-discord text-indigo-500 mr-2"></i>Discord連携</h4>
          <p class="text-[10px] text-slate-400 mb-2">通知をDiscordに送る際にメンションします（18桁のユーザーIDを入力）。</p>
          <input v-model="settingsForm.discord_id" type="text" placeholder="例: 123456789012345678" class="w-full bg-slate-50 rounded-xl border p-3 text-sm outline-none font-mono focus:border-indigo-400 transition">
        </div>
        <div class="pt-4 border-t border-slate-100">
          <h4 class="text-sm font-bold text-slate-700 mb-2 flex items-center"><i class="fa-solid fa-location-dot text-emerald-500 mr-2"></i>天気・位置情報</h4>
          <p class="text-[10px] text-slate-400 mb-3">ダッシュボードに天気を表示するために位置情報の利用を許可します。</p>
          <button @click="isLoading = true; fetchWeather().finally(() => isLoading = false)" :disabled="isLoading" class="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-2 rounded-lg text-xs font-bold w-full border border-emerald-200 transition disabled:opacity-50">
            <i v-if="isLoading" class="fa-solid fa-spinner fa-spin mr-1"></i>
            <span v-else><i class="fa-solid fa-location-crosshairs mr-1"></i>現在地から天気を取得する</span>
          </button>
        </div>
        <div class="pt-4 mt-2 border-t border-slate-100"><button @click="logout" class="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl border border-red-200 transition"><i class="fa-solid fa-arrow-right-from-bracket mr-2"></i>ログアウト</button></div>
      </div>
      <div v-show="settingsTab==='notif'" class="space-y-5">
        <p class="text-xs text-slate-500 mb-4 bg-indigo-50 p-3 rounded-xl">アプリ内のアクティビティに対する、Discord等への外部通知を個別に設定できます。</p>
        <div class="flex items-center justify-between border-b pb-4"><div><div class="text-sm font-bold text-slate-700">課題のお知らせ</div><div class="text-[10px] text-slate-400 mt-0.5">新しい課題が届いた時や締め切り前</div></div><label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" v-model="settingsForm.notif_task" class="sr-only toggle-checkbox"><div class="w-11 h-6 bg-slate-200 rounded-full toggle-label transition-colors"></div><div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform" :class="{'translate-x-5': settingsForm.notif_task}"></div></label></div>
        <div class="flex items-center justify-between border-b pb-4"><div><div class="text-sm font-bold text-slate-700">メッセージ・メンション</div><div class="text-[10px] text-slate-400 mt-0.5">チャットでメンションされた時</div></div><label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" v-model="settingsForm.notif_message" class="sr-only toggle-checkbox"><div class="w-11 h-6 bg-slate-200 rounded-full toggle-label transition-colors"></div><div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform" :class="{'translate-x-5': settingsForm.notif_message}"></div></label></div>
        <div class="flex items-center justify-between pb-2"><div><div class="text-sm font-bold text-slate-700">運営からのお知らせ</div><div class="text-[10px] text-slate-400 mt-0.5">全体または個別のお知らせ</div></div><label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" v-model="settingsForm.notif_general" class="sr-only toggle-checkbox"><div class="w-11 h-6 bg-slate-200 rounded-full toggle-label transition-colors"></div><div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform" :class="{'translate-x-5': settingsForm.notif_general}"></div></label></div>
        <div class="pt-4 border-t"><button @click="requestPushPermission" class="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-xs font-bold w-full mb-2 shadow transition">ブラウザのPush通知を許可</button><button @click="testPush" class="bg-white hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold border w-full transition shadow-sm">テスト送信</button></div>
      </div>
      <div v-show="settingsTab==='dnd'" class="space-y-4">
        <div class="text-center mb-6"><div class="text-5xl text-indigo-200 mb-3"><i class="fa-solid fa-moon"></i></div><h4 class="font-bold text-slate-700 text-lg">おやすみモード</h4><p class="text-xs text-slate-500 mt-1">指定した期間、すべての外部通知を一時停止します。</p><div v-if="dndStatusText" class="mt-3 inline-block bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full">{{ dndStatusText }} まで停止中</div></div>
        <div class="grid grid-cols-2 gap-3">
          <button @click="settingsForm.dnd_hours = 1" :class="settingsForm.dnd_hours===1?'ring-2 ring-indigo-500 bg-indigo-50':'bg-white border hover:bg-slate-50'" class="p-3 rounded-xl text-sm font-bold text-slate-700 transition">1時間</button>
          <button @click="settingsForm.dnd_hours = 8" :class="settingsForm.dnd_hours===8?'ring-2 ring-indigo-500 bg-indigo-50':'bg-white border hover:bg-slate-50'" class="p-3 rounded-xl text-sm font-bold text-slate-700 transition">8時間 (睡眠用)</button>
          <button @click="settingsForm.dnd_hours = 24" :class="settingsForm.dnd_hours===24?'ring-2 ring-indigo-500 bg-indigo-50':'bg-white border hover:bg-slate-50'" class="p-3 rounded-xl text-sm font-bold text-slate-700 transition">明日まで (24h)</button>
          <button @click="settingsForm.dnd_hours = -1" :class="settingsForm.dnd_hours===-1?'ring-2 ring-indigo-500 bg-indigo-50':'bg-white border hover:bg-slate-50'" class="p-3 rounded-xl text-sm font-bold text-slate-700 transition">通知を再開(解除)</button>
        </div>
        <p class="text-[10px] text-slate-400 text-center mt-2">※保存ボタンを押すと適用されます。</p>
      </div>
    </div>
    <div class="p-5 border-t bg-slate-50 shrink-0">
      <button @click="saveSettings" :disabled="isLoading" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow transition disabled:opacity-50">
        <i v-if="isLoading" class="fa-solid fa-spinner fa-spin mr-2"></i><span v-else>設定を保存</span>
      </button>
    </div>
  </div>
</div>

<!-- ★ 11. 通帳モーダル -->
<div v-if="showPassbookModal" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[90] p-4">
  <div class="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full animate-pop-in relative flex flex-col max-h-[85vh]">
    <button @click="showPassbookModal=false" class="absolute top-4 right-4 text-slate-400"><i class="fa-solid fa-xmark"></i></button>
    <div class="shrink-0 mb-4 text-center border-b pb-4">
      <h3 class="font-bold text-slate-800 text-xl"><i class="fa-solid fa-book text-indigo-500 mr-2"></i>コネクト通帳</h3>
      <p class="text-xs text-slate-500 mt-1">過去の取引やボーナスの履歴</p>
    </div>
    
    <div class="flex-1 overflow-y-auto space-y-2 pr-2">
      <div v-if="isFetchingPassbook" class="text-center py-10 text-slate-400">
        <i class="fa-solid fa-spinner fa-spin text-3xl mb-2 text-indigo-300"></i>
        <div class="text-sm font-bold">記帳中...</div>
      </div>
      <div v-else-if="passbookData.length === 0" class="text-center py-10 text-sm text-slate-400 font-bold">
        履歴がありません。
      </div>
      <div v-else v-for="(record, idx) in passbookData" :key="idx" class="bg-slate-50 border rounded-xl p-3 flex justify-between items-center hover:bg-white transition">
        <div>
          <div class="text-[10px] text-slate-400 font-mono mb-0.5">{{ record.date }}</div>
          <div class="font-bold text-slate-700 text-sm">{{ record.title }}</div>
          <div class="text-[10px] text-slate-500">{{ record.detail }}</div>
        </div>
        <div class="text-lg font-bold font-mono" :class="record.isPlus ? 'text-emerald-500' : 'text-red-500'">
          {{ record.amountStr }}
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ★ 12. 管理者用 ユーザー編集モーダル -->
<div v-if="showAdminUserModal" class="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[80] p-4">
  <div class="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full animate-pop-in relative max-h-[90vh] overflow-y-auto">
    <button @click="showAdminUserModal=false" class="absolute top-4 right-4 text-slate-400"><i class="fa-solid fa-xmark"></i></button>
    <div class="flex items-center mb-6">
      <div class="text-4xl mr-4">{{ getCharIcon(adminSelectedUser?.char_type) }}</div>
      <div>
        <h3 class="font-bold text-slate-800 text-xl">{{ adminSelectedUser?.display_name }}</h3>
        <p class="text-xs text-slate-500">システムID: {{ adminSelectedUser?.user_id }}</p>
      </div>
    </div>
    
    <div class="space-y-4">
      <div class="bg-slate-50 p-4 rounded-xl border">
        <h4 class="text-xs font-bold text-slate-500 mb-2">基本設定・権限</h4>
        <div class="grid grid-cols-2 gap-2 mb-2">
          <div><label class="text-[10px] font-bold text-slate-400">表示名</label><input type="text" v-model="adminEditForm.display_name" class="w-full border rounded-lg p-2 text-sm outline-none"></div>
          <div><label class="text-[10px] font-bold text-slate-400">検索用ID</label><input type="text" v-model="adminEditForm.search_id" class="w-full border rounded-lg p-2 text-sm outline-none"></div>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label class="text-[10px] font-bold text-slate-400">権限ロール</label>
            <select v-model="adminEditForm.role" class="w-full border rounded-lg p-2 text-sm outline-none">
              <option value="normal">一般ユーザー</option>
              <option value="parent">保護者</option>
              <option value="admin">管理者</option>
            </select>
          </div>
          <div v-if="adminEditForm.role === 'normal'">
            <label class="text-[10px] font-bold text-slate-400">親(保護者)のシステムID</label>
            <input type="text" v-model="adminEditForm.parent_id" placeholder="usr_xxxx..." class="w-full border rounded-lg p-2 text-sm outline-none">
          </div>
        </div>
        <div><label class="text-[10px] font-bold text-slate-400">Discord ID (通知用)</label><input type="text" v-model="adminEditForm.discord_id" class="w-full border rounded-lg p-2 text-sm font-mono outline-none"></div>
      </div>

      <div class="bg-slate-50 p-4 rounded-xl border">
        <h4 class="text-xs font-bold text-slate-500 mb-2">利用時間制限 (保護者用機能)</h4>
        <div class="flex gap-2">
          <div class="flex-1"><label class="text-[10px] font-bold text-slate-400">開始時間</label><input type="time" v-model="adminEditForm.allowed_start" class="w-full border rounded-lg p-2 text-sm outline-none"></div>
          <div class="flex-1"><label class="text-[10px] font-bold text-slate-400">終了時間</label><input type="time" v-model="adminEditForm.allowed_end" class="w-full border rounded-lg p-2 text-sm outline-none"></div>
        </div>
      </div>

      <div class="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
        <div class="flex justify-between items-center mb-2">
          <h4 class="text-xs font-bold text-yellow-700">所持コインの強制操作</h4>
          <button @click="openPassbook(adminSelectedUser.user_id)" class="bg-white border text-yellow-700 px-2 py-1 rounded text-xs font-bold shadow-sm hover:bg-yellow-100"><i class="fa-solid fa-book mr-1"></i>通帳を見る</button>
        </div>
        <p class="text-[10px] text-yellow-600 mb-2">※マイナスの数値を入力すると借金状態になります。</p>
        <div class="flex items-center gap-2">
          <span class="font-bold text-yellow-600">🪙</span>
          <input type="number" v-model.number="adminEditForm.coins" class="w-full border rounded-lg p-2 text-sm font-mono outline-none">
          <span class="font-bold text-yellow-600 text-xs">CC</span>
        </div>
      </div>

      <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
        <h4 class="text-xs font-bold text-indigo-700 mb-2">強制フレンド追加</h4>
        <div class="flex gap-2">
          <input type="text" v-model="adminAddFriendId" placeholder="相手の検索ID" class="flex-1 border rounded-lg p-2 text-sm outline-none">
          <button @click="forceAddFriend" :disabled="isSendingAdmin" class="bg-indigo-500 text-white px-3 rounded-lg text-xs font-bold shadow disabled:opacity-50">強制登録</button>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-2 pt-2 border-t">
        <button @click="saveAdminUserEdit" :disabled="isSendingAdmin" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl shadow disabled:opacity-50 transition">
          <i v-if="isSendingAdmin" class="fa-solid fa-spinner fa-spin mr-2"></i><span v-else>設定を保存</span>
        </button>
        <button v-if="!adminSelectedUser?.is_blocked" @click="adminAction(adminSelectedUser.user_id, 'block')" class="flex-1 bg-orange-500 text-white py-2 rounded-xl font-bold text-sm shadow hover:bg-orange-600">凍結</button>
        <button v-else @click="adminAction(adminSelectedUser.user_id, 'unblock')" class="flex-1 bg-emerald-500 text-white py-2 rounded-xl font-bold text-sm shadow hover:bg-emerald-600">解除</button>
        <button @click="adminAction(adminSelectedUser.user_id, 'delete')" class="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold text-sm shadow hover:bg-red-700">完全削除</button>
      </div>
    </div>
  </div>
</div>

<!-- ★ 13. Aegis OVERRIDE パネル (一括株操作モーダル) -->
<div v-if="showAegisStockModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
  <div class="bg-slate-900 rounded-2xl p-6 md:p-8 max-w-2xl w-full animate-pop-in relative border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
    <button @click="showAegisStockModal=false" class="absolute top-4 right-4 text-slate-500 hover:text-white"><i class="fa-solid fa-xmark text-xl"></i></button>
    <div class="flex items-center mb-6 shrink-0">
      <i class="fa-solid fa-user-gear text-cyan-400 text-3xl mr-4"></i>
      <div>
        <h3 class="font-bold text-white text-xl font-mono tracking-wider">OVERRIDE PANEL</h3>
        <p class="text-[10px] text-slate-400 font-mono mt-1">ASSET MANIPULATION INTERFACE</p>
      </div>
    </div>
    
    <div class="flex-1 overflow-y-auto space-y-4 pr-2">
      <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <h4 class="text-xs font-bold text-cyan-400 mb-2">TARGET_CITIZENS (対象ユーザー選択)</h4>
        <div class="max-h-32 overflow-y-auto border border-slate-700 bg-slate-900 rounded-lg p-2 space-y-1">
          <label v-for="u in adminUserList" :key="u.user_id" class="flex items-center space-x-2 cursor-pointer p-1 hover:bg-slate-800 rounded">
            <input type="checkbox" :value="u.user_id" v-model="aegisStockForm.selectedUsers" class="accent-cyan-500">
            <span class="text-sm text-slate-200">{{ u.display_name }} <span class="text-[10px] text-slate-500 ml-1">({{u.search_id}})</span></span>
          </label>
        </div>
        <div class="text-[10px] text-slate-400 mt-1 text-right">{{ aegisStockForm.selectedUsers.length }} 人を選択中</div>
      </div>

      <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <h4 class="text-xs font-bold text-cyan-400 mb-2">TARGET_STOCKS (対象銘柄選択)</h4>
        <div class="max-h-40 overflow-y-auto border border-slate-700 bg-slate-900 rounded-lg p-2 space-y-1">
          <label v-for="st in tradeData.stocks" :key="st.stock_code" class="flex items-center space-x-2 cursor-pointer p-1 hover:bg-slate-800 rounded">
            <input type="checkbox" :value="st.stock_code" v-model="aegisStockForm.selectedStocks" class="accent-cyan-500">
            <span class="text-sm text-slate-200 font-mono">{{ st.stock_code }} <span class="text-slate-400 ml-1 font-sans">{{st.company_name}}</span></span>
          </label>
        </div>
        <div class="text-[10px] text-slate-400 mt-1 text-right">{{ aegisStockForm.selectedStocks.length }} 銘柄を選択中</div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h4 class="text-xs font-bold text-cyan-400 mb-2">AMOUNT (数量)</h4>
          <input v-model.number="aegisStockForm.amount" type="number" min="1" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white outline-none focus:border-cyan-500 font-mono">
        </div>
        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <h4 class="text-xs font-bold text-cyan-400 mb-2">CUSTOM_PRICE (指定価格決済)</h4>
          <input v-model.number="aegisStockForm.customPrice" type="number" placeholder="空なら現在の時価" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white outline-none focus:border-cyan-500 font-mono">
        </div>
      </div>
    </div>

    <div class="shrink-0 mt-6 pt-4 border-t border-slate-700 flex gap-4">
      <button @click="aegisStockForm.action = 'give'; executeAegisStockBatch()" :disabled="isSendingAdmin" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow text-sm font-mono disabled:opacity-50 transition">
        <i v-if="isSendingAdmin" class="fa-solid fa-spinner fa-spin mr-2"></i><span v-else><i class="fa-solid fa-arrow-down mr-2"></i>GIVE (無償付与)</span>
      </button>
      <button @click="aegisStockForm.action = 'take'; executeAegisStockBatch()" :disabled="isSendingAdmin" class="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg shadow text-sm font-mono disabled:opacity-50 transition">
        <i v-if="isSendingAdmin" class="fa-solid fa-spinner fa-spin mr-2"></i><span v-else><i class="fa-solid fa-arrow-up mr-2"></i>TAKE (強制没収)</span>
      </button>
    </div>
  </div>
</div>  `
};
