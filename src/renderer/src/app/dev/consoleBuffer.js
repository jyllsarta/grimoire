// console の直近ログを保持する (xqueens consoleBuffer.js)。インスペクタと autotest が読む
const MAX_LOGS = 200;
const logBuffer = [];

function safeSerialize(value, depth = 0) {
  if (depth > 3) return "[MaxDepth]";
  if (value === null) return null;
  if (value === undefined) return "[undefined]";
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return value;
  if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
  if (Array.isArray(value)) return value.map((v) => safeSerialize(v, depth + 1));
  if (t === "object") {
    const out = {};
    for (const key of Object.keys(value)) {
      try {
        out[key] = safeSerialize(value[key], depth + 1);
      } catch {
        out[key] = "[Unserializable]";
      }
    }
    return out;
  }
  if (t === "function") return `[Function ${value.name || "anonymous"}]`;
  return `[${t}]`;
}

function wrapConsole(method) {
  const original = console[method];
  console[method] = (...args) => {
    logBuffer.push({ time: Date.now(), level: method, args: args.map((a) => safeSerialize(a)) });
    if (logBuffer.length > MAX_LOGS) logBuffer.shift();
    original.apply(console, args);
  };
}

["log", "info", "warn", "error"].forEach(wrapConsole);

export function getConsoleLogs(levels = null) {
  return levels ? logBuffer.filter((l) => levels.includes(l.level)) : [...logBuffer];
}

export function clearConsoleLogs() {
  logBuffer.length = 0;
}

window.addEventListener("error", (e) => console.error("Uncaught Error:", e.message, e.error));
window.addEventListener("unhandledrejection", (e) => console.error("Unhandled Promise Rejection:", e.reason));
