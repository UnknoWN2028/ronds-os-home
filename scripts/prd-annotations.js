(function () {
  "use strict";

  var DOCUMENT_ID = "prd-equipment-location-5.1";
  var STORAGE_KEY = "ronds-prd-equipment-location-annotations-v1";
  var main = document.getElementById("main-content");
  var toolbarActions = document.querySelector(".toolbar-actions");

  if (!main || !toolbarActions) return;

  var state = {
    items: [],
    pending: null,
    editingId: null,
    activeId: null,
    storageAvailable: true,
    toastTimer: null,
    rangeById: {}
  };

  var ui = buildInterface();
  loadAnnotations();
  refreshAnchors();
  render();
  bindEvents();

  function buildInterface() {
    var annotationButton = document.createElement("button");
    annotationButton.className = "tool-button";
    annotationButton.id = "annotation-button";
    annotationButton.type = "button";
    annotationButton.setAttribute("aria-controls", "annotation-panel");
    annotationButton.setAttribute("aria-expanded", "false");
    annotationButton.innerHTML =
      '<span aria-hidden="true">✎</span>' +
      '<span>批注</span>' +
      '<span class="annotation-count" id="annotation-count" data-empty="true">0</span>';

    var printButton = document.getElementById("print-button");
    toolbarActions.insertBefore(annotationButton, printButton || null);

    var overlay = document.createElement("button");
    overlay.className = "annotation-overlay";
    overlay.id = "annotation-overlay";
    overlay.type = "button";
    overlay.setAttribute("aria-label", "关闭批注面板");

    var panel = document.createElement("aside");
    panel.className = "annotation-panel";
    panel.id = "annotation-panel";
    panel.setAttribute("aria-label", "文档批注");
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML =
      '<div class="annotation-panel__header">' +
        '<div class="annotation-panel__heading">' +
          '<strong>文档批注</strong>' +
          '<span>可修改、删除并导出</span>' +
        '</div>' +
        '<button class="annotation-icon-button" id="annotation-close" type="button" aria-label="关闭批注面板">×</button>' +
      '</div>' +
      '<div class="annotation-panel__tools">' +
        '<button class="annotation-mini-button" id="annotation-export" type="button">导出 JSON</button>' +
        '<button class="annotation-mini-button" id="annotation-import" type="button">导入 JSON</button>' +
        '<input id="annotation-import-file" type="file" accept="application/json,.json" hidden>' +
      '</div>' +
      '<p class="annotation-storage-note" id="annotation-storage-note">批注保存在当前浏览器；需要传给他人时请导出 JSON。</p>' +
      '<section class="annotation-composer" id="annotation-composer" aria-label="编辑批注" hidden>' +
        '<h3 id="annotation-composer-title">新增批注</h3>' +
        '<blockquote class="annotation-composer__quote" id="annotation-composer-quote"></blockquote>' +
        '<label for="annotation-note">批注内容</label>' +
        '<textarea id="annotation-note" maxlength="2000" placeholder="请输入审阅意见"></textarea>' +
        '<div class="annotation-composer__actions">' +
          '<button class="annotation-mini-button" id="annotation-cancel" type="button">取消</button>' +
          '<button class="annotation-mini-button annotation-mini-button--primary" id="annotation-save" type="button">保存批注</button>' +
        '</div>' +
      '</section>' +
      '<div class="annotation-list" id="annotation-list"></div>';

    var selectionAction = document.createElement("button");
    selectionAction.className = "annotation-selection-action";
    selectionAction.id = "annotation-selection-action";
    selectionAction.type = "button";
    selectionAction.innerHTML = '<span aria-hidden="true">✎</span><span>新增批注</span>';

    var toast = document.createElement("div");
    toast.className = "annotation-toast";
    toast.id = "annotation-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    document.body.appendChild(selectionAction);
    document.body.appendChild(toast);

    return {
      annotationButton: annotationButton,
      count: annotationButton.querySelector("#annotation-count"),
      overlay: overlay,
      panel: panel,
      closeButton: panel.querySelector("#annotation-close"),
      exportButton: panel.querySelector("#annotation-export"),
      importButton: panel.querySelector("#annotation-import"),
      importFile: panel.querySelector("#annotation-import-file"),
      storageNote: panel.querySelector("#annotation-storage-note"),
      composer: panel.querySelector("#annotation-composer"),
      composerTitle: panel.querySelector("#annotation-composer-title"),
      composerQuote: panel.querySelector("#annotation-composer-quote"),
      note: panel.querySelector("#annotation-note"),
      cancelButton: panel.querySelector("#annotation-cancel"),
      saveButton: panel.querySelector("#annotation-save"),
      list: panel.querySelector("#annotation-list"),
      selectionAction: selectionAction,
      toast: toast
    };
  }

  function bindEvents() {
    ui.annotationButton.addEventListener("click", function () {
      setPanel(!document.body.classList.contains("annotation-open"));
    });

    ui.closeButton.addEventListener("click", function () {
      setPanel(false);
    });

    ui.overlay.addEventListener("click", function () {
      setPanel(false);
    });

    ui.selectionAction.addEventListener("mousedown", function (event) {
      event.preventDefault();
    });

    ui.selectionAction.addEventListener("click", function () {
      if (!state.pending) return;
      beginCreate();
    });

    ui.cancelButton.addEventListener("click", closeComposer);
    ui.saveButton.addEventListener("click", saveComposer);

    ui.note.addEventListener("keydown", function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        saveComposer();
      }
    });

    ui.exportButton.addEventListener("click", exportAnnotations);
    ui.importButton.addEventListener("click", function () {
      ui.importFile.click();
    });
    ui.importFile.addEventListener("change", importAnnotations);

    main.addEventListener("mouseup", scheduleSelectionAction);
    main.addEventListener("keyup", function (event) {
      if (event.key === "Shift" || event.key.indexOf("Arrow") !== -1) {
        scheduleSelectionAction();
      }
    });

    document.addEventListener("mousedown", function (event) {
      if (!ui.selectionAction.contains(event.target)) hideSelectionAction();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (!ui.composer.hidden) {
        closeComposer();
        event.stopPropagation();
        return;
      }
      if (document.body.classList.contains("annotation-open")) {
        setPanel(false);
        event.stopPropagation();
      }
    }, true);

    window.addEventListener("scroll", hideSelectionAction, { passive: true });
    window.addEventListener("resize", hideSelectionAction);

    window.addEventListener("storage", function (event) {
      if (event.key !== STORAGE_KEY) return;
      loadAnnotations();
      refreshAnchors();
      render();
      showToast("批注已从其他页面同步");
    });
  }

  function setPanel(open) {
    document.body.classList.toggle("annotation-open", open);
    ui.panel.setAttribute("aria-hidden", String(!open));
    ui.annotationButton.setAttribute("aria-expanded", String(open));
    if (!open) {
      closeComposer();
      setActive(null);
    }
  }

  function scheduleSelectionAction() {
    window.setTimeout(updateSelectionAction, 0);
  }

  function updateSelectionAction() {
    var selection = window.getSelection();
    hideSelectionAction();
    state.pending = null;

    if (!selection || selection.rangeCount !== 1 || selection.isCollapsed) return;

    var range = selection.getRangeAt(0);
    var root = getSelectionRoot(range);
    if (!root) {
      showToast("请在同一章节内选择需要批注的文字", true);
      return;
    }

    var rawQuote = range.toString();
    var leftWhitespace = (rawQuote.match(/^\s*/) || [""])[0].length;
    var rightWhitespace = (rawQuote.match(/\s*$/) || [""])[0].length;
    var quote = rawQuote.trim();
    if (!quote) return;

    var start = pointOffset(root, range.startContainer, range.startOffset) + leftWhitespace;
    var end = pointOffset(root, range.endContainer, range.endOffset) - rightWhitespace;
    if (end <= start) return;

    var rootText = root.textContent || "";
    state.pending = {
      rootId: root.id,
      start: start,
      end: end,
      quote: rootText.slice(start, end),
      prefix: rootText.slice(Math.max(0, start - 28), start),
      suffix: rootText.slice(end, Math.min(rootText.length, end + 28))
    };

    var rect = range.getBoundingClientRect();
    var left = Math.max(12, Math.min(window.innerWidth - 118, rect.right - 18));
    var top = Math.max(12, Math.min(window.innerHeight - 48, rect.bottom + 8));
    ui.selectionAction.style.left = left + "px";
    ui.selectionAction.style.top = top + "px";
    ui.selectionAction.classList.add("visible");
  }

  function getSelectionRoot(range) {
    var startElement = range.startContainer.nodeType === 1
      ? range.startContainer
      : range.startContainer.parentElement;
    var endElement = range.endContainer.nodeType === 1
      ? range.endContainer
      : range.endContainer.parentElement;
    var startRoot = startElement && startElement.closest(".doc-section[id]");
    var endRoot = endElement && endElement.closest(".doc-section[id]");
    if (!startRoot || startRoot !== endRoot || !main.contains(startRoot)) return null;
    return startRoot;
  }

  function pointOffset(root, container, offset) {
    var probe = document.createRange();
    probe.selectNodeContents(root);
    probe.setEnd(container, offset);
    return probe.toString().length;
  }

  function hideSelectionAction() {
    ui.selectionAction.classList.remove("visible");
  }

  function beginCreate() {
    if (!state.pending) return;
    state.editingId = null;
    ui.composerTitle.textContent = "新增批注";
    ui.composerQuote.textContent = state.pending.quote;
    ui.note.value = "";
    ui.composer.hidden = false;
    hideSelectionAction();
    setPanel(true);
    window.getSelection().removeAllRanges();
    window.setTimeout(function () { ui.note.focus(); }, 30);
  }

  function beginEdit(id) {
    var item = findItem(id);
    if (!item) return;
    state.editingId = id;
    state.pending = null;
    ui.composerTitle.textContent = "修改批注";
    ui.composerQuote.textContent = item.quote;
    ui.note.value = item.note;
    ui.composer.hidden = false;
    setPanel(true);
    setActive(id);
    window.setTimeout(function () {
      ui.note.focus();
      ui.note.setSelectionRange(ui.note.value.length, ui.note.value.length);
    }, 30);
  }

  function closeComposer() {
    state.editingId = null;
    state.pending = null;
    ui.note.value = "";
    ui.composer.hidden = true;
    hideSelectionAction();
  }

  function saveComposer() {
    var note = ui.note.value.trim();
    if (!note) {
      showToast("请输入批注内容", true);
      ui.note.focus();
      return;
    }

    var now = new Date().toISOString();
    if (state.editingId) {
      var current = findItem(state.editingId);
      if (!current) return;
      current.note = note;
      current.updatedAt = now;
      persistAnnotations();
      refreshAnchors();
      render();
      setActive(current.id);
      closeComposer();
      showToast("批注已修改");
      return;
    }

    if (!state.pending) {
      showToast("请重新选择需要批注的文字", true);
      return;
    }

    var item = {
      id: createId(),
      rootId: state.pending.rootId,
      start: state.pending.start,
      end: state.pending.end,
      quote: state.pending.quote,
      prefix: state.pending.prefix,
      suffix: state.pending.suffix,
      note: note,
      createdAt: now,
      updatedAt: now
    };

    state.items.push(item);
    state.items.sort(compareByDocumentOrder);
    persistAnnotations();
    refreshAnchors();
    render();
    setActive(item.id);
    closeComposer();
    showToast("批注已保存");
  }

  function deleteAnnotation(id) {
    var item = findItem(id);
    if (!item) return;
    if (!window.confirm("确定删除这条批注吗？")) return;
    state.items = state.items.filter(function (entry) { return entry.id !== id; });
    if (state.activeId === id) state.activeId = null;
    persistAnnotations();
    refreshAnchors();
    render();
    closeComposer();
    showToast("批注已删除");
  }

  function locateAnnotation(id) {
    var item = findItem(id);
    var range = state.rangeById[id];
    if (!item || !range) {
      showToast("原文已变化，暂时无法定位这条批注", true);
      return;
    }
    setPanel(false);
    setActive(id);
    var root = document.getElementById(item.rootId);
    if (root) {
      root.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function setActive(id) {
    state.activeId = id;
    renderHighlights();
    Array.prototype.forEach.call(ui.list.querySelectorAll(".annotation-card"), function (card) {
      var active = card.getAttribute("data-annotation-id") === id;
      card.classList.toggle("is-active", active);
      if (active && document.body.classList.contains("annotation-open")) {
        card.scrollIntoView({ block: "nearest" });
      }
    });
  }

  function render() {
    renderCount();
    renderHighlights();
    renderList();
    renderStorageState();
  }

  function renderCount() {
    ui.count.textContent = String(state.items.length);
    ui.count.setAttribute("data-empty", String(state.items.length === 0));
    ui.exportButton.disabled = state.items.length === 0;
  }

  function renderStorageState() {
    ui.storageNote.classList.toggle("is-warning", !state.storageAvailable);
    ui.storageNote.textContent = state.storageAvailable
      ? "批注保存在当前浏览器；需要传给他人时请导出 JSON。"
      : "浏览器未允许本地保存；当前批注仅在本次打开期间有效，请及时导出 JSON。";
  }

  function renderList() {
    ui.list.textContent = "";
    if (!state.items.length) {
      var empty = document.createElement("div");
      empty.className = "annotation-empty";
      empty.innerHTML =
        "<div><strong>暂时没有批注</strong>" +
        "<span>在正文同一章节内选中文字，<br>再点击“新增批注”。</span></div>";
      ui.list.appendChild(empty);
      return;
    }

    state.items.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "annotation-card";
      card.setAttribute("data-annotation-id", item.id);
      if (item.id === state.activeId) card.classList.add("is-active");
      if (item.orphaned) card.classList.add("is-orphaned");

      var meta = document.createElement("div");
      meta.className = "annotation-card__meta";

      var section = document.createElement("span");
      section.className = "annotation-card__section";
      section.textContent = sectionLabel(item.rootId);
      meta.appendChild(section);

      if (item.orphaned) {
        var status = document.createElement("span");
        status.className = "annotation-card__status";
        status.textContent = "原文已变化";
        meta.appendChild(status);
      }

      var quote = document.createElement("blockquote");
      quote.className = "annotation-card__quote";
      quote.textContent = item.quote;

      var note = document.createElement("p");
      note.className = "annotation-card__note";
      note.textContent = item.note;

      var time = document.createElement("div");
      time.className = "annotation-card__time";
      time.textContent = "更新于 " + formatTime(item.updatedAt);

      var actions = document.createElement("div");
      actions.className = "annotation-card__actions";
      actions.appendChild(cardButton("定位", function () { locateAnnotation(item.id); }, item.orphaned));
      actions.appendChild(cardButton("修改", function () { beginEdit(item.id); }));
      actions.appendChild(cardButton("删除", function () { deleteAnnotation(item.id); }, false, true));

      card.appendChild(meta);
      card.appendChild(quote);
      card.appendChild(note);
      card.appendChild(time);
      card.appendChild(actions);
      ui.list.appendChild(card);
    });
  }

  function cardButton(label, handler, disabled, danger) {
    var button = document.createElement("button");
    button.className = "annotation-card__action" + (danger ? " annotation-card__action--danger" : "");
    button.type = "button";
    button.textContent = label;
    button.disabled = Boolean(disabled);
    button.addEventListener("click", handler);
    return button;
  }

  function refreshAnchors() {
    state.rangeById = {};
    state.items.forEach(function (item) {
      item.orphaned = false;
      var root = document.getElementById(item.rootId);
      if (!root) {
        item.orphaned = true;
        return;
      }

      var rootText = root.textContent || "";
      var anchor = resolveAnchor(rootText, item);
      if (!anchor) {
        item.orphaned = true;
        return;
      }

      item.start = anchor.start;
      item.end = anchor.end;
      var range = rangeFromOffsets(root, item.start, item.end);
      if (!range) {
        item.orphaned = true;
        return;
      }
      state.rangeById[item.id] = range;
    });
  }

  function resolveAnchor(text, item) {
    if (
      Number.isInteger(item.start) &&
      Number.isInteger(item.end) &&
      item.start >= 0 &&
      item.end > item.start &&
      text.slice(item.start, item.end) === item.quote
    ) {
      return { start: item.start, end: item.end };
    }

    if (!item.quote) return null;
    var candidates = [];
    var cursor = 0;
    while (cursor <= text.length) {
      var index = text.indexOf(item.quote, cursor);
      if (index === -1) break;
      var score = 0;
      if (item.prefix && text.slice(Math.max(0, index - item.prefix.length), index) === item.prefix) score += 2;
      var end = index + item.quote.length;
      if (item.suffix && text.slice(end, end + item.suffix.length) === item.suffix) score += 2;
      var distance = Number.isInteger(item.start) ? Math.abs(index - item.start) : 0;
      candidates.push({ start: index, end: end, score: score, distance: distance });
      cursor = index + Math.max(1, item.quote.length);
    }

    if (!candidates.length) return null;
    candidates.sort(function (a, b) {
      return b.score - a.score || a.distance - b.distance;
    });
    return candidates[0];
  }

  function rangeFromOffsets(root, start, end) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var position = 0;
    var startNode = null;
    var endNode = null;
    var startOffset = 0;
    var endOffset = 0;
    var node;

    while ((node = walker.nextNode())) {
      var next = position + node.nodeValue.length;
      if (!startNode && start >= position && start <= next) {
        startNode = node;
        startOffset = start - position;
      }
      if (end >= position && end <= next) {
        endNode = node;
        endOffset = end - position;
        break;
      }
      position = next;
    }

    if (!startNode || !endNode) return null;
    var range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  }

  function renderHighlights() {
    if (window.CSS && CSS.highlights && window.Highlight) {
      clearFallbackHighlights();
      CSS.highlights.delete("prd-annotations");
      CSS.highlights.delete("prd-annotation-active");
      var ranges = Object.keys(state.rangeById).map(function (id) {
        return state.rangeById[id];
      });
      if (ranges.length) {
        CSS.highlights.set("prd-annotations", new Highlight(...ranges));
      }
      if (state.activeId && state.rangeById[state.activeId]) {
        CSS.highlights.set("prd-annotation-active", new Highlight(state.rangeById[state.activeId]));
      }
      return;
    }

    clearFallbackHighlights();
    refreshAnchors();
    state.items.forEach(function (item) {
      var range = state.rangeById[item.id];
      if (range) applyFallbackHighlight(range, item.id, item.id === state.activeId);
    });
  }

  function applyFallbackHighlight(range, id, active) {
    var root = document.getElementById(findItem(id).rootId);
    if (!root) return;

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var targets = [];
    var node;
    while ((node = walker.nextNode())) {
      try {
        if (!range.intersectsNode(node)) continue;
      } catch (error) {
        continue;
      }
      var start = node === range.startContainer ? range.startOffset : 0;
      var end = node === range.endContainer ? range.endOffset : node.nodeValue.length;
      if (end > start) targets.push({ node: node, start: start, end: end });
    }

    targets.reverse().forEach(function (target) {
      var part = document.createRange();
      part.setStart(target.node, target.start);
      part.setEnd(target.node, target.end);
      var mark = document.createElement("mark");
      mark.className = "prd-annotation-highlight" + (active ? " is-active" : "");
      mark.setAttribute("data-annotation-id", id);
      part.surroundContents(mark);
    });
  }

  function clearFallbackHighlights() {
    Array.prototype.forEach.call(document.querySelectorAll("mark.prd-annotation-highlight"), function (mark) {
      var parent = mark.parentNode;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    });
  }

  function sectionLabel(rootId) {
    var root = document.getElementById(rootId);
    return root && root.getAttribute("data-section")
      ? root.getAttribute("data-section")
      : rootId;
  }

  function findItem(id) {
    return state.items.find(function (item) { return item.id === id; });
  }

  function compareByDocumentOrder(a, b) {
    var roots = Array.prototype.slice.call(main.querySelectorAll(".doc-section[id]"));
    var aRoot = roots.findIndex(function (root) { return root.id === a.rootId; });
    var bRoot = roots.findIndex(function (root) { return root.id === b.rootId; });
    return aRoot - bRoot || a.start - b.start || a.createdAt.localeCompare(b.createdAt);
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "annotation-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  function formatTime(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "未知时间";
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function normalizeItem(raw) {
    if (!raw || typeof raw !== "object") return null;
    if (
      typeof raw.id !== "string" ||
      typeof raw.rootId !== "string" ||
      typeof raw.quote !== "string" ||
      typeof raw.note !== "string" ||
      !Number.isInteger(raw.start) ||
      !Number.isInteger(raw.end)
    ) {
      return null;
    }
    return {
      id: raw.id,
      rootId: raw.rootId,
      start: raw.start,
      end: raw.end,
      quote: raw.quote,
      prefix: typeof raw.prefix === "string" ? raw.prefix : "",
      suffix: typeof raw.suffix === "string" ? raw.suffix : "",
      note: raw.note,
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString()
    };
  }

  function loadAnnotations() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        state.items = [];
        state.storageAvailable = true;
        return;
      }
      var parsed = JSON.parse(raw);
      var list = Array.isArray(parsed) ? parsed : parsed.annotations;
      state.items = Array.isArray(list)
        ? list.map(normalizeItem).filter(Boolean).sort(compareByDocumentOrder)
        : [];
      state.storageAvailable = true;
    } catch (error) {
      state.storageAvailable = false;
    }
  }

  function persistAnnotations() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        schemaVersion: 1,
        documentId: DOCUMENT_ID,
        updatedAt: new Date().toISOString(),
        annotations: state.items
      }));
      state.storageAvailable = true;
    } catch (error) {
      state.storageAvailable = false;
      renderStorageState();
      showToast("本地保存失败，请及时导出批注", true);
    }
  }

  function exportAnnotations() {
    if (!state.items.length) return;
    var payload = {
      schemaVersion: 1,
      documentId: DOCUMENT_ID,
      exportedAt: new Date().toISOString(),
      annotations: state.items
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "设备位置管理-PRD批注-" + dateStamp() + ".json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("批注 JSON 已导出");
  }

  function importAnnotations(event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result || ""));
        if (parsed.documentId && parsed.documentId !== DOCUMENT_ID) {
          throw new Error("该文件不属于当前 PRD");
        }
        if (!Array.isArray(parsed.annotations)) {
          throw new Error("批注文件格式不正确");
        }
        var imported = parsed.annotations.map(normalizeItem).filter(Boolean);
        if (!imported.length && parsed.annotations.length) {
          throw new Error("没有可读取的批注");
        }

        var byId = {};
        state.items.forEach(function (item) { byId[item.id] = item; });
        imported.forEach(function (item) { byId[item.id] = item; });
        state.items = Object.keys(byId).map(function (id) { return byId[id]; });
        state.items.sort(compareByDocumentOrder);
        persistAnnotations();
        refreshAnchors();
        render();
        showToast("已导入 " + imported.length + " 条批注");
      } catch (error) {
        showToast(error.message || "批注导入失败", true);
      }
    };
    reader.onerror = function () {
      showToast("无法读取批注文件", true);
    };
    reader.readAsText(file, "utf-8");
  }

  function dateStamp() {
    var date = new Date();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return String(date.getFullYear()) + month + day;
  }

  function showToast(message, error) {
    window.clearTimeout(state.toastTimer);
    ui.toast.textContent = message;
    ui.toast.classList.toggle("is-error", Boolean(error));
    ui.toast.classList.add("visible");
    state.toastTimer = window.setTimeout(function () {
      ui.toast.classList.remove("visible");
    }, 2400);
  }
})();
