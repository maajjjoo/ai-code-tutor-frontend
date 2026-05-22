import { useNavigate } from 'react-router-dom';
import { UI } from '../constants/ui.strings';
import { usePageTitle } from '../hooks/usePageTitle';
import { useLearning } from '../hooks/useLearning';
import { LearningSidebar } from '../components/learning/sidebar/LearningSidebar';
import { LevelSelectionScreen } from '../components/learning/screens/LevelSelectionScreen';
import { LessonView } from '../components/learning/lesson/LessonView';
import { CompletionModal } from '../components/learning/modals/CompletionModal';
import { RestartModal } from '../components/learning/modals/RestartModal';

export function LearningPage() {
  usePageTitle('Learning');
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

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-gray-900 transition-colors">
      <LearningSidebar
        selectedCourseId={selectedCourse?.id ?? null}
        completionCounts={completionCounts}
        levelsDone={levelsDone}
        onSelect={handleCourseSelect}
        onHome={() => navigate('/')}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
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
