import { Text, View } from 'react-native';
import type { ApiPlayer } from '../lib/api';
import { useTierColors } from '../lib/theme';
import { cmToFeetInches, kgToLbsLabel } from '../lib/units';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Card } from './Card';
import { FitScore } from './FitScore';
import { PositionBadge } from './PositionBadge';
import { SpecStrip, StatStrip } from './StatStrip';
import { Touchable } from './Touchable';

/**
 * Candidate card. Production leads — a coach scans PPG/RPG/APG first and only then
 * checks whether the frame fits the slot — so the stat strip sits directly under
 * the name and the physicals follow as supporting spec.
 */
export function PlayerCard({
  player,
  invited,
  pending = false,
  onInvite,
  onPress,
}: {
  player: ApiPlayer;
  invited: boolean;
  pending?: boolean;
  onInvite: () => void;
  onPress: () => void;
}) {
  const tiers = useTierColors();
  const match = player.match;
  const eligibility = `${player.eligibility_years} yr${
    player.eligibility_years === 1 ? '' : 's'
  } eligibility left`;

  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${player.name}, ${player.position}, ${player.location}`}
      scaleTo={0.99}
      dimTo={1}
      className="mb-3">
      <Card bare rail={match ? tiers.color(match.tier) : undefined}>
        <View className="p-4 pb-3.5">
          <View className="flex-row items-center">
            <Avatar name={player.name} size={44} />
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Text className="font-display flex-1 text-[16px] text-ink" numberOfLines={1}>
                  {player.name}
                </Text>
                <PositionBadge position={player.position} tone="dark" size="sm" />
              </View>
              <Text className="font-sans mt-1 text-[11px] text-slate" numberOfLines={1}>
                {player.location} · {eligibility}
              </Text>
            </View>
          </View>

          <StatStrip
            className="mt-3.5"
            size="sm"
            stats={[
              { value: player.ppg.toFixed(1), label: 'PPG' },
              { value: player.rpg.toFixed(1), label: 'RPG' },
              { value: player.apg.toFixed(1), label: 'APG' },
              { value: `${Math.round(player.fg_pct)}%`, label: 'FG%' },
            ]}
          />

          <SpecStrip
            className="mt-2"
            specs={[
              { label: 'Height', value: cmToFeetInches(player.height_cm) },
              { label: 'Weight', value: kgToLbsLabel(player.weight_kg) },
              { label: 'Wingspan', value: cmToFeetInches(player.wingspan_cm) },
            ]}
          />
        </View>

        <View className="flex-row items-center border-t border-border bg-bg px-4 py-3">
          {match ? (
            <FitScore score={match.score} tier={match.tier} reason={match.reason} />
          ) : (
            <Text className="font-sans flex-1 text-[12px] text-slate">
              Not scored for this slot.
            </Text>
          )}

          <Button
            label="Invite"
            doneLabel="Invited"
            done={invited}
            loading={pending}
            onPress={onInvite}
            fullWidth={false}
            className="ml-3 w-[112px]"
          />
        </View>
      </Card>
    </Touchable>
  );
}
