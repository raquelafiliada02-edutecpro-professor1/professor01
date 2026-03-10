import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Star,
  Zap,
  FileText,
  Calendar,
  ClipboardList,
  BookOpen,
  Sparkles,
  Users,
  Accessibility,
  FileDown,
  LayoutDashboard,
  MessageSquare
} from 'lucide-react';
import { cn } from './lib/utils';
import { UserProfile } from './types';
import LandingNavbar from './components/layout/LandingNavbar';
import { supabase } from './lib/supabase';

interface LandingPageProps {
  onLogin: (role: UserProfile) => void;
  onGoToLogin: (intent?: 'payment' | 'dashboard') => void;
  onGoToPayment: () => void;
  onGoToDashboard: () => void;
}

export default function LandingPage({ onLogin, onGoToLogin, onGoToPayment, onGoToDashboard }: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedPlanView, setSelectedPlanView] = useState<'none' | 'free' | 'pro'>('none');

  const features = [
    { title: 'Relatórios Ilimitados', desc: 'Produza quantos relatórios precisar sem restrições.', icon: FileText },
    { title: 'BNCC Automática', desc: 'Gere planos e pareceres alinhados à BNCC com IA.', icon: Zap },
    { title: 'Exportação PDF', desc: 'Baixe seus documentos prontos para impressão.', icon: BookOpen },
    { title: 'Parecer Final IA', desc: 'Gerador automático de pareceres conclusivos.', icon: Sparkles },
  ];

  const handleUpgradeClick = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Not logged in -> Go to payment, then it redirects to login if needed
        onGoToPayment();
        return;
      }

      const { data: userRecord, error } = await supabase
        .from('users')
        .select('status_pagamento')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (userRecord?.status_pagamento !== 'ativo' && userRecord?.status_pagamento !== 'aprovado') {
        onGoToPayment();
      } else {
        // Active -> let it flow to dashboard
        onGoToDashboard();
      }
    } catch (err) {
      console.error(err);
      onGoToLogin();
    }
  };

  if (selectedPlanView !== 'none') {
    const isFree = selectedPlanView === 'free';
    const planFeatures = isFree ? [
      { label: 'Relatório Individual (1/dia)', icon: FileText },
      { label: 'Diário Semanal (1/semana)', icon: Calendar },
      { label: 'Registro Mensal (1/mês)', icon: ClipboardList },
      { label: 'Plano de Aula (1/semana)', icon: BookOpen },
      { label: 'Relatórios da Turma (1/semana)', icon: Users },
      { label: 'Banco de frases (2/semana)', icon: MessageSquare },
    ] : [
      { label: 'Relatórios ilimitados', icon: FileText },
      { label: 'Parecer PCD disponível', icon: Accessibility },
      { label: 'BNCC automática com IA', icon: Zap },
      { label: 'Banco de frases completo', icon: MessageSquare },
      { label: 'Relatórios da turma ilimitados', icon: Users },
      { label: 'Exportar relatórios em PDF', icon: FileDown },
      { label: 'Gerador de parecer final', icon: Sparkles },
      { label: 'Dashboard de evolução', icon: LayoutDashboard },
    ];

    return (
      <div className="min-h-screen bg-[#FDFCFB] py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedPlanView('none')}
            className="flex items-center gap-2 text-black/40 hover:text-black transition-colors mb-8 font-medium"
          >
            <ArrowRight className="rotate-180" size={20} />
            Voltar para planos
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[40px] border border-black/5 p-8 md:p-16 shadow-xl"
          >
            <div className="text-center mb-12">
              <div className={cn(
                "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6",
                isFree ? "bg-[#00A859]/10 text-[#00A859]" : "bg-black text-white"
              )}>
                {isFree ? <Star size={40} /> : <Zap size={40} />}
              </div>
              <h2 className="text-4xl font-bold mb-4">Plano {isFree ? 'Free' : 'Pro'}</h2>
              <p className="text-black/60 text-lg max-w-md mx-auto">
                {isFree
                  ? 'Ideal para quem está começando e quer organizar sua rotina pedagógica básica.'
                  : 'A solução completa para professores que buscam máxima produtividade e recursos avançados.'}
              </p>
            </div>

            <div className={cn(
              "grid gap-4 mb-12",
              isFree ? "max-w-md mx-auto" : "md:grid-cols-2"
            )}>
              {planFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-[#FDFCFB] border border-black/5">
                  <div className="w-10 h-10 bg-[#00A859]/10 rounded-xl flex items-center justify-center text-[#00A859]">
                    <f.icon size={20} />
                  </div>
                  <span className="font-medium text-black/80">{f.label}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => isFree ? onGoToLogin('dashboard') : handleUpgradeClick()}
                className="px-12 py-5 bg-[#00A859] text-white rounded-full font-bold text-lg hover:bg-[#008F4C] transition-all shadow-xl shadow-[#00A859]/20"
              >
                {isFree ? 'Começar agora' : 'Finalizar Assinatura Pro'}
              </button>
              {!isFree && (
                <p className="mt-6 text-black/40 text-sm">
                  Pagamento seguro via cartão de crédito ou PIX.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans">
      <LandingNavbar onGoToLogin={onGoToLogin} />

      {/* Hero Section */}
      <section id="home" className="pt-32 md:pt-40 pb-12 md:pb-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A859]/10 text-[#00A859] text-xs font-bold uppercase tracking-wider mb-6">
              <Star size={14} fill="currentColor" />
              Para Professores Individuais
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] md:leading-[0.9] tracking-tighter mb-8">
              EduTecPro — A revolução na <br className="hidden md:block" />
              <span className="text-[#00A859]">gestão pedagógica</span>.
            </h1>
            <p className="text-lg md:text-xl text-black/60 max-w-lg mx-auto md:mx-0 mb-10 leading-relaxed">
              Soluções inteligentes para professores individuais. Organize sua rotina, produza relatórios e tenha mais tempo para focar nos seus alunos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
              <button
                onClick={() => setSelectedPlanView('pro')}
                className="w-full sm:w-auto px-8 py-4 bg-[#00A859] text-white rounded-full font-semibold hover:bg-[#008F4C] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00A859]/20"
              >
                Começar agora
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('planos');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-4 border border-black/10 rounded-full font-semibold hover:bg-black/5 transition-all text-center flex items-center justify-center"
              >
                Ver Planos
              </button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[400px] md:h-[500px] w-full"
          >
            {/* Background glowing orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#00A859]/30 rounded-full blur-[80px]" />

            {/* Main Mockup Card */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute inset-0 m-auto w-[90%] md:w-[80%] h-[80%] bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-2xl p-6 flex flex-col"
            >
              {/* Mock Bar */}
              <div className="flex items-center gap-2 mb-6 border-b border-black/5 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="ml-4 h-6 w-32 bg-white/50 rounded-md" />
              </div>

              {/* Mock Content */}
              <div className="flex-1 flex gap-4">
                {/* Sidebar Mock */}
                <div className="w-1/4 h-full bg-white/30 rounded-2xl flex flex-col gap-3 p-3">
                  <div className="w-full h-8 bg-white/50 rounded-lg" />
                  <div className="w-full h-8 bg-[#00A859]/20 rounded-lg" />
                  <div className="w-full h-8 bg-white/50 rounded-lg" />
                  <div className="w-full h-8 bg-white/50 rounded-lg" />
                </div>
                {/* Main Area Mock */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className="h-24 w-full bg-gradient-to-r from-[#00A859]/20 to-[#00A859]/5 rounded-2xl p-4 flex flex-col justify-center">
                    <div className="w-1/3 h-4 bg-[#00A859]/40 rounded-full mb-2" />
                    <div className="w-1/4 h-6 bg-[#00A859]/60 rounded-full" />
                  </div>
                  <div className="flex-1 bg-white/30 rounded-2xl p-4 space-y-3">
                    <div className="w-full h-12 bg-white/50 text-transparent border border-white/40 rounded-xl" />
                    <div className="w-full h-12 bg-white/50 border border-white/40 rounded-xl" />
                    <div className="w-full h-12 bg-white/50 border border-white/40 rounded-xl" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Element 1 */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
              className="absolute -right-4 md:-right-8 top-12 md:top-24 w-32 h-32 bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl shadow-xl flex items-center justify-center text-[#00A859]"
            >
              <FileDown size={48} strokeWidth={1.5} />
            </motion.div>

            {/* Floating Element 2 */}
            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2 }}
              className="absolute -left-4 md:-left-8 bottom-12 md:bottom-24 w-40 p-4 bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl shadow-xl space-y-2"
            >
              <div className="flex items-center gap-2 text-[#00A859] font-bold text-sm">
                <Sparkles size={16} />
                Parecer IA
              </div>
              <div className="w-full h-2 bg-black/5 rounded-full" />
              <div className="w-2/3 h-2 bg-black/5 rounded-full" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-16 md:py-24 bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Poder total para o professor</h2>
            <p className="text-black/60">Ferramentas desenhadas para simplificar sua vida acadêmica.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="p-6 md:p-8 rounded-3xl bg-[#FDFCFB] border border-black/5 hover:border-[#00A859]/30 transition-all"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#00A859]/10 rounded-2xl flex items-center justify-center text-[#00A859] mb-6">
                  <f.icon size={24} className="md:w-7 md:h-7" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-black/60 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="planos" className="py-16 md:py-24 bg-[#FDFCFB]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Escolha seu plano</h2>
            <p className="text-black/60">Comece grátis ou turbine sua produtividade com o Pro.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {/* Plano Free */}
            <div className="p-8 md:p-10 rounded-[24px] md:rounded-[32px] bg-white border border-black/5 flex flex-col shadow-sm">
              <div className="mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-bold mb-2">Plano Free</h3>
                <p className="text-black/60 text-sm">Grátis para professores individuais.</p>
              </div>
              <div className="mb-6 md:mb-8">
                <span className="text-3xl md:text-4xl font-bold">R$ 0</span>
                <span className="text-black/40">/sempre</span>
              </div>
              <ul className="space-y-3 md:space-y-4 mb-8 md:mb-10 flex-1">
                {[
                  'Relatório Individual (1/dia)',
                  'Diário Semanal (1/semana)',
                  'Registro Mensal (1/mês)',
                  'Plano de Aula (1/semana)',
                  'Relatórios da Turma (1/semana)',
                  'Banco de frases (2/semana)'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-black/70">
                    <CheckCircle2 size={16} className="text-[#00A859] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setSelectedPlanView('free')}
                className="w-full py-3.5 md:py-4 border border-black/10 rounded-full font-semibold hover:bg-black hover:text-white transition-all"
              >
                Começar agora
              </button>
            </div>

            {/* Plano Pro */}
            <div className="p-8 md:p-10 rounded-[24px] md:rounded-[32px] bg-white border-2 border-[#00A859] flex flex-col relative shadow-xl shadow-[#00A859]/5">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00A859] text-white px-4 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest">
                Recomendado
              </div>
              <div className="mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-bold mb-2">Plano Pro</h3>
                <p className="text-black/60 text-sm">Poder total para o professor.</p>
              </div>
              <div className="mb-6 md:mb-8">
                <span className="text-3xl md:text-4xl font-bold">R$ 29,90</span>
                <span className="text-black/40">/mês</span>
              </div>
              <ul className="space-y-3 md:space-y-4 mb-8 md:mb-10 flex-1">
                {[
                  'Relatórios ilimitados',
                  'Parecer PCD disponível',
                  'BNCC automática com IA',
                  'Banco de frases completo',
                  'Relatórios da turma ilimitados',
                  'Exportar relatórios em PDF',
                  'Gerador de parecer final',
                  'Dashboard de evolução'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-black/70">
                    <CheckCircle2 size={16} className="text-[#00A859] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleUpgradeClick}
                className="w-full py-3.5 md:py-4 bg-[#00A859] text-white rounded-full font-semibold hover:bg-[#008F4C] transition-all shadow-lg shadow-[#00A859]/20"
              >
                Assinar Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-[#1A1A1A] rounded-[40px] p-12 md:p-20 text-white relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Teste o EduTecPro gratuitamente</h2>
            <p className="text-white/60 text-lg mb-10">
              Ao se cadastrar, você recebe <span className="text-[#00A859] font-bold">7 dias de acesso completo</span> ao Plano Pro para experimentar todas as funcionalidades.
            </p>
            <button
              onClick={() => setSelectedPlanView('pro')}
              className="px-8 py-4 bg-[#00A859] text-white rounded-full font-semibold hover:bg-[#008F4C] transition-all flex items-center gap-2"
            >
              Experimentar agora
              <ArrowRight size={20} />
            </button>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-l from-[#1A1A1A] to-transparent z-10" />
            <img
              src="https://picsum.photos/seed/try/600/600"
              alt="Try it"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-black/5 text-center text-black/40 text-sm">
        <p>© 2024 EduTecPro - Professores Avulsos. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
