export default {
  template: `
<div v-if="currentNavTab === 'ai'" class="flex-1 flex flex-col h-full bg-slate-50 relative">
  <div class="h-16 glass border-b flex items-center px-6 shrink-0 justify-between">
    <h2 class="text-lg font-bold text-slate-700 flex items-center"><i class="fa-solid fa-robot text-indigo-500 mr-2 text-xl"></i>AIパートナー</h2>
    <div class="flex bg-slate-100 p-1 rounded-lg">
      <button @click="aiMode='chat'" :class="aiMode==='chat'?'bg-white shadow text-indigo-600':'text-slate-500'" class="px-3 py-1 text-xs font-bold rounded">チャット</button>
      <button @click="aiMode='video'" :class="aiMode==='video'?'bg-white shadow text-indigo-600':'text-slate-500'" class="px-3 py-1 text-xs font-bold rounded">動画生成</button>
    </div>
  </div>
  
  <!-- AI チャット -->
  <div v-if="aiMode === 'chat'" class="flex-1 flex flex-col overflow-hidden relative">
    <div class="px-4 py-2 border-b bg-white flex justify-between items-center shrink-0">
      <div class="text-xs font-bold text-slate-500">使用モデル</div>
      <select v-model="aiChatModel" class="border rounded p-1 text-xs bg-slate-50 outline-none">
        <option value="google/gemma-4-31b-it:free">Gemma 4-31B (無料)</option>
        <option value="openai/gpt-oss-120b:free">GPT-OSS 120B (無料)</option>
      </select>
      <button @click="aiChatHistory=[]" class="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-slate-300">履歴クリア</button>
    </div>
    
    <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6" id="aiChatContainer">
      <div v-if="aiChatHistory.length === 0" class="text-center text-slate-400 text-sm mt-10">AIになんでも質問してみましょう。</div>
      
      <div v-for="(msg, idx) in aiChatHistory" :key="'ai_'+idx" class="flex w-full" :class="{'justify-end': msg.role === 'user'}">
        <div v-if="msg.role !== 'user'" class="flex-shrink-0 mr-2 mt-1">
          <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500"><i class="fa-solid fa-robot"></i></div>
        </div>
        <div class="max-w-[85%] md:max-w-[75%]">
          <div class="px-4 py-2 shadow-sm chat-bubble text-sm leading-relaxed rounded-2xl" :class="msg.role === 'user' ? 'bg-indigo-500 text-white chat-self' : 'bg-white text-slate-700 border chat-other'" v-html="formatMessage({content: msg.content})"></div>
        </div>
      </div>
      
      <div v-if="isAILoading" class="flex justify-start">
        <div class="flex-shrink-0 mr-2 mt-1">
          <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500"><i class="fa-solid fa-robot"></i></div>
        </div>
        <div class="px-4 py-3 shadow-sm bg-white border text-slate-500 rounded-2xl rounded-bl-sm text-xs font-bold flex items-center">
          <i class="fa-solid fa-circle-notch fa-spin mr-2 text-indigo-500"></i>AIが考えています...
        </div>
      </div>
    </div>
    
    <div class="p-3 glass border-t shrink-0">
      <div class="max-w-4xl mx-auto flex items-end bg-white rounded-xl shadow-sm border p-1">
        <textarea v-model="aiChatInput" @keydown.ctrl.enter="sendAIChat" rows="1" placeholder="AIにメッセージ (Ctrl+Enterで送信)" class="flex-1 bg-transparent resize-none outline-none py-2 px-3 text-sm text-slate-700" :disabled="isAILoading"></textarea>
        <button @click="sendAIChat" :disabled="!aiChatInput.trim() || isAILoading" class="ml-2 text-white bg-indigo-500 rounded-lg p-2 h-9 w-9 flex items-center justify-center disabled:opacity-40">
          <i class="fa-solid fa-paper-plane text-sm"></i>
        </button>
      </div>
    </div>
  </div>
  
  <!-- AI 動画生成 -->
  <div v-if="aiMode === 'video'" class="flex-1 overflow-y-auto p-4 md:p-8">
    <div class="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border p-6">
      <div class="flex items-center justify-between mb-4 border-b pb-3">
        <h3 class="font-bold text-slate-700"><i class="fa-solid fa-video text-pink-500 mr-2"></i>動画生成 (Veo)</h3>
        <span class="text-[10px] bg-pink-100 text-pink-600 px-2 py-1 rounded font-bold">google/veo-3.1-lite</span>
      </div>
      <p class="text-xs text-slate-500 mb-4">生成したい動画の内容（プロンプト）を入力してください。</p>
      <textarea v-model="aiVideoPrompt" rows="4" class="w-full border rounded-xl p-3 text-sm outline-none resize-none focus:border-pink-400 transition mb-4" placeholder="例：夕焼けの海辺を走る犬のシネマティックな映像"></textarea>
      <button @click="sendAIVideo" :disabled="!aiVideoPrompt.trim() || isAILoading" class="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition shadow disabled:opacity-50 flex items-center justify-center">
        <i v-if="isAILoading" class="fa-solid fa-circle-notch fa-spin mr-2"></i>
        <span v-if="isAILoading">動画を生成しています...(数分かかります)</span>
        <span v-else><i class="fa-solid fa-wand-magic-sparkles mr-2"></i>動画を生成する</span>
      </button>
      
      <div v-if="aiVideoResult" class="mt-6 pt-6 border-t">
        <h4 class="font-bold text-slate-700 text-sm mb-2">生成結果:</h4>
        <div class="bg-slate-50 p-4 rounded-xl border text-sm text-slate-800 whitespace-pre-wrap leading-relaxed" v-html="formatMessage({content: aiVideoResult})"></div>
      </div>
    </div>
  </div>
</div>
  `
};