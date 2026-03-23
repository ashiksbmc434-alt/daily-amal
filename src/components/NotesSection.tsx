import React, { useState } from 'react';
import { Save, Trash2 } from 'lucide-react';

interface NotesSectionProps {
  record: any;
  onUpdate: (updates: any) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ record, onUpdate }) => {
  const [inputText, setInputText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    
    setIsSaving(true);
    const updatedNotes = [...(record.notes || []), inputText.trim()];
    await onUpdate({ notes: updatedNotes });
    setInputText(''); // Clear the input field
    setIsSaving(false);
  };

  const deleteNote = async (index: number) => {
    const updatedNotes = record.notes.filter((_: any, i: number) => i !== index);
    await onUpdate({ notes: updatedNotes });
  };

  return (
    <div className="space-y-4 h-full flex flex-col pb-24">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-emerald-900">নোট</h2>
        <p className="text-emerald-600/70 text-sm">আপনার ব্যক্তিগত চিন্তা ও ইবাদতের নোট</p>
      </header>

      {/* Input Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-emerald-100/50 p-4 mb-4">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="নতুন নোট এখানে লিখুন..."
          className="w-full h-32 resize-none focus:outline-none text-slate-700 leading-relaxed placeholder:text-slate-300 mb-2"
        />
        
        <button
          onClick={handleSubmit}
          disabled={isSaving || !inputText.trim()}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সাবমিট'}
        </button>
      </div>

      {/* Today's Notes List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">আজকের নোটসমূহ</h3>
        {(!Array.isArray(record.notes) || record.notes.length === 0) ? (
          <div className="text-center py-8 text-slate-300 text-sm italic">
            এখনও কোনো নোট যোগ করা হয়নি
          </div>
        ) : (
          record.notes.map((note: string, index: number) => (
            <div key={index} className="bg-white p-4 rounded-2xl border border-emerald-50 shadow-sm flex justify-between items-start gap-3 group">
              <p className="text-sm text-slate-600 flex-1 leading-relaxed">{note}</p>
              <button 
                onClick={() => deleteNote(index)}
                className="text-slate-300 hover:text-red-400 transition-colors p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
