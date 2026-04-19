'use client';

import { useState, useEffect } from 'react';
import { BottomNav } from '@/components/bottom-nav';
import { getCoupleInfo, generateBindingCode, acceptBindingCode, deleteCoupleBinding } from '@/lib/trips';
import { useAuth, signOut } from '@/lib/auth';

export default function ProfilePage() {
  const { user } = useAuth();
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [partnerNickname, setPartnerNickname] = useState<string | null>(null);
  const [visitedProvinces, setVisitedProvinces] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const [showCoupleModal, setShowCoupleModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameSaved, setNicknameSaved] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [bindingCode, setBindingCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [bindError, setBindError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const coupleInfo = await getCoupleInfo();
      setCoupleId(coupleInfo?.id ?? null);
      setPartnerNickname(coupleInfo?.partnerNickname ?? null);
      if (coupleInfo?.id) {
        const sup = await import('@/lib/supabase-browser');
        const client = sup.createClient();
        const { count: tripTotal } = await client
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .eq('couple_id', coupleInfo.id);
        setTripCount(tripTotal ?? 0);

        const { data: provinces }: { data: { province: string }[] | null } = await client
          .from('trips')
          .select('province')
          .eq('couple_id', coupleInfo.id);
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

  const generateCode = async () => {
    setCodeLoading(true);
    const code = await generateBindingCode();
    setCodeLoading(false);
    if (code) {
      setBindingCode(code);
    }
  };

  const acceptCode = async () => {
    if (!inputCode.trim()) return;
    setBindError('');
    setAcceptLoading(true);
    const success = await acceptBindingCode(inputCode);
    setAcceptLoading(false);
    if (success) {
      setInputCode('');
      const info = await getCoupleInfo();
      setCoupleId(info?.id ?? null);
      setPartnerNickname(info?.partnerNickname ?? null);
      setShowCoupleModal(false);
    } else {
      setBindError('绑定码无效或已被使用');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowSettingsModal(false);
  };

  const handleUnbind = async () => {
    const success = await deleteCoupleBinding();
    if (success) {
      setCoupleId(null);
      setPartnerNickname(null);
      setBindingCode('');
      setShowCoupleModal(false);
    }
  };

  const handleUpdateNickname = async () => {
    const trimmed = newNickname.trim();
    if (!trimmed) return;
    setNicknameSaving(true);
    setNicknameError('');
    const sup = await import('@/lib/supabase-browser');
    const client = sup.createClient();
    const { error } = await client.from('users').update({ nickname: trimmed } as never).eq('id', user.id);
    setNicknameSaving(false);
    if (error) {
      setNicknameError(error.message);
    } else {
      setNicknameSaved(true);
      setTimeout(() => setNicknameSaved(false), 2000);
      setNewNickname('');
      await client.auth.updateUser({ data: { nickname: trimmed } });
    }
  };

  // Couple binding modal content
  const coupleModalContent = (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-center" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>
        {coupleId ? `情侣 · ${partnerNickname || '对方'}` : '绑定情侣'}
      </h3>

      {coupleId ? (
        <div className="space-y-6">
          <div className="text-center py-4">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(201,154,108,0.15)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c99a6c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <p className="text-sm mb-1" style={{ color: '#dac2b6' }}>已绑定情侣关系</p>
            <p className="text-lg font-bold" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>
              {partnerNickname || '对方'}
            </p>
          </div>

          {/* Unbind section */}
          <div className="rounded-xl p-5 border" style={{ background: 'rgba(255,50,50,0.03)', borderColor: 'rgba(255,107,129,0.1)' }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: '#ff6b6b' }}>解除绑定</h4>
            <p className="text-xs mb-3" style={{ color: '#9A8B7A' }}>解除后双方的旅行记录将保持独立</p>
            <button
              onClick={handleUnbind}
              className="w-full py-2.5 rounded-lg text-sm font-medium"
              style={{
                background: 'rgba(255,107,129,0.1)',
                border: '1px solid rgba(255,107,129,0.2)',
                color: '#FF6B81',
              }}
            >
              解除情侣绑定
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Generate code */}
          <div className="rounded-xl p-5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,222,165,0.1)' }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: '#ffdea5' }}>生成你的绑定码</h4>
            <p className="text-xs mb-3" style={{ color: '#9A8B7A' }}>生成一个唯一绑定码，分享给你的另一半</p>
            {bindingCode ? (
              <div className="text-center">
                <div
                  className="text-3xl font-bold tracking-widest py-4 rounded-lg font-mono"
                  style={{
                    background: 'rgba(201,154,108,0.1)',
                    border: '1px solid rgba(201,154,108,0.3)',
                    color: '#ffdea5',
                  }}
                >
                  {bindingCode}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(bindingCode);
                  }}
                  className="mt-3 text-xs underline"
                  style={{ color: '#c99a6c' }}
                >
                  复制到剪贴板
                </button>
                <button
                  onClick={() => setBindingCode('')}
                  className="ml-3 text-xs underline"
                  style={{ color: '#9A8B7A' }}
                >
                  重新生成
                </button>
              </div>
            ) : (
              <button
                onClick={generateCode}
                disabled={codeLoading}
                className="w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #c99a6c, #b8895e)', color: '#221a0f' }}
              >
                {codeLoading ? '生成中...' : '生成绑定码'}
              </button>
            )}
          </div>

          {/* Accept code */}
          <div className="rounded-xl p-5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,222,165,0.1)' }}>
            <h4 className="text-sm font-semibold mb-2" style={{ color: '#ffdea5' }}>输入对方的绑定码</h4>
            {bindError && (
              <p className="text-xs mb-2" style={{ color: '#ff6b6b' }}>{bindError}</p>
            )}
            <div className="flex gap-3">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => { setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)); setBindError(''); }}
                placeholder="输入6位码"
                className="flex-1 px-4 py-2.5 rounded-lg text-sm text-center tracking-widest font-mono"
                maxLength={6}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,222,165,0.2)',
                  color: '#ffdea5',
                }}
              />
              <button
                onClick={acceptCode}
                disabled={!inputCode || acceptLoading}
                className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  background: 'rgba(255,222,165,0.1)',
                  border: '1px solid rgba(255,222,165,0.2)',
                  color: '#ffdea5',
                }}
              >
                {acceptLoading ? '绑定中...' : '绑定'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Settings modal content
  const settingsModalContent = (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-center" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}>
        设置
      </h3>

      {/* Account info */}
      <div className="rounded-xl p-5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,222,165,0.1)' }}>
        <h4 className="text-sm font-semibold mb-3" style={{ color: '#ffdea5' }}>账号信息</h4>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span style={{ color: '#9A8B7A' }}>昵称</span>
            <span style={{ color: '#dac2b6' }}>{nickname}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newNickname}
              onChange={(e) => { setNewNickname(e.target.value); setNicknameError(''); }}
              placeholder="输入新昵称"
              className="flex-1 px-4 py-2.5 rounded-lg text-sm"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,222,165,0.2)',
                color: '#ffdea5',
                fontFamily: 'var(--font-manrope)',
              }}
            />
            <button
              onClick={handleUpdateNickname}
              disabled={!newNickname.trim() || nicknameSaving}
              className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{
                background: nicknameSaved ? 'rgba(201,154,108,0.3)' : 'linear-gradient(135deg, #c99a6c, #b8895e)',
                color: '#221a0f',
              }}
            >
              {nicknameSaving ? '保存中' : nicknameSaved ? '已保存' : '修改'}
            </button>
          </div>
          {nicknameError && (
            <p className="text-xs" style={{ color: '#ff6b6b' }}>{nicknameError}</p>
          )}
          <div className="flex justify-between text-sm">
            <span style={{ color: '#9A8B7A' }}>邮箱</span>
            <span style={{ color: '#dac2b6' }}>{user?.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: '#9A8B7A' }}>UID</span>
            <span className="font-mono text-xs" style={{ color: '#dac2b6' }}>{user?.id?.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl p-5 border" style={{ background: 'rgba(255,50,50,0.05)', borderColor: 'rgba(255,107,129,0.15)' }}>
        <h4 className="text-sm font-semibold mb-3" style={{ color: '#ff6b6b' }}>退出登录</h4>
        <p className="text-xs mb-3" style={{ color: '#9A8B7A' }}>退出后需要重新登录才能访问旅行数据</p>
        <button
          onClick={handleSignOut}
          className="w-full py-2.5 rounded-lg text-sm font-medium"
          style={{
            background: 'rgba(255,107,129,0.1)',
            border: '1px solid rgba(255,107,129,0.2)',
            color: '#FF6B81',
          }}
        >
          确认退出
        </button>
      </div>
    </div>
  );

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
          {/* Couple binding shelf */}
          <button
            type="button"
            onClick={() => setShowCoupleModal(true)}
            className="w-full cursor-pointer rounded-xl p-5 flex items-center justify-between transition-all duration-300 border-b"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.05)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center relative"
                style={{ background: 'rgba(201,154,108,0.15)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c99a6c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {!coupleId && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ background: '#c99a6c' }} />
                )}
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif" }}>
                  {coupleId ? `情侣 · ${partnerNickname || '对方'}` : '情侣绑定'}
                </h3>
                <p className="text-xs" style={{ color: '#9A8B7A' }}>
                  {coupleId ? '已成功绑定，一起记录旅行回忆' : '生成绑定码分享给另一半'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {coupleId && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,154,108,0.15)', color: '#c99a6c' }}>已绑定</span>
              )}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,222,165,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </button>

          {/* Settings shelf */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="w-full cursor-pointer rounded-xl p-5 flex items-center justify-between transition-all duration-300 border-b"
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
              <div className="text-left">
                <h3 className="text-lg font-bold" style={{ color: '#ffdea5', fontFamily: "'Newsreader', serif" }}>设置</h3>
                <p className="text-xs" style={{ color: '#9A8B7A' }}>账号与安全设置</p>
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,222,165,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </section>

        {/* Couple binding modal */}
        {showCoupleModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => { setShowCoupleModal(false); setBindingCode(''); }} />
            <div
              className="relative w-full max-w-md rounded-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
              style={{ background: 'linear-gradient(180deg, #4a2e1d 0%, #352118 100%)', boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,222,165,0.1)' }}
            >
              <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
                {coupleModalContent}
                <button
                  onClick={() => { setShowCoupleModal(false); setBindingCode(''); }}
                  className="w-full mt-6 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,222,165,0.15)', color: '#dac2b6' }}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={() => { setShowSettingsModal(false); setNewNickname(''); setNicknameError(''); }} />
            <div
              className="relative w-full max-w-md rounded-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
              style={{ background: 'linear-gradient(180deg, #4a2e1d 0%, #352118 100%)', boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,222,165,0.1)' }}
            >
              <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
                {settingsModalContent}
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full mt-6 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,222,165,0.15)', color: '#dac2b6' }}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  );
}
