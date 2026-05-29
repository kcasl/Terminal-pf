const desktop = document.getElementById("desktop");
const template = document.getElementById("terminal-template");
const documentTemplate = document.getElementById("document-template");

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
              "ls, cd, pwd, cat, whoami, uname, date, echo, clear, help, newterm",
              "Hint: cd docs && ls && cat portfolio.md",
            ],
          },
          "portfolio.md": {
            type: "file",
            content: [
              "# Portfolio Brief",
              "",
              "Welcome to my terminal-style portfolio.",
              "",
              "## Highlights",
              "- Built data-driven UI dashboards",
              "- Improved load performance and accessibility",
              "- Collaborated with product and design teams",
              "",
              "## Links",
              "- GitHub: https://github.com/your-id",
              "- Blog: https://your-site.dev",
            ],
          },
          "sample.pdf": {
            type: "file",
            contentType: "pdf",
            src: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
          },
          "terminal-shot.png": {
            type: "file",
            contentType: "image",
            src: "https://picsum.photos/seed/terminal/900/520",
          },
        },
      },
    },
  },
};

let zIndexCounter = 10;

function normalizePath(path) {
  const parts = path.split("/").filter(Boolean);
  return `/${parts.join("/")}`.replace(/\/+/g, "/") || "/";
}

function resolvePath(currentPath, targetPath) {
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

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function markdownToHtml(lines) {
  const html = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push("<p></p>");
      continue;
    }

    if (line.startsWith("### ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    const linked = escapeHtml(line).replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
    );
    html.push(`<p>${linked}</p>`);
  }

  if (inList) html.push("</ul>");
  return html.join("");
}

function raiseWindow(windowEl) {
  zIndexCounter += 1;
  windowEl.style.zIndex = String(zIndexCounter);
}

function attachDrag(windowEl) {
  const handle = windowEl.querySelector(".drag-handle");
  let startX = 0;
  let startY = 0;
  let baseLeft = 0;
  let baseTop = 0;
  let dragging = false;

  const onMove = (event) => {
    if (!dragging) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    windowEl.style.left = `${baseLeft + dx}px`;
    windowEl.style.top = `${baseTop + dy}px`;
  };

  const onUp = () => {
    dragging = false;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };

  handle.addEventListener("mousedown", (event) => {
    dragging = true;
    raiseWindow(windowEl);
    startX = event.clientX;
    startY = event.clientY;
    baseLeft = windowEl.offsetLeft;
    baseTop = windowEl.offsetTop;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });
}

function attachResize(windowEl) {
  const handle = windowEl.querySelector(".resize-handle");
  let startX = 0;
  let startY = 0;
  let baseWidth = 0;
  let baseHeight = 0;
  let resizing = false;

  const onMove = (event) => {
    if (!resizing) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const customMinWidth = Number(windowEl.dataset.minWidth || 0);
    const customMinHeight = Number(windowEl.dataset.minHeight || 0);
    const defaultMinWidth = window.innerWidth <= 900 ? 320 : 600;
    const defaultMinHeight = window.innerWidth <= 900 ? 300 : 380;
    const minWidth = customMinWidth || defaultMinWidth;
    const minHeight = customMinHeight || defaultMinHeight;
    const nextWidth = Math.max(minWidth, baseWidth + dx);
    const nextHeight = Math.max(minHeight, baseHeight + dy);
    windowEl.style.width = `${nextWidth}px`;
    windowEl.style.height = `${nextHeight}px`;
  };

  const onUp = () => {
    resizing = false;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };

  handle.addEventListener("mousedown", (event) => {
    event.preventDefault();
    resizing = true;
    raiseWindow(windowEl);
    startX = event.clientX;
    startY = event.clientY;
    baseWidth = windowEl.offsetWidth;
    baseHeight = windowEl.offsetHeight;
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });
}

function openDocumentWindow(title, payload, initialX = 70, initialY = 70) {
  const node = documentTemplate.content.firstElementChild.cloneNode(true);
  const titleEl = node.querySelector(".document__title");
  const bodyEl = node.querySelector(".document__body");
  const closeButton = node.querySelector(".document__close");

  titleEl.textContent = `DOCUMENT :: ${title}`;
  bodyEl.innerHTML = "";

  if (payload.kind === "markdown") {
    const div = document.createElement("div");
    div.className = "viewer__content viewer__content--markdown";
    div.innerHTML = markdownToHtml(payload.lines);
    bodyEl.appendChild(div);
  } else if (payload.kind === "image") {
    const img = document.createElement("img");
    img.className = "viewer__image";
    img.src = payload.src;
    img.alt = title;
    bodyEl.appendChild(img);
  } else if (payload.kind === "pdf") {
    const iframe = document.createElement("iframe");
    iframe.className = "viewer__pdf";
    iframe.src = payload.src;
    iframe.title = title;
    bodyEl.appendChild(iframe);
  } else {
    const pre = document.createElement("pre");
    pre.className = "viewer__content";
    pre.textContent = payload.lines.join("\n");
    bodyEl.appendChild(pre);
  }

  closeButton.addEventListener("click", () => {
    node.remove();
  });

  node.addEventListener("mousedown", () => raiseWindow(node));
  node.style.left = `${initialX}px`;
  node.style.top = `${initialY}px`;
  raiseWindow(node);
  attachDrag(node);
  attachResize(node);
  desktop.appendChild(node);

  requestAnimationFrame(() => {
    bodyEl.classList.add("document__body--visible");
  });
}

function createTerminalWindow(initialX = 24, initialY = 24) {
  const node = template.content.firstElementChild.cloneNode(true);
  const output = node.querySelector(".terminal__output");
  const form = node.querySelector(".terminal__input-row");
  const input = node.querySelector(".terminal__input");
  const prompt = node.querySelector(".prompt");

  let currentPath = "/";
  const commandHistory = [];
  let historyIndex = -1;

  function promptText() {
    return `root@portfolio:${currentPath}$`;
  }

  function updatePrompt() {
    prompt.textContent = promptText();
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

  function listCandidates(inputText) {
    const trimmed = inputText.trim();
    const pieces = trimmed ? trimmed.split(/\s+/) : [];
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
    const searchBase = resolvePath(currentPath, basePathRaw || ".");
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
    const pieces = trimmed ? trimmed.split(/\s+/) : [];
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
    const token = isTrailingSpace ? "" : pieces[pieces.length - 1];
    const cutIndex = raw.length - token.length;
    const before = raw.slice(0, cutIndex);

    if (candidates.length === 1) {
      input.value = `${before}${candidates[0]}`;
      if (command !== "cat") {
        const targetNode = getNode(resolvePath(currentPath, candidates[0]));
        if (targetNode && targetNode.type === "dir" && !input.value.endsWith("/")) {
          input.value += "/";
        }
      }
    } else {
      addLine(candidates.join("  "), "muted");
    }
  }

  const commands = {
    help: () => ({
      lines: [
        "Available commands:",
        "help, ls, cd, pwd, cat, whoami, uname, date, echo, clear, newterm",
        "Quick start: cd docs && ls && cat portfolio.md",
      ],
    }),
    clear: () => {
      output.innerHTML = "";
      return { lines: [] };
    },
    pwd: () => ({ lines: [currentPath] }),
    whoami: () => ({ lines: ["root"] }),
    uname: () => ({ lines: ["TERMINAL-OS portfolio-kernel 0.51"] }),
    date: () => ({ lines: [new Date().toString()] }),
    echo: (args) => ({ lines: [args.join(" ")] }),
    newterm: () => {
      createTerminalWindow(node.offsetLeft + 36, node.offsetTop + 34);
      return { lines: ["spawned: new terminal window"] };
    },
    ls: (args) => {
      const path = resolvePath(currentPath, args[0] || ".");
      const targetNode = getNode(path);
      if (!targetNode) return { lines: [`ls: cannot access '${args[0]}': No such file or directory`], type: "error" };
      if (targetNode.type === "file") return { lines: [args[0] || path] };
      return { lines: [Object.keys(targetNode.children).sort().join("  ")] };
    },
    cd: (args) => {
      const target = args[0] || "/";
      const next = resolvePath(currentPath, target);
      const targetNode = getNode(next);
      if (!targetNode) return { lines: [`cd: no such file or directory: ${target}`], type: "error" };
      if (targetNode.type !== "dir") return { lines: [`cd: not a directory: ${target}`], type: "error" };
      currentPath = next;
      updatePrompt();
      return { lines: [] };
    },
    cat: (args) => {
      if (!args[0]) return { lines: ["cat: missing file operand"], type: "error" };
      const path = resolvePath(currentPath, args[0]);
      const targetNode = getNode(path);
      if (!targetNode) return { lines: [`cat: ${args[0]}: No such file or directory`], type: "error" };
      if (targetNode.type !== "file") return { lines: [`cat: ${args[0]}: Is a directory`], type: "error" };

      const ext = (args[0].split(".").pop() || "").toLowerCase();
      if (ext === "md") {
        openDocumentWindow(path, { kind: "markdown", lines: targetNode.content || [] }, node.offsetLeft + 56, node.offsetTop + 46);
        return { lines: [`opened markdown: ${path}`] };
      }
      if (ext === "pdf" || targetNode.contentType === "pdf") {
        openDocumentWindow(path, { kind: "pdf", src: targetNode.src }, node.offsetLeft + 56, node.offsetTop + 46);
        return { lines: [`opened pdf: ${path}`] };
      }
      if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext) || targetNode.contentType === "image") {
        openDocumentWindow(path, { kind: "image", src: targetNode.src }, node.offsetLeft + 56, node.offsetTop + 46);
        return { lines: [`opened image: ${path}`] };
      }
      if (["log", "txt"].includes(ext)) {
        openDocumentWindow(path, { kind: "text", lines: targetNode.content || [] }, node.offsetLeft + 56, node.offsetTop + 46);
        return { lines: [`opened text: ${path}`] };
      }

      return { lines: targetNode.content || [`binary file rendered in viewer: ${path}`] };
    },
  };

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

  node.addEventListener("mousedown", () => raiseWindow(node));
  node.style.left = `${initialX}px`;
  node.style.top = `${initialY}px`;
  raiseWindow(node);
  attachDrag(node);
  attachResize(node);
  desktop.appendChild(node);
  input.focus();
  boot();
}

createTerminalWindow(24, 24);
