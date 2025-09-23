class WeekendHighlighter {
  /**
   * Highlight all weekend cells within the given root element,
   * then sync the matching column headers by index.
   * @param {Element|Document} root
   */
  static highlightWeekendCells(root = document) {
    Utils.injectWeekendStyle();
    const cells = root.querySelectorAll(
      "[data-datekey], [data-date-key], [datekey], [dateKey]"
    );
    cells.forEach(Utils.paintWeekend);

    // After cells are painted, sync headers once.
    WeekendHighlighter.syncWeekendHeaders(root);

    return cells; // still return nodes for inspection
  }

  // Live mode: keep highlighting as Calendar re-renders
  static __weekendObserver__;

  /**
   * Start the live weekend highlighter on the given root element.
   * @param {Element|Document} root
   */
  static startWeekendHighlighter(root = document.body) {
    Utils.injectWeekendStyle();
    if (WeekendHighlighter.__weekendObserver__)
      WeekendHighlighter.__weekendObserver__.disconnect();

    WeekendHighlighter.__weekendObserver__ = new MutationObserver((muts) => {
      let needsSync = false;

      for (const m of muts) {
        if (m.type === "childList") {
          m.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              // Paint the node itself if it carries a key
              Utils.paintWeekend(node);
              // …and any descendants with keys
              node
                .querySelectorAll?.(
                  "[data-datekey], [data-date-key], [datekey], [dateKey]"
                )
                .forEach(Utils.paintWeekend);
              needsSync = true;
            }
          });
        } else if (m.type === "attributes") {
          if (
            m.attributeName === "data-datekey" ||
            m.attributeName === "data-date-key" ||
            m.attributeName === "datekey" ||
            m.attributeName === "dateKey"
          ) {
            Utils.paintWeekend(m.target);
            needsSync = true;
          }
        }
      }

      if (needsSync) WeekendHighlighter.syncWeekendHeaders(root);
    });

    WeekendHighlighter.__weekendObserver__.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-datekey", "data-date-key", "datekey", "dateKey"],
    });

    // Initial paint + header sync
    WeekendHighlighter.highlightWeekendCells(root);
  }

  /**
   * Stop the live weekend highlighter
   */
  static stopWeekendHighlighter() {
    if (WeekendHighlighter.__weekendObserver__) {
      WeekendHighlighter.__weekendObserver__.disconnect();
      WeekendHighlighter.__weekendObserver__ = null;
    }
  }

  /**
   * Clear all weekend highlights within the given root element.
   * @param {Element|Document} root
   */
  static clearWeekendHighlights(root = document) {
    root.querySelectorAll(`.${WEEKEND_CLASS}`).forEach((el) => {
      el.classList.remove(WEEKEND_CLASS);
    });
  }

  // =============================
  // Header sync helpers
  // =============================

  /**
   * Find the primary header row (the one that contains column headers).
   * @param {Element|Document} root
   * @returns {Element|null}
   */
  static findHeaderRow(root = document) {
    const rows = root.querySelectorAll("div[role='row']");
    for (const r of rows) {
      if (r.querySelector("div[role='columnheader']")) return r;
    }
    return null;
  }

  /**
   * True if node is a day cell (has any known date-key attribute).
   * @param {Element} n
   */
  static _isCell(n) {
    return !!(
      n?.getAttribute?.("data-datekey") ??
      n?.getAttribute?.("data-date-key") ??
      n?.getAttribute?.("datekey") ??
      n?.getAttribute?.("dateKey")
    );
  }

  /**
   * From the FIRST examples of weekend cells, compute their column indices
   * relative to the parent container holding the day cells.
   * @param {Element|Document} root
   * @returns {number[]} sorted unique indices
   */
  static getFirstWeekendColumnIndices(root = document) {
    // All weekend cells (already painted with WEEKEND_CLASS)
    const weekendCells = Array.from(
      root.querySelectorAll(
        `[data-datekey].${WEEKEND_CLASS}, ` +
          `[data-date-key].${WEEKEND_CLASS}, ` +
          `[datekey].${WEEKEND_CLASS}, ` +
          `[dateKey].${WEEKEND_CLASS}`
      )
    );
    if (weekendCells.length === 0) return [];

    // Use the first container that actually holds multiple day cells as children
    let container = weekendCells[0].parentElement;
    const isGoodContainer = (el) =>
      el &&
      Array.from(el.children).filter(WeekendHighlighter._isCell).length >= 2;

    while (container && !isGoodContainer(container)) {
      container = container.parentElement;
    }
    if (!container) return [];

    const columns = Array.from(container.children).filter(
      WeekendHighlighter._isCell
    );

    // Helper: climb from a cell to the direct child of container representing that column
    const toDirectChild = (cell) => {
      let n = cell;
      while (n && n.parentElement !== container) n = n.parentElement;
      return n && WeekendHighlighter._isCell(n) ? n : null;
    };

    // Collect indices for weekend cells that belong to this first container
    const indices = new Set();
    for (const c of weekendCells) {
      const direct = toDirectChild(c);
      if (!direct) continue;
      const idx = columns.indexOf(direct);
      if (idx >= 0) indices.add(idx);
    }

    return Array.from(indices).sort((a, b) => a - b);
  }

  /**
   * Apply WEEKEND_CLASS to headers at the given column indices.
   * @param {number[]} indices
   * @param {Element|Document} root
   */
  static applyWeekendToHeaders(indices, root = document) {
    const headerRow = WeekendHighlighter.findHeaderRow(root);
    if (!headerRow) return;

    const headers = Array.from(
      headerRow.querySelectorAll("div[role='columnheader']")
    );
    indices.forEach((i) => {
      if (headers[i]) headers[i].classList.add(WEEKEND_CLASS);
    });
  }

  /**
   * Sync weekend headers based on the first instances of .gcal-weekend cells.
   * @param {Element|Document} root
   * @returns {number[]} the indices applied
   */
  static syncWeekendHeaders(root = document) {
    const idxs = WeekendHighlighter.getFirstWeekendColumnIndices(root);
    WeekendHighlighter.applyWeekendToHeaders(idxs, root);
    return idxs;
  }
}
