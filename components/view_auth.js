export default {
  template: `
<!-- ★ ようこそ（オートログイン中）画面 -->
<div v-if="isAutoLoggingIn" class="fixed inset-0 flex flex-col items-center justify-center z-50 bg-slate-900 text-white animate-pop-in">
  <div class="text-6xl mb-6 bg-white/10 p-4 rounded-3xl">{{ getCharIcon(autoLoginInfo.char_type) }}</div>
  <h2 class="text-xl md:text-3xl font-bold mb-2 text-center px-4">ようこそ、<br class="md:hidden">{{ autoLoginInfo.display_name }} さん！</h2>
  <p class="text-slate-400 flex items-center"><i class="fa-solid fa-spinner fa-spin mr-2"></i> 接続しています...</p>
</div>

<!-- ★ パスワード(PIN)入力画面 -->
<div v-if="showPinModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
  <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-pop-in text-center">
    <div class="text-4xl text-indigo-500 mb-4"><i class="fa-solid fa-lock"></i></div>
    <h3 class="text-xl font-bold text-slate-800 mb-2">パスワード(PIN)</h3>
    <p class="text-sm text-slate-500 mb-6">{{ pendingLoginAccount?.display_name }} さんのロックを解除</p>
    <input v-model="pinInput" type="password" maxlength="4" placeholder="****" class="w-full text-center text-3xl tracking-[1em] bg-slate-50 rounded-xl p-4 border outline-none focus:ring-2 focus:ring-indigo-400 mb-4">
    <div class="flex space-x-3">
      <button @click="verifyPin" :disabled="isLoading" class="flex-1 bg-indigo-500 text-white font-bold py-3 rounded-xl hover:bg-indigo-600 disabled:opacity-50"><i v-if="isLoading" class="fa-solid fa-spinner fa-spin"></i><span v-else>解除</span></button>
      <button @click="showPinModal=false; pendingLoginAccount=null;" class="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl">戻る</button>
    </div>
  </div>
</div>

<!-- ★ 認証・ログイン・アカウント選択画面 -->
<div v-if="!currentUser && !isAutoLoggingIn && !showPinModal" class="fixed inset-0 flex items-center justify-center z-40 p-4 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 overflow-y-auto">
  <div class="glass rounded-[2rem] shadow-2xl p-6 md:p-8 max-w-lg w-full border border-white relative animate-pop-in my-8">
    <div class="text-center mb-6"><div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white text-3xl mb-4 shadow-lg"><i class="fa-solid fa-leaf"></i></div><h2 class="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">セルフコネクト</h2></div>
    
    <div v-if="authMode !== 'select'" class="flex mb-6 bg-slate-100 p-1 rounded-xl">
      <button @click="authMode = 'new'" :class="authMode === 'new' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'" class="flex-1 py-2 text-sm font-bold rounded-lg transition">新規登録</button>
      <button @click="authMode = 'existing'" :class="authMode === 'existing' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'" class="flex-1 py-2 text-sm font-bold rounded-lg transition">復元</button>
    </div>
    
    <div v-if="authMode === 'select'" class="space-y-4">
      <p class="text-sm font-bold text-slate-500 mb-2">アカウントを選択</p>
      <div v-for="acc in savedAccounts" :key="acc.user_id" class="flex items-center gap-2">
        <div @click="requestPin(acc)" class="flex-1 cursor-pointer bg-white p-4 rounded-xl border hover:border-indigo-400 flex items-center shadow-sm">
          <div class="text-3xl mr-4">{{ getCharIcon(acc.char_type) }}</div>
          <div class="flex-1"><div class="font-bold text-slate-800">{{ acc.display_name }}</div><div class="text-[10px] text-slate-400 font-mono mt-0.5">ID: {{ acc.search_id }}</div></div>
          <i v-if="acc.pin" class="fa-solid fa-lock text-slate-300"></i>
        </div>
        <button @click="deleteLocalAccount(acc.user_id)" class="p-4 text-red-300 hover:text-red-500 bg-white rounded-xl shadow-sm border"><i class="fa-solid fa-trash"></i></button>
      </div>
      <button @click="authMode = 'new'" class="w-full mt-4 text-indigo-500 font-bold py-3 rounded-xl border border-indigo-200 hover:bg-indigo-50 transition">別のアカウントを追加</button>
    </div>
    
    <div v-else-if="authMode === 'new'" class="space-y-3">
      <div><label class="block text-xs font-bold text-slate-500 mb-1">あなたのお名前</label><input v-model="loginForm.name" type="text" placeholder="表示名" class="w-full bg-white/70 rounded-xl p-3 border outline-none"></div>
      <div><label class="block text-xs font-bold text-slate-500 mb-1">ユーザーID (ログイン用)</label><input v-model="loginForm.searchId" type="text" placeholder="半角英数字" class="w-full bg-white/70 rounded-xl p-3 border outline-none"></div>
      <div><label class="block text-xs font-bold text-slate-500 mb-1">相棒の名前</label><input v-model="loginForm.charName" type="text" placeholder="相棒(アバター)の名前" class="w-full bg-white/70 rounded-xl p-3 border outline-none"></div>
      <div><label class="block text-xs font-bold text-slate-500 mb-1">パスワード (4桁PIN/任意)</label><input v-model="loginForm.pin" type="text" maxlength="4" placeholder="数字4桁" class="w-full bg-white/70 rounded-xl p-3 border outline-none font-mono"></div>
      <div>
        <label class="block text-xs font-bold text-slate-500 mb-1">アイコン</label>
        <div class="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border">
          <div v-for="icon in availableIcons" :key="icon" @click="loginForm.charType = icon" :class="{'ring-2 ring-indigo-500 bg-white': loginForm.charType === icon}" class="cursor-pointer rounded-xl p-1 text-center text-2xl">{{ icon }}</div>
        </div>
      </div>
      <button @click="startApp" :disabled="isLoading" class="w-full mt-4 bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50"><i v-if="isLoading" class="fa-solid fa-spinner fa-spin mr-2"></i><span v-else>新しく始める</span></button>
      <button v-if="savedAccounts.length > 0" @click="authMode = 'select'" class="w-full text-slate-500 text-sm font-bold mt-2">戻る</button>
    </div>
    
    <div v-else-if="authMode === 'existing'" class="space-y-3">
      <p class="text-sm text-slate-600 mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">IDを入力して復元します。</p>
      <div><label class="block text-sm font-bold text-slate-700 mb-1">ユーザーID</label><input v-model="existingSearchId" type="text" class="w-full bg-white/70 rounded-xl p-3 border outline-none"></div>
      <button @click="loginExisting" :disabled="isLoading" class="w-full mt-6 bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50"><i v-if="isLoading" class="fa-solid fa-spinner fa-spin mr-2"></i><span>ログイン</span></button>
      <button v-if="savedAccounts.length > 0" @click="authMode = 'select'" class="w-full text-slate-500 text-sm font-bold mt-2">戻る</button>
    </div>
  </div>
</div>
  `
};