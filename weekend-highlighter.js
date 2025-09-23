class WeekendHighlighter {
  /**
   * Highlight all weekend cells within the given root element.
   * @param {*} root
   * @returns
   */
  static highlightWeekendCells(root = document) {
    Utils.injectWeekendStyle();
    const cells = root.querySelectorAll(
      "[data-datekey], [data-date-key], [datekey], [dateKey]"
    );
    cells.forEach(Utils.paintWeekend);
    return cells; // return nodes for inspection if you want
  }

  // Live mode: keep highlighting as Calendar re-renders
  static __weekendObserver__;

  /**
   * Start the live weekend highlighter on the given root element.
   * @param {*} root
   */
  static startWeekendHighlighter(root = document.body) {
    Utils.injectWeekendStyle();
    if (WeekendHighlighter.__weekendObserver__)
      WeekendHighlighter.__weekendObserver__.disconnect();

    WeekendHighlighter.__weekendObserver__ = new MutationObserver((muts) => {
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
            }
          });
        } else if (m.type === "attributes") {
          Utils.paintWeekend(m.target);
        }
      }
    });

    WeekendHighlighter.__weekendObserver__.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-datekey", "data-date-key", "datekey", "dateKey"],
    });

    // Initial paint
    WeekendHighlighter.highlightWeekendCells(root);
  }

  /**
   * (Unused) Stop the live weekend highlighter
   */
  static stopWeekendHighlighter() {
    if (WeekendHighlighter.__weekendObserver__) {
      WeekendHighlighter.__weekendObserver__.disconnect();
      WeekendHighlighter.__weekendObserver__ = null;
    }
  }

  /**
   * (Unused) Clear all weekend highlights within the given root element.
   * @param {*} root
   */
  static clearWeekendHighlights(root = document) {
    root
      .querySelectorAll(`.${WEEKEND_CLASS}`)
      .forEach((el) => {
        el.classList.remove(WEEKEND_CLASS);
      });
  }
}
