import { Children, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

const COLUMNS = 3;
const GAP = 9;

/** Lays its children out in rows of three with equal widths (genre tiles, mood chips, artists). */
export function ChoiceGrid({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const rows: ReactNode[][] = [];
  for (let index = 0; index < items.length; index += COLUMNS) {
    rows.push(items.slice(index, index + COLUMNS));
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {Array.from({ length: COLUMNS }, (_, column) => (
            <View key={column} style={styles.cell}>
              {row[column] ?? null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: GAP },
  row: { flexDirection: "row", gap: GAP },
  cell: { flex: 1 },
});
