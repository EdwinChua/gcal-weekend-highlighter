// ===== Utilities =====
class Utils {
  /**
   * Check if a date key corresponds to a weekend.
   * @param {*} dateKey
   * @returns
   */
  static isWeekendFromDateKey(dateKey) {
    // Reverse the encoding
    const yearOffset = Math.floor(dateKey / 512);
    const remainder = dateKey % 512;

    const month = Math.floor(remainder / 32);
    const day = remainder % 32;

    const year = 1970 + yearOffset;

    // Construct actual JS date (months are 0-based in JS Date)
    const d = new Date(year, month - 1, day);
    const new_day = d.getDay(); // 0=Sun..6=Sat
    return new_day === 0 || new_day === 6;
  }

  /**
   * Inject the CSS style for weekend highlighting if not already present
   * (idempotent)
   */
  static injectWeekendStyle() {
    if (!document.getElementById(WEEKEND_STYLE_ID)) {
      const style = document.createElement("style");
      style.id = WEEKEND_STYLE_ID;
      style.textContent = DARK_STYLE; // Default to dark style
      document.head.appendChild(style);
    }
  }

  /**
   * Get the date key from a calendar element
   * @param {*} el
   * @returns
   */
  static getDateKeyFromEl(el) {
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

  /**
   * Paint the weekend class on a calendar element if its date key is a weekend
   * @param {*} el
   * @returns
   */
  static paintWeekend(el) {
    const key = Utils.getDateKeyFromEl(el);
    if (key == null) return;
    if (Utils.isWeekendFromDateKey(key)) {
      el.classList.add(WEEKEND_CLASS);
    } else {
      el.classList.remove(WEEKEND_CLASS);
    }
  }
}
