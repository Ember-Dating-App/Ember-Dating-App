import { useLocation, useNavigate } from 'react-router-dom';
import { Flame, Heart, MessageCircle, User } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/discover', icon: Flame, label: 'Discover' },
    { path: '/likes', icon: Heart, label: 'Likes' },
    { path: '/matches', icon: MessageCircle, label: 'Matches' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 h-20 flex items-center justify-around z-50" data-testid="bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`nav-item ${isActive ? 'active' : ''}`}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <item.icon className={`w-6 h-6 ${isActive ? 'text-primary' : ''}`} />
            <span className="text-xs">{item.label}</span>
          </button>
        );
      })}    </nav>
  );
}
