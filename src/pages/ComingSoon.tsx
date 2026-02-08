import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { ComingSoonConfig } from '@/hooks/useComingSoon';
import YouTubePlayer from '@/components/collection/YouTubePlayer';
import { toast } from 'sonner';
import logoWhite from '@/assets/logo-white.png';
import logoLion from '@/assets/logo-lion.png';

interface Props {
  config: ComingSoonConfig;
}

/* ── countdown helper ── */
function useCountdown(target: string) {
  const calc = useCallback(() => {
    const diff = Math.max(0, new Date(target).getTime() - Date.now());
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }, [target]);
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
}

const ComingSoon = ({ config }: Props) => {
  const { t, language } = useLanguage();
  const { signIn, signUp, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const countdown = useCountdown(config.countdown_date);

  /* auth form */
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* image carousel */
  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => {
    if (!config.images.length) return;
    const id = setInterval(() => setImgIdx(p => (p + 1) % config.images.length), 3500);
    return () => clearInterval(id);
  }, [config.images.length]);

  /* random video */
  const videoId = useMemo(() => {
    const ids = config.youtube_ids;
    return ids[Math.floor(Math.random() * ids.length)];
  }, [config.youtube_ids]);

  const message = language === 'fr' ? config.message_fr : config.message_en;

  /* if user is admin, redirect */
  useEffect(() => {
    if (user && isAdmin) navigate('/', { replace: true });
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) toast.error('Identifiants incorrects');
      else toast.success('Bienvenue !');
    } else {
      const { error } = await signUp(email, password, firstName, lastName);
      if (error) toast.error(error.message || 'Erreur');
      else toast.success('Vérifiez votre email pour confirmer votre inscription.');
    }
    setSubmitting(false);
  };

  const inputClass = 'w-full border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 text-sm font-body tracking-wider text-white placeholder:text-white/40 focus:outline-none focus:border-white/60 transition-colors';

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background video */}
      <div className="absolute inset-0 z-0 opacity-40">
        <YouTubePlayer videoId={videoId} className="w-full h-full" />
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Logo */}
        <header className="flex flex-col items-center pt-10 md:pt-16 gap-4">
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Continuous glow rings */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)',
                filter: 'blur(25px)',
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute inset-[-20px] rounded-full"
              style={{
                background: 'radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 60%)',
                filter: 'blur(40px)',
              }}
              animate={{
                scale: [1.2, 1.6, 1.2],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0 overflow-hidden rounded-full"
              style={{ mixBlendMode: 'screen' }}
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
              />
            </motion.div>
            <img
              src={logoLion}
              alt="Emblème"
              className="relative z-10 h-20 md:h-28"
            />
          </motion.div>
          <motion.img
            src={logoWhite}
            alt="Logo"
            className="h-8 md:h-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-10 md:gap-14">
          {/* Message */}
          <motion.div
            className="text-center max-w-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h1 className="text-display text-4xl md:text-6xl lg:text-7xl mb-6 tracking-wide">
              Coming Soon
            </h1>
            <p className="text-sm md:text-base font-body tracking-[0.15em] uppercase text-white/70 leading-relaxed">
              {message}
            </p>
          </motion.div>

          {/* Countdown */}
          <motion.div
            className="flex gap-6 md:gap-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {[
              { val: countdown.days, label: language === 'fr' ? 'Jours' : 'Days' },
              { val: countdown.hours, label: language === 'fr' ? 'Heures' : 'Hours' },
              { val: countdown.minutes, label: 'Min' },
              { val: countdown.seconds, label: 'Sec' },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <div className="text-4xl md:text-6xl font-display tabular-nums leading-none">
                  {String(val).padStart(2, '0')}
                </div>
                <div className="text-[9px] md:text-[10px] tracking-[0.25em] uppercase font-body text-white/50 mt-2">
                  {label}
                </div>
              </div>
            ))}
          </motion.div>


          {/* Auth button / form */}
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6 }}
          >
            {!showAuth ? (
              <button
                onClick={() => setShowAuth(true)}
                className="w-full border border-white/30 py-4 text-xs tracking-[0.25em] uppercase font-body text-white/90 hover:bg-white/10 hover:border-white/60 transition-all duration-300"
              >
                {language === 'fr' ? 'Se connecter / S\'inscrire' : 'Sign In / Sign Up'}
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border border-white/15 bg-black/40 backdrop-blur-md p-6"
              >
                {/* tabs */}
                <div className="flex mb-6 border-b border-white/10">
                  <button
                    onClick={() => setMode('login')}
                    className={`flex-1 pb-3 text-[10px] tracking-[0.2em] uppercase font-body transition-colors ${mode === 'login' ? 'text-white border-b border-white' : 'text-white/40'}`}
                  >
                    {language === 'fr' ? 'Connexion' : 'Login'}
                  </button>
                  <button
                    onClick={() => setMode('signup')}
                    className={`flex-1 pb-3 text-[10px] tracking-[0.2em] uppercase font-body transition-colors ${mode === 'signup' ? 'text-white border-b border-white' : 'text-white/40'}`}
                  >
                    {language === 'fr' ? 'Inscription' : 'Sign Up'}
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder={language === 'fr' ? 'Prénom' : 'First name'} value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} required />
                      <input type="text" placeholder={language === 'fr' ? 'Nom' : 'Last name'} value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} required />
                    </div>
                  )}
                  <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} required />
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder={language === 'fr' ? 'Mot de passe' : 'Password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={inputClass + ' pr-12'}
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-white text-black py-3.5 text-[10px] tracking-[0.25em] uppercase font-body hover:bg-white/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? '...' : mode === 'login' ? (language === 'fr' ? 'Se connecter' : 'Sign In') : (language === 'fr' ? 'S\'inscrire' : 'Sign Up')}
                  </button>
                </form>

                {user && !isAdmin && (
                  <p className="text-[10px] text-white/50 font-body tracking-wider text-center mt-4">
                    {language === 'fr' ? 'Votre compte est enregistré. Le site n\'est pas encore ouvert.' : 'Your account is registered. The site is not yet open.'}
                  </p>
                )}

                <button onClick={() => setShowAuth(false)} className="w-full text-[10px] text-white/40 hover:text-white/60 tracking-wider uppercase font-body mt-4 transition-colors">
                  {language === 'fr' ? 'Fermer' : 'Close'}
                </button>
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default ComingSoon;
