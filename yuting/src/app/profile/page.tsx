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
  const progressPercent = visitedProvinces > 0 ? Math.round((visitedProvinces / 34) * 100) : 0;

  if (!user) {
    return (
      <div className="min-h-screen relative pb-32 overflow-hidden" style={{ background: 'linear-gradient(135deg, #4a2e1d 0%, #352118 50%, #2a1b14 100%)' }}>
        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-32">
          <h1 className="text-3xl font-bold tracking-tight mb-8" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>
            个人中心
          </h1>
          <div className="text-center py-20" style={{ color: '#9A8B7A' }}>
            <p className="text-base mb-3" style={{ fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontSize: '1.125rem' }}>请先登录</p>
            <a href="/login" className="inline-flex px-6 py-2.5 rounded-lg text-sm font-medium transition-all" style={{ background: 'linear-gradient(135deg, #c99a6c, #b8895e)', color: '#221a0f' }}>
              前往登录
            </a>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-32 overflow-hidden" style={{ background: 'linear-gradient(135deg, #4a2e1d 0%, #352118 50%, #2a1b14 100%)' }}>
      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          opacity: 0.03,
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-32">
        {/* ID Card — birch profile card */}
        <section className="mb-10">
          <div
            className="rounded-lg shadow-2xl border relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(245,230,211,0.08) 0%, rgba(230,216,197,0.05) 100%)',
              borderColor: 'rgba(255,222,165,0.1)',
              boxShadow: '0 15px 45px rgba(0,0,0,0.5)',
            }}
          >
            <div className="border-2 border-[rgba(201,154,108,0.15)] rounded-sm p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar with brass ring */}
              <div className="relative">
                <div
                  className="w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #c99a6c, #b8895e, #ffdea5)',
                    padding: '2px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 10px rgba(0,0,0,0.4)',
                  }}
                >
                  <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(255,222,165,0.15), rgba(201,154,108,0.1))' }}>
                    {nickname ? (
                      <span className="text-5xl font-bold" style={{ color: '#ffdea5' }}>{nickname[0]}</span>
                    ) : (
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9A8B7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M20 21a8 8 0 1 0-16 0" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 text-center md:text-left space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: '#9A8B7A' }}>Authenticated Explorer</p>
                  <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif" }}>
                    {nickname}
                  </h2>
                  {user?.email && (
                    <p className="text-xs" style={{ color: '#9A8B7A' }}>{user.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[rgba(201,154,108,0.1)]">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: '#9A8B7A' }}>旅行次数</p>
                    <p className="font-bold" style={{ color: '#c99a6c' }}>{tripCount} 次</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: '#9A8B7A' }}>去过的省份</p>
                    <p className="font-bold" style={{ color: '#c99a6c' }}>{visitedProvinces} / 34</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: '#9A8B7A' }}>情侣状态</p>
                    <p className="font-bold" style={{ color: coupleId ? '#c99a6c' : '#9A8B7A' }}>
                      {coupleId ? '已绑定' : '未绑定'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: '#9A8B7A' }}>完成度</p>
                    <p className="font-bold" style={{ color: '#c99a6c' }}>{progressPercent}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mastery Progress */}
        <section className="mb-10">
          <div
            className="rounded-xl p-6 border"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(218,194,182,0.1)',
            }}
          >
            <h4 className="text-[10px] uppercase tracking-[0.2em] mb-4" style={{ color: '#ffdea5' }}>探索进度</h4>
            <div className="space-y-4">
              <div className="flex justify-between text-xs" style={{ color: '#dac2b6' }}>
                <span>省份覆盖</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(201,154,108,0.2)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, #c99a6c, #ffdea5)',
                    boxShadow: `0 0 10px rgba(201,154,108,0.5)`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs mt-2" style={{ color: '#dac2b6' }}>
                <span>已探索 {visitedProvinces} / 全国 34</span>
                <span>旅行 {tripCount} 次</span>
              </div>
            </div>
          </div>
        </section>

        {/* Shelf menu */}
        <section className="space-y-3 mb-10">
          <div
            className="cursor-pointer rounded-xl p-5 flex items-center justify-between transition-all duration-300 border-b"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.05)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(201,154,108,0.15)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c99a6c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif" }}>情侣绑定</h3>
                <p className="text-xs" style={{ color: '#9A8B7A' }}>
                  {coupleId ? '已成功绑定，一起记录旅行回忆' : '生成绑定码分享给另一半'}
                </p>
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,222,165,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>

          <div
            className="cursor-pointer rounded-xl p-5 flex items-center justify-between transition-all duration-300 border-b"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.05)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(201,154,108,0.15)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c99a6c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif" }}>设置</h3>
                <p className="text-xs" style={{ color: '#9A8B7A' }}>账号与安全设置</p>
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,222,165,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </section>

        {/* Couple binding (inline when not bound) */}
        {!coupleId && (
          <div
            className="rounded-xl overflow-hidden p-6 border mb-6"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(218,194,182,0.1)',
            }}
          >
            <h2 className="text-[10px] uppercase tracking-widest mb-4" style={{ color: '#ffdea5' }}>
              情侣绑定
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1">
                <p className="text-sm" style={{ color: '#dac2b6' }}>
                  生成绑定码分享给另一半，或输入对方的绑定码加入关系。
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {/* TODO: generate binding code */}}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #c99a6c, #b8895e)',
                    color: '#221a0f',
                    boxShadow: '2px 4px 0 rgba(34,26,15,0.4)',
                    borderBottom: '2px solid rgba(218,194,182,0.3)',
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
                  onClick={() => {/* TODO: accept binding code */}}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95"
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
          </div>
        )}

        {/* Account — Sign out */}
        <div
          className="rounded-xl overflow-hidden p-5 border flex items-center justify-between"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(218,194,182,0.1)',
          }}
        >
          <div>
            <p className="text-sm" style={{ color: '#dac2b6' }}>{user?.email}</p>
            <p className="text-xs" style={{ color: '#9A8B7A' }}>Supabase 账号</p>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
            style={{
              background: 'rgba(255,107,129,0.1)',
              border: '1px solid rgba(255,107,129,0.2)',
              color: '#FF6B81',
            }}
          >
            退出登录
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
