import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../lib/theme';
import { Touchable } from './Touchable';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Optional line under the title explaining what picking does. */
  subtitle?: string;
  children: React.ReactNode;
};

/**
 * Bottom sheet. React Native has no cross-platform native picker, so selection
 * lists that don't fit inline open here instead of expanding in place — an
 * inline dropdown pushes the whole feed down as it opens.
 *
 * Always dismissible: scrim tap, close button, and the platform back gesture.
 */
export function Sheet({ visible, onClose, title, subtitle, children }: SheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end"
        accessibilityLabel="Dismiss"
        // A 55% scrim is heavy enough that the sheet clearly owns the
        // foreground, per the modal-legibility rule.
        style={{ backgroundColor: 'rgba(13,14,17,0.55)' }}
        onPress={onClose}>
        {/* Stops taps inside the sheet from dismissing it. */}
        <Pressable
          onPress={() => {}}
          className="max-h-[78%] overflow-hidden rounded-t-sheet bg-surface">
          <SafeAreaView edges={['bottom']}>
            <View className="items-center pt-2.5">
              <View className="h-1 w-9 rounded-full bg-border-strong" />
            </View>

            <View className="flex-row items-start border-b border-border px-5 pb-3.5 pt-3">
              <View className="flex-1 pr-3">
                <Text className="font-display text-[18px] text-ink" accessibilityRole="header">
                  {title}
                </Text>
                {subtitle ? (
                  <Text className="font-sans mt-1 text-[12px] leading-[17px] text-slate">
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              <Touchable
                onPress={onClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="h-8 w-8 items-center justify-center rounded-full bg-mist">
                <Ionicons name="close" size={17} color={COLORS.slate} />
              </Touchable>
            </View>

            {children}
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Standard selectable row for sheet contents. */
export function SheetRow({
  onPress,
  active = false,
  children,
  last = false,
  accessibilityLabel,
}: {
  onPress: () => void;
  active?: boolean;
  children: React.ReactNode;
  last?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel}
      scaleTo={1}
      dimTo={0.6}
      className={`flex-row items-center px-5 py-3.5 ${
        last ? '' : 'border-b border-border'
      } ${active ? 'bg-primary-soft' : ''}`}>
      <View className="flex-1">{children}</View>
      {active ? (
        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
      ) : null}
    </Touchable>
  );
}
