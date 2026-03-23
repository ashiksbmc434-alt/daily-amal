import React from 'react';
import { Checkbox } from './Checkbox';

interface PrayerRowProps {
  label: string;
  fard: boolean;
  sunnahBefore?: { checked: boolean; rakah: number };
  sunnahAfter?: { checked: boolean; rakah: number };
  onFardChange: (val: boolean) => void;
  onSunnahBeforeChange?: (val: boolean) => void;
  onSunnahAfterChange?: (val: boolean) => void;
}

const PrayerRow: React.FC<PrayerRowProps> = ({ 
  label, fard, sunnahBefore, sunnahAfter, onFardChange, onSunnahBeforeChange, onSunnahAfterChange 
}) => (
  <div className="grid grid-cols-[1fr_48px_48px_48px] items-center p-4 bg-white rounded-2xl shadow-sm border border-emerald-100/50 gap-2">
    <span className="font-bold text-emerald-900 text-sm">{label}</span>
    
    {/* Fard Column */}
    <div className="flex flex-col items-center gap-1">
      <span className="text-[8px] uppercase font-black text-slate-400">ফরজ</span>
      <Checkbox checked={fard} onChange={onFardChange} />
    </div>

    {/* Sunnah Before Column */}
    <div className="flex flex-col items-center gap-1">
      <span className="text-[8px] uppercase font-black text-emerald-600/50">আগে</span>
      {sunnahBefore ? (
        <div className="relative group">
          <Checkbox checked={sunnahBefore.checked} onChange={onSunnahBeforeChange!} />
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] font-bold text-emerald-700/40 whitespace-nowrap">
            {sunnahBefore.rakah} রা:
          </span>
        </div>
      ) : (
        <div className="w-6 h-6" />
      )}
    </div>

    {/* Sunnah After Column */}
    <div className="flex flex-col items-center gap-1">
      <span className="text-[8px] uppercase font-black text-emerald-600/50">পরে</span>
      {sunnahAfter ? (
        <div className="relative group">
          <Checkbox checked={sunnahAfter.checked} onChange={onSunnahAfterChange!} />
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[7px] font-bold text-emerald-700/40 whitespace-nowrap">
            {sunnahAfter.rakah} রা:
          </span>
        </div>
      ) : (
        <div className="w-6 h-6" />
      )}
    </div>
  </div>
);

interface AmalSectionProps {
  record: any;
  onUpdate: (updates: any) => void;
}

export const AmalSection: React.FC<AmalSectionProps> = ({ record, onUpdate }) => {
  const handlePrayerUpdate = (prayer: string, type: string, val: boolean) => {
    const newPrayers = { ...record.prayers };
    if (type) {
      newPrayers[prayer] = { ...newPrayers[prayer], [type]: val };
    } else {
      newPrayers[prayer] = val;
    }
    onUpdate({ prayers: newPrayers });
  };

  const calculateFardPercentage = () => {
    if (!record?.prayers) return 0;
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const completed = prayers.filter(p => record.prayers[p]?.fard).length;
    return Math.round((completed / 5) * 100);
  };

  const calculateSunnahStats = () => {
    if (!record?.prayers) return { percentage: 0, completedRakah: 0, totalRakah: 14 };
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
        if (record.prayers[prayer]?.[type]) {
          completedRakah += rakah;
        }
      });
    });

    return {
      percentage: Math.round((completedRakah / totalRakah) * 100),
      completedRakah,
      totalRakah
    };
  };

  const fardPercentage = calculateFardPercentage();
  const sunnahStats = calculateSunnahStats();

  const prayerLabels: Record<string, string> = {
    fajr: 'ফজর',
    dhuhr: 'যোহর',
    asr: 'আসর',
    maghrib: 'মাগরিব',
    isha: 'এশা'
  };

  const getFard = (p: string) => !!record.prayers[p]?.fard;
  const getSunnah = (p: string, type: string) => !!record.prayers[p]?.[type];

  return (
    <div className="space-y-4 pb-24">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-emerald-900">দৈনিক আমল</h2>
        <p className="text-emerald-600/70 text-sm">আপনার প্রতিদিনের ইবাদত ট্র্যাক করুন</p>
      </header>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* Fard Progress */}
        <div className="bg-emerald-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-200">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">ফরজ নামাজের অগ্রগতি</span>
            <span className="text-2xl font-black">{fardPercentage}%</span>
          </div>
          <div className="w-full bg-emerald-400/30 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-500 ease-out" 
              style={{ width: `${fardPercentage}%` }}
            />
          </div>
        </div>

        {/* Sunnah Progress */}
        <div className="bg-white rounded-3xl p-5 text-emerald-900 shadow-sm border border-emerald-100">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600/70">সুন্নাত নামাজের অগ্রগতি</span>
              <div className="text-[10px] font-bold text-emerald-500/60 mt-0.5">
                মোট {sunnahStats.totalRakah} রাকাতের মধ্যে {sunnahStats.completedRakah} রাকাত সম্পন্ন
              </div>
            </div>
            <span className="text-2xl font-black text-emerald-700">{sunnahStats.percentage}%</span>
          </div>
          <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500 ease-out" 
              style={{ width: `${sunnahStats.percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <PrayerRow
          label={prayerLabels.fajr}
          fard={getFard('fajr')}
          sunnahBefore={{ checked: getSunnah('fajr', 'sunnah_before'), rakah: 2 }}
          onFardChange={(v) => handlePrayerUpdate('fajr', 'fard', v)}
          onSunnahBeforeChange={(v) => handlePrayerUpdate('fajr', 'sunnah_before', v)}
        />

        <PrayerRow
          label={prayerLabels.dhuhr}
          fard={getFard('dhuhr')}
          sunnahBefore={{ checked: getSunnah('dhuhr', 'sunnah_before'), rakah: 4 }}
          sunnahAfter={{ checked: getSunnah('dhuhr', 'sunnah_after'), rakah: 2 }}
          onFardChange={(v) => handlePrayerUpdate('dhuhr', 'fard', v)}
          onSunnahBeforeChange={(v) => handlePrayerUpdate('dhuhr', 'sunnah_before', v)}
          onSunnahAfterChange={(v) => handlePrayerUpdate('dhuhr', 'sunnah_after', v)}
        />

        <PrayerRow
          label={prayerLabels.asr}
          fard={getFard('asr')}
          sunnahBefore={{ checked: getSunnah('asr', 'sunnah_before'), rakah: 4 }}
          onFardChange={(v) => handlePrayerUpdate('asr', 'fard', v)}
          onSunnahBeforeChange={(v) => handlePrayerUpdate('asr', 'sunnah_before', v)}
        />

        <PrayerRow
          label={prayerLabels.maghrib}
          fard={getFard('maghrib')}
          sunnahAfter={{ checked: getSunnah('maghrib', 'sunnah_after'), rakah: 2 }}
          onFardChange={(v) => handlePrayerUpdate('maghrib', 'fard', v)}
          onSunnahAfterChange={(v) => handlePrayerUpdate('maghrib', 'sunnah_after', v)}
        />

        <PrayerRow
          label={prayerLabels.isha}
          fard={getFard('isha')}
          sunnahAfter={{ checked: getSunnah('isha', 'sunnah_after'), rakah: 2 }}
          onFardChange={(v) => handlePrayerUpdate('isha', 'fard', v)}
          onSunnahAfterChange={(v) => handlePrayerUpdate('isha', 'sunnah_after', v)}
        />

        <div className="grid grid-cols-[1fr_48px_48px_48px] items-center p-4 bg-white rounded-2xl shadow-sm border border-emerald-100/50 gap-2">
          <span className="font-bold text-emerald-900 text-sm">বিতর (ওয়াজিব)</span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] uppercase font-black text-slate-400">ওয়াজিব</span>
            <Checkbox 
              checked={!!record.prayers.witr} 
              onChange={(v) => handlePrayerUpdate('witr', '', v)} 
            />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_48px_48px_48px] items-center p-4 bg-white rounded-2xl shadow-sm border border-emerald-100/50 gap-2">
          <span className="font-bold text-emerald-900 text-sm">নফল</span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] uppercase font-black text-slate-400">নফল</span>
            <Checkbox 
              checked={!!record.prayers.nafl} 
              onChange={(v) => handlePrayerUpdate('nafl', '', v)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
