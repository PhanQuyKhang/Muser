import { useState } from "react";

import { PLAYLIST_NAME_MAX } from "@/domain/library";
import { strings } from "@/shared/strings";
import { Button, Input, Sheet } from "@/shared/ui";

const t = strings.library;

interface PlaylistNameSheetProps {
  title: string;
  message?: string;
  submitLabel: string;
  initialName?: string;
  submitting: boolean;
  failed: boolean;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

/** O02 Create playlist and O06 Rename playlist. The typed name survives a failed save. */
export function PlaylistNameSheet({
  title,
  message,
  submitLabel,
  initialName = "",
  submitting,
  failed,
  onSubmit,
  onClose,
}: PlaylistNameSheetProps) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();

  return (
    <Sheet title={title} {...(message ? { message } : {})} onClose={onClose}>
      <Input
        label={t.nameLabel}
        hideLabel
        value={name}
        onChangeText={setName}
        placeholder={t.namePlaceholder}
        maxLength={PLAYLIST_NAME_MAX}
        autoFocus
        {...(failed ? { error: t.saveFailed } : {})}
      />
      <Button
        label={submitLabel}
        disabled={trimmed.length === 0}
        loading={submitting}
        onPress={() => onSubmit(trimmed)}
      />
    </Sheet>
  );
}
