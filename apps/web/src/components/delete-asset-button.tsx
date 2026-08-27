'use client';

import { TrashIcon } from '@/components/icons';
import { deleteBrandAsset } from '@/lib/actions';

interface DeleteAssetButtonProps {
  assetId: string;
  storagePath: string;
  locale: string;
  confirmMessage: string;
  label: string;
}

export function DeleteAssetButton({
  assetId,
  storagePath,
  locale,
  confirmMessage,
  label,
}: DeleteAssetButtonProps) {
  return (
    <form
      action={deleteBrandAsset}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="assetId" value={assetId} />
      <input type="hidden" name="storagePath" value={storagePath} />
      <button
        type="submit"
        aria-label={label}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-raised hover:text-red-400"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </form>
  );
}
