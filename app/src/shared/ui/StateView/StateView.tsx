import { StyleSheet, View } from "react-native";

import { strings } from "@/shared/strings";
import { spacing } from "@/shared/theme";
import { Button } from "../Button";
import { Text } from "../Text";

interface StateViewProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function StateView({ title, message, actionLabel, onAction }: StateViewProps) {
  return (
    <View style={styles.root} accessibilityRole="summary">
      <Text variant="sectionTitle" style={styles.centered}>
        {title}
      </Text>
      {message ? (
        <Text variant="body" color="textSecondary" style={styles.centered}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

export type EmptyStateProps = StateViewProps;

/** Nothing to show yet (empty library, no friends, no results). Offer a next step when there is one. */
export function EmptyState(props: EmptyStateProps) {
  return <StateView {...props} />;
}

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
}

/** A remote view failed. Never displayed as success; always offers Retry. */
export function ErrorState({
  title = strings.common.connectionError,
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <StateView
      title={title}
      {...(message ? { message } : {})}
      actionLabel={strings.common.retry}
      onAction={onRetry}
    />
  );
}

const styles = StyleSheet.create({
  root: { alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.xl },
  centered: { textAlign: "center" },
  action: { marginTop: spacing.md },
});
