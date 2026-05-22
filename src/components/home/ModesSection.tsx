import { useNavigate } from 'react-router-dom';

function PurpleCheck() {
  return (
    <div className='w-[14px] h-[14px] bg-[#EEEDFE] dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0'>
      <svg width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='#534AB7' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' className='dark:stroke-indigo-400'>
        <polyline points='20 6 9 17 4 12' />
      </svg>
    </div>
  );
}

function TealCheck() {
  return (
    <div className='w-[14px] h-[14px] bg-[#E1F5EE] dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0'>
      <svg width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='#0F6E56' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' className='dark:stroke-teal-400'>
        <polyline points='20 6 9 17 4 12' />
      </svg>
    </div>
  );
}

interface ChipProps {
  label: string;
  bg: string;
  text: string;
  border: string;
}

function Chip({ label, bg, text, border }: ChipProps) {
  return (
    <span
      className='px-[10px] py-[3px] rounded-full text-[11px] font-medium border'
      style={{ backgroundColor: bg, color: text, borderColor: border }}
    >
      {label}
    </span>
  );
}

export function ModesSection() {
  const navigate = useNavigate();

  return (
    <section className='bg-[#F9FAFB] dark:bg-gray-800/50 py-12 px-5 sm:px-[80px] transition-colors'>
      <p className='text-center text-[12px] font-medium uppercase tracking-[0.06em] text-[#9CA3AF] mb-6'>
        Choose your mode
      </p>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto'>
        <div className='bg-white dark:bg-gray-900 border-2 border-[#AFA9EC] dark:border-indigo-500/50 rounded-xl p-5'>
          <div className='flex items-center justify-between'>
            <div className='w-9 h-9 bg-[#EEEDFE] dark:bg-indigo-900/30 rounded-lg flex items-center justify-center'>
              <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#534AB7' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='dark:stroke-indigo-400'>
                <polyline points='16 18 22 12 16 6' />
                <polyline points='8 6 2 12 8 18' />
              </svg>
            </div>
            <span className='bg-[#EEEDFE] dark:bg-indigo-900/40 text-[#3C3489] dark:text-indigo-200 px-2 py-[3px] rounded-full text-[11px] font-medium'>
              AI Editor
            </span>
          </div>

          <h3 className='text-[15px] font-medium text-[#111827] dark:text-gray-100 mt-3'>Practice with AI</h3>

          <p className='text-[13px] text-[#4B5563] dark:text-gray-400 leading-[1.6] mt-2 mb-[14px]'>
            Write code freely. The AI analyzes each function in real time, explains what it does, and suggests next steps without solving it for you.
          </p>

          <ul className='space-y-0'>
            {[
              'Code editor with syntax highlighting',
              'Automatic code explanations',
              'Next step suggestions',
              'Undo/redo and version history',
            ].map((item) => (
              <li key={item} className='flex items-center gap-[7px] py-[3px]'>
                <PurpleCheck />
                <span className='text-[12px] text-[#4B5563] dark:text-gray-400'>{item}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => navigate('/practice')}
            className='w-full mt-4 bg-[#534AB7] dark:bg-indigo-600 text-white rounded-lg py-2 text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer'
          >
            Go to editor →
          </button>
        </div>

        <div className='bg-white dark:bg-gray-900 border border-[#E5E7EB] dark:border-gray-800 rounded-xl p-5'>
          <div className='w-9 h-9 bg-[#E1F5EE] dark:bg-teal-900/30 rounded-lg flex items-center justify-center'>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#0F6E56' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='dark:stroke-teal-400'>
              <path d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20' />
              <path d='M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' />
              <line x1='8' y1='7' x2='16' y2='7' />
              <line x1='8' y1='11' x2='14' y2='11' />
            </svg>
          </div>

          <h3 className='text-[15px] font-medium text-[#111827] dark:text-gray-100 mt-3'>Learning</h3>

          <p className='text-[13px] text-[#4B5563] dark:text-gray-400 leading-[1.6] mt-2 mb-[14px]'>
            Learn from scratch with short clear lessons. From your first language to data structures, design patterns, and best practices.
          </p>

          <div className='flex flex-wrap gap-[6px] mb-[14px]'>
            <Chip label='Python' bg='#E1F5EE' text='#085041' border='#9FE1CB' />
            <Chip label='Java' bg='#E1F5EE' text='#085041' border='#9FE1CB' />
            <Chip label='JavaScript' bg='#E1F5EE' text='#085041' border='#9FE1CB' />
            <Chip label='Data Structures' bg='#EEEDFE' text='#3C3489' border='#CECBF6' />
            <Chip label='Design Patterns' bg='#EEEDFE' text='#3C3489' border='#CECBF6' />
            <Chip label='OOP' bg='#FAEEDA' text='#633806' border='#FAC775' />
            <Chip label='Algorithms' bg='#E6F1FB' text='#0C447C' border='#B5D4F4' />
          </div>

          <ul className='space-y-0'>
            {[
              'Lessons from zero level',
              'Interactive examples per topic',
              'Practice each lesson in the editor',
            ].map((item) => (
              <li key={item} className='flex items-center gap-[7px] py-[3px]'>
                <TealCheck />
                <span className='text-[12px] text-[#4B5563] dark:text-gray-400'>{item}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => navigate('/learning')}
            className='w-full mt-4 border border-[#E5E7EB] dark:border-gray-700 bg-transparent text-[#111827] dark:text-gray-200 rounded-lg py-2 text-[13px] font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer'
          >
            Explore courses →
          </button>
        </div>
      </div>
    </section>
  );
}
