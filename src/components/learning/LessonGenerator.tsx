import { useState, useEffect } from 'react';
import type { GeneratedLesson } from '../../types/generatedLesson.types';
import { useLessonGenerator } from '../../hooks/useLessonGenerator';

const LANGUAGES = [
    { id: 'python', label: 'Python', color: 'bg-[#3B82F6]' },
    { id: 'java', label: 'Java', color: 'bg-[#F59E0B]' },
    { id: 'javascript', label: 'JavaScript', color: 'bg-[#EAB308]' },
    { id: 'typescript', label: 'TypeScript', color: 'bg-[#6366F1]' },
] as const;

const PROGRESS_MESSAGES = [
    'Analizando el tema...',
    'Creando explicaciones...',
    'Preparando ejemplos de código...',
    'Diseñando el ejercicio...',
    'Finalizando la lección...',
];

const LANGUAGE_DOT_COLORS: Record<string, string> = {
    python: '#3B82F6',
    java: '#F59E0B',
    javascript: '#EAB308',
    typescript: '#6366F1',
};

interface Props {
    onLessonReady: (lesson: GeneratedLesson) => void;
    onClose: () => void;
}

export function LessonGenerator({ onLessonReady, onClose }: Props) {
    const {
        status, isGenerating, error,
        loadStatus, generate, saveLesson, deleteLesson, openLesson, setError,
    } = useLessonGenerator();

    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState('');
    const [activeTab, setActiveTab] = useState<'generate' | 'lessons'>('generate');
    const [progressIndex, setProgressIndex] = useState(0);

    useEffect(() => {
        loadStatus();
    }, []);

    useEffect(() => {
        if (!isGenerating) return;
        setProgressIndex(0);
        const interval = setInterval(() => {
            setProgressIndex(prev => (prev + 1) % PROGRESS_MESSAGES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isGenerating]);

    const canSubmit = topic.length >= 3 && language !== '' && !isGenerating;
    const canGenerate = status?.canGenerate ?? true;

    const handleGenerate = async () => {
        if (!canSubmit || !canGenerate) return;
        setError(null);
        const result = await generate({ topic, language });
        if (result) {
            onLessonReady(result);
        }
    };

    const lessons = status?.lessons ?? [];

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="flex items-center justify-between px-6 h-12 border-b border-[#E5E7EB] shrink-0">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('generate')}
                        className={`text-[13px] font-medium pb-[2px] border-b-2 transition-colors cursor-pointer ${
                            activeTab === 'generate'
                                ? 'border-[#534AB7] text-[#534AB7]'
                                : 'border-transparent text-[#6B7280] hover:text-[#374151]'
                        }`}
                    >
                        Generar
                    </button>
                    <button
                        onClick={() => setActiveTab('lessons')}
                        className={`text-[13px] font-medium pb-[2px] border-b-2 transition-colors cursor-pointer ${
                            activeTab === 'lessons'
                                ? 'border-[#534AB7] text-[#534AB7]'
                                : 'border-transparent text-[#6B7280] hover:text-[#374151]'
                        }`}
                    >
                        Mis lecciones ({lessons.length})
                    </button>
                </div>
                <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#374151] text-lg cursor-pointer leading-none">&times;</button>
            </div>

            {activeTab === 'generate' && (
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="max-w-lg mx-auto">
                        <div className="bg-gradient-to-b from-[#FAFAFF] to-[#F0EEFF] rounded-2xl p-6 mb-6 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EEEDFE] border border-[#AFA9EC] rounded-full text-[11px] text-[#3C3489] font-medium mb-3">
                                <span className="w-1.5 h-1.5 bg-[#534AB7] rounded-full animate-pulse" />
                                Lección generada por IA
                            </span>
                            <h2 className="text-lg font-semibold text-[#111827] mb-1">¿Qué quieres aprender?</h2>
                            <p className="text-[13px] text-[#6B7280]">Describe el tema y la IA crea una lección personalizada</p>
                        </div>

                        <div className="mb-4">
                            <label className="flex items-center gap-2 text-[13px] font-medium text-[#374151] mb-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#534AB7] text-white text-[11px] font-bold flex items-center justify-center">1</span>
                                Tema
                            </label>
                            <textarea
                                value={topic}
                                onChange={e => { setTopic(e.target.value); setError(null); }}
                                placeholder="Ej: recursión, manejo de errores, programación orientada a objetos..."
                                rows={3}
                                maxLength={200}
                                className="w-full bg-white border border-[#D1D5DB] rounded-xl px-3 py-2.5 text-[13px] text-[#111827] placeholder-[#9CA3AF] resize-none focus:outline-none focus:border-[#534AB7]"
                            />
                            <div className="text-right text-[11px] text-[#9CA3AF] mt-1">{topic.length}/200</div>
                        </div>

                        <div className="mb-4">
                            <label className="flex items-center gap-2 text-[13px] font-medium text-[#374151] mb-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#534AB7] text-white text-[11px] font-bold flex items-center justify-center">2</span>
                                Lenguaje
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.id}
                                        onClick={() => setLanguage(lang.id)}
                                        className={`flex items-center gap-2 border rounded-xl p-2.5 text-[13px] cursor-pointer transition-colors ${
                                            language === lang.id
                                                ? 'border-[#534AB7] bg-[#EEEDFE] text-[#534AB7]'
                                                : 'border-[#E5E7EB] text-[#374151] hover:border-[#D1D5DB]'
                                        }`}
                                    >
                                        <span className={`w-2.5 h-2.5 rounded-full ${lang.color}`} />
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {status && (
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-[#9CA3AF]">
                                    Generadas hoy: {status.generatedToday}/{status.dailyLimit} &middot; Almacenadas: {status.storedCount}/{status.storageLimit}
                                </span>
                            </div>
                        )}

                        {!canGenerate && status?.reason && (
                            <div className="bg-[#FAEEDA] text-[#633806] border border-[#FAC775] rounded-lg p-2 text-[12px] mb-3">
                                {status.reason}
                            </div>
                        )}

                        {error && (
                            <div className="bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] rounded-lg p-2 text-[12px] mb-3">
                                {error}
                            </div>
                        )}

                        {isGenerating && (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <div className="w-10 h-10 border-4 border-[#EEEDFE] border-t-[#534AB7] rounded-full animate-spin" />
                                <span className="text-[#534AB7] font-medium text-[14px]">Generando tu lección...</span>
                                <span className="text-xs text-[#9CA3AF]">{PROGRESS_MESSAGES[progressIndex]}</span>
                                <span className="text-[11px] text-[#9CA3AF]">Esto puede tomar entre 10 y 20 segundos</span>
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={!canSubmit || !canGenerate || isGenerating}
                            className="w-full bg-[#534AB7] text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 text-[14px] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-opacity"
                        >
                            {isGenerating ? (
                                <>Generando tu lección...</>
                            ) : (
                                <><span className="text-lg leading-none">&#9733;</span> Generar lección con IA</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'lessons' && (
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {lessons.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" className="mb-3">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                            <p className="text-[13px] text-[#9CA3AF] font-medium">Aún no has generado lecciones</p>
                            <p className="text-[12px] text-[#9CA3AF] mt-1">Usa el formulario para crear tu primera lección</p>
                        </div>
                    ) : (
                        <div className="max-w-lg mx-auto space-y-2">
                            {lessons.map(lesson => (
                                <div key={lesson.id} className="bg-white border border-[#E5E7EB] rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LANGUAGE_DOT_COLORS[lesson.language] ?? '#9CA3AF' }} />
                                        <span className="text-[13px] font-medium text-[#111827] truncate">{lesson.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] px-1.5 py-0.5 bg-[#F3F4F6] text-[#6B7280] rounded">{lesson.level}</span>
                                        <span className="text-[11px] text-[#9CA3AF]">{lesson.topic}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        {lesson.saved ? (
                                            <span className="text-[10px] text-[#534AB7]">&#9733; Guardada</span>
                                        ) : lesson.daysUntilExpiry <= 3 ? (
                                            <span className="text-[10px] text-red-500">&#9888;&#65039; Expira en {lesson.daysUntilExpiry} días</span>
                                        ) : (
                                            <span className="text-[10px] text-[#9CA3AF]">&#9201; Expira en {lesson.daysUntilExpiry} días</span>
                                        )}
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openLesson(lesson.id).then(() => {
                                                if (lesson.id) {
                                                    const savedLesson = lesson;
                                                    setTimeout(() => onLessonReady(savedLesson), 100);
                                                }
                                            })}
                                            className="bg-[#534AB7] text-white rounded-lg px-3 py-1 text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity"
                                        >
                                            Estudiar
                                        </button>
                                        {!lesson.saved && (
                                            <button
                                                onClick={() => saveLesson(lesson.id)}
                                                className="bg-[#EEEDFE] text-[#534AB7] rounded-lg px-3 py-1 text-xs font-medium cursor-pointer hover:bg-[#CECBF6] transition-colors"
                                            >
                                                &#128190; Guardar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteLesson(lesson.id)}
                                            className="bg-[#FEE2E2] text-[#DC2626] rounded-lg px-3 py-1 text-xs font-medium cursor-pointer hover:bg-[#FECACA] transition-colors"
                                        >
                                            &#128465; Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
