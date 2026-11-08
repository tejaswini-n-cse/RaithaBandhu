import ReactMarkdown from "react-markdown";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-foreground prose-th:text-foreground prose-td:text-foreground prose-a:text-primary">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
