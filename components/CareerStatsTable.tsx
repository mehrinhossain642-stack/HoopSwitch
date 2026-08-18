import { Text, View } from 'react-native';
import type { CareerStat } from '../data/types';

const COLUMNS = [
  { key: 'gp', label: 'GP' },
  { key: 'ppg', label: 'PPG' },
  { key: 'rpg', label: 'RPG' },
  { key: 'apg', label: 'APG' },
] as const;

function cell(stat: CareerStat, key: (typeof COLUMNS)[number]['key']): string {
  return key === 'gp' ? String(stat.gp) : stat[key].toFixed(1);
}

/**
 * Season-by-season table. Numerals are condensed and right-aligned so the columns
 * line up on the decimal — proportional figures made every row look slightly
 * misaligned.
 */
export function CareerStatsTable({ stats }: { stats: CareerStat[] }) {
  if (stats.length === 0) {
    return <Text className="font-sans text-[13px] text-slate">No season stats recorded yet.</Text>;
  }

  return (
    <View>
      <View className="flex-row border-b border-border-strong pb-2">
        <Text className="font-sans-semibold flex-[2.3] text-[9px] tracking-eyebrow text-slate">
          SEASON · TEAM
        </Text>
        {COLUMNS.map((column) => (
          <Text
            key={column.key}
            className="font-sans-semibold flex-1 text-right text-[9px] tracking-eyebrow text-slate">
            {column.label}
          </Text>
        ))}
      </View>

      {stats.map((stat, index) => (
        <View
          key={`${stat.season}-${stat.team_name}`}
          className={`flex-row items-center px-1 py-2.5 ${
            index < stats.length - 1 ? 'border-b border-border' : ''
          }`}>
          <View className="flex-[2.3] pr-2">
            <Text className="font-stat text-[17px] tracking-stat text-ink">{stat.season}</Text>
            <Text className="font-sans mt-0.5 text-[11px] text-slate" numberOfLines={1}>
              {stat.team_name}
            </Text>
          </View>
          {COLUMNS.map((column) => (
            <Text
              key={column.key}
              className="font-stat-bold flex-1 text-right text-[20px] tracking-stat text-ink">
              {cell(stat, column.key)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
