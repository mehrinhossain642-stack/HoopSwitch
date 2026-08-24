import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useCallback, useMemo, useState } from 'react';
import { Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { DetailHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Screen, useContentContainerStyle } from '../../components/Screen';
import { EmptyState, InlineError } from '../../components/ScreenState';
import { SectionTitle } from '../../components/SectionTitle';
import { Touchable } from '../../components/Touchable';
import * as api from '../../lib/api';
import type { StatUploadResult, StatUploadRow, StatUploadStatus } from '../../lib/api';
import { useSession } from '../../lib/session';
import { useThemeColors } from '../../lib/theme';
import { FIELD_LABELS, SAMPLE_SHEET, parseStatSheet, type SheetField } from '../../lib/statSheet';
import { errorMessage } from '../../lib/useApi';
import { useGoBack } from '../../lib/useGoBack';

const STATUS_STYLE: Record<StatUploadStatus, { icon: keyof typeof Ionicons.glyphMap; tone: string }> =
  {
    matched: { icon: 'checkmark-circle', tone: 'good' },
    unmatched: { icon: 'help-circle', tone: 'slate' },
    ambiguous: { icon: 'alert-circle', tone: 'partial' },
    invalid: { icon: 'close-circle', tone: 'danger' },
  };

const STAT_ORDER = ['ppg', 'rpg', 'apg', 'fg_pct'] as const;
const STAT_SHORT: Record<(typeof STAT_ORDER)[number], string> = {
  ppg: 'PPG',
  rpg: 'RPG',
  apg: 'APG',
  fg_pct: 'FG%',
};

/**
 * Statsheet import for coaches.
 *
 * Paste covers all three sources the request named: copying cells out of Google
 * Sheets or Excel puts tab-separated text on the clipboard, and a CSV export is
 * comma-separated, so the parser sniffs the delimiter rather than asking.
 *
 * The preview is mandatory before writing. These uploads replace figures players
 * reported themselves, and those figures rank the player for *every* team — so the
 * coach confirms a named list, not a row count.
 */
export default function StatSheetUpload() {
  const { requireToken } = useSession();
  const colors = useThemeColors();
  const goBack = useGoBack('/coach/profile');
  const contentStyle = useContentContainerStyle({ measure: 'wide', paddingTop: 18 });

  const [raw, setRaw] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<StatUploadResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [applied, setApplied] = useState<number | null>(null);

  const parsed = useMemo(() => (raw.trim() ? parseStatSheet(raw) : null), [raw]);

  // Any edit invalidates a preview that was computed from older text.
  const setInput = useCallback((next: string, name: string | null = null) => {
    setRaw(next);
    setFileName(name);
    setPreview(null);
    setApplied(null);
    setError(null);
  }, []);

  const pickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        // Some pickers report CSV as text/plain or octet-stream, so accept a
        // spread rather than rejecting a valid file on a wrong MIME type.
        type: ['text/csv', 'text/plain', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      // Web hands back a blob/data URI that fetch can read; on device the file
      // lives on disk and needs FileSystem.
      const text =
        Platform.OS === 'web'
          ? await (await fetch(asset.uri)).text()
          : await FileSystem.readAsStringAsync(asset.uri);

      setInput(text, asset.name ?? 'statsheet.csv');
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }, [setInput]);

  const runPreview = useCallback(async () => {
    if (!parsed || parsed.error) return;
    setError(null);
    setBusy(true);
    try {
      setPreview(await api.previewStatUpload(requireToken(), parsed.rows));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }, [parsed, requireToken]);

  const commit = useCallback(async () => {
    if (!parsed || parsed.error) return;
    setBusy(true);
    try {
      const result = await api.commitStatUpload(requireToken(), parsed.rows);
      setPreview(result);
      setApplied(result.applied ?? 0);
      setConfirming(false);
    } catch (caught) {
      setError(errorMessage(caught));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }, [parsed, requireToken]);

  const matchedRows = preview?.rows.filter((r) => r.status === 'matched') ?? [];

  return (
    <Screen edges={[]}>
      <DetailHeader onBack={goBack} title="Upload statsheet" />

      <ScrollView contentContainerStyle={contentStyle} keyboardShouldPersistTaps="handled">
        {error ? <InlineError message={error} /> : null}

        {applied !== null ? (
          <Card className="mb-4 border-good/30 bg-good-soft">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color={colors.good} />
              <Text className="font-sans-bold ml-2 flex-1 text-[14px] text-good">
                Updated {applied} {applied === 1 ? 'player' : 'players'}
              </Text>
            </View>
            <Text className="font-sans mt-1.5 text-[12px] leading-[17px] text-slate">
              Their profiles now show these numbers, and every team&apos;s fit score has been
              recalculated from them.
            </Text>
          </Card>
        ) : null}

        {/* ---------- 1. Input ---------- */}
        <SectionTitle title="1 · Paste or upload" className="mb-2.5" />
        <Card>
          <Text className="font-sans text-[13px] leading-[19px] text-slate">
            Copy the cells straight out of Google Sheets or Excel and paste below — or choose a
            CSV file. Include a header row with an <Text className="font-sans-bold text-ink">
              Email
            </Text>{' '}
            or <Text className="font-sans-bold text-ink">Jersey</Text> column so each row can be
            matched to a player.
          </Text>

          <TextInput
            value={raw}
            onChangeText={(next) => setInput(next)}
            multiline
            placeholder={SAMPLE_SHEET}
            placeholderTextColor={colors.slateSoft}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Statsheet contents"
            className="font-sans mt-3 rounded-btn border border-border-strong bg-mist px-3 py-2.5 text-[13px] text-ink"
            style={{ minHeight: 132, textAlignVertical: 'top' }}
          />

          <View className="mt-3 flex-row items-center">
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

        {/* ---------- 2. Detected mapping ---------- */}
        {parsed ? (
          <>
            <SectionTitle title="2 · Columns detected" className="mb-2.5 mt-6" />
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
                  {parsed.rows.length} {parsed.rows.length === 1 ? 'ROW' : 'ROWS'} ·{' '}
                  {parsed.delimiter === 'tab' ? 'TAB-SEPARATED' : 'COMMA-SEPARATED'}
                </Text>

                <View className="mt-3">
                  {(Object.keys(parsed.mapping) as SheetField[]).map((field) => (
                    <View
                      key={field}
                      className="flex-row items-center justify-between border-b border-border py-2">
                      <Text className="font-sans text-[13px] text-slate">
                        {FIELD_LABELS[field]}
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="font-sans-semibold text-[13px] text-ink">
                          {parsed.mapping[field]}
                        </Text>
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={colors.good}
                          style={{ marginLeft: 8 }}
                        />
                      </View>
                    </View>
                  ))}
                </View>

                {parsed.ignored.length > 0 ? (
                  <Text className="font-sans mt-3 text-[12px] leading-[17px] text-slate">
                    Ignored: {parsed.ignored.join(', ')}
                  </Text>
                ) : null}

                <Button
                  label="Check against players"
                  icon="search"
                  loading={busy && !preview}
                  onPress={runPreview}
                  className="mt-4"
                />
              </Card>
            )}
          </>
        ) : null}

        {/* ---------- 3. Match results ---------- */}
        {preview ? (
          <>
            <SectionTitle title="3 · Review before saving" className="mb-2.5 mt-6" />

            <View className="mb-3 flex-row flex-wrap">
              <Tally label="Will update" value={preview.summary.matched} tone="good" />
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

            {preview.summary.matched > 0 && applied === null ? (
              <Button
                label={`Overwrite stats for ${preview.summary.matched} ${
                  preview.summary.matched === 1 ? 'player' : 'players'
                }`}
                size="lg"
                onPress={() => setConfirming(true)}
                className="mt-4"
              />
            ) : null}

            {preview.summary.matched === 0 ? (
              <View className="mt-3">
                <EmptyState
                  icon="person-outline"
                  title="Nothing matched"
                  body="No row resolved to a player, so there's nothing to save. Check that the email or jersey column matches the accounts you expect."
                />
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={confirming}
        icon="cloud-upload-outline"
        destructive
        busy={busy}
        title={`Overwrite ${matchedRows.length} ${
          matchedRows.length === 1 ? 'profile' : 'profiles'
        }?`}
        body={
          `This replaces the numbers these players reported themselves, and re-scores them for ` +
          `every team — not just yours. ${namesFor(matchedRows)}`
        }
        confirmLabel="Overwrite stats"
        cancelLabel="Cancel"
        onConfirm={commit}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}

/** Names the affected players, so the confirmation isn't just a count. */
function namesFor(rows: StatUploadRow[]): string {
  const names = rows.map((r) => r.player_name).filter(Boolean) as string[];
  if (names.length === 0) return '';
  if (names.length <= 4) return `Affects: ${names.join(', ')}.`;
  return `Affects: ${names.slice(0, 4).join(', ')} and ${names.length - 4} more.`;
}

/**
 * Classes are written out in full rather than interpolated. Tailwind scans source
 * text for literal class names, so a template like `text-${tone}` produces no CSS
 * at all — and NativeWind then drops it silently.
 */
const TALLY_TEXT = {
  good: 'text-good',
  slate: 'text-slate',
  partial: 'text-partial',
  danger: 'text-danger',
} as const;

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

function ResultRow({ row, last }: { row: StatUploadRow; last: boolean }) {
  const colors = useThemeColors();
  const style = STATUS_STYLE[row.status];
  const glyph =
    style.tone === 'good'
      ? colors.good
      : style.tone === 'partial'
        ? colors.partial
        : style.tone === 'danger'
          ? colors.danger
          : colors.slate;

  const changed = STAT_ORDER.filter((f) => row.changes[f] !== undefined);

  return (
    <View className={`flex-row items-start px-4 py-3 ${last ? '' : 'border-b border-border'}`}>
      <Ionicons name={style.icon} size={17} color={glyph} style={{ marginTop: 1 }} />

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

        {changed.length > 0 ? (
          <View className="mt-1.5 flex-row flex-wrap">
            {changed.map((field) => (
              <View key={field} className="mr-2 flex-row items-center">
                <Text className="font-sans-semibold text-[10px] tracking-eyebrow text-slate">
                  {STAT_SHORT[field]}
                </Text>
                <Text className="font-stat-bold ml-1 text-[15px] tracking-stat text-ink">
                  {row.changes[field]}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
