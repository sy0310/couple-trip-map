'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPassword, signUp, useAuth } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  if (!authLoading && user) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }

    setLoading(true);
    setError('');

    const { error: err } = isSignUp
      ? await signUp(email, password)
      : await signInWithPassword(email, password);

    if (err) {
      setError(err);
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden p-8"
        style={{
          background: 'linear-gradient(180deg, #4a2e1d 0%, #352118 100%)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,222,165,0.1)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01 0.3' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
            backgroundBlendMode: 'multiply',
          }}
        />

        <div className="relative text-center mb-8">
          <div
            className="inline-block px-4 py-1.5 rounded-sm mb-4"
            style={{
              background: 'rgba(255,222,165,0.1)',
              border: '1px solid rgba(255,222,165,0.15)',
            }}
          >
            <span
              className="text-xl italic"
              style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif" }}
            >
              遇亭
            </span>
          </div>
          <p className="text-sm" style={{ color: '#dac2b6' }}>
            {isSignUp ? '创建新账号' : '登录以共享旅行回忆'}
          </p>
        </div>

        <div className="relative">
          <form onSubmit={handleSubmit}>
            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#dac2b6', letterSpacing: '0.1em' }}>
              邮箱地址
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-lg text-sm mb-3"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,222,165,0.2)',
                color: '#ffdea5',
                fontFamily: 'var(--font-manrope)',
              }}
              autoFocus
            />

            <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#dac2b6', letterSpacing: '0.1em' }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="至少6个字符"
              className="w-full px-4 py-3 rounded-lg text-sm mb-4"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,222,165,0.2)',
                color: '#ffdea5',
                fontFamily: 'var(--font-manrope)',
              }}
            />

            {error && (
              <p className="text-xs mb-3" style={{ color: '#ff9a76' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
              style={{
                background: 'linear-gradient(135deg, #c99a6c, #b8895e)',
                color: '#221a0f',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.3)',
                fontFamily: 'var(--font-manrope)',
              }}
            >
              {loading ? '处理中...' : (isSignUp ? '注册' : '登录')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-xs"
              style={{ color: '#c99a6c' }}
            >
              {isSignUp ? '已有账号？返回登录' : '没有账号？立即注册'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
