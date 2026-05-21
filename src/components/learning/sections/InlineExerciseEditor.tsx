import { useState, useRef } from 'react';
import { ExternalLink, Sparkles, Lightbulb, Heart, ArrowRight, Check, Loader2 } from 'lucide-react';
import { verifyExercise } from '../../../services/api';

interface FeedbackResult {
  summary: string;
  isCorrect: boolean;
  explanation: string;
  suggestions: string[];
  encouragement: string;
}

interface InlineExerciseEditorProps {
  exercisePrompt: string;
  hints: string[];
  language: string;
  lessonTitle: string;
  level: string;
  onSectionComplete: () => void;
  onOpenInEditor: (prompt: string, hints: string[]) => void;
}

const LANGUAGE_CONFIG: Record<string, { color: string; filename: string; starter: string }> = {
  Python: {
    color: '#3B82F6',
    filename: 'Main.py',
    starter: `# Write your solution here

def main():
    # Your code here
    pass

if __name__ == "__main__":
    main()`,
  },
  Java: {
    color: '#F59E0B',
    filename: 'Main.java',
    starter: `// Write your solution here

public class Main {
    public static void main(String[] args) {
        // Your code here
    }
}`,
  },
  JavaScript: {
    color: '#EAB308',
    filename: 'main.js',
    starter: `// Write your solution here

function main() {
    // Your code here
}

main();`,
  },
  TypeScript: {
    color: '#6366F1',
    filename: 'main.ts',
    starter: `// Write your solution here

function main(): void {
    // Your code here
}

main();`,
  },
};

export function InlineExerciseEditor({
  exercisePrompt,
  hints,
  language,
  lessonTitle,
  level,
  onSectionComplete,
  onOpenInEditor,
}: InlineExerciseEditorProps) {
  const config = LANGUAGE_CONFIG[language] ?? LANGUAGE_CONFIG.Python;
  const [code, setCode] = useState(config.starter);
  const [isVerifying, setIsVerifying] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStarter = code === config.starter;
  const isDisabled = isVerifying || code.trim() === '' || isStarter;

  const handleVerify = async () => {
    setIsVerifying(true);
    setFeedback(null);
    setVerifyError(null);
    try {
      const res = await verifyExercise({
        code,
        language,
        exercisePrompt,
        lessonTitle,
        level,
      });
      setFeedback({
        summary: res.summary,
        isCorrect: res.isCorrect,
        explanation: res.explanation,
        suggestions: res.suggestions ?? [],
        encouragement: res.encouragement,
      });
    } catch {
      setVerifyError('Could not verify your solution. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setCode(config.starter);
    setFeedback(null);
    setVerifyError(null);
  };

  const handleTryAgain = () => {
    setFeedback(null);
    setVerifyError(null);
    textareaRef.current?.focus();
  };

  return (
    <div className="mt-[14px]">
      <div className="flex flex-col gap-0 border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="h-8 bg-[#1E1E2E] flex items-center justify-between px-[14px]">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
            <span className="text-[11px] text-[#A6E3A1] font-mono ml-2">{language}</span>
            <span className="text-[11px] text-[#6B7280] ml-3">{config.filename}</span>
          </div>
          <button
            onClick={handleReset}
            className="text-[#6B7280] text-xs hover:text-white cursor-pointer"
          >
            Reset
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={code}
          onChange={e => {
            setCode(e.target.value);
            setFeedback(null);
            setVerifyError(null);
          }}
          className="w-full min-h-[180px] max-h-[320px] resize-y bg-[#1E1E2E] text-[#A6E3A1] font-mono text-[13px] leading-[1.7] p-[14px] border-none outline-none placeholder-[#4B5563]"
          placeholder="Write your solution here..."
          spellCheck={false}
        />

        <div className="h-11 bg-[#2A2A3E] border-t border-[#333] flex items-center justify-between px-[14px]">
          <span className="text-[11px] text-[#6B7280]">{code.length} characters</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenInEditor(exercisePrompt, hints)}
              className="text-[#6B7280] text-xs hover:text-white cursor-pointer flex items-center gap-1"
            >
              <ExternalLink size={12} />
              Open in full editor
            </button>
            <button
              onClick={handleVerify}
              disabled={isDisabled}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer ${
                isDisabled
                  ? 'bg-[#534AB7] text-white opacity-50 cursor-not-allowed'
                  : 'bg-[#534AB7] text-white hover:opacity-90'
              }`}
            >
              <Sparkles size={14} />
              Verify with AI
            </button>
          </div>
        </div>
      </div>

      {isVerifying && (
        <div className="bg-[#EEEDFE] rounded-lg p-3 flex items-center gap-2 mt-3">
          <Loader2 className="w-4 h-4 text-[#534AB7] animate-spin" />
          <span className="text-[12px] text-[#3C3489]">The AI is reviewing your code...</span>
        </div>
      )}

      {verifyError && !isVerifying && (
        <div className="bg-[#FEF2F2] rounded-lg p-3 mt-3">
          <span className="text-[12px] text-[#991B1B]">{verifyError}</span>
        </div>
      )}

      {feedback && !isVerifying && (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 mt-3">
          <div className="flex items-center gap-3">
            {feedback.isCorrect ? (
              <>
                <div className="w-8 h-8 rounded-full bg-[#E1F5EE] flex items-center justify-center shrink-0">
                  <Check size={16} className="text-[#0F6E56]" />
                </div>
                <span className="text-[14px] font-medium text-[#0F6E56]">Great work!</span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-[#EEEDFE] flex items-center justify-center shrink-0">
                  <Lightbulb size={16} className="text-[#534AB7]" />
                </div>
                <span className="text-[14px] font-medium text-[#534AB7]">Keep going!</span>
              </>
            )}
          </div>

          <p className="text-[13px] text-[#111827] mt-2 leading-relaxed">{feedback.summary}</p>

          <p className="text-[12px] text-[#4B5563] mt-2 leading-relaxed">{feedback.explanation}</p>

          {feedback.suggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] text-[#9CA3AF] uppercase">Things to improve:</p>
              {feedback.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 mt-1">
                  <ArrowRight size={12} className="text-[#534AB7] mt-0.5 shrink-0" />
                  <span className="text-[12px] text-[#4B5563]">{s}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-[#EEEDFE] rounded-lg p-3 mt-3 flex items-start gap-2">
            <Heart size={12} className="text-[#534AB7] mt-0.5 shrink-0" />
            <span className="text-[12px] text-[#3C3489] italic">{feedback.encouragement}</span>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleTryAgain}
              className="px-4 py-2 border border-[#E5E7EB] text-[#374151] rounded-lg text-[13px] font-medium hover:bg-[#F8F9FA] cursor-pointer"
            >
              Try again
            </button>
            {feedback.isCorrect && (
              <button
                onClick={onSectionComplete}
                className="px-4 py-2 bg-[#534AB7] text-white rounded-lg text-[13px] font-medium hover:opacity-90 cursor-pointer"
              >
                Next section
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
