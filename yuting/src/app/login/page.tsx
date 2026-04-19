'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useAuth } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { user, loading } = useAuth();
  const router = useRouter();

  if (!loading && user) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setSending(true);
    setError('');

    const { error: err } = await signIn(email);
    if (err) {
      setError(err);
    } else {
      setSent(true);
    }
    setSending(false);
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
            {sent ? '请检查邮箱' : '登录以共享旅行回忆'}
          </p>
        </div>

        <div className="relative">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,222,165,0.1)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffdea5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <p className="text-sm mb-4" style={{ color: '#dac2b6' }}>
                我们已向 <strong style={{ color: '#ffdea5' }}>{email}</strong> 发送了登录链接。<br />
                点击链接后即可自动登录。
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-xs underline"
                style={{ color: '#c99a6c' }}
              >
                重新输入邮箱
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="block text-xs mb-1.5 uppercase tracking-wider" style={{ color: '#dac2b6', letterSpacing: '0.1em' }}>
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-lg text-sm mb-4"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,222,165,0.2)',
                  color: '#ffdea5',
                  fontFamily: 'var(--font-manrope)',
                }}
                autoFocus
              />

              {error && (
                <p className="text-xs mb-3" style={{ color: '#ff9a76' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #c99a6c, #b8895e)',
                  color: '#221a0f',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.3)',
                  fontFamily: 'var(--font-manrope)',
                }}
              >
                {sending ? '发送中...' : '发送登录链接'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
