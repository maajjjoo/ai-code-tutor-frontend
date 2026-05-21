import React from 'react';

export function FeaturesRow() {
  return (
    <section className="bg-white py-12 px-5 sm:px-[80px]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {/* Feature 1 — Real-time analysis */}
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-8 h-8 bg-[#EEEDFE] rounded-lg flex items-center justify-center mb-[10px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h4 className="text-[13px] font-medium text-[#111827] mb-1">Real-time analysis</h4>
          <p className="text-[12px] text-[#4B5563] leading-[1.6]">
            Detects functions and blocks as you write, no need to run the code.
          </p>
        </div>

        {/* Feature 2 — Tutor, not generator */}
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-8 h-8 bg-[#E1F5EE] rounded-lg flex items-center justify-center mb-[10px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
          <h4 className="text-[13px] font-medium text-[#111827] mb-1">Tutor, not generator</h4>
          <p className="text-[12px] text-[#4B5563] leading-[1.6]">
            Guides and explains at every step, but never writes the project for you.
          </p>
        </div>

        {/* Feature 3 — Saved progress */}
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-8 h-8 bg-[#FAEEDA] rounded-lg flex items-center justify-center mb-[10px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h4 className="text-[13px] font-medium text-[#111827] mb-1">Saved progress</h4>
          <p className="text-[12px] text-[#4B5563] leading-[1.6]">
            Your completed lessons and projects are saved so you can continue anytime.
          </p>
        </div>
      </div>
    </section>
  );
}

export default React.memo(FeaturesRow);
