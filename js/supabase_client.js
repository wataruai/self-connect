// js/supabase_client.js

// ★ あなたのSupabase情報を入れてください
const SUPABASE_URL = 'https://pwnqfqfwprzwhufaxsxb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnFmcWZ3cHJ6d2h1ZmF4c3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NTMyMzUsImV4cCI6MjA5OTAyOTIzNX0.mSB8EoCRIoLjd79ErtIpqHE4ML7oyxF19CaI1qdykDs';

// CDNで読み込んだグローバルの supabase を使ってクライアントを初期化（変数名を sbClient に変更）
export const sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 便利なラッパー関数（GASの apiCall の代わりになるもの）
export async function apiCall(table, method, payload = null, filters = null) {
  try {
    let query;
    
    // RPC（バックエンド関数）呼び出しの場合
    if (table === 'rpc') {
      const { data, error } = await sbClient.rpc(method, payload);
      if (error) throw error;
      return { success: true, data: data };
    }
    
    // 通常のテーブル操作の場合
    query = sbClient.from(table)[method](payload);
    
    // eq（一致）や order（並び替え）などのフィルターを適用
    if (filters) {
      if (filters.eq) query = query.eq(filters.eq.column, filters.eq.value);
      if (filters.order) query = query.order(filters.order.column, { ascending: filters.order.ascending });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { success: true, data: data };
  } catch (err) {
    console.error(`Supabase Error (${table} - ${method}):`, err);
    return { success: false, message: err.message };
  }
}
