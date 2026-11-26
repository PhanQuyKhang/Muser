import { strings } from "@/shared/strings";
import { Button, Sheet, Text } from "@/shared/ui";

interface ConfirmSheetProps {
  title: string;
  message: string;
  confirmLabel: string;
  /** The way out, for example "Keep playlist". */
  keepLabel?: string;
  busy: boolean;
  failed: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmation for a destructive action (delete playlist, unlike, remove friend, sign out). */
export function ConfirmSheet({
  title,
  message,
  confirmLabel,
  keepLabel = strings.common.cancel,
  busy,
  failed,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  return (
    <Sheet title={title} message={message} onClose={onClose}>
      {failed ? (
        <Text variant="bodySmall" color="error" accessibilityLiveRegion="polite">
          {strings.common.actionFailed}
        </Text>
      ) : null}
      <Button label={confirmLabel} variant="danger" loading={busy} onPress={onConfirm} />
      <Button label={keepLabel} variant="secondary" onPress={onClose} />
    </Sheet>
  );
}
