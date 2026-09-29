import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeFileSystem } from '../services/FileSystemBridge';
import { FileEntry } from '../services/NativeBridge';
import { colors, spacing } from '../theme';

interface FileTreeExplorerProps {
  rootPath: string;
  onOpenFile: (path: string) => void;
}

export function FileTreeExplorer({ rootPath, onOpenFile }: FileTreeExplorerProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    NativeFileSystem.readDirectory(rootPath).then((files) => {
      if (active) setEntries(files);
    });
    return () => {
      active = false;
    };
  }, [rootPath]);

  const toggleDirectory = async (entry: FileEntry) => {
    if (expanded.has(entry.path)) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(entry.path);
        return next;
      });
    } else {
      setExpanded((prev) => new Set(prev).add(entry.path));
    }
  };

  const renderEntry = ({ item }: { item: FileEntry }) => {
    const isExpanded = expanded.has(item.path);
    return (
      <View>
        <TouchableOpacity
          style={styles.row}
          onPress={() => (item.isDirectory ? toggleDirectory(item) : onOpenFile(item.path))}
        >
          <Text style={styles.icon}>{item.isDirectory ? (isExpanded ? '▾' : '▸') : '·'}</Text>
          <Text style={styles.name}>{item.name}</Text>
        </TouchableOpacity>
        {item.isDirectory && isExpanded && (
          <View style={styles.children}>
            <DirectoryChildren path={item.path} onOpenFile={onOpenFile} />
          </View>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.path}
      renderItem={renderEntry}
      style={styles.list}
    />
  );
}

function DirectoryChildren({
  path,
  onOpenFile
}: {
  path: string;
  onOpenFile: (path: string) => void;
}) {
  const [children, setChildren] = useState<FileEntry[]>([]);

  useEffect(() => {
    let active = true;
    NativeFileSystem.readDirectory(path).then((files) => {
      if (active) setChildren(files);
    });
    return () => {
      active = false;
    };
  }, [path]);

  return (
    <View>
      {children.map((child) => (
        <TouchableOpacity
          key={child.path}
          style={styles.childRow}
          onPress={() => (child.isDirectory ? undefined : onOpenFile(child.path))}
        >
          <Text style={styles.icon}>{child.isDirectory ? '▸' : '·'}</Text>
          <Text style={styles.name}>{child.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bgSidebar },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingLeft: spacing.xl
  },
  children: { borderLeftWidth: 1, borderLeftColor: colors.border, marginLeft: spacing.md },
  icon: { color: colors.textMuted, width: 16, fontSize: 12 },
  name: { color: colors.text, fontSize: 14, marginLeft: spacing.xs }
});
