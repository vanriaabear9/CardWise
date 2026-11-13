import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

import { BackHeader, Card, ScreenContainer } from '@/components';
import { colors, iconSize, radius, spacing, typography } from '@/constants';
import type { IconName } from '@/types';
import { XP_PER_LEVEL } from '@/utils/playerStats';

interface HelpTopic {
  icon: IconName;
  title: string;
  points: string[];
}

const HELP: HelpTopic[] = [
  {
    icon: 'sparkles-outline',
    title: 'What is CardWise?',
    points: [
      'CardWise helps you learn by matching terms with their descriptions, like a card game.',
      'Everything works offline and stays on your phone. No account is needed.',
    ],
  },
  {
    icon: 'compass-outline',
    title: 'Exploring topics',
    points: [
      'On Home, "Explore Topics" has ready-made topics. "My Topics" has the ones you made.',
      'Use the search bar to find a topic by its title.',
      'Tap a topic card to start playing it.',
    ],
  },
  {
    icon: 'create-outline',
    title: 'Creating a topic',
    points: [
      'Open the Create tab and give your topic a title (a short description is optional).',
      'Tap Save Topic when you are done. You can edit it later with the pencil button.',
    ],
  },
  {
    icon: 'list-outline',
    title: 'Adding terms and descriptions',
    points: [
      'A term is the word or idea to learn, like "CPU".',
      'Each term can have several descriptions, like "Runs program instructions".',
      'Every description becomes its own card in the game.',
    ],
  },
  {
    icon: 'hand-left-outline',
    title: 'Playing the matching game',
    points: [
      'The description cards are in a pile at the bottom. Use ◀ ▶ to look through them.',
      'Press and drag the top card onto the term it describes.',
      'A wrong card flies back to the pile so you can try again. The game ends when every card is matched.',
    ],
  },
  {
    icon: 'star-outline',
    title: 'How scoring works',
    points: [
      'A card earns 1 point only if you drop it on the right term on your FIRST try.',
      'After a wrong drop that card can no longer score, but you still place it to finish.',
      'Your final score is your points out of the number of descriptions, for example 6/8.',
      `Every point is also 1 XP. Each ${XP_PER_LEVEL} XP raises your player level.`,
    ],
  },
  {
    icon: 'time-outline',
    title: 'Reviewing completed games',
    points: [
      'After a game, tap View Answers to see every correct match and what you tried first.',
      'The History tab lists all finished games. Tap one to see its details and answers.',
      'Past games stay accurate even if you later edit or delete the topic.',
    ],
  },
  {
    icon: 'heart-outline',
    title: 'Favorites',
    points: [
      'Tap the heart on any topic card to add it to your favorites. Tap it again to remove it.',
      'Find them all in Profile → My Favorites, where you can play them right away.',
    ],
  },
];

/** Simple, student-friendly instructions. */
export function HelpScreen() {
  const router = useRouter();
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.dismissTo('/profile');
  };

  return (
    <ScreenContainer>
      <BackHeader label="Profile" title="Help & Instructions" onBack={goBack} />
      {HELP.map((topic) => (
        <Card key={topic.title}>
          <View style={styles.titleRow}>
            <View style={styles.icon}>
              <Ionicons name={topic.icon} size={iconSize.md} color={colors.highlight} />
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {topic.title}
            </Text>
          </View>
          {topic.points.map((point) => (
            <View key={point} style={styles.point}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  title: {
    ...typography.subheading,
    flex: 1,
  },
  point: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bullet: {
    ...typography.body,
    color: colors.secondary,
  },
  pointText: {
    ...typography.body,
    flex: 1,
    color: colors.textSecondary,
    lineHeight: 21,
  },
});
