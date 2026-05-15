import { useNavigate } from 'react-router-dom';
import { useLearning } from '../hooks/useLearning';
import { LearningSidebar } from '../components/learning/sidebar/LearningSidebar';
import { LevelSelectionScreen } from '../components/learning/LevelSelectionScreen';
import { LessonView } from '../components/learning/lesson/LessonView';
import { CompletionModal } from '../components/learning/modals/CompletionModal';
import type { Level } from '../types/learning.types';

export function LearningPage() {
  const navigate = useNavigate();
  const {
    categories, selectedTopic, selectedLevel, currentLesson,
    currentSectionIndex, completedLevels, completedLessons,
    isLoadingLesson, isGeneratingLesson, isCompletionModalOpen, isBookmarked,
    revealedHints, toast, sections, scrollRef, isLoadingTopics, topicsError,
    handleTopicSelect, handleLevelSelect, handleLessonComplete,
    handlePrevious, handleNext, handleNextLevel, handleLevelChange,
    handleBookmarkToggle, handleHintReveal, handleOpenInEditor,
    handleStepClick, setIsCompletionModalOpen,
    getCompletedCount, getTotalCompleted, fetchTopics,
  } = useLearning();

  const languages = categories.length > 0 ? categories[0].topics : [];

  const isLastLevel = selectedLevel === 'advanced';

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <LearningSidebar
        languages={languages}
        selectedTopicId={selectedTopic?.id ?? null}
        completedLevels={completedLevels}
        getCompletedCount={getCompletedCount}
        getTotalCompleted={getTotalCompleted}
        isLoading={isLoadingTopics}
        error={topicsError}
        onSelect={handleTopicSelect}
        onRetry={fetchTopics}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedTopic && !isLoadingTopics && (
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

        {selectedTopic && !currentLesson && !isLoadingLesson && (
          <LevelSelectionScreen
            topic={selectedTopic}
            completedLevels={completedLevels[selectedTopic.id] ?? []}
            completedLessons={completedLessons}
            isLoading={isLoadingLesson}
            onLevelSelect={handleLevelSelect}
          />
        )}

        {isLoadingLesson && !currentLesson && selectedTopic && (
          <div className="flex-1 p-5">
            {isGeneratingLesson && (
              <div className="flex items-center gap-2 bg-[#EEEDFE] rounded-lg px-[14px] py-[10px] mb-4">
                <svg className="w-4 h-4 text-[#534AB7] animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75"/>
                </svg>
                <span className="text-[12px] text-[#3C3489]">Generating with AI...</span>
              </div>
            )}
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-[#F3F4F6] rounded-xl animate-pulse" />)}
            </div>
          </div>
        )}

        {currentLesson && (
          <LessonView
            lesson={currentLesson}
            sections={sections}
            currentSectionIndex={currentSectionIndex}
            selectedLanguage={selectedTopic?.language ?? ''}
            selectedLevel={selectedLevel}
            completedLevels={(completedLevels[selectedTopic?.id ?? ''] ?? []) as Level[]}
            completedLessons={completedLessons[((selectedTopic?.id ?? '') + '_' + selectedLevel)] ?? []}
            isBookmarked={isBookmarked}
            isGeneratingLesson={isGeneratingLesson}
            revealedHints={revealedHints}
            scrollRef={scrollRef}
            topicName={selectedTopic?.name ?? ''}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onComplete={handleLessonComplete}
            onStepClick={handleStepClick}
            onHintReveal={handleHintReveal}
            onOpenInEditor={handleOpenInEditor}
            onLevelChange={handleLevelChange}
            onBookmarkToggle={handleBookmarkToggle}
            onPracticeClick={() => navigate(`/practice?language=${encodeURIComponent(selectedTopic?.language ?? '')}`)}
          />
        )}
      </div>

      <CompletionModal
        topicName={selectedTopic?.name ?? ''}
        level={selectedLevel}
        isOpen={isCompletionModalOpen}
        isLastLevel={isLastLevel}
        onClose={() => setIsCompletionModalOpen(false)}
        onPractice={() => navigate(`/practice?language=${encodeURIComponent(selectedTopic?.language ?? '')}`)}
        onNextLevel={handleNextLevel}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#111827] text-white text-[13px] px-4 py-2.5 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
