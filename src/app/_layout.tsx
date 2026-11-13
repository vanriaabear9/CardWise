import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';

import { AppButton } from '@/components';
import { colors, spacing, typography } from '@/constants';
import { DATABASE_NAME, initializeDatabase } from '@/database/database';
import { runDatabaseSelfTest } from '@/database/selfTest';
import { navigationTheme } from '@/navigation';

/**
 * Set to true to run the database self-test on every app start during development.
 * It uses a separate test database and prints results to the `npx expo start` terminal.
 * Never runs in production builds.
 */
const RUN_DATABASE_SELF_TEST = false;

/**
 * Root layout: applies the dark theme, opens the local database, and hosts the tabs.
 * SQLiteProvider runs initializeDatabase (foreign keys + migrations) before any screen renders.
 */
export default function RootLayout() {
  useEffect(() => {
    if (__DEV__ && RUN_DATABASE_SELF_TEST) {
      void runDatabaseSelfTest();
    }
  }, []);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SQLiteProvider>
    </ThemeProvider>
  );
}

/** Shown instead of the app if something fails at startup (e.g. the database can't open). */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaView style={styles.errorScreen}>
      <StatusBar style="light" />
      <View style={styles.errorContent}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
        <AppButton label="Try again" icon="refresh" onPress={retry} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  errorScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  errorTitle: typography.heading,
  errorMessage: typography.caption,
});
