interface Props { content?: string; }
export function ExplanationSection({ content }: Props) {
  return <p className="text-[13px] text-[#4B5563] leading-relaxed">{content}</p>;
}
