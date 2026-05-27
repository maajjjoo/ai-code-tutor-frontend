import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UI } from '../constants/ui.strings';
import { usePageTitle } from '../hooks/usePageTitle';
import { useLearning } from '../hooks/useLearning';
import { LearningSidebar } from '../components/learning/sidebar/LearningSidebar';
import { LevelSelectionScreen } from '../components/learning/screens/LevelSelectionScreen';
import { LessonView } from '../components/learning/lesson/LessonView';
import { LessonGenerator } from '../components/learning/LessonGenerator';
import { SectionCard } from '../components/learning/sections/SectionCard';
import { CompletionModal } from '../components/learning/modals/CompletionModal';
import { RestartModal } from '../components/learning/modals/RestartModal';
import type { GeneratedLesson } from '../types/generatedLesson.types';
import type { LessonSection } from '../types/learning.types';

function parseAiSections(contentJson: string): LessonSection[] {
  try {
    const parsed = JSON.parse(contentJson);
    if (Array.isArray(parsed)) return parsed;
    return parsed.sections ?? [];
  } catch {
    return [];
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
    handleOpenInEditor, handleStepClick, setIsCompletionModalOpen,
    isRestartModalOpen, restartTarget,
    handleRestartClick, handleRestartLevel, setIsRestartModalOpen,
    loadLesson,
  } = useLearning();

  const [showGenerator, setShowGenerator] = useState(false);
  const [aiGeneratedLesson, setAiGeneratedLesson] = useState<GeneratedLesson | null>(null);
  const [aiSectionIndex, setAiSectionIndex] = useState(0);

  const aiSections = aiGeneratedLesson ? parseAiSections(aiGeneratedLesson.contentJson) : [];

  const handleLessonReady = (lesson: GeneratedLesson) => {
    setAiGeneratedLesson(lesson);
    setShowGenerator(false);
    setAiSectionIndex(0);
  };

  const handleCloseGenerator = () => {
    setShowGenerator(false);
  };

  const handleBackToCourses = () => {
    setAiGeneratedLesson(null);
    setAiSectionIndex(0);
  };

  const generatedLessonView = aiGeneratedLesson && (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-12 bg-white dark:bg-gray-900 flex items-center justify-between px-6 border-b border-[#E5E7EB] dark:border-gray-700 shrink-0">
        <div className="flex items-center gap-1.5 text-[12px]">
          <span className="text-[#9CA3AF]">IA</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className="text-[#111827] dark:text-gray-100 font-medium truncate max-w-[200px]">{aiGeneratedLesson.title}</span>
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
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {aiSections.map((s, i) => (
          <SectionCard
            key={i}
            section={s}
            index={i}
            totalSections={aiSections.length}
            currentIndex={aiSectionIndex}
            revealedHints={{}}
            language={aiGeneratedLesson.language}
            lessonTitle={aiGeneratedLesson.title}
            level={aiGeneratedLesson.level}
            onHintReveal={() => {}}
            onOpenInEditor={() => {}}
            onSectionComplete={() => setAiSectionIndex(prev => Math.min(prev + 1, aiSections.length - 1))}
          />
        ))}
      </div>
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
            <div className="px-4 pt-3 pb-0 shrink-0">
              <button
                onClick={() => setShowGenerator(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-[#AFA9EC] bg-[#EEEDFE] text-[#3C3489] text-[12px] font-medium hover:bg-[#CECBF6] cursor-pointer transition-colors"
              >
                <span>&#10024;</span>
                Generar lección con IA
              </button>
            </div>
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
                onOpenInEditor={handleOpenInEditor}
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
