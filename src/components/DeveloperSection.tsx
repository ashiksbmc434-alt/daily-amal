import React, { useState, useEffect } from 'react';
import { Github, Mail, Globe, Heart, Edit2, Save, X, Camera } from 'lucide-react';
import { db, doc, getDoc, setDoc, onSnapshot, type User } from '../firebase';

interface DeveloperInfo {
  name: string;
  photoUrl: string;
  about: string;
  github: string;
  email: string;
  website: string;
}

const DEFAULT_INFO: DeveloperInfo = {
  name: 'Muhammad Ashik Madani',
  photoUrl: '',
  about: 'এই অ্যাপটি আপনার প্রতিদিনের ইবাদত এবং হিসাব ট্র্যাক করার জন্য তৈরি করা হয়েছে। আপনার ডাটা নিরাপদে ক্লাউডে সেভ থাকে যাতে আপনি যেকোনো ডিভাইস থেকে এটি অ্যাক্সেস করতে পারেন।',
  github: '#',
  email: 'ashik.sbmc434@gmail.com',
  website: '#'
};

interface DeveloperSectionProps {
  user: User;
}

export const DeveloperSection: React.FC<DeveloperSectionProps> = ({ user }) => {
  const [info, setInfo] = useState<DeveloperInfo>(DEFAULT_INFO);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<DeveloperInfo>(DEFAULT_INFO);
  const [loading, setLoading] = useState(true);

  const isDeveloper = user.email === 'ashik.sbmc434@gmail.com';

  useEffect(() => {
    const docRef = doc(db, 'app_settings', 'developer');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as DeveloperInfo;
        setInfo(data);
        setEditForm(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    try {
      const docRef = doc(db, 'app_settings', 'developer');
      await setDoc(docRef, editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving developer info:', error);
      alert('সেভ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        {isDeveloper && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            <Edit2 size={18} />
          </button>
        )}

        <div className="relative group">
          <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center text-white text-4xl font-black mb-6 shadow-xl shadow-emerald-100 overflow-hidden">
            {info.photoUrl ? (
              <img src={info.photoUrl} alt={info.name} className="w-full h-full object-cover" />
            ) : (
              info.name.charAt(0)
            )}
          </div>
          {isEditing && (
            <label className="absolute bottom-6 right-0 p-2 bg-white shadow-lg rounded-full cursor-pointer text-emerald-600 hover:text-emerald-700 transition-colors border border-emerald-100">
              <Camera size={16} />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          )}
        </div>

        {isEditing ? (
          <div className="w-full space-y-4">
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-center font-bold"
              placeholder="নাম"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700"
              >
                <Save size={18} /> সেভ
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditForm(info);
                }}
                className="px-4 bg-slate-100 text-slate-600 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200"
              >
                <X size={18} /> বাতিল
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-black text-slate-800">{info.name}</h2>
            <p className="text-emerald-600 font-bold">Full Stack Developer</p>
          </>
        )}
        
        <div className="mt-8 flex gap-4">
          <a href={info.github} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all border border-slate-100">
            <Github size={20} />
          </a>
          <a href={`mailto:${info.email}`} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all border border-slate-100">
            <Mail size={20} />
          </a>
          <a href={info.website} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all border border-slate-100">
            <Globe size={20} />
          </a>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm relative">
        <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest">অ্যাপ সম্পর্কে</h3>
        {isEditing ? (
          <textarea
            value={editForm.about}
            onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm min-h-[120px]"
            placeholder="অ্যাপ সম্পর্কে লিখুন..."
          />
        ) : (
          <p className="text-sm text-slate-600 leading-relaxed">
            {info.about}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold py-4">
        <span>Made with</span>
        <Heart size={14} className="text-red-500 fill-red-500" />
        <span>by {info.name}</span>
      </div>
    </div>
  );
};
