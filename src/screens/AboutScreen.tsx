import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { BackHeader, Card, ScreenContainer } from '@/components';
import { colors, radius, spacing, typography } from '@/constants';

/**
 * App information. The version comes from app.json. No developer name is shown because
 * none is recorded in the project (nothing is invented).
 */
export function AboutScreen() {
  const router = useRouter();
  const appName = Constants.expoConfig?.name ?? 'CardWise';
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.dismissTo('/profile');
  };

  return (
    <ScreenContainer>
      <BackHeader label="Profile" title="About CardWise" onBack={goBack} />

      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="albums" size={44} color={colors.highlight} />
        </View>
        <Text style={styles.name}>{appName}</Text>
        <Text style={styles.tagline}>Create. Match. Learn.</Text>
      </View>

      <Card>
        <Text style={styles.body}>
          CardWise is an offline flashcard app that turns studying into a matching game. Create
          topics with terms and descriptions, drag each description onto the right term, and
          track your progress over time.
        </Text>
        <Text style={styles.body}>
          Everything is stored privately on your device. There are no accounts and no internet
          connection is needed.
        </Text>
      </Card>

      <Card>
        <InfoRow label="Version" value={version} />
        <InfoRow label="Storage" value="On this device (SQLite)" />
        <InfoRow label="Internet" value="Not required" />
      </Card>
    </ScreenContainer>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginBottom: spacing.sm,
  },
  name: typography.title,
  tagline: {
    ...typography.subheading,
    color: colors.highlight,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowLabel: typography.label,
  rowValue: {
    ...typography.body,
    flexShrink: 1,
    textAlign: 'right',
  },
});
