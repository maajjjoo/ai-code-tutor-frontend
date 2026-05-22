import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';
import { UI } from '../../constants/ui.strings';

export function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-[#E5E7EB] dark:border-gray-800 h-16 flex items-center px-12 transition-colors">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-[34px] h-[34px] bg-[#534AB7] rounded-[9px] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <span className="text-[15px] font-medium text-[#111827] dark:text-gray-100">
            <span className="font-normal">AI</span><span className="text-[#534AB7] dark:text-indigo-400">Code</span>Tutor
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          <button onClick={() => navigate('/learning')} className="px-[14px] py-[7px] rounded-lg text-[13px] text-[#6B7280] dark:text-gray-400 bg-transparent hover:bg-[#F9FAFB] dark:hover:bg-gray-800 hover:text-[#111827] dark:hover:text-gray-100 transition-colors cursor-pointer">
            Cursos
          </button>
          <button onClick={() => navigate('/practice')} className="px-[14px] py-[7px] rounded-lg text-[13px] text-[#6B7280] dark:text-gray-400 bg-transparent hover:bg-[#F9FAFB] dark:hover:bg-gray-800 hover:text-[#111827] dark:hover:text-gray-100 transition-colors cursor-pointer">
            Editor
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleDarkMode} className="p-2 rounded-lg border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#6B7280] dark:text-gray-300 hover:bg-[#F9FAFB] dark:hover:bg-gray-700 transition-colors cursor-pointer" title={isDark ? UI.LIGHT_MODE : UI.DARK_MODE}>
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-9 h-9 bg-[#EEEDFE] dark:bg-indigo-900/30 rounded-full flex items-center justify-center hover:bg-[#DDD9FC] dark:hover:bg-indigo-900/50 transition-colors" aria-label={UI.USER_MENU}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-indigo-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-[44px] w-[220px] bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#E5E7EB] dark:border-gray-700">
                    <p className="text-[13px] font-medium text-[#111827] dark:text-gray-100 truncate">{user.username}</p>
                    <p className="text-[11px] text-[#9CA3AF] truncate">{user.email}</p>
                  </div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-[13px] text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>{UI.SIGN_OUT}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/login')} className="px-[14px] py-[7px] rounded-lg text-[13px] text-[#6B7280] dark:text-gray-400 bg-transparent hover:bg-[#F9FAFB] dark:hover:bg-gray-800 hover:text-[#111827] dark:hover:text-gray-100 transition-colors cursor-pointer">
                Iniciar sesión
              </button>
              <button onClick={() => navigate('/register')} className="px-[18px] py-[8px] rounded-lg text-[13px] font-medium text-white bg-[#534AB7] dark:bg-indigo-600 hover:bg-[#3C3489] dark:hover:bg-indigo-700 transition-colors cursor-pointer">
                Empezar gratis →
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
