import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, MessageSquare, Users, Settings as SettingsIcon, Calendar, Kanban, Eye, Sun, Moon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from '@/components/ui/sidebar';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import { createPortal } from 'react-dom';
import viaIcon from '@/assets/icon-via.png';

const menuItemsBase = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pipeline', label: 'Pipeline', icon: Kanban },
  { id: 'chat', label: 'Chat Ao Vivo', icon: MessageSquare },
  { id: 'contacts', label: 'Contatos', icon: Users },
  { id: 'scheduling', label: 'Agendamentos', icon: Calendar },
  { id: 'settings', label: 'Configurações', icon: SettingsIcon },
];

const monitorItem = { id: 'monitor', label: 'Monitoramento', icon: Eye };

const Logo = ({ companyName }: { companyName: string }) => {
  return (
    <Link to="/dashboard" className="flex items-center space-x-3 py-1">
      <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 p-1.5">
          <img src={viaIcon} alt="Logo" className="w-full h-full object-contain" />
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col overflow-hidden"
      >
        <span className="font-bold text-lg tracking-tight text-foreground whitespace-nowrap">{companyName || 'Minha Empresa'}</span>
        <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Workspace</span>
      </motion.div>
    </Link>
  );
};

const LogoIcon = () => {
  return (
    <Link to="/dashboard" className="flex items-center py-1">
      <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 p-1.5">
          <img src={viaIcon} alt="Logo" className="w-full h-full object-contain" />
        </div>
      </div>
    </Link>
  );
};

const SidebarContent = () => {
  const { companyName, isAdmin } = useCompanySettings();
  const location = useLocation();
  const currentPath = location.pathname.substring(1) || 'dashboard';
  const { open } = useSidebar();
  const [menuItems, setMenuItems] = useState(menuItemsBase);

  const auth = useAuth();
  // determine current user and whether they are allowed to see Monitor
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        let allowed = false;
        const user = auth?.user ?? null;
        // allow if company-level admin flag is set (mock)
        if (isAdmin) allowed = true;
        if (!allowed && user) {
          const team = await api.fetchTeam();
          const member = team.find((t: any) => t.email === user.email || t.id === user.id);
          if (member && (member.role === 'admin' || member.role === 'manager')) allowed = true;
        }
        // We no longer surface Monitoramento in the main sidebar menu.
        // Monitoramento is available under Configurações → Relatórios.
        if (mounted) setMenuItems(menuItemsBase);
      } catch (err) {
        console.error('sidebar load error', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [auth]);

  const links = menuItems.map(item => ({
    label: item.label,
    href: `/${item.id}`,
    icon: <item.icon className="h-5 w-5" />,
  }));

  return (
    <>
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mb-6">
          {open ? <Logo companyName={companyName} /> : <LogoIcon />}
        </div>
        
        <nav className="flex flex-col gap-1.5">
          {links.map((link, idx) => (
            <SidebarLink
              key={idx}
              link={link}
              isActive={currentPath.startsWith(link.href.slice(1))}
            />
          ))}
        </nav>
      </div>

      {/* VIA Logo - Footer */}
      

      {/* User Footer */}
      <div className="border-t border-border/50 pt-4 relative">
        <ProfileFooter openSidebar={open} />
      </div>
    </>
  );
};

const ProfileFooter: React.FC<{ openSidebar: boolean }> = ({ openSidebar }) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => document.documentElement.classList.contains('light') ? 'light' : 'dark');

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (buttonRef.current && buttonRef.current.contains(e.target as Node)) return;
      setOpenMenu(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleProfile = () => { setOpenMenu(false); navigate('/profile'); };
  const handleSettings = () => { setOpenMenu(false); navigate('/settings'); };
  const handleSignOut = async () => { setOpenMenu(false); try { await auth.signOut(); navigate('/auth'); } catch (err) { console.error('signout', err); } };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    if (newTheme === 'light') { root.classList.remove('dark'); root.classList.add('light'); }
    else { root.classList.remove('light'); root.classList.add('dark'); }
    setTheme(newTheme);
    // persist to backend (same as Settings)
    const API_BASE = (import.meta as any).env?.VITE_API_BASE || '/api';
    try {
      const res = await fetch(`${API_BASE}/system_settings`);
      const current = res.ok ? ((await res.json())?.data ?? await res.json() ?? {}) : {};
      await fetch(`${API_BASE}/system_settings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...current, theme: newTheme }) });
    } catch (err) { console.error('Failed to persist theme', err); }
  };

  const toggleMenu = () => {
    const willOpen = !openMenu;
    if (willOpen && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      // menu dimensions estimate (w-44 = 11rem = 176px)
      const menuW = 176;
      // prefer opening to the right of the avatar with small offset
      // try opening to the left of the button first so menu sits beside it
      const leftIfLeft = Math.round(r.left - menuW - 8);
      const leftIfRight = Math.round(r.right + 8);
      // choose left position if it fits, otherwise open to the right; clamp to viewport
      let chosenLeft = leftIfLeft >= 12 ? leftIfLeft : leftIfRight;
      chosenLeft = Math.min(Math.max(chosenLeft, 12), Math.max(12, window.innerWidth - menuW - 12));
      const left = chosenLeft;
      // position the menu just below the button (closer to the click)
      const rawTop = Math.round(r.bottom + 8);
      // clamp vertical position to keep menu visible (estimate max menu height ~160px)
      const minTop = 12;
      const maxTop = Math.max(minTop, window.innerHeight - 160 - 12);
      const top = Math.min(Math.max(rawTop, minTop), maxTop);
      setCoords({ left, top });
    }
    setOpenMenu(willOpen);
  };

  return (
    <div className="pt-2 px-2">
      <div ref={containerRef} className="relative">
        <button ref={buttonRef} onClick={toggleMenu} type="button" className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-colors group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary/20 to-secondary flex items-center justify-center text-xs font-bold text-primary border border-border ring-2 ring-transparent group-hover:ring-primary/20 transition-all flex-shrink-0">
            AD
          </div>
          <motion.div
            animate={{
              display: openSidebar ? "block" : "none",
              opacity: openSidebar ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden text-left"
          >
            <p className="text-sm font-medium text-foreground group-hover:text-foreground whitespace-nowrap">Admin</p>
            <p className="text-xs text-muted-foreground truncate">admin@mock.local</p>
          </motion.div>
        </button>

        {openMenu && coords && createPortal(
          <div
            className={"w-44 bg-white dark:bg-slate-800 shadow-lg rounded-md z-50 border border-border/50 py-1"}
            style={{ position: 'fixed', left: coords.left, top: coords.top, zIndex: 9999 }}
          >
            <button onClick={handleProfile} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center">
              <FiUser className="w-4 h-4 mr-2 text-gray-600 dark:text-slate-300" /> Perfil
            </button>
            <button onClick={handleSettings} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center">
              <FiSettings className="w-4 h-4 mr-2 text-gray-600 dark:text-slate-300" /> Configurações
            </button>
            <button onClick={() => { toggleTheme(); setOpenMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center">
              {theme === 'dark' ? <Sun className="w-4 h-4 mr-2 text-gray-600 dark:text-slate-300" /> : <Moon className="w-4 h-4 mr-2 text-gray-600 dark:text-slate-300" />} {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </button>
            <div className="border-t border-border/50 my-1" />
            <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center">
              <FiLogOut className="w-4 h-4 mr-2" /> Sair
            </button>
          </div>, document.body
        )}
      </div>
    </div>
  );
};

const AppSidebar: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10 bg-card/50 backdrop-blur-xl border-r border-border/50">
        <SidebarContent />
      </SidebarBody>
    </Sidebar>
  );
};

export default AppSidebar;
