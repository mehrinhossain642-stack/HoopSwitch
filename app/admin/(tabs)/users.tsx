import { useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '../../../components/AppHeader';
import { Avatar } from '../../../components/Avatar';
import { Card } from '../../../components/Card';
import {
  Screen,
  useContentContainerStyle,
} from '../../../components/Screen';
import {
  EmptyState,
  ScreenError,
} from '../../../components/ScreenState';
import { Segmented } from '../../../components/Segmented';

import * as api from '../../../lib/api';
import type { UserRole } from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { useThemeColors } from '../../../lib/theme';
import { useApiData } from '../../../lib/useApi';

type UserFilter = 'all' | UserRole;

const FILTERS = [
  { value: 'all' as UserFilter, label: 'All' },
  { value: 'player' as UserFilter, label: 'Athletes' },
  { value: 'coach' as UserFilter, label: 'Coaches' },
  { value: 'parent' as UserFilter, label: 'Parents' },
  { value: 'admin' as UserFilter, label: 'Admins' },
];

const ROLE_LABELS: Record<UserRole, string> = {
  player: 'Athlete',
  coach: 'Coach',
  parent: 'Parent',
  admin: 'Admin',
};

export default function AdminUsers() {
  const { requireToken, token } = useSession();
  const colors = useThemeColors();

  const contentStyle = useContentContainerStyle({
    measure: 'wide',
    paddingTop: 18,
  });

  const [filter, setFilter] =
    useState<UserFilter>('all');

  const [query, setQuery] = useState('');

  const feed = useApiData(
    () =>
      api.listAdminUsers(
        requireToken(),
        filter === 'all' ? undefined : filter
      ),
    [token, filter]
  );

  const users = useMemo(() => {
    const search = query.trim().toLowerCase();
    const allUsers = feed.data?.users ?? [];

    if (!search) {
      return allUsers;
    }

    return allUsers.filter((user) => {
      const name = user.name?.toLowerCase() ?? '';
      const email = user.email.toLowerCase();
      const team = user.team_name?.toLowerCase() ?? '';

      return (
        name.includes(search) ||
        email.includes(search) ||
        team.includes(search)
      );
    });
  }, [feed.data, query]);

  if (feed.error && !feed.data) {
    return (
      <ScreenError
        message={feed.error}
        onRetry={feed.refetch}
      />
    );
  }

  return (
    <Screen edges={[]}>
      <AppHeader
        title="Users"
        eyebrow="Admin"
        meta={`${feed.data?.users.length ?? 0} registered accounts`}
      >
        <Segmented
          segments={FILTERS}
          value={filter}
          onChange={setFilter}
          onDark
        />
      </AppHeader>

      <ScrollView
        contentContainerStyle={contentStyle}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={feed.loading}
            onRefresh={feed.refetch}
            tintColor={colors.primary}
          />
        }
      >
        <View className="mb-4 flex-row items-center rounded-btn border border-border bg-surface px-4">
          <Text className="mr-2 text-[17px] text-slate">
            ⌕
          </Text>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, email, or team"
            placeholderTextColor={colors.slate}
            autoCapitalize="none"
            autoCorrect={false}
            className="font-sans flex-1 py-3 text-[13px] text-ink"
          />
        </View>

        {users.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No matching users"
            body="Try another search or account type."
          />
        ) : (
          users.map((user) => (
            <Card
              key={user.id}
              className="mb-3"
            >
              <View className="flex-row items-center">
                <Avatar
                  name={user.name || user.email}
                  size={42}
                />

                <View className="ml-3 flex-1">
                  <Text className="font-sans-semibold text-[13px] text-ink">
                    {user.name || 'Name not provided'}
                  </Text>

                  <Text className="font-sans mt-0.5 text-[11px] text-slate">
                    {user.email}
                  </Text>

                  {user.team_name ? (
                    <Text className="font-sans mt-1 text-[10px] text-slate">
                      {user.team_name}
                    </Text>
                  ) : null}
                </View>

                <View className="rounded-full bg-primary-soft px-2.5 py-1">
                  <Text className="font-stat text-[10px] tracking-eyebrow text-primary">
                    {ROLE_LABELS[user.role].toUpperCase()}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}