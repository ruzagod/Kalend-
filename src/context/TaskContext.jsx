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
    const [calendars, setCalendars] = useState([]);
    const [activeCalendarId, setActiveCalendarId] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCalendars = async () => {
        if (!user) return;

        // Fetch calendars owned by user OR where user is a member
        const { data: memberData, error: memberError } = await supabase
            .from('calendar_members')
            .select('calendar_id')
            .eq('user_id', user.id);

        if (memberError) {
            console.error("Error fetching memberships:", memberError);
            return;
        }

        const calIds = memberData.map(m => m.calendar_id);

        if (calIds.length === 0) {
            setCalendars([]);
            return;
        }

        const { data: calData, error: calError } = await supabase
            .from('calendars')
            .select('*')
            .in('id', calIds)
            .order('created_at', { ascending: true });

        if (calError) {
            console.error("Error fetching calendars:", calError);
        } else {
            setCalendars(calData || []);
            // Set active calendar if none selected and calendars exist
            if (!activeCalendarId && calData && calData.length > 0) {
                setActiveCalendarId(calData[0].id);
            }
        }
    };

    useEffect(() => {
        fetchCalendars();
    }, [user]);

    // Fetch tasks for the active calendar
    useEffect(() => {
        if (!activeCalendarId) {
            setTasks([]);
            return;
        }

        const fetchTasks = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('calendar_id', activeCalendarId);

            if (error) {
                console.error("Error fetching tasks:", error);
            } else {
                setTasks(data || []);
            }
            setLoading(false);
        };

        fetchTasks();

        // Setup real-time subscription for the active calendar
        const channel = supabase.channel(`calendar-${activeCalendarId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: `calendar_id=eq.${activeCalendarId}`
                },
                (payload) => {
                    console.log('Realtime update received:', payload);

                    if (payload.eventType === 'INSERT') {
                        setTasks(prev => {
                            // Check if task already exists (e.g. from optimistic update)
                            if (prev.find(t => t.id === payload.new.id)) return prev;
                            return [...prev, payload.new];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
                    } else if (payload.eventType === 'DELETE') {
                        setTasks(prev => prev.filter(t => t.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeCalendarId]);

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

    const deleteTask = async (id) => {
        // Optimistic update
        setTasks(prev => prev.filter(t => t.id !== id));

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting task:", error);
            // In a real app, you'd want to rollback or refetch here
        }
    };

    const addTask = async (taskData) => {
        if (!activeCalendarId) return;

        const newTask = {
            ...taskData,
            calendar_id: activeCalendarId,
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
        <TaskContext.Provider value={{
            tasks, toggleTask, addTask, deleteTask, activeFocusTask, enterFocusMode, exitFocusMode,
            currentDate, setCurrentDate, rescheduleTask, user,
            calendars, activeCalendarId, setActiveCalendarId, fetchCalendars
        }}>
            {children}
        </TaskContext.Provider>
    );

}
