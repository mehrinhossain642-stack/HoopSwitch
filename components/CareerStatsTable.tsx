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

export function CareerStatsTable({ stats }: { stats: CareerStat[] }) {
  return (
    <View>
      <View className="flex-row border-b border-border pb-2">
        <Text className="font-sans-semibold flex-[2.4] text-[10px] uppercase tracking-widest text-slate">
          Season · Team
        </Text>
        {COLUMNS.map((column) => (
          <Text
            key={column.key}
            className="font-sans-semibold flex-1 text-right text-[10px] uppercase tracking-widest text-slate">
            {column.label}
          </Text>
        ))}
      </View>

      {stats.map((stat, index) => (
        <View
          key={`${stat.season}-${stat.team_name}`}
          className={`flex-row items-center py-2.5 ${
            index < stats.length - 1 ? 'border-b border-border' : ''
          }`}>
          <View className="flex-[2.4] pr-2">
            <Text className="font-sans-semibold text-[13px] text-ink">{stat.season}</Text>
            <Text className="font-sans mt-0.5 text-[11px] text-slate" numberOfLines={1}>
              {stat.team_name}
            </Text>
          </View>
          {COLUMNS.map((column) => (
            <Text
              key={column.key}
              className="font-sans-semibold flex-1 text-right text-[13px] text-ink">
              {cell(stat, column.key)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
