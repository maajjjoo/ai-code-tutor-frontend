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

function parseAiSections(contentJson: string): LessonSection[] {
  try {
    const parsed = JSON.parse(contentJson);
    if (Array.isArray(parsed)) return parsed;
    return parsed.sections ?? [];
  } catch {
    return [];
  }
}

function parseAiLesson(contentJson: string) {
  try {
    return JSON.parse(contentJson);
  } catch (e) {
    console.error('Failed to parse lesson:', e);
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
    handleOpenInEditor, handleStepClick, setIsCompletionModalOpen,
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
  const [aiSectionIndex, setAiSectionIndex] = useState(0);

  useEffect(() => {
    if (aiGeneratedLesson) {
      console.log('=== GENERATED LESSON ===');
      console.log('Full object:', aiGeneratedLesson);
      console.log('contentJson type:', typeof aiGeneratedLesson.contentJson);
      console.log('contentJson value:', aiGeneratedLesson.contentJson);
      console.log('First 200 chars:', String(aiGeneratedLesson.contentJson).substring(0, 200));
      try {
        const parsed = JSON.parse(aiGeneratedLesson.contentJson);
        console.log('Parsed successfully:', parsed);
        console.log('sections:', parsed.sections);
      } catch (e) {
        console.error('Parse error:', e);
      }
    }
  }, [aiGeneratedLesson]);

  const aiSections = aiGeneratedLesson ? parseAiSections(aiGeneratedLesson.contentJson) : [];
  const parsedAiLesson = aiGeneratedLesson ? parseAiLesson(aiGeneratedLesson.contentJson) : null;

  const handleLessonReady = (lesson: GeneratedLesson) => {
    setAiGeneratedLesson(lesson);
    setShowGenerator(false);
    setAiSectionIndex(0);
    loadStatus();
  };

  const handleCloseGenerator = () => {
    setShowGenerator(false);
    loadStatus();
  };

  const handleBackToCourses = () => {
    setAiGeneratedLesson(null);
    setAiSectionIndex(0);
  };

  const handleOpenAiLesson = async (lessonId: number) => {
    const lesson = await openLesson(lessonId);
    if (lesson) {
      setAiGeneratedLesson(lesson);
      setAiSectionIndex(0);
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
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {aiSections.length > 0 ? aiSections.map((s, i) => (
          <SectionCard
            key={i}
            section={s}
            index={i}
            totalSections={aiSections.length}
            currentIndex={aiSectionIndex}
            revealedHints={{}}
            language={aiGeneratedLesson.language}
            lessonTitle={parsedAiLesson?.title ?? aiGeneratedLesson.title}
            level={aiGeneratedLesson.level}
            onHintReveal={() => {}}
            onOpenInEditor={() => {}}
            onSectionComplete={() => setAiSectionIndex(prev => Math.min(prev + 1, aiSections.length - 1))}
          />
        )) : (
          <div className="p-8 text-center text-gray-400">
            <p>No se pudo cargar el contenido.</p>
            <button onClick={handleBackToCourses} className="mt-4 text-[#534AB7] underline cursor-pointer">
              Volver
            </button>
          </div>
        )}
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
        onGenerateLesson={() => setShowGenerator(true)}
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
