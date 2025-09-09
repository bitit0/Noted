import jsPDF from "jspdf"

export function exportNoteAsPDF(title, html) {
  const doc = new jsPDF()
  doc.text(html, 10, 10)

  doc.save(`${title || "untitled"}.pdf`)
}
