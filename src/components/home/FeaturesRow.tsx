export function FeaturesRow() {
  return (
    <section className="py-[72px] px-12 bg-[#FAFAFA] dark:bg-gray-900 border-t border-[#F3F4F6] dark:border-gray-800 transition-colors">
      <p className="text-[11px] text-[#9CA3AF] dark:text-gray-400 uppercase tracking-wider text-center mb-[10px]">
        Por qué AICodeTutor
      </p>
      <h2 className="text-[26px] font-medium text-[#111827] dark:text-white text-center mb-12">
        Todo lo que necesitas para aprender
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[860px] mx-auto">
        {/* Card 1 */}
        <div className="bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-[16px] p-6 transition-all duration-200 hover:border-[#AFA9EC] dark:hover:border-indigo-500/50 hover:-translate-y-[2px]">
          <div className="w-9 h-9 bg-[#EEEDFE] dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-indigo-400">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-[#111827] dark:text-white mb-1">Sin spoilers</h4>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
            El tutor no da la respuesta directa. Te hace preguntas para que llegues solo.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-[16px] p-6 transition-all duration-200 hover:border-[#AFA9EC] dark:hover:border-indigo-500/50 hover:-translate-y-[2px]">
          <div className="w-9 h-9 bg-[#E1F5EE] dark:bg-teal-900/30 rounded-lg flex items-center justify-center mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-teal-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-[#111827] dark:text-white mb-1">Feedback inmediato</h4>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
            La IA revisa tu código al instante. Te dice exactamente qué mejorar con ejemplos concretos.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-[16px] p-6 transition-all duration-200 hover:border-[#AFA9EC] dark:hover:border-indigo-500/50 hover:-translate-y-[2px]">
          <div className="w-9 h-9 bg-[#FFF7ED] dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-amber-400">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-[#111827] dark:text-white mb-1">A tu propio ritmo</h4>
          <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
            Sin presiones. Avanza cuando quieras y repasa las lecciones que necesites.
          </p>
        </div>
      </div>
    </section>
  );
}
