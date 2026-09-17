import React, { useState } from 'react';
import { Calendar, Users, Bell, Settings, Sparkles, LogOut } from 'lucide-react';
import ScheduleBoard from './ScheduleBoard';
import ClientCRM from './ClientCRM';
import NotificationsPanel from './NotificationsPanel';
import SettingsPanel from './SettingsPanel';

type AdminTab = 'schedule' | 'crm' | 'notifications' | 'settings';

export default function AdminPanel({ token, username, onLogout }: { token: string; username: string; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('schedule');

  const tabs = [
    { id: 'schedule' as const, label: 'Расписание', icon: Calendar },
    { id: 'crm' as const, label: 'Клиенты', icon: Users },
    { id: 'notifications' as const, label: 'Уведомления', icon: Bell },
    { id: 'settings' as const, label: 'Настройки', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#E11D48] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">CheckLis Admin</h1>
              <p className="text-xs text-gray-500">LIFE Fitness Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-[#E11D48]">М</span>
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{username}</span>
            <button onClick={onLogout} className="p-2 text-gray-500 hover:text-gray-900" title="Выйти"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-[60px] z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#E11D48] text-[#E11D48]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'schedule' && <ScheduleBoard />}
        {activeTab === 'crm' && <ClientCRM />}
        {activeTab === 'notifications' && <NotificationsPanel />}
        {activeTab === 'settings' && <SettingsPanel token={token} />}
      </main>
    </div>
  );
}
