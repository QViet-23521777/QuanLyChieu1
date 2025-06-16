import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  View,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mainStyles from '@/src/styles/mainStyle';
import {ChatRoom, User } from '@/models/types';
import { getAllUsers } from '@/QuanLyTaiChinh-backend/userServices';
import { addChatRoom } from '@/QuanLyTaiChinh-backend/chatroomServices';
const NewChatRoomScreen: React.FC = () => {
  const [chatRoomName, setChatRoomName] = useState<string>('');
  const [membersInput, setMembersInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<User[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [showMemberModal, setShowMemberModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const navigation = useNavigation();

  useEffect(() => {
    const fetchAllUser = async () => {
      const u = await getAllUsers();
      setUser(u);
    }
    fetchAllUser();
  }, [])

  useEffect(() => {
    const fetchUserId = async () => {
      const uId = await AsyncStorage.getItem("userId");
      if(uId) {
        setUserId(uId);
      }
    }
    fetchUserId();
  }, [])

  // Cập nhật membersInput khi selectedMembers thay đổi
  useEffect(() => {
    const memberIds = selectedMembers.map(member => member.id).join(', ');
    setMembersInput(memberIds);
  }, [selectedMembers]);

  // Tách members từ input (phân tách bằng dấu phẩy, xuống dòng, hoặc dấu chấm phẩy)
  const getMembersFromInput = (): string[] => {
    if (!membersInput.trim()) return [];
    
    return membersInput
      .split(/[,;\n]/) // Tách bằng dấu phẩy, chấm phẩy, hoặc xuống dòng
      .map(member => member.trim())
      .filter(member => member.length > 0);
  };

  const members = getMembersFromInput();
  const isGroup = members.length >= 3;
  const canCreate = members.length > 0;

  // Lọc danh sách user theo search query và loại bỏ current user
  const filteredUsers = user.filter(u => {
    if (u.id === userId) return false; // Loại bỏ current user
    
    const matchesSearch = searchQuery === '' || 
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  // Xử lý chọn/bỏ chọn member
  const toggleMemberSelection = (selectedUser: User) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(member => member.id === selectedUser.id);
      if (isSelected) {
        return prev.filter(member => member.id !== selectedUser.id);
      } else {
        return [...prev, selectedUser];
      }
    });
  };

  // Kiểm tra xem user có được chọn hay không
  const isMemberSelected = (user: User): boolean => {
    return selectedMembers.some(member => member.id === user.id);
  };

  // Đóng modal và clear search
  const closeMemberModal = () => {
    setShowMemberModal(false);
    setSearchQuery('');
  };

  // Cấu hình header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Tạo chat mới',
      headerShown: true,
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={[
            styles.headerButton,
            { opacity: canCreate ? 1 : 0.5 }
          ]}
          onPress={handleCreateChatRoom}
          disabled={!canCreate || loading}
          activeOpacity={0.7}
        >
          <Text style={styles.headerButtonText}>
            {loading ? 'Đang tạo...' : 'Tạo'}
          </Text>
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: '#4A90E2',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 18,
      },
      headerTitleAlign: 'center',
    });
  }, [navigation, canCreate, loading]);

  const handleCreateChatRoom = async () => {
    if (members.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một thành viên');
      return;
    }

    setLoading(true);

    try {
      // Lấy current user ID
      const currentUserId = await AsyncStorage.getItem('userId');
      if (!currentUserId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng hiện tại');
        return;
      }

      // Thêm current user vào danh sách members nếu chưa có
      const allMembers = members.includes(currentUserId) 
        ? members 
        : [...members, currentUserId];

      // Tạo tên chat room mặc định nếu không nhập
      let finalChatRoomName = chatRoomName.trim();
      if (!finalChatRoomName) {
        if (isGroup) {
          const memberNames = selectedMembers.slice(0, 2).map(m => m.name).join(', ');
          finalChatRoomName = `Nhóm ${memberNames}${selectedMembers.length > 2 ? '...' : ''}`;
        } else {
          const memberName = selectedMembers[0]?.name || members[0];
          finalChatRoomName = `Chat với ${memberName}`;
        }
      }

      const newChatRoom: Omit<ChatRoom, 'id'> = {
        name: finalChatRoomName,
        isGroup: isGroup,
        members: allMembers,
        messageId: [],
        createdBy: currentUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('Creating chat room:', newChatRoom);
      
      // TODO: Thay thế bằng API call thực tế
       const createdRoom = await addChatRoom(newChatRoom);
      
      Alert.alert(
        'Thành công', 
        `Đã tạo ${isGroup ? 'nhóm chat' : 'cuộc trò chuyện'} "${finalChatRoomName}"`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      console.error('Error creating chat room:', error);
      Alert.alert('Lỗi', 'Không thể tạo chat room');
    } finally {
      setLoading(false);
    }
  };

  // Render item cho FlatList
  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        isMemberSelected(item) && styles.selectedUserItem
      ]}
      onPress={() => toggleMemberSelection(item)}
      activeOpacity={0.7}
    >
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {(item.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {item.name}
          </Text>
          {item.email && (
            <Text style={styles.userEmail}>{item.email}</Text>
          )}
          {item.phone && (
            <Text style={styles.userPhone}>{item.phone}</Text>
          )}
        </View>
      </View>
      <Ionicons
        name={isMemberSelected(item) ? "checkmark-circle" : "ellipse-outline"}
        size={24}
        color={isMemberSelected(item) ? "#4A90E2" : "#ccc"}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[mainStyles.container, styles.container]}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Chat Room Name Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tên chat (tùy chọn)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Nhập tên chat room..."
            value={chatRoomName}
            onChangeText={setChatRoomName}
            maxLength={50}
          />
          <Text style={styles.helperText}>
            Nếu không nhập, tên sẽ được tạo tự động từ danh sách thành viên
          </Text>
        </View>

        {/* Members Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thành viên</Text>
          <TouchableOpacity
            style={[styles.textInput, styles.membersSelector]}
            onPress={() => setShowMemberModal(true)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.membersSelectorText,
              selectedMembers.length === 0 && styles.placeholderText
            ]}>
              {selectedMembers.length === 0 
                ? 'Chạm để chọn thành viên...' 
                : `${selectedMembers.length} thành viên đã chọn`
              }
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          
          {/* Hiển thị danh sách thành viên đã chọn */}
          {selectedMembers.length > 0 && (
            <View style={styles.selectedMembersContainer}>
              {selectedMembers.map((member, index) => (
                <View key={member.id || index} style={styles.selectedMemberChip}>
                  <Text style={styles.selectedMemberText}>
                    {member.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => toggleMemberSelection(member)}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                  >
                    <Ionicons name="close-circle" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Chat Info Preview */}
        {selectedMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin chat</Text>
            <View style={styles.previewContainer}>
              <View style={styles.previewRow}>
                <Ionicons 
                  name={isGroup ? "people" : "person"} 
                  size={20} 
                  color="#4A90E2" 
                />
                <Text style={styles.previewText}>
                  {isGroup ? `Nhóm chat (${selectedMembers.length} thành viên)` : 'Chat cá nhân'}
                </Text>
              </View>
              
              <View style={styles.previewRow}>
                <Ionicons name="list" size={20} color="#666" />
                <Text style={styles.previewText}>
                  Thành viên: {selectedMembers.map(m => m.name).join(', ')}
                </Text>
              </View>
              
              {chatRoomName.trim() && (
                <View style={styles.previewRow}>
                  <Ionicons name="chatbubble" size={20} color="#666" />
                  <Text style={styles.previewText}>
                    Tên: {chatRoomName.trim()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Hướng dẫn:</Text>
            <Text style={styles.instructionText}>
              • Chọn ít nhất 1 thành viên để tạo chat
            </Text>
            <Text style={styles.instructionText}>
              • Từ 3 thành viên trở lên sẽ tự động tạo nhóm chat
            </Text>
            <Text style={styles.instructionText}>
              • Có thể bỏ trống tên chat, hệ thống sẽ tự động tạo
            </Text>
            <Text style={styles.instructionText}>
              • Chạm vào ô thành viên để chọn từ danh sách
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Member Selection Modal */}
      <Modal
        visible={showMemberModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={closeMemberModal}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn thành viên</Text>
            <Text style={styles.modalSelectedCount}>
              {selectedMembers.length} đã chọn
            </Text>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Users List */}
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            style={styles.usersList}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={closeMemberModal}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Xong</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  scrollContainer: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
    marginHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  membersSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  membersSelectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  selectedMembersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  selectedMemberChip: {
    backgroundColor: '#4A90E2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedMemberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  previewText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginLeft: -32, // Compensate for close button
  },
  modalSelectedCount: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  usersList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  userItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedUserItem: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 1,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 8,
  },
  modalFooter: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  doneButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NewChatRoomScreen;