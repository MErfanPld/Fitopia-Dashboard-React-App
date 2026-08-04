import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react';
import {
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEK_DAYS_SHORT,
  toPersianDigits,
  gregorianToJalali,
  jalaliToGregorianStr,
  formatJalaliDate,
  getJalaliMonthDays,
  getJalaliFirstDayOfWeek,
} from '../../utils/jalaliUtils';

interface JalaliDatePickerProps {
  label?: string;
  required?: boolean;
  value: string; // Gregorian "YYYY-MM-DD"
  error?: string;
  onChange: (gregorianDateStr: string) => void;
}

export const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({
  label = 'تاریخ عضویت (شمسی)',
  required = false,
  value,
  error,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine current selected Jalali year, month, day from Gregorian value
  const initialJalali = gregorianToJalali(value);
  const [viewYear, setViewYear] = useState<number>(initialJalali.jy);
  const [viewMonth, setViewMonth] = useState<number>(initialJalali.jm);

  // Sync view when value prop changes
  useEffect(() => {
    const j = gregorianToJalali(value);
    setViewYear(j.jy);
    setViewMonth(j.jm);
  }, [value]);

  // Close calendar on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedJalali = gregorianToJalali(value);
  const todayJalali = gregorianToJalali();

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const gStr = jalaliToGregorianStr(viewYear, viewMonth, day);
    onChange(gStr);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const gStr = jalaliToGregorianStr(todayJalali.jy, todayJalali.jm, todayJalali.jd);
    setViewYear(todayJalali.jy);
    setViewMonth(todayJalali.jm);
    onChange(gStr);
    setIsOpen(false);
  };

  // Generate days grid
  const daysInMonth = getJalaliMonthDays(viewYear, viewMonth);
  const firstDayOfWeekIndex = getJalaliFirstDayOfWeek(viewYear, viewMonth);

  // Year options list (e.g., 1370 to 1410)
  const yearsList = Array.from({ length: 41 }, (_, i) => 1370 + i);

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-300">
          {label} {required && <span className="text-[#FF7A1A]">*</span>}
        </label>
      )}

      {/* Date Trigger Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[#181818] border rounded-xl px-3.5 py-2.5 text-xs text-white flex items-center justify-between cursor-pointer transition-all hover:bg-[#1f1f1f] ${
          error
            ? 'border-red-500/80 focus:border-red-500'
            : isOpen
            ? 'border-[#FF7A1A] ring-1 ring-[#FF7A1A]'
            : 'border-[#2E2E2E]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="w-4 h-4 text-[#FF7A1A] shrink-0" />
          <span className="font-bold">{formatJalaliDate(value)}</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 dir-ltr bg-[#222] px-2 py-0.5 rounded-lg border border-[#333]">
          {value || 'YYYY-MM-DD'}
        </span>
      </div>

      {error && <p className="text-[11px] text-red-400 font-medium">{error}</p>}

      {/* Calendar Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 left-0 sm:left-auto sm:w-80 bg-[#141414] border border-[#2D2D2D] rounded-2xl shadow-2xl z-50 p-4 space-y-3 animate-in fade-in duration-200">
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-1 pb-2 border-b border-[#262626]">
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-[#222] text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="ماه بعدی"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month Select */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="bg-[#202020] border border-[#333] text-white text-xs rounded-lg px-2 py-1 font-bold focus:outline-none focus:border-[#FF7A1A] cursor-pointer"
              >
                {PERSIAN_MONTH_NAMES.map((m, idx) => (
                  <option key={idx} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Select */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="bg-[#202020] border border-[#333] text-white text-xs font-mono rounded-lg px-2 py-1 focus:outline-none focus:border-[#FF7A1A] cursor-pointer"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>
                    {toPersianDigits(y)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-[#222] text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="ماه قبلی"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {PERSIAN_WEEK_DAYS_SHORT.map((d, i) => (
              <span
                key={i}
                className={`text-[11px] font-black py-1 ${
                  i === 6 ? 'text-red-400' : 'text-slate-400'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty slots before first day of month */}
            {Array.from({ length: firstDayOfWeekIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-8" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const isSelected =
                viewYear === selectedJalali.jy &&
                viewMonth === selectedJalali.jm &&
                dayNum === selectedJalali.jd;
              const isToday =
                viewYear === todayJalali.jy &&
                viewMonth === todayJalali.jm &&
                dayNum === todayJalali.jd;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF7A1A] text-slate-950 font-black shadow-md shadow-[#FF7A1A]/30 scale-105'
                      : isToday
                      ? 'border border-[#FF7A1A] text-[#FF7A1A] bg-[#FF7A1A]/10'
                      : 'hover:bg-[#262626] text-slate-200'
                  }`}
                >
                  {toPersianDigits(dayNum)}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-2 border-t border-[#262626] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[#FF7A1A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>انتخاب امروز ({formatJalaliDate()})</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
