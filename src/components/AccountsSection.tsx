import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, ArrowUpCircle, ArrowDownCircle, Wallet, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';
import { bn } from 'date-fns/locale';
import { 
  db, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  handleFirestoreError, 
  OperationType,
  type User 
} from '../firebase';
import { type AccountCategory, type Transaction, BUILT_IN_CATEGORIES } from '../types/accounts';

interface AccountsSectionProps {
  user: User;
}

export const AccountsSection: React.FC<AccountsSectionProps> = ({ user }) => {
  const [subTab, setSubTab] = useState<'home' | 'income' | 'expense' | 'settings'>('home');
  const [categories, setCategories] = useState<AccountCategory[]>(BUILT_IN_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form states
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Settings states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');

  useEffect(() => {
    // Load custom categories
    const categoriesPath = `users/${user.uid}/categories`;
    const unsubscribeCats = onSnapshot(collection(db, categoriesPath), (snapshot) => {
      const customCats = snapshot.docs.map(doc => doc.data() as AccountCategory);
      setCategories([...BUILT_IN_CATEGORIES, ...customCats]);
    });

    // Load transactions for current month
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    const transactionsPath = `users/${user.uid}/transactions`;
    const q = query(
      collection(db, transactionsPath),
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'desc')
    );

    const unsubscribeTrans = onSnapshot(q, (snapshot) => {
      const trans = snapshot.docs.map(doc => doc.data() as Transaction);
      setTransactions(trans);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, transactionsPath);
    });

    return () => {
      unsubscribeCats();
      unsubscribeTrans();
    };
  }, [user.uid, currentMonth]);

  const handleAddTransaction = async (type: 'income' | 'expense') => {
    if (!amount || !categoryId) return;
    const id = crypto.randomUUID();
    const trans: Transaction = {
      id,
      amount: parseFloat(amount),
      categoryId,
      note,
      date,
      type,
      createdAt: new Date()
    };

    const path = `users/${user.uid}/transactions/${id}`;
    try {
      await setDoc(doc(db, path), trans);
      setAmount('');
      setCategoryId('');
      setNote('');
      setSubTab('home');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    const id = crypto.randomUUID();
    const cat: AccountCategory = {
      id,
      name: newCategoryName,
      type: newCategoryType,
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      isBuiltIn: false
    };

    const path = `users/${user.uid}/categories/${id}`;
    try {
      await setDoc(doc(db, path), cat);
      setNewCategoryName('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const path = `users/${user.uid}/transactions/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Header with Month Selector */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Wallet size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">আমার হিসাব</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">দৈনিক লেনদেন</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
          <button onClick={() => setCurrentMonth(subDays(currentMonth, 30))} className="p-1 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-indigo-600">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-slate-700 px-2 min-w-[80px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: bn })}
          </span>
          <button onClick={() => setCurrentMonth(addDays(currentMonth, 30))} className="p-1 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-indigo-600">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <ArrowDownCircle size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">মোট আয়</span>
          </div>
          <div className="text-xl font-black text-slate-800">৳{totalIncome.toLocaleString()}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <ArrowUpCircle size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">মোট খরচ</span>
          </div>
          <div className="text-xl font-black text-slate-800">৳{totalExpense.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">বর্তমান ব্যালেন্স</span>
          <div className="text-3xl font-black mt-1">৳{balance.toLocaleString()}</div>
        </div>
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -left-4 -top-4 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl" />
      </div>

      {/* Sub Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
        {(['home', 'income', 'expense', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
              subTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'home' ? 'হোম' : tab === 'income' ? 'আয়' : tab === 'expense' ? 'খরচ' : 'সেটিংস'}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {subTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            <h3 className="text-sm font-black text-slate-800 px-1">সাম্প্রতিক লেনদেন</h3>
            {transactions.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                <Wallet size={48} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="text-xs font-bold">কোনো লেনদেন পাওয়া যায়নি</p>
              </div>
            ) : (
              transactions.map((t) => {
                const cat = categories.find(c => c.id === t.categoryId);
                return (
                  <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${cat?.color}20`, color: cat?.color }}>
                        {cat?.icon || '📦'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{cat?.name || 'অজানা'}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {format(parseISO(t.date), 'd MMMM', { locale: bn })} • {t.note || 'কোনো নোট নেই'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'} ৳{t.amount.toLocaleString()}
                      </div>
                      <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {(subTab === 'income' || subTab === 'expense') && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">টাকার পরিমাণ</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="text-4xl font-black text-slate-800 bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ক্যাটাগরি সিলেক্ট করুন</label>
              <div className="grid grid-cols-4 gap-3">
                {categories.filter(c => c.type === subTab).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border ${
                      categoryId === cat.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'
                    }`}
                  >
                    <span className="text-xl">{cat.icon || '📦'}</span>
                    <span className="text-[8px] font-black text-center leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">তারিখ</label>
                <div className="relative">
                  <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">নোট (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="নোট লিখুন..."
                  className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={() => handleAddTransaction(subTab)}
              disabled={!amount || !categoryId}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              যোগ করুন
            </button>
          </motion.div>
        )}

        {subTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">নতুন ক্যাটাগরি</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="ক্যাটাগরির নাম"
                  className="flex-1 bg-slate-50 border-none rounded-xl py-3 px-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newCategoryType}
                  onChange={(e) => setNewCategoryType(e.target.value as 'income' | 'expense')}
                  className="bg-slate-50 border-none rounded-xl py-3 px-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="expense">খরচ</option>
                  <option value="income">আয়</option>
                </select>
                <button
                  onClick={handleAddCategory}
                  className="bg-indigo-600 text-white px-6 rounded-xl font-bold text-xs"
                >
                  যোগ
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">বর্তমান ক্যাটাগরি</h4>
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                      {cat.icon || '📦'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{cat.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {cat.type === 'income' ? 'আয়' : 'খরচ'} {cat.isBuiltIn && '• BUILT-IN'}
                      </div>
                    </div>
                  </div>
                  {!cat.isBuiltIn && (
                    <button onClick={async () => {
                      const path = `users/${user.uid}/categories/${cat.id}`;
                      try { await deleteDoc(doc(db, path)); } catch (err) { handleFirestoreError(err, OperationType.DELETE, path); }
                    }} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex flex-col gap-4 mt-4">
              <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest">সতর্কতা</h4>
              <p className="text-[10px] text-red-600 font-bold">
                নিচের বাটনে ক্লিক করলে শুধুমাত্র {format(currentMonth, 'MMMM yyyy', { locale: bn })} মাসের সব হিসাব মুছে যাবে।
              </p>
              <button
                onClick={async () => {
                  if (window.confirm('আপনি কি নিশ্চিত যে আপনি এই মাসের সব ডাটা মুছতে চান?')) {
                    const batch = transactions.map(t => deleteDoc(doc(db, `users/${user.uid}/transactions/${t.id}`)));
                    await Promise.all(batch);
                  }
                }}
                className="w-full bg-white border border-red-200 text-red-600 py-3 rounded-xl font-bold text-xs hover:bg-red-50 transition-all"
              >
                {format(currentMonth, 'MMMM', { locale: bn })} মাসের সব ডাটা মুছুন
              </button>
              <button
                onClick={async () => {
                  if (window.confirm('আপনি কি নিশ্চিত যে আপনি সব মাসের সব ডাটা মুছতে চান?')) {
                    const q = query(collection(db, `users/${user.uid}/transactions`));
                    const snapshot = await getDocs(q);
                    const batch = snapshot.docs.map(d => deleteDoc(d.ref));
                    await Promise.all(batch);
                  }
                }}
                className="w-full bg-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-100 active:scale-95 transition-all"
              >
                সব মাসের সব ডাটা মুছুন
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
