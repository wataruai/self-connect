export default {
  template: `
<div v-if="currentNavTab === 'shop'" class="flex-1 p-4 md:p-8 w-full h-full flex flex-col bg-slate-50">
  <div class="flex justify-between items-center mb-6 shrink-0">
    <h2 class="text-xl md:text-3xl font-extrabold text-slate-800"><i class="fa-solid fa-store text-yellow-500 mr-2"></i>ショップ＆ランキング</h2>
    <div class="bg-yellow-400 text-white px-3 py-1.5 rounded-xl shadow-sm font-bold flex items-center text-sm"><span>🪙 {{ currentUser?.coins || 0 }} CC</span></div>
  </div>
  <div class="flex gap-2 mb-4 shrink-0">
    <button @click="shopTab='items'" :class="shopTab==='items'?'bg-slate-800 text-white':'bg-white text-slate-500 border'" class="px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition">アイテム購入</button>
    <button @click="shopTab='ranking'" :class="shopTab==='ranking'?'bg-slate-800 text-white':'bg-white text-slate-500 border'" class="px-4 py-2 text-sm font-bold rounded-xl shadow-sm transition">資産ランキング</button>
  </div>
  
  <div v-if="shopTab==='items'" class="flex-1 overflow-y-auto">
    <h3 class="font-bold text-slate-700 mb-3"><i class="fa-solid fa-palette text-indigo-400 mr-2"></i>着せ替えテーマ</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
       <div v-for="item in themeItems" :key="item.id" class="bg-white border rounded-2xl p-4 flex flex-col shadow-sm relative overflow-hidden">
         <div class="absolute -right-4 -top-4 text-5xl opacity-10">{{ item.icon }}</div>
         <div class="font-bold text-slate-800 mb-1">{{ item.name }}</div><div class="text-xs text-slate-500 mb-4">{{ item.desc }}</div>
         <div class="mt-auto flex justify-between items-center">
           <div class="font-bold text-yellow-600 text-sm">🪙 {{ item.price }}</div>
           <button v-if="hasItem(item.id)" disabled class="bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg text-xs font-bold">所持済</button>
           <button v-else @click="buyItem(item)" :disabled="isSending || (currentUser?.coins || 0) < item.price" class="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow disabled:opacity-50">購入</button>
         </div>
       </div>
    </div>
    
    <h3 class="font-bold text-slate-700 mb-3"><i class="fa-regular fa-face-smile text-pink-400 mr-2"></i>チャットスタンプ</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
       <div v-for="item in stampItems" :key="item.id" class="bg-white border rounded-2xl p-4 flex flex-col shadow-sm relative overflow-hidden">
         <div class="absolute -right-4 -top-4 text-5xl opacity-10">{{ item.icon }}</div>
         <div class="font-bold text-slate-800 mb-1">{{ item.name }}</div><div class="text-xs text-slate-500 mb-4">{{ item.desc }}</div>
         <div class="mt-auto flex justify-between items-center">
           <div class="font-bold text-yellow-600 text-sm">🪙 {{ item.price }}</div>
           <button v-if="hasItem(item.id)" disabled class="bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg text-xs font-bold">所持済</button>
           <button v-else @click="buyItem(item)" :disabled="isSending || (currentUser?.coins || 0) < item.price" class="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow disabled:opacity-50">購入</button>
         </div>
       </div>
    </div>
  </div>
  
  <div v-if="shopTab==='ranking'" class="flex-1 overflow-y-auto bg-white border rounded-2xl p-4 shadow-sm h-fit">
    <div class="flex justify-between items-end border-b pb-2 mb-2">
      <div class="text-sm font-bold text-slate-500">順位 / ユーザー</div>
      <div class="text-sm font-bold text-slate-500">総資産 (CC)</div>
    </div>
    <div v-for="(u, idx) in rankingList" :key="u.user_id" class="flex justify-between items-center py-3 border-b last:border-0 hover:bg-slate-50 px-2 rounded">
      <div class="flex items-center">
        <div class="w-8 font-bold" :class="idx===0?'text-yellow-500 text-xl':idx===1?'text-slate-400 text-lg':idx===2?'text-amber-600 text-lg':'text-slate-500'">{{ idx + 1 }}</div>
        <div class="text-2xl mr-3">{{ getCharIcon(u.char_type) }}</div>
        <div class="font-bold text-slate-700" :class="{'text-indigo-600': u.user_id===currentUser?.user_id}">{{ u.display_name }}</div>
      </div>
      <div class="font-mono font-bold text-slate-700">🪙 {{ (u.total_assets||0).toLocaleString() }}</div>
    </div>
  </div>
</div>
  `
};