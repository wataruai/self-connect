// components/view_trade.js
export default {
  template: `
    <div v-if="currentNavTab === 'trade'" class="flex-1 flex flex-col p-4 md:p-8 w-full h-full bg-slate-50 relative overflow-hidden">
      
      <div v-if="isLoadingTrade" class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm animate-pop-in">
        <i class="fa-solid fa-chart-line fa-bounce text-5xl text-emerald-500 mb-4"></i>
        <div class="font-bold text-slate-600 bg-white px-6 py-2 rounded-full shadow-sm border">株価データを読み込み中...</div>
      </div>

      <!-- 上部ティッカー＆ヘッダー領域 -->
      <div class="bg-white border-b shadow-sm shrink-0">
        <div class="flex flex-wrap justify-between items-center p-4">
          <h2 class="text-xl md:text-2xl font-extrabold text-slate-800"><i class="fa-solid fa-chart-line text-emerald-500 mr-2"></i>市場データ</h2>
          <div class="flex items-center gap-2">
            <button @click="openPassbook(currentUser.user_id)" class="bg-slate-100 text-slate-600 border px-3 py-1.5 rounded-lg shadow-sm font-bold text-sm hover:bg-slate-200 transition">
              <i class="fa-solid fa-book text-indigo-400 mr-1"></i>通帳
            </button>
            <div class="bg-slate-800 text-white px-3 py-1.5 rounded-lg shadow-sm font-bold flex items-center text-sm font-mono"><span>🪙 {{ currentUser?.coins || 0 }} CC</span></div>
          </div>
        </div>
        <!-- ニュースティッカー -->
        <div v-if="tradeNews" class="w-full bg-red-50 border-t border-b border-red-100 text-red-600 text-xs font-bold py-2 px-4 flex items-center shrink-0">
          <i class="fa-solid fa-bolt text-red-500 mr-2 animate-pulse"></i>
          <span class="truncate">【速報】 {{ tradeNews }}</span>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden p-4 gap-4">
        
        <!-- 左側カラム：銘柄リストとポートフォリオ -->
        <div class="w-full lg:w-[320px] flex flex-col gap-4 h-full shrink-0">
          
          <div class="bg-white rounded-xl shadow-sm border flex flex-col h-1/2">
            <div class="p-3 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 class="font-bold text-slate-700 text-sm">銘柄リスト</h3>
              <div class="flex gap-1">
                <button @click="tradeFilter='real'" :class="tradeFilter==='real'?'bg-indigo-500 text-white':'bg-white text-slate-500 border'" class="text-[10px] font-bold px-2 py-1 rounded transition">実在</button>
                <button @click="tradeFilter='fiction'" :class="tradeFilter==='fiction'?'bg-indigo-500 text-white':'bg-white text-slate-500 border'" class="text-[10px] font-bold px-2 py-1 rounded transition">架空</button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-2 space-y-1">
              <div v-for="st in filteredStocks" :key="st.stock_code" @click="selectStock(st)" :class="{'bg-emerald-50 border-emerald-300': selectedStock?.stock_code === st.stock_code, 'bg-white border-transparent hover:bg-slate-50': selectedStock?.stock_code !== st.stock_code}" class="border rounded-lg p-2 cursor-pointer transition flex justify-between items-center">
                <div class="truncate pr-2">
                  <div class="font-bold text-slate-800 text-xs truncate">{{ st.company_name }}</div>
                  <div class="text-[9px] text-slate-400 font-mono">{{ st.stock_code }}</div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-emerald-600 text-xs font-mono">{{ getCurrentStockPrice(st.stock_code) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border flex flex-col h-1/2">
            <div class="p-3 border-b bg-slate-50 rounded-t-xl">
              <h3 class="font-bold text-slate-700 text-sm">ポートフォリオ</h3>
            </div>
            <div class="flex-1 overflow-y-auto p-2 space-y-1">
              <div v-for="p in tradeData.portfolios" :key="'pf_'+p.stock_code" class="border rounded-lg p-2 bg-white">
                <div class="flex justify-between text-xs font-bold mb-1 text-slate-800">
                  <span class="truncate pr-2">{{ getStockName(p.stock_code) }}</span>
                  <span class="font-mono text-indigo-600">{{ p.quantity }} 株</span>
                </div>
                <div class="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>取得: {{ p.average_price }}</span>
                  <span>現在: {{ getCurrentStockPrice(p.stock_code) }}</span>
                </div>
                <div class="text-right text-[10px] font-bold mt-1" :class="getProfitLossClass(p)">
                  {{ getProfitLoss(p) >= 0 ? '+' : '' }}{{ getProfitLoss(p) }} CC
                </div>
              </div>
              <div v-if="!tradeData.portfolios || tradeData.portfolios.length === 0" class="text-xs text-slate-400 text-center py-4">保有銘柄なし</div>
            </div>
          </div>

        </div>

        <!-- 右側カラム：メインチャートと詳細・売買パネル -->
        <div class="flex-1 flex flex-col h-full bg-white rounded-xl shadow-sm border overflow-hidden">
          <div v-if="!selectedStock && !isLoadingTrade" class="flex-1 flex items-center justify-center text-slate-400 font-bold flex-col">
            <i class="fa-solid fa-magnifying-glass-chart text-4xl mb-4 text-slate-200"></i>
            左のリストから銘柄を選択してください
          </div>
          
          <div v-show="selectedStock" class="flex flex-col h-full overflow-y-auto">
            <!-- 銘柄ヘッダー -->
            <div class="p-4 md:p-6 border-b flex flex-wrap justify-between items-end gap-4 shrink-0 bg-slate-50/50">
              <div>
                <div class="text-xs text-slate-400 font-mono mb-1">{{ selectedStock?.stock_code }} &bull; TYO <span v-if="selectedStock?.is_fictional" class="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded ml-2 text-[9px] font-bold">架空</span></div>
                <h3 class="text-2xl md:text-3xl font-bold text-slate-800">{{ selectedStock?.company_name }}</h3>
              </div>
              <div class="text-right">
                <div class="text-3xl md:text-4xl font-mono font-extrabold" :class="isStockPriceUp ? 'text-emerald-600' : 'text-red-600'">
                  {{ currentSelectedPrice }}
                  <i v-if="isStockPriceUp" class="fa-solid fa-arrow-trend-up text-xl ml-1"></i>
                  <i v-else class="fa-solid fa-arrow-trend-down text-xl ml-1"></i>
                </div>
                <div class="text-xs font-bold mt-1" :class="isStockPriceUp ? 'text-emerald-500' : 'text-red-500'">
                  {{ isStockPriceUp ? '+' : '' }}{{ currentSelectedPrice - (selectedStock?.base_price || currentSelectedPrice) }} (前日比)
                </div>
              </div>
            </div>

            <div class="flex flex-col lg:flex-row flex-1 p-4 md:p-6 gap-6 min-h-[400px]">
              <!-- チャートエリア -->
              <div class="flex-1 flex flex-col relative min-h-[300px]">
                <div class="flex justify-start mb-2 shrink-0 border-b pb-2">
                  <div class="flex gap-4 text-sm font-bold text-slate-500">
                    <button @click="chartDays = 1; renderTradeChart()" :class="chartDays === 1 ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-slate-800'" class="pb-1 transition">1日</button>
                    <button @click="chartDays = 2; renderTradeChart()" :class="chartDays === 2 ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-slate-800'" class="pb-1 transition">2日</button>
                    <button @click="chartDays = 3; renderTradeChart()" :class="chartDays === 3 ? 'text-indigo-600 border-b-2 border-indigo-600' : 'hover:text-slate-800'" class="pb-1 transition">3日</button>
                  </div>
                </div>

                <div class="flex-1 relative pb-6 pl-6">
                  <canvas id="tradeChartCanvas" v-show="!isTradeClosed || chartDays > 1"></canvas>
                  <div v-if="isTradeClosed && chartDays === 1" class="absolute inset-0 z-10 bg-slate-900/5 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <div class="bg-white px-6 py-4 rounded-xl shadow border flex flex-col items-center">
                      <i class="fa-solid fa-store-slash text-slate-400 text-3xl mb-2"></i>
                      <span class="font-bold text-slate-700">市場は閉まっています</span>
                      <span class="text-xs text-slate-500 mt-1">取引時間: 7:00 〜 21:30</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 詳細＆売買エリア -->
              <div class="w-full lg:w-64 shrink-0 flex flex-col gap-4">
                
                <div class="bg-slate-50 rounded-xl p-4 border text-sm text-slate-700 space-y-3">
                  <div class="flex justify-between border-b pb-2"><span class="text-slate-500 text-xs">前日の終値</span><span class="font-mono font-bold">{{ selectedStock?.base_price || '-' }}</span></div>
                  <div class="flex justify-between border-b pb-2"><span class="text-slate-500 text-xs">時価総額</span><span class="font-mono font-bold">約 {{ Math.floor(Math.random() * 900) + 100 }} 億 CC</span></div>
                  <div class="flex justify-between border-b pb-2"><span class="text-slate-500 text-xs">保有者数</span><span class="font-mono font-bold">{{ Math.floor(Math.random() * 50) + 5 }} 人</span></div>
                  <div class="pt-1 text-xs text-slate-500 leading-relaxed">{{ selectedStock?.company_name }} は、セルフコネクト経済圏に上場している{{ selectedStock?.is_fictional ? '架空の' : '主要な' }}企業です。</div>
                </div>

                <!-- 売買パネル（テンキー追加・左寄せ） -->
                <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <div class="text-xs font-bold text-indigo-800 mb-2">注文・決済</div>
                  
                  <div class="flex items-center gap-2 mb-2 bg-white rounded-lg p-1 border">
                    <button @click="tradeAmount = Math.max(1, tradeAmount-1)" :disabled="isTradeClosed" class="w-8 h-8 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-50"><i class="fa-solid fa-minus"></i></button>
                    <button @click="tradeAmount++" :disabled="isTradeClosed" class="w-8 h-8 rounded text-slate-500 hover:bg-slate-100 disabled:opacity-50"><i class="fa-solid fa-plus"></i></button>
                    <input v-model.number="tradeAmount" :disabled="isTradeClosed" type="number" class="flex-1 text-right font-mono font-bold text-lg outline-none bg-transparent disabled:text-slate-400 px-2">
                  </div>

                  <!-- ソフトウェアテンキー -->
                  <div class="grid grid-cols-4 gap-1 mb-4">
                    <button v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n" @click="tradeAmount = parseInt(tradeAmount.toString() + n)" :disabled="isTradeClosed" class="bg-white border rounded py-1 text-sm font-bold hover:bg-slate-50 shadow-sm disabled:opacity-50">{{ n }}</button>
                    <button @click="tradeAmount = 0" :disabled="isTradeClosed" class="bg-slate-200 border rounded py-1 text-xs font-bold hover:bg-slate-300 shadow-sm disabled:opacity-50 text-slate-500">C</button>
                    <button @click="tradeAmount = parseInt(tradeAmount.toString() + '0')" :disabled="isTradeClosed" class="bg-white border rounded py-1 text-sm font-bold hover:bg-slate-50 shadow-sm disabled:opacity-50">0</button>
                    <button @click="tradeAmount = Math.floor(currentUser.coins / currentSelectedPrice)" :disabled="isTradeClosed || currentSelectedPrice === 0" class="bg-indigo-100 text-indigo-600 border-indigo-200 border rounded py-1 text-xs font-bold hover:bg-indigo-200 shadow-sm disabled:opacity-50">MAX</button>
                  </div>

                  <div class="flex justify-between text-xs font-bold mb-4 px-1 text-slate-600">
                    <span>概算代金</span><span class="font-mono text-indigo-600">{{ currentSelectedPrice * tradeAmount }} CC</span>
                  </div>
                  
                  <div class="flex gap-2">
                    <button @click="executeTrade('buy')" :disabled="isSendingTrade || canBuyStock === false || isTradeClosed" class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg shadow-sm transition disabled:opacity-50 text-sm">
                      <i v-if="isSendingTrade" class="fa-solid fa-spinner fa-spin"></i><span v-else>買う</span>
                    </button>
                    <button @click="executeTrade('sell')" :disabled="isSendingTrade || canSellStock === false || isTradeClosed" class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg shadow-sm transition disabled:opacity-50 text-sm">
                      <i v-if="isSendingTrade" class="fa-solid fa-spinner fa-spin"></i><span v-else>売る</span>
                    </button>
                  </div>
                  <div class="mt-3 text-center text-[10px] text-slate-500">保有: {{ getOwnedQuantity(selectedStock?.stock_code) }} 株</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `
}