'use client';

/* Submit button that asks for confirmation before firing a (destructive)
   server action form. */
export default function ConfirmSubmit({ confirm: msg, children, className }: {
  confirm: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit" className={className}
      onClick={e => { if (!window.confirm(msg)) e.preventDefault(); }}
    >{children}</button>
  );
}
