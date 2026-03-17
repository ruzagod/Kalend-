import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import { TaskProvider } from './context/TaskContext'
import DailyPanel from './components/DailyPanel'
import FocusMode from './components/FocusMode'
import Auth from './components/Auth'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return <Auth />
  }

  return (
    <ErrorBoundary>
      <TaskProvider user={session.user}>
        <div className="p-4 md:p-8 bg-[#050505] text-gray-100 min-h-screen">
          <div className="container mx-auto max-w-6xl">
            <DailyPanel />
          </div>
          <FocusMode />
        </div>
      </TaskProvider>
    </ErrorBoundary>
  )
}

export default App
