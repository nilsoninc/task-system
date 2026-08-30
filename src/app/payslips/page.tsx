'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSystem } from '@/context/SystemContext';
import { Payslip, PayslipConfig, normalizePayslipConfig, DEFAULT_PAYSLIP_CONFIG, DEFAULT_PROF_TAX_SLABS, ProfTaxSlab } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  FileText,
  Printer,
  Calendar,
  Zap,
  Building,
  CheckCircle2,
  X,
  Sliders,
  Users,
  Search,
  Filter,
  ArrowRight,
  Eye,
  CheckSquare,
  Square,
  AlertCircle,
  Percent,
  DollarSign,
  Briefcase
} from 'lucide-react';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const YEARS = ['2024', '2025', '2026', '2027'];

export default function PayslipsPage() {
  const {
    currentUser,
    payslips,
    users,
    systemSettings,
    payslipConfig,
    updatePayslipConfig,
    calculatePayslipsForCriteria,
    saveGeneratedPayslips
  } = useSystem();

  const isAdminOrHR = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN_HR';

  const [activeTab, setActiveTab] = useState<'records' | 'config'>('records');

  // Compute current & last month names
  const now = new Date();
  const currentMonthName = MONTHS[now.getMonth()];
  const currentYearStr = String(now.getFullYear());
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthName = MONTHS[lastMonthDate.getMonth()];
  const lastMonthYearStr = String(lastMonthDate.getFullYear());

  // Determine initial filter month and year
  const currentMonthHasPayslips = useMemo(() => {
    const targetMonthYear = `${currentMonthName} ${currentYearStr}`;
    return payslips.some((p) => p.month === targetMonthYear || (p.month.includes(currentMonthName) && (p.year === currentYearStr || p.month.includes(currentYearStr))));
  }, [payslips, currentMonthName, currentYearStr]);

  const defaultFilterMonth = currentMonthHasPayslips ? currentMonthName : lastMonthName;
  const defaultFilterYear = currentMonthHasPayslips ? currentYearStr : lastMonthYearStr;

  // Filter states
  const [filterMonth, setFilterMonth] = useState<string>(defaultFilterMonth);
  const [filterYear, setFilterYear] = useState<string>(defaultFilterYear);
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('ALL');
  const [searchEmployee, setSearchEmployee] = useState<string>('');

  // Modals state
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false);
  const [generateStep, setGenerateStep] = useState<'select' | 'preview'>('select');

  // Generate Criteria states
  const [genMonth, setGenMonth] = useState<string>(currentMonthName);
  const [genYear, setGenYear] = useState<string>(currentYearStr);
  const [genEmployeeId, setGenEmployeeId] = useState<string>('ALL');
  const [previewPayslips, setPreviewPayslips] = useState<Payslip[]>([]);

  // Configuration Form State (synced with context payslipConfig)
  const [configForm, setConfigForm] = useState<PayslipConfig>(() => normalizePayslipConfig(payslipConfig));
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string>('');

  if (!currentUser) return null;

  // Save Payslip Configuration
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updatePayslipConfig(configForm);
    setConfigSuccessMsg('Payslip Configuration updated successfully! All future payslips will calculate based on these selected items.');
    setTimeout(() => setConfigSuccessMsg(''), 4000);
  };

  // Open Generate Modal
  const openGenerateModal = () => {
    setGenMonth(currentMonthName);
    setGenYear(currentYearStr);
    setGenEmployeeId('ALL');
    setGenerateStep('select');
    setShowGenerateModal(true);
  };

  // Step 1 -> Step 2 Preview
  const handleProceedToPreview = (e: React.FormEvent) => {
    e.preventDefault();
    const calculated = calculatePayslipsForCriteria(genMonth, genYear, genEmployeeId);
    if (calculated.length === 0) {
      alert('No eligible employees found for generation.');
      return;
    }
    setPreviewPayslips(calculated);
    setGenerateStep('preview');
  };

  // Step 2 -> Confirm and commit payslips
  const handleConfirmGenerate = () => {
    saveGeneratedPayslips(previewPayslips);
    setShowGenerateModal(false);
    setFilterMonth(genMonth);
    setFilterYear(genYear);
    if (genEmployeeId !== 'ALL') {
      setFilterEmployeeId(genEmployeeId);
    }
    alert(`Successfully generated and issued ${previewPayslips.length} payslip(s) for ${genMonth} ${genYear}!`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered Payslips List
  const displayedPayslips = useMemo(() => {
    return payslips.filter((p) => {
      // Role scope: Regular employee only sees their own
      if (!isAdminOrHR && p.userId !== currentUser.id) {
        return false;
      }

      // Filter by Employee for Admin
      if (isAdminOrHR && filterEmployeeId !== 'ALL' && p.userId !== filterEmployeeId) {
        return false;
      }

      // Search by name
      if (searchEmployee.trim()) {
        const query = searchEmployee.toLowerCase();
        const matchName = p.userName.toLowerCase().includes(query);
        const matchRole = p.userRole.toLowerCase().includes(query);
        if (!matchName && !matchRole) return false;
      }

      // Filter by Month
      if (filterMonth !== 'ALL') {
        const matchesMonth = p.month.toLowerCase().includes(filterMonth.toLowerCase());
        if (!matchesMonth) return false;
      }

      // Filter by Year
      if (filterYear !== 'ALL') {
        const matchesYear = (p.year && p.year === filterYear) || p.month.includes(filterYear);
        if (!matchesYear) return false;
      }

      return true;
    });
  }, [payslips, isAdminOrHR, currentUser.id, filterEmployeeId, searchEmployee, filterMonth, filterYear]);

  // First user preview payslip
  const previewItem = previewPayslips[0] || null;

  return (
    <div className="space-y-6">
      
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-500" /> Payslip Management
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Generate itemized monthly employee payslips, customize earning/deduction breakdown rules, and download printable salary statements.
          </p>
        </div>

        {isAdminOrHR && (
          <button
            onClick={openGenerateModal}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-glow-orange cursor-pointer flex items-center space-x-1.5 transition-all self-start md:self-auto"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Generate Payslip</span>
          </button>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-zinc-200 flex items-center space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('records')}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'records'
              ? 'border-brand-500 text-brand-600 font-extrabold'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Payslip Records ({displayedPayslips.length})
        </button>

        {isAdminOrHR && (
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'config'
                ? 'border-brand-500 text-brand-600 font-extrabold'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Payslip Configuration
          </button>
        )}
      </div>

      {/* Tab 1: Payslip Records */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          
          {/* Search & Month/Year Filters Bar */}
          <div className="card-clean p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-zinc-800">
                <Filter className="w-4 h-4 text-brand-500" />
                <span>Filter Payslips</span>
              </div>
              <button
                onClick={() => {
                  setFilterMonth(defaultFilterMonth);
                  setFilterYear(defaultFilterYear);
                  setFilterEmployeeId('ALL');
                  setSearchEmployee('');
                }}
                className="text-[11px] font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
              >
                Reset to Default Month ({defaultFilterMonth} {defaultFilterYear})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Month Filter */}
              <div>
                <label className="font-bold text-zinc-600 block mb-1">Pay Period Month</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-brand-500 font-semibold"
                >
                  <option value="ALL">All Months</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="font-bold text-zinc-600 block mb-1">Year</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-brand-500 font-semibold"
                >
                  <option value="ALL">All Years</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Filter (Admin/HR Only) */}
              {isAdminOrHR ? (
                <div>
                  <label className="font-bold text-zinc-600 block mb-1">Employee</label>
                  <select
                    value={filterEmployeeId}
                    onChange={(e) => setFilterEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-brand-500 font-semibold"
                  >
                    <option value="ALL">All Employees ({users.length})</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.title})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-zinc-600 block mb-1">My Account</label>
                  <input
                    type="text"
                    disabled
                    value={`${currentUser.name} (${currentUser.title})`}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-100 font-semibold text-zinc-700"
                  />
                </div>
              )}

              {/* Search Employee Name / Role */}
              <div>
                <label className="font-bold text-zinc-600 block mb-1">Search Record</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search name or title..."
                    value={searchEmployee}
                    onChange={(e) => setSearchEmployee(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 focus:bg-white focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payslips Table */}
          <div className="card-clean overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Pay Period</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4 text-right">Gross Salary</th>
                    <th className="py-3 px-4 text-right">Total Deductions</th>
                    <th className="py-3 px-4 text-right">Net Take-Home</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {displayedPayslips.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-400">
                        <FileText className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                        <p className="font-semibold">No payslip records found for the selected month/year filter.</p>
                        {isAdminOrHR && (
                          <button
                            onClick={openGenerateModal}
                            className="mt-2 text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
                          >
                            + Generate Payslips for {filterMonth !== 'ALL' ? filterMonth : currentMonthName} {filterYear !== 'ALL' ? filterYear : currentYearStr}
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    displayedPayslips.map((p) => {
                      const totalDeductions =
                        (p.pfDeduction || 0) +
                        (p.taxDeduction || 0) +
                        (p.unpaidLeaveDeduction || 0) +
                        (p.profTaxDeduction || 0);

                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-bold text-zinc-900">{p.userName}</p>
                              <p className="text-[10px] text-zinc-400">{p.userRole}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-zinc-800">{p.month}</td>
                          <td className="py-3 px-4 font-mono text-zinc-500">{formatDate(p.generationDate)}</td>
                          <td className="py-3 px-4 font-mono font-bold text-zinc-800 text-right">
                            {formatCurrency(p.grossSalary, systemSettings)}
                          </td>
                          <td className="py-3 px-4 font-mono text-rose-600 font-semibold text-right">
                            -{formatCurrency(totalDeductions, systemSettings)}
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-emerald-600 text-right">
                            {formatCurrency(p.netPay, systemSettings)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {p.status || 'PAID'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedPayslip(p)}
                              className="px-3 py-1.5 bg-zinc-900 text-white hover:bg-black rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center space-x-1.5 ml-auto"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>View / Print</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
              <span>Showing <strong>{displayedPayslips.length}</strong> payslip record(s)</span>
              <span>Filter: {filterMonth} {filterYear}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Payslip Configuration (Admin & HR Only) */}
      {activeTab === 'config' && isAdminOrHR && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          {configSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{configSuccessMsg}</span>
            </div>
          )}

          {/* Configuration Immutability & Company Branding Notice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Next Generations Only</p>
                <p className="text-zinc-600 mt-0.5">
                  Configuration changes will <strong>only apply for next payslip generations</strong>. Payslips which were already issued before remain locked with their historical data and will not be affected.
                </p>
              </div>
            </div>

            <div className="bg-brand-50/70 border border-brand-200 p-4 rounded-2xl flex items-start space-x-3 text-xs text-brand-900">
              <Building className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Corporate Header Details</p>
                <p className="text-zinc-600 mt-0.5">
                  Corporate details (<strong>{systemSettings.companyInfo.name}</strong>, logo, and currency symbol <strong>{systemSettings.currencySymbol}</strong>) are loaded from <strong>Web Admin Master</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earning Breakdown Card */}
            <div className="card-clean p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs">₹</span>
                  <span>Earning Breakdown</span>
                </h3>
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Configure Allowances</span>
              </div>
              <p className="text-xs text-zinc-500">
                Check the earning components to calculate on new payslips (Only Basic Salary is compulsory):
              </p>

              <div className="space-y-3 text-xs">
                {/* Basic Salary (Compulsory) */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 cursor-not-allowed">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled={true}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-not-allowed"
                    />
                    <div>
                      <p className="font-bold text-zinc-900">Basic Salary</p>
                      <p className="text-[10px] text-zinc-500">Primary core salary component (Mandatory)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">Compulsory</span>
                </label>

                {/* HRA Allowance */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={configForm?.earnings?.hra ?? false}
                      onChange={(e) =>
                        setConfigForm((prev) => ({
                          ...prev,
                          earnings: { ...(prev?.earnings || DEFAULT_PAYSLIP_CONFIG.earnings), hra: e.target.checked }
                        }))
                      }
                      className="rounded text-brand-500 focus:ring-brand-500"
                    />
                    <div>
                      <p className="font-bold text-zinc-900">HRA Allowance</p>
                      <p className="text-[10px] text-zinc-400">House Rent Allowance component</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-600 bg-zinc-200/60 px-2 py-0.5 rounded">Allowance</span>
                </label>

                {/* Special Allowance */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={configForm?.earnings?.specialAllowance ?? false}
                      onChange={(e) =>
                        setConfigForm((prev) => ({
                          ...prev,
                          earnings: { ...(prev?.earnings || DEFAULT_PAYSLIP_CONFIG.earnings), specialAllowance: e.target.checked }
                        }))
                      }
                      className="rounded text-brand-500 focus:ring-brand-500"
                    />
                    <div>
                      <p className="font-bold text-zinc-900">Special Allowance</p>
                      <p className="text-[10px] text-zinc-400">Performance & executive supplementary allowance</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-600 bg-zinc-200/60 px-2 py-0.5 rounded">Allowance</span>
                </label>

                {/* DA Allowance */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={configForm?.earnings?.daAllowance ?? false}
                      onChange={(e) =>
                        setConfigForm((prev) => ({
                          ...prev,
                          earnings: { ...(prev?.earnings || DEFAULT_PAYSLIP_CONFIG.earnings), daAllowance: e.target.checked }
                        }))
                      }
                      className="rounded text-brand-500 focus:ring-brand-500"
                    />
                    <div>
                      <p className="font-bold text-zinc-900">DA Allowance</p>
                      <p className="text-[10px] text-zinc-400">Dearness Allowance component</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-600 bg-zinc-200/60 px-2 py-0.5 rounded">Allowance</span>
                </label>

                {/* TA Allowance */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={configForm?.earnings?.taAllowance ?? false}
                      onChange={(e) =>
                        setConfigForm((prev) => ({
                          ...prev,
                          earnings: { ...(prev?.earnings || DEFAULT_PAYSLIP_CONFIG.earnings), taAllowance: e.target.checked }
                        }))
                      }
                      className="rounded text-brand-500 focus:ring-brand-500"
                    />
                    <div>
                      <p className="font-bold text-zinc-900">TA Allowance</p>
                      <p className="text-[10px] text-zinc-400">Travel & Conveyance Allowance component</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-600 bg-zinc-200/60 px-2 py-0.5 rounded">Allowance</span>
                </label>

                {/* Food Allowance */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/80 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={configForm?.earnings?.foodAllowance ?? false}
                      onChange={(e) =>
                        setConfigForm((prev) => ({
                          ...prev,
                          earnings: { ...(prev?.earnings || DEFAULT_PAYSLIP_CONFIG.earnings), foodAllowance: e.target.checked }
                        }))
                      }
                      className="rounded text-brand-500 focus:ring-brand-500"
                    />
                    <div>
                      <p className="font-bold text-zinc-900">Food Allowance</p>
                      <p className="text-[10px] text-zinc-400">Meal vouchers & cafeteria subsidy</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-600 bg-zinc-200/60 px-2 py-0.5 rounded">Allowance</span>
                </label>
              </div>
            </div>

            {/* Deductions Breakdown Card */}
            <div className="card-clean p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-rose-600" /> Deductions Breakdown
                </h3>
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Select & Configure</span>
              </div>
              <p className="text-xs text-zinc-500">
                All deductions can be freely selected or deselected for future payslip calculations:
              </p>

              <div className="space-y-3 text-xs">
                {/* Provident Fund */}
                <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configForm?.deductions?.providentFund ?? false}
                        onChange={(e) =>
                          setConfigForm((prev) => ({
                            ...prev,
                            deductions: { ...(prev?.deductions || DEFAULT_PAYSLIP_CONFIG.deductions), providentFund: e.target.checked }
                          }))
                        }
                        className="rounded text-brand-500 focus:ring-brand-500"
                      />
                      <div>
                        <p className="font-bold text-zinc-900">Provident Fund (PF)</p>
                        <p className="text-[10px] text-zinc-400">Statutory employee retirement fund contribution</p>
                      </div>
                    </label>
                  </div>

                  {Boolean(configForm?.deductions?.providentFund) && (
                    <div className="flex items-center space-x-2 pt-1 border-t border-zinc-200/60 animate-in fade-in">
                      <span className="font-semibold text-zinc-600">Rate (%):</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={configForm?.deductions?.pfPercentage ?? 12}
                        onChange={(e) =>
                          setConfigForm((prev) => ({
                            ...prev,
                            deductions: { ...(prev?.deductions || DEFAULT_PAYSLIP_CONFIG.deductions), pfPercentage: Number(e.target.value) }
                          }))
                        }
                        className="w-24 px-2 py-1 border border-zinc-300 rounded-lg font-mono font-bold bg-white text-xs"
                      />
                      <span className="text-zinc-500">% of Basic Salary</span>
                    </div>
                  )}
                </div>

                {/* Income Tax */}
                <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configForm?.deductions?.incomeTax ?? false}
                        onChange={(e) =>
                          setConfigForm((prev) => ({
                            ...prev,
                            deductions: { ...(prev?.deductions || DEFAULT_PAYSLIP_CONFIG.deductions), incomeTax: e.target.checked }
                          }))
                        }
                        className="rounded text-brand-500 focus:ring-brand-500"
                      />
                      <div>
                        <p className="font-bold text-zinc-900">Income Tax / TDS (WHT)</p>
                        <p className="text-[10px] text-zinc-400">Monthly tax withholding on gross income</p>
                      </div>
                    </label>
                  </div>

                  {Boolean(configForm?.deductions?.incomeTax) && (
                    <div className="flex items-center space-x-2 pt-1 border-t border-zinc-200/60 animate-in fade-in">
                      <span className="font-semibold text-zinc-600">Rate (%):</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={configForm?.deductions?.taxPercentage ?? 10}
                        onChange={(e) =>
                          setConfigForm((prev) => ({
                            ...prev,
                            deductions: { ...(prev?.deductions || DEFAULT_PAYSLIP_CONFIG.deductions), taxPercentage: Number(e.target.value) }
                          }))
                        }
                        className="w-24 px-2 py-1 border border-zinc-300 rounded-lg font-mono font-bold bg-white text-xs"
                      />
                      <span className="text-zinc-500">% of Gross Salary</span>
                    </div>
                  )}
                </div>

                {/* Leave Deduction */}
                <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configForm?.deductions?.leaveDeduction ?? false}
                      onChange={(e) =>
                        setConfigForm((prev) => ({
                          ...prev,
                          deductions: { ...(prev?.deductions || DEFAULT_PAYSLIP_CONFIG.deductions), leaveDeduction: e.target.checked }
                        }))
                      }
                      className="rounded text-brand-500 focus:ring-brand-500"
                    />
                    <div>
                      <p className="font-bold text-zinc-900">Leave Deduction (Loss of Pay)</p>
                      <p className="text-[10px] text-zinc-400">
                        Automatically deducts salary for approved unpaid leave days (Gross / 30 * Unpaid Days)
                      </p>
                    </div>
                  </label>
                </div>

                {/* Professional Tax with 3 Configurable Slabs */}
                <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={configForm?.deductions?.profTax ?? false}
                        onChange={(e) =>
                          setConfigForm((prev) => ({
                            ...prev,
                            deductions: { ...(prev?.deductions || DEFAULT_PAYSLIP_CONFIG.deductions), profTax: e.target.checked }
                          }))
                        }
                        className="rounded text-brand-500 focus:ring-brand-500"
                      />
                      <div>
                        <p className="font-bold text-zinc-900">Professional Tax (Prof. Tax)</p>
                        <p className="text-[10px] text-zinc-400">State professional tax deduction slabs</p>
                      </div>
                    </label>
                  </div>

                  {/* 3 Configurable Slabs — ONLY display if Professional Tax is selected */}
                  {Boolean(configForm?.deductions?.profTax) && (
                    <div className="pt-2 border-t border-zinc-200/80 space-y-2.5 animate-in fade-in">
                      <p className="text-[11px] font-bold text-zinc-700">Configure 3 Professional Tax Slabs:</p>
                      
                      {[0, 1, 2].map((idx) => {
                        const slabs = configForm?.deductions?.profTaxSlabs || DEFAULT_PROF_TAX_SLABS;
                        const slab = slabs[idx] || { minSalary: 0, taxAmount: 0 };

                        return (
                          <div key={idx} className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-lg border border-zinc-200 text-xs">
                            <span className="font-extrabold text-zinc-500 text-[11px] w-14">Slab {idx + 1}:</span>
                            
                            <span className="text-zinc-600">Salary greater than</span>
                            <div className="flex items-center space-x-1">
                              <span className="font-bold text-zinc-600">₹</span>
                              <input
                                type="number"
                                min={0}
                                value={slab.minSalary}
                                onChange={(e) => {
                                  const newSlabs = [...(configForm?.deductions?.profTaxSlabs || DEFAULT_PROF_TAX_SLABS)];
                                  while (newSlabs.length < 3) newSlabs.push({ minSalary: 0, taxAmount: 0 });
                                  newSlabs[idx] = { ...newSlabs[idx], minSalary: Number(e.target.value) };
                                  setConfigForm((prev) => ({
                                    ...prev,
                                    deductions: { ...(prev?.deductions || DEFAULT_PAYSLIP_CONFIG.deductions), profTaxSlabs: newSlabs }
                                  }));
                                }}
                                className="w-24 px-2 py-1 border border-zinc-300 rounded font-mono font-bold text-zinc-800 text-xs"
                              />
                            </div>

                            <span className="text-zinc-600">→ Prof. Tax</span>
                            <div className="flex items-center space-x-1">
                              <span className="font-bold text-zinc-600">₹</span>
                              <input
                                type="number"
                                min={0}
                                value={slab.taxAmount}
                                onChange={(e) => {
                                  const newSlabs = [...(configForm?.deductions?.profTaxSlabs || DEFAULT_PROF_TAX_SLABS)];
                                  while (newSlabs.length < 3) newSlabs.push({ minSalary: 0, taxAmount: 0 });
                                  newSlabs[idx] = { ...newSlabs[idx], taxAmount: Number(e.target.value) };
                                  setConfigForm((prev) => ({
                                    ...prev,
                                    deductions: { ...(prev?.deductions || DEFAULT_PAYSLIP_CONFIG.deductions), profTaxSlabs: newSlabs }
                                  }));
                                }}
                                className="w-20 px-2 py-1 border border-zinc-300 rounded font-mono font-bold text-zinc-800 text-xs"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-glow-orange cursor-pointer flex items-center space-x-2 text-xs transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Payslip Configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* Generate Payslip Modal (2-Step Flow: Criteria & 1st User Preview) */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-brand-500 fill-current" />
                  {generateStep === 'select' ? 'Generate Payslips' : 'Preview Payslip Statement & Confirm'}
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {generateStep === 'select'
                    ? 'Select pay period month, year, and target employee(s) to compute payslips.'
                    : `Review preview for ${previewItem?.userName} before generating all ${previewPayslips.length} payslips.`}
                </p>
              </div>

              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: Select Criteria Form */}
            {generateStep === 'select' && (
              <form onSubmit={handleProceedToPreview} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Pay Period Month *</label>
                    <select
                      value={genMonth}
                      onChange={(e) => setGenMonth(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-bold bg-zinc-50"
                    >
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Pay Period Year *</label>
                    <select
                      value={genYear}
                      onChange={(e) => setGenYear(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-bold bg-zinc-50"
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Target Employee *</label>
                  <select
                    value={genEmployeeId}
                    onChange={(e) => setGenEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-bold bg-zinc-50"
                  >
                    <option value="ALL">ALL EMPLOYEES ({users.length} staff members)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Configuration Summary Badge */}
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5">
                  <p className="text-[11px] font-bold text-zinc-700">Active Payslip Configuration Rules:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(payslipConfig?.earnings || {})
                      .filter(([_, val]) => Boolean(val))
                      .map(([key]) => (
                        <span key={key} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                          +{key.replace(/([A-Z])/g, ' $1')}
                        </span>
                      ))}
                    {Object.entries(payslipConfig?.deductions || {})
                      .filter(([key, val]) => Boolean(val) && typeof val === 'boolean')
                      .map(([key]) => (
                        <span key={key} className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 rounded text-[10px] font-bold">
                          -{key.replace(/([A-Z])/g, ' $1')}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-glow-orange cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>Generate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Preview 1st User Payslip & Confirm */}
            {generateStep === 'preview' && previewItem && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-semibold text-xs flex items-center justify-between">
                  <span>
                    Previewing 1st payslip for <strong>{previewItem.userName}</strong>. Total target recipients: <strong>{previewPayslips.length} employee(s)</strong>.
                  </span>
                  <span className="font-mono text-amber-800 font-bold">{genMonth} {genYear}</span>
                </div>

                {/* Payslip Preview Container */}
                <div className="border border-zinc-200 rounded-2xl p-5 space-y-4 bg-white shadow-xs">
                  {/* Corporate Header */}
                  <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
                    <div className="flex items-center space-x-3">
                      {systemSettings.companyInfo.logoUrl ? (
                        <img
                          src={systemSettings.companyInfo.logoUrl}
                          alt="Logo"
                          className="w-10 h-10 rounded-xl object-cover border border-zinc-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold">
                          <Zap className="w-5 h-5 fill-current" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-base font-extrabold text-zinc-900">{systemSettings.companyInfo.name}</h2>
                        <p className="text-[10px] text-zinc-500">{systemSettings.companyInfo.email} • {systemSettings.companyInfo.phone}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 bg-zinc-900 text-white rounded text-[9px] font-bold uppercase tracking-wider">
                        PREVIEW STATEMENT
                      </span>
                      <p className="text-xs font-bold text-zinc-800 mt-1">{previewItem.month}</p>
                    </div>
                  </div>

                  {/* Employee Details Grid */}
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-zinc-400 uppercase font-bold text-[9px]">Employee Name</p>
                      <p className="font-bold text-zinc-900 text-xs">{previewItem.userName}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 uppercase font-bold text-[9px]">Designation / Role</p>
                      <p className="font-semibold text-zinc-800 text-xs">{previewItem.userRole}</p>
                    </div>
                  </div>

                  {/* Dynamic Earnings & Deductions Breakdown based on selected configuration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Earnings Table */}
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                      <div className="bg-emerald-50 text-emerald-900 p-2 font-bold uppercase text-[10px] border-b border-emerald-200">
                        Earnings Breakdown
                      </div>
                      <div className="p-3 space-y-1.5">
                        {previewItem.breakdown?.earnings && Object.entries(previewItem.breakdown.earnings).map(([key, val]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-zinc-600">{key}:</span>
                            <span className="font-mono font-bold text-zinc-900">{formatCurrency(val, systemSettings)}</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-emerald-700">
                          <span>Gross Earnings:</span>
                          <span className="font-mono">{formatCurrency(previewItem.grossSalary, systemSettings)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions Table */}
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                      <div className="bg-rose-50 text-rose-900 p-2 font-bold uppercase text-[10px] border-b border-rose-200">
                        Deductions Breakdown
                      </div>
                      <div className="p-3 space-y-1.5">
                        {previewItem.breakdown?.deductions && Object.entries(previewItem.breakdown.deductions).map(([key, val]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-zinc-600">{key}:</span>
                            <span className="font-mono font-bold text-zinc-900">{formatCurrency(val, systemSettings)}</span>
                          </div>
                        ))}
                        {(!previewItem.breakdown?.deductions || Object.keys(previewItem.breakdown.deductions).length === 0) && (
                          <p className="text-[11px] text-zinc-400 italic">No deductions configured.</p>
                        )}
                        <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-rose-700">
                          <span>Total Deductions:</span>
                          <span className="font-mono">
                            {formatCurrency(
                              (previewItem.pfDeduction || 0) +
                              (previewItem.taxDeduction || 0) +
                              (previewItem.unpaidLeaveDeduction || 0) +
                              (previewItem.profTaxDeduction || 0),
                              systemSettings
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Net Pay Banner — Light Grey Background & Black Font Color as Requested */}
                  <div className="bg-zinc-100 border border-zinc-200 text-zinc-900 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Net Take-Home Salary
                      </p>
                      <p className="text-[11px] text-zinc-600 font-medium">Calculated as per selected breakdown</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-zinc-900 font-mono">
                        {formatCurrency(previewItem.netPay, systemSettings)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setGenerateStep('select')}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl cursor-pointer"
                  >
                    ← Back / Modify
                  </button>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowGenerateModal(false)}
                      className="px-4 py-2 text-zinc-500 hover:bg-zinc-100 rounded-xl font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmGenerate}
                      className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-glow-orange cursor-pointer flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Generate ({previewPayslips.length} Payslips)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Printable Corporate Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]" id="printable-payslip">
            
            {/* Header Toolbar */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4 print:hidden">
              <span className="text-xs font-bold text-zinc-500">Official Monthly Payslip Statement</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
                <button onClick={() => setSelectedPayslip(null)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Corporate Header from Web Admin Master */}
            <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-5">
              <div className="flex items-center space-x-3">
                {systemSettings.companyInfo.logoUrl ? (
                  <img
                    src={systemSettings.companyInfo.logoUrl}
                    alt="Logo"
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold">
                    <Zap className="w-6 h-6 fill-current" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-black text-zinc-900 tracking-tight">{systemSettings.companyInfo.name}</h2>
                  <p className="text-xs text-zinc-500">{systemSettings.companyInfo.email} • {systemSettings.companyInfo.phone}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 bg-zinc-900 text-white rounded-md text-xs font-bold uppercase tracking-wider block">
                  PAYSLIP STATEMENT
                </span>
                <p className="text-xs font-bold text-zinc-800 mt-2">Pay Period: {selectedPayslip.month}</p>
                <p className="text-[11px] text-zinc-500">Issue Date: {formatDate(selectedPayslip.generationDate)}</p>
              </div>
            </div>

            {/* Employee Details Grid */}
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-zinc-400 uppercase font-bold text-[10px]">Employee Name</p>
                <p className="font-extrabold text-zinc-900 text-sm">{selectedPayslip.userName}</p>
              </div>
              <div>
                <p className="text-zinc-400 uppercase font-bold text-[10px]">Designation / Role</p>
                <p className="font-semibold text-zinc-800 text-xs">{selectedPayslip.userRole}</p>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              
              {/* Earnings Table */}
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <div className="bg-emerald-50 text-emerald-900 p-2.5 font-bold uppercase text-[11px] border-b border-emerald-200">
                  Earnings Breakdown
                </div>
                <div className="p-3 space-y-2">
                  {selectedPayslip.breakdown?.earnings ? (
                    Object.entries(selectedPayslip.breakdown.earnings).map(([key, val]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-zinc-600">{key}:</span>
                        <span className="font-mono font-bold text-zinc-900">{formatCurrency(val, systemSettings)}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Basic Salary:</span>
                        <span className="font-mono font-bold text-zinc-900">{formatCurrency(selectedPayslip.basicSalary, systemSettings)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">HRA Allowance:</span>
                        <span className="font-mono font-bold text-zinc-900">{formatCurrency(selectedPayslip.hra, systemSettings)}</span>
                      </div>
                      {Number(selectedPayslip.daAllowance || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-zinc-600">DA Allowance:</span>
                          <span className="font-mono font-bold text-zinc-900">{formatCurrency(selectedPayslip.daAllowance || 0, systemSettings)}</span>
                        </div>
                      )}
                      {Number(selectedPayslip.taAllowance || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-zinc-600">TA Allowance:</span>
                          <span className="font-mono font-bold text-zinc-900">{formatCurrency(selectedPayslip.taAllowance || 0, systemSettings)}</span>
                        </div>
                      )}
                      {Number(selectedPayslip.foodAllowance || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Food Allowance:</span>
                          <span className="font-mono font-bold text-zinc-900">{formatCurrency(selectedPayslip.foodAllowance || 0, systemSettings)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-emerald-700">
                    <span>Gross Earnings:</span>
                    <span className="font-mono">{formatCurrency(selectedPayslip.grossSalary, systemSettings)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Table */}
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <div className="bg-rose-50 text-rose-900 p-2.5 font-bold uppercase text-[11px] border-b border-rose-200">
                  Deductions Breakdown
                </div>
                <div className="p-3 space-y-2">
                  {selectedPayslip.breakdown?.deductions ? (
                    Object.entries(selectedPayslip.breakdown.deductions).map(([key, val]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-zinc-600">{key}:</span>
                        <span className="font-mono font-bold text-zinc-900">{formatCurrency(val, systemSettings)}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      {Number(selectedPayslip.pfDeduction || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Provident Fund (PF):</span>
                          <span className="font-mono font-bold text-zinc-900">{formatCurrency(selectedPayslip.pfDeduction, systemSettings)}</span>
                        </div>
                      )}
                      {Number(selectedPayslip.taxDeduction || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Income Tax:</span>
                          <span className="font-mono font-bold text-zinc-900">{formatCurrency(selectedPayslip.taxDeduction, systemSettings)}</span>
                        </div>
                      )}
                      {Number(selectedPayslip.unpaidLeaveDeduction || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Leave Deductions:</span>
                          <span className="font-mono font-bold text-zinc-900">{formatCurrency(selectedPayslip.unpaidLeaveDeduction, systemSettings)}</span>
                        </div>
                      )}
                      {Number(selectedPayslip.profTaxDeduction || 0) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-zinc-600">Prof. Tax:</span>
                          <span className="font-mono font-bold text-zinc-900">{formatCurrency(selectedPayslip.profTaxDeduction || 0, systemSettings)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-rose-700">
                    <span>Total Deductions:</span>
                    <span className="font-mono">
                      {formatCurrency(
                        (selectedPayslip.pfDeduction || 0) +
                        (selectedPayslip.taxDeduction || 0) +
                        (selectedPayslip.unpaidLeaveDeduction || 0) +
                        (selectedPayslip.profTaxDeduction || 0),
                        systemSettings
                      )}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Net Pay Banner — Light Grey Background & Black Font Color as Requested */}
            <div className="bg-zinc-100 border border-zinc-300 text-zinc-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Total Net Take-Home Salary</p>
                <p className="text-xs text-zinc-700 italic">Disbursed directly via bank wire transfer</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-zinc-900 font-mono">
                  {formatCurrency(selectedPayslip.netPay, systemSettings)}
                </span>
              </div>
            </div>

            {/* Footer without signature blocks as requested */}
            <div className="pt-4 border-t border-zinc-200 flex justify-between text-[11px] text-zinc-400">
              <span>Confidential • Generated by {systemSettings.companyInfo.name}</span>
              <span>Currency: {systemSettings.currencyCode}</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
