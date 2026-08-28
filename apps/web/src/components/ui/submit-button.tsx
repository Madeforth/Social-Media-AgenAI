'use client';

import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

interface SubmitButtonProps {
  label: string;
  /** Shown while the enclosing form's action is running. */
  pendingLabel: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * A submit button that says what it is doing while it does it.
 *
 * Generation takes seven to twenty seconds against a real model, and publishing
 * polls Meta for longer than that. With a plain button the page simply sits
 * there, which reads as a broken app rather than a working one. `useFormStatus`
 * reports the enclosing form's own pending state, so this has to be a client
 * component rendered inside the form it belongs to.
 *
 * Disabling while pending is not cosmetic: a second submit would start a second
 * generation, which costs another call against the organization's quota.
 */
export function SubmitButton({
  label,
  pendingLabel,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || pending}
      aria-busy={pending}
    >
      {pending ? <Spinner /> : icon}
      {pending ? pendingLabel : label}
    </Button>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 animate-spin"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
