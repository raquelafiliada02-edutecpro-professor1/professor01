import React, { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import PaymentPage from './components/PaymentPage';
import { UserProfile } from './types';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

type View = 'landing' | 'login' | 'dashboard' | 'payment';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile>('public');
  const [view, setView] = useState<View>('landing');
  const intendedViewRef = React.useRef<View | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
  const [userDataExpiracao, setUserDataExpiracao] = useState<string | null>(null);
  const [userStatusPagamento, setUserStatusPagamento] = useState<string | null>(null);

  const fetchUserProfile = async (userId: string) => {
    setIsInitializing(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('plano, status_pagamento, created_at, data_expiracao')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // User profile doesn't exist yet, gracefully default to free
        setCurrentProfile('free');
        setUserCreatedAt(new Date().toISOString());
        setUserDataExpiracao(null);
        if (intendedViewRef.current) {
          setView(intendedViewRef.current);
          intendedViewRef.current = null;
        } else {
          setView('dashboard');
        }
      } else {
        const matchedPlano = (data.plano as UserProfile) || 'free';
        setCurrentProfile(matchedPlano);
        setUserCreatedAt(data.created_at);
        setUserDataExpiracao(data.data_expiracao);
        setUserStatusPagamento(data.status_pagamento);

        const today = new Date().toISOString().split('T')[0];
        const isExpired = data.data_expiracao && data.data_expiracao < today;

        if (matchedPlano === 'pro') {
          const isPaid = data.status_pagamento === 'ativo' || data.status_pagamento === 'aprovado';
          const isTrial = data.status_pagamento === 'trial';
          
          if (!isPaid && isExpired) {
            // Trial ou Assinatura expirou e não foi paga
            if (isTrial) {
              alert("Seu período de teste grátis de 7 dias terminou. Para continuar acessando as ferramentas Pro, escolha uma forma de pagamento.");
              
              // REVERSÃO AUTOMÁTICA NO BANCO: Se o trial acabou e não pagou, volta para Free
              const { error: updateError } = await supabase
                .from('users')
                .update({ plano: 'free' })
                .eq('id', userId);
              
              if (updateError) console.error("Erro ao reverter plano:", updateError);
            } else {
              alert("Sua assinatura Pro expirou. Por favor, regularize seu pagamento para continuar.");
            }
            setView('payment');
          } else if (!isPaid && !isTrial && data.status_pagamento !== 'pendente') {
            // Caso não esteja pago, não seja trial e nem pendente (ex: erro no gateway)
            setCurrentProfile('free');
            setView('dashboard');
          } else {
            // Mantém no Pro se for trial ativo ou pago
            if (intendedViewRef.current) {
              setView(intendedViewRef.current);
              intendedViewRef.current = null;
            } else {
              setView('dashboard');
            }
          }
        } else {
          // Free plan
          if (intendedViewRef.current) {
            setView(intendedViewRef.current);
            intendedViewRef.current = null;
          } else {
            setView('dashboard');
          }
        }
      }
    } catch (err) {
      console.error(err);
      setCurrentProfile('free');
      setView(prev => intendedViewRef.current || (prev === 'payment' ? 'payment' : 'dashboard'));
      intendedViewRef.current = null;
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setIsInitializing(false);
      }
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentProfile('public');
        setView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (role: UserProfile) => {
    // We keep this signature for LoginPage to pass down the role initially, 
    // but the actual view change is handled by onAuthStateChange event.
    setCurrentProfile(role);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // We map the outer login redirection to save intention if an explicit string is passed
  const handleGoToLogin = (intent?: View) => {
    if (intent) {
      intendedViewRef.current = intent;
    }
    setView('login');
  };

  const handleBackToLanding = () => {
    setView('landing');
  };

  const handleGoToDashboard = () => {
    setView('dashboard');
  };

  const handleGoToPayment = () => {
    setView('payment');
  };

  const handlePaymentSuccess = (newRole: UserProfile) => {
    setCurrentProfile(newRole);
    setView('dashboard');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="w-12 h-12 border-4 border-[#00A859]/20 border-t-[#00A859] rounded-full animate-spin" />
      </div>
    );
  }

  if (view === 'landing') {
    return <LandingPage
      onLogin={handleLogin}
      onGoToLogin={handleGoToLogin}
      onGoToPayment={handleGoToPayment}
      onGoToDashboard={handleGoToDashboard}
    />;
  }

  if (view === 'login') {
    return <LoginPage onLogin={handleLogin} onBack={handleBackToLanding} />;
  }

  if (view === 'payment') {
    return <PaymentPage
      onBack={handleBackToLanding}
      onSuccess={handlePaymentSuccess}
      onUnauthenticated={() => handleGoToLogin('payment')}
      userEmail={session?.user.email || ''}
    />;
  }

  return (
    <Dashboard
      userId={session?.user.id || ''}
      userEmail={session?.user.email || ''}
      role={currentProfile}
      onLogout={handleLogout}
      onGoToPayment={handleGoToPayment}
      userCreatedAt={userCreatedAt}
      userDataExpiracao={userDataExpiracao}
      statusPagamento={userStatusPagamento}
    />
  );
}
