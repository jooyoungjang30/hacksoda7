import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Modal confirmation. Rendered only while `open` — there is no exit animation, so
 * unmounting is enough to dismiss it.
 *
 * Escape and a backdrop click both cancel; the confirm button takes focus on open
 * so the dialog is operable from the keyboard alone.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-[420px] rounded-xl border border-line bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4">
          <h2 id="confirm-dialog-title" className="text-[15px] font-semibold">
            {title}
          </h2>
          <div className="mt-2 text-[13px] leading-relaxed text-muted">{children}</div>
        </div>
        <div className="flex justify-end gap-2 border-t border-line bg-surface px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-line bg-white px-3.5 py-1.5 text-[12.5px] font-medium"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-brand px-3.5 py-1.5 text-[12.5px] font-semibold text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
