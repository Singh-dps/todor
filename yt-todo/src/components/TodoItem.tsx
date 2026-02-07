import React from 'react';
import type { TodoItem as TodoItemType } from '../types';

interface TodoItemProps {
    item: TodoItemType;
    onToggle: (id: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ item, onToggle }) => {
    return (
        <div
            className={`flex items-center gap-4 p-4 rounded-xl backdrop-blur-md transition-all duration-300 border ${item.isCompleted
                ? 'bg-gray-800/40 border-gray-700/50 opacity-75'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
        >
            <div className="relative flex-shrink-0">
                <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => onToggle(item.id)}
                    className="w-6 h-6 rounded-md border-2 border-gray-500 bg-transparent checked:bg-green-500 checked:border-green-500 transition-colors cursor-pointer appearance-none"
                />
                {item.isCompleted && (
                    <svg className="w-4 h-4 text-white absolute top-1 left-1 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>

            <div className="flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden relative shadow-md">
                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-1 right-1 bg-black/80 text-xs px-1 rounded text-white font-mono">
                    {formatDuration(item.duration)}
                </div>
            </div>

            <div className="flex-grow min-w-0">
                <a
                    href={`https://youtube.com${item.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-lg font-medium truncate block hover:text-blue-400 transition-colors ${item.isCompleted ? 'text-gray-500 line-through' : 'text-gray-100'}`}
                >
                    {item.title}
                </a>
                <p className="text-sm text-gray-400 mt-1">{item.uploader}</p>
            </div>
        </div>
    );
};

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export default TodoItem;
