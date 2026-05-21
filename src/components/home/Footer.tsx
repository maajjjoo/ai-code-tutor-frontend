import React from 'react';

export function Footer() {
  return (
    <footer className="bg-[#F9FAFB] border-t border-[#E5E7EB] h-[52px] px-5 sm:px-[80px] flex items-center justify-between">
      <p className="text-[12px] text-[#9CA3AF]">
        AICodeTutor — University project · Data structures and software patterns
      </p>
      <div className="flex items-center gap-6">
        <a href="/about" className="text-[12px] text-[#9CA3AF] no-underline hover:text-[#4B5563] transition-colors cursor-pointer">
          About
        </a>
        <a href="https://github.com/Josecampoe" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#9CA3AF] no-underline hover:text-[#4B5563] transition-colors cursor-pointer">
          GitHub
        </a>
      </div>
    </footer>
  );
}

export default React.memo(Footer);
