interface Props { content?: string; }
export function ExplanationSection({ content }: Props) {
  return <p className="text-[13px] text-[#4B5563] dark:text-gray-400 leading-relaxed">{content}</p>;
}
