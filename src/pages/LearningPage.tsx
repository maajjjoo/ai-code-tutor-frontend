import { useNavigate } from 'react-router-dom';
import { useLearning } from '../hooks/useLearning';
import { LearningSidebar } from '../components/learning/sidebar/LearningSidebar';
import { LevelSelectionScreen } from '../components/learning/LevelSelectionScreen';
import { LessonListScreen } from '../components/learning/LessonListScreen';
import { LessonView } from '../components/learning/lesson/LessonView';
import { CompletionModal } from '../components/learning/modals/CompletionModal';

export function LearningPage() {
  const navigate = useNavigate();
  const {
    viewState, selectedCourse, selectedLevel, selectedLessonNumber,
    currentLesson, currentSectionIndex, isLoadingLesson, isGeneratingLesson,
    isCompletionModalOpen, isBookmarked, revealedHints, sections, scrollRef,
    doneLessons, completionCounts, levelsDone, isLastLevel,
    handleCourseSelect, handleLevelSelect, handleLessonSelect,
    handleBackToLevels, handleBackToLessons,
    handleLessonComplete, handlePrevious, handleNext,
    handleNextLevel, handleBookmarkToggle, handleHintReveal,
    handleOpenInEditor, handleStepClick, setIsCompletionModalOpen,
  } = useLearning();

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <LearningSidebar
        selectedCourseId={selectedCourse?.id ?? null}
        completionCounts={completionCounts}
        levelsDone={levelsDone}
        onSelect={handleCourseSelect}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
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
            onLevelSelect={handleLevelSelect}
          />
        )}

        {viewState === 'lessonList' && selectedCourse && (
          <LessonListScreen
            course={selectedCourse}
            level={selectedLevel}
            doneLessons={doneLessons}
            onBack={handleBackToLevels}
            onLessonClick={handleLessonSelect}
          />
        )}

        {viewState === 'lessonView' && !currentLesson && (
          <div className="flex-1 flex flex-col">
            <div className="h-12 bg-white border-b border-[#E5E7EB] flex items-center px-5 shrink-0">
              <button onClick={handleBackToLessons} className="p-1 hover:bg-[#F3F4F6] rounded-lg cursor-pointer transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
              </button>
              <span className="text-[12px] text-[#111827] font-medium ml-1.5">Loading lesson...</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <svg className="w-6 h-6 text-[#534AB7] animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/>
                </svg>
                <span className="text-[13px] text-[#4B5563]">Generating lesson with AI...</span>
              </div>
            </div>
          </div>
        )}

        {currentLesson && (
          <LessonView
            lesson={currentLesson}
            sections={sections}
            currentSectionIndex={currentSectionIndex}
            selectedLanguage={selectedCourse?.language ?? ''}
            selectedLevel={selectedLevel}
            isBookmarked={isBookmarked}
            isGeneratingLesson={isGeneratingLesson}
            revealedHints={revealedHints}
            scrollRef={scrollRef}
            courseId={selectedCourse?.id ?? ''}
            onBack={handleBackToLessons}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onComplete={handleLessonComplete}
            onStepClick={handleStepClick}
            onHintReveal={handleHintReveal}
            onOpenInEditor={handleOpenInEditor}
            onBookmarkToggle={handleBookmarkToggle}
            onPracticeClick={() => navigate(`/practice?language=${encodeURIComponent(selectedCourse?.language ?? '')}`)}
          />
        )}
      </div>

      <CompletionModal
        courseName={selectedCourse?.name ?? ''}
        level={selectedLevel}
        isOpen={isCompletionModalOpen}
        isLastLevel={isLastLevel}
        onClose={() => setIsCompletionModalOpen(false)}
        onPractice={() => navigate(`/practice?language=${encodeURIComponent(selectedCourse?.language ?? '')}`)}
        onNextLevel={handleNextLevel}
      />
    </div>
  );
}
