import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Account } from '@/models/types';
import { addAccount } from '@/QuanLyTaiChinh-backend/accountServices';
import AsyncStorage from '@react-native-async-storage/async-storage';

const accountTypes = ['Cash', 'Bank', 'Credit', 'Saving', 'Others'];
const currencies = ['VND', 'USD', 'EUR', 'JPY', 'KRW'];

const CreateAccountScreen = () => {
  const router = useRouter();

  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'credit' | 'saving' | 'others'>('cash');
  const [initialBalance, setInitialBalance] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      if (id) {
        setUserId(id);
      }
    };
    fetchUserId();
  }, []);

  const handleSelectType = (selected: string) => {
    setType(selected.toLowerCase() as typeof type);
    setShowTypeModal(false);
  };

  const handleSelectCurrency = (selected: string) => {
    setCurrency(selected);
    setShowCurrencyModal(false);
  };

  const handleCreateAccount = async () => {
    try {
      const newAcc: Omit<Account, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name,
        type: type,
        balance: parseFloat(initialBalance), // ✅ Convert string to number
        currency: currency,                  // ✅ Đúng kiểu string
        initialBalance: parseFloat(initialBalance),
        userId: userId,
        isActive: true,
        familyId: '',
      };

      await addAccount(newAcc);
      router.replace('/login');
    } catch (error) {
      console.error('Lỗi tạo tài khoản:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tạo Tài Khoản</Text>

      <Text style={styles.label}>Tên Tài Khoản</Text>
      <TextInput
        style={styles.input}
        placeholder="Ví dụ: Ví Tiền Mặt"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Loại Tài Khoản</Text>
      <TouchableOpacity onPress={() => setShowTypeModal(true)}>
        <TextInput
          style={styles.input}
          value={type.charAt(0).toUpperCase() + type.slice(1)}
          editable={false}
        />
      </TouchableOpacity>

      <Text style={styles.label}>Số Dư Ban Đầu</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập số tiền"
        keyboardType="numeric"
        value={initialBalance}
        onChangeText={setInitialBalance}
      />

      <Text style={styles.label}>Loại Tiền Tệ</Text>
      <TouchableOpacity onPress={() => setShowCurrencyModal(true)}>
        <TextInput
          style={styles.input}
          value={currency}
          editable={false}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleCreateAccount}>
        <Text style={styles.buttonText}>Tạo Tài Khoản</Text>
      </TouchableOpacity>

      {/* Modal chọn loại tài khoản */}
      <Modal visible={showTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Chọn Loại Tài Khoản</Text>
            <FlatList
              data={accountTypes}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectType(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowTypeModal(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal chọn tiền tệ */}
      <Modal visible={showCurrencyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Chọn Tiền Tệ</Text>
            <FlatList
              data={currencies}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectCurrency(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowCurrencyModal(false)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#e0f0ff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1e3d59',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  button: {
    backgroundColor: '#4c8ef7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalCancel: {
    marginTop: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#ff4444',
    fontSize: 16,
  },
});

export default CreateAccountScreen;
