import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, Edit2, Trash2, X, Check, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { Trainer, ClassType } from '../../types';

export default function SettingsPanel() {
  const { trainers, classTypes, addTrainer, updateTrainer, removeTrainer, addClassType, updateClassType, removeClassType, notificationSettings, updateNotificationSettings } = useStore();
  
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [editingClassType, setEditingClassType] = useState<ClassType | null>(null);
  const [showTrainerForm, setShowTrainerForm] = useState(false);
  const [showClassTypeForm, setShowClassTypeForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{type: 'trainer' | 'classType', id: string} | null>(null);
  
  // Advanced settings
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [notificationSettingsSaved, setNotificationSettingsSaved] = useState(false);
  const [tempNotificationSettings, setTempNotificationSettings] = useState(notificationSettings);
  
  // Trainer form state
  const [trainerName, setTrainerName] = useState('');
  const [trainerDescription, setTrainerDescription] = useState('');
  
  // Class type form state
  const [ctName, setCtName] = useState('');
  const [ctDescription, setCtDescription] = useState('');
  const [ctDuration, setCtDuration] = useState(60);
  const [ctCapacity, setCtCapacity] = useState(10);
  const [ctColor, setCtColor] = useState('#E11D48');

  const resetTrainerForm = () => {
    setTrainerName('');
    setTrainerDescription('');
    setEditingTrainer(null);
    setShowTrainerForm(false);
  };

  const resetClassTypeForm = () => {
    setCtName('');
    setCtDescription('');
    setCtDuration(60);
    setCtCapacity(10);
    setCtColor('#E11D48');
    setEditingClassType(null);
    setShowClassTypeForm(false);
  };

  const handleSaveTrainer = () => {
    if (!trainerName.trim()) return;
    
    if (editingTrainer) {
      updateTrainer(editingTrainer.id, {
        name: trainerName,
        description: trainerDescription,
      });
    } else {
      addTrainer({
        id: `t${Date.now()}`,
        name: trainerName,
        description: trainerDescription,
        is_active: true,
      });
    }
    resetTrainerForm();
  };

  const handleSaveClassType = () => {
    if (!ctName.trim()) return;
    
    if (editingClassType) {
      updateClassType(editingClassType.id, {
        name: ctName,
        description: ctDescription,
        duration_minutes: ctDuration,
        max_capacity: ctCapacity,
        color_code: ctColor,
      });
    } else {
      addClassType({
        id: `ct${Date.now()}`,
        name: ctName,
        description: ctDescription,
        duration_minutes: ctDuration,
        max_capacity: ctCapacity,
        color_code: ctColor,
      });
    }
    resetClassTypeForm();
  };

  const handleEditTrainer = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setTrainerName(trainer.name);
    setTrainerDescription(trainer.description);
    setShowTrainerForm(true);
  };

  const handleEditClassType = (ct: ClassType) => {
    setEditingClassType(ct);
    setCtName(ct.name);
    setCtDescription(ct.description);
    setCtDuration(ct.duration_minutes);
    setCtCapacity(ct.max_capacity);
    setCtColor(ct.color_code);
    setShowClassTypeForm(true);
  };

  const handleDeleteTrainer = (id: string) => {
    setDeleteConfirm({ type: 'trainer', id });
  };

  const handleDeleteClassType = (id: string) => {
    setDeleteConfirm({ type: 'classType', id });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    
    if (deleteConfirm.type === 'trainer') {
      removeTrainer(deleteConfirm.id);
    } else {
      removeClassType(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleSaveNotificationSettings = () => {
    updateNotificationSettings(tempNotificationSettings);
    setNotificationSettingsSaved(true);
    setTimeout(() => setNotificationSettingsSaved(false), 3000);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Настройки</h2>

      {/* Trainers Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Тренеры</h3>
          <button
            onClick={() => { resetTrainerForm(); setShowTrainerForm(true); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#E11D48] text-white rounded-lg text-sm font-medium hover:bg-[#BE123C] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>

        {showTrainerForm && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 animate-fade-in">
            <h4 className="font-medium text-gray-800 mb-3">
              {editingTrainer ? 'Редактировать тренера' : 'Новый тренер'}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                <input
                  type="text"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  placeholder="Имя тренера"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Специализация</label>
                <input
                  type="text"
                  value={trainerDescription}
                  onChange={(e) => setTrainerDescription(e.target.value)}
                  placeholder="Йога, Пилатес, Растяжка"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveTrainer}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  {editingTrainer ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  onClick={resetTrainerForm}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {trainers.map((trainer) => (
            <div key={trainer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{trainer.name}</p>
                <p className="text-sm text-gray-500">{trainer.description}</p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleEditTrainer(trainer)}
                  className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  title="Редактировать"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTrainer(trainer.id)}
                  className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Class Types Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Типы занятий</h3>
          <button
            onClick={() => { resetClassTypeForm(); setShowClassTypeForm(true); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#E11D48] text-white rounded-lg text-sm font-medium hover:bg-[#BE123C] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>

        {showClassTypeForm && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 animate-fade-in">
            <h4 className="font-medium text-gray-800 mb-3">
              {editingClassType ? 'Редактировать тип занятия' : 'Новый тип занятия'}
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                <input
                  type="text"
                  value={ctName}
                  onChange={(e) => setCtName(e.target.value)}
                  placeholder="Йога"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <input
                  type="text"
                  value={ctDescription}
                  onChange={(e) => setCtDescription(e.target.value)}
                  placeholder="Хатха-йога для всех уровней"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Длительность (мин)</label>
                  <input
                    type="number"
                    value={ctDuration}
                    onChange={(e) => setCtDuration(Number(e.target.value))}
                    min={15}
                    max={180}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Макс. участников</label>
                  <input
                    type="number"
                    value={ctCapacity}
                    onChange={(e) => setCtCapacity(Number(e.target.value))}
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Цвет</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={ctColor}
                    onChange={(e) => setCtColor(e.target.value)}
                    className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={ctColor}
                    onChange={(e) => setCtColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveClassType}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  {editingClassType ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  onClick={resetClassTypeForm}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {classTypes.map((ct) => (
            <div key={ct.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: ct.color_code }} />
                <div>
                  <p className="font-medium text-gray-900">{ct.name}</p>
                  <p className="text-sm text-gray-500">
                    {ct.duration_minutes} мин • макс. {ct.max_capacity} чел.
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleEditClassType(ct)}
                  className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  title="Редактировать"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClassType(ct.id)}
                  className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Модальное окно подтверждения удаления */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Подтверждение удаления</h3>
            <p className="text-gray-600 mb-6">
              {deleteConfirm.type === 'trainer' 
                ? 'Вы уверены, что хотите удалить этого тренера?'
                : 'Вы уверены, что хотите удалить этот тип занятия? Все связанные занятия также будут удалены.'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelDelete}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Продвинутые настройки */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-lg font-semibold text-gray-900">Продвинутые настройки</h3>
          {showAdvancedSettings ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {showAdvancedSettings && (
          <div className="mt-4 space-y-6 animate-fade-in">
            {/* Telegram настройки */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">💬</span>
                Telegram уведомления
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Токен бота
                  </label>
                  <input
                    type="text"
                    value={tempNotificationSettings.telegram_bot_token}
                    onChange={(e) => setTempNotificationSettings({
                      ...tempNotificationSettings,
                      telegram_bot_token: e.target.value
                    })}
                    placeholder="1234567890:ABCdefGHI..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Получите токен у <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-[#E11D48] hover:underline">@BotFather</a>
                  </p>
                </div>
              </div>
            </div>

            {/* SMTP настройки */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">📧</span>
                Email уведомления (SMTP)
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP хост
                    </label>
                    <input
                      type="text"
                      value={tempNotificationSettings.smtp_host}
                      onChange={(e) => setTempNotificationSettings({
                        ...tempNotificationSettings,
                        smtp_host: e.target.value
                      })}
                      placeholder="smtp.gmail.com"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Порт
                    </label>
                    <input
                      type="number"
                      value={tempNotificationSettings.smtp_port}
                      onChange={(e) => setTempNotificationSettings({
                        ...tempNotificationSettings,
                        smtp_port: parseInt(e.target.value) || 587
                      })}
                      placeholder="587"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email пользователя
                  </label>
                  <input
                    type="email"
                    value={tempNotificationSettings.smtp_user}
                    onChange={(e) => setTempNotificationSettings({
                      ...tempNotificationSettings,
                      smtp_user: e.target.value
                    })}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль
                  </label>
                  <input
                    type="password"
                    value={tempNotificationSettings.smtp_password}
                    onChange={(e) => setTempNotificationSettings({
                      ...tempNotificationSettings,
                      smtp_password: e.target.value
                    })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    От имени
                  </label>
                  <input
                    type="text"
                    value={tempNotificationSettings.smtp_from}
                    onChange={(e) => setTempNotificationSettings({
                      ...tempNotificationSettings,
                      smtp_from: e.target.value
                    })}
                    placeholder="LIFE Studio <noreply@lifestudio.com>"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20"
                  />
                </div>
              </div>
            </div>

            {/* Кнопка сохранения */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSaveNotificationSettings}
                className="flex items-center gap-2 px-4 py-2 bg-[#E11D48] text-white rounded-lg text-sm font-medium hover:bg-[#BE123C] transition-colors"
              >
                <Save className="w-4 h-4" />
                Сохранить настройки
              </button>
              {notificationSettingsSaved && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Настройки сохранены
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
