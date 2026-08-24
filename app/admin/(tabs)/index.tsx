import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { AppHeader, HeaderIconButton } from '../../../components/AppHeader';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { Screen, useContentContainerStyle } from '../../../components/Screen';
import { EmptyState, InlineError, ScreenError } from '../../../components/ScreenState';
import { Segmented } from '../../../components/Segmented';
import { FeedSkeleton } from '../../../components/Skeleton';
import { Reveal } from '../../../components/Touchable';
import * as api from '../../../lib/api';
import type { ApiGame, GameStatus } from '../../../lib/api';
import { useSession } from '../../../lib/session';
import { relativeTime } from '../../../lib/time';
import { useThemeColors } from '../../../lib/theme';
import { errorMessage, useApiData } from '../../../lib/useApi';

const FILTERS = [
  { value: 'pending' as GameStatus, label: 'Pending' },
  { value: 'approved' as GameStatus, label: 'Approved' },
  { value: 'rejected' as GameStatus, label: 'Rejected' },
];

/**
 * The admin review queue.
 *
 * A coach's upload sits here until it's decided. Approving folds the game into
 * every listed player's averages — which changes how every *other* team ranks
 * them — so each game shows its full lines rather than just a count. Reviewing
 * without the numbers would only be rubber-stamping.
 */
export default function AdminApprovals() {
  const router = useRouter();
  const { requireToken, token } = useSession();
  const colors = useThemeColors();
  const contentStyle = useContentContainerStyle({ measure: 'wide', paddingTop: 16 });

  const [filter, setFilter] = useState<GameStatus>('pending');
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<ApiGame | null>(null);

  const feed = useApiData(() => api.listGames(requireToken(), filter), [token, filter]);

  const decide = useCallback(
    async (game: ApiGame, status: 'approved' | 'rejected') => {
      if (pendingId !== null) return;
      setError(null);
      setPendingId(game.id);
      try {
        await api.reviewGame(requireToken(), game.id, status);
        feed.refetch();
      } catch (caught) {
        setError(errorMessage(caught));
      } finally {
        setPendingId(null);
        setRejecting(null);
      }
    },
    [feed, requireToken, pendingId]
  );

  if (feed.error && !feed.data) {
    return <ScreenError message={feed.error} onRetry={feed.refetch} />;
  }

  const games = feed.data?.games ?? [];
  const loadingFirst = feed.loading && !feed.data;

  const header = (
    <AppHeader
      title="Approvals"
      eyebrow="Admin"
      meta={
        loadingFirst
          ? 'Loading'
          : `${games.length} ${games.length === 1 ? 'game' : 'games'} · ${filter}`
      }
      right={
        <View className="flex-row items-center">
          <HeaderIconButton
            icon="cloud-upload-outline"
            label="Upload a game"
            onPress={() => router.push('/admin/statsheet')}
          />
          <View className="w-2" />
          <HeaderIconButton
            icon="settings-outline"
            label="Settings"
            onPress={() => router.push('/admin/settings')}
          />
        </View>
      }>
      <Segmented segments={FILTERS} value={filter} onChange={setFilter} onDark />
    </AppHeader>
  );

  return (
    <Screen edges={[]}>
      {header}

      {loadingFirst ? (
        <View style={contentStyle}>
          <FeedSkeleton />
        </View>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={contentStyle}
          refreshControl={
            <RefreshControl
              refreshing={feed.loading}
              onRefresh={feed.refetch}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            error ? <InlineError message={error} onRetry={() => setError(null)} /> : null
          }
          renderItem={({ item, index }) => (
            <Reveal index={index}>
              <GameCard
                game={item}
                busy={pendingId === item.id}
                onApprove={() => decide(item, 'approved')}
                onReject={() => setRejecting(item)}
              />
            </Reveal>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={filter === 'pending' ? 'checkmark-done-outline' : 'document-outline'}
              title={filter === 'pending' ? 'Nothing to review' : `No ${filter} games`}
              body={
                filter === 'pending'
                  ? "Coach uploads land here for approval. There's nothing waiting right now."
                  : `No games have been ${filter} yet.`
              }
            />
          }
        />
      )}

      <ConfirmDialog
        visible={rejecting !== null}
        icon="close-circle-outline"
        destructive
        busy={pendingId !== null}
        title="Reject this game?"
        body={
          rejecting
            ? `${rejecting.opponent} on ${rejecting.played_on} won't count toward anyone's ` +
              `averages. ${rejecting.uploaded_by_email ?? 'The uploader'} can correct and resubmit.`
            : ''
        }
        confirmLabel="Reject"
        cancelLabel="Keep pending"
        onConfirm={() => rejecting && decide(rejecting, 'rejected')}
        onCancel={() => setRejecting(null)}
      />
    </Screen>
  );
}

const STATUS_TONE: Record<GameStatus, { fill: string; text: string; label: string }> = {
  pending: { fill: 'bg-partial-soft', text: 'text-partial', label: 'AWAITING REVIEW' },
  approved: { fill: 'bg-good-soft', text: 'text-good', label: 'APPROVED' },
  rejected: { fill: 'bg-danger-soft', text: 'text-danger', label: 'REJECTED' },
};

function GameCard({
  game,
  busy,
  onApprove,
  onReject,
}: {
  game: ApiGame;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const colors = useThemeColors();
  const tone = STATUS_TONE[game.status];

  return (
    <Card bare className="mb-3">
      <View className="p-4">
        <View className="flex-row items-start">
          <View className="flex-1 pr-3">
            <Text className="font-display text-[16px] text-ink" numberOfLines={1}>
              {game.team_name} vs {game.opponent}
            </Text>
            <Text className="font-sans mt-0.5 text-[11px] text-slate">
              {game.played_on} · {game.player_count}{' '}
              {game.player_count === 1 ? 'player' : 'players'}
            </Text>
          </View>
          <View className={`rounded-full px-2 py-1 ${tone.fill}`}>
            <Text className={`font-stat text-[11px] tracking-eyebrow ${tone.text}`}>
              {tone.label}
            </Text>
          </View>
        </View>

        <View className="mt-2 flex-row items-center">
          <Ionicons name="person-circle-outline" size={14} color={colors.slate} />
          <Text className="font-sans ml-1.5 flex-1 text-[11px] text-slate" numberOfLines={1}>
            {game.uploaded_by_email} ({game.uploaded_by_role})
            {game.reviewed_by_email
              ? ` · reviewed by ${game.reviewed_by_email}${
                  game.reviewed_at ? ` ${relativeTime(game.reviewed_at)}` : ''
                }`
              : ''}
          </Text>
        </View>

        {game.review_note ? (
          <Text className="font-sans mt-1.5 text-[11px] italic text-slate">
            “{game.review_note}”
          </Text>
        ) : null}
      </View>

      {/* The lines being approved. Without these, approval is a rubber stamp. */}
      {game.stats && game.stats.length > 0 ? (
        <View className="border-t border-border bg-bg px-4 py-3">
          <View className="flex-row pb-1.5">
            <Text className="font-sans-semibold flex-1 text-[9px] tracking-eyebrow text-slate">
              PLAYER
            </Text>
            {['MIN', 'FG', 'REB', 'AST', 'PTS'].map((label) => (
              <Text
                key={label}
                className="font-sans-semibold text-center text-[9px] tracking-eyebrow text-slate"
                style={{ width: label === 'FG' ? 48 : 36 }}>
                {label}
              </Text>
            ))}
          </View>

          {game.stats.map((line) => (
            <View key={line.id} className="flex-row items-center py-1">
              <Text className="font-sans-medium flex-1 text-[12px] text-ink" numberOfLines={1}>
                {line.player_name}
              </Text>
              <Cell width={36}>{line.minutes}</Cell>
              <Cell width={48}>{`${line.fgm}-${line.fga}`}</Cell>
              <Cell width={36}>{line.reb}</Cell>
              <Cell width={36}>{line.ast}</Cell>
              <Cell width={36} emphasis>
                {line.pts}
              </Cell>
            </View>
          ))}
        </View>
      ) : null}

      {game.status === 'pending' ? (
        <View className="flex-row border-t border-border bg-bg px-4 py-3">
          <Button
            label="Reject"
            variant="danger"
            size="sm"
            onPress={onReject}
            disabled={busy}
            fullWidth={false}
            className="mr-2 flex-1"
          />
          <Button
            label="Approve"
            size="sm"
            onPress={onApprove}
            loading={busy}
            fullWidth={false}
            className="flex-1"
          />
        </View>
      ) : null}
    </Card>
  );
}

function Cell({
  children,
  width,
  emphasis = false,
}: {
  children: React.ReactNode;
  width: number;
  emphasis?: boolean;
}) {
  return (
    <Text
      className={`font-stat-bold text-center tracking-stat text-ink ${
        emphasis ? 'text-[16px]' : 'text-[14px]'
      }`}
      style={{ width }}>
      {children}
    </Text>
  );
}
