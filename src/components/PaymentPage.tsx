import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, QrCode, ArrowLeft, CheckCircle2, ShieldCheck, Loader2, Star, Zap, Clock, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface PaymentPageProps {
    onBack: () => void;
    onSuccess: (role: UserProfile) => void;
    onUnauthenticated: () => void;
    userEmail: string;
}

export default function PaymentPage({ onBack, onSuccess, onUnauthenticated, userEmail }: PaymentPageProps) {
    const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form states (Simulated)
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [name, setCardName] = useState('');

    // Account form fields for non-authenticated users
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [installments, setInstallments] = useState(1);
    const [isDowngrading, setIsDowngrading] = useState(false);

    const handleDowngradeToFree = async () => {
        setIsDowngrading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                onBack();
                return;
            }

            const { error } = await supabase
                .from('users')
                .update({
                    plano: 'free',
                    status_pagamento: 'pendente'
                })
                .eq('id', session.user.id);

            if (error) throw error;

            onSuccess('free');
        } catch (err) {
            console.error('Downgrade error:', err);
            alert('Erro ao processar alteração de plano.');
        } finally {
            setIsDowngrading(false);
        }
    };

    const handleStartTrial = async () => {
        setIsProcessing(true);
        try {
            let activeUserId = '';
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                if (!email || !password) {
                    alert('Por favor, informe um E-mail e Senha para criar sua conta e iniciar o teste grátis.');
                    setIsProcessing(false);
                    return;
                }

                let { data: authData, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (authError) {
                    if (authError.message.includes('User already registered') || authError.status === 400) {
                        const loginResp = await supabase.auth.signInWithPassword({ email, password });
                        if (loginResp.error) throw loginResp.error;
                        authData = loginResp.data;
                    } else {
                        throw authError;
                    }
                }

                if (!authData.user) throw new Error("Não foi possível autenticar a conta.");
                activeUserId = authData.user.id;

                await supabase.from('users').upsert({
                    id: activeUserId,
                    nome: email.split('@')[0],
                    email: email,
                    senha: 'auth_managed_by_supabase',
                    plano: 'free',
                    status_pagamento: 'pendente',
                    data_expiracao: new Date().toISOString().split('T')[0],
                    created_at: new Date().toISOString()
                }, { onConflict: 'id' });
            } else {
                activeUserId = session.user.id;
            }

            const trialExpiration = new Date();
            trialExpiration.setDate(trialExpiration.getDate() + 7);

            const { error } = await supabase
                .from('users')
                .update({
                    status_pagamento: 'trial',
                    plano: 'pro',
                    data_expiracao: trialExpiration.toISOString().split('T')[0]
                })
                .eq('id', activeUserId);

            if (error) throw error;

            setShowSuccess(true);
            setTimeout(() => {
                onSuccess('pro');
            }, 3000);

        } catch (err: any) {
            console.error('Trial error:', err);
            alert(err.message || 'Erro ao iniciar período de teste.');
            setIsProcessing(false);
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            let activeUserId = '';
            const { data: { session } } = await supabase.auth.getSession();

            // If not logged in, we need to create the account OR login
            if (!session) {
                if (!email || !password) {
                    alert('Por favor, informe um E-mail e Senha para criar ou acessar sua conta.');
                    setIsProcessing(false);
                    return;
                }

                // Attempt to sign up
                let { data: authData, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (authError) {
                    // Se o usuário já existe, tentar fazer login
                    if (authError.message.includes('User already registered') || authError.status === 400) {
                        const loginResp = await supabase.auth.signInWithPassword({
                            email,
                            password
                        });

                        if (loginResp.error) {
                            throw loginResp.error;
                        }

                        authData = loginResp.data;
                    } else {
                        throw authError; // Some other error
                    }
                }

                if (!authData.user) {
                    throw new Error("Não foi possível autenticar a conta.");
                }

                activeUserId = authData.user.id;

                // Sync with public.users table just in case they are brand new
                await supabase.from('users').upsert({
                    id: activeUserId,
                    nome: name || email.split('@')[0],
                    email: email,
                    senha: 'auth_managed_by_supabase',
                    plano: 'free',
                    status_pagamento: 'pendente',
                    data_expiracao: new Date().toISOString().split('T')[0],
                    created_at: new Date().toISOString()
                }, { onConflict: 'id' });

            } else {
                activeUserId = session.user.id;
            }

            // Simulate payment processing time
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Calculate new expiration date (30 days for PIX and Card as per new monthly requirement)
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);

            // Update users table in Supabase
            const { error } = await supabase
                .from('users')
                .update({
                    status_pagamento: 'aprovado',
                    plano: 'pro',
                    data_expiracao: expirationDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
                })
                .eq('id', activeUserId);

            if (error) throw error;

            setShowSuccess(true);

            // Auto redirect after success message
            setTimeout(() => {
                onSuccess('pro');
            }, 3000);

        } catch (err: any) {
            console.error('Payment error:', err);

            let errMsg = 'Ocorreu um erro ao processar o pagamento. Tente novamente.';
            if (err.message === 'Invalid login credentials') {
                errMsg = 'A conta já existe, mas a senha está incorreta.';
            } else if (err.message.includes('Password should be at least')) {
                errMsg = 'A senha deve ter pelo menos 6 caracteres.';
            }

            alert(errMsg);
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans flex flex-col items-center justify-center p-6">
            <button
                onClick={onBack}
                className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-black/40 hover:text-black transition-colors"
            >
                <ArrowLeft size={20} />
                Voltar
            </button>

            <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 lg:gap-16">

                {/* Left Column - Form */}
                <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-xl border border-black/5 relative overflow-hidden">
                    <AnimatePresence>
                        {showSuccess && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center text-center p-8"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", delay: 0.2 }}
                                    className="w-24 h-24 bg-[#00A859]/10 rounded-full flex items-center justify-center text-[#00A859] mb-6"
                                >
                                    <CheckCircle2 size={48} />
                                </motion.div>
                                <h3 className="text-3xl font-bold mb-4">Pagamento Aprovado!</h3>
                                <p className="text-black/60 text-lg mb-8">
                                    Sua conta PRO foi ativada. Bem-vindo ao próximo nível da gestão pedagógica, {userEmail}!
                                </p>
                                <div className="flex items-center gap-2 text-[#00A859] font-medium">
                                    <Loader2 className="animate-spin" size={20} />
                                    Redirecionando para o seu Dashboard...
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mb-10">
                        <h2 className="text-3xl font-bold tracking-tight mb-2">Assinar Plano Pro</h2>
                        <p className="text-black/60">Sua conta completa para gestão escolar</p>
                    </div>

                    <div className="space-y-8">
                        {/* User Account Info Container - NOW AT TOP */}
                        <div className="space-y-5 bg-black/5 p-6 rounded-3xl border border-black/10">
                            <h3 className="font-bold text-black/80 flex items-center gap-2">
                                <ShieldCheck size={20} className="text-[#00A859]" />
                                Seus Dados de Acesso
                            </h3>
                            {userEmail ? (
                                <p className="text-black/60 text-sm">
                                    A assinatura será vinculada à conta: <strong className="text-black">{userEmail}</strong>.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Seu E-mail</label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="exemplo@email.com"
                                            className="w-full px-5 py-4 bg-white rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Crie uma Senha</label>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            minLength={6}
                                            className="w-full px-5 py-4 bg-white rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                                        />
                                        <p className="text-[10px] text-black/40 mt-1 font-medium">No mínimo 6 caracteres</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Trial Button Section */}
                        <div className="bg-[#00A859]/5 border-2 border-[#00A859]/20 rounded-3xl p-6 md:p-8 text-center space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00A859] text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                <Gift size={12} />
                                Oferta Especial
                            </div>
                            <h3 className="text-xl font-bold text-[#00A859]">Acesso Gratuito por 7 Dias</h3>
                            <p className="text-sm text-black/60 max-w-sm mx-auto">
                                Experimente todas as funcionalidades do Plano Pro sem pagar nada agora. Após o teste, você escolhe como continuar.
                            </p>
                            <button
                                type="button"
                                onClick={handleStartTrial}
                                disabled={isProcessing}
                                className="w-full py-5 bg-[#00A859] text-white rounded-full font-bold text-lg hover:bg-[#008F4C] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#00A859]/20"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" /> : <><Zap size={20} /> Experimentar GRÁTIS por 7 dias</>}
                            </button>
                        </div>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-black/10"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-4 text-black/40 font-bold tracking-widest">Ou escolha o método de pagamento</span>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('credit_card')}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === 'credit_card'
                                    ? 'border-[#00A859] bg-[#00A859]/5 text-[#00A859]'
                                    : 'border-black/5 bg-transparent text-black/60 hover:border-black/10'
                                    }`}
                            >
                                <CreditCard size={28} />
                                <span className="font-semibold text-sm">Cartão de Crédito</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('pix')}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${paymentMethod === 'pix'
                                    ? 'border-[#00A859] bg-[#00A859]/5 text-[#00A859]'
                                    : 'border-black/5 bg-transparent text-black/60 hover:border-black/10'
                                    }`}
                            >
                                <QrCode size={28} />
                                <span className="font-semibold text-sm">Pagar com PIX</span>
                            </button>
                        </div>

                        <form onSubmit={handlePayment} className="space-y-8">

                        {/* Credit Card Form (Simulated) */}
                        <AnimatePresence mode="wait">
                            {paymentMethod === 'credit_card' ? (
                                <motion.div
                                    key="credit_card"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Número do Cartão</label>
                                        <input
                                            type="text"
                                            required
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                                            maxLength={19}
                                            placeholder="0000 0000 0000 0000"
                                            className="w-full px-5 py-4 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all font-mono text-lg"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Validade</label>
                                            <input
                                                type="text"
                                                required
                                                value={expiry}
                                                onChange={(e) => setExpiry(e.target.value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2').substr(0, 5))}
                                                placeholder="MM/AA"
                                                className="w-full px-5 py-4 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-black/60 uppercase tracking-wider">CVC</label>
                                            <input
                                                type="text"
                                                required
                                                value={cvc}
                                                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').substr(0, 4))}
                                                placeholder="123"
                                                className="w-full px-5 py-4 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Nome no Cartão</label>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                            placeholder="COMO IMPRESSO NO CARTÃO"
                                            className="w-full px-5 py-4 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all uppercase"
                                        />
                                    </div>

                                    {/* Installments Selector */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-black/60 uppercase tracking-wider">Parcelamento</label>
                                        <select
                                            value={installments}
                                            onChange={(e) => setInstallments(Number(e.target.value))}
                                            className="w-full px-5 py-4 rounded-xl border border-black/10 focus:border-[#00A859] focus:ring-2 focus:ring-[#00A859]/20 outline-none transition-all bg-white"
                                        >
                                            <option value={1}>1x de R$ 29,90 (Mensal)</option>
                                            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                                <option key={n} value={n}>{n}x de R$ 29,90 (Sem juros)</option>
                                            ))}
                                        </select>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="pix"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-[#00A859]/5 border border-[#00A859]/20 rounded-2xl p-6 text-center space-y-4"
                                >
                                    <div className="bg-white p-4 rounded-xl inline-block border border-black/5 shadow-sm">
                                        {/* Simulated QR Code */}
                                        <QrCode size={120} className="text-[#00A859]" />
                                    </div>
                                    <p className="text-sm text-black/60">
                                        Escaneie o código acima com o aplicativo do seu banco para finalizar a compra de 30 dias de acesso.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className={`w-full py-5 text-white rounded-full font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${isProcessing
                                ? 'bg-black/20 cursor-not-allowed shadow-none'
                                : 'bg-[#00A859] hover:bg-[#008F4C] shadow-[#00A859]/30'
                                }`}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="animate-spin" size={24} />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    Confirmar Pagamento
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-center gap-2 text-black/40 text-sm">
                            <ShieldCheck size={16} />
                            Ambiente 100% seguro Banco Central.
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="flex flex-col justify-center">
                <div className="bg-[#1A1A1A] text-white rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#00A859]/20 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl mb-8">
                            <Star size={24} className="text-yellow-400 fill-yellow-400" />
                        </div>

                        <h3 className="text-3xl font-bold mb-8">Resumo da Assinatura</h3>

                        <div className="space-y-6 flex-1 mb-12 border-b border-white/10 pb-12">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-lg">EduTecPro Individual</p>
                                    <p className="text-white/40 text-sm">Plano Completo PRO</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-xl text-[#00A859]">R$ 29,90</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-white/60 text-sm">
                                <p>Período de Faturamento</p>
                                <p>Mensal (Renovação Automática)</p>
                            </div>
                        </div>

                        <div className="flex items-end justify-between">
                            <p className="text-white/60">Total a pagar hoje</p>
                            <p className="text-4xl font-bold">
                                {paymentMethod === 'credit_card' ? `R$ ${(29.9 * (installments === 1 ? 1 : installments)).toFixed(2).replace('.', ',')}` : 'R$ 29,90'}
                            </p>
                        </div>

                        {/* Downgrade Option */}
                        <div className="mt-12 pt-12 border-t border-white/10">
                            <p className="text-white/40 text-sm mb-4">Não quer assinar o Pro agora?</p>
                            <button
                                onClick={handleDowngradeToFree}
                                disabled={isDowngrading}
                                className="w-full py-4 border border-white/10 rounded-full text-white/60 text-sm font-semibold hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
                            >
                                {isDowngrading ? 'Processando...' : 'Continuar com Plano Free'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
}
