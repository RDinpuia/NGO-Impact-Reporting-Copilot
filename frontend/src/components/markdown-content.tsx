function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

export function MarkdownContent({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);

  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return null;
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={index} className="text-base font-semibold">
              {renderInlineMarkdown(trimmed.slice(4))}
            </h3>
          );
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={index} className="text-lg font-semibold">
              {renderInlineMarkdown(trimmed.slice(3))}
            </h2>
          );
        }

        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={index} className="text-xl font-semibold">
              {renderInlineMarkdown(trimmed.slice(2))}
            </h1>
          );
        }

        if (trimmed.startsWith("- ")) {
          return (
            <p key={index} className="pl-4 before:mr-2 before:content-['-']">
              {renderInlineMarkdown(trimmed.slice(2))}
            </p>
          );
        }

        return <p key={index}>{renderInlineMarkdown(trimmed)}</p>;
      })}
    </div>
  );
}
