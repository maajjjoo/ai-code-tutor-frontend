import { useNavigate } from 'react-router-dom';
import { useLearning } from '../hooks/useLearning';
import { LearningSidebar } from '../components/learning/sidebar/LearningSidebar';
import { LevelSelectionScreen } from '../components/learning/screens/LevelSelectionScreen';
import { LessonView } from '../components/learning/lesson/LessonView';
import { CompletionModal } from '../components/learning/modals/CompletionModal';

export function LearningPage() {
  const navigate = useNavigate();
  const {
    viewState, selectedCourse, selectedLevel, currentLessonNumber,
<<<<<<< HEAD
    currentLesson, currentSectionIndex, isLoadingLesson,
=======
    currentLesson, currentSectionIndex, isLoadingLesson, lessonError,
>>>>>>> 2e88757 (feat: replace AI lesson loading with JSON-based content & add error UI)
    isCompletionModalOpen, bookmarked, revealedHints, sections, scrollRef,
    doneLessons, completionCounts, levelsDone, isLastLevel, displayTitle,
    handleCourseSelect, handleLevelSelect, handleLevelTabClick,
    handleLessonComplete, handlePrevious, handleNext,
    handleNextLevel, handleBookmarkToggle, handleHintReveal,
    handleOpenInEditor, handleStepClick, setIsCompletionModalOpen,
    loadLesson,
  } = useLearning();

  return (
    <div className="h-screen flex overflow-hidden bg-white">
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
              <p className="text-[15px] font-medium text-[#9CA3AF] mb-1">Choose a language to start learning</p>
              <p className="text-[13px] text-[#9CA3AF]">Select any language from the sidebar</p>
            </div>
          </div>
        )}

        {viewState === 'levelSelection' && selectedCourse && (
          <LevelSelectionScreen
            course={selectedCourse}
            levelsDone={levelsDone[selectedCourse.id] ?? []}
            doneLessons={doneLessons}
            onLevelSelect={handleLevelSelect}
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
<<<<<<< HEAD
=======
            lessonError={lessonError}
>>>>>>> 2e88757 (feat: replace AI lesson loading with JSON-based content & add error UI)
            bookmarked={bookmarked}
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
            onBookmarkToggle={handleBookmarkToggle}
            onPracticeClick={() => navigate(`/practice?language=${encodeURIComponent(selectedCourse.name)}`)}
            onRetry={() => loadLesson(selectedCourse.id, selectedLevel, currentLessonNumber)}
          />
        )}
      </div>

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
