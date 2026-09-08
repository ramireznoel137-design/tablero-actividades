(function () {
  "use strict";

  const STORAGE_KEY = "ccima-tablero-actividades-v1";
  const STATUSES = ["pendiente", "haciendo", "hecho"];
  const IMPORTANCE_LEVELS = {
    baja: "Baja",
    media: "Media",
    alta: "Alta",
    critica: "Crítica",
  };
  const COLOR_KEYS = ["primary", "pending", "doing", "done", "recurring", "danger"];
  const COLOR_PRESETS = ["focus", "ocean", "forest", "sunset", "custom"];
  const DEFAULT_CUSTOM_COLORS = {
    primary: "#245FBE",
    pending: "#B96808",
    doing: "#2368C4",
    done: "#177245",
    recurring: "#7042B5",
    danger: "#C92A38",
  };

  const elements = {
    navbar: document.querySelector(".app-navbar"),
    boardLayout: document.querySelector(".board-layout"),
    recurringPanel: document.getElementById("recurringPanel"),
    hideRecurringButton: document.getElementById("hideRecurringBtn"),
    showRecurringButton: document.getElementById("showRecurringBtn"),
    recurringCount: document.getElementById("count-recurrentes"),
    recurringRevealCount: document.getElementById("recurringRevealCount"),
    completedPanel: document.getElementById("col-hecho"),
    hideCompletedButton: document.getElementById("hideCompletedBtn"),
    showCompletedButton: document.getElementById("showCompletedBtn"),
    completedRevealCount: document.getElementById("completedRevealCount"),
    collapsedSectionsRail: document.getElementById("collapsedSectionsRail"),
    themeButton: document.getElementById("themeToggleBtn"),
    themeLabel: document.getElementById("themeLabel"),
    taskForm: document.getElementById("taskForm"),
    taskModalTitle: document.getElementById("taskModalTitle"),
    taskTitle: document.getElementById("taskTitle"),
    taskImportance: document.getElementById("taskImportance"),
    taskStatus: document.getElementById("taskStatus"),
    taskNotes: document.getElementById("taskNotes"),
    taskStart: document.getElementById("taskStart"),
    taskDue: document.getElementById("taskDue"),
    taskActualDelivery: document.getElementById("taskActualDelivery"),
    actualDeliveryHint: document.getElementById("actualDeliveryHint"),
    taskTimeSpent: document.getElementById("taskTimeSpent"),
    workScheduleHint: document.getElementById("workScheduleHint"),
    taskRecurrente: document.getElementById("taskRecurrente"),
    settingsForm: document.getElementById("settingsForm"),
    workdayStart: document.getElementById("workdayStart"),
    workdayEnd: document.getElementById("workdayEnd"),
    settingsThemeMode: document.getElementById("settingsThemeMode"),
    colorPreset: document.getElementById("colorPreset"),
    customPaletteFields: document.getElementById("customPaletteFields"),
    importDataInput: document.getElementById("importDataInput"),
    recForm: document.getElementById("recForm"),
    recTitle: document.getElementById("recTitle"),
    recFreq: document.getElementById("recFreq"),
    quickAddInput: document.getElementById("quickAddInput"),
    historyContent: document.getElementById("historyContent"),
    kpiStrip: document.getElementById("kpiStrip"),
    kpiModalTitle: document.getElementById("kpiModalTitle"),
    kpiModalNote: document.getElementById("kpiModalNote"),
    confirmTitle: document.getElementById("confirmModalTitle"),
    confirmMessage: document.getElementById("confirmModalMessage"),
    confirmButton: document.getElementById("confirmActionBtn"),
    toast: document.getElementById("appToast"),
    toastMessage: document.getElementById("toastMessage"),
  };

  const modals = {
    task: new bootstrap.Modal(document.getElementById("taskModal")),
    recurrent: new bootstrap.Modal(document.getElementById("recModal")),
    kpi: new bootstrap.Modal(document.getElementById("kpiModal")),
    history: new bootstrap.Modal(document.getElementById("historyModal")),
    settings: new bootstrap.Modal(document.getElementById("settingsModal")),
    confirm: new bootstrap.Modal(document.getElementById("confirmModal")),
  };
  const toast = new bootstrap.Toast(elements.toast, { delay: 2800 });

  let state = loadState();
  let editingTaskId = null;
  let tickHandle = null;
  let pendingConfirmation = null;
  const expandedTaskIds = new Set();

  function syncNavbarHeight() {
    const height = Math.ceil(elements.navbar.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--navbar-height", `${height}px`);
  }

  function createId() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return `id-${window.crypto.randomUUID()}`;
      }
    } catch (error) {
      console.warn("Se usará el generador de identificadores compatible.", error);
    }
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function isoDate(offsetDays) {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    return dateToIso(target);
  }

  function dateToIso(value) {
    const target = new Date(value);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, "0");
    const day = String(target.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function createSeedState() {
    return {
      theme: "dark",
      settings: createDefaultSettings(),
      tasks: [
        {
          id: createId(),
          title: "Seguimiento Hito I – Odoo/OPUS con BELMEN",
          importance: "alta",
          status: "haciendo",
          notes: "Revisar recalibración tras el retraso de ~14 días.",
          startDate: isoDate(0),
          dueDate: isoDate(2),
          actualDeliveryDate: null,
          recurrente: false,
          timeSpent: 0,
          runningSince: null,
          completedAt: null,
        },
        {
          id: createId(),
          title: "Revisar avance del plan REV",
          importance: "critica",
          status: "pendiente",
          notes: "Validar con Pascual el estatus del formulario REV.",
          startDate: null,
          dueDate: isoDate(-1),
          actualDeliveryDate: null,
          recurrente: false,
          timeSpent: 0,
          runningSince: null,
          completedAt: null,
        },
        {
          id: createId(),
          title: "Actualizar roadmap de Políticas TI",
          importance: "media",
          status: "pendiente",
          notes: "19 políticas basadas en COBIT/ITIL.",
          startDate: null,
          dueDate: isoDate(10),
          actualDeliveryDate: null,
          recurrente: false,
          timeSpent: 0,
          runningSince: null,
          completedAt: null,
        },
        {
          id: createId(),
          title: "Preparar diagnóstico cumplimiento ATDT",
          importance: "baja",
          status: "pendiente",
          notes: "",
          startDate: null,
          dueDate: null,
          actualDeliveryDate: null,
          recurrente: false,
          timeSpent: 0,
          runningSince: null,
          completedAt: null,
        },
      ],
      recurrentes: [
        { id: createId(), title: "Minuta reunión con BELMEN", freq: "Cada reunión con el proveedor" },
        { id: createId(), title: "Reporte semanal de actividades TI", freq: "Semanal" },
        { id: createId(), title: "Revisión plan de requerimientos Comercial", freq: "Quincenal" },
      ],
      history: [],
    };
  }

  function createDefaultSettings() {
    return {
      workdayStart: "08:00",
      workdayEnd: "17:30",
      colorPreset: "focus",
      customColors: { ...DEFAULT_CUSTOM_COLORS },
      recurringCollapsed: false,
      completedCollapsed: false,
    };
  }

  function isValidHex(value) {
    return /^#[0-9A-F]{6}$/i.test(String(value || "").trim());
  }

  function normalizeSettings(settings = {}) {
    const defaults = createDefaultSettings();
    const start = /^\d{2}:\d{2}$/.test(settings.workdayStart || "") ? settings.workdayStart : defaults.workdayStart;
    const end = /^\d{2}:\d{2}$/.test(settings.workdayEnd || "") ? settings.workdayEnd : defaults.workdayEnd;
    const customColors = {};
    COLOR_KEYS.forEach((key) => {
      const candidate = settings.customColors && settings.customColors[key];
      customColors[key] = isValidHex(candidate) ? candidate.toUpperCase() : defaults.customColors[key];
    });
    return {
      workdayStart: timeToMinutes(end) > timeToMinutes(start) ? start : defaults.workdayStart,
      workdayEnd: timeToMinutes(end) > timeToMinutes(start) ? end : defaults.workdayEnd,
      colorPreset: COLOR_PRESETS.includes(settings.colorPreset) ? settings.colorPreset : defaults.colorPreset,
      customColors,
      recurringCollapsed: Boolean(settings.recurringCollapsed),
      completedCollapsed: Boolean(settings.completedCollapsed),
    };
  }

  function normalizeTask(task) {
    const migratedNotes = task.due
      ? `${task.notes ? `${task.notes} ` : ""}[Fecha anterior: ${task.due}]`
      : task.notes || "";
    const startDate = task.startDate || null;
    const storedStatus = STATUSES.includes(task.status) ? task.status : "pendiente";
    const actualCandidate = /^\d{4}-\d{2}-\d{2}$/.test(task.actualDeliveryDate || "")
      ? task.actualDeliveryDate
      : null;
    const providedActualDelivery = actualCandidate
      && actualCandidate <= isoDate(0)
      && (!startDate || actualCandidate >= startDate)
      ? actualCandidate
      : null;
    const status = providedActualDelivery ? "hecho" : storedStatus;
    const completedAt = Number(task.completedAt) || (status === "hecho" ? Date.now() : null);
    const migratedActualDelivery = status === "hecho"
      ? providedActualDelivery || [dateToIso(completedAt), isoDate(0)].sort()[0]
      : null;
    return {
      id: task.id || createId(),
      title: String(task.title || "Sin título"),
      importance: Object.hasOwn(IMPORTANCE_LEVELS, task.importance) ? task.importance : "media",
      status,
      notes: migratedNotes,
      startDate,
      dueDate: task.dueDate || null,
      actualDeliveryDate: migratedActualDelivery,
      recurrente: Boolean(task.recurrente),
      timeSpent: Math.max(0, Number(task.timeSpent) || 0),
      runningSince: Number(task.runningSince) || null,
      completedAt,
    };
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return createSeedState();
      const parsed = JSON.parse(saved);
      return normalizeState(parsed);
    } catch (error) {
      console.error("No se pudieron cargar los datos locales:", error);
      return createSeedState();
    }
  }

  function normalizeState(parsed) {
    return {
        theme: parsed.theme === "light" ? "light" : "dark",
        settings: normalizeSettings(parsed.settings),
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map(normalizeTask) : [],
        recurrentes: Array.isArray(parsed.recurrentes)
          ? parsed.recurrentes.map((item) => ({
              id: item.id || createId(),
              title: String(item.title || "Sin título"),
              freq: String(item.freq || ""),
            }))
          : [],
        history: Array.isArray(parsed.history) ? parsed.history.map(normalizeTask) : [],
      };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("No se pudieron guardar los datos locales:", error);
      showToast("No fue posible guardar los cambios en este navegador.", true);
    }
  }

  function showToast(message, isError = false) {
    elements.toastMessage.textContent = message;
    elements.toast.classList.toggle("is-error", isError);
    toast.show();
  }

  function requestConfirmation({
    title = "Confirmar acción",
    message,
    confirmLabel = "Eliminar",
    confirmClass = "btn-danger",
    onConfirm,
  }) {
    pendingConfirmation = onConfirm;
    elements.confirmTitle.textContent = title;
    elements.confirmMessage.textContent = message;
    elements.confirmButton.textContent = confirmLabel;
    elements.confirmButton.className = `btn ${confirmClass}`;

    const visibleModal = document.querySelector(".modal.show:not(#confirmModal)");
    if (visibleModal) {
      visibleModal.addEventListener("hidden.bs.modal", () => modals.confirm.show(), { once: true });
      bootstrap.Modal.getOrCreateInstance(visibleModal).hide();
      return;
    }
    modals.confirm.show();
  }

  function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = String(value ?? "");
    return element.innerHTML;
  }

  function noteItemsFromText(value) {
    return String(value || "")
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/^[•●▪◦*\-]\s*/, "").trim())
      .filter(Boolean);
  }

  function notesToEditorValue(value) {
    return noteItemsFromText(value).map((item) => `• ${item}`).join("\n");
  }

  function applyTheme() {
    const isLight = state.theme === "light";
    document.documentElement.setAttribute("data-bs-theme", isLight ? "light" : "dark");
    elements.themeButton.classList.toggle("is-light", isLight);
    elements.themeButton.setAttribute("aria-checked", String(!isLight));
    elements.themeLabel.textContent = isLight ? "Modo claro" : "Modo oscuro";
    applyColorSettings();
  }

  function applyColorSettings() {
    const root = document.documentElement;
    const preset = state.settings.colorPreset;
    root.setAttribute("data-color-theme", preset);

    const properties = [
      "--primary", "--primary-hover", "--primary-soft", "--pending", "--doing",
      "--done", "--recurring", "--danger", "--importance-medium",
      "--importance-high", "--importance-critical", "--focus-ring",
    ];
    properties.forEach((property) => root.style.removeProperty(property));
    if (preset !== "custom") return;

    const colors = state.settings.customColors;
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-hover", `color-mix(in srgb, ${colors.primary} 82%, #000)`);
    root.style.setProperty("--primary-soft", `color-mix(in srgb, ${colors.primary} 18%, var(--surface))`);
    root.style.setProperty("--focus-ring", `color-mix(in srgb, ${colors.primary} 28%, transparent)`);
    root.style.setProperty("--pending", colors.pending);
    root.style.setProperty("--doing", colors.doing);
    root.style.setProperty("--done", colors.done);
    root.style.setProperty("--recurring", colors.recurring);
    root.style.setProperty("--danger", colors.danger);
    root.style.setProperty("--importance-medium", colors.done);
    root.style.setProperty("--importance-high", colors.pending);
    root.style.setProperty("--importance-critical", colors.danger);
  }

  function applyRecurringPanelState() {
    const collapsed = state.settings.recurringCollapsed;
    elements.boardLayout.classList.toggle("recurring-collapsed", collapsed);
    elements.recurringPanel.hidden = collapsed;
    elements.hideRecurringButton.setAttribute("aria-expanded", String(!collapsed));
    elements.showRecurringButton.hidden = !collapsed;
    elements.showRecurringButton.setAttribute("aria-expanded", String(!collapsed));
    updateCollapsedSectionsRail();
  }

  function setRecurringPanelCollapsed(collapsed) {
    state.settings.recurringCollapsed = collapsed;
    saveState();
    applyRecurringPanelState();
  }

  function applyCompletedPanelState() {
    const collapsed = state.settings.completedCollapsed;
    elements.boardLayout.classList.toggle("completed-collapsed", collapsed);
    elements.completedPanel.hidden = collapsed;
    elements.hideCompletedButton.setAttribute("aria-expanded", String(!collapsed));
    elements.showCompletedButton.hidden = !collapsed;
    elements.showCompletedButton.setAttribute("aria-expanded", String(!collapsed));
    updateCollapsedSectionsRail();
  }

  function updateCollapsedSectionsRail() {
    elements.collapsedSectionsRail.hidden = !(
      state.settings.recurringCollapsed || state.settings.completedCollapsed
    );
  }

  function setCompletedPanelCollapsed(collapsed) {
    state.settings.completedCollapsed = collapsed;
    saveState();
    applyCompletedPanelState();
  }

  function timeToMinutes(value) {
    const [hours, minutes] = String(value || "").split(":").map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return Number.NaN;
    return hours * 60 + minutes;
  }

  function formatWorkSchedule() {
    return `${state.settings.workdayStart} a ${state.settings.workdayEnd}`;
  }

  function currentSeconds(task) {
    const elapsed = task.runningSince ? currentSessionSeconds(task.runningSince) : 0;
    return (task.timeSpent || 0) + elapsed;
  }

  function workWindowFor(timestamp) {
    const source = new Date(timestamp);
    const start = new Date(source);
    const end = new Date(source);
    const [startHour, startMinute] = state.settings.workdayStart.split(":").map(Number);
    const [endHour, endMinute] = state.settings.workdayEnd.split(":").map(Number);
    start.setHours(startHour, startMinute, 0, 0);
    end.setHours(endHour, endMinute, 0, 0);
    return { start: start.getTime(), end: end.getTime() };
  }

  function isWorkingDay(timestamp) {
    const day = new Date(timestamp).getDay();
    return day >= 1 && day <= 5;
  }

  function isWithinWorkSchedule(timestamp = Date.now()) {
    if (!isWorkingDay(timestamp)) return false;
    const { start, end } = workWindowFor(timestamp);
    return timestamp >= start && timestamp < end;
  }

  function currentSessionSeconds(runningSince, now = Date.now()) {
    if (!isWorkingDay(runningSince)) return 0;
    const { start, end } = workWindowFor(runningSince);
    const effectiveStart = Math.max(runningSince, start);
    const effectiveEnd = Math.min(now, end);
    return Math.max(0, Math.floor((effectiveEnd - effectiveStart) / 1000));
  }

  function sessionReachedLimit(task, now = Date.now()) {
    if (!task.runningSince) return false;
    const { end } = workWindowFor(task.runningSince);
    return !isWorkingDay(task.runningSince) || now >= end;
  }

  function settleExpiredTimers() {
    let changed = false;
    state.tasks.forEach((task) => {
      if (!sessionReachedLimit(task)) return;
      task.timeSpent = currentSeconds(task);
      task.runningSince = null;
      changed = true;
    });
    return changed;
  }

  function formatTime(totalSeconds) {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
    if (safeSeconds < 60) return `${safeSeconds}s`;
    const totalMinutes = Math.floor(safeSeconds / 60);
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hours = Math.floor(totalMinutes / 60);
    return `${hours}h ${totalMinutes % 60}m`;
  }

  function formatHours(seconds) {
    return `${(seconds / 3600).toFixed(1)} h`;
  }

  function setTaskStatus(task, nextStatus) {
    const wasDone = task.status === "hecho";
    const isDone = nextStatus === "hecho";
    task.status = nextStatus;
    if (isDone) {
      if (!task.actualDeliveryDate) task.actualDeliveryDate = isoDate(0);
      if (!wasDone) {
        task.completedAt = Date.now();
        if (task.runningSince) {
          task.timeSpent = currentSeconds(task);
          task.runningSince = null;
        }
      }
    } else {
      task.actualDeliveryDate = null;
      if (wasDone) task.completedAt = null;
    }
  }

  function toggleTimer(taskId) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return;
    if (task.runningSince) {
      task.timeSpent = currentSeconds(task);
      task.runningSince = null;
    } else {
      if (!isWithinWorkSchedule()) {
        showToast(`El temporizador solo puede iniciarse de lunes a viernes, de ${formatWorkSchedule()}.`, true);
        return;
      }
      state.tasks.forEach((item) => {
        if (item.runningSince) {
          item.timeSpent = currentSeconds(item);
          item.runningSince = null;
        }
      });
      task.runningSince = Date.now();
    }
    saveState();
    renderColumns();
  }

  function ensureTimerUpdates() {
    if (tickHandle) return;
    tickHandle = window.setInterval(() => {
      let timerStopped = false;
      state.tasks.filter((task) => task.runningSince).forEach((task) => {
        const display = document.querySelector(`.timer-display[data-id="${CSS.escape(task.id)}"]`);
        if (display) display.textContent = formatTime(currentSeconds(task));
        if (sessionReachedLimit(task)) {
          task.timeSpent = currentSeconds(task);
          task.runningSince = null;
          timerStopped = true;
        }
      });
      if (timerStopped) {
        saveState();
        renderColumns();
        showToast(`El temporizador se detuvo automáticamente a las ${state.settings.workdayEnd}.`);
      }
    }, 1000);
  }

  function startOfWeek(timestamp) {
    const value = new Date(timestamp);
    const daysSinceMonday = (value.getDay() + 6) % 7;
    value.setHours(0, 0, 0, 0);
    value.setDate(value.getDate() - daysSinceMonday);
    return value.getTime();
  }

  function todayStart() {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value.getTime();
  }

  function dueTimestamp(task) {
    return task.dueDate ? new Date(`${task.dueDate}T00:00:00`).getTime() : null;
  }

  function actualDeliveryTimestamp(task) {
    if (task.actualDeliveryDate) return new Date(`${task.actualDeliveryDate}T00:00:00`).getTime();
    return task.completedAt || null;
  }

  function isOverdue(task) {
    const due = dueTimestamp(task);
    return task.status !== "hecho" && due !== null && due < todayStart();
  }

  function dueInfo(task) {
    const due = dueTimestamp(task);
    if (due === null) return null;
    if (task.status === "hecho") return { label: formatShortDate(due), className: "" };
    const difference = Math.round((due - todayStart()) / 86400000);
    if (difference < 0) return { label: `Venció hace ${Math.abs(difference)}d`, className: "due-overdue" };
    if (difference === 0) return { label: "Vence hoy", className: "due-today" };
    if (difference <= 3) return { label: `Vence en ${difference}d`, className: "due-soon" };
    return { label: formatShortDate(due), className: "" };
  }

  function startInfo(task) {
    if (!task.startDate) return null;
    return `Inicia ${formatShortDate(new Date(`${task.startDate}T00:00:00`).getTime())}`;
  }

  function actualDeliveryInfo(task) {
    if (!task.actualDeliveryDate) return null;
    return `Entrega real ${formatShortDate(new Date(`${task.actualDeliveryDate}T00:00:00`).getTime())}`;
  }

  function formatShortDate(timestamp) {
    const value = new Date(timestamp);
    return `${String(value.getDate()).padStart(2, "0")}/${String(value.getMonth() + 1).padStart(2, "0")}`;
  }

  function formatWeekRange(weekStart) {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    return `Semana del ${formatShortDate(weekStart)} al ${formatShortDate(end.getTime())}`;
  }

  function archiveOldDone() {
    const currentWeek = startOfWeek(Date.now());
    const activeTasks = [];
    let changed = false;
    state.tasks.forEach((task) => {
      if (task.status === "hecho" && task.completedAt && startOfWeek(task.completedAt) < currentWeek) {
        state.history.push({ ...task });
        changed = true;
      } else {
        activeTasks.push(task);
      }
    });
    if (changed) {
      state.tasks = activeTasks;
      saveState();
    }
  }

  function buildHistoryGroups() {
    const entries = state.history;
    const groups = new Map();
    entries.forEach((task) => {
      const weekStart = startOfWeek(task.completedAt || Date.now());
      if (!groups.has(weekStart)) groups.set(weekStart, { total: 0, items: [] });
      const group = groups.get(weekStart);
      group.total += task.timeSpent || 0;
      group.items.push(task);
    });
    return Array.from(groups.entries())
      .sort(([left], [right]) => right - left)
      .map(([weekStart, group]) => ({
        weekStart,
        total: group.total,
        items: group.items.sort((left, right) => (right.completedAt || 0) - (left.completedAt || 0)),
      }));
  }

  function computeKpis() {
    const weekStart = startOfWeek(Date.now());
    const openTasks = state.tasks.filter((task) => task.status !== "hecho");
    const completed = state.tasks.filter((task) => task.status === "hecho").length;
    const completedThisWeek = state.tasks
      .filter((task) => task.status === "hecho" && task.completedAt && startOfWeek(task.completedAt) === weekStart)
      .concat(state.history.filter((task) => task.completedAt && startOfWeek(task.completedAt) === weekStart));
    const allCompleted = state.tasks.filter((task) => task.status === "hecho").concat(state.history);
    const completedWithDueDate = allCompleted.filter((task) => task.dueDate && actualDeliveryTimestamp(task));
    const completedOnTime = completedWithDueDate.filter((task) => actualDeliveryTimestamp(task) <= dueTimestamp(task) + 86399999);
    const timed = allCompleted.filter((task) => task.timeSpent > 0);
    const nextThreeDays = todayStart() + 3 * 86400000;
    const overdue = openTasks.filter(isOverdue).length;
    const critical = openTasks.filter((task) => task.importance === "critica").length;
    const high = openTasks.filter((task) => task.importance === "alta").length;
    const medium = openTasks.filter((task) => task.importance === "media").length;
    const low = openTasks.filter((task) => task.importance === "baja").length;
    const requiresAttention = openTasks.filter((task) => isOverdue(task) || task.importance === "critica").length;

    return {
      total: state.tasks.length,
      pending: state.tasks.filter((task) => task.status === "pendiente").length,
      doing: state.tasks.filter((task) => task.status === "haciendo").length,
      completed,
      completionRate: state.tasks.length ? Math.round((completed / state.tasks.length) * 100) : 0,
      completedThisWeek: completedThisWeek.length,
      weeklySeconds: completedThisWeek.reduce((sum, task) => sum + (task.timeSpent || 0), 0),
      overdue,
      critical,
      high,
      medium,
      low,
      requiresAttention,
      running: state.tasks.filter((task) => task.runningSince).length,
      dueSoon: openTasks.filter((task) => {
        const due = dueTimestamp(task);
        return due !== null && due >= todayStart() && due <= nextThreeDays;
      }).length,
      onTimePercentage: completedWithDueDate.length
        ? Math.round((completedOnTime.length / completedWithDueDate.length) * 100)
        : null,
      averageSeconds: timed.length
        ? Math.round(timed.reduce((sum, task) => sum + task.timeSpent, 0) / timed.length)
        : null,
    };
  }

  function renderKpis() {
    const kpi = computeKpis();
    elements.kpiModalTitle.textContent = "Indicadores";
    elements.kpiModalNote.hidden = false;
    const card = ([value, label, accent]) => `
      <article class="kpi-card" style="--kpi-accent:${accent}">
        <div class="kpi-label">${label}</div>
        <div class="kpi-value">${value}</div>
      </article>
    `;
    const statusCards = [
      [kpi.total, "Actividades en tablero", "var(--text-muted)", "all"],
      [kpi.pending, "Pendientes", "var(--pending)", "pendiente"],
      [kpi.doing, "En curso", "var(--doing)", "haciendo"],
      [kpi.completed, "Completadas visibles", "var(--done)", "hecho"],
    ];
    const filterCard = ([value, label, accent, filter]) => `
      <button class="kpi-card kpi-filter-card" type="button" style="--kpi-accent:${accent}" data-kpi-filter="${filter}" data-filter-label="${label}" aria-label="Ver actividades: ${label}">
        <span class="kpi-label d-block">${label}</span>
        <span class="kpi-value d-block">${value}</span>
        <span class="kpi-card-hint">Ver actividades</span>
      </button>
    `;
    const priorityCards = [
      [kpi.critical, "Importancia crítica", "var(--danger)", "critica"],
      [kpi.high, "Importancia alta", "var(--importance-high)", "alta"],
      [kpi.medium, "Importancia media", "var(--importance-medium)", "media"],
      [kpi.low, "Importancia baja", "var(--importance-low)", "baja"],
      [kpi.overdue, "Vencidas", "var(--danger)", "overdue"],
      [kpi.dueSoon, "Vencen en ≤3 días", "var(--pending)", "due-soon"],
    ];
    const productivityCards = [
      [kpi.completedThisWeek, "Completadas esta semana", "var(--done)"],
      [formatHours(kpi.weeklySeconds), "Horas esta semana", "var(--recurring)"],
      [kpi.running, "Temporizadores activos", "var(--doing)"],
      [kpi.onTimePercentage === null ? "—" : `${kpi.onTimePercentage}%`, "Cumplimiento a tiempo", "var(--done)"],
      [kpi.averageSeconds ? formatHours(kpi.averageSeconds) : "—", "Tiempo promedio", "var(--text-muted)"],
    ];
    const attentionCopy = kpi.requiresAttention
      ? `${kpi.critical} crítica${kpi.critical === 1 ? "" : "s"} y ${kpi.overdue} vencida${kpi.overdue === 1 ? "" : "s"}.`
      : "No hay actividades críticas ni vencidas.";

    elements.kpiStrip.innerHTML = `
      <div class="kpi-hero-grid">
        <section class="kpi-progress-panel">
          <div class="kpi-panel-label">Avance del tablero</div>
          <div class="kpi-progress-value">${kpi.completionRate}%</div>
          <div class="progress kpi-progress" role="progressbar" aria-label="Avance del tablero" aria-valuenow="${kpi.completionRate}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar" style="width:${kpi.completionRate}%"></div>
          </div>
          <div class="kpi-progress-caption">${kpi.completed} de ${kpi.total} actividades visibles están completadas.</div>
        </section>
        <section class="kpi-attention-panel">
          <div class="kpi-panel-label">Requieren atención</div>
          <div class="kpi-attention-value">${kpi.requiresAttention}</div>
          <p class="kpi-attention-copy">${attentionCopy}</p>
        </section>
      </div>
      <section class="kpi-section">
        <h3 class="kpi-section-title">Estado actual</h3>
        <div class="kpi-grid">${statusCards.map(filterCard).join("")}</div>
      </section>
      <section class="kpi-section">
        <h3 class="kpi-section-title">Prioridad y fechas</h3>
        <div class="kpi-grid">${priorityCards.map(filterCard).join("")}</div>
      </section>
      <section class="kpi-section">
        <h3 class="kpi-section-title">Rendimiento semanal</h3>
        <div class="kpi-grid">${productivityCards.map(card).join("")}</div>
      </section>
    `;
    elements.kpiStrip.querySelectorAll("[data-kpi-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        renderKpiFilteredDetails(button.dataset.kpiFilter, button.dataset.filterLabel, button.style.getPropertyValue("--kpi-accent"));
      });
    });
  }

  function renderKpiFilteredDetails(filter, label, accent) {
    const openTasks = state.tasks.filter((task) => task.status !== "hecho");
    const filters = {
      all: () => state.tasks,
      pendiente: () => state.tasks.filter((task) => task.status === "pendiente"),
      haciendo: () => state.tasks.filter((task) => task.status === "haciendo"),
      hecho: () => state.tasks.filter((task) => task.status === "hecho"),
      critica: () => openTasks.filter((task) => task.importance === "critica"),
      alta: () => openTasks.filter((task) => task.importance === "alta"),
      media: () => openTasks.filter((task) => task.importance === "media"),
      baja: () => openTasks.filter((task) => task.importance === "baja"),
      overdue: () => openTasks.filter(isOverdue),
      "due-soon": () => {
        const nextThreeDays = todayStart() + 3 * 86400000;
        return openTasks.filter((task) => {
          const due = dueTimestamp(task);
          return due !== null && due >= todayStart() && due <= nextThreeDays;
        });
      },
    };
    const activities = Object.hasOwn(filters, filter) ? filters[filter]() : [];
    const statusAccents = {
      pendiente: "var(--pending)",
      haciendo: "var(--doing)",
      hecho: "var(--done)",
    };
    elements.kpiModalTitle.textContent = label;
    elements.kpiModalNote.hidden = true;
    elements.kpiStrip.innerHTML = `
      <div class="kpi-detail-head">
        <button class="btn btn-soft btn-sm" id="backToKpisBtn" type="button">← Volver a indicadores</button>
        <span class="kpi-detail-count">${activities.length} actividad${activities.length === 1 ? "" : "es"}</span>
      </div>
      ${activities.length ? `
        <div class="kpi-detail-grid">
          ${activities.map((task) => `
            <button class="kpi-task-title-card" type="button" data-focus-task-id="${escapeHtml(task.id)}" style="--kpi-accent:${filter === "all" ? statusAccents[task.status] : accent}" aria-label="Ir a la actividad ${escapeHtml(task.title)}">
              <span class="kpi-task-title">${escapeHtml(task.title)}</span>
              <span class="importance-badge importance-${task.importance}">${IMPORTANCE_LEVELS[task.importance]}</span>
            </button>
          `).join("")}
        </div>
      ` : '<div class="empty-hint">No hay actividades en este estado.</div>'}
    `;
    document.getElementById("backToKpisBtn").addEventListener("click", renderKpis);
    elements.kpiStrip.querySelectorAll("[data-focus-task-id]").forEach((button) => {
      button.addEventListener("click", () => focusTaskFromIndicators(button.dataset.focusTaskId));
    });
  }

  function focusTaskFromIndicators(taskId) {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) {
      showToast("La actividad ya no está disponible en el tablero.", true);
      return;
    }
    expandedTaskIds.add(task.id);
    if (task.status === "hecho" && state.settings.completedCollapsed) {
      state.settings.completedCollapsed = false;
      saveState();
      applyCompletedPanelState();
    }
    renderColumns();

    const revealTask = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const card = Array.from(document.querySelectorAll(".board-column .task-card"))
            .find((item) => item.dataset.id === task.id);
          if (!card) return;
          card.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          card.focus({ preventScroll: true });
          card.classList.remove("task-focus-highlight");
          void card.offsetWidth;
          card.classList.add("task-focus-highlight");
          window.setTimeout(() => card.classList.remove("task-focus-highlight"), 2400);
        });
      });
    };

    const modalElement = document.getElementById("kpiModal");
    modalElement.addEventListener("hidden.bs.modal", revealTask, { once: true });
    modals.kpi.hide();
  }

  function renderHistory() {
    const groups = buildHistoryGroups();
    elements.historyContent.replaceChildren();
    if (!groups.length) {
      elements.historyContent.innerHTML = '<div class="empty-hint">Aún no hay actividades completadas</div>';
      return;
    }
    groups.forEach((group) => {
      const section = document.createElement("section");
      section.className = "history-week";
      section.innerHTML = `
        <div class="history-week-head">
          <span>${formatWeekRange(group.weekStart)}</span>
          <span class="history-week-total">${formatTime(group.total)} total</span>
        </div>
      `;
      const cards = document.createElement("div");
      cards.className = "history-week-cards";
      group.items.forEach((task) => cards.appendChild(createHistoryTaskCard(task)));
      section.appendChild(cards);
      elements.historyContent.appendChild(section);
    });
  }

  function createHistoryTaskCard(task) {
    const card = document.createElement("article");
    const due = dueInfo(task);
    const start = startInfo(task);
    const actualDelivery = actualDeliveryInfo(task);
    const expanded = expandedTaskIds.has(task.id);
    const noteItems = noteItemsFromText(task.notes);
    const notesMarkup = noteItems.length
      ? `<ul class="task-card-notes">${noteItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : '<div class="task-card-notes text-muted">Sin descripción</div>';
    card.className = `task-card history-task-card${expanded ? " expanded" : ""}`;
    card.tabIndex = 0;
    card.dataset.id = task.id;
    card.setAttribute("aria-expanded", String(expanded));
    card.innerHTML = `
      <div class="task-card-summary">
        <div class="task-card-title">${escapeHtml(task.title)}</div>
        <span class="importance-badge importance-${task.importance}">${IMPORTANCE_LEVELS[task.importance]}</span>
        <div class="task-card-actions">
          <button class="icon-button restore-task" type="button" title="Mostrar nuevamente en Completado" aria-label="Restaurar ${escapeHtml(task.title)} a Completado">
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M2 5.5h12v8H2zM1.5 2.5h13v3h-13zM8 11V7.5M6.5 9 8 7.5 9.5 9" />
            </svg>
          </button>
          <button class="icon-button delete-history-task" type="button" title="Eliminar definitivamente" aria-label="Eliminar definitivamente ${escapeHtml(task.title)}">&times;</button>
        </div>
      </div>
      <div class="task-card-details"${expanded ? "" : " hidden"}>
        ${task.recurrente ? '<span class="detail-recurring-badge">Recurrente</span>' : ""}
        ${notesMarkup}
        ${start || due || actualDelivery ? `<div class="task-meta d-flex flex-wrap gap-2">
          ${start ? `<span class="due-pill">▶ ${start}</span>` : ""}
          ${due ? `<span class="due-pill">📅 ${due.label}</span>` : ""}
          ${actualDelivery ? `<span class="due-pill actual-delivery-pill">✓ ${actualDelivery}</span>` : ""}
        </div>` : '<div class="task-meta"><span class="due-pill">Sin fechas registradas</span></div>'}
        <div class="history-time-detail">⏱ Tiempo registrado: ${formatTime(task.timeSpent || 0)}</div>
      </div>
    `;

    const toggleDetails = () => {
      const willExpand = !expandedTaskIds.has(task.id);
      if (willExpand) expandedTaskIds.add(task.id);
      else expandedTaskIds.delete(task.id);
      card.classList.toggle("expanded", willExpand);
      card.setAttribute("aria-expanded", String(willExpand));
      card.querySelector(".task-card-details").hidden = !willExpand;
    };
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      toggleDetails();
    });
    card.addEventListener("keydown", (event) => {
      if (event.target !== card || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      toggleDetails();
    });
    card.querySelector(".restore-task").addEventListener("click", () => {
      const historyIndex = state.history.findIndex((item) => item.id === task.id);
      if (historyIndex < 0) return;
      const [restoredTask] = state.history.splice(historyIndex, 1);
      restoredTask.status = "hecho";
      restoredTask.completedAt = Date.now();
      restoredTask.runningSince = null;
      if (!restoredTask.actualDeliveryDate) restoredTask.actualDeliveryDate = isoDate(0);
      state.tasks.unshift(restoredTask);
      expandedTaskIds.delete(restoredTask.id);
      saveState();
      renderAll();
      renderHistory();
      showToast("Actividad restaurada en Completado.");
    });
    card.querySelector(".delete-history-task").addEventListener("click", () => {
      requestConfirmation({
        title: "Eliminar actividad archivada",
        message: `¿Deseas eliminar definitivamente “${task.title}”? Esta acción no se puede deshacer.`,
        confirmLabel: "Eliminar definitivamente",
        confirmClass: "btn-danger",
        onConfirm: () => {
          state.history = state.history.filter((item) => item.id !== task.id);
          expandedTaskIds.delete(task.id);
          saveState();
          renderAll();
          renderHistory();
          showToast("Actividad eliminada definitivamente.");
        },
      });
    });
    return card;
  }

  function renderColumns() {
    STATUSES.forEach((status) => {
      const list = document.getElementById(`list-${status}`);
      const tasks = state.tasks.filter((task) => task.status === status);
      document.getElementById(`count-${status}`).textContent = tasks.length;
      if (status === "hecho") elements.completedRevealCount.textContent = tasks.length;
      list.replaceChildren();
      if (!tasks.length) {
        const hint = document.createElement("div");
        hint.className = "empty-hint";
        hint.textContent = "Sin actividades aquí";
        list.appendChild(hint);
        return;
      }
      tasks.forEach((task) => list.appendChild(createTaskCard(task)));
    });
    ensureTimerUpdates();
  }

  function createTaskCard(task) {
    const card = document.createElement("article");
    const due = dueInfo(task);
    const start = startInfo(task);
    const actualDelivery = actualDeliveryInfo(task);
    const overdue = isOverdue(task);
    const expanded = expandedTaskIds.has(task.id);
    const noteItems = noteItemsFromText(task.notes);
    const notesMarkup = noteItems.length
      ? `<ul class="task-card-notes">${noteItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : '<div class="task-card-notes text-muted">Sin descripción</div>';
    let wasDragged = false;
    card.className = `task-card${expanded ? " expanded" : ""}`;
    card.draggable = true;
    card.tabIndex = 0;
    card.dataset.id = task.id;
    card.setAttribute("aria-expanded", String(expanded));
    card.innerHTML = `
      ${overdue ? '<span class="task-stamp overdue-stamp">VENCIDA</span>' : ""}
      <div class="task-card-summary">
        <div class="task-card-title">${escapeHtml(task.title)}</div>
        <span class="importance-badge importance-${task.importance}">${IMPORTANCE_LEVELS[task.importance]}</span>
        <div class="task-card-actions">
          <button class="icon-button edit-task" type="button" title="Editar" aria-label="Editar ${escapeHtml(task.title)}">✎</button>
          ${task.status === "hecho" ? `<button class="icon-button archive-task" type="button" title="Archivar" aria-label="Archivar ${escapeHtml(task.title)}">
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M2 5.5h12v8H2zM1.5 2.5h13v3h-13zM6 8h4" />
            </svg>
          </button>` : ""}
          <button class="icon-button delete-task" type="button" title="Eliminar" aria-label="Eliminar ${escapeHtml(task.title)}">&times;</button>
        </div>
      </div>
      <div class="task-card-details"${expanded ? "" : " hidden"}>
        ${task.recurrente ? '<span class="detail-recurring-badge">Recurrente</span>' : ""}
        ${notesMarkup}
        ${start || due || actualDelivery ? `<div class="task-meta d-flex flex-wrap gap-2">
          ${start ? `<span class="due-pill">▶ ${start}</span>` : ""}
          ${due ? `<span class="due-pill ${due.className}">📅 ${due.label}</span>` : ""}
          ${actualDelivery ? `<span class="due-pill actual-delivery-pill">✓ ${actualDelivery}</span>` : ""}
        </div>` : '<div class="task-meta"><span class="due-pill">Sin fechas registradas</span></div>'}
        <div class="timer-row">
          <button class="timer-toggle${task.runningSince ? " running" : ""}" type="button" title="${task.runningSince ? "Pausar" : "Iniciar"}" aria-label="${task.runningSince ? "Pausar" : "Iniciar"} temporizador">${task.runningSince ? "Ⅱ" : "▶"}</button>
          <span class="timer-display" data-id="${escapeHtml(task.id)}">${formatTime(currentSeconds(task))}</span>
          <button class="icon-button timer-reset" type="button" title="Reiniciar tiempo" aria-label="Reiniciar tiempo">↻</button>
        </div>
      </div>
    `;

    card.addEventListener("dragstart", (event) => {
      wasDragged = true;
      card.classList.add("dragging");
      event.dataTransfer.setData("text/plain", task.id);
      event.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      window.setTimeout(() => { wasDragged = false; }, 0);
    });
    card.addEventListener("click", (event) => {
      if (wasDragged || event.target.closest("button")) return;
      const willExpand = !expandedTaskIds.has(task.id);
      if (willExpand) expandedTaskIds.add(task.id);
      else expandedTaskIds.delete(task.id);
      card.classList.toggle("expanded", willExpand);
      card.setAttribute("aria-expanded", String(willExpand));
      card.querySelector(".task-card-details").hidden = !willExpand;
    });
    card.addEventListener("keydown", (event) => {
      if (event.target !== card || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      card.click();
    });
    card.querySelector(".edit-task").addEventListener("click", () => openTaskModal(task));
    const archiveButton = card.querySelector(".archive-task");
    if (archiveButton) {
      archiveButton.addEventListener("click", () => {
        requestConfirmation({
          title: "Archivar actividad",
          message: `¿Deseas mover “${task.title}” al Histórico?`,
          confirmLabel: "Archivar",
          confirmClass: "btn-primary",
          onConfirm: () => {
            const currentTask = state.tasks.find((item) => item.id === task.id && item.status === "hecho");
            if (!currentTask) return;
            if (!currentTask.completedAt) currentTask.completedAt = Date.now();
            if (!currentTask.actualDeliveryDate) currentTask.actualDeliveryDate = isoDate(0);
            state.history.push({ ...currentTask });
            state.tasks = state.tasks.filter((item) => item.id !== currentTask.id);
            expandedTaskIds.delete(currentTask.id);
            saveState();
            renderAll();
            showToast("Actividad movida al Histórico.");
          },
        });
      });
    }
    card.querySelector(".delete-task").addEventListener("click", () => {
      requestConfirmation({
        title: "Eliminar actividad",
        message: `¿Deseas eliminar “${task.title}”? Esta acción no se puede deshacer.`,
        onConfirm: () => {
          expandedTaskIds.delete(task.id);
          state.tasks = state.tasks.filter((item) => item.id !== task.id);
          saveState();
          renderAll();
          showToast("Actividad eliminada.");
        },
      });
    });
    card.querySelector(".timer-toggle").addEventListener("click", () => toggleTimer(task.id));
    card.querySelector(".timer-reset").addEventListener("click", () => {
      task.timeSpent = 0;
      task.runningSince = null;
      saveState();
      renderColumns();
    });
    return card;
  }

  function renderRecurringTasks() {
    const container = document.getElementById("recList");
    const recurringTotal = state.recurrentes.length;
    elements.recurringCount.textContent = recurringTotal;
    elements.recurringRevealCount.textContent = recurringTotal;
    container.replaceChildren();
    if (!state.recurrentes.length) {
      container.innerHTML = '<div class="empty-hint">Aún no tienes tareas recurrentes</div>';
      return;
    }
    state.recurrentes.forEach((item) => {
      const row = document.createElement("article");
      row.className = "recurring-item";
      row.innerHTML = `
        <div class="recurring-title">${escapeHtml(item.title)}</div>
        <div class="recurring-frequency">${escapeHtml(item.freq)}</div>
        <div class="recurring-actions">
          <button class="use-recurring" type="button">Usar ahora</button>
          <button class="icon-button delete-recurring" type="button" title="Eliminar recurrente" aria-label="Eliminar ${escapeHtml(item.title)}">&times;</button>
        </div>
      `;
      row.querySelector(".use-recurring").addEventListener("click", () => {
        state.tasks.unshift({
          id: createId(),
          title: item.title,
          importance: "media",
          status: "pendiente",
          notes: item.freq ? `Recurrente: ${item.freq}` : "",
          startDate: null,
          dueDate: null,
          actualDeliveryDate: null,
          recurrente: true,
          timeSpent: 0,
          runningSince: null,
          completedAt: null,
        });
        saveState();
        renderAll();
        showToast("Copia enviada a Pendiente.");
      });
      row.querySelector(".delete-recurring").addEventListener("click", () => {
        requestConfirmation({
          title: "Eliminar recurrente",
          message: `¿Deseas eliminar la tarea recurrente “${item.title}”?`,
          onConfirm: () => {
            state.recurrentes = state.recurrentes.filter((current) => current.id !== item.id);
            saveState();
            renderAll();
            showToast("Tarea recurrente eliminada.");
          },
        });
      });
      container.appendChild(row);
    });
  }

  function renderAll() {
    renderColumns();
    renderRecurringTasks();
    renderKpis();
  }

  function updateActualDeliveryAvailability() {
    const status = elements.taskStatus.value;
    const isPending = status === "pendiente";
    elements.taskActualDelivery.disabled = isPending;
    elements.taskActualDelivery.min = elements.taskStart.value || "";
    elements.taskActualDelivery.max = isoDate(0);
    elements.actualDeliveryHint.textContent = isPending
      ? "Primero mueve la actividad a En curso para registrar la entrega."
      : status === "hecho"
        ? "Borra la fecha para devolver la actividad a En curso."
        : "Al registrar esta fecha, la actividad pasará a Completado.";
  }

  function openTaskModal(task = null, initialStatus = "pendiente") {
    editingTaskId = task ? task.id : null;
    elements.taskModalTitle.textContent = task ? "Editar actividad" : "Nueva actividad";
    elements.taskTitle.value = task ? task.title : "";
    elements.taskImportance.value = task ? task.importance : "media";
    elements.taskStatus.value = task ? task.status : initialStatus;
    elements.taskNotes.value = task ? notesToEditorValue(task.notes) : "";
    elements.taskStart.value = task && task.startDate ? task.startDate : "";
    elements.taskDue.value = task && task.dueDate ? task.dueDate : "";
    elements.taskActualDelivery.value = task && task.actualDeliveryDate ? task.actualDeliveryDate : "";
    if (elements.taskStatus.value === "hecho" && !elements.taskActualDelivery.value) {
      elements.taskActualDelivery.value = isoDate(0);
    }
    if (elements.taskStatus.value === "pendiente") elements.taskActualDelivery.value = "";
    updateActualDeliveryAvailability();
    elements.taskTimeSpent.value = task ? Math.round(currentSeconds(task) / 60) : 0;
    elements.taskRecurrente.checked = false;
    elements.taskDue.setCustomValidity("");
    elements.taskActualDelivery.setCustomValidity("");
    elements.taskForm.classList.remove("was-validated");
    modals.task.show();
  }

  function saveTaskFromForm() {
    const title = elements.taskTitle.value.trim();
    if (!title) {
      elements.taskForm.classList.add("was-validated");
      elements.taskTitle.focus();
      return;
    }
    let status = elements.taskStatus.value;
    const timeSpent = Math.max(0, parseInt(elements.taskTimeSpent.value || "0", 10)) * 60;
    if (elements.taskStart.value && elements.taskDue.value && elements.taskDue.value < elements.taskStart.value) {
      elements.taskDue.setCustomValidity("La fecha de entrega no puede ser anterior a la fecha de inicio.");
      elements.taskForm.classList.add("was-validated");
      elements.taskDue.focus();
      return;
    }
    if (elements.taskStart.value && elements.taskActualDelivery.value && elements.taskActualDelivery.value < elements.taskStart.value) {
      elements.taskActualDelivery.setCustomValidity("La fecha real de entrega no puede ser anterior a la fecha de inicio.");
      elements.taskForm.classList.add("was-validated");
      elements.taskActualDelivery.focus();
      return;
    }
    if (elements.taskActualDelivery.value && elements.taskActualDelivery.value > isoDate(0)) {
      elements.taskActualDelivery.setCustomValidity("La fecha real de entrega no puede ser posterior al día de hoy.");
      elements.taskForm.classList.add("was-validated");
      elements.taskActualDelivery.focus();
      return;
    }
    if (elements.taskActualDelivery.value) status = "hecho";
    else if (status === "hecho") status = "haciendo";
    elements.taskDue.setCustomValidity("");
    elements.taskActualDelivery.setCustomValidity("");
    const commonValues = {
      title,
      importance: elements.taskImportance.value,
      notes: noteItemsFromText(elements.taskNotes.value).join("\n"),
      startDate: elements.taskStart.value || null,
      dueDate: elements.taskDue.value || null,
      actualDeliveryDate: elements.taskActualDelivery.value || null,
      timeSpent,
      runningSince: null,
    };

    if (editingTaskId) {
      const task = state.tasks.find((item) => item.id === editingTaskId);
      if (!task) return;
      Object.assign(task, commonValues);
      setTaskStatus(task, status);
    } else {
      const task = {
        id: createId(),
        ...commonValues,
        status: "pendiente",
        recurrente: false,
        completedAt: null,
      };
      setTaskStatus(task, status);
      state.tasks.unshift(task);
    }

    if (elements.taskRecurrente.checked) {
      state.recurrentes.unshift({ id: createId(), title, freq: "" });
    }
    saveState();
    renderAll();
    modals.task.hide();
    showToast(editingTaskId ? "Actividad actualizada." : "Actividad creada.");
    editingTaskId = null;
  }

  function quickAdd() {
    const title = elements.quickAddInput.value.trim();
    if (!title) return;
    state.tasks.unshift({
      id: createId(),
      title,
      importance: "media",
      status: "pendiente",
      notes: "",
      startDate: null,
      dueDate: null,
      actualDeliveryDate: null,
      recurrente: false,
      timeSpent: 0,
      runningSince: null,
      completedAt: null,
    });
    elements.quickAddInput.value = "";
    saveState();
    renderAll();
    elements.quickAddInput.focus();
  }

  function customColorInputs() {
    return {
      primary: document.getElementById("colorPrimary"),
      pending: document.getElementById("colorPending"),
      doing: document.getElementById("colorDoing"),
      done: document.getElementById("colorDone"),
      recurring: document.getElementById("colorRecurring"),
      danger: document.getElementById("colorDanger"),
    };
  }

  function normalizeHexInput(value) {
    const clean = String(value || "").trim();
    const withHash = clean.startsWith("#") ? clean : `#${clean}`;
    return withHash.toUpperCase();
  }

  function updateWorkScheduleHint() {
    elements.workScheduleHint.textContent = `El temporizador registra únicamente de lunes a viernes, de ${formatWorkSchedule()}.`;
  }

  function toggleCustomPaletteFields() {
    elements.customPaletteFields.hidden = elements.colorPreset.value !== "custom";
  }

  function populateSettingsForm() {
    elements.workdayStart.value = state.settings.workdayStart;
    elements.workdayEnd.value = state.settings.workdayEnd;
    elements.workdayEnd.setCustomValidity("");
    elements.settingsThemeMode.value = state.theme;
    elements.colorPreset.value = state.settings.colorPreset;
    const inputs = customColorInputs();
    COLOR_KEYS.forEach((key) => {
      inputs[key].value = state.settings.customColors[key];
      inputs[key].setCustomValidity("");
    });
    elements.settingsForm.classList.remove("was-validated");
    toggleCustomPaletteFields();
  }

  function stopRunningTimers() {
    state.tasks.forEach((task) => {
      if (!task.runningSince) return;
      task.timeSpent = currentSeconds(task);
      task.runningSince = null;
    });
  }

  function saveSettingsFromForm() {
    const start = elements.workdayStart.value;
    const end = elements.workdayEnd.value;
    if (!start || !end || timeToMinutes(end) <= timeToMinutes(start)) {
      elements.workdayEnd.setCustomValidity("La hora de fin debe ser posterior a la hora de inicio.");
      elements.settingsForm.classList.add("was-validated");
      elements.workdayEnd.focus();
      return;
    }
    elements.workdayEnd.setCustomValidity("");

    const inputs = customColorInputs();
    const customColors = {};
    let invalidColorInput = null;
    COLOR_KEYS.forEach((key) => {
      const value = normalizeHexInput(inputs[key].value);
      const valid = isValidHex(value);
      inputs[key].setCustomValidity(valid ? "" : "Escribe un color HEX válido.");
      customColors[key] = valid ? value : DEFAULT_CUSTOM_COLORS[key];
      if (!valid && elements.colorPreset.value === "custom" && !invalidColorInput) invalidColorInput = inputs[key];
    });
    if (invalidColorInput) {
      elements.settingsForm.classList.add("was-validated");
      invalidColorInput.focus();
      return;
    }

    stopRunningTimers();
    state.theme = elements.settingsThemeMode.value === "light" ? "light" : "dark";
    state.settings = {
      workdayStart: start,
      workdayEnd: end,
      colorPreset: COLOR_PRESETS.includes(elements.colorPreset.value) ? elements.colorPreset.value : "focus",
      customColors,
      recurringCollapsed: state.settings.recurringCollapsed,
      completedCollapsed: state.settings.completedCollapsed,
    };
    saveState();
    applyTheme();
    updateWorkScheduleHint();
    renderAll();
    modals.settings.hide();
    showToast("Configuración guardada.");
  }

  function resetPalette() {
    state.settings.colorPreset = "focus";
    state.settings.customColors = { ...DEFAULT_CUSTOM_COLORS };
    elements.colorPreset.value = "focus";
    const inputs = customColorInputs();
    COLOR_KEYS.forEach((key) => {
      inputs[key].value = DEFAULT_CUSTOM_COLORS[key];
      inputs[key].setCustomValidity("");
    });
    toggleCustomPaletteFields();
    saveState();
    applyColorSettings();
    showToast("Paleta predeterminada restablecida.");
  }

  function exportData() {
    const exportPayload = {
      application: "Tablero de Actividades PMO/TI",
      version: 2,
      exportedAt: new Date().toISOString(),
      data: state,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tablero-respaldo-${isoDate(0)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showToast("Respaldo exportado.");
  }

  function excelDateFromIso(value) {
    return value ? new Date(`${value}T00:00:00`) : null;
  }

  function taskToExcelRow(task, location) {
    const statusLabels = { pendiente: "Pendiente", haciendo: "En curso", hecho: "Completado" };
    return [
      task.title,
      IMPORTANCE_LEVELS[task.importance] || "Media",
      statusLabels[task.status] || task.status,
      location,
      task.notes || "",
      excelDateFromIso(task.startDate),
      excelDateFromIso(task.dueDate),
      excelDateFromIso(task.actualDeliveryDate),
      Number((currentSeconds(task) / 3600).toFixed(2)),
      task.runningSince ? "Sí" : "No",
      task.recurrente ? "Sí" : "No",
    ];
  }

  async function exportExcel() {
    if (!window.ExcelJS) {
      showToast("No fue posible cargar el componente de exportación de Excel.", true);
      return;
    }
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Grupo CCIMA";
      workbook.title = "Tablero de Actividades";
      workbook.subject = "Todas las actividades del tablero";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Actividades", {
        views: [{ state: "frozen", ySplit: 1, activeCell: "A2" }],
        properties: { defaultRowHeight: 20 },
      });
      const headers = [
        "Título", "Importancia", "Estado", "Ubicación", "Notas", "Fecha de inicio",
        "Fecha de entrega", "Fecha real de entrega", "Tiempo registrado (horas)",
        "Temporizador activo", "Recurrente",
      ];
      const allRows = [
        ...state.tasks.map((task) => taskToExcelRow(task, "Tablero")),
        ...state.history.map((task) => taskToExcelRow(task, "Histórico")),
      ];

      worksheet.addTable({
        name: "TablaActividades",
        ref: "A1",
        headerRow: true,
        totalsRow: false,
        style: { theme: "TableStyleMedium2", showRowStripes: true },
        columns: headers.map((name) => ({ name, filterButton: true })),
        rows: allRows,
      });

      const widths = [40, 14, 14, 14, 48, 16, 16, 20, 25, 20, 13];
      widths.forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width;
      });
      [6, 7, 8].forEach((column) => {
        worksheet.getColumn(column).numFmt = "yyyy-mm-dd";
      });
      worksheet.getColumn(9).numFmt = "0.00";
      worksheet.getColumn(5).alignment = { vertical: "top", wrapText: true };
      worksheet.eachRow((row, rowNumber) => {
        row.alignment = { vertical: "top" };
        if (rowNumber > 1) row.height = 30;
      });

      const primaryHex = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim()
        .replace("#", "")
        .toUpperCase();
      const header = worksheet.getRow(1);
      header.height = 28;
      header.font = { bold: true, color: { argb: "FFFFFFFF" } };
      header.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      header.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${primaryHex}` } };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
          right: { style: "thin", color: { argb: "55FFFFFF" } },
        };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tablero-actividades-${isoDate(0)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      showToast("Reporte de Excel exportado.");
    } catch (error) {
      console.error("No se pudo exportar el reporte de Excel:", error);
      showToast("No se pudo generar el archivo de Excel.", true);
    }
  }

  async function prepareImport(file) {
    try {
      const parsed = JSON.parse(await file.text());
      const candidate = parsed && parsed.data ? parsed.data : parsed;
      if (
        !candidate || typeof candidate !== "object" ||
        !Array.isArray(candidate.tasks) ||
        !Array.isArray(candidate.recurrentes) ||
        !Array.isArray(candidate.history)
      ) {
        throw new Error("El archivo no tiene la estructura de un respaldo válido.");
      }
      const importedState = normalizeState(candidate);
      requestConfirmation({
        title: "Importar respaldo",
        message: "La importación reemplazará todas las actividades, recurrentes, histórico y configuraciones actuales.",
        confirmLabel: "Importar",
        confirmClass: "btn-primary",
        onConfirm: () => {
          state = importedState;
          settleExpiredTimers();
          archiveOldDone();
          saveState();
          applyTheme();
          updateWorkScheduleHint();
          renderAll();
          showToast("Respaldo importado correctamente.");
        },
      });
    } catch (error) {
      console.error("No se pudo importar el respaldo:", error);
      showToast(error.message || "No se pudo importar el archivo.", true);
    } finally {
      elements.importDataInput.value = "";
    }
  }

  elements.themeButton.addEventListener("click", () => {
    state.theme = state.theme === "light" ? "dark" : "light";
    saveState();
    applyTheme();
  });

  elements.hideRecurringButton.addEventListener("click", () => setRecurringPanelCollapsed(true));
  elements.showRecurringButton.addEventListener("click", () => setRecurringPanelCollapsed(false));
  elements.hideCompletedButton.addEventListener("click", () => setCompletedPanelCollapsed(true));
  elements.showCompletedButton.addEventListener("click", () => setCompletedPanelCollapsed(false));

  document.getElementById("settingsBtn").addEventListener("click", () => {
    populateSettingsForm();
    modals.settings.show();
  });
  elements.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveSettingsFromForm();
  });
  elements.colorPreset.addEventListener("change", toggleCustomPaletteFields);
  [elements.workdayStart, elements.workdayEnd].forEach((input) => {
    input.addEventListener("change", () => elements.workdayEnd.setCustomValidity(""));
  });
  Object.values(customColorInputs()).forEach((input) => {
    input.addEventListener("blur", () => {
      input.value = normalizeHexInput(input.value);
      input.setCustomValidity(isValidHex(input.value) ? "" : "Escribe un color HEX válido.");
    });
  });
  document.getElementById("resetPaletteBtn").addEventListener("click", resetPalette);
  document.getElementById("exportDataBtn").addEventListener("click", exportData);
  document.getElementById("exportExcelBtn").addEventListener("click", exportExcel);
  document.getElementById("importDataBtn").addEventListener("click", () => elements.importDataInput.click());
  elements.importDataInput.addEventListener("change", () => {
    const [file] = elements.importDataInput.files;
    if (file) prepareImport(file);
  });

  document.getElementById("openAddBtn").addEventListener("click", () => openTaskModal());
  elements.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveTaskFromForm();
  });
  elements.taskNotes.addEventListener("focus", () => {
    if (!elements.taskNotes.value.trim()) {
      elements.taskNotes.value = "• ";
      elements.taskNotes.setSelectionRange(2, 2);
    }
  });
  elements.taskNotes.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    elements.taskNotes.setRangeText(
      "\n• ",
      elements.taskNotes.selectionStart,
      elements.taskNotes.selectionEnd,
      "end"
    );
  });
  elements.taskStatus.addEventListener("change", () => {
    if (elements.taskStatus.value === "hecho" && !elements.taskActualDelivery.value) {
      elements.taskActualDelivery.value = isoDate(0);
    } else if (elements.taskStatus.value !== "hecho") {
      elements.taskActualDelivery.value = "";
    }
    elements.taskActualDelivery.setCustomValidity("");
    updateActualDeliveryAvailability();
  });
  elements.taskActualDelivery.addEventListener("change", () => {
    elements.taskActualDelivery.setCustomValidity("");
    if (elements.taskActualDelivery.value) {
      elements.taskStatus.value = "hecho";
    } else if (elements.taskStatus.value === "hecho") {
      elements.taskStatus.value = "haciendo";
    }
    updateActualDeliveryAvailability();
  });
  [elements.taskStart, elements.taskDue].forEach((input) => {
    input.addEventListener("change", () => {
      elements.taskDue.setCustomValidity("");
      elements.taskActualDelivery.setCustomValidity("");
      updateActualDeliveryAvailability();
    });
  });
  document.getElementById("taskModal").addEventListener("hidden.bs.modal", () => {
    editingTaskId = null;
    elements.taskForm.classList.remove("was-validated");
  });

  document.querySelectorAll(".column-add[data-status]").forEach((button) => {
    button.addEventListener("click", () => openTaskModal(null, button.dataset.status));
  });

  document.querySelectorAll(".board-column").forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      column.classList.add("dragover");
    });
    column.addEventListener("dragleave", () => column.classList.remove("dragover"));
    column.addEventListener("drop", (event) => {
      event.preventDefault();
      column.classList.remove("dragover");
      const task = state.tasks.find((item) => item.id === event.dataTransfer.getData("text/plain"));
      if (!task) return;
      setTaskStatus(task, column.dataset.status);
      saveState();
      renderAll();
    });
  });

  document.getElementById("openAddRecBtn").addEventListener("click", () => {
    elements.recForm.reset();
    elements.recForm.classList.remove("was-validated");
    modals.recurrent.show();
  });
  elements.recForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = elements.recTitle.value.trim();
    if (!title) {
      elements.recForm.classList.add("was-validated");
      elements.recTitle.focus();
      return;
    }
    state.recurrentes.unshift({ id: createId(), title, freq: elements.recFreq.value.trim() });
    saveState();
    renderAll();
    modals.recurrent.hide();
    showToast("Tarea recurrente creada.");
  });

  document.getElementById("kpiBtn").addEventListener("click", () => {
    renderKpis();
    modals.kpi.show();
  });
  document.getElementById("historyBtn").addEventListener("click", () => {
    renderHistory();
    modals.history.show();
  });
  document.getElementById("archiveDoneBtn").addEventListener("click", () => {
    const completed = state.tasks.filter((task) => task.status === "hecho");
    if (!completed.length) {
      showToast("No hay actividades completadas para archivar.");
      return;
    }
    completed.forEach((task) => {
      if (!task.completedAt) task.completedAt = Date.now();
      state.history.push({ ...task });
    });
    state.tasks = state.tasks.filter((task) => task.status !== "hecho");
    saveState();
    renderAll();
    showToast(`${completed.length} actividad${completed.length === 1 ? "" : "es"} archivada${completed.length === 1 ? "" : "s"}.`);
  });
  document.getElementById("clearHistoryBtn").addEventListener("click", () => {
    if (!state.history.length) return;
    requestConfirmation({
      title: "Vaciar histórico",
      message: "¿Deseas eliminar todo el histórico? Esta acción no se puede deshacer.",
      confirmLabel: "Vaciar histórico",
      onConfirm: () => {
        state.history = [];
        saveState();
        renderHistory();
        renderKpis();
        showToast("Histórico eliminado.");
      },
    });
  });

  elements.confirmButton.addEventListener("click", () => {
    const action = pendingConfirmation;
    pendingConfirmation = null;
    modals.confirm.hide();
    if (typeof action === "function") action();
  });
  document.getElementById("confirmModal").addEventListener("hidden.bs.modal", () => {
    pendingConfirmation = null;
  });

  document.getElementById("quickAddBtn").addEventListener("click", quickAdd);
  elements.quickAddInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      quickAdd();
    }
  });

  applyTheme();
  applyRecurringPanelState();
  applyCompletedPanelState();
  updateWorkScheduleHint();
  syncNavbarHeight();
  if ("ResizeObserver" in window) {
    new ResizeObserver(syncNavbarHeight).observe(elements.navbar);
  } else {
    window.addEventListener("resize", syncNavbarHeight);
  }
  settleExpiredTimers();
  archiveOldDone();
  saveState();
  renderAll();
})();
