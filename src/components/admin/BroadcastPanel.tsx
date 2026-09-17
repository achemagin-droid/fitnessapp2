import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { sendBroadcast } from '../../api';

export default function BroadcastPanel({ token }: { token?: string }) {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState('');
  const send = async () => {
    if (!message.trim()) return;
    try { await sendBroadcast(token, message.trim()); setResult('Рассылка поставлена в очередь. Клиенты без Telegram/email пропущены.'); setMessage(''); } catch (error) { setResult(error instanceof Error ? error.message : 'Ошибка рассылки'); }
  };
  return <div className="animate-fade-in max-w-2xl"><h2 className="text-xl font-bold text-gray-900">Рассылка</h2><p className="text-sm text-gray-500 mt-1 mb-6">Получатели: клиенты с записью или активным абонементом.</p><div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"><label className="block text-sm font-medium text-gray-700 mb-2">Сообщение</label><textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} maxLength={2000} placeholder="Текст рассылки" className="w-full border border-gray-200 rounded-xl p-3 resize-y focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"/><div className="flex items-center justify-between mt-3"><span className="text-xs text-gray-400">{message.length}/2000</span><button onClick={send} disabled={!message.trim()} className="flex items-center gap-2 px-4 py-2 bg-[#E11D48] text-white rounded-xl disabled:opacity-40"><Send className="w-4 h-4"/>Отправить</button></div>{result && <p className="text-sm text-green-700 mt-4">{result}</p>}</div></div>;
}
