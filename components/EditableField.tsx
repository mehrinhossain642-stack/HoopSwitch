import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { COLORS } from '../lib/theme';

type EditableFieldProps = {
  label: string;
  /** Formatted value shown when not editing (e.g. `6'2"`). */
  value: string;
  /**
   * Commits an edit. Return false to reject the input — the row reverts to
   * the previous value. Keeps parsing/validation with the owner of the state.
   */
  onCommit: (next: string) => boolean;
  /** Raw seed for the input, when it differs from the formatted value. */
  editSeed?: string;
  keyboardType?: KeyboardTypeOptions;
  /** Renders a choice row instead of a text input. */
  options?: readonly string[];
  multiline?: boolean;
  /** Hides the bottom hairline for the last row in a card. */
  last?: boolean;
};

/**
 * Labeled row with a pencil affordance that swaps into an input. Commits flow
 * straight into in-memory state, so feeds re-score on the next render.
 */
export function EditableField({
  label,
  value,
  onCommit,
  editSeed,
  keyboardType = 'default',
  options,
  multiline = false,
  last = false,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(editSeed ?? value);
  const [rejected, setRejected] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Re-seed whenever the upstream value changes (or we re-enter edit mode).
  useEffect(() => {
    if (!editing) setDraft(editSeed ?? value);
  }, [editSeed, value, editing]);

  function beginEdit() {
    setRejected(false);
    setDraft(editSeed ?? value);
    setEditing(true);
  }

  function commit() {
    const accepted = onCommit(draft);
    setRejected(!accepted);
    setEditing(false);
    if (!accepted) setDraft(editSeed ?? value);
  }

  const rowBorder = last ? '' : 'border-b border-border';

  if (options) {
    return (
      <View className={`py-3 ${rowBorder}`}>
        <Pressable
          className="flex-row items-center justify-between"
          onPress={() => setEditing((prev) => !prev)}>
          <Text className="font-sans text-[14px] text-slate">{label}</Text>
          <View className="flex-row items-center">
            <Text className="font-sans-semibold text-[14px] text-ink">{value}</Text>
            <Ionicons
              name={editing ? 'chevron-up' : 'pencil'}
              size={14}
              color={COLORS.slate}
              style={{ marginLeft: 8 }}
            />
          </View>
        </Pressable>

        {editing ? (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {options.map((option) => {
              const active = option === value;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    onCommit(option);
                    setEditing(false);
                  }}
                  className={`rounded-full border px-3 py-1.5 ${
                    active ? 'border-primary bg-primary' : 'border-border bg-bg'
                  }`}>
                  <Text
                    className={`font-sans-semibold text-[13px] ${
                      active ? 'text-surface' : 'text-ink'
                    }`}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    );
  }

  if (multiline) {
    return (
      <View>
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-semibold text-[13px] uppercase tracking-wider text-slate">
            {label}
          </Text>
          <Pressable onPress={editing ? commit : beginEdit} hitSlop={10}>
            <Ionicons
              name={editing ? 'checkmark' : 'pencil'}
              size={16}
              color={editing ? COLORS.primary : COLORS.slate}
            />
          </Pressable>
        </View>
        {editing ? (
          <TextInput
            ref={inputRef}
            autoFocus
            multiline
            value={draft}
            onChangeText={setDraft}
            onBlur={commit}
            className="font-sans mt-2 rounded-btn border border-primary bg-bg px-3 py-2 text-[14px] leading-5 text-ink"
            style={{ minHeight: 96, textAlignVertical: 'top' }}
          />
        ) : (
          <Text className="font-sans mt-2 text-[14px] leading-5 text-slate">{value}</Text>
        )}
      </View>
    );
  }

  return (
    <View className={`py-3 ${rowBorder}`}>
      <View className="flex-row items-center justify-between">
        <Text className="font-sans text-[14px] text-slate">{label}</Text>

        {editing ? (
          <View className="flex-row items-center">
            <TextInput
              ref={inputRef}
              autoFocus
              value={draft}
              onChangeText={setDraft}
              onBlur={commit}
              onSubmitEditing={commit}
              returnKeyType="done"
              keyboardType={keyboardType}
              className="font-sans-semibold min-w-[88px] rounded-md border border-primary bg-bg px-2 py-1 text-right text-[14px] text-ink"
            />
            <Pressable onPress={commit} hitSlop={10}>
              <Ionicons
                name="checkmark"
                size={16}
                color={COLORS.primary}
                style={{ marginLeft: 8 }}
              />
            </Pressable>
          </View>
        ) : (
          <Pressable className="flex-row items-center" onPress={beginEdit} hitSlop={8}>
            <Text className="font-sans-semibold text-[14px] text-ink">{value}</Text>
            <Ionicons name="pencil" size={14} color={COLORS.slate} style={{ marginLeft: 8 }} />
          </Pressable>
        )}
      </View>

      {rejected ? (
        <Text className="font-sans mt-1 text-[11px] text-primary">
          Couldn&apos;t read that value — reverted.
        </Text>
      ) : null}
    </View>
  );
}
