import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { SCRIM, useThemeColors } from '../lib/theme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Renders the confirm action in the danger colour. */
  destructive?: boolean;
  /** Disables both actions and spins the confirm button. */
  busy?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Confirmation for an action that can't be undone.
 *
 * Deliberately not `Alert.alert` — that's a no-op on react-native-web, so on the
 * web build the destructive action would fire with no confirmation at all.
 */
export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  busy = false,
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const colors = useThemeColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Android's back button and the browser's Escape both land here.
      onRequestClose={busy ? undefined : onCancel}>
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: SCRIM }}
        accessibilityLabel={cancelLabel}
        onPress={busy ? undefined : onCancel}>
        {/* Stops taps inside the dialog from dismissing it. */}
        <Pressable
          onPress={() => {}}
          className="w-full max-w-[380px] rounded-card bg-surface p-5"
          accessibilityViewIsModal>
          {icon ? (
            <View
              className={`mb-3.5 h-11 w-11 items-center justify-center rounded-full ${
                destructive ? 'bg-danger-soft' : 'bg-mist'
              }`}>
              <Ionicons name={icon} size={21} color={destructive ? colors.danger : colors.ink} />
            </View>
          ) : null}

          <Text className="font-display text-[18px] text-ink" accessibilityRole="header">
            {title}
          </Text>
          <Text className="font-sans mt-2 text-[13px] leading-[19px] text-slate">{body}</Text>

          <View className="mt-5 flex-row">
            <Pressable
              onPress={onCancel}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              accessibilityState={{ disabled: busy }}
              className={`mr-2.5 h-11 flex-1 items-center justify-center rounded-btn border border-border-strong bg-surface ${
                busy ? 'opacity-40' : ''
              }`}
              style={({ pressed }) => ({ opacity: pressed && !busy ? 0.7 : undefined })}>
              <Text className="font-sans-bold text-[14px] text-ink">{cancelLabel}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              accessibilityState={{ disabled: busy, busy }}
              // Fill has to come from className, not the style callback:
              // NativeWind drops a `backgroundColor` returned from a style
              // function, which left this button transparent with white text on a
              // white card — invisible, but still clickable.
              className={`h-11 flex-1 items-center justify-center rounded-btn ${
                destructive ? 'bg-danger' : 'bg-primary'
              } ${busy ? 'opacity-60' : ''}`}
              style={({ pressed }) => ({ opacity: pressed && !busy ? 0.8 : undefined })}>
              {busy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="font-sans-bold text-[14px] text-white">{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
