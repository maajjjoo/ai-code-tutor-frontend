import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] h-[56px] flex items-center px-5 sm:px-[80px]">
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-[28px] h-[28px] bg-[#534AB7] rounded-[6px] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <span className="text-[15px] font-medium text-[#111827]">AICodeTutor</span>
        </div>

        {/* Right side */}
        {user ? (
          /* ─── Logged in: user icon with dropdown ─── */
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 bg-[#EEEDFE] rounded-full flex items-center justify-center hover:bg-[#DDD9FC] transition-colors"
              aria-label="User menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-[44px] w-[220px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-2 z-50">
                {/* User info */}
                <div className="px-4 py-2 border-b border-[#E5E7EB]">
                  <p className="text-[13px] font-medium text-[#111827] truncate">{user.username}</p>
                  <p className="text-[11px] text-[#9CA3AF] truncate">{user.email}</p>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-[13px] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ─── Not logged in: Log in + Sign up ─── */
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="border border-[#E5E7EB] bg-transparent text-[#111827] px-4 py-[7px] rounded-lg text-[13px] font-medium hover:bg-gray-50 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-[#534AB7] text-white px-4 py-[7px] rounded-lg text-[13px] font-medium hover:opacity-90 transition-opacity"
            >
              Sign up
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default React.memo(Navbar);
