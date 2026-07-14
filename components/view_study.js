export default {
  template: `
<div v-if="currentNavTab === 'study'" class="flex-1 p-4 md:p-8 w-full">
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-xl md:text-3xl font-extrabold text-slate-800"><i class="fa-solid fa-book text-indigo-500 mr-2"></i>課題と勉強</h2>
    <button @click="showSendTaskModal=true" class="bg-indigo-600 text-white px-4 py-2 text-xs md:text-sm rounded-lg font-bold shadow hover:bg-indigo-700 transition">
      <i class="fa-solid fa-paper-plane mr-1"></i>新しく送る
    </button>
  </div>
  
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- 左側：学習記録と届いた課題 -->
    <div class="space-y-6">
      <div class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border">
        <h3 class="font-bold text-slate-700 mb-3 text-sm md:text-base"><i class="fa-solid fa-clock mr-2 text-indigo-400"></i>学習記録</h3>
        <div class="flex gap-2 mb-2">
          <input v-model="studyForm.subject" placeholder="科目" class="flex-1 bg-slate-50 border rounded p-2 text-xs md:text-sm outline-none">
          <input v-model="studyForm.duration" type="number" placeholder="分数" class="w-16 md:w-24 bg-slate-50 border rounded p-2 text-xs md:text-sm outline-none">
          <button @click="addStudyLog" :disabled="isSendingLog" class="bg-emerald-500 px-3 rounded text-xs font-bold text-white disabled:opacity-50">
            <i v-if="isSendingLog" class="fa-solid fa-spinner fa-spin"></i><span v-else>記録</span>
          </button>
        </div>
        <div class="text-xs text-slate-500">累計: {{ totalStudyTime }} 分</div>
      </div>
      
      <div class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border">
        <h3 class="font-bold text-slate-700 mb-3 text-sm md:text-base"><i class="fa-solid fa-inbox mr-2 text-indigo-400"></i>届いた課題</h3>
        <div v-if="myTasks.length === 0" class="text-xs text-slate-500">課題なし</div>
        <div v-for="t in myTasks" :key="t.task_id" class="mb-4 p-3 md:p-4 bg-slate-50 rounded-xl border">
          <div class="font-bold text-slate-800 text-sm md:text-base">{{ t.title }}</div>
          <div class="text-[10px] md:text-xs text-slate-500 mb-2">From: {{ getUserName(t.from_user) }} | 期限: <span :class="isExpired(t.deadline)?'text-red-500 font-bold':''">{{ formatDateTimeLocal(t.deadline) }}</span></div>
          <div class="text-xs md:text-sm text-slate-700 mb-2 bg-white p-2 rounded border">{{ t.content }}</div>
          <div v-if="parseImages(t.image_urls).length > 0" class="mb-2 flex flex-wrap gap-2">
            <img v-for="(img, idx) in parseImages(t.image_urls)" :key="idx" :src="img" class="h-16 w-16 object-cover rounded border cursor-pointer hover:opacity-80" @click="openUrl(img)">
          </div>
          
          <div v-if="t.status === 'assigned'" class="border-t pt-2">
            <div v-if="t.task_type === 'text'" class="flex gap-1">
              <input v-model="t.answerInput" type="text" placeholder="回答を入力" class="flex-1 border p-1 md:p-2 rounded text-xs outline-none">
              <button @click="submitTask(t.task_id, t.answerInput)" :disabled="!t.answerInput" class="bg-indigo-500 text-white px-3 py-1 text-xs font-bold rounded">提出</button>
            </div>
            <div v-else-if="t.task_type === 'file'" class="flex items-center gap-2">
              <label class="bg-white border text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:bg-indigo-50 transition">
                <i class="fa-solid fa-camera mr-1"></i>写真を選択
                <input type="file" multiple accept="image/*" class="hidden" @change="uploadAndSubmitTaskImages(t, $event)">
              </label>
              <span v-if="isSending" class="text-indigo-500 text-xs"><i class="fa-solid fa-spinner fa-spin"></i> 送信中...</span>
            </div>
            <div v-else-if="t.task_type === 'choice'" class="space-y-2 mt-2">
              <div v-for="(c,i) in parseChoices(t.choices)" :key="i" class="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer hover:border-indigo-300 transition" @click="t.answerInput = c">
                <div class="w-4 h-4 rounded-full border flex items-center justify-center" :class="t.answerInput === c ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'">
                  <div v-if="t.answerInput === c" class="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span class="text-sm text-slate-700">{{ c }}</span>
              </div>
              <button @click="submitTask(t.task_id, t.answerInput)" :disabled="!t.answerInput" class="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 text-xs font-bold rounded w-full transition shadow disabled:opacity-50">選択して提出</button>
            </div>
          </div>
          
          <div v-else class="border-t pt-2 mt-1 text-[10px] md:text-xs">
            <span class="font-bold text-emerald-600 bg-emerald-100 px-1 rounded mr-1">提出済</span>
            <span v-if="t.task_type !== 'file'" class="text-slate-700">{{ t.answer_content }}</span>
            <div v-if="t.task_type === 'file' && parseImages(t.answer_images).length > 0" class="mt-2 flex flex-wrap gap-2">
              <img v-for="(img, idx) in parseImages(t.answer_images)" :key="idx" :src="img" class="h-16 w-16 object-cover rounded border cursor-pointer" @click="openUrl(img)">
            </div>
            <button @click="cancelSubmitTask(t.task_id)" class="ml-2 text-slate-400 hover:text-red-500 underline text-[10px]">提出を取り消す</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 右側：送信した課題 -->
    <div class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border h-fit">
      <h3 class="font-bold text-slate-700 mb-3 text-sm md:text-base"><i class="fa-solid fa-paper-plane mr-2 text-indigo-400"></i>送信した課題</h3>
      <div v-if="sentTasks.length === 0" class="text-xs text-slate-500">送信済なし</div>
      <div v-for="t in sentTasks" :key="t.task_id" class="mb-3 p-3 bg-slate-50 rounded-xl border">
        <div class="flex justify-between items-start">
          <div>
            <div class="font-bold text-slate-800 text-sm">{{ t.title }}</div>
            <div class="text-[10px] text-slate-500">To: {{ getUserName(t.to_user) }} | 期限: {{ formatDateTimeLocal(t.deadline) }}</div>
          </div>
          <div v-if="t.status === 'assigned'" class="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-1 rounded">未提出</div>
          <div v-else class="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1 rounded">提出済</div>
        </div>
        <div v-if="t.status === 'submitted'" class="mt-2 pt-2 border-t text-xs">
          <div class="font-bold text-slate-400 mb-1">相手の回答:</div>
          <div v-if="t.task_type !== 'file'" class="text-slate-800">{{ t.answer_content }}</div>
          <div v-else class="flex flex-wrap gap-2">
            <img v-for="(img, idx) in parseImages(t.answer_images)" :key="idx" :src="img" class="h-12 w-12 object-cover rounded border cursor-pointer" @click="openUrl(img)">
          </div>
        </div>
        <div v-if="t.status === 'assigned'" class="mt-3 pt-3 border-t flex gap-2">
          <button @click="openEditTaskModal(t)" class="text-xs bg-white border hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg transition font-bold shadow-sm"><i class="fa-solid fa-pen mr-1"></i>修正</button>
          <button @click="deleteTask(t.task_id)" class="text-xs bg-red-50 hover:bg-red-100 text-red-500 px-3 py-1.5 rounded-lg transition font-bold shadow-sm"><i class="fa-solid fa-trash mr-1"></i>取消</button>
        </div>
      </div>
    </div>
  </div>
</div>
  `
};