import { Pressable, Text, View } from 'react-native';
import type { Player } from '../data/types';
import type { MatchResult } from '../lib/match';
import { cmToFeetInches, kgToLbsLabel } from '../lib/units';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Card } from './Card';
import { MatchChip } from './MatchChip';
import { PositionBadge } from './PositionBadge';
import { SpecRow } from './SpecRow';
import { StatBlock } from './StatBlock';

type PlayerCardProps = {
  player: Player;
  match: MatchResult;
  invited: boolean;
  messaged: boolean;
  onInvite: () => void;
  onMessage: () => void;
  onPress: () => void;
};

/** Talent-feed card: identity, physicals, mini stats, fit chip, Invite/Message. */
export function PlayerCard({
  player,
  match,
  invited,
  messaged,
  onInvite,
  onMessage,
  onPress,
}: PlayerCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      <Card className="mb-3">
        <View className="flex-row items-center">
          <Avatar name={player.name} size={42} />
          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text className="font-sans-bold text-[15px] text-ink">{player.name}</Text>
              <View className="ml-2">
                <PositionBadge position={player.position} />
              </View>
            </View>
            <Text className="font-sans mt-0.5 text-[12px] text-slate">
              {player.location} · {player.eligibility_years} yr
              {player.eligibility_years === 1 ? '' : 's'} eligibility left
            </Text>
          </View>
        </View>

        <View className="mt-3">
          <SpecRow
            specs={[
              { label: 'Height', value: cmToFeetInches(player.height_cm) },
              { label: 'Weight', value: kgToLbsLabel(player.weight_kg) },
              { label: 'Wingspan', value: cmToFeetInches(player.wingspan_cm) },
            ]}
          />
        </View>

        <View className="mt-3 flex-row">
          <StatBlock size="sm" value={player.ppg.toFixed(1)} label="PPG" />
          <StatBlock size="sm" value={player.apg.toFixed(1)} label="APG" />
          <StatBlock size="sm" value={player.rpg.toFixed(1)} label="RPG" />
          <StatBlock size="sm" value={`${Math.round(player.fg_pct)}%`} label="FG%" />
        </View>

        <View className="mt-3">
          <MatchChip score={match.score} tier={match.tier} reason={match.reason} />
        </View>

        <View className="mt-3 flex-row border-t border-border pt-3">
          <Button
            label="Message"
            doneLabel="Messaged"
            done={messaged}
            variant="secondary"
            onPress={onMessage}
            className="flex-1"
          />
          <View className="w-2.5" />
          <Button
            label="Invite"
            doneLabel="Invited"
            done={invited}
            onPress={onInvite}
            className="flex-1"
          />
        </View>
      </Card>
    </Pressable>
  );
}
