import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const TaskContext = createContext();

export function useTasks() {
    return useContext(TaskContext);
}

export function TaskProvider({ children, user }) {
    const getTodayDate = () => new Date().toISOString().split('T')[0];
    const [currentDate, setCurrentDate] = useState(getTodayDate());
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch tasks for the current user
    useEffect(() => {
        if (!user) return;

        const fetchTasks = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id);

            if (error) {
                console.error("Error fetching tasks:", error);
            } else {
                setTasks(data || []);
            }
            setLoading(false);
        };

        fetchTasks();

        // Optional: Real-time subscription could be added here
    }, [user]);

    const [activeFocusTask, setActiveFocusTask] = useState(null);

    const toggleTask = async (id) => {
        const taskToToggle = tasks.find(t => t.id === id);
        if (!taskToToggle) return;

        const updatedCompleted = !taskToToggle.completed;

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: updatedCompleted } : t));

        const { error } = await supabase
            .from('tasks')
            .update({ completed: updatedCompleted })
            .eq('id', id);

        if (error) {
            console.error("Error updating task:", error);
            // Rollback on error
            setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !updatedCompleted } : t));
        }
    };

    const enterFocusMode = (task) => {
        setActiveFocusTask(task);
    };

    const exitFocusMode = () => {
        setActiveFocusTask(null);
    };

    const addTask = async (taskData) => {
        const newTask = {
            ...taskData,
            user_id: user.id,
            completed: false,
            date: taskData.date || currentDate
        };

        const { data, error } = await supabase
            .from('tasks')
            .insert([newTask])
            .select()
            .single();

        if (error) {
            console.error("Error adding task:", error);
        } else if (data) {
            setTasks(prev => [...prev, data]);
        }
    };

    const rescheduleTask = async (id) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, date: tomorrowDate } : t));

        const { error } = await supabase
            .from('tasks')
            .update({ date: tomorrowDate })
            .eq('id', id);

        if (error) {
            console.error("Error rescheduling task:", error);
            // Rollback logic could be added here
        }
    };

    return (
        <TaskContext.Provider value={{ tasks, toggleTask, addTask, activeFocusTask, enterFocusMode, exitFocusMode, currentDate, setCurrentDate, rescheduleTask, user }}>
            {children}
        </TaskContext.Provider>
    );
}
