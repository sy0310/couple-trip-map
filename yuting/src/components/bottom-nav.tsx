'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: React.FC<{ active: boolean }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: '地图', href: '/', icon: MapIcon },
  { label: '相册', href: '/album', icon: AlbumIcon },
  { label: '我的', href: '/profile', icon: ProfileIcon },
];

function MapIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#ffdea5' : '#9A8B7A'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
      <path d="M8 2v16" />
      <path d="M16 6v16" />
    </svg>
  );
}

function AlbumIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#ffdea5' : '#9A8B7A'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#ffdea5' : '#9A8B7A'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'linear-gradient(180deg, #4a2e1d 0%, #352118 50%, #2a1b14 100%)',
        borderTop: '2px solid #c99a6c',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,222,165,0.1)',
      }}
    >
      {/* Wood grain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01 0.3' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
          backgroundBlendMode: 'multiply',
        }}
      />
      <div className="relative flex justify-around items-center h-16 max-w-[800px] mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 py-2 px-8 relative transition-colors duration-200"
            >
              {/* Brass highlight bar for active */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full"
                  style={{ background: '#ffdea5' }}
                />
              )}
              <Icon active={isActive} />
              <span
                className="text-[11px] font-medium tracking-wider"
                style={{ color: isActive ? '#ffdea5' : '#9A8B7A' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
