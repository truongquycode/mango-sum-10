// components/HistoryScreen.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from './UI/Button';
import { MatchRecord, ItemType } from '../types';
import { ITEM_CONFIG, GAME_DURATION_SECONDS } from '../constants';

interface HistoryScreenProps {
  onBack: () => void;
}

// Cấu hình danh sách lựa chọn cho Dropdown
const FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả', icon: '🏷️', color: 'text-gray-600' },
  { value: 'WIN', label: 'Thắng', icon: '😝', color: 'text-green-600' },
  { value: 'LOSE', label: 'Thua', icon: '😡', color: 'text-red-600' },
  { value: 'DRAW', label: 'Hòa', icon: '😑', color: 'text-yellow-600' },
  { value: 'SOLO', label: 'Chơi đơn', icon: '👤', color: 'text-cyan-600' },
];

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const [history, setHistory] = useState<MatchRecord[]>([]);
  
  // State bộ lọc
  const [filterDate, setFilterDate] = useState<string>(''); 
  const [filterResult, setFilterResult] = useState<string>('ALL');

  // State hiển thị Popup (Lịch & Dropdown)
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // State hỗ trợ lịch
  const [viewDate, setViewDate] = useState(new Date()); 
  
  // Ref để phát hiện click ra ngoài
  const calendarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('mango-match-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.sort((a: MatchRecord, b: MatchRecord) => b.timestamp - a.timestamp));
      } catch (e) {
        console.error("Lỗi đọc lịch sử", e);
      }
    }

    // Logic: Click ra ngoài thì đóng các popup
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- LOGIC LỊCH ---
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const handleSelectDate = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const year = selected.getFullYear();
    const month = (selected.getMonth() + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    setFilterDate(`${year}-${month}-${d}`);
    setShowCalendar(false);
  };
  // ------------------

  const getMatchStatus = (record: MatchRecord) => {
    if (record.mode === 'SOLO') return 'SOLO';
    if (record.opponentScore === undefined) return 'ERROR';
    if (record.myScore > record.opponentScore) return 'WIN';
    if (record.myScore < record.opponentScore) return 'LOSE';
    return 'DRAW';
  };

  const getResultDisplay = (status: string) => {
    switch (status) {
        case 'SOLO': return { text: 'CHƠI ĐƠN', color: 'text-gray-500', bg: 'bg-gray-100' };
        case 'WIN': return { text: 'THẮNG', color: 'text-green-600', bg: 'bg-green-100' };
        case 'LOSE': return { text: 'THUA', color: 'text-red-600', bg: 'bg-red-100' };
        case 'DRAW': return { text: 'HÒA', color: 'text-yellow-600', bg: 'bg-yellow-100' };
        default: return { text: '???', color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter(match => {
      if (filterDate) {
        const matchDate = new Date(match.timestamp);
        const y = matchDate.getFullYear();
        const m = (matchDate.getMonth() + 1).toString().padStart(2, '0');
        const d = matchDate.getDate().toString().padStart(2, '0');
        if (`${y}-${m}-${d}` !== filterDate) return false;
      }
      if (filterResult !== 'ALL') {
        const status = getMatchStatus(match);
        if (filterResult === 'WIN' && status !== 'WIN') return false;
        if (filterResult === 'LOSE' && status !== 'LOSE') return false;
        if (filterResult === 'DRAW' && status !== 'DRAW') return false;
        if (filterResult === 'SOLO' && status !== 'SOLO') return false;
      }
      return true;
    });
  }, [history, filterDate, filterResult]);

  const stats = useMemo(() => {
    let totalMatches = 0;
    let totalSeconds = 0;
    let wins = 0;
    let losses = 0;

    history.forEach(match => {
      if (match.mode === 'MULTIPLAYER') {
        totalMatches++;
        totalSeconds += match.duration || GAME_DURATION_SECONDS;
        if (match.opponentScore !== undefined) {
           if (match.myScore > match.opponentScore) wins++;
           else if (match.myScore < match.opponentScore) losses++;
        }
      }
    });

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return { totalMatches, hours, minutes, wins, losses };
  }, [history]);

  const formatDate = (ts: number) => {
    const date = new Date(ts);
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${min} ${d}/${m}/${y}`;
  };

  const renderItemBadges = (items: Record<string, number> | undefined, alignRight: boolean = false) => {
    if (!items || Object.keys(items).length === 0) {
      return <span className={`text-[10px] text-gray-300 italic ${alignRight ? 'text-right' : 'text-left'}`}>Không dùng</span>;
    }
    return (
      <div className={`flex flex-wrap gap-1 ${alignRight ? 'justify-end' : 'justify-start'}`}>
        {Object.entries(items).map(([type, count]) => (
          <div key={type} className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200" title={ITEM_CONFIG[type as ItemType]?.name}>
            <span className="text-xs">{ITEM_CONFIG[type as ItemType]?.icon}</span>
            {count > 1 && <span className="text-[9px] font-bold text-gray-500">x{count}</span>}
          </div>
        ))}
      </div>
    );
  };

  // Lấy thông tin option hiện tại đang chọn để hiển thị
  const currentOption = FILTER_OPTIONS.find(opt => opt.value === filterResult) || FILTER_OPTIONS[0];

  return (
    <div className="flex flex-col items-center h-full w-full p-4 bg-cyan-50 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-300 rounded-full opacity-50 blur-xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-300 rounded-full opacity-50 blur-xl" />

      <div className="z-10 w-full max-w-lg h-full flex flex-col">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border-4 border-cyan-200 flex flex-col h-full overflow-hidden">
          
          {/* Header */}
          <div className="p-4 border-b-2 border-gray-100 flex items-center justify-between bg-white shrink-0">
            <h2 className="text-2xl font-black text-cyan-600 uppercase tracking-wide">Lịch Sử Đấu 📜</h2>
            <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-500 font-bold flex items-center justify-center transition-all active:scale-90">✕</button>
          </div>

          {/* Stats Dashboard */}
          <div className="bg-gradient-to-r from-cyan-400 to-blue-400 p-4 text-white shrink-0 shadow-lg relative overflow-hidden">
             <div className="absolute -right-4 -top-4 w-20 h-20 bg-white opacity-10 rounded-full blur-xl"></div>
             <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-white opacity-10 rounded-full blur-xl"></div>
             <div className="flex justify-between items-center text-center relative z-10">
                <div className="flex-1 px-2 border-r border-white/20">
                   <div className="text-2xl font-black drop-shadow-md">{stats.totalMatches}</div>
                   <div className="text-[10px] uppercase opacity-90 font-bold">Trận đấu</div>
                </div>
                <div className="flex-1 px-2 border-r border-white/20">
                   <div className="text-2xl font-black drop-shadow-md">{stats.hours > 0 ? `${stats.hours}h` : ''}{stats.minutes}p</div>
                   <div className="text-[10px] uppercase opacity-90 font-bold">Tổng giờ chơi</div>
                </div>
                <div className="flex-1 px-2">
                   <div className="text-2xl font-black text-green-100 drop-shadow-md">
                     {stats.wins}<span className="text-white/60 text-sm mx-1">/</span><span className="text-red-100">{stats.losses}</span>
                   </div>
                   <div className="text-[10px] uppercase opacity-90 font-bold">Thắng/Thua</div>
                </div>
             </div>
          </div>

          {/* --- FILTER BAR --- */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-2 items-center justify-center relative z-30">
             
             {/* 1. NÚT MỞ LỊCH (CUSTOM) */}
             <div className="relative group min-w-[160px]" ref={calendarRef}>
                <button 
                   onClick={() => setShowCalendar(!showCalendar)}
                   className={`w-full pl-10 pr-4 py-2 rounded-full border-2 bg-white shadow-sm flex items-center h-[42px] transition-all relative z-10 ${showCalendar ? 'border-cyan-400 ring-2 ring-cyan-100' : 'border-cyan-100 hover:border-cyan-300'}`}
                >
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-xl">📅</span> 
                   </div>
                   <span className="text-sm font-bold text-gray-600 uppercase truncate">
                      {filterDate 
                        ? filterDate.split('-').reverse().join('/') 
                        : <span className="text-gray-400 font-normal normal-case">Chọn ngày...</span>
                      }
                   </span>
                </button>

                {/* --- POPUP LỊCH --- */}
                {showCalendar && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-cyan-100 p-3 w-72 z-50 animate-fade-in">
                    <div className="flex justify-between items-center mb-3">
                      <button onClick={handlePrevMonth} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center font-bold text-gray-500">←</button>
                      <span className="font-bold text-cyan-600 uppercase text-sm">
                        Tháng {viewDate.getMonth() + 1} / {viewDate.getFullYear()}
                      </span>
                      <button onClick={handleNextMonth} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center font-bold text-gray-500">→</button>
                    </div>
                    <div className="grid grid-cols-7 mb-2 text-center">
                      {['CN','T2','T3','T4','T5','T6','T7'].map(d => (
                        <span key={d} className="text-[10px] font-bold text-gray-400">{d}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDayOfMonth(viewDate.getMonth(), viewDate.getFullYear()) }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      {Array.from({ length: daysInMonth(viewDate.getMonth(), viewDate.getFullYear()) }).map((_, i) => {
                        const day = i + 1;
                        const currentY = viewDate.getFullYear();
                        const currentM = (viewDate.getMonth() + 1).toString().padStart(2,'0');
                        const currentD = day.toString().padStart(2,'0');
                        const dateStr = `${currentY}-${currentM}-${currentD}`;
                        const isSelected = dateStr === filterDate;
                        return (
                          <button
                            key={day}
                            onClick={() => handleSelectDate(day)}
                            className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition-all
                              ${isSelected ? 'bg-cyan-500 text-white shadow-md scale-110' : 'hover:bg-gray-100 text-gray-600'}
                            `}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
             </div>

             {/* 2. CHỌN KẾT QUẢ (CUSTOM DROPDOWN - Sửa lại chỗ này) */}
             <div className="relative flex-1 min-w-[140px]" ref={dropdownRef}>
               <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`w-full pl-10 pr-8 py-2 rounded-full border-2 bg-white shadow-sm flex items-center h-[42px] transition-all relative z-10 text-left ${showDropdown ? 'border-cyan-400 ring-2 ring-cyan-100' : 'border-cyan-100 hover:border-cyan-300'}`}
               >
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-xl">{currentOption.icon}</span>
                 </div>
                 <span className={`text-sm font-bold truncate ${currentOption.value === 'ALL' ? 'text-gray-600' : currentOption.color}`}>
                    {currentOption.label}
                 </span>
                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-cyan-500">
                    <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                 </div>
               </button>

               {/* --- POPUP MENU KẾT QUẢ --- */}
               {showDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-cyan-100 p-2 w-48 z-50 animate-fade-in flex flex-col gap-1">
                     {FILTER_OPTIONS.map((opt) => (
                        <button
                           key={opt.value}
                           onClick={() => { setFilterResult(opt.value); setShowDropdown(false); }}
                           className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold transition-colors w-full text-left
                              ${filterResult === opt.value ? 'bg-cyan-50 text-cyan-700' : 'hover:bg-gray-50 text-gray-600'}
                           `}
                        >
                           <span className="text-xl w-6 text-center">{opt.icon}</span>
                           <span className={opt.color}>{opt.label}</span>
                           {filterResult === opt.value && <span className="ml-auto text-cyan-500">✓</span>}
                        </button>
                     ))}
                  </div>
               )}
             </div>

             {/* 3. Nút Xóa Lọc */}
             {(filterDate || filterResult !== 'ALL') && (
                <button 
                  onClick={() => { setFilterDate(''); setFilterResult('ALL'); }}
                  className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors shadow-sm active:scale-90"
                  title="Xóa bộ lọc"
                >
                  ✕
                </button>
             )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50/50">
            {filteredHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-fade-in">
                <div className="text-6xl mb-4 opacity-50 grayscale">🌵</div>
                <p className="font-bold text-gray-400">Không tìm thấy trận nào!</p>
                <button onClick={() => { setFilterDate(''); setFilterResult('ALL'); }} className="mt-2 text-cyan-500 text-sm underline hover:text-cyan-600">
                   Xóa bộ lọc để xem lại
                </button>
              </div>
            ) : (
              filteredHistory.map((match) => {
                const status = getMatchStatus(match);
                const result = getResultDisplay(status);
                const opponentItems = (match as any).opponentItemsUsed; 
                const hasAnyItems = (match.itemsUsed && Object.keys(match.itemsUsed).length > 0) || 
                                    (opponentItems && Object.keys(opponentItems).length > 0);

                return (
                  <div key={match.id} className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 hover:border-cyan-300 hover:shadow-md transition-all cursor-default group">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] text-gray-400 font-mono font-bold bg-gray-100 px-2 py-1 rounded-full">{formatDate(match.timestamp)}</span>
                         <span className="text-[10px] text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full border border-cyan-100 flex items-center gap-1 font-bold">
                           <span>⏱</span>
                           <span>{match.duration || GAME_DURATION_SECONDS}s</span>
                         </span>
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full shadow-sm ${result.bg} ${result.color}`}>
                        {result.text}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-3 mb-3 border border-gray-100">
                      <div className="flex flex-col items-start w-1/3">
                        <span className="text-[10px] font-bold text-gray-400 truncate w-full mb-1">BẠN</span>
                        <span className={`text-2xl font-black ${match.myScore > (match.opponentScore || 0) ? 'text-cyan-600' : 'text-gray-700'}`}>{match.myScore}</span>
                      </div>
                      <div className="text-gray-300 font-black text-xl italic opacity-50">VS</div>
                      <div className="flex flex-col items-end w-1/3">
                        <span className="text-[10px] font-bold text-gray-400 truncate w-full text-right mb-1">{match.opponentName || 'MÁY'}</span>
                        <span className={`text-2xl font-black ${match.opponentScore !== undefined && match.opponentScore > match.myScore ? 'text-orange-500' : 'text-gray-700'}`}>{match.opponentScore ?? '-'}</span>
                      </div>
                    </div>

                    {hasAnyItems && (
                      <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between gap-4">
                        <div className="flex-1 flex flex-col items-start">
                           <span className="text-[8px] uppercase font-bold text-cyan-500 mb-1 flex items-center gap-1">
                             <span>🎒</span> Đồ của bạn
                           </span>
                           {renderItemBadges(match.itemsUsed, false)}
                        </div>
                        <div className="w-[1px] bg-gray-200"></div>
                        <div className="flex-1 flex flex-col items-end">
                           <span className="text-[8px] uppercase font-bold text-orange-400 mb-1 flex items-center gap-1">
                             Đồ đối thủ <span>🎒</span>
                           </span>
                           {renderItemBadges(opponentItems, true)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-4 bg-white border-t border-gray-100 shrink-0">
             <Button onClick={onBack} className="w-full py-3 rounded-2xl shadow-lg shadow-cyan-200/50" variant="secondary">Quay Lại Menu</Button>
          </div>
        </div>
      </div>
    </div>
  );
};