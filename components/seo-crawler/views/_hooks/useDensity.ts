// useDensity.ts
import { useCrawlerUI, type Density } from '@/contexts/CrawlerUIContext';

export function useDensity(): readonly [Density, (d: Density) => void] {
  const { density, setDensity } = useCrawlerUI();
  return [density, setDensity] as const;
}
