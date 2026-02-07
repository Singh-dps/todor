import { useState, useEffect } from 'react';
import type { TodoItem, Video } from '../types';

const STORAGE_KEY = 'yt-playlist-todos';

export const useTodos = () => {
    const [todos, setTodos] = useState<TodoItem[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }, [todos]);

    const addTodosFromVideos = (videos: Video[]) => {
        const newTodos: TodoItem[] = videos.map((video) => ({
            ...video,
            id: video.url, // Using URL as ID since it's unique enough for this context
            isCompleted: false,
            addedAt: Date.now(),
        }));

        // Merge updates: if video already exists, keep its status, otherwise add it.
        // For simplicity, we can just append new ones or replace entire list?
        // Plan said "input a playlist", usually implies replacing or adding to list.
        // Let's replace for now, or maybe ask user? 
        // I'll implement "replace" semantics for a new playlist load to be simple and clean.
        setTodos(newTodos);
    };

    const toggleTodo = (id: string) => {
        setTodos((prev) =>
            prev.map((todo) =>
                todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
            )
        );
    };

    const clearTodos = () => {
        setTodos([]);
    };

    const completedCount = todos.filter(t => t.isCompleted).length;
    const progress = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

    return {
        todos,
        addTodosFromVideos,
        toggleTodo,
        clearTodos,
        progress,
    };
};
