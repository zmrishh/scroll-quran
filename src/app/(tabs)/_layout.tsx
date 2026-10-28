import { Redirect } from 'expo-router';
import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';

import { BottomBar, TabButton } from '@/components/tab-bar';
import { useApp } from '@/store/app-store';

export default function TabsLayout() {
  const onboarded = useApp((s) => s.onboarded);
  const signedIn = useApp((s) => !!s.account);
  if (!onboarded) return <Redirect href="/onboarding" />;
  if (!signedIn) return <Redirect href="/sign-in" />;

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
