'use client';

import React, { useState } from 'react';
import { useSystem } from '@/context/SystemContext';
import { formatDate } from '@/lib/utils';
import {
  X,
  User,
  Mail,
  Lock,
  Camera,
  Shield,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  FileText,
  HeartHandshake
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUser, teams } = useSystem();

  const [activeTab, setActiveTab] = useState<'profile' | 'edit' | 'password'>('profile');

  // Edit fields
  const [personalEmail, setPersonalEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & Feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !currentUser) return null;

  const userTeam = teams.find(t => t.id === currentUser.teamId);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Image size should be under 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      updateUser(currentUser.id, {
        email: personalEmail.trim(),
        phone: phone.trim(),
        address: address.trim(),
        avatar: avatarUrl
      });
      setStatusMessage({ type: 'success', text: 'Profile details updated successfully!' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to update profile details.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setIsSaving(true);
    try {
      updateUser(currentUser.id, {
        password: newPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMessage({ type: 'success', text: 'Password changed successfully!' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to change password.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* Header with Avatar & Persona */}
        <div className="bg-gradient-to-r from-obsidian-950 to-zinc-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="relative group">
              <img
                src={avatarUrl || currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-500 shadow-lg"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Change Photo"
              >
                <Camera className="w-5 h-5" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-brand-500 text-white">
                  {currentUser.role.replace('_', ' ')}
                </span>
                <span className="text-xs text-zinc-400">ID: #{currentUser.id.slice(-6)}</span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-1">{currentUser.name}</h2>
              <p className="text-xs text-zinc-300">{currentUser.title} {userTeam ? `• ${userTeam.name}` : ''}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 mt-5 border-t border-white/10 pt-3 text-xs font-bold">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'profile' ? 'bg-brand-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              My Information
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'edit' ? 'bg-brand-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Edit Details & Photo
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'password' ? 'bg-brand-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`px-5 py-3 text-xs flex items-center gap-2 border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          
          {/* TAB 1: Complete User Info Overview */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Email Address</span>
                  <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-brand-500" /> {currentUser.email}
                  </span>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Contact Phone</span>
                  <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-brand-500" /> {currentUser.phone || 'Not specified'}
                  </span>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Joining Date</span>
                  <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-500" /> {formatDate(currentUser.joiningDate)}
                  </span>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Date of Birth</span>
                  <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-500" /> {formatDate(currentUser.birthDate)}
                  </span>
                </div>

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Residential Address</span>
                  <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" /> {currentUser.address || 'Not specified'}
                  </span>
                </div>
              </div>

              {/* Leave Balances */}
              <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-2">
                <p className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">Leave Balance Summary</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-lg border border-purple-200">
                    <p className="text-[10px] text-zinc-500 font-semibold">Paid Leave</p>
                    <p className="font-black text-sm text-purple-700">{currentUser.leaveBalance?.paid || 0} Available</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-200">
                    <p className="text-[10px] text-zinc-500 font-semibold">Comp-off</p>
                    <p className="font-black text-sm text-indigo-700">{currentUser.leaveBalance?.compOff || 0} Available</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-zinc-200">
                    <p className="text-[10px] text-zinc-500 font-semibold">Used Leaves</p>
                    <p className="font-black text-sm text-zinc-700">{currentUser.leaveBalance?.used || 0} Taken</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              {(currentUser.emergencyContacts || []).length > 0 && (
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                  <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-rose-500" /> Emergency Contacts
                  </p>
                  <div className="space-y-1.5">
                    {currentUser.emergencyContacts?.map((c, i) => (
                      <div key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-zinc-200">
                        <span className="font-bold text-zinc-800">{c.name} ({c.relationship})</span>
                        <span className="text-zinc-600 font-mono">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Edit Personal Details & Upload Photo */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                  Personal / System Email ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 rounded-xl focus:outline-none focus:border-brand-500"
                    placeholder="user@enterprise.com"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">This email is used for system logins and task notifications.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 rounded-xl focus:outline-none focus:border-brand-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                  Residential Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 rounded-xl focus:outline-none focus:border-brand-500"
                    placeholder="Street, City, State, ZIP"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                  Profile Photo
                </label>
                <div className="flex items-center space-x-3">
                  <img
                    src={avatarUrl || currentUser.avatar}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-zinc-300"
                  />
                  <div className="flex-1">
                    <input
                      type="file"
                      id="edit-avatar-upload"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="text-xs text-zinc-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                    />
                    <p className="text-[10px] text-zinc-400 mt-1">Recommended: Square JPG or PNG, max 2MB.</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-glow-orange cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Change Password */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md mx-auto py-2">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-0.5">
                <p className="font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-700" /> Password Security Guidelines
                </p>
                <p className="text-amber-800">Must be at least 6 characters. Use letters, numbers, and special symbols for stronger security.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 rounded-xl focus:outline-none focus:border-brand-500"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 rounded-xl focus:outline-none focus:border-brand-500"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-glow-orange cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">Penguin Peak PRO Enterprise Security</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
