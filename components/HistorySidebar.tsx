import React from 'react';
import { ChatMessage, MessageSender } from '../types';
import { PlusIcon, CloseIcon } from './icons';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  messages: ChatMessage[];
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, onNewChat, messages }) => {
  const chatMessages = messages.filter(m => m.sender === MessageSender.USER || m.sender === MessageSender.AI);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-800/30 p-4 border-r border-cyan-500/20">
        <button
          onClick={onNewChat}
          className="flex items-center justify-center gap-2 w-full mb-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300"
        >
          <PlusIcon />
          New Chat
        </button>
        <h2 className="text-lg font-semibold text-cyan-400 mb-4">Chat History</h2>
        <div className="flex-grow overflow-y-auto space-y-2">
            {chatMessages.length > 1 ? chatMessages.map(msg => {
                if(msg.sender === MessageSender.USER) {
                    return (
                        <div key={msg.id} className="p-2 text-sm text-gray-300 bg-gray-700/50 rounded-md truncate">
                            {msg.text}
                        </div>
                    )
                }
                return null;
            }) : (
                <div className="text-center text-gray-400 text-sm mt-8">
                    <p>Your conversation will be stored here.</p>
                </div>
            )}
        </div>
      </aside>
      
      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-cyan-500/30 p-4 z-50 transform transition-transform md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-cyan-400">History</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                <CloseIcon />
            </button>
        </div>
         <button
          onClick={onNewChat}
          className="flex items-center justify-center gap-2 w-full mb-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300"
        >
          <PlusIcon />
          New Chat
        </button>
        <div className="flex-grow overflow-y-auto space-y-2">
           {chatMessages.length > 1 ? chatMessages.map(msg => {
                if(msg.sender === MessageSender.USER) {
                    return (
                        <div key={msg.id} className="p-2 text-sm text-gray-300 bg-gray-700/50 rounded-md truncate">
                            {msg.text}
                        </div>
                    )
                }
                return null;
            }) : (
                <div className="text-center text-gray-400 text-sm mt-8">
                    <p>Your conversation will be stored here.</p>
                </div>
            )}
        </div>
      </aside>
    </>
  );
};

export default HistorySidebar;