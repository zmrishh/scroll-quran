import { Redirect } from 'expo-router';
import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';

import { BottomBar, TabButton } from '@/components/tab-bar';
import { useApp } from '@/store/app-store';

export default function TabsLayout() {
  // Signing in is optional (App Store guideline 5.1.1(v)): only onboarding stands before the app.
  const onboarded = useApp((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
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
  );
}
