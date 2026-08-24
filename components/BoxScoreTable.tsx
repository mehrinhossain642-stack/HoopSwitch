import { ScrollView, Text, View } from 'react-native';
import type { ApiGameStat } from '../lib/api';
import { useLayout } from '../lib/layout';

/**
 * Season averages over a game-by-game log — a box score, in the order anyone
 * reading one expects: the summary line first, then the games it came from.
 *
 * Averages arrive already derived from the server (PlayerAverages), so this
 * doesn't recompute them; it only totals what it was handed for the footer, and
 * shooting lines are shown as made-attempted so a reader can check the rate
 * themselves.
 */
export function BoxScoreTable({
  games,
  averages,
}: {
  games: ApiGameStat[];
  /** Server-derived season averages shown above the log. */
  averages: { ppg: number; rpg: number; apg: number; fgPct: number; gamesPlayed: number };
}) {
  const { isTablet } = useLayout();

  if (games.length === 0) {
    return (
      <View className="items-center rounded-md border border-dashed border-border-strong bg-surface px-5 py-7">
        <Text className="font-sans text-center text-[12px] leading-[17px] text-slate">
          No games logged yet. Averages below are self-reported until a coach uploads a box score
          and an admin approves it.
        </Text>
      </View>
    );
  }

  // Narrow screens drop the columns a reader can live without, rather than
  // shrinking the type or scrolling horizontally by default.
  const full = isTablet;

  return (
    <View>
      {/* ---- Averages ---- */}
      <View className="rounded-md bg-chrome px-3 py-3.5">
        <Text className="font-stat mb-2.5 text-[13px] tracking-eyebrow text-chrome-text-muted">
          SEASON AVERAGES · {averages.gamesPlayed}{' '}
          {averages.gamesPlayed === 1 ? 'GAME' : 'GAMES'}
        </Text>
        <View className="flex-row">
          <Average label="PPG" value={averages.ppg.toFixed(1)} />
          <Average label="RPG" value={averages.rpg.toFixed(1)} />
          <Average label="APG" value={averages.apg.toFixed(1)} />
          <Average label="FG%" value={`${averages.fgPct.toFixed(1)}`} />
        </View>
      </View>

      {/* ---- Game log ---- */}
      <ScrollView horizontal showsHorizontalScrollIndicator={!full} className="mt-3">
        <View>
          <Row header full>
            <Cell header width={74} align="left">
              DATE
            </Cell>
            <Cell header width={full ? 132 : 96} align="left">
              OPPONENT
            </Cell>
            {full ? <Cell header width={40}>MIN</Cell> : null}
            <Cell header width={58}>FG</Cell>
            {full ? <Cell header width={52}>3P</Cell> : null}
            {full ? <Cell header width={52}>FT</Cell> : null}
            <Cell header width={40}>REB</Cell>
            <Cell header width={40}>AST</Cell>
            {full ? <Cell header width={36}>STL</Cell> : null}
            {full ? <Cell header width={36}>BLK</Cell> : null}
            {full ? <Cell header width={36}>TO</Cell> : null}
            <Cell header width={44}>PTS</Cell>
          </Row>

          {games.map((game, index) => (
            <Row key={game.id} last={index === games.length - 1}>
              <Cell width={74} align="left" muted>
                {formatDate(game.played_on)}
              </Cell>
              <Cell width={full ? 132 : 96} align="left" muted>
                {game.opponent ?? '—'}
              </Cell>
              {full ? <Cell width={40} muted>{game.minutes}</Cell> : null}
              <Cell width={58}>{`${game.fgm}-${game.fga}`}</Cell>
              {full ? <Cell width={52}>{`${game.tpm}-${game.tpa}`}</Cell> : null}
              {full ? <Cell width={52}>{`${game.ftm}-${game.fta}`}</Cell> : null}
              <Cell width={40}>{game.reb}</Cell>
              <Cell width={40}>{game.ast}</Cell>
              {full ? <Cell width={36}>{game.stl}</Cell> : null}
              {full ? <Cell width={36}>{game.blk}</Cell> : null}
              {full ? <Cell width={36}>{game.tov}</Cell> : null}
              <Cell width={44} emphasis>
                {game.pts}
              </Cell>
            </Row>
          ))}

          {/* Totals, so the derived rates above are checkable by hand. */}
          <Row totals>
            <Cell width={74} align="left" header>
              TOTALS
            </Cell>
            <Cell width={full ? 132 : 96} align="left" />
            {full ? <Cell width={40}>{sum(games, 'minutes')}</Cell> : null}
            <Cell width={58}>{`${sum(games, 'fgm')}-${sum(games, 'fga')}`}</Cell>
            {full ? <Cell width={52}>{`${sum(games, 'tpm')}-${sum(games, 'tpa')}`}</Cell> : null}
            {full ? <Cell width={52}>{`${sum(games, 'ftm')}-${sum(games, 'fta')}`}</Cell> : null}
            <Cell width={40}>{sum(games, 'reb')}</Cell>
            <Cell width={40}>{sum(games, 'ast')}</Cell>
            {full ? <Cell width={36}>{sum(games, 'stl')}</Cell> : null}
            {full ? <Cell width={36}>{sum(games, 'blk')}</Cell> : null}
            {full ? <Cell width={36}>{sum(games, 'tov')}</Cell> : null}
            <Cell width={44} emphasis>
              {sum(games, 'pts')}
            </Cell>
          </Row>
        </View>
      </ScrollView>

      {!full ? (
        <Text className="font-sans mt-2 text-[11px] text-slate">
          Scroll the table sideways for minutes, 3PT, FT, steals, blocks and turnovers.
        </Text>
      ) : null}
    </View>
  );
}

function sum(games: ApiGameStat[], field: keyof ApiGameStat): number {
  return games.reduce((total, game) => total + (Number(game[field]) || 0), 0);
}

/** "2025-11-08" → "Nov 8". Parsed by parts to avoid timezone drift on a date-only string. */
function formatDate(value?: string): string {
  if (!value) return '—';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MONTHS[month - 1]} ${day}`;
}

function Average({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text className="font-stat-bold text-[28px] leading-[30px] tracking-stat text-chrome-text">
        {value}
      </Text>
      <Text className="font-sans-semibold mt-0.5 text-[10px] tracking-eyebrow text-chrome-text-muted">
        {label}
      </Text>
    </View>
  );
}

function Row({
  children,
  header = false,
  totals = false,
  last = false,
  full = false,
}: {
  children: React.ReactNode;
  header?: boolean;
  totals?: boolean;
  last?: boolean;
  full?: boolean;
}) {
  const tone = header
    ? 'border-b border-border-strong'
    : totals
      ? 'border-t border-border-strong'
      : last
        ? ''
        : 'border-b border-border';

  return (
    <View className={`flex-row items-center py-2 ${tone} ${full ? '' : ''}`}>{children}</View>
  );
}

function Cell({
  children,
  width,
  align = 'center',
  header = false,
  muted = false,
  emphasis = false,
}: {
  children?: React.ReactNode;
  width: number;
  align?: 'left' | 'center';
  header?: boolean;
  muted?: boolean;
  emphasis?: boolean;
}) {
  if (header) {
    return (
      <Text
        className={`font-sans-semibold text-[9px] tracking-eyebrow text-slate ${
          align === 'left' ? 'text-left' : 'text-center'
        }`}
        style={{ width }}>
        {children}
      </Text>
    );
  }

  return (
    <Text
      className={`${muted ? 'font-sans text-[12px] text-slate' : 'font-stat-bold tracking-stat'} ${
        muted ? '' : emphasis ? 'text-[18px] text-ink' : 'text-[16px] text-ink'
      } ${align === 'left' ? 'text-left' : 'text-center'}`}
      style={{ width }}
      numberOfLines={1}>
      {children}
    </Text>
  );
}
