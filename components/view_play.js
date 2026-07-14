export default {
  template: `
<div v-if="currentNavTab === 'play'" class="flex-1 p-4 md:p-8 w-full">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-xl md:text-3xl font-extrabold text-slate-800"><i class="fa-solid fa-gamepad text-indigo-500 mr-2"></i>クイズで遊ぼう！</h2>
    <button @click="showQuizModal=true" class="bg-indigo-600 text-white px-4 py-2 text-xs md:text-sm rounded-lg font-bold shadow hover:bg-indigo-700 transition">
      <i class="fa-solid fa-plus mr-1"></i>クイズを作る
    </button>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div v-for="q in quizzes" :key="q.quiz_id" class="bg-white rounded-2xl p-5 shadow-sm border flex flex-col">
      <div class="text-xs text-slate-500 mb-2 font-bold">{{ q.user?.display_name || '不明' }} からの出題</div>
      <h3 class="text-lg font-bold text-slate-800 mb-4 whitespace-pre-wrap">{{ q.question }}</h3>
      
      <div v-if="!q.answered" class="space-y-2 mt-auto">
        <button v-for="(c, i) in parseChoices(q.choices)" :key="i" @click="answerQuiz(q, c)" :disabled="isSending" class="w-full bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-700 font-bold py-2 px-3 rounded-lg text-sm text-left transition shadow-sm">
          {{ ['A','B','C','D'][i] }}. {{ c }}
        </button>
      </div>
      <div v-else class="mt-auto pt-4 border-t border-slate-100">
        <div v-if="q.is_correct" class="text-emerald-500 font-bold flex items-center"><i class="fa-solid fa-circle-check mr-2 text-xl"></i>正解！ (+{{ q.xp_reward }}XP)</div>
        <div v-else class="text-red-500 font-bold flex items-center"><i class="fa-solid fa-circle-xmark mr-2 text-xl"></i>不正解… (正解: {{ q.correct_answer }})</div>
      </div>
    </div>
    
    <div v-if="quizzes.length === 0" class="col-span-full text-center py-10 text-slate-500 font-bold">
      まだクイズがありません。最初のクイズを作りましょう！
    </div>
  </div>
</div>
  `
};