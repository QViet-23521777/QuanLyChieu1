import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingTemplate from '@/src/Components/SettingTemplate';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mainStyles from '@/src/styles/mainStyle';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from "@/models/types";
import { getUserById, updateUser, deleteUser } from "@/QuanLyTaiChinh-backend/userServices";

export default function DeleteAccountScreen() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        console.log("Fetched userId:", id);
        setUserId(id);
        
        if (id) {
          const userData = await getUserById(id);
          setUser(userData);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        Alert.alert("Lỗi", "Không thể lấy thông tin người dùng");
      }
    };
    fetchUserData();
  }, []);

  // Hàm xử lý khi nhấn nút "Đồng ý"
  const handleDelete = () => {
    if (!password || password.trim() === '') {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu để xác nhận");
      return;
    }

    if (!user) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
      return;
    }

    if (password !== user.password) {
      Alert.alert("Lỗi", "Mật khẩu không chính xác");
      return;
    }

    // Hiển thị modal xác nhận cuối cùng
    setModalVisible(true);
  };

  // Hàm xác nhận xóa tài khoản
  const confirmDelete = async () => {
    if (!userId) {
      Alert.alert("Lỗi", "Không tìm thấy ID người dùng");
      return;
    }

    setIsLoading(true);
    setModalVisible(false);

    try {
      await deleteUser(userId);
      
      // Xóa thông tin đăng nhập khỏi AsyncStorage
      await AsyncStorage.multiRemove(['userId', 'userToken', 'isLoggedIn']);
      
      Alert.alert(
        "Thành công", 
        "Tài khoản của bạn đã được xóa thành công", 
        [
          {
            text: "OK",
            onPress: () => {
              // Chuyển về màn hình đăng nhập hoặc welcome
              router.replace('/login'); // hoặc router.replace('/welcome')
            }
          }
        ]
      );
    } catch (error) {
      console.error("Lỗi khi xóa tài khoản:", error);
      Alert.alert("Lỗi", "Không thể xóa tài khoản. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm hủy xóa tài khoản
  const cancelDelete = () => {
    setModalVisible(false);
    setPassword(''); // Reset password field
  };

  return (
    <SafeAreaView style={mainStyles.container}>
      <SafeAreaView style={[mainStyles.topSheet, { padding: 0 }]} />
      <View style={mainStyles.bottomeSheet}>
        <View style={styles.container}>
          <Text style={styles.question}>Bạn có chắc muốn xóa tài khoản?</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              • Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu của bạn và bạn sẽ không thể khôi phục. Vui lòng lưu ý những điều sau trước khi tiếp tục:
            </Text>
            <Text style={styles.infoText}>
              • Tài khoản sẽ bị xóa, bao gồm cả các giao dịch liên quan bị xóa.
            </Text>
            <Text style={styles.infoText}>
              • Bạn sẽ không thể truy cập vào tài khoản hoặc bất kỳ thông tin liên quan nào.
            </Text>
            <Text style={styles.infoText}>
              • Hành động này không thể hoàn tác.
            </Text>
          </View>
          <Text style={styles.label}>Nhập mật khẩu để xác nhận</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="●●●●●●●●"
              placeholderTextColor="#7a8fa6"
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={22}
                color="#7a8fa6"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.deleteButton, isLoading && styles.disabledButton]} 
            onPress={handleDelete}
            disabled={isLoading}
          >
            <Text style={styles.deleteButtonText}>
              {isLoading ? "Đang xử lý..." : "Đồng ý"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.cancelButton, isLoading && styles.disabledButton]} 
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
        </View>

        {/* Modal xác nhận xóa tài khoản */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={cancelDelete}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Xóa Tài Khoản</Text>
              <Text style={styles.modalQuestion}>Bạn Đã Chắc Chắn Xóa Tài Khoản?</Text>
              <Text style={styles.modalDesc}>
                Bằng việc xóa tài khoản của bạn, bạn đồng ý rằng bạn đã hiểu rõ hậu quả của hành động này và đồng ý xóa vĩnh viễn tài khoản cùng toàn bộ dữ liệu liên quan.
              </Text>
              <TouchableOpacity style={styles.modalDeleteButton} onPress={confirmDelete}>
                <Text style={styles.modalDeleteButtonText}>Xóa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelButton} onPress={cancelDelete}>
                <Text style={styles.modalCancelButtonText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    alignItems: 'center',
    flex: 1,
  },
  question: {
    fontSize: 15,
    fontFamily: 'Montserrat_700Bold',
    color: '#145A5A',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#D6EAF8',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    width: '100%',
  },
  infoText: {
    fontSize: 13,
    color: '#222',
    fontFamily: 'Montserrat_400Regular',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#222',
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 6,
    alignSelf: 'flex-start',
    marginLeft: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D6EAF8',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 2,
    marginBottom: 18,
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#222',
    fontFamily: 'Montserrat_700Bold',
    paddingVertical: 10,
    letterSpacing: 4,
  },
  deleteButton: {
    backgroundColor: '#7EC6FF',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    width: 220,
  },
  deleteButtonText: {
    color: '#000',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#D6EAF8',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    width: 220,
  },
  cancelButtonText: {
    color: '#145A5A',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    width: 300,
    alignItems: 'center',
    elevation: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Montserrat_700Bold',
    color: '#145A5A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalQuestion: {
    fontSize: 14,
    fontFamily: 'Montserrat_700Bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 13,
    color: '#222',
    fontFamily: 'Montserrat_400Regular',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalDeleteButton: {
    backgroundColor: '#7EC6FF',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    width: 160,
    marginBottom: 10,
  },
  modalDeleteButtonText: {
    color: '#000',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
  modalCancelButton: {
    backgroundColor: '#D6EAF8',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    width: 160,
  },
  modalCancelButtonText: {
    color: '#145A5A',
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
});