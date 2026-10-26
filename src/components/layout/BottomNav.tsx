import { NavLink } from 'react-router-dom';
import { Home, Search, Music2, Youtube, Disc3, Library } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/search', icon: Search, label: 'Buscar' },
  { to: '/spotify', icon: Music2, label: 'Spotify' },
  { to: '/youtube', icon: Youtube, label: 'YouTube' },
  { to: '/tiktok', icon: Disc3, label: 'TikTok' },
  { to: '/playlists', icon: Library, label: 'Biblioteca' },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors',
              isActive
                ? 'text-emerald-400 font-semibold'
                : 'text-zinc-400 hover:text-white'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} className={cn('mb-0.5', isActive && 'stroke-[2.5]')} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
