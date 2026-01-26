import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

const AVAILABLE_COLORS = [
  '#3b82f6', // niebieski
  '#ef4444', // czerwony
  '#10b981', // zielony
  '#f59e0b', // pomarańczowy
  '#8b5cf6', // fioletowy
  '#ec4899', // różowy
];

interface AddDeviceModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (deviceData: DeviceData) => void;
}

interface DeviceData {
  deviceName: string;
  roomName: string;
  command: string;
  color: string;
}

export default function AddDeviceModal({ visible, onClose, onAdd }: AddDeviceModalProps) {
  const [deviceName, setDeviceName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [command, setCommand] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);

  const handleAdd = () => {
    if (!deviceName.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę urządzenia');
      return;
    }
    if (!roomName.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę pomieszczenia');
      return;
    }
    if (!command.trim()) {
      Alert.alert('Błąd', 'Podaj komendę');
      return;
    }

    onAdd({
      deviceName: deviceName.trim(),
      roomName: roomName.trim(),
      command: command.trim(),
      color: selectedColor,
    });

    setDeviceName('');
    setRoomName('');
    setCommand('');
    setSelectedColor(AVAILABLE_COLORS[0]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Dodaj nowe urządzenie</Text>

            <Text style={styles.label}>Nazwa urządzenia</Text>
            <TextInput
              style={styles.input}
              placeholder="np. Lampka nocna"
              value={deviceName}
              onChangeText={setDeviceName}
            />

            <Text style={styles.label}>Nazwa pomieszczenia</Text>
            <TextInput
              style={styles.input}
              placeholder="np. Sypialnia"
              value={roomName}
              onChangeText={setRoomName}
            />

            <Text style={styles.label}>Komenda</Text>
            <TextInput
              style={styles.input}
              placeholder="np. LIGHT_ON"
              value={command}
              onChangeText={setCommand}
            />

            <Text style={styles.label}>Wybierz kolor kafelka</Text>
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
                />
              ))}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Anuluj</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={handleAdd}
              >
                <Text style={styles.addButtonText}>Dodaj</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: '#000',
    borderWidth: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#3b82f6',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});