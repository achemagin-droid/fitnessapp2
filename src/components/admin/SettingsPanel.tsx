import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { Trainer, ClassType } from '../../types';

export default function SettingsPanel() {
  const { trainers, classTypes, addTrainer, updateTrainer, removeTrainer, addClassType, updateClassType, removeClassType } = useStore();
  
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [editingClassType, setEditingClassType] = useState<ClassType | null>(null);
  const [showTrainerForm, setShowTrainerForm] = useState(false);
  const [showClassTypeForm, setShowClassTypeForm] = useState(false);
  
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
    if (confirm('Удалить тренера?')) {
      removeTrainer(id);
    }
  };

  const handleDeleteClassType = (id: string) => {
    if (confirm('Удалить тип занятия? Все связанные занятия также будут удалены.')) {
      removeClassType(id);
    }
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
            <div key={trainer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
              <div>
                <p className="font-medium text-gray-900">{trainer.name}</p>
                <p className="text-sm text-gray-500">{trainer.description}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditTrainer(trainer)}
                  className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDeleteTrainer(trainer.id)}
                  className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
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
            <div key={ct.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: ct.color_code }} />
                <div>
                  <p className="font-medium text-gray-900">{ct.name}</p>
                  <p className="text-sm text-gray-500">
                    {ct.duration_minutes} мин • макс. {ct.max_capacity} чел.
                  </p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditClassType(ct)}
                  className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDeleteClassType(ct.id)}
                  className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
