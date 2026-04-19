'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const handleAuth = async () => {
      const { searchParams } = new URL(window.location.href);
      const code = searchParams.get('code');

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      } else {
        router.push('/login');
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ color: '#9A8B7A' }}>
      <div className="text-center">
        <div className="text-2xl mb-2" style={{ color: '#ffdea5' }}>遇亭</div>
        <p className="text-sm">正在登录...</p>
      </div>
    </div>
  );
}
