import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { COLORS } from '../lib/theme';
import { Touchable } from './Touchable';

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
  /** Message shown when a commit is rejected. */
  hint?: string;
};

/**
 * Labeled row that swaps into an input in place. Rows are 48px tall so the whole
 * row is a comfortable target, and the value carries a visible pencil rather
 * than relying on users guessing that text is tappable.
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
  hint,
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

  const rejectionNotice = rejected ? (
    <Text
      className="font-sans mt-1 text-[11px] text-danger"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite">
      {hint ?? "Couldn't read that value — reverted."}
    </Text>
  ) : null;

  if (options) {
    return (
      <View className={`py-2 ${rowBorder}`}>
        <Touchable
          onPress={() => setEditing((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value}. Change`}
          accessibilityState={{ expanded: editing }}
          scaleTo={1}
          dimTo={0.65}
          className="h-11 flex-row items-center justify-between">
          <Text className="font-sans text-[14px] text-slate">{label}</Text>
          <View className="flex-row items-center">
            <Text className="font-sans-semibold text-[14px] text-ink">{value}</Text>
            <Ionicons
              name={editing ? 'chevron-up' : 'chevron-down'}
              size={15}
              color={COLORS.slate}
              style={{ marginLeft: 8 }}
            />
          </View>
        </Touchable>

        {editing ? (
          <View className="mb-1.5 mt-1 flex-row flex-wrap gap-2">
            {options.map((option) => {
              const active = option === value;
              return (
                <Touchable
                  key={option}
                  onPress={() => {
                    onCommit(option);
                    setEditing(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option}
                  scaleTo={0.95}
                  className={`h-9 justify-center rounded-full px-3.5 ${
                    active ? 'bg-primary' : 'border border-border-strong bg-surface'
                  }`}>
                  <Text
                    className={`font-sans-semibold text-[13px] ${
                      active ? 'text-surface' : 'text-ink'
                    }`}>
                    {option}
                  </Text>
                </Touchable>
              );
            })}
          </View>
        ) : null}

        {rejectionNotice}
      </View>
    );
  }

  if (multiline) {
    return (
      <View>
        <View className="flex-row items-center justify-between">
          <Text className="font-stat text-[15px] tracking-eyebrow text-slate">
            {label.toUpperCase()}
          </Text>
          <Touchable
            onPress={editing ? commit : beginEdit}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={editing ? `Save ${label}` : `Edit ${label}`}
            className="h-8 w-8 items-center justify-center rounded-full bg-mist">
            <Ionicons
              name={editing ? 'checkmark' : 'pencil'}
              size={15}
              color={editing ? COLORS.primary : COLORS.slate}
            />
          </Touchable>
        </View>

        {editing ? (
          <TextInput
            ref={inputRef}
            autoFocus
            multiline
            value={draft}
            onChangeText={setDraft}
            onBlur={commit}
            className="font-sans mt-2.5 rounded-btn border-2 border-primary bg-surface px-3 py-2.5 text-[14px] leading-[20px] text-ink"
            style={{ minHeight: 104, textAlignVertical: 'top' }}
          />
        ) : (
          <Text className="font-sans mt-2 text-[14px] leading-[21px] text-slate">
            {value.length > 0 ? value : 'Nothing written yet — tap the pencil to add.'}
          </Text>
        )}

        {rejectionNotice}
      </View>
    );
  }

  return (
    <View className={`py-2 ${rowBorder}`}>
      <View className="h-11 flex-row items-center justify-between">
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
              accessibilityLabel={label}
              className="font-sans-semibold h-9 min-w-[92px] rounded-md border-2 border-primary bg-surface px-2 text-right text-[14px] text-ink"
            />
            <Touchable
              onPress={commit}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={`Save ${label}`}
              className="ml-2 h-8 w-8 items-center justify-center rounded-full bg-primary-soft">
              <Ionicons name="checkmark" size={15} color={COLORS.primary} />
            </Touchable>
          </View>
        ) : (
          <Touchable
            onPress={beginEdit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${value}. Edit`}
            scaleTo={1}
            dimTo={0.6}
            className="flex-row items-center">
            <Text className="font-sans-semibold text-[14px] text-ink">{value}</Text>
            <Ionicons name="pencil" size={14} color={COLORS.slate} style={{ marginLeft: 8 }} />
          </Touchable>
        )}
      </View>

      {rejectionNotice}
    </View>
  );
}
