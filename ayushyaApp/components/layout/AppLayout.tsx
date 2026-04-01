// components/layout/AppLayout.tsx
import { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NAV } from '../../utils/constants';

interface AppLayoutProps {
  activeTab: string;
  setActiveTab: (key: string) => void;
  children: ReactNode;
}

export default function AppLayout({ activeTab, setActiveTab, children }: AppLayoutProps) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        {children}
      </View>
      <View style={styles.tabBar}>
        {NAV.map((n) => (
          <TouchableOpacity
            key={n.key}
            style={styles.tabItem}
            onPress={() => setActiveTab(n.key)}
          >
            <Text style={styles.tabIcon}>{n.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === n.key && styles.tabLabelActive]}>
              {n.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: '#fff',
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#4a9b5f',
    fontWeight: '600',
  },
});