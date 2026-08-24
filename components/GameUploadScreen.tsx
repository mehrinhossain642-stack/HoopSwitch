import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useCallback, useMemo, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import * as api from '../lib/api';
import type { BoxScorePreview, BoxScoreRowResult, BoxScoreRowStatus } from '../lib/api';
import { useSession } from '../lib/session';
import { FIELD_LABELS, SAMPLE_SHEET, parseStatSheet, type SheetField } from '../lib/statSheet';
import { useThemeColors } from '../lib/theme';
import { errorMessage } from '../lib/useApi';
import { useGoBack } from '../lib/useGoBack';
import { DetailHeader } from './AppHeader';
import { Button } from './Button';
import { Card } from './Card';
import { ConfirmDialog } from './ConfirmDialog';
import { Screen, useContentContainerStyle } from './Screen';
import { EmptyState, InlineError } from './ScreenState';
import { SectionTitle } from './SectionTitle';
import { TextField } from './TextField';
import { Touchable } from './Touchable';

const STATUS_ICON: Record<BoxScoreRowStatus, keyof typeof Ionicons.glyphMap> = {
  matched: 'checkmark-circle',
  unmatched: 'help-circle',
  ambiguous: 'alert-circle',
  invalid: 'close-circle',
};

const TALLY_TEXT = {
  good: 'text-good',
  slate: 'text-slate',
  partial: 'text-partial',
  danger: 'text-danger',
} as const;

/**
 * Uploads one game's box score.
 *
 * Counting stats, not averages: PPG/RPG/APG/FG% are derived server-side from
 * approved games, so a coach enters what happened and the maths follows. A
 * coach's upload lands pending an admin's review and moves nobody's ranking until
 * then — the screen says so before and after submitting, since "saved" and "live"
 * are different things here.
 */
export function GameUploadScreen({ backTo }: { backTo: string }) {
  const { requireToken, user } = useSession();
  const colors = useThemeColors();
  const goBack = useGoBack(backTo as never);
  const contentStyle = useContentContainerStyle({ measure: 'wide', paddingTop: 18 });

  const isAdmin = user?.role === 'admin';

  const [playedOn, setPlayedOn] = useState('');
  const [opponent, setOpponent] = useState('');
  const [teamId, setTeamId] = useState('');
  const [raw, setRaw] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BoxScorePreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState<{ count: number; status: string } | null>(null);

  const parsed = useMemo(() => (raw.trim() ? parseStatSheet(raw) : null), [raw]);

  // Any edit invalidates a preview computed from older input.
  const invalidate = useCallback(() => {
    setPreview(null);
    setSaved(null);
    setError(null);
  }, []);

  const setInput = useCallback(
    (next: string, name: string | null = null) => {
      setRaw(next);
      setFileName(name);
      invalidate();
    },
    [invalidate]
  );

  const upload = useCallback(
    () => ({
      played_on: playedOn.trim(),
      opponent: opponent.trim(),
      rows: parsed?.rows ?? [],
      ...(isAdmin && teamId.trim() ? { team_id: Number(teamId.trim()) } : {}),
    }),
    [playedOn, opponent, parsed, isAdmin, teamId]
  );

  const pickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/plain', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;

      // Web hands back a blob URI that fetch can read; on device the file is on
      // disk and needs FileSystem.
      const text =
        Platform.OS === 'web'
          ? await (await fetch(asset.uri)).text()
          : await FileSystem.readAsStringAsync(asset.uri);

      setInput(text, asset.name ?? 'boxscore.csv');
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }, [setInput]);

  const runPreview = useCallback(async () => {
    if (!parsed || parsed.error) return;
    setError(null);
    setBusy(true);
    try {
      setPreview(await api.previewGame(requireToken(), upload()));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }, [parsed, requireToken, upload]);

  const commit = useCallback(async () => {
    setBusy(true);
    try {
      const result = await api.createGame(requireToken(), upload());
      setSaved({ count: result.summary.matched, status: result.game.status });
      setConfirming(false);
    } catch (caught) {
      setError(errorMessage(caught));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }, [requireToken, upload]);

  const matchedRows = preview?.rows.filter((r) => r.status === 'matched') ?? [];
  const gameReady = playedOn.trim().length > 0 && opponent.trim().length > 0;

  return (
    <Screen edges={[]}>
      <DetailHeader onBack={goBack} title="Upload a game" />

      <ScrollView contentContainerStyle={contentStyle} keyboardShouldPersistTaps="handled">
        {error ? <InlineError message={error} /> : null}

        {saved ? (
          <Card
            className={`mb-4 ${
              saved.status === 'approved' ? 'border-good/30 bg-good-soft' : 'border-partial/30 bg-partial-soft'
            }`}>
            <View className="flex-row items-center">
              <Ionicons
                name={saved.status === 'approved' ? 'checkmark-circle' : 'time-outline'}
                size={20}
                color={saved.status === 'approved' ? colors.good : colors.partial}
              />
              <Text
                className={`font-sans-bold ml-2 flex-1 text-[14px] ${
                  saved.status === 'approved' ? 'text-good' : 'text-partial'
                }`}>
                {saved.status === 'approved'
                  ? `Game saved · ${saved.count} players updated`
                  : `Sent for approval · ${saved.count} players`}
              </Text>
            </View>
            <Text className="font-sans mt-1.5 text-[12px] leading-[17px] text-slate">
              {saved.status === 'approved'
                ? 'Averages have been recalculated from this game.'
                : "An admin has to approve it before it counts toward anyone's averages. Nothing has changed yet."}
            </Text>
          </Card>
        ) : null}

        {/* ---------- 1. Which game ---------- */}
        <SectionTitle title="1 · Which game" className="mb-2.5" />
        <Card>
          <TextField
            label="Date played"
            required
            value={playedOn}
            onChangeText={(next) => {
              setPlayedOn(next);
              invalidate();
            }}
            placeholder="2026-02-14"
            helper="Format: YYYY-MM-DD"
            icon="calendar-outline"
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
          />
          <TextField
            label="Opponent"
            required
            value={opponent}
            onChangeText={(next) => {
              setOpponent(next);
              invalidate();
            }}
            placeholder="Queen's Gaels"
            icon="shield-outline"
            autoCapitalize="words"
          />
          {isAdmin ? (
            <TextField
              label="Team ID"
              required
              value={teamId}
              onChangeText={(next) => {
                setTeamId(next);
                invalidate();
              }}
              placeholder="1"
              helper="Admins upload on a team's behalf — take the ID from the Teams tab."
              icon="people-outline"
              keyboardType="number-pad"
            />
          ) : null}
        </Card>

        {/* ---------- 2. Box score ---------- */}
        <SectionTitle title="2 · Box score" className="mb-2.5 mt-6" />
        <Card>
          <Text className="font-sans text-[13px] leading-[19px] text-slate">
            One line per player, with the counting stats from this game — not season averages.
            Copy the cells out of Google Sheets or Excel, or choose a CSV. Include a header row
            with an <Text className="font-sans-bold text-ink">Email</Text> or{' '}
            <Text className="font-sans-bold text-ink">Jersey</Text> column.
          </Text>

          <TextField
            label="Box score rows"
            value={raw}
            onChangeText={(next) => setInput(next)}
            placeholder={SAMPLE_SHEET}
            multiline
            autoCapitalize="none"
          />

          <View className="flex-row items-center">
            <Button
              label={fileName ?? 'Choose CSV file'}
              variant="secondary"
              size="sm"
              icon="document-attach-outline"
              onPress={pickFile}
              fullWidth={false}
            />
            {raw.length > 0 ? (
              <Touchable
                onPress={() => setInput('')}
                accessibilityRole="button"
                accessibilityLabel="Clear"
                scaleTo={1}
                dimTo={0.6}
                className="ml-3 h-9 justify-center px-2">
                <Text className="font-sans-semibold text-[13px] text-slate">Clear</Text>
              </Touchable>
            ) : null}
          </View>
        </Card>

        {/* ---------- 3. Detected columns ---------- */}
        {parsed ? (
          <>
            <SectionTitle title="3 · Columns detected" className="mb-2.5 mt-6" />
            {parsed.error ? (
              <Card className="border-danger/30 bg-danger-soft">
                <View className="flex-row">
                  <Ionicons name="alert-circle" size={18} color={colors.danger} />
                  <Text className="font-sans-medium ml-2 flex-1 text-[13px] leading-[19px] text-danger">
                    {parsed.error}
                  </Text>
                </View>
              </Card>
            ) : (
              <Card>
                <Text className="font-stat text-[14px] tracking-eyebrow text-slate">
                  {parsed.rows.length} {parsed.rows.length === 1 ? 'PLAYER' : 'PLAYERS'} ·{' '}
                  {parsed.delimiter === 'tab' ? 'TAB-SEPARATED' : 'COMMA-SEPARATED'}
                </Text>

                <View className="mt-3 flex-row flex-wrap">
                  {(Object.keys(parsed.mapping) as SheetField[]).map((field) => (
                    <View
                      key={field}
                      className="mb-2 mr-2 flex-row items-center rounded-full bg-mist px-2.5 py-1">
                      <Ionicons name="checkmark" size={12} color={colors.good} />
                      <Text className="font-sans-medium ml-1.5 text-[11px] text-ink">
                        {FIELD_LABELS[field]}
                      </Text>
                      <Text className="font-sans ml-1.5 text-[11px] text-slate">
                        ← {parsed.mapping[field]}
                      </Text>
                    </View>
                  ))}
                </View>

                {parsed.ignored.length > 0 ? (
                  <Text className="font-sans mt-1 text-[12px] leading-[17px] text-slate">
                    Ignored: {parsed.ignored.join(', ')}
                  </Text>
                ) : null}

                <Button
                  label="Check against players"
                  icon="search"
                  loading={busy && !preview}
                  disabled={!gameReady}
                  onPress={runPreview}
                  className="mt-4"
                />
                {!gameReady ? (
                  <Text className="font-sans mt-2 text-center text-[11px] text-slate">
                    Add the date and opponent first.
                  </Text>
                ) : null}
              </Card>
            )}
          </>
        ) : null}

        {/* ---------- 4. Review ---------- */}
        {preview ? (
          <>
            <SectionTitle title="4 · Review before saving" className="mb-2.5 mt-6" />

            {preview.game_errors.length > 0 ? (
              <InlineError message={preview.game_errors.join(' · ')} />
            ) : null}

            <View className="mb-3 flex-row flex-wrap">
              <Tally label="Will be logged" value={preview.summary.matched} tone="good" />
              <Tally label="Not found" value={preview.summary.unmatched} tone="slate" />
              <Tally label="Ambiguous" value={preview.summary.ambiguous} tone="partial" />
              <Tally label="Bad data" value={preview.summary.invalid} tone="danger" />
            </View>

            <Card bare>
              {preview.rows.map((row, index) => (
                <ResultRow
                  key={`${row.index}-${row.identifier}`}
                  row={row}
                  last={index === preview.rows.length - 1}
                />
              ))}
            </Card>

            {preview.summary.matched > 0 && !saved ? (
              <>
                <Button
                  label={
                    preview.lands_as === 'approved'
                      ? `Save game · ${preview.summary.matched} players`
                      : `Send for approval · ${preview.summary.matched} players`
                  }
                  size="lg"
                  onPress={() => setConfirming(true)}
                  className="mt-4"
                />
                <Text className="font-sans mt-2 text-center text-[11px] leading-[16px] text-slate">
                  {preview.lands_as === 'approved'
                    ? 'Saved as approved, because admins review these.'
                    : "Averages won't change until an admin approves it."}
                </Text>
              </>
            ) : null}

            {preview.summary.matched === 0 ? (
              <View className="mt-3">
                <EmptyState
                  icon="person-outline"
                  title="No lines matched a player"
                  body="Check that the email or jersey column matches the accounts you expect."
                />
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={confirming}
        icon={preview?.lands_as === 'approved' ? 'checkmark-circle-outline' : 'time-outline'}
        busy={busy}
        title={
          preview?.lands_as === 'approved'
            ? `Log this game for ${matchedRows.length} players?`
            : `Send this game for approval?`
        }
        body={
          preview?.lands_as === 'approved'
            ? `Averages will be recalculated from it straight away. ${namesFor(matchedRows)}`
            : `An admin reviews it before it counts toward anyone's averages. ${namesFor(matchedRows)}`
        }
        confirmLabel={preview?.lands_as === 'approved' ? 'Log game' : 'Send'}
        cancelLabel="Cancel"
        onConfirm={commit}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}

function namesFor(rows: BoxScoreRowResult[]): string {
  const names = rows.map((r) => r.player_name).filter(Boolean) as string[];
  if (names.length === 0) return '';
  if (names.length <= 4) return `Players: ${names.join(', ')}.`;
  return `Players: ${names.slice(0, 4).join(', ')} and ${names.length - 4} more.`;
}

function Tally({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof TALLY_TEXT;
}) {
  return (
    <View className="mb-2 mr-2 flex-row items-center rounded-full bg-surface px-3 py-1.5">
      <Text className={`font-stat-bold text-[17px] tracking-stat ${TALLY_TEXT[tone]}`}>
        {value}
      </Text>
      <Text className="font-sans-medium ml-1.5 text-[12px] text-slate">{label}</Text>
    </View>
  );
}

const LINE_ORDER = ['pts', 'reb', 'ast', 'fgm', 'fga', 'minutes'] as const;
const LINE_SHORT: Record<string, string> = {
  pts: 'PTS',
  reb: 'REB',
  ast: 'AST',
  fgm: 'FGM',
  fga: 'FGA',
  minutes: 'MIN',
};

function ResultRow({ row, last }: { row: BoxScoreRowResult; last: boolean }) {
  const colors = useThemeColors();
  const glyph =
    row.status === 'matched'
      ? colors.good
      : row.status === 'ambiguous'
        ? colors.partial
        : row.status === 'invalid'
          ? colors.danger
          : colors.slate;

  const shown = LINE_ORDER.filter((f) => row.stats?.[f] !== undefined);

  return (
    <View className={`flex-row items-start px-4 py-3 ${last ? '' : 'border-b border-border'}`}>
      <Ionicons name={STATUS_ICON[row.status]} size={17} color={glyph} style={{ marginTop: 1 }} />

      <View className="ml-3 flex-1">
        <Text className="font-sans-semibold text-[13px] text-ink" numberOfLines={1}>
          {row.player_name ?? row.identifier}
        </Text>

        {row.player_name ? (
          <Text className="font-sans mt-0.5 text-[11px] text-slate" numberOfLines={1}>
            {row.identifier}
          </Text>
        ) : null}

        {row.message ? (
          <Text className="font-sans mt-1 text-[11px] leading-[16px] text-slate">
            {row.message}
          </Text>
        ) : null}

        {shown.length > 0 ? (
          <View className="mt-1.5 flex-row flex-wrap">
            {shown.map((field) => (
              <View key={field} className="mr-2.5 flex-row items-center">
                <Text className="font-sans-semibold text-[10px] tracking-eyebrow text-slate">
                  {LINE_SHORT[field]}
                </Text>
                <Text className="font-stat-bold ml-1 text-[15px] tracking-stat text-ink">
                  {row.stats[field]}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
