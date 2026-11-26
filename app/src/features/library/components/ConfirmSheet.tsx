import { strings } from "@/shared/strings";
import { Button, Sheet, Text } from "@/shared/ui";

interface ConfirmSheetProps {
  title: string;
  message: string;
  confirmLabel: string;
  busy: boolean;
  failed: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirmation for a destructive action (delete playlist, unlike, remove friend). */
export function ConfirmSheet({
  title,
  message,
  confirmLabel,
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
      <Button label={confirmLabel} variant="destructive" loading={busy} onPress={onConfirm} />
      <Button label={strings.common.cancel} variant="secondary" onPress={onClose} />
    </Sheet>
  );
}
