import React, { useState } from 'react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (content: string) => { success: boolean; message?: string };
  isUnlocked: boolean;
  setIsUnlocked: (unlocked: boolean) => void;
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onFileUpload, isUnlocked, setIsUnlocked }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Pikachu') {
      setIsUnlocked(true);
      setError('');
      setPassword('');
    } else {
      setError('Incorrect password. Access denied.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(''); // Clear previous error
    const file = e.target.files?.[0];
    if (file && file.type === "application/json") {
      try {
        const content = await file.text();
        const result = onFileUpload(content);
        if (result.success) {
          onClose(); // Only close on success
        } else {
          setError(result.message || 'Failed to process file.');
        }
      } catch (err) {
        setError('Failed to read the file.');
      }
    } else {
      setError('Please select a valid .json file.');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900/80 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/10 w-full max-w-md p-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-cyan-400">Admin Panel</h2>
        {!isUnlocked ? (
          <form onSubmit={handlePasswordSubmit}>
            <p className="text-gray-300 mb-4">Enter the password to upload a knowledge base.</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Password"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300"
            >
              Authenticate
            </button>
          </form>
        ) : (
          <div>
            <p className="text-gray-300 mb-4">Upload a .json file to update the AI's knowledge base.</p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-cyan-800 file:text-cyan-200
                hover:file:bg-cyan-700
                cursor-pointer"
            />
             {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminModal;