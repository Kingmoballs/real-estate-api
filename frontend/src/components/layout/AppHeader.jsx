import {
  Building2,
  LogOut,
  Menu,
  MessageCircle,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import { useState } from 'react'
import {
  Link,
  NavLink,
} from 'react-router-dom'
import { toast } from 'sonner'
import useAuth from '../../features/auth/useAuth.js'
import NotificationCenter from '../notifications/NotificationCenter.jsx'

const navigation = [
  {
    label: 'Buy',
    to: '/properties?listingType=sale',
  },
  {
    label: 'Rent',
    to: '/properties?listingType=rent',
  },
  {
    label: 'Shortlets',
    to: '/properties?listingType=shortlet',
  },
]

function AppHeader() {
  const [isOpen, setIsOpen] =
    useState(false)
  const { user, logout } = useAuth()

  const closeMenu = () =>
    setIsOpen(false)

  const handleLogout = async () => {
    await logout()
    toast.success(
      'You have been logged out',
    )
    closeMenu()
  }

  const dashboardPath =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'agent'
        ? '/agent'
        : '/account'

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#f7f5ef]/95 backdrop-blur-xl">
      <div className="page-shell flex h-18 items-center justify-between gap-6">
        <Link
          to="/"
          className="focus-ring flex items-center gap-2.5"
          onClick={closeMenu}
        >
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-950 text-white shadow-sm">
            <Building2
              size={21}
              strokeWidth={2.2}
            />
          </span>

          <span className="text-xl font-black tracking-[-0.04em] text-emerald-950">
            Haven
          </span>
        </Link>

        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Primary navigation"
        >
          {navigation.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className="focus-ring text-sm font-bold text-stone-600 transition hover:text-emerald-900"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user && (
            <Link
              to="/messages"
              className="focus-ring grid size-10 place-items-center rounded-full border border-stone-300 bg-white text-stone-700 transition hover:border-emerald-800 hover:text-emerald-900"
              aria-label="Open messages"
            >
              <MessageCircle size={19} />
            </Link>
          )}

          {user && (
            <NotificationCenter />
          )}

          {user && (
            <Link
              to="/account/security"
              className="focus-ring hidden size-10 place-items-center rounded-full border border-stone-300 bg-white text-stone-700 transition hover:border-emerald-800 hover:text-emerald-900 md:grid"
              aria-label="Account security"
              title="Account security"
            >
              <ShieldCheck size={19} />
            </Link>
          )}

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  className="focus-ring flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-800 transition hover:border-emerald-800"
                >
                  <UserRound size={17} />
                  {
                    user.name.split(
                      ' ',
                    )[0]
                  }
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="focus-ring grid size-10 cursor-pointer place-items-center rounded-full text-stone-600 transition hover:bg-stone-200 hover:text-stone-950"
                  aria-label="Log out"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="focus-ring px-3 py-2 text-sm font-bold text-stone-700 hover:text-emerald-900"
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  className="focus-ring rounded-full bg-emerald-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"
                >
                  Create account
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="focus-ring grid size-10 cursor-pointer place-items-center rounded-lg border border-stone-300 bg-white text-stone-800 md:hidden"
            onClick={() =>
              setIsOpen(
                (current) => !current,
              )
            }
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label="Toggle navigation"
          >
            {isOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <nav
          id="mobile-navigation"
          className="border-t border-stone-200 bg-[#f7f5ef] px-4 py-5 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto flex max-w-lg flex-col gap-2">
            {navigation.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 font-bold text-stone-700 hover:bg-white"
              >
                {item.label}
              </Link>
            ))}

            <div className="my-2 h-px bg-stone-200" />

            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 font-bold text-emerald-950 hover:bg-white"
                >
                  Open dashboard
                </Link>

                <Link
                  to="/account/security"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 font-bold text-stone-700 hover:bg-white"
                >
                  Account security
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="cursor-pointer rounded-xl px-4 py-3 text-left font-bold text-red-700 hover:bg-red-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 font-bold"
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="rounded-xl bg-emerald-950 px-4 py-3 text-center font-bold text-white"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}

export default AppHeader