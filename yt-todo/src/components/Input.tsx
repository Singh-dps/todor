import React, { useState } from 'react';

interface InputProps {
    onSubmit: (url: string) => void;
    isLoading: boolean;
}

const Input: React.FC<InputProps> = ({ onSubmit, isLoading }) => {
    const [url, setUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onSubmit(url.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
            <div className="relative">
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste YouTube Playlist URL..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-200 text-white placeholder-gray-400 shadow-lg"
                    disabled={isLoading}
                />
            </div>
            <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transform active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Loading...' : 'Load Playlist'}
            </button>
        </form>
    );
};

export default Input;
