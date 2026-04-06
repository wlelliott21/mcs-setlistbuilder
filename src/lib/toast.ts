let toastContainer: HTMLDivElement | null = null;

function ensureContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
  const container = ensureContainer();
  const el = document.createElement('div');
  const colors: Record<string, string> = {
    success: 'border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.1); color: rgb(110,231,183);',
    error: 'border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.1); color: rgb(252,165,165);',
    warning: 'border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.1); color: rgb(252,211,77);',
  };
  el.style.cssText = `pointer-events:auto;padding:10px 16px;border-radius:8px;border:1px solid;font-size:14px;font-weight:500;backdrop-filter:blur(12px);box-shadow:0 10px 15px rgba(0,0,0,0.2);${colors[type]}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 2500);
}
