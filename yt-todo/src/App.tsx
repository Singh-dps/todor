import { useState } from 'react';
import Input from './components/Input';
import TodoItem from './components/TodoItem';
import ProgressBar from './components/ProgressBar';
import { useTodos } from './hooks/useTodos';
import { extractPlaylistId, fetchPlaylist, DEFAULT_API_BASE } from './services/api';
import type { Playlist } from './types';

function App() {
  const { todos, addTodosFromVideos, toggleTodo, clearTodos, progress } = useTodos();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [youtubeApiKey, setYoutubeApiKey] = useState(() => localStorage.getItem('yt-api-key') || '');
  const [showSettings, setShowSettings] = useState(false);

  const handleUrlSubmit = async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const id = extractPlaylistId(url);
      if (!id) {
        throw new Error('Invalid YouTube Playlist URL');
      }
      const data = await fetchPlaylist(id, apiBase, youtubeApiKey || undefined);
      setPlaylist(data);
      addTodosFromVideos(data.videos);
    } catch (err: any) {
      setError(err.message || 'Failed to load playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPlaylist('demo', apiBase);
      setPlaylist(data);
      addTodosFromVideos(data.videos);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = (key: string) => {
    setYoutubeApiKey(key);
    localStorage.setItem('yt-api-key', key);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 font-sans selection:bg-purple-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-900/0 to-gray-900/0 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 py-12 flex flex-col items-center gap-8">
        <header className="text-center space-y-2 relative w-full">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="absolute top-0 right-0 text-gray-500 hover:text-white transition-colors"
            title="Settings"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543 .826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
            TubeTodo
          </h1>
          <p className="text-gray-400 text-lg">Turn YouTube Playlists into Achievable Goals</p>
        </header>

        {showSettings && (
          <div className="w-full max-w-md bg-gray-800/50 p-4 rounded-lg border border-gray-700 animate-in fade-in slide-in-from-top-2 z-20 backdrop-blur-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">YouTube Data API Key (Recommended)</label>
              <input
                type="password"
                value={youtubeApiKey}
                onChange={(e) => saveApiKey(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm text-white focus:border-green-500 outline-none"
                placeholder="AIzaSy..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Get a free key from <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Google Cloud Console</a>. Enable "YouTube Data API v3".
              </p>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">Piped/Invidious Instance (Fallback)</label>
              <input
                type="text"
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm text-white focus:border-purple-500 outline-none"
                placeholder="https://pipedapi.kavin.rocks"
              />
              <p className="text-xs text-gray-500 mt-1">Used only if no YouTube API key is set.</p>
            </div>
          </div>
        )}

        {todos.length === 0 ? (
          <div className="w-full flex flex-col items-center gap-6 py-10">
            <Input onSubmit={handleUrlSubmit} isLoading={isLoading} />
            <button
              onClick={loadDemo}
              disabled={isLoading}
              className="text-sm text-gray-400 hover:text-purple-400 underline transition-colors"
            >
              Try with Demo Playlist
            </button>
            {!youtubeApiKey && (
              <p className="text-xs text-yellow-500/80 max-w-sm text-center">
                ⚠️ No YouTube API key set. Click Settings (⚙️) to add one for reliable playlist fetching.
              </p>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {playlist && (
              <div className="text-center space-y-1 mb-4">
                <h2 className="text-2xl font-semibold text-white">{playlist.title}</h2>
                <p className="text-sm text-gray-400">by {playlist.uploader}</p>
              </div>
            )}

            <div className="sticky top-0 z-10 bg-[#0f0f0f]/80 backdrop-blur-xl py-4 -mx-4 px-4 border-b border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-300">Progress</span>
                <span className="text-sm font-bold text-white">{Math.round(progress)}%</span>
              </div>
              <ProgressBar progress={progress} />
            </div>

            <div className="space-y-4">
              {todos.map((todo) => (
                <TodoItem key={todo.id} item={todo} onToggle={toggleTodo} />
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <button
                onClick={clearTodos}
                className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors border border-red-900/30 hover:border-red-500/50 rounded-lg bg-red-900/10 hover:bg-red-900/20"
              >
                Clear List & Start Over
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="fixed bottom-6 right-6 bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-5">
            <div className="font-bold mb-1">Error</div>
            {error}
          </div>
        )}

        {isLoading && todos.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-2 text-gray-400">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span>Fetching videos...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
