'use client';

import React, { useState } from 'react';
import { useSystem } from '@/context/SystemContext';
import { CustomRole, CustomRolePermission, SubFunctionPermission, SystemSettings } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  ShieldCheck,
  Plus,
  Key,
  Users,
  Settings,
  X,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Building,
  Palette,
  Calendar,
  Layers,
  Save,
  Clock,
  Edit,
  Trash2,
  Upload,
  Type,
  Sliders
} from 'lucide-react';

const INITIAL_SUB_FUNCTIONS: CustomRolePermission[] = [
  {
    module: 'dashboard',
    moduleLabel: 'My Dashboard',
    subFunctions: [
      { key: 'dashboard', label: 'Menu Access', menuRoute: '/', canAccess: true, canView: true, canCreate: false, canEdit: false, canDelete: false }
    ]
  },
  {
    module: 'tasks',
    moduleLabel: 'Tasks & Timer Engine',
    subFunctions: [
      { key: 'tasks', label: 'Menu Access', menuRoute: '/tasks', canAccess: true, canView: true, canCreate: false, canEdit: false, canDelete: false },
      { key: 'tasks.board', label: 'Kanban & List Board', canAccess: true, canView: true, canCreate: true, canEdit: true, canDelete: false },
      { key: 'tasks.timer', label: 'Live Worklog Timer', canAccess: true, canView: true, canCreate: true, canEdit: true, canDelete: false },
      { key: 'tasks.worklog', label: 'Worklog Session History', canAccess: true, canView: true, canCreate: false, canEdit: false, canDelete: false }
    ]
  },
  {
    module: 'attendance',
    moduleLabel: 'Attendance & Hours Register',
    subFunctions: [
      { key: 'attendance', label: 'Menu Access', menuRoute: '/attendance', canAccess: true, canView: true, canCreate: false, canEdit: false, canDelete: false },
      { key: 'attendance.register', label: 'Daily Punch Register', canAccess: true, canView: true, canCreate: true, canEdit: false, canDelete: false },
      { key: 'attendance.late', label: 'Late Arrival Audit Flags', canAccess: true, canView: true, canCreate: false, canEdit: false, canDelete: false }
    ]
  },
  {
    module: 'leaves',
    moduleLabel: 'Leaves & Comp-Off System',
    subFunctions: [
      { key: 'leaves', label: 'Menu Access', menuRoute: '/leaves', canAccess: true, canView: true, canCreate: false, canEdit: false, canDelete: false },
      { key: 'leaves.applications', label: 'Leave Applications', canAccess: true, canView: true, canCreate: true, canEdit: true, canDelete: false },
      { key: 'leaves.approvals', label: 'Hierarchy Approvals Queue', canAccess: true, canView: true, canCreate: false, canEdit: true, canDelete: true },
      { key: 'leaves.comp_off', label: 'Comp-Off Overtime Claims', canAccess: true, canView: true, canCreate: true, canEdit: true, canDelete: false },
      { key: 'leaves.rules', label: 'Policy Rules Configuration', canAccess: true, canView: true, canCreate: true, canEdit: true, canDelete: true }
    ]
  },
  {
    module: 'chat',
    moduleLabel: 'Internal Chat',
    subFunctions: [
      { key: 'chat', label: 'Menu Access', menuRoute: '/chat', canAccess: true, canView: true, canCreate: false, canEdit: false, canDelete: false }
    ]
  },
  {
    module: 'teams',
    moduleLabel: 'Teams & Directory',
    subFunctions: [
      { key: 'teams', label: 'Menu Access', menuRoute: '/teams', canAccess: true, canView: true, canCreate: false, canEdit: false, canDelete: false },
      { key: 'teams.directory', label: 'Staff Directory', canAccess: true, canView: true, canCreate: true, canEdit: true, canDelete: false },
      { key: 'teams.docs', label: 'Document Verification', canAccess: true, canView: true, canCreate: true, canEdit: true, canDelete: false },
      { key: 'teams.salary', label: 'Salary & Increment History', canAccess: true, canView: true, canCreate: true, canEdit: true, canDelete: false }
    ]
  },
  {
    module: 'projects',
    moduleLabel: 'Projects & Masters',
    subFunctions: [
      { key: 'projects', label: 'Menu Access', menuRoute: '/projects', canAccess: true, canView: true, canCreate: false, canEdit: false, canDelete: false },
      { key: 'projects.list', label: 'Projects List', canAccess: true, canView: true, canCreate: true, canEdit: true, canDelete: false },
      { key: 'projects.masters', label: 'Project & Task Types Master', canAccess: true, canView: true, canCreate: true, canEdit: true, canDelete: true }
    ]
  },
  {
    module: 'payroll',
    moduleLabel: 'Payslips & Payroll Engine',
    subFunctions: [
      { key: 'payslips', label: 'Menu Access', menuRoute: '/payslips', canAccess: true, canView: true, canCreate: false, canEdit: false, canDelete: false },
      { key: 'payroll.viewer', label: 'Payslip Viewer', canAccess: true, canView: true, canCreate: false, canEdit: false, canDelete: false },
      { key: 'payroll.batch', label: 'Fixed-Date Batch Generator', canAccess: true, canView: true, canCreate: true, canEdit: true, canDelete: true }
    ]
  },
  {
    module: 'reports',
    moduleLabel: 'Analytics & Reports',
    subFunctions: [
      { key: 'reports', label: 'Menu Access', menuRoute: '/reports', canAccess: true, canView: true, canCreate: false, canEdit: false, canDelete: false },
      { key: 'reports.view', label: 'User & Cross-User Reports', canAccess: true, canView: true, canCreate: false, canEdit: false, canDelete: false }
    ]
  },
  {
    module: 'admin',
    moduleLabel: 'Web Admin Controls',
    subFunctions: [
      { key: 'admin', label: 'Menu Access', menuRoute: '/admin', canAccess: true, canView: true, canCreate: false, canEdit: false, canDelete: false },
      { key: 'admin.settings', label: 'System Configurations', canAccess: true, canView: true, canCreate: true, canEdit: true, canDelete: true },
      { key: 'admin.roles', label: 'Role & Permission Manager', canAccess: true, canView: true, canCreate: true, canEdit: true, canDelete: true }
    ]
  }
];

export default function AdminPage() {
  const {
    currentUser,
    customRoles,
    addCustomRole,
    editCustomRole,
    deleteCustomRole,
    users,
    systemSettings,
    updateSystemSettings
  } = useSystem();

  const [activeTab, setActiveTab] = useState<'settings' | 'roles'>('settings');

  // Super Admin Configuration Form State
  const [punchInTime, setPunchInTime] = useState(systemSettings.morningPunchInThreshold);
  const [minDailyWorkingHours, setMinDailyWorkingHours] = useState(systemSettings.minDailyWorkingHours || '08:00');
  const [lateArrivalFlagLimit, setLateArrivalFlagLimit] = useState<number>(systemSettings.lateArrivalFlagLimit ?? 3);
  const [currencySymbol, setCurrencySymbol] = useState(systemSettings.currencySymbol || '₹');
  const [currencyCode, setCurrencyCode] = useState(systemSettings.currencyCode || 'INR');
  const [smtpHost, setSmtpHost] = useState(systemSettings.smtpConfig.host);
  const [smtpPort, setSmtpPort] = useState(systemSettings.smtpConfig.port);
  const [smtpUser, setSmtpUser] = useState(systemSettings.smtpConfig.user);
  const [smtpPass, setSmtpPass] = useState(systemSettings.smtpConfig.pass);

  const [compName, setCompName] = useState(systemSettings.companyInfo.name);
  const [compLogo, setCompLogo] = useState(systemSettings.companyInfo.logoUrl);
  const [compEmail, setCompEmail] = useState(systemSettings.companyInfo.email);
  const [compPhone, setCompPhone] = useState(systemSettings.companyInfo.phone);

  // Theme, Typography & Button Color States
  const [fontFamily, setFontFamily] = useState(systemSettings.themeConfig.fontFamily);
  const [headingFontSize, setHeadingFontSize] = useState(systemSettings.themeConfig.headingFontSize);
  const [bodyFontSize, setBodyFontSize] = useState(systemSettings.themeConfig.bodyFontSize);

  const [primaryColor, setPrimaryColor] = useState(systemSettings.themeConfig.primaryColor);
  const [accentColor, setAccentColor] = useState(systemSettings.themeConfig.accentColor);
  const [darkColor, setDarkColor] = useState(systemSettings.themeConfig.darkColor);
  const [headingColor, setHeadingColor] = useState(systemSettings.themeConfig.headingColor);
  const [bodyColor, setBodyColor] = useState(systemSettings.themeConfig.bodyColor);
  
  const [btnPrimaryColor, setBtnPrimaryColor] = useState(systemSettings.themeConfig.buttonPrimaryColor);
  const [btnHoverColor, setBtnHoverColor] = useState(systemSettings.themeConfig.buttonHoverColor);
  const [btnTextColor, setBtnTextColor] = useState(systemSettings.themeConfig.buttonTextColor);

  const [dateFormat, setDateFormat] = useState(systemSettings.dateFormat);
  const [timeFormat, setTimeFormat] = useState(systemSettings.timeFormat);

  const [maxLeaveGroup, setMaxLeaveGroup] = useState(systemSettings.maxConsecutiveLeaveGroup);
  const [sandwichEnabled, setSandwichEnabled] = useState(systemSettings.sandwichRule.enabled);
  const [sandwichCondition, setSandwichCondition] = useState(systemSettings.sandwichRule.conditionText);

  const [totalPaidLeavePerYear, setTotalPaidLeavePerYear] = useState<number>(systemSettings.totalPaidLeavePerYear ?? 18);
  const [probationMonths, setProbationMonths] = useState<3 | 6 | 9 | 12>(systemSettings.probationPaidLeaveEligibilityMonths);
  const [minNoticeDays, setMinNoticeDays] = useState<3 | 5 | 10 | 15 | 25 | 30>(systemSettings.minNoticeDaysRequired);

  const [savedMessage, setSavedMessage] = useState('');

  // Role Creation & Editing State
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [permissions, setPermissions] = useState<CustomRolePermission[]>(INITIAL_SUB_FUNCTIONS);

  if (!currentUser) return null;
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  // Handle Logo File Upload (converting file to Data URL)
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings({
      morningPunchInThreshold: punchInTime,
      minDailyWorkingHours,
      lateArrivalFlagLimit: Number(lateArrivalFlagLimit),
      currencySymbol,
      currencyCode,
      totalPaidLeavePerYear: Number(totalPaidLeavePerYear),
      smtpConfig: { host: smtpHost, port: Number(smtpPort), user: smtpUser, pass: smtpPass },
      companyInfo: { name: compName, logoUrl: compLogo, email: compEmail, phone: compPhone },
      themeConfig: {
        fontFamily,
        headingFontSize,
        bodyFontSize,
        primaryColor,
        accentColor,
        darkColor,
        headingColor,
        bodyColor,
        buttonPrimaryColor: btnPrimaryColor,
        buttonHoverColor: btnHoverColor,
        buttonTextColor: btnTextColor
      },
      dateFormat,
      timeFormat,
      maxConsecutiveLeaveGroup: Number(maxLeaveGroup),
      sandwichRule: { enabled: sandwichEnabled, conditionText: sandwichCondition },
      probationPaidLeaveEligibilityMonths: probationMonths,
      minNoticeDaysRequired: minNoticeDays
    });

    setSavedMessage('Global system configurations and typography settings saved successfully!');
    setTimeout(() => setSavedMessage(''), 4000);
  };

  const toggleSubFunctionPermission = (
    moduleKey: CustomRolePermission['module'],
    subKey: string,
    field: keyof Omit<SubFunctionPermission, 'key' | 'label'>
  ) => {
    setPermissions(prev =>
      prev.map(p => {
        if (p.module === moduleKey) {
          return {
            ...p,
            subFunctions: p.subFunctions.map(sf =>
              sf.key === subKey ? { ...sf, [field]: !sf[field] } : sf
            )
          };
        }
        return p;
      })
    );
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    if (editingRoleId) {
      editCustomRole(editingRoleId, {
        name: roleName,
        description: roleDesc,
        permissions
      });
    } else {
      addCustomRole({
        name: roleName,
        description: roleDesc,
        permissions
      });
    }

    setRoleName('');
    setRoleDesc('');
    setEditingRoleId(null);
    setShowRoleModal(false);
  };

  const openCreateRole = () => {
    setEditingRoleId(null);
    setRoleName('');
    setRoleDesc('');
    setPermissions(INITIAL_SUB_FUNCTIONS);
    setShowRoleModal(true);
  };

  const openEditRole = (role: CustomRole) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleDesc(role.description);
    setPermissions(role.permissions.length > 0 ? role.permissions : INITIAL_SUB_FUNCTIONS);
    setShowRoleModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header (Top Right Role Button REMOVED as requested) */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-brand-500" /> Web Admin & Super Master Controls
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Configure logo upload, typography, button colors, SMTP, Sandwich rules, and 3-level sub-function role permissions.
        </p>
      </div>

      {!isSuperAdmin && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center space-x-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Restricted Configuration Area</p>
            <p className="text-amber-800">
              Only <strong>Super Master Admin</strong> has rights to modify system configurations, logo uploads, and custom role permissions.
            </p>
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="border-b border-zinc-200 flex items-center space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'settings' ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Super Admin Global Configuration
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'roles' ? 'border-brand-500 text-brand-600 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Role & Sub-Function Matrix ({customRoles.length})
        </button>
      </div>

      {/* Tab 1: Global Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          
          {savedMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{savedMessage}</span>
            </div>
          )}

          {/* Company Branding & Dual Logo Upload (File & URL) */}
          <div className="card-clean p-5 space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2">
              <Building className="w-4 h-4 text-brand-500" /> Company Profile & Dual Logo Upload (File / URL)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Company Name</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-bold"
                />
              </div>

              {/* Logo Upload: Dual Option (File Picker & URL) */}
              <div className="space-y-2">
                <label className="font-bold text-zinc-700 block">Company Logo (Upload File or Enter URL)</label>
                <div className="flex items-center space-x-3">
                  {compLogo ? (
                    <img src={compLogo} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-zinc-300 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 flex items-center justify-center text-zinc-500 font-bold text-xs">Logo</div>
                  )}

                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      placeholder="Paste Image Logo URL..."
                      value={compLogo}
                      onChange={(e) => setCompLogo(e.target.value)}
                      className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs"
                    />

                    <div className="flex items-center space-x-2">
                      <label className="px-3 py-1 bg-zinc-800 hover:bg-black text-white text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!isSuperAdmin}
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-zinc-400">Supports PNG, JPG, WebP</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Official Support Email</label>
                <input
                  type="email"
                  disabled={!isSuperAdmin}
                  value={compEmail}
                  onChange={(e) => setCompEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={compPhone}
                  onChange={(e) => setCompPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50"
                />
              </div>
            </div>
          </div>

          {/* Currency Configuration */}
          <div className="card-clean p-5 space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2">
              <Sliders className="w-4 h-4 text-brand-500" /> Currency & Localization
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Currency Symbol</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-bold"
                  placeholder="e.g. $, ₹, €, £"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Currency Code</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-bold uppercase"
                  placeholder="e.g. USD, INR, EUR, GBP"
                />
              </div>
            </div>
          </div>

          {/* Typography & Font Sizes */}
          <div className="card-clean p-5 space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2">
              <Type className="w-4 h-4 text-brand-500" /> Standard Typography & Font Sizing
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Font Family Face</label>
                <select
                  disabled={!isSuperAdmin}
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value as any)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl font-bold bg-zinc-50"
                >
                  <option value="Inter">Inter (Modern Clean)</option>
                  <option value="Roboto">Roboto (Google Standard)</option>
                  <option value="Poppins">Poppins (Geometric)</option>
                  <option value="Outfit">Outfit (Futuristic)</option>
                  <option value="system-ui">System UI Default</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Headings Font Size</label>
                <select
                  disabled={!isSuperAdmin}
                  value={headingFontSize}
                  onChange={(e) => setHeadingFontSize(e.target.value as any)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50"
                >
                  <option value="sm">Small (18px)</option>
                  <option value="md">Medium (22px)</option>
                  <option value="lg">Large Standard (24px)</option>
                  <option value="xl">Extra Large (28px)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Body Content Font Size</label>
                <select
                  disabled={!isSuperAdmin}
                  value={bodyFontSize}
                  onChange={(e) => setBodyFontSize(e.target.value as any)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50"
                >
                  <option value="xs">Extra Small (12px)</option>
                  <option value="sm">Small (13px)</option>
                  <option value="base">Base (14px)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Theme Colors & Button Color Palette */}
          <div className="card-clean p-5 space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2">
              <Palette className="w-4 h-4 text-brand-500" /> Theme Colors & Custom Button Styling (Max 3 Colors)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Primary Color</label>
                <input
                  type="color"
                  disabled={!isSuperAdmin}
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full h-10 p-1 border border-zinc-200 rounded-xl cursor-pointer"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Accent Color</label>
                <input
                  type="color"
                  disabled={!isSuperAdmin}
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-full h-10 p-1 border border-zinc-200 rounded-xl cursor-pointer"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Dark Obsidian Color</label>
                <input
                  type="color"
                  disabled={!isSuperAdmin}
                  value={darkColor}
                  onChange={(e) => setDarkColor(e.target.value)}
                  className="w-full h-10 p-1 border border-zinc-200 rounded-xl cursor-pointer"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Heading Text Color</label>
                <input
                  type="color"
                  disabled={!isSuperAdmin}
                  value={headingColor}
                  onChange={(e) => setHeadingColor(e.target.value)}
                  className="w-full h-10 p-1 border border-zinc-200 rounded-xl cursor-pointer"
                />
              </div>
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Content Text Color</label>
                <input
                  type="color"
                  disabled={!isSuperAdmin}
                  value={bodyColor}
                  onChange={(e) => setBodyColor(e.target.value)}
                  className="w-full h-10 p-1 border border-zinc-200 rounded-xl cursor-pointer"
                />
              </div>
            </div>

            {/* Button Styling Options */}
            <div className="pt-3 border-t border-zinc-100 space-y-2">
              <h4 className="font-bold text-zinc-900 text-xs">Button Colors Options</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Button Primary Color</label>
                  <input
                    type="color"
                    disabled={!isSuperAdmin}
                    value={btnPrimaryColor}
                    onChange={(e) => setBtnPrimaryColor(e.target.value)}
                    className="w-full h-9 p-1 border border-zinc-200 rounded-xl cursor-pointer"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Button Hover Color</label>
                  <input
                    type="color"
                    disabled={!isSuperAdmin}
                    value={btnHoverColor}
                    onChange={(e) => setBtnHoverColor(e.target.value)}
                    className="w-full h-9 p-1 border border-zinc-200 rounded-xl cursor-pointer"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Button Text Color</label>
                  <input
                    type="color"
                    disabled={!isSuperAdmin}
                    value={btnTextColor}
                    onChange={(e) => setBtnTextColor(e.target.value)}
                    className="w-full h-9 p-1 border border-zinc-200 rounded-xl cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Attendance, Rules & Notice Days */}
          <div className="card-clean p-5 space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-2">
              <Clock className="w-4 h-4 text-brand-500" /> Attendance, Notice Days & Leave Eligibility Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Total Paid Leave / Year *</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  required
                  disabled={!isSuperAdmin}
                  value={totalPaidLeavePerYear}
                  onChange={(e) => setTotalPaidLeavePerYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-bold focus:border-brand-500"
                />
                <p className="text-[10px] text-zinc-400 mt-0.5">Annual paid leave days</p>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Min Daily Working HRs</label>
                <input
                  type="text"
                  placeholder="08:00"
                  pattern="[0-9]{1,2}:[0-9]{2}"
                  disabled={!isSuperAdmin}
                  value={minDailyWorkingHours}
                  onChange={(e) => setMinDailyWorkingHours(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-mono font-bold focus:border-brand-500"
                />
                <p className="text-[10px] text-zinc-400 mt-0.5">Format: HH:MM (e.g. 08:00)</p>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Latest Punch-In Threshold</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={punchInTime}
                  onChange={(e) => setPunchInTime(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-mono font-bold"
                />
                <p className="text-[10px] text-zinc-400 mt-0.5">e.g. 09:30 AM</p>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Late Arrival Flag</label>
                <select
                  disabled={!isSuperAdmin}
                  value={lateArrivalFlagLimit}
                  onChange={(e) => setLateArrivalFlagLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl font-bold bg-zinc-50 focus:border-brand-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Time' : 'Times'} Allowed
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-400 mt-0.5">Threshold before penalty</p>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Min Days Before Leave</label>
                <select
                  disabled={!isSuperAdmin}
                  value={minNoticeDays}
                  onChange={(e) => setMinNoticeDays(Number(e.target.value) as any)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl font-bold bg-zinc-50"
                >
                  <option value={3}>3 Days Advance Notice</option>
                  <option value={5}>5 Days Advance Notice</option>
                  <option value={10}>10 Days Advance Notice</option>
                  <option value={15}>15 Days Advance Notice</option>
                  <option value={25}>25 Days Advance Notice</option>
                  <option value={30}>30 Days Advance Notice</option>
                </select>
                <p className="text-[10px] text-zinc-400 mt-0.5">Notice requirement</p>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Probation Leave Eligibility</label>
                <select
                  disabled={!isSuperAdmin}
                  value={probationMonths}
                  onChange={(e) => setProbationMonths(Number(e.target.value) as any)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl font-bold bg-zinc-50"
                >
                  <option value={3}>3 Months Probation</option>
                  <option value={6}>6 Months Probation</option>
                  <option value={9}>9 Months Probation</option>
                  <option value={12}>12 Months Probation</option>
                </select>
                <p className="text-[10px] text-zinc-400 mt-0.5">Probation period</p>
              </div>
            </div>
          </div>

          {/* Save Configurations */}
          {isSuperAdmin && (
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold shadow-glow-orange cursor-pointer flex items-center space-x-2 transition-all text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save All Super Admin Configurations</span>
              </button>
            </div>
          )}

        </form>
      )}

      {/* Tab 2: Role & 3-Level Sub-Function Permission Matrix */}
      {activeTab === 'roles' && (
        <div className="card-clean p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-brand-500" /> Custom Roles & 3-Level Sub-Function Permissions
              </h3>
              <p className="text-xs text-zinc-500">Edit or delete existing roles and manage sub-function access</p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={openCreateRole}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-glow-orange cursor-pointer flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Custom Role</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {customRoles.map((r) => (
              <div key={r.id} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-900">{r.name}</h4>
                    <p className="text-[10px] text-zinc-500">Created: {formatDate(r.createdDate)}</p>
                  </div>
                  
                  {isSuperAdmin && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditRole(r)}
                        className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg cursor-pointer"
                        title="Edit Custom Role"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      
                      {r.id !== 'role-super-admin' && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete role "${r.name}"?`)) {
                              deleteCustomRole(r.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-100 rounded-lg cursor-pointer"
                          title="Delete Role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-zinc-600">{r.description}</p>

                <div className="pt-2 border-t border-zinc-200 space-y-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Sub-Function Controls:</p>
                  <div className="flex flex-wrap gap-1">
                    {r.permissions.map((p) => (
                      <span key={p.module} className="px-2 py-0.5 rounded text-[9px] font-bold bg-white border border-zinc-200 text-zinc-800">
                        {p.moduleLabel} ({p.subFunctions.length} sub-pages)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Creation / Editing Modal with 3-Level Sub-Function Matrix */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-500" />
                {editingRoleId ? 'Edit Custom Role & Sub-Function Permissions' : 'Create Custom Role & Sub-Function Permissions'}
              </h3>
              <button onClick={() => setShowRoleModal(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Role Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead QA & Performance Auditor"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Role Description</label>
                <textarea
                  rows={2}
                  placeholder="Define responsibilities..."
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl focus:border-brand-500"
                />
              </div>

              {/* 3-Level Sub-Function Granular Matrix */}
              <div className="space-y-3">
                <h4 className="font-bold text-zinc-900 border-b border-zinc-100 pb-1 flex items-center justify-between">
                  <span>3-Level Sub-Function Permission Control Matrix</span>
                  <span className="text-[10px] text-zinc-500 font-normal">View / Create / Edit / Delete per Sub-Page</span>
                </h4>

                <div className="space-y-3">
                  {permissions.map((mod) => (
                    <div key={mod.module} className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/50">
                      <div className="bg-zinc-100 p-2.5 font-bold text-zinc-900 text-xs border-b border-zinc-200 flex items-center justify-between">
                        <span>{mod.moduleLabel}</span>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded text-zinc-600 border border-zinc-200 uppercase">
                          {mod.module}
                        </span>
                      </div>

                      <table className="w-full text-left text-xs bg-white">
                        <thead className="bg-zinc-50 border-b border-zinc-200 font-bold uppercase text-[9px] text-zinc-500">
                          <tr>
                            <th className="p-2">Sub-Page / Sub-Function</th>
                            <th className="p-2 text-center">Access</th>
                            <th className="p-2 text-center">View</th>
                            <th className="p-2 text-center">Create</th>
                            <th className="p-2 text-center">Edit</th>
                            <th className="p-2 text-center">Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {mod.subFunctions.map((sf) => (
                            <tr key={sf.key}>
                              <td className="p-2 font-medium text-zinc-800">{sf.label}</td>
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={sf.canAccess}
                                  onChange={() => toggleSubFunctionPermission(mod.module, sf.key, 'canAccess')}
                                  className="accent-brand-500 cursor-pointer"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={sf.canView}
                                  onChange={() => toggleSubFunctionPermission(mod.module, sf.key, 'canView')}
                                  className="accent-brand-500 cursor-pointer"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={sf.canCreate}
                                  onChange={() => toggleSubFunctionPermission(mod.module, sf.key, 'canCreate')}
                                  className="accent-brand-500 cursor-pointer"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={sf.canEdit}
                                  onChange={() => toggleSubFunctionPermission(mod.module, sf.key, 'canEdit')}
                                  className="accent-brand-500 cursor-pointer"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={sf.canDelete}
                                  onChange={() => toggleSubFunctionPermission(mod.module, sf.key, 'canDelete')}
                                  className="accent-brand-500 cursor-pointer"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowRoleModal(false)} className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-500 text-white font-bold rounded-xl cursor-pointer shadow-glow-orange">
                  Save Role & Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
