/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, Component } from 'react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LogOut, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_RECORD, type DailyRecord } from './db';
import { AmalSection } from './components/AmalSection';
import { NotesSection } from './components/NotesSection';
import { HistorySection } from './components/HistorySection';
import { AccountsSection } from './components/AccountsSection';
import { DeveloperSection } from './components/DeveloperSection';
import { BottomNav } from './components/BottomNav';
import { bn } from 'date-fns/locale';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  type User,
  doc,
  setDoc,
  onSnapshot,
  handleFirestoreError,
  OperationType
} from './firebase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('amal');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        // Create user profile if doesn't exist
        const userRef = doc(db, 'users', u.uid);
        setDoc(userRef, {
          displayName: u.displayName,
          email: u.email,
          photoURL: u.photoURL,
          createdAt: new Date()
        }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${u.uid}`));
      }
    });
    return () => unsubscribe();
  }, []);

  // Load record from Firestore
  useEffect(() => {
    if (!user || authLoading) return;

    setLoading(true);
    const recordPath = `users/${user.uid}/dailyRecords/${selectedDate}`;
    const recordRef = doc(db, recordPath);

    const unsubscribe = onSnapshot(recordRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as DailyRecord;
        // Normalize notes to array if it's a string (for backward compatibility)
        if (data && !Array.isArray(data.notes)) {
          data.notes = typeof (data as any).notes === 'string' && (data as any).notes 
            ? [(data as any).notes] 
            : [];
        }
        setRecord(data);
      } else {
        // If doesn't exist, set default
        setRecord(DEFAULT_RECORD(selectedDate));
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, recordPath);
    });

    return () => unsubscribe();
  }, [user, authLoading, selectedDate]);

  // Auto-save logic
  const handleUpdate = async (updates: Partial<DailyRecord>) => {
    if (!record || !user) return;
    const updatedRecord = { ...record, ...updates };
    setRecord(updatedRecord);
    
    const recordPath = `users/${user.uid}/dailyRecords/${selectedDate}`;
    try {
      await setDoc(doc(db, recordPath), updatedRecord, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, recordPath);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setRecord(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const changeDate = (days: number) => {
    const newDate = addDays(parseISO(selectedDate), days);
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-emerald-200">
          <CalendarIcon size={48} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-emerald-900 mb-2">আমল ট্র্যাকার</h1>
        <p className="text-emerald-600/70 mb-12 max-w-xs">আপনার প্রতিদিনের ইবাদত ট্র্যাক করুন এবং যেকোনো ডিভাইস থেকে অ্যাক্সেস করুন।</p>
        
        <button 
          onClick={handleLogin}
          className="flex items-center gap-3 bg-white text-slate-700 px-8 py-4 rounded-2xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all border border-slate-100"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          গুগল দিয়ে লগইন করুন
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50/30 flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Header / Date Selector */}
      <header className="bg-white px-6 py-4 border-b border-emerald-100 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-emerald-50 rounded-full transition-colors text-emerald-700"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <CalendarIcon size={16} className="text-emerald-500" />
              <span className="text-sm">{format(parseISO(selectedDate), 'd MMMM, yyyy', { locale: bn })}</span>
            </div>
            <div className="flex gap-2 items-center">
              {isToday && (
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">আজ</span>
              )}
              {user.email === 'ashik.sbmc434@gmail.com' && (
                <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Admin</span>
              )}
            </div>
          </div>

          <button 
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-emerald-50 rounded-full transition-colors text-emerald-700 disabled:opacity-20"
            disabled={isToday}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <button 
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          title="লগআউট"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'amal' && record && (
                <AmalSection record={record} onUpdate={handleUpdate} />
              )}
              {activeTab === 'notes' && record && (
                <NotesSection record={record} onUpdate={handleUpdate} />
              )}
              {activeTab === 'accounts' && (
                <AccountsSection user={user} />
              )}
              {activeTab === 'history' && (
                <HistorySection user={user} />
              )}
              {activeTab === 'developer' && (
                <DeveloperSection user={user} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Decorative background elements */}
      <div className="fixed -top-24 -right-24 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-24 -left-24 w-64 h-64 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
