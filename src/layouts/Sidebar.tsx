import type { ComponentType } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  SquaresFour,
  Users,
  GraduationCap,
  Buildings,
  IdentificationBadge,
  Wallet,
  Printer,
  SignOut,
} from '@phosphor-icons/react'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../lib/AuthContext'
import { useI18n } from '../lib/i18n'
import type { Lang, StringKey } from '../lib/i18n'

type IconType = ComponentType<{ size?: number }>

interface NavDef {
  to: string
  key: StringKey
  Icon: IconType
  roles: Role[]
}

const NAV: NavDef[] = [
  { to: '/',         key: 'nav.dashboard', Icon: SquaresFour,          roles: ['admin', 'agent'] },
  { to: '/students', key: 'nav.students',  Icon: Users,                roles: ['admin', 'agent'] },
  { to: '/courses',  key: 'nav.courses',   Icon: GraduationCap,        roles: ['admin'] },
  { to: '/branches', key: 'nav.branches',  Icon: Buildings,            roles: ['admin'] },
  { to: '/agents',   key: 'nav.agents',    Icon: IdentificationBadge,  roles: ['admin'] },
  { to: '/payments', key: 'nav.payments',  Icon: Wallet,               roles: ['admin', 'agent'] },
  { to: '/reports',  key: 'nav.reports',   Icon: Printer,              roles: ['admin', 'agent'] },
]

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, logout } = useAuth()
  const { lang, setLang, t } = useI18n()

  const role: Role = profile?.role ?? 'admin'
  const items = NAV.filter((n) => n.roles.includes(role))
  const name = profile?.name || 'Admin'
  const initial = name.charAt(0).toUpperCase()

  return (
    <aside className="h-screen sticky top-0 bg-canvas px-3.5 py-5 flex flex-col w-[176px]">
      {/* brand */}
      <div className="flex items-center gap-2.5 px-2 pb-0.5">
        <div className="relative w-[30px] h-[30px] rounded-[9px] bg-ink text-white grid place-items-center font-extrabold text-[12px] overflow-hidden">
          <span>HK</span>
          <img
            src="/logo.png"
            alt="HKM"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(ev) => ev.currentTarget.remove()}
          />
        </div>
        <div>
          <div className="font-extrabold text-[14px] leading-none">HKM</div>
          <div className="text-[9px] text-ink-muted font-bold tracking-[1px]">VOCATIONAL</div>
        </div>
      </div>

      {/* nav */}
      <nav className="mt-6 flex flex-col gap-0.5">
        <div className="text-[10px] font-bold text-ink-muted px-2.5 pb-2 tracking-wide">
          {t('nav.menu')}
        </div>
        {items.map(({ to, key, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `relative flex items-center gap-2.5 px-2.5 py-2.5 rounded-[11px] font-semibold text-[12.5px] transition ${
                isActive
                  ? 'bg-[#F0F0F0] text-ink'
                  : 'text-ink-secondary hover:bg-surface-soft hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-[3px] bg-ink"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon size={18} />
                {t(key)}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* footer: language toggle + role card + sign out */}
      <div className="mt-auto flex flex-col gap-3">
        <div className="flex bg-surface-soft rounded-[20px] p-[3px] self-center">
          {(['en', 'sw'] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`font-bold text-[11px] px-3 py-1 rounded-2xl transition ${
                lang === l
                  ? 'bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                  : 'text-ink-muted'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="bg-surface rounded-[18px] p-3.5 shadow-soft text-center">
          <Link to="/settings" onClick={onNavigate} className="block hover:opacity-80 transition">
            <div className="w-[42px] h-[42px] rounded-full mx-auto mb-2 grid place-items-center text-white font-bold text-[15px] bg-gradient-to-br from-ink to-[#3a3a3a]">
              {initial}
            </div>
            <div className="font-bold text-[12.5px] truncate">{name}</div>
            <div className="text-[10.5px] text-ink-muted font-semibold mt-0.5">
              {role === 'admin' ? t('nav.admin') : t('nav.allBranches')}
            </div>
          </Link>
          <button
            onClick={() => logout()}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 bg-surface-soft hover:bg-[#EEE] rounded-[20px] py-2 text-[11.5px] font-bold text-ink-secondary transition"
          >
            <SignOut size={14} />
            {t('nav.signout')}
          </button>
        </div>
      </div>
    </aside>
  )
}