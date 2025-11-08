import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, MessageSender } from './types';
import { getAiResponse, startNewChat, updateKnowledgeBase } from './services/geminiService';
import { BotIcon, UserIcon, SendIcon, MenuIcon, AdminIcon, ShieldIcon, CrosshairIcon, MapPinIcon, CarIcon } from './components/icons';
import HistorySidebar from './components/HistorySidebar';
import AdminModal from './components/AdminModal';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const ChatMessageContent = ({ text }: { text: string }) => {
    // Make rendering robust against non-string data from localStorage
    const safeText = String(text ?? '');
    const html = marked.parse(safeText, { breaks: true });
    const sanitizedHtml = DOMPurify.sanitize(html);
    return <div className="prose prose-invert prose-sm md:prose-base max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    try {
        const savedMessages = localStorage.getItem('chatHistory');
        if (savedMessages && savedMessages !== '[]') {
            setMessages(JSON.parse(savedMessages));
            setHasStartedChat(true);
        }
    } catch (error) {
        console.error("Failed to load chat history:", error);
        localStorage.removeItem('chatHistory');
    }
  }, []);

  useEffect(() => {
    if(messages.length > 0) {
        localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      text: messageText,
      sender: MessageSender.USER,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    if (!hasStartedChat) {
        setHasStartedChat(true);
    }
    
    try {
      const aiResponseText = await getAiResponse(messageText);
      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        text: aiResponseText,
        sender: MessageSender.AI,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        text: 'An error occurred. Please try again.',
        sender: MessageSender.SYSTEM,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
    setInput('');
  }

  const handleNewChat = () => {
    startNewChat();
    setMessages([]);
    localStorage.removeItem('chatHistory');
    setHasStartedChat(false);
    setIsSidebarOpen(false);
  };

  const handleFileUpload = (content: string): { success: boolean, message?: string } => {
    try {
      updateKnowledgeBase(content);
      setMessages([
        { id: Date.now(), text: "Knowledge base updated successfully. I'm ready to assist with the new information.", sender: MessageSender.SYSTEM },
      ]);
      setHasStartedChat(true);
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || "An unknown error occurred.";
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: `Error updating knowledge base: ${errorMessage}`, sender: MessageSender.SYSTEM },
      ]);
      return { success: false, message: errorMessage };
    }
  };

  const MessageIcon = ({ sender }: { sender: MessageSender }) => {
    const iconBase = "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2";
    switch (sender) {
      case MessageSender.AI:
        return <div className={`${iconBase} bg-gray-800 border-cyan-500`}><BotIcon /></div>;
      case MessageSender.USER:
        return <div className={`${iconBase} bg-gray-700 border-gray-500`}><UserIcon /></div>;
      case MessageSender.SYSTEM:
        return <div className={`${iconBase} bg-yellow-900/50 border-yellow-500`}><ShieldIcon className="w-5 h-5" /></div>;
      default: return null;
    }
  };
  
  const promptSuggestions = [
    { title: "Weapon Loadouts", icon: CrosshairIcon, prompt: "Suggest three elite weapon loadouts for Erangel, one for close-range, one for mid-range, and one for long-range.", color: "text-red-400" },
    { title: "Map Strategy", icon: MapPinIcon, prompt: "Give me a high-loot, high-risk drop strategy for Sosnovka Military Base.", color: "text-blue-400" },
    { title: "Vehicle Tactics", icon: CarIcon, prompt: "What are the best tactics for using a Dacia in the final circles?", color: "text-green-400" },
    { title: "Gear Priority", icon: ShieldIcon, prompt: "What is the priority for looting gear in the first 5 minutes of a match?", color: "text-yellow-400" },
  ];

  const LandingScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 z-10">
        <div className="absolute inset-0 bg-dots-pattern opacity-20"></div>
        <div className="relative bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-cyan-500/10">
            <h1 className="text-5xl font-bold text-cyan-400 mb-2">Tactical Terminal</h1>
            <p className="text-lg text-gray-300 mb-8">Welcome, soldier. I am The Conqueror. How can I give you the winning edge?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {promptSuggestions.map((item, index) => (
                    <button key={index} onClick={() => handleSend(item.prompt)} className="bg-gray-800/80 border border-gray-700 p-4 rounded-lg text-left hover:bg-cyan-900/50 hover:border-cyan-700 transition-all duration-300 group">
                        <div className="flex items-center gap-4">
                            <item.icon className={`w-8 h-8 ${item.color} transition-transform duration-300 group-hover:scale-110`} />
                            <div>
                                <h3 className="font-semibold text-white">{item.title}</h3>
                                <p className="text-sm text-gray-400">{item.prompt}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      <HistorySidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNewChat={handleNewChat} messages={messages} />
      <main className="flex-1 flex flex-col relative bg-gray-900">
         <div className="absolute inset-0 bg-dots-pattern opacity-10"></div>
        <header className="relative flex items-center justify-between p-4 border-b border-cyan-500/20 bg-gray-900/50 backdrop-blur-sm z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 rounded-md hover:bg-gray-700"><MenuIcon /></button>
          <h1 className="text-xl font-bold text-cyan-400 flex items-center gap-3">
            <CrosshairIcon className="w-7 h-7" /> The Conqueror
          </h1>
          <button onClick={() => setIsAdminModalOpen(true)} className="p-2 rounded-md hover:bg-gray-700"><AdminIcon /></button>
        </header>

        {!hasStartedChat ? <LandingScreen /> : (
            <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-4 max-w-4xl mx-auto ${msg.sender === MessageSender.USER ? 'flex-row-reverse' : 'flex-row'}`}>
                  <MessageIcon sender={msg.sender} />
                  <div className={`px-5 py-3 rounded-xl shadow-lg w-full ${
                      msg.sender === MessageSender.AI ? 'bg-gray-800/80 border border-gray-700'
                      : msg.sender === MessageSender.USER ? 'bg-cyan-900/70 border border-cyan-700'
                      : 'bg-yellow-900/50 border border-yellow-700'
                  }`}>
                    <ChatMessageContent text={msg.text} />
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-4 max-w-4xl mx-auto">
                  <MessageIcon sender={MessageSender.AI} />
                  <div className="px-5 py-3 rounded-xl shadow-lg bg-gray-800/80 border border-gray-700 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-0"></span>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-200"></span>
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-400"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="relative p-4 border-t border-cyan-500/20 bg-gray-900/50 backdrop-blur-sm z-10">
              <form onSubmit={handleFormSubmit} className="flex items-center gap-4 max-w-4xl mx-auto">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask The Conqueror..." className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" disabled={isLoading} />
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading || !input.trim()}><SendIcon /></button>
              </form>
            </div>
            </>
        )}

        <AdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} onFileUpload={handleFileUpload} isUnlocked={isUnlocked} setIsUnlocked={setIsUnlocked} />
      </main>
    </div>
  );
};

export default App;