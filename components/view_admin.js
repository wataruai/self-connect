// components/view_admin.js
export default {
  template: `
    <div v-if="currentNavTab === 'admin'" class="flex-1 flex flex-col p-0 w-full h-full relative" :class="isAegisMode ? 'bg-slate-900 text-slate-200' : ''">
      
      <div v-if="isFetchingAdmin" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm animate-pop-in">
        <i class="fa-solid fa-user-shield fa-bounce text-5xl text-indigo-500 mb-4"></i>
        <div class="font-bold text-slate-600 bg-white px-6 py-2 rounded-full shadow-sm border">読み込み中...</div>
      </div>

      <!-- ============================================== -->
      <!-- 🛡️ Aegis System モード -->
      <!-- ============================================== -->
      <div v-if="isAegisMode" class="flex-1 flex flex-col h-full overflow-hidden p-4 md:p-8">
        <div class="flex items-center justify-between mb-8 border-b border-slate-700 pb-4 shrink-0">
          <div class="flex items-center">
            <i class="fa-solid fa-shield-halved text-cyan-400 text-3xl mr-3"></i>
            <div>
              <h2 class="text-xl md:text-2xl font-bold tracking-widest text-cyan-50">AEGIS <span class="font-light text-cyan-500">SYSTEM</span></h2>
              <div class="text-[10px] text-slate-400 font-mono tracking-widest mt-1">CORE TRADE & ECOSYSTEM CONTROL ENGINE</div>
            </div>
          </div>
          <button @click="logout" class="bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white px-4 py-2 rounded text-xs font-bold font-mono transition">EXIT SYSTEM</button>
        </div>

        <div class="flex-1 overflow-y-auto space-y-6 pr-2">
          
          <div v-show="adminSubTab === 'system'">
            <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
              <h3 class="text-sm font-bold text-cyan-400 mb-4 flex items-center font-mono"><i class="fa-solid fa-globe mr-2"></i>MARKET_STATUS</h3>
              <div class="flex items-center justify-between mb-4 bg-slate-900 p-4 rounded-lg border border-slate-800">
                <div>
                  <div class="text-xs text-slate-400">現在の市場ステータス</div>
                  <div class="text-lg font-bold" :class="marketStatus === 'open' ? 'text-emerald-400' : marketStatus === 'closed' ? 'text-red-400' : 'text-blue-400'">
                    {{ marketStatus === 'open' ? '臨時オープン (強制開場)' : marketStatus === 'closed' ? '臨時クローズ (強制閉鎖)' : 'AUTO (通常営業 7:00-21:30)' }}
                  </div>
                </div>
                <div class="flex gap-2">
                  <button @click="setMarketStatus('auto')" class="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded font-mono text-xs transition">AUTO</button>
                  <button @click="setMarketStatus('open')" class="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded font-mono text-xs transition">FORCE OPEN</button>
                  <button @click="setMarketStatus('closed')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded font-mono text-xs transition">FORCE CLOSE</button>
                </div>
              </div>
              
              <div class="mt-4 pt-4 border-t border-slate-700">
                <h3 class="text-xs font-bold text-slate-400 mb-2">手動シナリオ生成（バッチ処理の強制起動）</h3>
                <button @click="forceGenerateStockData" :disabled="isSendingAdmin" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded shadow text-xs font-mono disabled:opacity-50 transition">
                  <i v-if="isSendingAdmin" class="fa-solid fa-spinner fa-spin mr-2"></i>GENERATE_DAILY_DATA
                </button>
              </div>
            </div>

            <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 class="text-sm font-bold text-cyan-400 mb-4 flex items-center font-mono"><i class="fa-solid fa-user-gear mr-2"></i>ASSET_OVERRIDE (一括付与・没収)</h3>
              <p class="text-xs text-slate-400 mb-4">複数ユーザーに対して、複数の銘柄を同時に付与または没収します。</p>
              <button @click="openAegisStockModal('give')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded shadow text-xs font-mono mr-2 transition"><i class="fa-solid fa-plus mr-2"></i>OVERRIDE_PANEL を開く</button>
            </div>
          </div>

          <div v-show="adminSubTab === 'aegis_discord'">
            <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 class="text-sm font-bold text-cyan-400 mb-4 flex items-center font-mono"><i class="fa-brands fa-discord mr-2"></i>AEGIS_BROADCAST (Discord手動通知)</h3>
              <p class="text-xs text-slate-400 mb-4">Aegisシステム専用のWebhookを経由して、強制メンション付きのアナウンスを送信します。</p>
              
              <div class="mb-4 bg-slate-900 p-3 rounded-lg border border-slate-700">
                <h4 class="text-[10px] text-slate-500 mb-2 font-mono">ROLE_MENTIONS (登録済みロール)</h4>
                <div class="flex gap-2">
                  <button @click="aegisDiscordRoleId = '123456789012345678'" class="bg-slate-800 border border-slate-600 text-cyan-300 px-2 py-1 rounded text-[10px] hover:bg-slate-700 transition">@幹部用</button>
                  <button @click="aegisDiscordRoleId = '987654321098765432'" class="bg-slate-800 border border-slate-600 text-cyan-300 px-2 py-1 rounded text-[10px] hover:bg-slate-700 transition">@お知らせ用</button>
                </div>
              </div>

              <textarea v-model="aegisDiscordMessage" rows="3" placeholder="アナウンス内容を入力..." class="w-full bg-slate-900 border border-slate-700 rounded p-3 text-sm text-white outline-none mb-3 focus:border-cyan-500"></textarea>
              
              <div class="flex items-center gap-4 mb-4 bg-slate-900 p-3 rounded border border-slate-700">
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" v-model="aegisDiscordMentionEveryone" class="accent-cyan-500"><span class="text-xs text-slate-300 font-mono">@everyone</span>
                </label>
                <input v-model="aegisDiscordRoleId" type="text" placeholder="特定のロールIDを手動入力 (任意)" :disabled="aegisDiscordMentionEveryone" class="flex-1 bg-slate-800 border border-slate-600 rounded p-1.5 text-xs text-white outline-none disabled:opacity-50 font-mono">
              </div>
              
              <div class="text-right">
                <button @click="sendAegisDiscordAlert" :disabled="isSendingAdmin || !aegisDiscordMessage" class="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded shadow text-xs font-mono disabled:opacity-50 transition">
                  <i v-if="isSendingAdmin" class="fa-solid fa-spinner fa-spin mr-2"></i>TRANSMIT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- 👔 通常の管理者モード -->
      <!-- ============================================== -->
      <div v-if="!isAegisMode" class="flex-1 flex flex-col p-4 md:p-8 h-full overflow-hidden">
        <div class="flex gap-2 overflow-x-auto pb-2 mb-4 border-b border-slate-200 shrink-0">
          <button v-if="currentUser?.role==='admin'||currentUser?.role==='parent'||currentUser?.role==='root'" @click="changeAdminTab('stats')" :class="adminSubTab==='stats'?'bg-slate-800 text-white':'text-slate-500'" class="px-3 py-1 text-xs md:text-sm font-bold rounded-lg shrink-0">統計</button>
          <button v-if="currentUser?.role==='admin'||currentUser?.role==='parent'||currentUser?.role==='root'" @click="changeAdminTab('users')" :class="adminSubTab==='users'?'bg-slate-800 text-white':'text-slate-500'" class="px-3 py-1 text-xs md:text-sm font-bold rounded-lg shrink-0">ユーザー</button>
          <button v-if="currentUser?.role==='admin'||currentUser?.role==='root'" @click="changeAdminTab('messages')" :class="adminSubTab==='messages'?'bg-slate-800 text-white':'text-slate-500'" class="px-3 py-1 text-xs md:text-sm font-bold rounded-lg shrink-0">メッセージ</button>
          <button v-if="currentUser?.role==='admin'||currentUser?.role==='root'" @click="changeAdminTab('notifs')" :class="adminSubTab==='notifs'?'bg-slate-800 text-white':'text-slate-500'" class="px-3 py-1 text-xs md:text-sm font-bold rounded-lg shrink-0">お知らせ</button>
          <button v-if="currentUser?.role==='admin'||currentUser?.role==='root'" @click="changeAdminTab('discord')" :class="adminSubTab==='discord'?'bg-indigo-600 text-white':'text-indigo-500'" class="px-3 py-1 text-xs md:text-sm font-bold rounded-lg shrink-0 border border-indigo-100">Discord管理</button>
          <button v-if="currentUser?.role==='admin'||currentUser?.role==='root'" @click="changeAdminTab('system')" :class="adminSubTab==='system'?'bg-red-500 text-white':'text-red-500'" class="px-3 py-1 text-xs md:text-sm font-bold rounded-lg shrink-0 ml-auto transition">システム</button>
        </div>
        
        <div class="flex-1 overflow-y-auto pb-8">
          <div v-show="adminSubTab === 'stats'">
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div class="bg-white p-4 rounded-xl border text-center"><div class="text-xs font-bold mb-1">管理ユーザー</div><div class="text-2xl font-extrabold text-indigo-600">{{ adminStats?.totalUsers || 0 }}</div></div>
              <div class="bg-white p-4 rounded-xl border text-center"><div class="text-xs font-bold mb-1">総メッセージ</div><div class="text-2xl font-extrabold text-blue-500">{{ adminStats?.totalMessages || 0 }}</div></div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="bg-white p-4 rounded-xl border"><h3 class="text-xs font-bold text-slate-500 mb-2">日別メッセージ推移</h3><div class="h-48 w-full"><canvas id="adminChartCanvas"></canvas></div></div>
              <div class="bg-white p-4 rounded-xl border"><h3 class="text-xs font-bold text-slate-500 mb-2">時間帯別の利用状況</h3><div class="h-48 w-full"><canvas id="adminHourChartCanvas"></canvas></div></div>
            </div>
          </div>
          
          <div v-show="adminSubTab === 'users'" class="bg-white rounded-xl border overflow-x-auto">
            <table class="w-full text-left text-xs md:text-sm text-slate-600 whitespace-nowrap">
              <thead class="bg-slate-50 border-b"><tr><th class="p-2 md:p-4">ユーザー</th><th class="p-2 md:p-4">制限時間</th><th class="p-2 md:p-4 text-center">メッセージ</th><th class="p-2 md:p-4 text-center">完了課題</th><th class="p-2 md:p-4 text-center">学習(分)</th><th class="p-2 md:p-4 text-center">状態</th><th class="p-2 md:p-4 text-right">操作</th></tr></thead>
              <tbody>
                <tr v-for="u in adminUserList" :key="u.user_id" class="border-b hover:bg-slate-50">
                  <td class="p-2 md:p-4 font-bold text-slate-800 flex items-center"><span class="text-2xl mr-2">{{ getCharIcon(u.char_type) }}</span><div><div>{{ u.display_name }}</div><div class="text-[10px] text-slate-400 font-normal">ID: {{ u.search_id }}</div></div></td>
                  <td class="p-2 md:p-4 text-[10px]">{{ u.allowed_start }}〜{{ u.allowed_end }}</td>
                  <td class="p-2 md:p-4 text-center font-mono">{{ u.msgCount||0 }}</td>
                  <td class="p-2 md:p-4 text-center font-mono">{{ u.taskCount||0 }}</td>
                  <td class="p-2 md:p-4 text-center font-mono">{{ u.studyTime||0 }}</td>
                  <td class="p-2 md:p-4 text-center"><span v-if="u.is_blocked" class="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-bold">凍結</span><span v-else class="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-1 rounded font-bold">正常</span></td>
                  <td class="p-2 md:p-4 text-right">
                    <button @click="openAdminUserModal(u)" class="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow transition hover:bg-slate-700">設定・通帳</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-show="adminSubTab === 'discord'" class="space-y-6">
            <div class="bg-indigo-50 text-indigo-700 p-4 rounded-xl text-sm font-bold">
              <i class="fa-brands fa-discord mr-2"></i>アプリ内の出来事を、Discordの各チャンネルに自動で転送（通知）する設定です。
            </div>
            <div class="bg-white border rounded-xl shadow-sm p-4 md:p-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-slate-700">登録済み Webhook URL</h3>
                <button @click="addWebhook" class="bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-200"><i class="fa-solid fa-plus mr-1"></i>追加</button>
              </div>
              <div class="space-y-4">
                <div v-for="(wh, idx) in adminWebhooks" :key="wh.id" class="border rounded-xl p-4 bg-slate-50 relative">
                  <button @click="removeWebhook(idx)" class="absolute top-4 right-4 text-slate-400 hover:text-red-500"><i class="fa-solid fa-trash"></i></button>
                  <input v-model="wh.name" type="text" placeholder="名前 (例: メインチャット用)" class="w-full md:w-1/2 border rounded-lg p-2 mb-2 text-sm outline-none">
                  <input v-model="wh.url" type="text" placeholder="Discord Webhook URL を入力" class="w-full border rounded-lg p-2 mb-4 text-sm outline-none font-mono">
                  <div class="text-xs font-bold text-slate-500 mb-2">このWebhookに送信する通知</div>
                  <div class="flex flex-wrap gap-2">
                    <label class="flex items-center space-x-1 bg-white border px-2 py-1 rounded cursor-pointer hover:bg-slate-50"><input type="checkbox" v-model="wh.isDefaultGeneral" @change="ensureSingleDefault('isDefaultGeneral', wh)"><span class="text-xs">システム・全体</span></label>
                    <label class="flex items-center space-x-1 bg-white border px-2 py-1 rounded cursor-pointer hover:bg-slate-50"><input type="checkbox" v-model="wh.isDefaultTask" @change="ensureSingleDefault('isDefaultTask', wh)"><span class="text-xs">課題・予定</span></label>
                    <label class="flex items-center space-x-1 bg-white border px-2 py-1 rounded cursor-pointer hover:bg-slate-50"><input type="checkbox" v-model="wh.isDefaultMessage" @change="ensureSingleDefault('isDefaultMessage', wh)"><span class="text-xs">チャット</span></label>
                    <label class="flex items-center space-x-1 bg-emerald-50 border-emerald-200 px-2 py-1 rounded cursor-pointer hover:bg-emerald-100"><input type="checkbox" v-model="wh.isDefaultTrade" @change="ensureSingleDefault('isDefaultTrade', wh)"><span class="text-xs text-emerald-700">株の売買通知</span></label>
                    <label class="flex items-center space-x-1 bg-red-50 border-red-200 px-2 py-1 rounded cursor-pointer hover:bg-red-100"><input type="checkbox" v-model="wh.isDefaultNews" @change="ensureSingleDefault('isDefaultNews', wh)"><span class="text-xs text-red-700">架空ニュース速報</span></label>
                    <label class="flex items-center space-x-1 bg-slate-800 text-white px-2 py-1 rounded cursor-pointer"><input type="checkbox" v-model="wh.isDefaultAegis" @change="ensureSingleDefault('isDefaultAegis', wh)"><span class="text-xs text-cyan-400">AEGIS監視</span></label>
                  </div>
                </div>
                <div v-if="adminWebhooks.length === 0" class="text-center text-slate-400 text-sm py-4">Webhookが登録されていません</div>
              </div>
              <div class="mt-6 border-t pt-4 text-right">
                <button @click="saveAdminWebhooks" :disabled="isSendingAdmin" class="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow disabled:opacity-50">
                  <i v-if="isSendingAdmin" class="fa-solid fa-spinner fa-spin mr-2"></i>保存する
                </button>
              </div>
            </div>

            <div class="bg-white border rounded-xl shadow-sm p-4 md:p-6 mt-6">
              <h3 class="font-bold text-slate-700 mb-4"><i class="fa-solid fa-paper-plane text-indigo-500 mr-2"></i>手動メッセージ送信</h3>
              <div class="mb-4">
                <select v-model="adminManualWebhookUrl" class="w-full border rounded-lg p-2 text-sm outline-none bg-slate-50">
                  <option value="">送信先のWebhookを選択</option>
                  <option v-for="wh in adminWebhooks" :key="wh.id" :value="wh.url">{{ wh.name }}</option>
                </select>
              </div>
              <div class="mb-2">
                <textarea v-model="adminManualWebhookText" rows="4" placeholder="送信するメッセージを入力..." class="w-full border rounded-lg p-2 text-sm outline-none resize-none"></textarea>
              </div>
              <div class="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 rounded-lg border">
                <div class="text-[10px] font-bold text-slate-500 w-full mb-1">クリックでメンションを挿入</div>
                <button v-for="u in adminUserList.filter(x=>x.discord_id)" :key="u.user_id" @click="insertMention(u.discord_id)" class="bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-xs font-bold transition shadow-sm">@{{ u.display_name }}</button>
                <div v-if="adminUserList.filter(x=>x.discord_id).length === 0" class="text-xs text-slate-400">Discord IDが設定されているユーザーがいません</div>
              </div>
              <div class="text-right">
                <button @click="sendAdminManualDiscord" :disabled="isSendingAdmin || !adminManualWebhookUrl || !adminManualWebhookText" class="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow disabled:opacity-50 transition">
                  <i v-if="isSendingAdmin" class="fa-solid fa-spinner fa-spin mr-2"></i>送信する
                </button>
              </div>
            </div>
          </div>
          
          <div v-show="adminSubTab === 'system'" class="space-y-6">
            <div class="bg-white border p-6 rounded-xl shadow-sm">
              <h3 class="font-bold text-slate-700 mb-2 text-lg"><i class="fa-solid fa-chart-line text-emerald-500 mr-2"></i>株ゲームデータ生成</h3>
              <p class="text-xs text-slate-500 mb-4">通常は毎朝の自動バッチで生成されますが、手動で本日の「株価シナリオ」と「AI架空ニュース」を生成します。</p>
              <button @click="forceGenerateStockData" :disabled="isSendingAdmin" class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg shadow text-sm disabled:opacity-50 transition"><i v-if="isSendingAdmin" class="fa-solid fa-spinner fa-spin mr-2"></i>本日の株価シナリオを手動生成する</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};