import { Redirect } from 'expo-router';
import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomBar, TabButton } from '@/components/tab-bar';
import { useApp } from '@/store/app-store';
import { TabBarSpace, tabBarSpace } from '@/theme/layout';

export default function TabsLayout() {
  // Signing in is optional (App Store guideline 5.1.1(v)): only onboarding stands before the app.
  const onboarded = useApp((s) => s.onboarded);
  const insets = useSafeAreaInsets();
  if (!onboarded) return <Redirect href="/onboarding" />;

  // The bar floats over the screens, so each one runs on behind it and keeps this much room at its foot.
  return (
    <TabBarSpace.Provider value={tabBarSpace(insets.bottom)}>
      <Tabs>
        <TabSlot style={{ flex: 1 }} />
        <TabList asChild>
          <BottomBar>
            <TabTrigger name="feed" href="/" asChild>
              <TabButton icon="feed" label="Feed" />
            </TabTrigger>
            <TabTrigger name="quran" href="/quran" asChild>
              <TabButton icon="book" label="Quran" />
            </TabTrigger>
            <TabTrigger name="saved" href="/saved" asChild>
              <TabButton icon="bookmark" label="Saved" />
            </TabTrigger>
            <TabTrigger name="you" href="/you" asChild>
              <TabButton icon="user" label="You" />
            </TabTrigger>
          </BottomBar>
        </TabList>
      </Tabs>
    </TabBarSpace.Provider>
  );
}
