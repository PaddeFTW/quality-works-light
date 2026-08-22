/** Client-side export helpers for Manual Original content. */

export function downloadHtmlAsFile(
  fileName: string,
  title: string,
  headerText: string,
  bodyHtml: string,
  footerText: string,
) {
  const html = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; max-width: 720px; margin: 40px auto; color: #111; line-height: 1.6; }
    header, footer { font-size: 12px; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 24px; }
    footer { border-bottom: none; border-top: 1px solid #ddd; margin-top: 32px; padding-top: 8px; }
    h1 { font-size: 22px; }
  </style>
</head>
<body>
  <header>${escapeHtml(headerText)}</header>
  <h1>${escapeHtml(title)}</h1>
  <div>${bodyHtml}</div>
  <footer>${escapeHtml(footerText)}</footer>
</body>
</html>`;

  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".doc") ? fileName : `${fileName}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printDocument(
  title: string,
  headerText: string,
  bodyHtml: string,
  footerText: string,
) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; max-width: 720px; margin: 24px auto; color: #111; line-height: 1.6; }
    header, footer { font-size: 12px; color: #555; }
    header { border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 20px; }
    footer { border-top: 1px solid #ccc; margin-top: 28px; padding-top: 8px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <header>${escapeHtml(headerText)}</header>
  <h1>${escapeHtml(title)}</h1>
  <div>${bodyHtml}</div>
  <footer>${escapeHtml(footerText)}</footer>
  <script>window.onload = function () { window.print(); }<\/script>
</body>
</html>`);
  win.document.close();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
