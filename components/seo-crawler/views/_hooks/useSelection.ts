// useSelection.ts
import { useCallback, useState } from 'react';
import type { RowSelectionState } from '@tanstack/react-table';

export function useSelection() {
  const [selected, setSelected] = useState<RowSelectionState>({});
  const ids = Object.keys(selected).filter(k => selected[k]);
  const clear = useCallback(() => setSelected({}), []);
  return { selected, setSelected, ids, clear };
}
