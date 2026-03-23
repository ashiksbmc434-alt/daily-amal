import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { bn } from 'date-fns/locale';
import { AlertCircle, CheckCircle2, Calendar, Search, X } from 'lucide-react';
import { type DailyRecord } from '../db';
import { type Transaction } from '../types/accounts';
import { 
  db, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc, 
  handleFirestoreError, 
  OperationType,
  type User
} from '../firebase';

interface HistorySectionProps {
  user: User;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ user }) => {
  const [history, setHistory] = useState<DailyRecord[]>([]);
  const [accountHistory, setAccountHistory] = useState<Transaction[]>([]);
  const [subTab, setSubTab] = useState<'amal' | 'notes' | 'accounts'>('amal');
  const [searchDate, setSearchDate] = useState<string>('');
  const [searchedRecord, setSearchedRecord] = useState<DailyRecord | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      const recordsPath = `users/${user.uid}/dailyRecords`;
      const transPath = `users/${user.uid}/transactions`;
      try {
        const q = query(
          collection(db, recordsPath),
          orderBy('date', 'desc'),
          limit(7)
        );
        const querySnapshot = await getDocs(q);
        const records = querySnapshot.docs.map(doc => doc.data() as DailyRecord);
        setHistory(records);

        const q2 = query(
          collection(db, transPath),
          orderBy('date', 'desc'),
          limit(20)
        );
        const querySnapshot2 = await getDocs(q2);
        const trans = querySnapshot2.docs.map(doc => doc.data() as Transaction);
        setAccountHistory(trans);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, recordsPath);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [user.uid]);

  const handleSearch = async () => {
    if (!searchDate) return;
    setLoading(true);
    const recordPath = `users/${user.uid}/dailyRecords/${searchDate}`;
    try {
      const docRef = doc(db, recordPath);
      const docSnap = await getDoc(docRef);
      setSearchedRecord(docSnap.exists() ? docSnap.data() as DailyRecord : null);
      setIsSearching(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, recordPath);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchDate('');
    setSearchedRecord(null);
    setIsSearching(false);
  };

  const getMissedPrayers = (record: DailyRecord) => {
    const missed = [];
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const prayerLabels: Record<string, string> = {
      fajr: 'ফজর',
      dhuhr: 'যোহর',
      asr: 'আসর',
      maghrib: 'মাগরিব',
      isha: 'এশা'
    };
    for (const p of prayers) {
      if (!(record.prayers as any)[p]?.fard) {
        missed.push(prayerLabels[p]);
      }
    }
    return missed;
  };

  const getSunnahStats = (record: DailyRecord) => {
    const sunnahConfig: Record<string, string[]> = {
      fajr: ['sunnah_before'],
      dhuhr: ['sunnah_before', 'sunnah_after'],
      asr: ['sunnah_before'],
      maghrib: ['sunnah_after'],
      isha: ['sunnah_after']
    };
    
    const rakahMap: Record<string, number> = {
      'fajr_sunnah_before': 2,
      'dhuhr_sunnah_before': 4,
      'dhuhr_sunnah_after': 2,
      'asr_sunnah_before': 4,
      'maghrib_sunnah_after': 2,
      'isha_sunnah_after': 2
    };

    let totalRakah = 0;
    let completedRakah = 0;

    Object.entries(sunnahConfig).forEach(([prayer, types]) => {
      types.forEach(type => {
        const rakah = rakahMap[`${prayer}_${type}`];
        totalRakah += rakah;
        if ((record.prayers as any)[prayer]?.[type]) {
          completedRakah += rakah;
        }
      });
    });

    return { completedRakah, totalRakah };
  };

  const renderRecord = (record: DailyRecord) => {
    const missed = getMissedPrayers(record);
    const sunnah = getSunnahStats(record);
    return (
      <div key={record.date} className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100/50">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-slate-700">
            {format(parseISO(record.date), 'EEEE, d MMMM', { locale: bn })}
          </span>
          <div className="flex flex-col items-end gap-1">
            {missed.length === 0 ? (
              <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={10} /> ফরজ সম্পন্ন
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 text-[10px] font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                <AlertCircle size={10} /> {missed.length}টি ফরজ বাদ
              </span>
            )}
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50/50 px-2 py-0.5 rounded-full">
              সুন্নাত: {sunnah.completedRakah}/{sunnah.totalRakah}
            </span>
          </div>
        </div>

        {missed.length > 0 && (
          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 text-amber-700 text-[10px] font-bold uppercase tracking-wider mb-2">
              <AlertCircle size={14} /> বাদ পড়া নামাজসমূহ
            </div>
            <div className="flex flex-wrap gap-2">
              {missed.map((p) => (
                <span key={p} className="text-xs bg-white text-amber-800 px-3 py-1 rounded-lg border border-amber-200 font-medium shadow-sm">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="mb-4">
        <h2 className="text-2xl font-bold text-emerald-900">ইতিহাস</h2>
        <p className="text-emerald-600/70 text-sm">আপনার পূর্ববর্তী রেকর্ডগুলো দেখুন</p>
      </header>

      {/* Date Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100/50 space-y-3">
        <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
          <Calendar size={14} /> তারিখ অনুযায়ী খুঁজুন
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="flex-1 bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <button
            onClick={handleSearch}
            className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Search size={20} />
          </button>
          {isSearching && (
            <button
              onClick={clearSearch}
              className="bg-slate-100 text-slate-500 p-2 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex bg-emerald-100/50 p-1 rounded-xl mb-6">
        <button
          onClick={() => setSubTab('amal')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            subTab === 'amal' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-600/60'
          }`}
        >
          আমল
        </button>
        <button
          onClick={() => setSubTab('notes')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            subTab === 'notes' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-600/60'
          }`}
        >
          নোট
        </button>
        <button
          onClick={() => setSubTab('accounts')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            subTab === 'accounts' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-600/60'
          }`}
        >
          হিসাব
        </button>
      </div>

      <div className="space-y-4">
        {isSearching ? (
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">সার্চ রেজাল্ট</div>
            {searchedRecord ? (
              subTab === 'amal' ? (
                renderRecord(searchedRecord)
              ) : (
                searchedRecord.notes.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] px-2">
                      {format(parseISO(searchedRecord.date), 'd MMMM, yyyy', { locale: bn })}
                    </div>
                    {searchedRecord.notes.map((note, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-emerald-100/50 shadow-sm">
                        <p className="text-sm text-slate-600 leading-relaxed">{note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm italic">এই তারিখে কোনো নোট নেই</div>
                )
              )
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                এই তারিখে কোনো ডাটা পাওয়া যায়নি
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">গত ৭ দিনের রেকর্ড</div>
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                এখনও কোনো রেকর্ড পাওয়া যায়নি। আজই শুরু করুন!
              </div>
            ) : subTab === 'amal' ? (
              history.map((record) => renderRecord(record))
            ) : subTab === 'notes' ? (
              history.filter(r => Array.isArray(r.notes) && r.notes.length > 0).map((record) => (
                <div key={record.date} className="space-y-3">
                  <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] px-2">
                    {format(parseISO(record.date), 'd MMMM, yyyy', { locale: bn })}
                  </div>
                  {record.notes.map((note, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-emerald-100/50 shadow-sm">
                      <p className="text-sm text-slate-600 leading-relaxed">{note}</p>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="space-y-3">
                {accountHistory.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">কোনো লেনদেন পাওয়া যায়নি</div>
                ) : (
                  accountHistory.map((t) => (
                    <div key={t.id} className="bg-white p-4 rounded-2xl border border-emerald-100/50 shadow-sm flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{t.type === 'income' ? 'আয়' : 'খরচ'}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {format(parseISO(t.date), 'd MMMM, yyyy', { locale: bn })} • {t.note || 'কোনো নোট নেই'}
                        </div>
                      </div>
                      <div className={`font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'} ৳{t.amount.toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
