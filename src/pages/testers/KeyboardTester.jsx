import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IS_MAC, useT, useDocTitle } from "./testersUtils";

// k(label, code, width-in-units); keys with code:null are hardware-level and undetectable
const k = (label, code, w = 1, sub) => ({ label, code, w, sub });
const gap = (w) => ({ gap: true, w });

const FN_ROW_WIN = [
  k("Esc", "Escape"), gap(1),
  k("F1", "F1"), k("F2", "F2"), k("F3", "F3"), k("F4", "F4"), gap(0.5),
  k("F5", "F5"), k("F6", "F6"), k("F7", "F7"), k("F8", "F8"), gap(0.5),
  k("F9", "F9"), k("F10", "F10"), k("F11", "F11"), k("F12", "F12"),
];

const FN_ROW_MAC = [
  k("esc", "Escape"), gap(1),
  k("F1", "F1"), k("F2", "F2"), k("F3", "F3"), k("F4", "F4"), gap(0.5),
  k("F5", "F5"), k("F6", "F6"), k("F7", "F7"), k("F8", "F8"), gap(0.5),
  k("F9", "F9"), k("F10", "F10"), k("F11", "F11"), k("F12", "F12"),
];

const ROW_1 = (backspaceLabel) => [
  k("`", "Backquote", 1, "~"), k("1", "Digit1", 1, "!"), k("2", "Digit2", 1, "@"),
  k("3", "Digit3", 1, "#"), k("4", "Digit4", 1, "$"), k("5", "Digit5", 1, "%"),
  k("6", "Digit6", 1, "^"), k("7", "Digit7", 1, "&"), k("8", "Digit8", 1, "*"),
  k("9", "Digit9", 1, "("), k("0", "Digit0", 1, ")"), k("-", "Minus", 1, "_"),
  k("=", "Equal", 1, "+"), k(backspaceLabel, "Backspace", 2),
];

const ROW_2 = (backslashLabel) => [
  k("Tab", "Tab", 1.5), k("Q", "KeyQ"), k("W", "KeyW"), k("E", "KeyE"), k("R", "KeyR"),
  k("T", "KeyT"), k("Y", "KeyY"), k("U", "KeyU"), k("I", "KeyI"), k("O", "KeyO"),
  k("P", "KeyP"), k("[", "BracketLeft", 1, "{"), k("]", "BracketRight", 1, "}"),
  k(backslashLabel, "Backslash", 1.5, "|"),
];

const ROW_3 = (enterLabel) => [
  k("Caps", "CapsLock", 1.75), k("A", "KeyA"), k("S", "KeyS"), k("D", "KeyD"),
  k("F", "KeyF"), k("G", "KeyG"), k("H", "KeyH"), k("J", "KeyJ"), k("K", "KeyK"),
  k("L", "KeyL"), k(";", "Semicolon", 1, ":"), k("'", "Quote", 1, '"'),
  k(enterLabel, "Enter", 2.25),
];

const ROW_4 = [
  k("Shift", "ShiftLeft", 2.25), k("Z", "KeyZ"), k("X", "KeyX"), k("C", "KeyC"),
  k("V", "KeyV"), k("B", "KeyB"), k("N", "KeyN"), k("M", "KeyM"),
  k(",", "Comma", 1, "<"), k(".", "Period", 1, ">"), k("/", "Slash", 1, "?"),
  k("Shift", "ShiftRight", 2.75),
];

const ROW_1_CA_FR = (backspaceLabel) => [
  k("#", "Backquote", 1, "|"), k("1", "Digit1", 1, "!"), k("2", "Digit2", 1, '"'),
  k("3", "Digit3", 1, "/"), k("4", "Digit4", 1, "$"), k("5", "Digit5", 1, "%"),
  k("6", "Digit6", 1, "?"), k("7", "Digit7", 1, "&"), k("8", "Digit8", 1, "*"),
  k("9", "Digit9", 1, "("), k("0", "Digit0", 1, ")"), k("-", "Minus", 1, "_"),
  k("=", "Equal", 1, "+"), k(backspaceLabel, "Backspace", 2),
];

const ROW_2_CA_FR = [
  k("Tab", "Tab", 1.5), k("Q", "KeyQ"), k("W", "KeyW"), k("E", "KeyE"), k("R", "KeyR"),
  k("T", "KeyT"), k("Y", "KeyY"), k("U", "KeyU"), k("I", "KeyI"), k("O", "KeyO"),
  k("P", "KeyP"), k("^", "BracketLeft", 1, "¨"), k("ç", "BracketRight", 1, "Ç"),
  k("à", "Backslash", 1.5, "À"),
];

const ROW_3_CA_FR = (enterLabel) => [
  k("Caps", "CapsLock", 1.75), k("A", "KeyA"), k("S", "KeyS"), k("D", "KeyD"),
  k("F", "KeyF"), k("G", "KeyG"), k("H", "KeyH"), k("J", "KeyJ"), k("K", "KeyK"),
  k("L", "KeyL"), k(";", "Semicolon", 1, ":"), k("è", "Quote", 1, "È"),
  k(enterLabel, "Enter", 2.25),
];

const ROW_4_CA_FR = [
  k("Shift", "ShiftLeft", 1.25), k("ù", "IntlBackslash", 1, "Ù"),
  k("Z", "KeyZ"), k("X", "KeyX"), k("C", "KeyC"), k("V", "KeyV"), k("B", "KeyB"),
  k("N", "KeyN"), k("M", "KeyM"), k(",", "Comma", 1, "'"), k(".", "Period", 1, '"'),
  k("é", "Slash", 1, "É"), k("Shift", "ShiftRight", 2.75),
];

const ROW_5_WIN = [
  k("Ctrl", "ControlLeft", 1.25), k("Win", "MetaLeft", 1.25), k("Alt", "AltLeft", 1.25),
  k("Space", "Space", 6.25),
  k("Alt", "AltRight", 1.25), k("Win", "MetaRight", 1.25), k("Menu", "ContextMenu", 1.25),
  k("Ctrl", "ControlRight", 1.25),
];

const ROW_5_MAC = [
  k("fn", null, 1), k("ctrl", "ControlLeft", 1), k("opt", "AltLeft", 1, "⌥"),
  k("cmd", "MetaLeft", 1.25, "⌘"),
  k("Space", "Space", 6),
  k("cmd", "MetaRight", 1.25, "⌘"), k("opt", "AltRight", 1, "⌥"),
  k("ctrl", "ControlRight", 1), gap(1.5),
];

// first row sits on the F-key row; remaining rows align with the main block
const NAV_ROWS = [
  [k("PrtSc", "PrintScreen"), k("ScrLk", "ScrollLock"), k("Pause", "Pause")],
  [k("Ins", "Insert"), k("Home", "Home"), k("PgUp", "PageUp")],
  [k("Del", "Delete"), k("End", "End"), k("PgDn", "PageDown")],
  [],
  [gap(1), k("↑", "ArrowUp"), gap(1)],
  [k("←", "ArrowLeft"), k("↓", "ArrowDown"), k("→", "ArrowRight")],
];

const NAV_ROWS_MAC = [
  [k("F13", "F13"), k("F14", "F14"), k("F15", "F15")],
  [k("fn", null), k("Home", "Home"), k("PgUp", "PageUp")],
  [k("⌦", "Delete"), k("End", "End"), k("PgDn", "PageDown")],
  [],
  [gap(1), k("↑", "ArrowUp"), gap(1)],
  [k("←", "ArrowLeft"), k("↓", "ArrowDown"), k("→", "ArrowRight")],
];

// Numpad as a 4-col grid; Add/Enter span 2 rows, 0 spans 2 cols
const NUMPAD = [
  { ...k("Num", "NumLock"), col: 1, row: 1 }, { ...k("/", "NumpadDivide"), col: 2, row: 1 },
  { ...k("*", "NumpadMultiply"), col: 3, row: 1 }, { ...k("-", "NumpadSubtract"), col: 4, row: 1 },
  { ...k("7", "Numpad7"), col: 1, row: 2 }, { ...k("8", "Numpad8"), col: 2, row: 2 },
  { ...k("9", "Numpad9"), col: 3, row: 2 }, { ...k("+", "NumpadAdd"), col: 4, row: 2, rowSpan: 2 },
  { ...k("4", "Numpad4"), col: 1, row: 3 }, { ...k("5", "Numpad5"), col: 2, row: 3 },
  { ...k("6", "Numpad6"), col: 3, row: 3 },
  { ...k("1", "Numpad1"), col: 1, row: 4 }, { ...k("2", "Numpad2"), col: 2, row: 4 },
  { ...k("3", "Numpad3"), col: 3, row: 4 }, { ...k("Enter", "NumpadEnter"), col: 4, row: 4, rowSpan: 2 },
  { ...k("0", "Numpad0"), col: 1, row: 5, colSpan: 2 }, { ...k(".", "NumpadDecimal"), col: 3, row: 5 },
];

function collectCodes(layout, numpad) {
  const codes = new Set();
  const walk = (item) => {
    if (!item.gap && item.code) codes.add(item.code);
  };
  layout.main.forEach((row) => row.forEach(walk));
  layout.nav.forEach((row) => row.forEach(walk));
  if (numpad) NUMPAD.forEach(walk);
  return codes;
}

function Key({ item, pressed, tested }) {
  if (item.gap) {
    return <div style={{ width: `calc(var(--u) * ${item.w})` }} className="shrink-0" />;
  }
  const undetectable = !item.code;
  return (
    <div
      style={{ width: `calc(var(--u) * ${item.w})` }}
      className={`shrink-0 h-[var(--u)] rounded-md border text-[10px] sm:text-xs flex flex-col items-center justify-center leading-tight select-none transition-colors duration-75 ${
        undetectable
          ? "border-border/50 text-text-muted/40 bg-bg-secondary/40"
          : pressed
            ? "border-accent bg-accent text-bg-primary font-semibold scale-95"
            : tested
              ? "border-accent/60 bg-accent/20 text-text-primary"
              : "border-border bg-bg-card text-text-secondary"
      }`}
      title={item.code || "Not detectable by the browser"}
    >
      {item.sub && <span className="opacity-60 text-[8px] sm:text-[10px]">{item.sub}</span>}
      <span>{item.label}</span>
    </div>
  );
}

export default function KeyboardTester() {
  const t = useT();
  useDocTitle(t("keyboard"));

  const [layoutName, setLayoutName] = useState("us");
  const [platformName, setPlatformName] = useState(IS_MAC ? "mac" : "win");
  const [showNumpad, setShowNumpad] = useState(true);
  const [pressed, setPressed] = useState(() => new Set());
  const [tested, setTested] = useState(() => new Set());
  const [lastEvent, setLastEvent] = useState(null);
  const [history, setHistory] = useState([]);
  const [maxSimul, setMaxSimul] = useState(0);
  const [chatter, setChatter] = useState(() => new Map());
  const lastKeyupRef = useRef({});
  const pressedRef = useRef(new Set()); // mirror of `pressed` for size tracking in handlers
  const areaRef = useRef(null);

  const layout = useMemo(
    () => {
      const isMac = platformName === "mac";
      const fnRow = isMac ? FN_ROW_MAC : FN_ROW_WIN;
      const nav = isMac ? NAV_ROWS_MAC : NAV_ROWS;
      const modifierRow = isMac ? ROW_5_MAC : ROW_5_WIN;
      const backspaceLabel = isMac ? "⌫" : "⌫ Bksp";
      const enterLabel = isMac ? "return" : "Enter";
      const characterRows = layoutName === "frca"
        ? [ROW_1_CA_FR(backspaceLabel), ROW_2_CA_FR, ROW_3_CA_FR(enterLabel), ROW_4_CA_FR]
        : [ROW_1(backspaceLabel), ROW_2("\\"), ROW_3(enterLabel), ROW_4];

      return { fnRow, main: [fnRow, ...characterRows, modifierRow], nav };
    },
    [layoutName, platformName]
  );

  const layoutCodes = useMemo(() => collectCodes(layout, showNumpad), [layout, showNumpad]);
  const testedInLayout = useMemo(
    () => [...tested].filter((c) => layoutCodes.has(c)).length,
    [tested, layoutCodes]
  );

  const onKeyDown = useCallback((e) => {
    e.preventDefault();
    if (!e.code && !e.key) return;
    if (e.code) {
      pressedRef.current.add(e.code);
      const size = pressedRef.current.size; // capture now — updaters run after later events mutate the ref
      setPressed(new Set(pressedRef.current));
      setMaxSimul((m) => Math.max(m, size));
      setTested((prev) => new Set(prev).add(e.code));
      // key re-triggering right after release points to switch chatter
      if (!e.repeat) {
        const lastUp = lastKeyupRef.current[e.code];
        if (lastUp != null && performance.now() - lastUp < 35) {
          setChatter((prev) => new Map(prev).set(e.code, (prev.get(e.code) || 0) + 1));
        }
      }
    }
    setLastEvent({ key: e.key, code: e.code, keyCode: e.keyCode, location: e.location });
    if (!e.repeat && e.key) {
      setHistory((prev) => [{ key: e.key, code: e.code, ts: Date.now() }, ...prev].slice(0, 12));
    }
  }, []);

  const onKeyUp = useCallback((e) => {
    e.preventDefault();
    if (!e.code && !e.key) return;
    if (e.code) {
      setTested((prev) => new Set(prev).add(e.code)); // PrintScreen only fires keyup on Windows
      lastKeyupRef.current[e.code] = performance.now();
    }
    // macOS quirk: while ⌘ is held, keyup for other keys is never delivered
    if (e.key === "Meta") {
      pressedRef.current = new Set();
    } else {
      pressedRef.current.delete(e.code);
    }
    setPressed(new Set(pressedRef.current));
  }, []);

  useEffect(() => {
    const clear = () => {
      pressedRef.current = new Set();
      setPressed(new Set());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clear);
    };
  }, [onKeyDown, onKeyUp]);

  const reset = () => {
    pressedRef.current = new Set();
    setPressed(new Set());
    setTested(new Set());
    setLastEvent(null);
    setHistory([]);
    setMaxSimul(0);
    setChatter(new Map());
    lastKeyupRef.current = {};
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold mr-auto">⌨️ {t("keyboard")}</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{t("kbLayout")}</span>
          <div className="flex items-center gap-1 rounded-full border border-border p-1 bg-bg-card">
            {["us", "frca"].map((name) => (
              <button
                key={name}
                onClick={() => setLayoutName(name)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  layoutName === name
                    ? "bg-accent text-bg-primary font-medium"
                    : "text-text-secondary hover:bg-bg-secondary"
                }`}
              >
                {name === "us" ? t("kbUs") : t("kbCaFr")}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{t("kbPlatform")}</span>
          <div className="flex items-center gap-1 rounded-full border border-border p-1 bg-bg-card">
            {["win", "mac"].map((name) => (
              <button
                key={name}
                onClick={() => setPlatformName(name)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  platformName === name
                    ? "bg-accent text-bg-primary font-medium"
                    : "text-text-secondary hover:bg-bg-secondary"
                }`}
              >
                {name === "win" ? t("kbWin") : t("kbMac")}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={showNumpad}
            onChange={(e) => setShowNumpad(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          {t("kbNumpad")}
        </label>
        <div className="text-sm text-text-secondary tabular-nums">
          <span className="text-accent font-semibold">{testedInLayout}</span> / {layoutCodes.size}{" "}
          {t("kbTested")}
        </div>
        <button
          onClick={reset}
          className="px-3 py-1.5 rounded-full text-sm border border-border text-text-secondary hover:bg-bg-secondary transition-colors"
        >
          {t("kbReset")}
        </button>
      </div>

      <div
        ref={areaRef}
        tabIndex={0}
        className="rounded-2xl border border-border bg-bg-secondary/60 p-2 sm:p-4 overflow-x-auto outline-none focus:border-accent/60"
        onClick={() => areaRef.current?.focus()}
      >
        <div
          className="flex gap-2 sm:gap-3 w-max mx-auto"
          style={{ "--u": "clamp(1.35rem, 3.4vw, 2.55rem)" }}
        >
          {/* main block */}
          <div className="flex flex-col gap-1">
            {layout.main.map((row, i) => (
              <div key={i} className={`flex gap-1 ${i === 0 ? "mb-1.5" : ""}`}>
                {row.map((item, j) => (
                  <Key
                    key={j}
                    item={item}
                    pressed={item.code && pressed.has(item.code)}
                    tested={item.code && tested.has(item.code)}
                  />
                ))}
              </div>
            ))}
          </div>
          {/* nav / arrows */}
          <div className="flex flex-col gap-1">
            {layout.nav.map((row, i) =>
              row.length === 0 ? (
                <div key={i} className="h-[var(--u)]" />
              ) : (
                <div key={i} className={`flex gap-1 ${i === 0 ? "mb-1.5" : ""}`}>
                  {row.map((item, j) => (
                    <Key
                      key={j}
                      item={item}
                      pressed={item.code && pressed.has(item.code)}
                      tested={item.code && tested.has(item.code)}
                    />
                  ))}
                </div>
              )
            )}
          </div>
          {/* numpad */}
          {showNumpad && (
            <div className="flex flex-col gap-1">
              <div className="h-[var(--u)] mb-1.5" />
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: "repeat(4, var(--u))",
                  gridAutoRows: "var(--u)",
                }}
              >
                {NUMPAD.map((item) => (
                  <div
                    key={item.code}
                    style={{
                      gridColumn: `${item.col} / span ${item.colSpan || 1}`,
                      gridRow: `${item.row} / span ${item.rowSpan || 1}`,
                    }}
                    className={`rounded-md border text-[10px] sm:text-xs flex items-center justify-center select-none transition-colors duration-75 ${
                      pressed.has(item.code)
                        ? "border-accent bg-accent text-bg-primary font-semibold"
                        : tested.has(item.code)
                          ? "border-accent/60 bg-accent/20 text-text-primary"
                          : "border-border bg-bg-card text-text-secondary"
                    }`}
                    title={item.code}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-text-muted mt-4">{t("kbHint")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-text-secondary">
        <span>
          {t("kbSimul")}:{" "}
          <span className="text-accent font-semibold tabular-nums">{pressed.size}</span>
        </span>
        <span>
          {t("kbMaxSimul")}:{" "}
          <span className="text-accent font-semibold tabular-nums">{maxSimul}</span>
        </span>
        <span>
          {t("kbChatter")}:{" "}
          {chatter.size === 0 ? (
            <span className="text-text-muted">{t("kbNone")}</span>
          ) : (
            <span className="text-red-500 font-mono">
              {[...chatter.entries()].map(([code, n]) => `${code} ×${n}`).join(", ")}
            </span>
          )}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <div className="rounded-2xl border border-border bg-bg-card p-5">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
            {t("kbLastKey")}
          </h2>
          {lastEvent ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                [t("kbKey"), lastEvent.key === " " ? "Space" : lastEvent.key],
                [t("kbCode"), lastEvent.code],
                [t("kbKeyCode"), String(lastEvent.keyCode)],
                [t("kbLocation"), String(lastEvent.location)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-bg-secondary px-3 py-2">
                  <div className="text-xs text-text-muted">{label}</div>
                  <div className="font-mono text-sm truncate">{value}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">{t("kbNoKey")}</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-bg-card p-5">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
            {t("kbHistory")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {history.length === 0 ? (
              <p className="text-sm text-text-muted">{t("kbNoKey")}</p>
            ) : (
              history.map((h, i) => (
                <span
                  key={`${h.ts}-${i}`}
                  className="px-2 py-1 rounded-md bg-bg-secondary border border-border font-mono text-xs"
                >
                  {h.key === " " ? "Space" : h.key}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-text-muted mt-6">💡 {t("kbFnNote")}</p>
    </div>
  );
}
