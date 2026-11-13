import { useEffect, useId, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

export default function OverflowMenu({ actions, label = "More actions" }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!actions.length) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((previous) => !previous)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface2 text-ink transition hover:bg-line"
      >
        <MoreHorizontal size={20} />
      </button>
      {open && (
        <div
          id={menuId}
          role="group"
          aria-label={label}
          className="absolute right-0 top-full z-30 mt-2 min-w-52 overflow-hidden rounded-xl border border-line bg-surface2 py-1 shadow-xl"
        >
          {actions.map(({ id, label: actionLabel, icon: Icon, onClick, disabled, destructive }) => (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => {
                setOpen(false);
                onClick();
              }}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-line disabled:cursor-not-allowed disabled:opacity-50 ${
                destructive ? "text-rose-400" : "text-ink"
              }`}
            >
              <Icon size={16} />
              <span>{actionLabel}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
