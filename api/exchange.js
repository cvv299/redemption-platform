const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const { key } = req.body;
  if (!key) return res.json({ success: false, message: '请输入密钥' });
  const today = new Date().toISOString().split('T')[0];
  const { data: record, error } = await supabase.from('redemption_codes').select('*').eq('key', key).single();
  if (error || !record) return res.json({ success: false, message: '密钥不存在' });
  if (record.status === '已使用') return res.json({ success: false, message: '该密钥已使用' });
  if (record.last_date === today && record.today_count >= 5) return res.json({ success: false, message: '今日领取次数已用完（每天最多5次）' });
  const newCount = record.last_date === today ? record.today_count + 1 : 1;
  await supabase.from('redemption_codes').update({ today_count: newCount, last_date: today, status: '已使用' }).eq('key', key);
  return res.json({ success: true, code: record.code });
};
