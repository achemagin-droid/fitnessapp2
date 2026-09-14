import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Widget from './components/widget/Widget';
import AdminPanel from './components/admin/AdminPanel';
import { Sparkles, Shield, ExternalLink } from 'lucide-react';

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-rose-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-[#E11D48] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-rose-500/30">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">CheckLis Booking</h1>
          <p className="text-lg text-gray-300">Система онлайн-записи для LIFE Fitness Studio</p>
        </div>

        <div className="space-y-4">
          <Link
            to="/widget"
            className="block w-full bg-[#E11D48] text-white py-4 rounded-2xl font-semibold text-lg hover:bg-[#BE123C] transition-all shadow-xl shadow-rose-500/20 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="w-5 h-5" />
              <span>Виджет записи</span>
              <ExternalLink className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-sm text-rose-200 font-normal mt-1">Публичный виджет для клиентов</p>
          </Link>

          <Link
            to="/admin"
            className="block w-full bg-white/10 backdrop-blur-sm text-white py-4 rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all border border-white/20 hover:border-white/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center justify-center gap-3">
              <Shield className="w-5 h-5" />
              <span>Админ-панель</span>
              <ExternalLink className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-sm text-gray-300 font-normal mt-1">Управление расписанием и клиентами</p>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <p className="text-2xl font-bold text-white">6</p>
            <p className="text-xs text-gray-400">Типов занятий</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <p className="text-2xl font-bold text-white">3</p>
            <p className="text-xs text-gray-400">Тренера</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <p className="text-2xl font-bold text-white">24/7</p>
            <p className="text-xs text-gray-400">Онлайн-запись</p>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-500">
          MVP • React + Tailwind CSS • Данные хранятся в localStorage
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/widget" element={<Widget />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
