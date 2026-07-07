// ============================================================
// Event emitter for analytics tab navigation from sidebar
// ============================================================
type Listener = (tab: string) => void;
let _listeners: Listener[] = [];
let _currentTab = "overview";

export const analyticsNav = {
  currentTab: () => _currentTab,
  emit(tab: string) {
    _currentTab = tab;
    _listeners.forEach(fn => fn(tab));
  },
  subscribe(fn: Listener): () => void {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(l => l !== fn); };
  },
};
