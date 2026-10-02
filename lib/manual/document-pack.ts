export type PageFormat = "portrait" | "landscape";

export type LinkKind = "web" | "doc" | "module" | "mail" | "file";

export interface DocLink {
  kind: LinkKind;
  href: string;
  label?: string;
}

export type FlowShapeType = "line" | "arrow" | "square" | "rect" | "triangle" | "circle" | "text";

export interface FlowShape {
  id: string;
  type: FlowShapeType;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  link?: DocLink | null;
}

export interface FlowConnector {
  id: string;
  from: string;
  to: string;
}

export interface FlowDoc {
  snap: boolean;
  shapes: FlowShape[];
  connectors: FlowConnector[];
}

const MARK = /^<!--qwl:([\s\S]*?)-->/;

export function emptyFlow(): FlowDoc {
  return { snap: true, shapes: [], connectors: [] };
}

export function unpackDocument(raw: string) {
  const match = raw.match(MARK);
  let page: PageFormat = "portrait";
  let flow = emptyFlow();
  let html = raw;
  if (match) {
    html = raw.slice(match[0].length);
    try {
      const data = JSON.parse(decodeURIComponent(match[1])) as { page?: PageFormat; flow?: FlowDoc };
      if (data.page === "landscape" || data.page === "portrait") page = data.page;
      if (data.flow && Array.isArray(data.flow.shapes)) {
        flow = {
          snap: data.flow.snap !== false,
          shapes: data.flow.shapes,
          connectors: Array.isArray(data.flow.connectors) ? data.flow.connectors : [],
        };
      }
    } catch {
      /* old documents stay portrait */
    }
  }
  return { page, flow, html: html || "<p></p>" };
}

export function packDocument(html: string, page: PageFormat, flow: FlowDoc) {
  const body = html.replace(MARK, "");
  const meta = encodeURIComponent(JSON.stringify({ page, flow }));
  return `<!--qwl:${meta}-->${body}`;
}

export function documentHasContent(raw: string) {
  const { html, flow } = unpackDocument(raw);
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 0 || flow.shapes.length > 0;
}

export function pageSize(page: PageFormat) {
  return page === "landscape" ? { width: 1123, height: 794 } : { width: 794, height: 1123 };
}

export function pageLabel(page: PageFormat) {
  return page === "landscape" ? "Liggande" : "Stående";
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function center(shape: FlowShape) {
  return { x: shape.x + shape.w / 2, y: shape.y + shape.h / 2 };
}

function edgePoint(shape: FlowShape, toward: { x: number; y: number }) {
  const c = center(shape);
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  if (shape.type === "circle") {
    const len = Math.hypot(dx, dy) || 1;
    return { x: c.x + (dx / len) * (shape.w / 2), y: c.y + (dy / len) * (shape.h / 2) };
  }
  const hw = Math.max(shape.w / 2, 1);
  const hh = Math.max(shape.h / 2, 1);
  const scale = Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh) || 1;
  return { x: c.x + dx / scale, y: c.y + dy / scale };
}

export function flowToSvg(flow: FlowDoc, width: number, height: number) {
  const byId = new Map(flow.shapes.map((shape) => [shape.id, shape]));
  const lines = flow.connectors
    .map((link) => {
      const from = byId.get(link.from);
      const to = byId.get(link.to);
      if (!from || !to) return "";
      const end = edgePoint(to, center(from));
      const start = edgePoint(from, center(to));
      return `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="#111" stroke-width="1.5" marker-end="url(#arrow)" />`;
    })
    .join("");
  const shapes = flow.shapes
    .map((shape) => {
      const label = shape.text
        ? `<text x="${shape.x + shape.w / 2}" y="${shape.y + shape.h / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-size="14" fill="#111">${escapeXml(shape.text)}</text>`
        : "";
      if (shape.type === "line" || shape.type === "arrow") {
        const marker = shape.type === "arrow" ? ' marker-end="url(#arrow)"' : "";
        return `<line x1="${shape.x}" y1="${shape.y}" x2="${shape.x + shape.w}" y2="${shape.y + shape.h}" stroke="#111" stroke-width="1.5"${marker} />${label}`;
      }
      if (shape.type === "circle") {
        return `<ellipse cx="${shape.x + shape.w / 2}" cy="${shape.y + shape.h / 2}" rx="${shape.w / 2}" ry="${shape.h / 2}" fill="#fff" stroke="#111" stroke-width="1.5" />${label}`;
      }
      if (shape.type === "triangle") {
        const points = `${shape.x + shape.w / 2},${shape.y} ${shape.x + shape.w},${shape.y + shape.h} ${shape.x},${shape.y + shape.h}`;
        return `<polygon points="${points}" fill="#fff" stroke="#111" stroke-width="1.5" />${label}`;
      }
      return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" fill="#fff" stroke="#111" stroke-width="1.5" />${label}`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="${height}">
    <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#111" /></marker></defs>
    ${lines}${shapes}
  </svg>`;
}

export function printPackedDocument(title: string, raw: string, header: string, footer: string) {
  const { page, flow, html } = unpackDocument(raw);
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim();
  if (!text && flow.shapes.length === 0) {
    window.alert("Inget att skriva ut.");
    return;
  }
  const size = pageSize(page);
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html lang="sv"><head><meta charset="utf-8" /><title>${escapeXml(title)}</title>
    <style>
      @page { size: A4 ${page === "landscape" ? "landscape" : "portrait"}; margin: 12mm; }
      body { margin: 0; color: #111; font-family: Georgia, serif; }
      header, footer { font-size: 12px; color: #444; }
      header { border-bottom: 1px solid #ccc; margin-bottom: 12px; padding-bottom: 8px; }
      footer { border-top: 1px solid #ccc; margin-top: 16px; padding-top: 8px; }
      article { width: ${size.width}px; max-width: 100%; }
    </style></head><body>
    <article>
      <header>${escapeXml(header)} · ${pageLabel(page)}</header>
      <h1>${escapeXml(title)}</h1>
      <div>${html}</div>
      ${flow.shapes.length ? flowToSvg(flow, size.width - 80, page === "landscape" ? 420 : 360) : ""}
      <footer>${escapeXml(footer)}</footer>
    </article>
    <script>window.onload=function(){window.print()}<\/script>
    </body></html>`);
  win.document.close();
}
