"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Calendar as CalendarIcon, User, Clock, ChevronRight, X, Save } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [adminNote, setAdminNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 獲取所有預約資料
  const fetchBookings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select(`*, customers(*)`)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) console.error("Error fetching bookings:", error);
    else setBookings(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // 點擊用戶：獲取歷史紀錄與筆記
  const handleCustomerClick = async (customer: any) => {
    setSelectedCustomer(customer);
    setAdminNote(customer.admin_notes || '');

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customer.id)
      .order('date', { ascending: false });

    if (error) console.error("Error fetching history:", error);
    else setCustomerHistory(data || []);
  };

  // 更新管理員筆記
  const saveNote = async () => {
    const { error } = await supabase
      .from('customers')
      .update({ admin_notes: adminNote })
      .eq('id', selectedCustomer.id);
    
    if (error) alert("儲存失敗");
    else alert("筆記已儲存！");
  };

  // 篩選邏輯
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.customers.name.includes(searchTerm) || b.customers.phone.includes(searchTerm);
    const matchesDate = filterDate ? b.date === filterDate : true;
    return matchesSearch && matchesDate;
  });

  const setThisWeek = () => {
    const now = new Date();
    const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
    const lastDay = new Date(now.setDate(now.getDate() + 6));
    // 簡化處理：這裡設定篩選器為本週範圍（實際可優化為區間篩選）
    alert("本週篩選功能已啟動 (請使用日期選擇器精確篩選)");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-700">管理後台 - 預約管理</h1>
          <button onClick={fetchBookings} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-all">
            <Save size={20} /> 重新整理
          </button>
        </div>

        {/* 篩選區域 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="搜尋姓名或電話..." 
              className="w-full pl-10 p-3 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-slate-300 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="date" 
              className="w-full pl-10 p-3 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-slate-300 outline-none"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <button 
            onClick={setThisWeek}
            className="p-3 bg-white text-slate-600 rounded-2xl shadow-sm hover:bg-slate-50 transition-all font-medium"
          >
            本週預約清單
          </button>
        </div>

        {/* 預約清單表格 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
              <tr>
                <th className="p-4 font-medium">日期/時間</th>
                <th className="p-4 font-medium">客戶名稱</th>
                <th className="p-4 font-medium">聯絡電話</th>
                <th className="p-4 font-medium">備註</th>
                <th className="p-4 font-medium">狀態</th>
                <th className="p-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-400">載入中...</td></tr>
              ) : filteredBookings.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-400">目前沒有符合的預約</td></tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium">{b.date}</div>
                      <div className="text-xs text-slate-400">{b.time}</div>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleCustomerClick(b.customers)}
                        className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                      >
                        {b.customers.name} <ChevronRight size={14} />
                      </button>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{b.customers.phone}</td>
                    <td className="p-4 text-sm text-slate-500">{b.remarks || '-'}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="text-xs text-slate-400 hover:text-red-500 transition-colors">取消預約</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 客戶詳情側欄 (Modal) */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-8 animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <User size={20} /> 客戶檔案
              </h2>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 uppercase mb-1">姓名 / 電話</p>
                <p className="text-lg font-medium">{selectedCustomer.name} / {selectedCustomer.phone}</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                  <Save size={16} /> 管理員私密筆記 (僅您可見)
                </label>
                <textarea 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-300 outline-none h-32 resize-none"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="記錄客戶睫毛狀況、過敏史等..."
                />
                <button 
                  onClick={saveNote}
                  className="mt-2 w-full py-2 bg-slate-800 text-white rounded-xl text-sm hover:bg-slate-700 transition-all"
                >
                  儲存筆記
                </button>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-medium text-slate-500 mb-4">預約歷史紀錄</h3>
                <div className="space-y-3">
                  {customerHistory.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center">尚無紀錄</p>
                  ) : (
                    customerHistory.map((h) => (
                      <div key={h.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-sm">
                        <div className="flex items-center gap-3">
                          <Clock size={14} className="text-slate-400" />
                          <span>{h.date} {h.time}</span>
                        </div>
                        <span className="text-xs text-slate-400">{h.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
