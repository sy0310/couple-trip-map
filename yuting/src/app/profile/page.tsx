'use client';

import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { getCoupleId } from '@/lib/trips';
import { useAuth, signOut } from '@/lib/auth';

export default function ProfilePage() {
  const { user } = useAuth();
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [visitedProvinces, setVisitedProvinces] = useState(0);
  const [tripCount, setTripCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const id = await getCoupleId();
      setCoupleId(id);
      if (id) {
        const sup = await import('@/lib/supabase-browser');
        const client = sup.createClient();
        const { count: tripTotal } = await client
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('couple_id', id);
        setTripCount(tripTotal ?? 0);

        const { data: provinces }: { data: { province: string }[] | null } = await client
          .from('trips')
          .select('province')
          .eq('couple_id', id);
        setVisitedProvinces(new Set((provinces ?? []).map((t) => t.province)).size);
      }
    };
    load();
  }, [user]);

  const nickname = user?.user_metadata?.nickname || user?.email?.split('@')[0] || '旅行者';

  return (
    <div className="container">
      {/* Header */}
      <h1 className="text-3xl font-bold tracking-tight mb-6" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>
        个人中心
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card — dark walnut plaque */}
        <div className="lg:col-span-1">
          <div
            className="rounded-2xl overflow-hidden p-6 text-center border"
            style={{
              background: 'linear-gradient(180deg, #4a2e1d 0%, #352118 100%)',
              borderColor: 'rgba(255,222,165,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Avatar */}
            <div
              className="w-24 h-24 mx-auto rounded-full flex items-center justify-center border-2 mb-5"
              style={{
                background: 'linear-gradient(135deg, rgba(255,222,165,0.15), rgba(201,154,108,0.1))',
                borderColor: '#c99a6c',
                boxShadow: '0 0 20px rgba(201,154,108,0.2)',
              }}
            >
              {nickname ? (
                <span className="text-4xl font-bold" style={{ color: '#ffdea5' }}>{nickname[0]}</span>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9A8B7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 1 0-16 0" />
                </svg>
              )}
            </div>

            {nickname && (
              <h2 className="text-2xl font-bold mb-1" style={{ color: '#ffdea5' }}>{nickname}</h2>
            )}
            {user?.email && (
              <p className="text-xs mb-4" style={{ color: '#9A8B7A' }}>{user.email}</p>
            )}

            {/* Couple status */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
              style={{
                background: coupleId ? 'rgba(201,154,108,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${coupleId ? 'rgba(201,154,108,0.3)' : 'rgba(255,222,165,0.1)'}`,
                color: coupleId ? '#c99a6c' : '#9A8B7A',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {coupleId ? '已绑定' : '未绑定'}
            </div>
          </div>
        </div>

        {/* Stats — wooden scoreboard */}
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl overflow-hidden p-6 border"
            style={{
              background: 'linear-gradient(180deg, #4a2e1d 0%, #352118 100%)',
              borderColor: 'rgba(255,222,165,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: '#9A8B7A', letterSpacing: '0.1em' }}>
              旅行统计
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold" style={{ color: '#ffdea5' }}>{visitedProvinces}</div>
                <div className="text-xs mt-2" style={{ color: '#9A8B7A' }}>去过的省份</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold" style={{ color: '#c99a6c' }}>{tripCount}</div>
                <div className="text-xs mt-2" style={{ color: '#9A8B7A' }}>旅行次数</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold" style={{ color: '#dac2b6' }}>34</div>
                <div className="text-xs mt-2" style={{ color: '#9A8B7A' }}>全国省份</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold" style={{ color: '#9A8B7A' }}>
                  {visitedProvinces > 0 ? ((visitedProvinces / 34) * 100).toFixed(0) : 0}<span className="text-2xl">%</span>
                </div>
                <div className="text-xs mt-2" style={{ color: '#9A8B7A' }}>完成度</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Couple binding card */}
      <div
        className="rounded-2xl overflow-hidden p-6 border mt-6"
        style={{
          background: 'linear-gradient(180deg, #4a2e1d 0%, #352118 100%)',
          borderColor: 'rgba(255,222,165,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#9A8B7A', letterSpacing: '0.1em' }}>
          情侣绑定
        </h2>

        {coupleId ? (
          <div className="text-center py-2">
            <p className="text-sm mb-3" style={{ color: '#dac2b6' }}>
              你们已成功绑定，一起记录旅行回忆吧
            </p>
            <div
              className="inline-flex items-center gap-3 px-5 py-3 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,222,165,0.12)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c99a6c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span style={{ color: '#c99a6c' }}>情侣关系</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <p className="text-sm" style={{ color: '#dac2b6' }}>
                生成绑定码分享给另一半，或输入对方的绑定码加入关系。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {/* TODO: generate binding code via Supabase */}}
                className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: 'linear-gradient(135deg, #c99a6c, #b8895e)',
                  color: '#221a0f',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                生成绑定码
              </button>
              <input
                type="text"
                placeholder="输入绑定码"
                className="px-4 py-2.5 rounded-lg text-sm"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,222,165,0.15)',
                  color: '#ffdea5',
                  width: '160px',
                }}
              />
              <button
                onClick={() => {/* TODO: accept binding code via Supabase */}}
                className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: 'rgba(255,222,165,0.1)',
                  border: '1px solid rgba(255,222,165,0.2)',
                  color: '#ffdea5',
                }}
              >
                加入
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account section */}
      <div
        className="rounded-2xl overflow-hidden p-6 border mt-6"
        style={{
          background: 'linear-gradient(180deg, #4a2e1d 0%, #352118 100%)',
          borderColor: 'rgba(255,222,165,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#9A8B7A', letterSpacing: '0.1em' }}>
          账号
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: '#dac2b6' }}>{user?.email}</p>
            <p className="text-xs" style={{ color: '#9A8B7A' }}>Supabase 账号</p>
          </div>
          {user && (
            <button
              onClick={() => signOut()}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,107,129,0.2)',
                color: '#FF6B81',
              }}
            >
              退出登录
            </button>
          )}
        </div>
      </div>

      {!user && (
        <div className="text-center mt-6">
          <a
            href="/login"
            className="inline-flex items-center px-8 py-3 rounded-lg text-sm font-medium transition-all"
            style={{
              background: 'linear-gradient(135deg, #c99a6c, #b8895e)',
              color: '#221a0f',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            登录以开始使用
          </a>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
