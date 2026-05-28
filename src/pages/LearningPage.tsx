import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UI } from '../constants/ui.strings';
import { usePageTitle } from '../hooks/usePageTitle';
import { useLearning } from '../hooks/useLearning';
import { useLessonGenerator } from '../hooks/useLessonGenerator';
import { LearningSidebar } from '../components/learning/sidebar/LearningSidebar';
import { LevelSelectionScreen } from '../components/learning/screens/LevelSelectionScreen';
import { LessonView } from '../components/learning/lesson/LessonView';
import { LessonGenerator } from '../components/learning/LessonGenerator';
import { SectionCard } from '../components/learning/sections/SectionCard';
import { CompletionModal } from '../components/learning/modals/CompletionModal';
import { RestartModal } from '../components/learning/modals/RestartModal';
import type { GeneratedLesson } from '../types/generatedLesson.types';
import type { LessonSection } from '../types/learning.types';

function parseContentJson(contentJson: string | object): { title?: string; summary?: string; estimatedMinutes?: number; sections?: LessonSection[] } | null {
  if (typeof contentJson === 'object' && contentJson !== null) {
    return contentJson as any;
  }
  if (typeof contentJson !== 'string') {
    return null;
  }
  try {
    return JSON.parse(contentJson);
  } catch (e1) {
  }
  try {
    let fixed = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < contentJson.length; i++) {
      const char = contentJson[i];
      const code = contentJson.charCodeAt(i);
      if (escaped) {
        fixed += char;
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        fixed += char;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        fixed += char;
        continue;
      }
      if (inString) {
        if (code === 10) {
          fixed += '\\n';
        } else if (code === 13) {
          fixed += '\\r';
        } else if (code === 9) {
          fixed += '\\t';
        } else if (code < 32) {
          fixed += '\\u' + code.toString(16).padStart(4, '0');
        } else {
          fixed += char;
        }
      } else {
        fixed += char;
      }
    }
    return JSON.parse(fixed);
  } catch (e2) {
    console.error('All parse attempts failed:', e2);
    return null;
  }
}

export function LearningPage() {
  usePageTitle(UI.LEARNING);
  const navigate = useNavigate();
  const {
    viewState, selectedCourse, selectedLevel, currentLessonNumber,
    currentLesson, currentSectionIndex, isLoadingLesson, lessonError,
    isCompletionModalOpen, revealedHints, sections, scrollRef,
    doneLessons, completionCounts, levelsDone, isLastLevel, displayTitle,
    handleCourseSelect, handleLevelSelect, handleLevelTabClick,
    handleLessonComplete, handlePrevious, handleNext,
    handleNextLevel, handleHintReveal,
    handleStepClick, setIsCompletionModalOpen,
    isRestartModalOpen, restartTarget,
    handleRestartClick, handleRestartLevel, setIsRestartModalOpen,
    loadLesson,
  } = useLearning();

  const { status, loadStatus, openLesson } = useLessonGenerator();

  useEffect(() => {
    loadStatus();
  }, []);

  const [showGenerator, setShowGenerator] = useState(false);
  const [aiGeneratedLesson, setAiGeneratedLesson] = useState<GeneratedLesson | null>(null);
  const [generatedSectionIndex, setGeneratedSectionIndex] = useState(0);

  useEffect(() => {
    setGeneratedSectionIndex(0);
  }, [aiGeneratedLesson?.id]);

  useEffect(() => {
    const el = document.getElementById('generated-lesson-content');
    el?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [generatedSectionIndex]);

  const parsedAiLesson = aiGeneratedLesson ? parseContentJson(aiGeneratedLesson.contentJson) : null;
  const aiSections = parsedAiLesson?.sections ?? [];
  const totalSections = aiSections.length;

  const handleLessonReady = (lesson: GeneratedLesson) => {
    setAiGeneratedLesson(lesson);
    setShowGenerator(false);
    setGeneratedSectionIndex(0);
    loadStatus();
  };

  const handleCloseGenerator = () => {
    setShowGenerator(false);
    loadStatus();
  };

  const handleBackToCourses = () => {
    setAiGeneratedLesson(null);
    setGeneratedSectionIndex(0);
  };

  const handleOpenAiLesson = async (lessonId: number) => {
    const lesson = await openLesson(lessonId);
    if (lesson) {
      setAiGeneratedLesson(lesson);
      setGeneratedSectionIndex(0);
    }
  };

  const aiLessons = status?.lessons ?? [];

  const generatedLessonView = aiGeneratedLesson && (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-12 bg-white dark:bg-gray-900 flex items-center justify-between px-6 border-b border-[#E5E7EB] dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-1.5 text-[12px]">
          <span className="text-[#9CA3AF]">IA</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className="text-[#111827] dark:text-gray-100 font-medium truncate max-w-[200px]">{parsedAiLesson?.title ?? aiGeneratedLesson.title}</span>
        </div>
        <button
          onClick={handleBackToCourses}
          className="flex items-center gap-1.5 px-3 py-[6px] bg-[#EEEDFE] text-[#534AB7] rounded-lg text-[12px] font-medium hover:bg-[#CECBF6] transition-colors cursor-pointer"
        >
          &larr; Volver a cursos
        </button>
      </div>
      <div className="bg-[#EEEDFE] border border-[#AFA9EC] rounded-xl p-3 mb-4 mx-6 mt-4">
        <p className="text-[12px] text-[#3C3489] font-medium">
          &#10024; Lección generada por IA sobre: {aiGeneratedLesson.topic}
        </p>
      </div>
      <div id="generated-lesson-content" className="flex-1 overflow-y-auto px-6 pb-6">
        {totalSections > 0 ? (
          aiSections[generatedSectionIndex] && (
            <SectionCard
              section={aiSections[generatedSectionIndex]}
              index={generatedSectionIndex}
              totalSections={totalSections}
              currentIndex={generatedSectionIndex}
              revealedHints={{}}
              language={aiGeneratedLesson.language}
              lessonTitle={parsedAiLesson?.title ?? aiGeneratedLesson.title}
              level={aiGeneratedLesson.level}
              onHintReveal={() => {}}
              onSectionComplete={() => setGeneratedSectionIndex(prev => Math.min(prev + 1, totalSections - 1))}
            />
          )
        ) : (
          <div className="p-8 text-center text-gray-400">
            <p>No se pudo cargar el contenido.</p>
            <button onClick={handleBackToCourses} className="mt-4 text-[#534AB7] underline cursor-pointer">
              Volver
            </button>
          </div>
        )}
      </div>
      {totalSections > 0 && (
        <div className="h-14 border-t border-[#E5E7EB] dark:border-gray-700 flex items-center justify-between px-6 bg-white dark:bg-gray-900 flex-shrink-0">
          <button
            onClick={() => setGeneratedSectionIndex(prev => Math.max(prev - 1, 0))}
            disabled={generatedSectionIndex === 0}
            className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-[13px] text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#534AB7] hover:text-[#534AB7] dark:border-gray-700 dark:text-gray-400 cursor-pointer"
          >
            &larr; Anterior
          </button>
          <span className="text-[12px] text-gray-400">
            Secci&oacute;n {generatedSectionIndex + 1} de {totalSections}
          </span>
          <button
            onClick={() => setGeneratedSectionIndex(prev => Math.min(prev + 1, totalSections - 1))}
            disabled={generatedSectionIndex === totalSections - 1}
            className="px-5 py-2 bg-[#534AB7] text-white border-none rounded-lg text-[13px] font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#3C3489] cursor-pointer"
          >
            Siguiente &rarr;
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-gray-900 transition-colors">
      <LearningSidebar
        selectedCourseId={showGenerator || aiGeneratedLesson ? null : selectedCourse?.id ?? null}
        completionCounts={completionCounts}
        levelsDone={levelsDone}
        onSelect={(courseId) => {
          handleCourseSelect(courseId);
          setShowGenerator(false);
          setAiGeneratedLesson(null);
        }}
        onHome={() => navigate('/')}
        onGenerateLesson={() => {
          setAiGeneratedLesson(null);
          setGeneratedSectionIndex(0);
          setShowGenerator(true);
          loadStatus();
        }}
        aiLessons={aiLessons}
        onOpenAiLesson={handleOpenAiLesson}
        aiGeneratedToday={status?.generatedToday ?? 0}
        aiDailyLimit={status?.dailyLimit ?? 3}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {aiGeneratedLesson ? (
          generatedLessonView
        ) : showGenerator ? (
          <LessonGenerator
            onLessonReady={handleLessonReady}
            onClose={handleCloseGenerator}
          />
        ) : (
          <>
            {viewState === 'idle' && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#E5E7EB" strokeWidth="1" className="mx-auto mb-4">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  <p className="text-[15px] font-medium text-[#9CA3AF] mb-1">{UI.CHOOSE_TOPIC}</p>
                  <p className="text-[13px] text-[#9CA3AF]">{UI.SELECT_TOPIC}</p>
                </div>
              </div>
            )}

            {viewState === 'levelSelection' && selectedCourse && (
              <LevelSelectionScreen
                course={selectedCourse}
                levelsDone={levelsDone[selectedCourse.id] ?? []}
                doneLessons={doneLessons}
                onLevelSelect={handleLevelSelect}
                onRestartClick={handleRestartClick}
              />
            )}

            {viewState === 'lessonView' && selectedCourse && (
              <LessonView
                course={selectedCourse}
                selectedLevel={selectedLevel}
                currentLessonNumber={currentLessonNumber}
                currentLesson={currentLesson}
                sections={sections}
                currentSectionIndex={currentSectionIndex}
                isLoadingLesson={isLoadingLesson}
                lessonError={lessonError}
                revealedHints={revealedHints}
                scrollRef={scrollRef}
                displayTitle={displayTitle}
                doneLessons={doneLessons}
                levelsDone={levelsDone[selectedCourse.id] ?? []}
                onLevelTabClick={handleLevelTabClick}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onComplete={handleLessonComplete}
                onStepClick={handleStepClick}
                onHintReveal={handleHintReveal}
                onPracticeClick={() => navigate(`/practice?language=${encodeURIComponent(selectedCourse.name)}`)}
                onRetry={() => loadLesson(selectedCourse.id, selectedLevel, currentLessonNumber)}
                onSectionComplete={handleNext}
                onRestartClick={handleRestartClick}
              />
            )}
          </>
        )}
      </div>

      <RestartModal
        courseName={selectedCourse?.name ?? ''}
        level={restartTarget?.level ?? ''}
        isOpen={isRestartModalOpen}
        onConfirm={handleRestartLevel}
        onCancel={() => setIsRestartModalOpen(false)}
      />

      <CompletionModal
        courseName={selectedCourse?.name ?? ''}
        level={selectedLevel}
        isOpen={isCompletionModalOpen}
        isLastLevel={isLastLevel}
        onClose={() => setIsCompletionModalOpen(false)}
        onPractice={() => navigate(`/practice?language=${encodeURIComponent(selectedCourse?.name ?? '')}`)}
        onNextLevel={handleNextLevel}
      />
    </div>
  );
}
