import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { useDeviceStore } from '../../store/deviceStore';
import AddDeviceModal from '../../components/AddDeviceModal';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  Layout,
  ZoomIn,
} from 'react-native-reanimated';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import BLEService from '../utils/bleManager';
import { Device } from 'react-native-ble-plx';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function HomeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'room' | 'date' | 'color'>('date');
  const { devices, loadDevices, addDevice, removeDevice } = useDeviceStore();

  // BLE States
  const [bleDevices, setBleDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [arduinoMessage, setArduinoMessage] = useState('');

  useEffect(() => {
    loadDevices();
  }, []);

  const filteredDevices = devices
    .filter(device =>
      device.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.roomName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.deviceName.localeCompare(b.deviceName);
        case 'room':
          return a.roomName.localeCompare(b.roomName);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'color':
          return a.color.localeCompare(b.color);
        default:
          return 0;
      }
    });

  // ========== BLE FUNCTIONS ==========

  // Запит дозволів для Android
  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (!allGranted) {
          Alert.alert('Błąd', 'Wymagane uprawnienia Bluetooth');
          return false;
        }
        return true;
      } catch (error) {
        console.error('Permission error:', error);
        return false;
      }
    }
    return true;
  };

  // Сканування BLE пристроїв
  const handleScanDevices = async () => {
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) return;

    setIsScanning(true);
    setBleDevices([]);

    const foundDevices = new Map<string, Device>();

    BLEService.scanDevices((device) => {
      if (device.name && !foundDevices.has(device.id)) {
        foundDevices.set(device.id, device);
        setBleDevices(Array.from(foundDevices.values()));
      }
    });

    // Зупинити сканування через 10 секунд
    setTimeout(() => {
      BLEService.stopScan();
      setIsScanning(false);
      Toast.show({
        type: 'info',
        text1: 'Skanowanie zakończone',
        text2: `Znaleziono ${foundDevices.size} urządzeń`,
      });
    }, 10000);
  };

  // Підключення до пристрою
  const handleConnectDevice = async (device: Device) => {
    try {
      await BLEService.connectToDevice(device.id);
      setConnectedDevice(device);
      
      // Почати моніторинг даних з Arduino
      BLEService.monitorDevice((data) => {
        setArduinoMessage(data);
        Toast.show({
          type: 'success',
          text1: 'Arduino 📡',
          text2: data,
        });
      });

      Toast.show({
        type: 'success',
        text1: 'Połączono! ✅',
        text2: `Z urządzeniem ${device.name}`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Błąd połączenia',
        text2: 'Nie udało się połączyć',
      });
    }
  };

  // Відправка команди LED
  const handleSendCommand = async (command: string) => {
    if (!connectedDevice) {
      Toast.show({
        type: 'error',
        text1: 'Brak połączenia',
        text2: 'Najpierw połącz się z urządzeniem',
      });
      return;
    }

    try {
      await BLEService.sendCommand(command);
      
      const emoji = {
        red: '🔴',
        green: '🟢',
        blue: '🔵',
        off: '⚫',
      }[command] || '💡';

      Toast.show({
        type: 'success',
        text1: `${emoji} Komenda wysłana`,
        text2: command.toUpperCase(),
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Błąd',
        text2: 'Nie udało się wysłać komendy',
      });
    }
  };

  // Від'єднання
  const handleDisconnect = async () => {
    try {
      await BLEService.disconnect();
      setConnectedDevice(null);
      setArduinoMessage('');
      Toast.show({
        type: 'info',
        text1: 'Rozłączono',
      });
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  // ========== DEVICE FUNCTIONS ==========

  const handleAddDevice = async (deviceData: any) => {
    await addDevice(deviceData);
    setModalVisible(false);
    
    Toast.show({
      type: 'success',
      text1: 'Sukces! ✅',
      text2: `Urządzenie "${deviceData.deviceName}" zostało dodane`,
      position: 'bottom',
      visibilityTime: 3000,
    });
  };

  const handleDeleteDevice = async (id: string, deviceName: string) => {
    await removeDevice(id);
    Toast.show({
      type: 'info',
      text1: 'Usunięto 🗑️',
      text2: `Urządzenie "${deviceName}" zostało usunięte`,
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

  const renderRightActions = (id: string, deviceName: string) => (
    <TouchableOpacity
      style={styles.deleteSwipeButton}
      onPress={() => {
        Alert.alert(
          'Usuń urządzenie',
          `Czy na pewno chcesz usunąć "${deviceName}"?`,
          [
            { text: 'Anuluj', style: 'cancel' },
            {
              text: 'Usuń',
              style: 'destructive',
              onPress: () => handleDeleteDevice(id, deviceName),
            },
          ]
        );
      }}
    >
      <Ionicons name="trash" size={24} color="white" />
      <Text style={styles.deleteSwipeText}>Usuń</Text>
    </TouchableOpacity>
  );

  const renderDevice = ({ item, index }: any) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item.id, item.deviceName)}
      overshootRight={false}
    >
      <AnimatedTouchable
        entering={FadeInDown.delay(index * 100).springify()}
        layout={Layout.springify()}
        style={[styles.deviceCard, { backgroundColor: item.color }]}
        onPress={() => router.push(`/device-details?id=${item.id}`)}
      >
        <Text style={styles.deviceName}>{item.deviceName}</Text>
        <Text style={styles.roomName}>{item.roomName}</Text>
        <Text style={styles.command}>{item.command}</Text>
      </AnimatedTouchable>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeInUp.duration(600)}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Moje urządzenia</Text>
        <Text style={styles.deviceCount}>
          {devices.length} {devices.length === 1 ? 'urządzenie' : 'urządzeń'}
        </Text>
      </Animated.View>

      <Animated.View 
        entering={FadeInUp.delay(200).duration(600)}
        style={styles.searchContainer}
      >
        <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj urządzenia lub pomieszczenia..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#64748b" />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ========== BLE CONTROL PANEL ========== */}
      <View style={styles.bleContainer}>
        <Text style={styles.bleTitle}>Bluetooth Control</Text>
        
        {/* Кнопка сканування */}
        <TouchableOpacity
          style={[styles.bleScanButton, isScanning && styles.bleScanButtonActive]}
          onPress={handleScanDevices}
          disabled={isScanning}
        >
          <Ionicons 
            name={isScanning ? "bluetooth" : "scan"} 
            size={20} 
            color="white" 
          />
          <Text style={styles.bleScanButtonText}>
            {isScanning ? 'Skanowanie...' : 'Skanuj BLE'}
          </Text>
        </TouchableOpacity>

        {/* Підключений пристрій */}
        {connectedDevice && (
          <View style={styles.connectedCard}>
            <View style={styles.connectedHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <Text style={styles.connectedName}>{connectedDevice.name}</Text>
            </View>
            <Text style={styles.connectedId}>{connectedDevice.id}</Text>
            
            {/* LED Control */}
            <View style={styles.ledControlContainer}>
              <Text style={styles.ledControlTitle}>LED Control:</Text>
              <View style={styles.ledButtons}>
                <TouchableOpacity
                  style={[styles.ledButton, { backgroundColor: '#ef4444' }]}
                  onPress={() => handleSendCommand('red')}
                >
                  <Text style={styles.ledButtonText}>RED</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.ledButton, { backgroundColor: '#10b981' }]}
                  onPress={() => handleSendCommand('green')}
                >
                  <Text style={styles.ledButtonText}>GREEN</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.ledButton, { backgroundColor: '#3b82f6' }]}
                  onPress={() => handleSendCommand('blue')}
                >
                  <Text style={styles.ledButtonText}>BLUE</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.ledButton, { backgroundColor: '#64748b' }]}
                  onPress={() => handleSendCommand('off')}
                >
                  <Text style={styles.ledButtonText}>OFF</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Arduino Message */}
            {arduinoMessage && (
              <View style={styles.arduinoMessage}>
                <Ionicons name="information-circle" size={16} color="#3b82f6" />
                <Text style={styles.arduinoMessageText}>{arduinoMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectButtonText}>Rozłącz</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Список знайдених пристроїв */}
        {bleDevices.length > 0 && !connectedDevice && (
          <View style={styles.bleDevicesList}>
            <Text style={styles.bleDevicesTitle}>
              Znalezione urządzenia ({bleDevices.length}):
            </Text>
            {bleDevices.map((device) => (
              <TouchableOpacity
                key={device.id}
                style={styles.bleDeviceCard}
                onPress={() => handleConnectDevice(device)}
              >
                <View>
                  <Text style={styles.bleDeviceName}>{device.name}</Text>
                  <Text style={styles.bleDeviceId}>{device.id}</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color="#3b82f6" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Кнопки сортування */}
      {devices.length > 0 && (
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sortuj według:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
              onPress={() => setSortBy('date')}
            >
              <Ionicons 
                name="time-outline" 
                size={16} 
                color={sortBy === 'date' ? 'white' : '#64748b'} 
              />
              <Text style={[styles.sortButtonText, sortBy === 'date' && styles.sortButtonTextActive]}>
                Data
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
              onPress={() => setSortBy('name')}
            >
              <Ionicons 
                name="text-outline" 
                size={16} 
                color={sortBy === 'name' ? 'white' : '#64748b'} 
              />
              <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
                Nazwa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'room' && styles.sortButtonActive]}
              onPress={() => setSortBy('room')}
            >
              <Ionicons 
                name="home-outline" 
                size={16} 
                color={sortBy === 'room' ? 'white' : '#64748b'} 
              />
              <Text style={[styles.sortButtonText, sortBy === 'room' && styles.sortButtonTextActive]}>
                Pokój
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'color' && styles.sortButtonActive]}
              onPress={() => setSortBy('color')}
            >
              <Ionicons 
                name="color-palette-outline" 
                size={16} 
                color={sortBy === 'color' ? 'white' : '#64748b'} 
              />
              <Text style={[styles.sortButtonText, sortBy === 'color' && styles.sortButtonTextActive]}>
                Kolor
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {filteredDevices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons 
              name={searchQuery ? "search-outline" : "hardware-chip-outline"} 
              size={80} 
              color="#cbd5e1" 
            />
          </View>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Nie znaleziono urządzeń' : 'Brak urządzeń'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery 
              ? 'Spróbuj wyszukać inaczej lub wyczyść filtr' 
              : 'Dotknij przycisk poniżej aby dodać swoje pierwsze urządzenie IoT'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={styles.emptyButtonText}>Dodaj urządzenie</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredDevices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Кнопка + показується ТІЛЬКИ коли є пристрої */}
      {devices.length > 0 && (
        <AnimatedTouchable
          entering={ZoomIn.delay(400).duration(600)}
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </AnimatedTouchable>
      )}

      <AddDeviceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddDevice}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  deviceCount: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  
  // ========== BLE STYLES ==========
  bleContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
  },
  bleScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  bleScanButtonActive: {
    backgroundColor: '#6366f1',
  },
  bleScanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  connectedCard: {
    backgroundColor: '#f0fdf4',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  connectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  connectedName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  connectedId: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
    marginBottom: 15,
  },
  ledControlContainer: {
    marginTop: 10,
  },
  ledControlTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 10,
  },
  ledButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ledButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  ledButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  arduinoMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  arduinoMessageText: {
    fontSize: 14,
    color: '#1e40af',
    flex: 1,
  },
  disconnectButton: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bleDevicesList: {
    marginTop: 15,
  },
  bleDevicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 10,
  },
  bleDeviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bleDeviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  bleDeviceId: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  
  // ========== ORIGINAL STYLES ==========
  sortContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  sortScroll: {
    flexGrow: 0,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sortButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  listContent: {
    paddingVertical: 10,
  },
  deviceCard: {
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 20,
    borderRadius: 15,
    minHeight: 120,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  roomName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  command: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'monospace',
  },
  deleteSwipeButton: {
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    width: 140,
    margin: 8,
    marginLeft: 0,
    borderRadius: 15,
    paddingHorizontal: 20,
  },
  deleteSwipeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 32,
    color: 'white',
    fontWeight: '300',
  },
});