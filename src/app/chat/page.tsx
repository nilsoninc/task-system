'use client';

import React, { useState } from 'react';
import { useSystem } from '@/context/SystemContext';
import {
  MessageSquare,
  Send,
  Paperclip,
  Search,
  Hash,
  Lock,
  UserCheck,
  Circle,
  FileText
} from 'lucide-react';

export default function ChatPage() {
  const {
    currentUser,
    users,
    chatChannels,
    chatMessages,
    sendMessage
  } = useSystem();

  const [activeChannelId, setActiveChannelId] = useState<string>('chan-general');
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<string>('');

  if (!currentUser) return null;

  // Filter messages
  const currentMessages = chatMessages.filter(m => {
    if (activeRecipientId) {
      // DM conversation
      return (
        (m.senderId === currentUser.id && m.recipientId === activeRecipientId) ||
        (m.senderId === activeRecipientId && m.recipientId === currentUser.id)
      );
    } else {
      // Channel conversation
      return m.channelId === activeChannelId;
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachment) return;

    sendMessage(
      inputText,
      activeRecipientId ? undefined : activeChannelId,
      activeRecipientId ? activeRecipientId : undefined,
      attachment || undefined
    );

    setInputText('');
    setAttachment('');
  };

  const activeChannel = chatChannels.find(c => c.id === activeChannelId);
  const activeRecipient = users.find(u => u.id === activeRecipientId);

  return (
    <div className="card-clean h-[calc(100vh-140px)] flex overflow-hidden">
      
      {/* Sidebar: Channels & Direct Messages */}
      <div className="w-64 bg-zinc-900 text-white border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-500" /> Internal Chat
          </h2>
          <span className="text-[10px] bg-brand-500 text-white px-2 py-0.5 rounded-full font-bold">PRO</span>
        </div>

        <div className="flex-1 p-3 space-y-4 overflow-y-auto">
          {/* Channels Section */}
          <div>
            <p className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Team Channels</p>
            <div className="space-y-1">
              {chatChannels.map(chan => {
                const isSelected = !activeRecipientId && activeChannelId === chan.id;
                return (
                  <button
                    key={chan.id}
                    onClick={() => {
                      setActiveChannelId(chan.id);
                      setActiveRecipientId(null);
                    }}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected ? 'bg-brand-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {chan.isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
                    <span className="truncate">{chan.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div>
            <p className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Direct Messages</p>
            <div className="space-y-1">
              {users.filter(u => u.id !== currentUser.id).map(u => {
                const isSelected = activeRecipientId === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => setActiveRecipientId(u.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isSelected ? 'bg-brand-500 text-white font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <div className="relative">
                        <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                        <span className={`absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full ${
                          u.isLoggedIn ? 'bg-emerald-500' : 'bg-zinc-500'
                        }`} />
                      </div>
                      <span className="truncate">{u.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Feed */}
      <div className="flex-1 flex flex-col bg-white">
        
        {/* Chat Feed Header */}
        <div className="px-6 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center space-x-3">
            {activeRecipientId ? (
              <>
                <img src={activeRecipient?.avatar} alt={activeRecipient?.name} className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">{activeRecipient?.name}</h3>
                  <p className="text-[10px] text-zinc-500">{activeRecipient?.title}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                  #
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">#{activeChannel?.name}</h3>
                  <p className="text-[10px] text-zinc-500">{activeChannel?.description}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {currentMessages.length === 0 ? (
            <div className="py-20 text-center text-zinc-400">
              <MessageSquare className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
              <p className="text-xs">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            currentMessages.map(m => {
              const isMe = m.senderId === currentUser.id;
              return (
                <div key={m.id} className={`flex items-start space-x-3 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <img src={m.senderAvatar} alt={m.senderName} className="w-8 h-8 rounded-full object-cover mt-0.5" />
                  <div className={`max-w-md space-y-1 ${isMe ? 'items-end text-right' : ''}`}>
                    <div className="flex items-center space-x-2 text-[10px] text-zinc-400">
                      <span className="font-bold text-zinc-700">{m.senderName}</span>
                      <span>• {m.timestamp}</span>
                    </div>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe ? 'bg-brand-500 text-white rounded-tr-none' : 'bg-zinc-100 text-zinc-800 rounded-tl-none'
                    }`}>
                      {m.text}
                      {m.attachment && (
                        <div className={`mt-2 p-2 rounded-xl flex items-center space-x-2 text-[11px] font-bold ${
                          isMe ? 'bg-black/20 text-white' : 'bg-white text-zinc-800 border border-zinc-200'
                        }`}>
                          <FileText className="w-4 h-4" />
                          <span>{m.attachment.name} ({m.attachment.size})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center space-x-3">
          <input
            type="text"
            placeholder={activeRecipientId ? `Message ${activeRecipient?.name}...` : `Message #${activeChannel?.name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-brand-500"
          />

          <button
            type="button"
            onClick={() => setAttachment('Project_Spec_Document.pdf')}
            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
              attachment ? 'bg-brand-100 text-brand-700 border-brand-300' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-100'
            }`}
            title="Attach File"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="submit"
            className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-glow-orange cursor-pointer flex items-center space-x-1.5 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>

      </div>
    </div>
  );
}
