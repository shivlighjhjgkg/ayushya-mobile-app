// app/index.tsx
import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import AQI from './(tabs)/aqi';
import Dashboard from './(tabs)/dashboard';
import Family from './(tabs)/family';
import More from './(tabs)/more';
import Pairing from './(tabs)/pairing';
import Recs from './(tabs)/recs';
import Satmya from './(tabs)/satmya';
import Hero from './hero';
import Quiz from './quiz';
import Result from './result';
import Login from './login';
import Register from './register';
import { useAuth } from '../utils/authContext';
import { initDatabase } from '../utils/database';

type Screen = 'hero' | 'quiz' | 'result' | 'app' | 'login' | 'register';
type Tab = 'dash' | 'recs' | 'satmya' | 'pairing' | 'aqi' | 'family' | 'more';

interface Dosha {
  vata: number;
  pitta: number;
  kapha: number;
}

export default function Index() {
  const { user, isLoading } = useAuth();
  const [screen, setScreen] = useState<Screen>('hero');
  const [tab, setTab] = useState<Tab>('dash');
  const [dosha, setDosha] = useState<Dosha>({ vata: 60, pitta: 25, kapha: 15 });

  // Initialize database on app start
  useEffect(() => {
    initDatabase();
  }, []);

  // Load dosha from user profile when user changes
  useEffect(() => {
    if (user?.quizCompleted && user?.dosha) {
      setDosha(user.dosha);
    }
  }, [user?.dosha, user?.quizCompleted]);

  // Reset screen and tab when user logs out
  useEffect(() => {
    if (!user) {
      setScreen('login');
      setTab('dash');
    }
  }, [user]);

  // If loading auth state, show nothing
  if (isLoading) {
    return null;
  }

  // If not logged in, show login/register screens
  if (!user) {
    if (screen === 'login') {
      return <Login onLoginSuccess={() => setScreen('hero')} onSwitchToRegister={() => setScreen('register')} />;
    }
    if (screen === 'register') {
      return <Register onRegisterSuccess={() => setScreen('login')} onSwitchToLogin={() => setScreen('login')} />;
    }
    return <Login onLoginSuccess={() => setScreen('hero')} onSwitchToRegister={() => setScreen('register')} />;
  }

  // User is logged in, check if quiz is completed
  if (!user.quizCompleted) {
    // User hasn't completed quiz yet, show quiz flow
    if (screen === 'hero') return <Hero onStart={() => setScreen('quiz')} />;
    if (screen === 'quiz') return <Quiz onDone={(d: Dosha) => { setDosha(d); setScreen('result'); }} />;
    if (screen === 'result') return <Result dosha={dosha} onContinue={() => setScreen('app')} />;
  } else {
    // Quiz already completed, skip straight to app
    if (screen !== 'app') {
      setScreen('app');
    }
  }

  // Show the main app
  const renderTab = () => {
    switch (tab) {
      case 'dash':    return <Dashboard dosha={dosha} onNav={(t: string) => setTab(t as Tab)} />;
      case 'recs':    return <Recs />;
      case 'satmya':  return <Satmya />;
      case 'pairing': return <Pairing dosha={dosha} />;
      case 'aqi':     return <AQI />;
      case 'family':  return <Family />;
      case 'more':    return <More dosha={dosha} onLogout={() => setScreen('login')} />;
      default:        return null;
    }
  };

  return (
    <AppLayout activeTab={tab} setActiveTab={(t: string) => setTab(t as Tab)}>
      {renderTab()}
    </AppLayout>
  );
}