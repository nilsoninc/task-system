import React, { useState, useEffect } from 'react';
import { UserProfile, EmergencyContact } from '@/lib/types';
import { useSystem } from '@/context/SystemContext';
import { X, UserPlus, Save, Trash2, ShieldCheck, Mail, Phone, MapPin, Calendar, HeartPulse } from 'lucide-react';

interface UserFormModalProps {
  user?: UserProfile | null;
  onClose: () => void;
  onSave: () => void;
}

export default function UserFormModal({ user, onClose, onSave }: UserFormModalProps) {
  const { addUser, updateUser, deleteUser, customRoles, teams } = useSystem();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE' as UserProfile['role'],
    customRoleId: '',
    teamId: '',
    title: '',
    joiningDate: new Date().toISOString().split('T')[0],
    birthDate: '1990-01-01',
    phone: '',
    address: '',
    password: '',
    basicSalary: 0,
    hra: 0,
    specialAllowance: 0,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  });
  
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: '1', name: '', relationship: '', phone: '' },
    { id: '2', name: '', relationship: '', phone: '' }
  ]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email, // email is the username
        role: user.role,
        customRoleId: user.customRoleId || '',
        teamId: user.teamId || '',
        title: user.title,
        joiningDate: user.joiningDate || new Date().toISOString().split('T')[0],
        birthDate: user.birthDate || '1990-01-01',
        phone: user.phone || '',
        address: user.address || '',
        password: '',
        basicSalary: user.salary.basic,
        hra: user.salary.hra,
        specialAllowance: user.salary.specialAllowance,
        avatar: user.avatar || '',
      });
      if (user.emergencyContacts && user.emergencyContacts.length > 0) {
        setEmergencyContacts([
          user.emergencyContacts[0] || { id: '1', name: '', relationship: '', phone: '' },
          user.emergencyContacts[1] || { id: '2', name: '', relationship: '', phone: '' }
        ]);
      }
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (index: number, field: keyof EmergencyContact, value: string) => {
    const newContacts = [...emergencyContacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setEmergencyContacts(newContacts);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty emergency contacts
    const filteredContacts = emergencyContacts.filter(c => c.name && c.phone);
    
    const salary = {
      basic: Number(formData.basicSalary),
      hra: Number(formData.hra),
      specialAllowance: Number(formData.specialAllowance),
      effectiveDate: new Date().toISOString().split('T')[0],
      increments: user ? user.salary.increments : []
    };
    
    if (user) {
      updateUser(user.id, {
        name: formData.name,
        title: formData.title,
        role: formData.role,
        customRoleId: formData.customRoleId || undefined,
        teamId: formData.teamId || undefined,
        phone: formData.phone,
        address: formData.address,
        birthDate: formData.birthDate,
        joiningDate: formData.joiningDate,
        avatar: formData.avatar,
        salary,
        emergencyContacts: filteredContacts,
        password: formData.password ? formData.password : undefined
      });
    } else {
      addUser({
        name: formData.name,
        email: formData.email, // email as username
        title: formData.title,
        role: formData.role,
        customRoleId: formData.customRoleId || undefined,
        teamId: formData.teamId || undefined,
        phone: formData.phone,
        address: formData.address,
        birthDate: formData.birthDate,
        joiningDate: formData.joiningDate,
        avatar: formData.avatar,
        salary,
        emergencyContacts: filteredContacts,
        password: formData.password || undefined
      });
    }
    onSave();
  };
  
  const handleDelete = () => {
    if (user && window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      deleteUser(user.id);
      onSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-zinc-100 p-6 flex-shrink-0">
          <h3 className="font-bold text-xl text-zinc-900 flex items-center gap-2">
            {user ? <ShieldCheck className="w-6 h-6 text-brand-500" /> : <UserPlus className="w-6 h-6 text-brand-500" />}
            {user ? `Edit User: ${user.name}` : 'Add New Employee'}
          </h3>
          <div className="flex items-center space-x-2">
            {user && (
              <button type="button" onClick={handleDelete} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl cursor-pointer" title="Delete User">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form id="userForm" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Section: Basic Info */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-4">
            <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2 mb-2">
              <UserPlus className="w-4 h-4 text-brand-500" /> Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Full Name *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Username (Email) *</label>
                <input type="email" name="email" required disabled={!!user} value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500 disabled:bg-zinc-100" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">{user ? 'Reset Password' : 'Password *'}</label>
                <input type="password" name="password" required={!user} value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500" placeholder={user ? "Leave blank to keep current" : "Set initial password"} />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">System Role *</label>
                <select name="role" required value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500 bg-white">
                  <option value="EMPLOYEE">Employee</option>
                  <option value="TEAM_LEADER">Team Leader</option>
                  <option value="ADMIN_HR">Admin / HR</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Custom Role (Optional)</label>
                <select name="customRoleId" value={formData.customRoleId} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500 bg-white">
                  <option value="">None (Use System Role Defaults)</option>
                  {customRoles.map(cr => (
                    <option key={cr.id} value={cr.id}>{cr.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Assigned Team (Optional)</label>
                <select name="teamId" value={formData.teamId} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500 bg-white">
                  <option value="">No Team Assigned</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Job Designation *</label>
                <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500" />
              </div>
            </div>
          </div>

          {/* Section: Personal Info */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-4">
            <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-brand-500" /> Personal & Contact Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Joining Date *</label>
                <input type="date" name="joiningDate" required value={formData.joiningDate} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Date of Birth *</label>
                <input type="date" name="birthDate" required value={formData.birthDate} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Mobile Phone *</label>
                <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500" />
              </div>
              <div className="lg:col-span-3">
                <label className="text-xs font-bold text-zinc-700 block mb-1">Residential Address *</label>
                <input type="text" name="address" required value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500" />
              </div>
              <div className="lg:col-span-3">
                <label className="text-xs font-bold text-zinc-700 block mb-1">Avatar / Photo URL</label>
                <input type="url" name="avatar" value={formData.avatar} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500" />
              </div>
            </div>
          </div>
          
          {/* Section: Emergency Contacts */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-4">
            <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2 mb-2">
              <HeartPulse className="w-4 h-4 text-brand-500" /> Family / Emergency Contacts
            </h4>
            <div className="space-y-4">
              {emergencyContacts.map((contact, index) => (
                <div key={contact.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-white border border-zinc-200 rounded-lg">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Contact {index + 1} Name</label>
                    <input type="text" value={contact.name} onChange={(e) => handleContactChange(index, 'name', e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500" placeholder="Family member name" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Relationship</label>
                    <input type="text" value={contact.relationship} onChange={(e) => handleContactChange(index, 'relationship', e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500" placeholder="e.g. Spouse, Parent" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">Mobile</label>
                    <input type="text" value={contact.phone} onChange={(e) => handleContactChange(index, 'phone', e.target.value)} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500" placeholder="Emergency phone number" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Salary */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-4">
            <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-brand-500" /> Salary Configuration (Monthly Gross)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Basic Salary *</label>
                <input type="number" name="basicSalary" required value={formData.basicSalary} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">HRA *</label>
                <input type="number" name="hra" required value={formData.hra} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Special Allowance *</label>
                <input type="number" name="specialAllowance" required value={formData.specialAllowance} onChange={handleChange} className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:border-brand-500" />
              </div>
            </div>
            <p className="text-xs text-zinc-500 font-medium pt-2 border-t border-zinc-200">
              Total Monthly Gross: <span className="font-bold text-zinc-900">{(Number(formData.basicSalary) + Number(formData.hra) + Number(formData.specialAllowance)).toLocaleString()}</span>
            </p>
          </div>
        </form>

        <div className="p-6 border-t border-zinc-100 flex justify-end space-x-3 bg-zinc-50 rounded-b-2xl flex-shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-zinc-600 hover:bg-zinc-200 rounded-xl cursor-pointer">
            Cancel
          </button>
          <button type="submit" form="userForm" className="px-5 py-2.5 text-sm font-bold bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-glow-orange cursor-pointer flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Employee Data
          </button>
        </div>
      </div>
    </div>
  );
}
