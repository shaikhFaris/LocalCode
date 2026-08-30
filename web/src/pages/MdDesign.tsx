import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownSample = `# Markdown Design Preview

This page is a sandbox for testing all the common Markdown elements used in the app.

# Headings

## Subheading

### Small heading

## Text styles

You can write plain text, **bold**, *italic*, and ~~strikethrough~~ content.

You can also add [links](https://example.com) and inline code like \`npm run dev\`

> This is a blockquote to show how quoted text is styled.

## Lists

### Unordered

- First item
- Second item
  - Nested item
  - Another nested item
- Third item

### Ordered

1. Install dependencies
2. Start the dev server
3. Review the output in the browser

## Code

\`\`\`ts
const greeting = "hello from markdown";

function sayHello(name: string) {
  return \\\`Hello, \${name}!\\\`;
}
\`\`\`

## Table

| Feature | Status | Notes |
| --- | --- | --- |
| Headings | ✅ | Styled correctly |
| Lists | ✅ | Nested bullets supported |
| Code blocks | ✅ | Monospace styling applied |
| Tables | ✅ | Responsive layout included |

## Divider

---

## Checklist

- [x] Markdown styles are defined
- [x] Code fences look readable
- [x] Lists and tables are visible
- [ ] More things can be added later
`;
function MdDesign() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Design system
        </p>
        <h1 className="text-3xl font-semibold">Markdown component gallery</h1>
      </header>

      <section className="rounded-lg border p-6 shadow-sm">
        <div className="markdown">
          <Markdown remarkPlugins={[remarkGfm]}>{markdownSample}</Markdown>
        </div>
      </section>
    </main>
  );
}

export default MdDesign;
