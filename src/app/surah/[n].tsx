import { useLocalSearchParams } from 'expo-router';

import { SurahView } from '@/components/surah-view';

/** One whole surah, opened at a given ayah if asked. */
export default function SurahReader() {
  const params = useLocalSearchParams<{ n: string; ayah?: string }>();
  const n = Math.min(114, Math.max(1, Number(params.n) || 1));
  return <SurahView n={n} target={params.ayah ? Number(params.ayah) : 0} />;
}
