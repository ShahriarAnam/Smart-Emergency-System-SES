import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { History, LayoutDashboard, LogOut, Menu, PlusCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function navClass(active) {
  return [
    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
    active
      ? 'bg-blue-50 text-blue-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ');
}

export default function AppNavbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isHelper, logout } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/emergency/create', label: 'New Request', icon: PlusCircle },
    { to: '/notification/history', label: 'History', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
          🚨 Smart Emergency
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              location.pathname === item.to ||
              (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

            return (
              <Link key={item.to} to={item.to} className={navClass(active)}>
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition-all duration-200 hover:bg-slate-100 md:hidden"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
          </div>

          <span
            className={[
              'rounded-full px-3 py-1 text-xs font-semibold capitalize',
              isHelper ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700',
            ].join(' ')}
          >
            {isHelper ? 'helper' : 'requester'}
          </span>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
              navigate('/login');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-200"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                location.pathname === item.to ||
                (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={navClass(active)}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
