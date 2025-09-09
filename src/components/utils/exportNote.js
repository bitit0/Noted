
export function exportNoteAsMarkdown(title, content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${title || "untitled"}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
