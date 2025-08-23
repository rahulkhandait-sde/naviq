import { NavLink, useLocation } from 'react-router-dom';
import { 
  HiHome, 
  HiQrCode, 
  HiMap, 
  HiUser,
  HiChatBubbleLeftRight 
} from 'react-icons/hi2';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Don't show navbar on login page
  if (location.pathname === '/login' || !user) {
    return null;
  }

  const navItems = [
    { path: '/home', icon: HiHome, label: 'Home' },
    { path: '/scan', icon: HiQrCode, label: 'Scan' },
    { path: '/map', icon: HiMap, label: 'Map' },
    { path: '/chat', icon: HiChatBubbleLeftRight, label: 'Bot' },
    { path: '/profile', icon: HiUser, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-sm border-t border-white/20 safe-area-bottom z-40">
      <div className="flex justify-around items-center py-2 px-4">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : 'inactive'}`
            }
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
