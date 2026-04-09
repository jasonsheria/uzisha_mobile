import { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/utils/supabase';
import * as Linking from 'expo-linking';

export function useForceUpdateCheck() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [message, setMessage] = useState('');
  const [obsoleteDate, setObsoleteDate] = useState<string | null>(null);

  useEffect(() => {
    console.log('[FORCE UPDATE] Hook mounted');
    const checkVersion = async () => {
      const platform = Platform.OS;
      const currentVersion =
        Constants.expoConfig?.version ||
        Constants.manifest?.version ||
        (Constants as any).manifest2?.version ||
        '0.0.0';
      const { data, error } = await supabase
        .from('app_versions')
        .select('*')
        .eq('platform', platform)
        .order('created_at', { ascending: false })
        .limit(1);
      if (error || !data || data.length === 0) return;
      const minVersion = data[0].min_version;
      const forceUpdate = data[0].force_update;
      const msg = data[0].message ||
        "Une nouvelle version de l'application est disponible. Veuillez mettre à jour pour continuer.";
      const obsolete = data[0].obsolete_date || null;
      // DEBUG LOGS
      console.log('[FORCE UPDATE] platform:', platform);
      console.log('[FORCE UPDATE] currentVersion:', currentVersion);
      console.log('[FORCE UPDATE] minVersion:', minVersion);
      console.log('[FORCE UPDATE] forceUpdate:', forceUpdate);
      console.log('[FORCE UPDATE] data:', data);
      if (forceUpdate && compareVersions(currentVersion, minVersion) < 0) {
        setIsBlocked(true);
        setMessage(msg);
        setObsoleteDate(obsolete);
      }
    };
    checkVersion();
  }, []);

  return { isBlocked, message, obsoleteDate };
}

// Compare deux versions semver. Retourne -1 si v1 < v2, 0 si égal, 1 si v1 > v2
function compareVersions(v1: string, v2: string) {
  const a = v1.split('.').map(Number);
  const b = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const n1 = a[i] || 0;
    const n2 = b[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}
