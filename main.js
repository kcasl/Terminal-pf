const output = document.getElementById("output");
const form = document.getElementById("terminal-form");
const input = document.getElementById("terminal-input");
const viewer = document.getElementById("viewer");
const viewerTitle = document.getElementById("viewer-title");
const viewerContent = document.getElementById("viewer-content");

const fileSystem = {
  "/": {
    type: "dir",
    children: {
      logs: {
        type: "dir",
        children: {
          "00_welcome.log": {
            type: "file",
            content: [
              "TERMINAL OS v0.51",
              "Welcome to the portfolio command interface.",
              "Mission: Inspect logs to discover profile and work history.",
            ],
          },
          "01_profile.log": {
            type: "file",
            content: [
              "NAME: Your Name",
              "ROLE: Frontend / Fullstack Developer",
              "LOCATION: Seoul, KR",
              "FOCUS: Product UI, performance, DX",
            ],
          },
          "02_skills.log": {
            type: "file",
            content: [
              "STACK:",
              "- JavaScript / TypeScript",
              "- React / Next.js",
              "- Node.js / Express",
              "- HTML / CSS / Accessibility",
            ],
          },
          "03_projects.log": {
            type: "file",
            content: [
              "[A] Project One - SaaS dashboard",
              "    - Reduced dashboard load time by 42%",
              "    - Built reusable UI component system",
              "[B] Project Two - Commerce frontend",
              "    - Improved conversion funnel UX",
              "    - Added analytics events for product insight",
            ],
          },
          "04_contact.log": {
            type: "file",
            content: [
              "EMAIL: you@example.com",
              "GITHUB: github.com/your-id",
              "BLOG: your-site.dev",
              "LINKEDIN: linkedin.com/in/your-id",
            ],
          },
        },
      },
      docs: {
        type: "dir",
        children: {
          "readme.txt": {
            type: "file",
            content: [
              "Try commands:",
              "ls, cd, pwd, cat, whoami, uname, date, echo, clear, help",
              "Hint: cd logs && ls",
            ],
          },
        },
      },
    },
  },
};

let currentPath = "/";
const commandHistory = [];
let historyIndex = -1;

const promptText = () => `root@portfolio:${currentPath}$`;

function normalizePath(path) {
  const parts = path.split("/").filter(Boolean);
  return `/${parts.join("/")}`.replace(/\/+/g, "/") || "/";
}

function resolvePath(targetPath) {
  if (!targetPath || targetPath === ".") return currentPath;

  const base = targetPath.startsWith("/") ? [] : currentPath.split("/").filter(Boolean);
  const segments = targetPath.split("/").filter(Boolean);

  for (const segment of segments) {
    if (segment === ".") continue;
    if (segment === "..") {
      base.pop();
      continue;
    }
    base.push(segment);
  }

  return normalizePath(`/${base.join("/")}`);
}

function getNode(path) {
  const normalized = normalizePath(path);
  if (normalized === "/") return fileSystem["/"];

  const segments = normalized.split("/").filter(Boolean);
  let node = fileSystem["/"];

  for (const segment of segments) {
    if (!node || node.type !== "dir") return null;
    node = node.children[segment];
  }

  return node || null;
}

function updatePrompt() {
  const prompt = document.querySelector(".prompt");
  prompt.textContent = promptText();
}

function openViewer(title, contentLines) {
  viewerTitle.textContent = `LOG READER :: ${title}`;
  viewerContent.textContent = contentLines.join("\n");
  viewer.classList.remove("viewer--visible");
  requestAnimationFrame(() => {
    viewer.classList.add("viewer--visible");
  });
}

function closeViewer() {
  viewer.classList.remove("viewer--visible");
}

function addLine(text, type = "response") {
  const line = document.createElement("p");
  line.className = `line line--${type}`;
  line.textContent = text;
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function printLines(lines, type = "response") {
  lines.forEach((line) => addLine(line, type));
}

function boot() {
  printLines(
    [
      "------------------------------------------------------------",
      "TERMINAL OS v0.51",
      "Welcome, operator. Portfolio intelligence terminal is online.",
      "Type 'help' to view available commands.",
      "------------------------------------------------------------",
    ],
    "muted",
  );
  updatePrompt();
}

const commands = {
  help: () => ({
    lines: [
      "Available commands:",
      "help, ls, cd, pwd, cat, whoami, uname, date, echo, clear",
      "Quick start: cd logs && ls && cat 03_projects.log",
    ],
  }),
  clear: () => {
    output.innerHTML = "";
    closeViewer();
    return { lines: [] };
  },
  pwd: () => ({ lines: [currentPath] }),
  whoami: () => ({ lines: ["root"] }),
  uname: () => ({ lines: ["TERMINAL-OS portfolio-kernel 0.51"] }),
  date: () => ({ lines: [new Date().toString()] }),
  echo: (args) => ({ lines: [args.join(" ")] }),
  ls: (args) => {
    const path = resolvePath(args[0] || ".");
    const node = getNode(path);
    if (!node) return { lines: [`ls: cannot access '${args[0]}': No such file or directory`], type: "error" };
    if (node.type === "file") return { lines: [args[0] || path] };
    const entries = Object.keys(node.children).sort();
    return { lines: [entries.join("  ")] };
  },
  cd: (args) => {
    const target = args[0] || "/";
    const next = resolvePath(target);
    const node = getNode(next);
    if (!node) return { lines: [`cd: no such file or directory: ${target}`], type: "error" };
    if (node.type !== "dir") return { lines: [`cd: not a directory: ${target}`], type: "error" };
    currentPath = next;
    updatePrompt();
    return { lines: [] };
  },
  cat: (args) => {
    if (!args[0]) return { lines: ["cat: missing file operand"], type: "error" };
    const path = resolvePath(args[0]);
    const node = getNode(path);
    if (!node) return { lines: [`cat: ${args[0]}: No such file or directory`], type: "error" };
    if (node.type !== "file") return { lines: [`cat: ${args[0]}: Is a directory`], type: "error" };
    if (/\.(log|txt)$/i.test(args[0])) {
      openViewer(path, node.content);
    }
    return { lines: node.content };
  },
};

function listCandidates(inputText) {
  const trimmed = inputText.trim();
  const pieces = trimmed.split(/\s+/);
  const isTrailingSpace = /\s$/.test(inputText);

  if (pieces.length <= 1 && !isTrailingSpace) {
    const start = pieces[0] || "";
    return Object.keys(commands)
      .filter((name) => name.startsWith(start))
      .sort();
  }

  const command = pieces[0];
  if (!["cat", "cd", "ls"].includes(command)) return [];

  const partialRaw = isTrailingSpace ? "" : pieces[pieces.length - 1];
  const hasSlash = partialRaw.includes("/");
  const basePathRaw = hasSlash ? partialRaw.slice(0, partialRaw.lastIndexOf("/") + 1) : "";
  const namePrefix = hasSlash ? partialRaw.slice(partialRaw.lastIndexOf("/") + 1) : partialRaw;
  const searchBase = resolvePath(basePathRaw || ".");
  const baseNode = getNode(searchBase);

  if (!baseNode || baseNode.type !== "dir") return [];

  return Object.keys(baseNode.children)
    .filter((name) => name.startsWith(namePrefix))
    .sort()
    .map((name) => `${basePathRaw}${name}`);
}

function applyCompletion() {
  const raw = input.value;
  const candidates = listCandidates(raw);
  if (!candidates.length) return;

  const trimmed = raw.trim();
  const pieces = trimmed.split(/\s+/);
  const isTrailingSpace = /\s$/.test(raw);

  if (pieces.length <= 1 && !isTrailingSpace) {
    if (candidates.length === 1) {
      input.value = `${candidates[0]} `;
    } else {
      addLine(candidates.join("  "), "muted");
    }
    return;
  }

  const command = pieces[0];
  const beforeArg = raw.slice(0, raw.lastIndexOf(isTrailingSpace ? " " : pieces[pieces.length - 1]));

  if (candidates.length === 1) {
    input.value = `${beforeArg} ${candidates[0]}`.replace(/\s+/g, " ").trimStart();
    if (command !== "cat") input.value += "/";
  } else {
    addLine(candidates.join("  "), "muted");
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const raw = input.value.trim();
  if (!raw) return;

  commandHistory.push(raw);
  historyIndex = commandHistory.length;

  addLine(`${promptText()} ${raw}`, "prompt");
  input.value = "";

  const [command, ...args] = raw.split(/\s+/);
  const handler = commands[command];

  if (!handler) {
    addLine(`${command}: command not found`, "error");
    addLine("Type 'help' to list available commands.", "muted");
    return;
  }

  const result = handler(args);
  printLines(result.lines || [], result.type || "response");
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    applyCompletion();
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (!commandHistory.length) return;
    historyIndex = Math.max(0, historyIndex - 1);
    input.value = commandHistory[historyIndex] || "";
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!commandHistory.length) return;
    historyIndex = Math.min(commandHistory.length, historyIndex + 1);
    input.value = commandHistory[historyIndex] || "";
  }
});

window.addEventListener("click", () => input.focus());
boot();
