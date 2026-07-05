/** mm:ss.cc chrono format. */
export function formatTime(ms: number): string {
    if (!Number.isFinite(ms) || ms < 0) ms = 0;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centis
        .toString()
        .padStart(2, "0")}`;
}

/**
 * Display a stored date. Supports ISO strings (new format) and the legacy
 * fr-FR "dd/mm/yyyy" strings from older saves.
 */
export function formatDate(raw: string): string {
    if (!raw) return "—";
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString("fr-FR");
    }
    return raw;
}
