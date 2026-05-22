import { useNavigate } from 'react-router-dom';

const CODE_LINES = [
  { type: 'comment', text: '# Calculadora simple en Python' },
  { type: 'blank' },
  { type: 'keyword', text: 'def ' },
  { type: 'function', text: 'calcular' },
  { type: 'plain', text: '(a, b, operacion):' },
  { type: 'keyword', text: '    if ' },
  { type: 'plain', text: 'operacion == ' },
  { type: 'string', text: "'+'" },
  { type: 'keyword', text: '        return ' },
  { type: 'plain', text: 'a + b' },
  { type: 'keyword', text: '    elif ' },
  { type: 'plain', text: 'operacion == ' },
  { type: 'string', text: "'-'" },
  { type: 'keyword', text: '        return ' },
  { type: 'plain', text: 'a - b' },
  { type: 'blank' },
  { type: 'function', text: 'print' },
  { type: 'plain', text: '(calcular(' },
  { type: 'number', text: '5' },
  { type: 'plain', text: ', ' },
  { type: 'number', text: '3' },
  { type: 'plain', text: ", '" },
  { type: 'string', text: '+' },
  { type: 'plain', text: "'))" },
];

const STYLES: Record<string, string> = {
  comment: 'text-gray-500 italic',
  keyword: 'text-purple-400',
  function: 'text-blue-400',
  string: 'text-green-400',
  number: 'text-orange-400',
  plain: 'text-gray-300',
};

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden pt-20 pb-[72px] px-12 flex flex-col items-center text-center"
      style={{ background: 'linear-gradient(160deg, #FAFAFF 0%, #F0EEFF 40%, #E8F4F0 100%)' }}
    >
      {/* Dark mode gradient */}
      <div className="absolute inset-0 hidden dark:block pointer-events-none"
        style={{ background: 'linear-gradient(160deg, #13111F 0%, #1a1730 40%, #111E1A 100%)' }}
      />

      {/* Decorative orbs */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(83,74,183,0.08) 0%, transparent 70%)' }}
      />
      <div className="absolute bottom-[-80px] right-[-60px] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(15,110,86,0.07) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 border border-[#AFA9EC] dark:border-indigo-500/50 rounded-full px-4 py-1.5 text-xs font-medium text-[#3C3489] dark:text-indigo-300 mb-7">
          <span className="w-[7px] h-[7px] rounded-full bg-[#5DCAA5] animate-pulse-dot" />
          Tutor con IA disponible ahora
        </div>

        {/* Title */}
        <h1 className="text-[46px] font-medium text-[#111827] dark:text-white leading-[1.15] mb-[18px] max-w-[600px]">
          Aprende a programar con<br />
          un <span className="text-[#534AB7] dark:text-indigo-400">tutor inteligente</span><br />
          <span className="text-[#0F6E56] dark:text-teal-400">a tu lado</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base text-[#6B7280] dark:text-gray-400 max-w-[460px] leading-relaxed mb-9">
          La IA analiza tu código, explica qué hace y te guía paso a paso. No da respuestas — aprendes haciendo.
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-3 mb-[52px]">
          <button
            onClick={() => navigate('/practice')}
            className="bg-[#534AB7] dark:bg-indigo-600 text-white rounded-xl px-[26px] py-[13px] text-sm font-medium hover:bg-[#3C3489] dark:hover:bg-indigo-700 hover:-translate-y-[1px] transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Empezar a practicar
          </button>
          <button
            onClick={() => navigate('/learning')}
            className="bg-white dark:bg-gray-800 text-[#374151] dark:text-gray-200 rounded-xl px-[26px] py-[13px] text-sm font-medium border border-[#E5E7EB] dark:border-gray-700 hover:border-[#534AB7] dark:hover:border-indigo-500 hover:text-[#534AB7] dark:hover:text-indigo-400 hover:-translate-y-[1px] transition-all duration-200 cursor-pointer flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Explorar cursos
          </button>
        </div>

        {/* Code preview card */}
        <div className="bg-[#1E1E2E] rounded-[16px] max-w-[520px] w-full mx-auto border border-[#333] animate-float overflow-hidden">
          <div className="bg-[#2A2A3E] border-b border-[#333] px-4 py-[10px] flex items-center">
            <div className="flex items-center gap-[6px]">
              <span className="w-[10px] h-[10px] rounded-full bg-[#FF5F56]" />
              <span className="w-[10px] h-[10px] rounded-full bg-[#FFBD2E]" />
              <span className="w-[10px] h-[10px] rounded-full bg-[#27C93F]" />
            </div>
            <span className="text-[11px] font-mono text-[#6B7280] ml-[8px]">calculadora.py</span>
          </div>
          <div className="px-5 py-4 font-mono text-xs leading-[1.8]">
            {CODE_LINES.map((line, i) => (
              line.type === 'blank' ? (
                <div key={i} className="h-[18px]" />
              ) : line.type === 'comment' ? (
                <div key={i} className="text-gray-500 italic">{line.text}</div>
              ) : (
                <div key={i} className={STYLES[line.type]}>{line.text}</div>
              )
            ))}
            <span className="inline-block w-[2px] h-[14px] bg-[#534AB7] ml-[1px] align-text-bottom animate-blink" />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center mt-10 pt-10 max-w-[480px] w-full"
          style={{ borderTop: '0.5px solid rgba(83,74,183,0.15)' }}
        >
          {[
            { num: '4', label: 'Lenguajes' },
            { num: '120', label: 'Lecciones' },
            { num: '3', label: 'Niveles' },
            { num: 'IA', label: 'Tutor 24/7' },
          ].map((stat, i, arr) => (
            <div key={stat.label} className={`flex-1 text-center ${i < arr.length - 1 ? 'border-r border-[#E5E7EB] dark:border-gray-700' : ''}`}>
              <div className="text-2xl font-medium text-[#534AB7] dark:text-indigo-400">{stat.num}</div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
