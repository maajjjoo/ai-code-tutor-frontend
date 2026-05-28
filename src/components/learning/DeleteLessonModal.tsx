import type { GeneratedLesson } from '../../types/generatedLesson.types';

interface DeleteLessonModalProps {
    lesson: GeneratedLesson | null
    onConfirm: () => void
    onCancel: () => void
}

export function DeleteLessonModal({ lesson, onConfirm, onCancel }: DeleteLessonModalProps) {
    if (!lesson) return null

    return (
        <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-2xl shadow-xl p-6 w-[340px] mx-4 text-center animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>

                <h3 className="text-[16px] font-medium text-gray-900 mb-2">¿Eliminar esta lección?</h3>
                <p className="text-[13px] text-[#534AB7] font-medium mb-2 px-2 leading-snug">"{lesson.title}"</p>
                <p className="text-[12px] text-gray-400 mb-5 leading-relaxed">Esta acción no se puede deshacer. El contenido se perderá permanentemente.</p>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                        ⚠️ Tu límite diario de generaciones no se recupera al eliminar. El contador se reinicia mañana.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-600 font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-medium hover:bg-red-600 transition-colors cursor-pointer">
                        Sí, eliminar
                    </button>
                </div>
            </div>
        </div>
    )
}
