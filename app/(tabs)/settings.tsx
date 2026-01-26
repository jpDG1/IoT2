import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { useDeviceStore } from '../../store/deviceStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { devices, loadDevices } = useDeviceStore();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const theme = await AsyncStorage.getItem('@theme');
    setIsDarkMode(theme === 'dark');
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    await AsyncStorage.setItem('@theme', newTheme ? 'dark' : 'light');
  };

  const handleClearAll = () => {
    Alert.alert(
      'Usuń wszystkie urządzenia',
      'Czy na pewno chcesz usunąć wszystkie urządzenia? Ta operacja jest nieodwracalna.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń wszystkie',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('@iot_devices');
            await loadDevices();
            Alert.alert('Sukces', 'Wszystkie urządzenia zostały usunięte');
          },
        },
      ]
    );
  };

  // Статистика: найчастіші кімнати
  const getRoomStats = () => {
    const roomCounts: { [key: string]: number } = {};
    devices.forEach((device) => {
      roomCounts[device.roomName] = (roomCounts[device.roomName] || 0) + 1;
    });
    return Object.entries(roomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  // Статистика: кольори
  const getColorStats = () => {
    const colorCounts: { [key: string]: number } = {};
    devices.forEach((device) => {
      colorCounts[device.color] = (colorCounts[device.color] || 0) + 1;
    });
    return Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
  };

  // Останній доданий пристрій
  const getLatestDevice = () => {
    if (devices.length === 0) return null;
    return devices.reduce((latest, device) => {
      return new Date(device.createdAt) > new Date(latest.createdAt)
        ? device
        : latest;
    });
  };

  const roomStats = getRoomStats();
  const colorStats = getColorStats();
  const latestDevice = getLatestDevice();

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ustawienia</Text>
      </View>

      <View style={styles.content}>
        {/* Темна тема */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.themeRow}>
            <View style={styles.themeInfo}>
              <Ionicons 
                name={isDarkMode ? "moon" : "sunny"} 
                size={24} 
                color={theme.primary} 
              />
              <Text style={[styles.themeLabel, { color: theme.text }]}>Tryb ciemny</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
              thumbColor={isDarkMode ? '#ffffff' : '#f1f5f9'}
            />
          </View>
        </View>

        {/* Статистика */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Statystyki</Text>
          
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Liczba urządzeń:</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{devices.length}</Text>
          </View>

          {latestDevice && (
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Ostatnio dodane:</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{latestDevice.deviceName}</Text>
            </View>
          )}

          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Wersja aplikacji:</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>1.0.0</Text>
          </View>
        </View>

        {/* Najczęstsze pokoje */}
        {roomStats.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Najpopularniejsze pomieszczenia
            </Text>
            {roomStats.map(([room, count], index) => (
              <View key={room} style={styles.roomStatRow}>
                <View style={styles.roomStatLeft}>
                  <Text style={[styles.roomStatNumber, { color: theme.primary }]}>
                    {index + 1}
                  </Text>
                  <Text style={[styles.roomStatName, { color: theme.text }]}>{room}</Text>
                </View>
                <Text style={[styles.roomStatCount, { color: theme.textSecondary }]}>
                  {count} {count === 1 ? 'urządzenie' : 'urządzeń'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Статистика кольорів */}
        {colorStats.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Kolory urządzeń
            </Text>
            {colorStats.map(([color, count]) => (
              <View key={color} style={styles.colorStatRow}>
                <View style={styles.colorStatLeft}>
                  <View style={[styles.colorDot, { backgroundColor: color }]} />
                  <Text style={[styles.colorStatCount, { color: theme.text }]}>
                    {count} {count === 1 ? 'urządzenie' : 'urządzeń'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Управління даними */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Zarządzanie danymi</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={20} color="#dc2626" />
            <Text style={styles.dangerButtonText}>Usuń wszystkie urządzenia</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            IoT App © 2025
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const lightTheme = {
  background: '#f8fafc',
  cardBackground: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  primary: '#3b82f6',
};

const darkTheme = {
  background: '#0f172a',
  cardBackground: '#1e293b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  border: '#334155',
  primary: '#60a5fa',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  section: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statLabel: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  roomStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  roomStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roomStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 24,
  },
  roomStatName: {
    fontSize: 16,
    fontWeight: '500',
  },
  roomStatCount: {
    fontSize: 14,
  },
  colorStatRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  colorStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorStatCount: {
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: '#fee2e2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dangerButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
  },
});