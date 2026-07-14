// components/script_aegis.js
import { apiCall } from '../js/supabase_client.js';

export default {
  async fetchMarketStatus() {
    // 一旦エラーでクラッシュしないようにtry-catchを強化し、安全に取得
    try {
      const res = await apiCall('system_settings', 'select', '*', { eq: { column: 'setting_key', value: 'market_status' } });
      if (res.success && res.data && res.data.length > 0) {
        this.marketStatus = res.data[0].setting_value;
      } else {
        this.marketStatus = 'auto'; // テーブルが無い場合はautoをデフォルトにする
      }
    } catch(e) {
      this.marketStatus = 'auto';
    }
  },
  
  async setMarketStatus(status) {
    if (!confirm(`市場のステータスを「${status}」に変更しますか？`)) return;
    this.isSendingAdmin = true;
    try {
      const res = await apiCall('rpc', 'set_market_status', { p_admin_id: this.currentUser.user_id, p_status: status });
      if (res.success) {
        this.marketStatus = status;
        window.showDebug(`[AEGIS] 市場ステータスを ${status} に変更しました`);
      } else {
        alert("権限エラーまたは通信エラー");
      }
    } finally {
      this.isSendingAdmin = false;
    }
  },
  
  openAegisStockModal(action) {
    this.aegisStockForm = { selectedUsers: [], selectedStocks: [], amount: 1, action: action, customPrice: null };
    if (this.adminSelectedUser) this.aegisStockForm.selectedUsers.push(this.adminSelectedUser.user_id);
    this.showAegisStockModal = true;
  },

  async executeAegisStockBatch() {
    if (this.aegisStockForm.selectedUsers.length === 0 || this.aegisStockForm.selectedStocks.length === 0 || this.aegisStockForm.amount <= 0) {
      alert("ユーザー、銘柄、数量を正しく選択・入力してください。");
      return;
    }
    
    if (!confirm(`選択した ${this.aegisStockForm.selectedUsers.length}名 に、${this.aegisStockForm.selectedStocks.length}銘柄 を各 ${this.aegisStockForm.amount}株 「${this.aegisStockForm.action === 'give' ? '無償付与' : '強制没収'}」します。よろしいですか？`)) return;
    
    this.isSendingAdmin = true;
    try {
      const res = await apiCall('rpc', 'aegis_force_stock_batch', {
        p_admin_id: this.currentUser.user_id,
        p_target_ids: this.aegisStockForm.selectedUsers,
        p_stock_codes: this.aegisStockForm.selectedStocks,
        p_amount: this.aegisStockForm.amount,
        p_action: this.aegisStockForm.action,
        p_custom_price: this.aegisStockForm.customPrice
      });
      
      if (res.success) {
        alert("Aegis: 一括処理が完了しました。");
        this.showAegisStockModal = false;
      } else {
        alert("エラー: " + res.message);
      }
    } catch(e) {
      alert("通信エラーが発生しました。");
    } finally {
      this.isSendingAdmin = false;
    }
  },

  async sendAegisDiscordAlert() {
    if (!this.aegisDiscordMessage) return;
    this.isSendingAdmin = true;
    try {
      const payload = { message: this.aegisDiscordMessage, roleId: this.aegisDiscordRoleId, mentionEveryone: this.aegisDiscordMentionEveryone };
      const res = await apiCall('rpc', 'send_aegis_discord_alert', { p_admin_id: this.currentUser.user_id, p_payload: payload });
      if (res.success) {
        this.aegisDiscordMessage = '';
        window.showDebug("[AEGIS] アラートを送信しました");
      }
    } finally {
      this.isSendingAdmin = false;
    }
  }
};
