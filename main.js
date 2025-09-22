/*******************************
 * Weekend Highlighter (All-in-One)
 * - Uses your isWeekendFromDateKey(dateKey)
 * - Highlights any element exposing a date key attribute
 *******************************/

// ===== Your function (kept intact) =====
function isWeekendFromDateKey(dateKey) { 
  // Reverse the encoding
  const yearOffset = Math.floor(dateKey / 512);
  const remainder = dateKey % 512;

  const month = Math.floor(remainder / 32);
  const day = remainder % 32;

  const year = 1970 + yearOffset;

  // Construct actual JS date (months are 0-based in JS Date)
  const d = new Date(year, month - 1, day); 
  const new_day = d.getDay(); // 0=Sun..6=Sat
  return (new_day === 0 || new_day === 6);
}

// (Optional) If you want to inspect the decoding quickly:
function dateFromDateKey(dateKey) {
  const yearOffset = Math.floor(dateKey / 512);
  const remainder = dateKey % 512;
  const month = Math.floor(remainder / 32);
  const day = remainder % 32;
  const year = 1970 + yearOffset;
  return new Date(year, month - 1, day);
}

// ===== Config / styling =====
const WEEKEND_CLASS = "gcal-weekend";
const WEEKEND_STYLE_ID = "gcal-weekend-style";
const WEEKEND_STYLE = `
  .${WEEKEND_CLASS} {
    background-color: rgba(40, 40, 40, 1) !important; /* soft amber tint */
  }
`;

// ===== Utilities =====
function injectWeekendStyle() {
  if (!document.getElementById(WEEKEND_STYLE_ID)) {
    const style = document.createElement("style");
    style.id = WEEKEND_STYLE_ID;
    style.textContent = WEEKEND_STYLE;
    document.head.appendChild(style);
  }
}

function getDateKeyFromEl(el) {
  // Be flexible about attribute naming that shows up in different Calendar views
  const raw =
    el.getAttribute?.("data-datekey") ??
    el.getAttribute?.("data-date-key") ??
    el.getAttribute?.("datekey") ??
    el.getAttribute?.("dateKey");
  if (raw == null || raw === "") return null;

  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function paintWeekend(el) {
  const key = getDateKeyFromEl(el);
  if (key == null) return;
  if (isWeekendFromDateKey(key)) {
    el.classList.add(WEEKEND_CLASS);
  } else {
    el.classList.remove(WEEKEND_CLASS);
  }
}

// ===== Public API =====

// One-shot: scan and highlight all visible cells with a date key
function highlightWeekendCells(root = document) {
  injectWeekendStyle();
  const cells = root.querySelectorAll(
    "[data-datekey], [data-date-key], [datekey], [dateKey]"
  );
  cells.forEach(paintWeekend);
  return cells; // return nodes for inspection if you want
}

// Live mode: keep highlighting as Calendar re-renders
let __weekendObserver__;
function startWeekendHighlighter(root = document.body) {
  injectWeekendStyle();
  if (__weekendObserver__) __weekendObserver__.disconnect();

  __weekendObserver__ = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === "childList") {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            // Paint the node itself if it carries a key
            paintWeekend(node);
            // …and any descendants with keys
            node
              .querySelectorAll?.(
                "[data-datekey], [data-date-key], [datekey], [dateKey]"
              )
              .forEach(paintWeekend);
          }
        });
      } else if (m.type === "attributes") {
        paintWeekend(m.target);
      }
    }
  });

  __weekendObserver__.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-datekey", "data-date-key", "datekey", "dateKey"],
  });

  // Initial paint
  highlightWeekendCells(root);
}

function stopWeekendHighlighter() {
  if (__weekendObserver__) {
    __weekendObserver__.disconnect();
    __weekendObserver__ = null;
  }
}

function clearWeekendHighlights(root = document) {
  root.querySelectorAll(`.${WEEKEND_CLASS}`).forEach(el => {
    el.classList.remove(WEEKEND_CLASS);
  });
}

/* ===== Usage =====
   // One-shot:
   highlightWeekendCells();

   // Live mode (updates as you scroll/navigation changes):
   startWeekendHighlighter();

   // Later, to stop:
   stopWeekendHighlighter();

   // To clear the tint:
   clearWeekendHighlights();
*/
startWeekendHighlighter();
