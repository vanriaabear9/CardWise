import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

import {
  AppButton,
  AppTextInput,
  Card,
  EmptyState,
  ScreenContainer,
  ScreenHeader,
  Section,
} from '@/components';
import { colors, iconSize, spacing, typography } from '@/constants';
import type { IconName } from '@/types';

/** Placeholder categories for the "Explore Topics" section (no real content yet). */
const EXPLORE_CATEGORIES: { title: string; icon: IconName }[] = [
  { title: 'Science', icon: 'flask-outline' },
  { title: 'History', icon: 'library-outline' },
  { title: 'Languages', icon: 'language-outline' },
  { title: 'Math', icon: 'calculator-outline' },
];

export function HomeScreen() {
  const router = useRouter();

  return (
    <ScreenContainer>
      <ScreenHeader title="CardWise" subtitle="Learn with flashcards, anytime — even offline." />

      <Section title="Explore Topics" icon="compass-outline" description="Browse ready-made topics.">
        <View style={styles.grid}>
          {EXPLORE_CATEGORIES.map((category) => (
            <Card key={category.title} style={styles.categoryCard}>
              <Ionicons name={category.icon} size={iconSize.lg} color={colors.secondary} />
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </Card>
          ))}
        </View>
      </Section>

      <Section title="My Topics" icon="albums-outline" description="Topics you have created.">
        <EmptyState
          icon="albums-outline"
          title="No topics yet"
          message="Create your first topic to start studying."
        >
          <AppButton
            label="Create a topic"
            icon="add"
            onPress={() => router.navigate('/create')}
          />
        </EmptyState>
      </Section>

      <Section title="Search Topics" icon="search-outline">
        <AppTextInput icon="search-outline" placeholder="Search topics..." returnKeyType="search" />
      </Section>

      <Section title="Recently Played" icon="play-circle-outline">
        <EmptyState
          icon="play-circle-outline"
          title="Nothing played yet"
          message="Topics you play will appear here."
        />
      </Section>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    flexGrow: 1,
    flexBasis: '40%',
  },
  categoryTitle: typography.subheading,
});
