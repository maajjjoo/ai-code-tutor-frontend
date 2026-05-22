export function Footer() {
  return (
    <footer className="py-6 px-12 border-t border-[#F3F4F6] dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2">
        <div className="w-[20px] h-[20px] bg-[#534AB7] rounded-[5px] flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </div>
        <span className="text-xs text-[#111827] dark:text-gray-100">
          <span className="font-normal">AI</span><span className="text-[#534AB7] dark:text-indigo-400">Code</span>Tutor
        </span>
      </div>
      <p className="text-xs text-[#9CA3AF]">© 2026 · Hecho para aprender programación</p>
    </footer>
  );
}
