import { useNavigate } from 'react-router-dom';

function PurpleCheck() {
  return (
    <div className="w-[18px] h-[18px] bg-[#EEEDFE] dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-indigo-400">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

function TealCheck() {
  return (
    <div className="w-[18px] h-[18px] bg-[#E1F5EE] dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-teal-400">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

const LANG_PILLS = [
  { label: 'Python', bg: '#EEF2FF', text: '#3730A3', border: '#C7D2FE' },
  { label: 'Java', bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA' },
  { label: 'JavaScript', bg: '#FEFCE8', text: '#854D0E', border: '#FEF08A' },
  { label: 'TypeScript', bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
];

export function ModesSection() {
  const navigate = useNavigate();

  return (
    <section className="py-[72px] px-12 bg-white dark:bg-gray-900 transition-colors">
      <p className="text-[11px] text-[#9CA3AF] dark:text-gray-400 uppercase tracking-wider text-center mb-[10px]">
        Elige tu modo
      </p>
      <h2 className="text-[26px] font-medium text-[#111827] dark:text-white text-center mb-12">
        ¿Cómo quieres aprender hoy?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[860px] mx-auto">
        {/* Practice card */}
        <div className="relative rounded-[20px] p-8 border border-[#AFA9EC] dark:border-indigo-500/50 transition-all duration-300 hover:-translate-y-[3px] hover:border-[#534AB7] dark:hover:border-indigo-400"
          style={{ background: 'linear-gradient(135deg, #FAFAFF 0%, #F0EEFF 100%)' }}
        >
          <div className="absolute top-5 right-5 bg-[#EEEDFE] dark:bg-indigo-900/40 text-[#3C3489] dark:text-indigo-200 border border-[#AFA9EC] dark:border-indigo-500/50 rounded-full px-[10px] py-[3px] text-[10px] font-medium">
            Editor IA
          </div>
          <div className="w-11 h-11 bg-[#EEEDFE] dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-[18px]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-indigo-400">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[#111827] dark:text-white mb-2">Practicar con IA</h3>
          <p className="text-[13px] text-[#6B7280] dark:text-gray-400 leading-relaxed mb-[22px]">
            Escribe código libremente. El tutor analiza en tiempo real y te guía sin darte la respuesta.
          </p>
          <div className="flex flex-col gap-[9px] mb-7">
            {['Editor con resaltado de sintaxis', 'Chat con tutor IA contextual', 'Historial de versiones y undo/redo'].map(item => (
              <div key={item} className="flex items-center gap-[9px] text-xs text-[#4B5563] dark:text-gray-400">
                <PurpleCheck />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/practice')}
            className="w-full py-3 rounded-xl text-[13px] font-medium text-white bg-[#534AB7] dark:bg-indigo-600 hover:bg-[#3C3489] dark:hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Ir al editor →
          </button>
        </div>

        {/* Learning card */}
        <div className="relative rounded-[20px] p-8 border border-[#9FE1CB] dark:border-teal-500/50 transition-all duration-300 hover:-translate-y-[3px] hover:border-[#0F6E56] dark:hover:border-teal-400"
          style={{ background: 'linear-gradient(135deg, #F0FDF8 0%, #E1F5EE 100%)' }}
        >
          <div className="absolute top-5 right-5 bg-[#E1F5EE] dark:bg-teal-900/40 text-[#085041] dark:text-teal-200 border border-[#9FE1CB] dark:border-teal-500/50 rounded-full px-[10px] py-[3px] text-[10px] font-medium">
            Cursos
          </div>
          <div className="w-11 h-11 bg-[#E1F5EE] dark:bg-teal-900/30 rounded-xl flex items-center justify-center mb-[18px]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-teal-400">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[#111827] dark:text-white mb-2">Aprendizaje guiado</h3>
          <p className="text-[13px] text-[#6B7280] dark:text-gray-400 leading-relaxed mb-[22px]">
            Lecciones cortas y claras desde cero. Con ejercicios verificados por IA al final de cada tema.
          </p>
          <div className="flex flex-wrap gap-[6px] mb-[22px]">
            {LANG_PILLS.map(pill => (
              <span key={pill.label} className="px-3 py-1 rounded-full text-[11px] font-medium border"
                style={{ backgroundColor: pill.bg, color: pill.text, borderColor: pill.border }}
              >
                {pill.label}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-[9px] mb-7">
            {['Lecciones desde nivel cero', 'Ejercicios verificados con IA'].map(item => (
              <div key={item} className="flex items-center gap-[9px] text-xs text-[#4B5563] dark:text-gray-400">
                <TealCheck />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/learning')}
            className="w-full py-3 rounded-xl text-[13px] font-medium text-[#111827] dark:text-gray-200 bg-white dark:bg-gray-800 border border-[#D1FAE5] dark:border-teal-700 hover:bg-[#E1F5EE] dark:hover:bg-teal-900/30 hover:text-[#085041] dark:hover:text-teal-300 transition-colors cursor-pointer"
          >
            Explorar cursos →
          </button>
        </div>
      </div>
    </section>
  );
}
