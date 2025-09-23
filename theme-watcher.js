class Themewatcher {
    /**
     * Detect the Google Calendar theme.
     * @returns { mode: "light" | "dark", luminance: number, bg: {r:number,g:number,b:number,a:number}, prefersDark: boolean, root: HTMLElement }
     */
    static detectGCalTheme() {
        // Prefer the app root if present; fall back to body/html.
        const root = document.getElementById("yDmH0d") || document.body || document.documentElement;

        function parseRGBA(str) {
            const m = /rgba?\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})(?:\s*,\s*(\d*\.?\d+))?\s*\)/.exec(str || "");
            if (!m) return null;
            return { r: +m[1], g: +m[2], b: +m[3], a: m[4] != null ? +m[4] : 1 };
        }

        // Walk up until we hit a non-transparent background color.
        function effectiveBg(el, depth = 0) {
            if (!el || depth > 10) return { r: 255, g: 255, b: 255, a: 1 };
            const cs = getComputedStyle(el);
            const rgba = parseRGBA(cs.backgroundColor);
            if (!rgba || rgba.a === 0) return effectiveBg(el.parentElement, depth + 1);
            return rgba;
        }

        function luminance({ r, g, b }) {
            const srgb = [r, g, b].map(v => v / 255);
            const lin = srgb.map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
            return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
        }

        const bg = effectiveBg(root);
        const L = luminance(bg);
        const mode = L < 0.45 ? "dark" : "light"; // threshold tuned for GC’s palettes

        // FYI: system preference (not necessarily what Calendar uses if overridden)
        const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

        return { mode, luminance: L, bg, prefersDark, root };
    }

    /**
     * Watch for changes to the Google Calendar theme.
     * @param {*} onChange 
     * @returns 
     */
    static watchGCalTheme(onChange) {
        // Call once immediately
        onChange(Themewatcher.detectGCalTheme());

        const roots = [
            document.getElementById("yDmH0d"),
            document.body,
            document.documentElement
        ].filter(Boolean);

        const obs = roots.map(root => {
            const mo = new MutationObserver(() => onChange(Themewatcher.detectGCalTheme()));
            mo.observe(root, { attributes: true, attributeFilter: ["class", "style"], subtree: false });
            return mo;
        });

        // Also respond to system pref changes (in case Calendar follows device theme)
        let mm, mmHandler;
        if (window.matchMedia) {
            mm = window.matchMedia("(prefers-color-scheme: dark)");
            mmHandler = () => onChange(Themewatcher.detectGCalTheme());
            try { mm.addEventListener("change", mmHandler); }
            catch { mm.addListener(mmHandler); } // Safari legacy
        }

        return function stop() {
            obs.forEach(mo => mo.disconnect());
            if (mm && mmHandler) {
            try { mm.removeEventListener("change", mmHandler); }
            catch { mm.removeListener(mmHandler); }
            }
        };
    }



    /**
     * Updates the weekend CSS class according to the given mode.
     * @param {*} mode 
     */
    static applyWeekendStyle(mode) {
        const id = "gcal-weekend-style";
        let style = document.getElementById(id);
        if (!style) { 
            style = document.createElement("style"); 
            style.id = id; 
            document.head.appendChild(style); 
        }
        style.textContent = mode === "dark" ? DARK_STYLE : LIGHT_STYLE;
    }
}