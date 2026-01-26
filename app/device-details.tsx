import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useDeviceStore } from '../store/deviceStore';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const AVAILABLE_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
];

export default function DeviceDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { devices, updateDevice, removeDevice } = useDeviceStore();
  
  const device = devices.find(d => d.id === id);
  
  const [deviceName, setDeviceName] = useState(device?.deviceName || '');
  const [roomName, setRoomName] = useState(device?.roomName || '');
  const [command, setCommand] = useState(device?.command || '');
  const [selectedColor, setSelectedColor] = useState(device?.color || '#3b82f6');

  if (!device) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Urządzenie nie znalezione</Text>
        </View>
      </View>
    );
  }

  const handleSave = async () => {
    if (!deviceName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Błąd ❌',
        text2: 'Podaj nazwę urządzenia',
        position: 'bottom',
      });
      return;
    }
    if (!roomName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Błąd ❌',
        text2: 'Podaj nazwę pomieszczenia',
        position: 'bottom',
      });
      return;
    }
    if (!command.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Błąd ❌',
        text2: 'Podaj komendę',
        position: 'bottom',
      });
      return;
    }

    await updateDevice(device.id, {
      deviceName: deviceName.trim(),
      roomName: roomName.trim(),
      command: command.trim(),
      color: selectedColor,
    });
    
    Toast.show({
      type: 'success',
      text1: 'Zapisano! ✅',
      text2: 'Urządzenie zostało zaktualizowane',
      position: 'bottom',
    });
    
    setTimeout(() => router.back(), 1000);
  };

  const handleDelete = () => {
    Alert.alert(
      'Usuń urządzenie',
      `Czy na pewno chcesz usunąć "${device.deviceName}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            await removeDevice(device.id);
            Toast.show({
              type: 'success',
              text1: 'Usunięto 🗑️',
              text2: `Urządzenie "${device.deviceName}" zostało usunięte`,
              position: 'bottom',
            });
            setTimeout(() => router.back(), 500);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Szczegóły urządzenia</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.colorPreview, { backgroundColor: selectedColor }]}>
          <Ionicons name="wifi" size={60} color="white" />
        </View>

        <Text style={styles.label}>Nazwa urządzenia</Text>
        <TextInput
          style={styles.input}
          value={deviceName}
          onChangeText={setDeviceName}
          placeholder="np. Lampka nocna"
        />

        <Text style={styles.label}>Pomieszczenie</Text>
        <TextInput
          style={styles.input}
          value={roomName}
          onChangeText={setRoomName}
          placeholder="np. Sypialnia"
        />

        <Text style={styles.label}>Komenda</Text>
        <TextInput
          style={styles.input}
          value={command}
          onChangeText={setCommand}
          placeholder="np. LIGHT_ON"
        />

        <Text style={styles.label}>Wybierz kolor</Text>
        <View style={styles.colorContainer}>
          {AVAILABLE_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.colorSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && (
                <Ionicons name="checkmark" size={24} color="white" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="save-outline" size={20} color="white" />
          <Text style={styles.saveButtonText}>Zapisz zmiany</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#dc2626" />
          <Text style={styles.deleteButtonText}>Usuń urządzenie</Text>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Utworzono:</Text>
          <Text style={styles.infoValue}>
            {new Date(device.createdAt).toLocaleDateString('pl-PL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  colorPreview: {
    width: '100%',
    height: 150,
    borderRadius: 20,
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#1e293b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: 'white',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    borderColor: '#1e293b',
    borderWidth: 3,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 30,
    marginBottom: 40,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
});