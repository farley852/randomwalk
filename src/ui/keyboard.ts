export interface KeyboardActions {
  onTogglePlay: () => void;
  onReset: () => void;
  onExport: () => void;
  isExporting: () => boolean;
}

const IGNORED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function initKeyboard(actions: KeyboardActions): void {
  window.addEventListener("keydown", (e) => {
    if (IGNORED_TAGS.has((e.target as HTMLElement).tagName)) return;

    switch (e.code) {
      case "Space":
        e.preventDefault();
        actions.onTogglePlay();
        break;
      case "KeyR":
        actions.onReset();
        break;
      case "KeyE":
        if (!actions.isExporting()) {
          actions.onExport();
        }
        break;
    }
  });
}
