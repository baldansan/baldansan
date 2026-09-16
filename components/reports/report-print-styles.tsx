/**
 * Print stylesheet for the report and certificate pages.
 *
 * `Ctrl/Cmd+P` has to produce a document someone can take into a meeting, so
 * printing strips the app: no sidebar, no top bar, no buttons, no background
 * tints, black text on white paper. There is no PDF library behind this — the
 * browser's own print dialog does the work, which is also why it keeps working
 * when the app is offline or the dependency list is frozen.
 *
 * Page breaks: a table row, a summary card and a certificate are all marked
 * unbreakable, and `thead` repeats on every page so a table that runs over
 * still has its headings.
 */

type Props = {
  orientation?: "portrait" | "landscape";
};

function css(orientation: "portrait" | "landscape"): string {
  return `
@page {
  size: A4 ${orientation};
  margin: ${orientation === "landscape" ? "12mm" : "15mm 14mm"};
}

@media print {
  html,
  body {
    background: #fff !important;
  }

  body {
    color: #000 !important;
    font-size: 10pt;
  }

  /* The app chrome is not part of the document. */
  .admin-sidebar,
  .admin-topbar,
  [data-print-hide],
  [data-print-hide] * {
    display: none !important;
  }

  .admin-layout,
  .admin-main {
    display: block !important;
    overflow: visible !important;
  }

  .print-sheet {
    margin: 0 !important;
    padding: 0 !important;
    max-width: none !important;
    width: auto !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
  }

  .print-sheet * {
    color: #000 !important;
    background: transparent !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  /* Tailwind rings would otherwise disappear along with the backgrounds. */
  .print-box {
    border: 0.4pt solid #000 !important;
    border-radius: 0 !important;
  }

  .print-chip {
    border: 0.4pt solid #000 !important;
    border-radius: 0 !important;
    padding: 0.5pt 3pt !important;
    font-weight: 600 !important;
  }

  .print-sheet table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 8.5pt !important;
  }

  .print-sheet th,
  .print-sheet td {
    border: 0.4pt solid #000 !important;
    padding: 2.5pt 3pt !important;
    vertical-align: top !important;
  }

  .print-sheet thead {
    display: table-header-group !important;
  }

  .print-sheet tr,
  .print-sheet th,
  .print-sheet td {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .print-sheet h1 {
    font-size: 17pt !important;
  }

  .print-sheet h2 {
    font-size: 12pt !important;
    margin-top: 10pt !important;
  }

  .print-sheet h3 {
    font-size: 10.5pt !important;
  }

  .print-sheet h1,
  .print-sheet h2,
  .print-sheet h3 {
    page-break-after: avoid !important;
    break-after: avoid-page !important;
  }

  .print-keep {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .print-break-before {
    page-break-before: always !important;
    break-before: page !important;
  }

  /* Tailwind's responsive grids are width-based, and the print width is not
     the screen width, so the printed columns are pinned here instead. */
  .print-grid {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 6pt !important;
  }

  .print-grid-stats {
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 5pt !important;
  }

  .print-grid-pair {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 16pt !important;
  }

  a[href]::after {
    content: "" !important;
  }
}
`;
}

export function ReportPrintStyles({ orientation = "portrait" }: Props) {
  return <style dangerouslySetInnerHTML={{ __html: css(orientation) }} />;
}
