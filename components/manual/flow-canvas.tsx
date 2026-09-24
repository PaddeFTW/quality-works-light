"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";

import type { DocLink, FlowDoc, FlowShape, FlowShapeType } from "@/lib/manual/document-pack";
import { cn } from "@/lib/utils";

const TOOLS: { id: FlowShapeType | "select" | "connect"; label: string }[] = [
  { id: "select", label: "Markera" },
  { id: "line", label: "Streck" },
  { id: "arrow", label: "Pil" },
  { id: "square", label: "Kvadrat" },
  { id: "rect", label: "Rektangel" },
  { id: "triangle", label: "Triangel" },
  { id: "circle", label: "Cirkel" },
  { id: "text", label: "Text" },
  { id: "connect", label: "Koppla" },
];

function newId() {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

function snap(value: number, on: boolean) {
  if (!on) return value;
  return Math.round(value / 8) * 8;
}

function defaults(type: FlowShapeType): Pick<FlowShape, "w" | "h"> {
  if (type === "line" || type === "arrow") return { w: 140, h: 0 };
  if (type === "rect" || type === "text") return { w: 160, h: 72 };
  if (type === "triangle") return { w: 120, h: 100 };
  return { w: 96, h: 96 };
}

function edge(shape: FlowShape, towardX: number, towardY: number) {
  const cx = shape.x + shape.w / 2;
  const cy = shape.y + shape.h / 2;
  const dx = towardX - cx;
  const dy = towardY - cy;
  if (shape.type === "circle") {
    const len = Math.hypot(dx, dy) || 1;
    return { x: cx + (dx / len) * (shape.w / 2), y: cy + (dy / len) * (shape.h / 2) };
  }
  const hw = Math.max(shape.w / 2, 1);
  const hh = Math.max(shape.h / 2, 1);
  const scale = Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh) || 1;
  return { x: cx + dx / scale, y: cy + dy / scale };
}

export const FLOW_TOOLS = TOOLS;

export function FlowCanvas({
  value,
  editable,
  height,
  onChange,
  onFollow,
  onLink,
  tool: toolProp,
  onToolChange,
  hideBar = false,
  undoSignal = 0,
  redoSignal = 0,
  deleteSignal = 0,
  linkSignal = 0,
}: {
  value: FlowDoc;
  editable: boolean;
  height: number;
  onChange: (next: FlowDoc) => void;
  onFollow?: (link: DocLink) => void;
  onLink?: (shape: FlowShape) => void;
  tool?: (typeof TOOLS)[number]["id"];
  onToolChange?: (tool: (typeof TOOLS)[number]["id"]) => void;
  hideBar?: boolean;
  undoSignal?: number;
  redoSignal?: number;
  deleteSignal?: number;
  linkSignal?: number;
}) {
  const [innerTool, setInnerTool] = useState<(typeof TOOLS)[number]["id"]>("select");
  const tool = toolProp ?? innerTool;
  function setTool(next: (typeof TOOLS)[number]["id"]) {
    setInnerTool(next);
    onToolChange?.(next);
  }
  const [selected, setSelected] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const history = useRef<FlowDoc[]>([]);
  const future = useRef<FlowDoc[]>([]);
  const drag = useRef<{ id: string; dx: number; dy: number; handle?: boolean } | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!editable) return;
      const current = valueRef.current;
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        const stack = event.shiftKey ? future : history;
        const other = event.shiftKey ? history : future;
        const next = stack.current.pop();
        if (!next) return;
        other.current.push(current);
        onChange(next);
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selected && editing !== selected) {
        const target = event.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
        event.preventDefault();
        history.current = [...history.current.slice(-40), current];
        future.current = [];
        onChange({
          ...current,
          shapes: current.shapes.filter((shape) => shape.id !== selected),
          connectors: current.connectors.filter((link) => link.from !== selected && link.to !== selected),
        });
        setSelected(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editable, editing, onChange, selected]);

  const seenUndo = useRef(0);
  const seenRedo = useRef(0);
  const seenDelete = useRef(0);
  const seenLink = useRef(0);
  const markerId = useId().replace(/:/g, "");
  useEffect(() => {
    if (undoSignal === seenUndo.current) return;
    seenUndo.current = undoSignal;
    const prev = history.current.pop();
    if (!prev) return;
    future.current.push(valueRef.current);
    onChange(prev);
  }, [onChange, undoSignal]);
  useEffect(() => {
    if (redoSignal === seenRedo.current) return;
    seenRedo.current = redoSignal;
    const next = future.current.pop();
    if (!next) return;
    history.current.push(valueRef.current);
    onChange(next);
  }, [onChange, redoSignal]);
  useEffect(() => {
    if (deleteSignal === seenDelete.current) return;
    seenDelete.current = deleteSignal;
    if (!selected) return;
    const current = valueRef.current;
    history.current = [...history.current.slice(-40), current];
    future.current = [];
    onChange({
      ...current,
      shapes: current.shapes.filter((shape) => shape.id !== selected),
      connectors: current.connectors.filter((link) => link.from !== selected && link.to !== selected),
    });
    setSelected(null);
  }, [deleteSignal, onChange, selected]);
  useEffect(() => {
    if (linkSignal === seenLink.current) return;
    seenLink.current = linkSignal;
    const shape = valueRef.current.shapes.find((item) => item.id === selected);
    if (shape) onLink?.(shape);
  }, [linkSignal, onLink, selected]);

  function commit(next: FlowDoc) {
    history.current = [...history.current.slice(-40), value];
    future.current = [];
    onChange(next);
  }

  function place(type: FlowShapeType, x: number, y: number) {
    const size = defaults(type);
    const shape: FlowShape = {
      id: newId(),
      type,
      x: snap(x - size.w / 2, value.snap),
      y: snap(y - size.h / 2, value.snap),
      w: size.w,
      h: size.h,
      text: type === "text" ? "Text" : "",
    };
    commit({ ...value, shapes: [...value.shapes, shape] });
    setSelected(shape.id);
    setTool("select");
  }

  function updateShape(id: string, patch: Partial<FlowShape>) {
    onChange({ ...valueRef.current, shapes: valueRef.current.shapes.map((shape) => (shape.id === id ? { ...shape, ...patch } : shape)) });
  }

  const selectedShape = value.shapes.find((shape) => shape.id === selected) ?? null;

  return (
    <div className="border-t border-paper-border">
      {editable && !hideBar ? (
        <div className="flex flex-wrap items-center gap-1 border-b border-paper-border bg-card px-2 py-1">
          {TOOLS.map((item) => (
            <button
              className={cn("rounded-md px-2 py-1 text-xs", tool === item.id ? "bg-primary text-primary-foreground" : "hover:bg-accent")}
              key={item.id}
              onClick={() => {
                setTool(item.id);
                setConnectFrom(null);
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
          <button
            className="rounded-md px-2 py-1 text-xs hover:bg-accent"
            onClick={() => {
              if (!selected) return;
              commit({
                ...value,
                shapes: value.shapes.filter((shape) => shape.id !== selected),
                connectors: value.connectors.filter((link) => link.from !== selected && link.to !== selected),
              });
              setSelected(null);
            }}
            type="button"
          >
            Ta bort
          </button>
          <button className={cn("rounded-md px-2 py-1 text-xs", value.snap && "bg-accent")} onClick={() => commit({ ...value, snap: !value.snap })} type="button">
            Rutnät {value.snap ? "på" : "av"}
          </button>
        </div>
      ) : null}
      <div className="relative bg-white text-neutral-900" style={{ height }}>
        {value.shapes.length === 0 ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-neutral-500">Lägg en form. Koppla med pil.</p>
        ) : null}
        <svg
          className="absolute inset-0 h-full w-full"
          onMouseMove={(event) => {
            if (!drag.current) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            const shape = valueRef.current.shapes.find((item) => item.id === drag.current?.id);
            if (!shape) return;
            if (drag.current.handle) {
              const x = snap(event.clientX - bounds.left, value.snap);
              const y = snap(event.clientY - bounds.top, value.snap);
              updateShape(shape.id, { w: Math.max(24, x - shape.x), h: Math.max(16, y - shape.y) });
              return;
            }
            updateShape(shape.id, {
              x: snap(event.clientX - bounds.left - drag.current.dx, value.snap),
              y: snap(event.clientY - bounds.top - drag.current.dy, value.snap),
            });
          }}
          onMouseUp={() => {
            drag.current = null;
          }}
          onClick={(event) => {
            if (!editable || tool === "select" || tool === "connect") return;
            const bounds = event.currentTarget.getBoundingClientRect();
            place(tool, event.clientX - bounds.left, event.clientY - bounds.top);
          }}
        >
          <defs>
            <marker id={markerId} markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
              <path d="M0,0 L8,4 L0,8 Z" fill="currentColor" />
            </marker>
          </defs>
          {value.connectors.map((link) => {
            const from = value.shapes.find((shape) => shape.id === link.from);
            const to = value.shapes.find((shape) => shape.id === link.to);
            if (!from || !to) return null;
            const start = edge(from, to.x + to.w / 2, to.y + to.h / 2);
            const end = edge(to, from.x + from.w / 2, from.y + from.h / 2);
            return <line key={link.id} markerEnd={`url(#${markerId})`} stroke="currentColor" strokeWidth="1.5" x1={start.x} x2={end.x} y1={start.y} y2={end.y} />;
          })}
          {value.shapes.map((shape) => {
            const active = shape.id === selected;
            const stroke = active ? "var(--primary)" : "currentColor";
            const handlers = {
              onMouseDown: (event: MouseEvent) => {
                if (!editable) {
                  if (shape.link) onFollow?.(shape.link);
                  return;
                }
                event.stopPropagation();
                if (tool === "connect") {
                  if (!connectFrom) setConnectFrom(shape.id);
                  else if (connectFrom !== shape.id) {
                    commit({ ...value, connectors: [...value.connectors, { id: newId(), from: connectFrom, to: shape.id }] });
                    setConnectFrom(null);
                    setTool("select");
                  }
                  return;
                }
                setSelected(shape.id);
                history.current = [...history.current.slice(-40), valueRef.current];
                const svg = (event.currentTarget as SVGElement).ownerSVGElement;
                if (!svg) return;
                const bounds = svg.getBoundingClientRect();
                drag.current = { id: shape.id, dx: event.clientX - bounds.left - shape.x, dy: event.clientY - bounds.top - shape.y };
              },
              onDoubleClick: (event: MouseEvent) => {
                if (!editable) return;
                event.stopPropagation();
                history.current = [...history.current.slice(-40), valueRef.current];
                future.current = [];
                setEditing(shape.id);
              },
              onContextMenu: (event: MouseEvent) => {
                if (!editable) return;
                event.preventDefault();
                setSelected(shape.id);
                onLink?.(shape);
              },
              onClick: (event: MouseEvent) => {
                event.stopPropagation();
              },
            };
            return (
              <g key={shape.id}>
                {shape.type === "circle" ? (
                  <ellipse {...handlers} cx={shape.x + shape.w / 2} cy={shape.y + shape.h / 2} fill="#fff" rx={shape.w / 2} ry={shape.h / 2} stroke={stroke} strokeWidth={active ? 2 : 1.5} />
                ) : shape.type === "triangle" ? (
                  <polygon {...handlers} fill="#fff" points={`${shape.x + shape.w / 2},${shape.y} ${shape.x + shape.w},${shape.y + shape.h} ${shape.x},${shape.y + shape.h}`} stroke={stroke} strokeWidth={active ? 2 : 1.5} />
                ) : shape.type === "line" || shape.type === "arrow" ? (
                  <line {...handlers} markerEnd={shape.type === "arrow" ? `url(#${markerId})` : undefined} stroke={stroke} strokeWidth="2" x1={shape.x} x2={shape.x + shape.w} y1={shape.y + 8} y2={shape.y + shape.h + 8} />
                ) : (
                  <rect {...handlers} fill="#fff" height={shape.h} stroke={stroke} strokeWidth={active ? 2 : 1.5} width={shape.w} x={shape.x} y={shape.y} />
                )}
                {shape.text && editing !== shape.id ? (
                  <text fill="currentColor" fontFamily="Georgia, serif" fontSize="14" pointerEvents="none" textAnchor="middle" x={shape.x + shape.w / 2} y={shape.y + shape.h / 2 + 4}>
                    {shape.text}
                  </text>
                ) : null}
                {shape.link ? (
                  <circle
                    cx={shape.x + shape.w - 8}
                    cy={shape.y + 8}
                    fill="var(--primary)"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (shape.link) onFollow?.(shape.link);
                    }}
                    onMouseDown={(event) => event.stopPropagation()}
                    r="6"
                  >
                    <title>Länk</title>
                  </circle>
                ) : null}
                {editable && active && shape.type !== "line" && shape.type !== "arrow" ? (
                  <rect
                    fill="#fff"
                    height="8"
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      history.current = [...history.current.slice(-40), valueRef.current];
                      drag.current = { id: shape.id, dx: 0, dy: 0, handle: true };
                    }}
                    stroke="currentColor"
                    width="8"
                    x={shape.x + shape.w - 4}
                    y={shape.y + shape.h - 4}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>
        {editing && selectedShape ? (
          <input
            autoFocus
            className="absolute z-10 rounded border bg-white px-2 py-1 text-center text-sm text-neutral-900"
            onBlur={() => setEditing(null)}
            onChange={(event) => updateShape(selectedShape.id, { text: event.target.value })}
            style={{ left: selectedShape.x, top: selectedShape.y + selectedShape.h / 2 - 14, width: Math.max(selectedShape.w, 80) }}
            value={selectedShape.text}
          />
        ) : null}
      </div>
    </div>
  );
}
