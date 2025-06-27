import React, { useState, useLayoutEffect, useEffect,useRef, useCallback } from 'react';
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
import { ChatRoom, User } from '@/models/types';
import { getAllUsers } from '@/QuanLyTaiChinh-backend/userServices';
import { addChatRoom } from '@/QuanLyTaiChinh-backend/chatroomServices';

const NewChatRoomScreen: React.FC = () => {
  const [chatRoomName, setChatRoomName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [user, setUser] = useState<User[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [showMemberModal, setShowMemberModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const selectedMembersRef = useRef<User[]>([]);

useEffect(() => {
  selectedMembersRef.current = selectedMembers;
}, [selectedMembers]);
  const navigation = useNavigation();
  
  // Fetch all users
  useEffect(() => {
    const fetchAllUser = async () => {
      try {
        const u = await getAllUsers();
        console.log('Fetched users:', u);
        setUser(u);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchAllUser();
  }, []);

  // Fetch current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const uId = await AsyncStorage.getItem("userId");
        console.log('Current user ID:', uId);
        if (uId) {
          setUserId(uId);
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };
    fetchUserId();
  }, []);

  const isGroup = selectedMembers.length >= 2; // Changed from 3 to 2 since we'll add current user
  const canCreate = selectedMembers.length > 0;

  // Filter users - exclude current user and apply search
  const filteredUsers = user.filter(u => {
    if (u.id === userId) return false; // Exclude current user
    
    const matchesSearch = searchQuery === '' || 
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  // Toggle member selection with better logging
  const toggleMemberSelection = (selectedUser: User) => {
  console.log('Toggling member:', selectedUser.name, selectedUser.id);
  
  setSelectedMembers(prev => {
    const isSelected = prev.some(member => member.id === selectedUser.id);
    console.log('Is already selected:', isSelected);

    const newSelection = isSelected
      ? prev.filter(member => member.id !== selectedUser.id)
      : [...prev, selectedUser];

    console.log(`${isSelected ? 'Removing' : 'Adding'} member, new count:`, newSelection.length);
    console.log('New selected members:', newSelection.map(m => m.name));

    return newSelection;
  });
};


  // Check if user is selected
  const isMemberSelected = useCallback((checkUser: User): boolean => {
    const isSelected = selectedMembers.some(member => member.id === checkUser.id);
    return isSelected;
  }, [selectedMembers]);

  // Close modal and clear search
  const closeMemberModal = useCallback(() => {
    setShowMemberModal(false);
    setSearchQuery('');
  }, []);
const handleCreateChatRoomWrapper = () => {
  handleCreateChatRoom(selectedMembersRef.current);
};
  // Header configuration
  // Header configuration
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
        onPress={handleCreateChatRoomWrapper} // ✅ Dùng wrapper đã sửa
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

// Sửa handleCreateChatRoom để nhận selectedMembers làm tham số
const handleCreateChatRoom = async (members: User[]) => {
  console.log('=== START CREATE CHAT ROOM ===');

  if (members.length === 0) {
    console.log('ERROR: No members selected');
    Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một thành viên');
    return;
  }

  console.log('Selected members count:', members.length);
  console.log('Selected members:', members.map(m => ({ id: m.id, name: m.name })));

  setLoading(true);

  try {
    const currentUserId = await AsyncStorage.getItem('userId');
    console.log('Current user ID:', currentUserId);

    if (!currentUserId) {
      console.log('ERROR: No current user ID found');
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng hiện tại');
      return;
    }

    const memberIds = members.map(member => member.id);
    const allMembers = [...memberIds, currentUserId];
    const isGroupChat = allMembers.length >= 3;

    let finalChatRoomName = chatRoomName.trim();

    if (!finalChatRoomName) {
      if (isGroupChat) {
        const displayNames = members.slice(0, 3).map(m => m.name || 'Unknown');
        finalChatRoomName = members.length > 3
          ? `Nhóm ${displayNames.join(', ')}...`
          : `Nhóm ${displayNames.join(', ')}`;
      } else {
        const otherMember = members[0];
        finalChatRoomName = `Chat với ${otherMember?.name || 'Unknown'}`;
      }
    }

    const newChatRoom = {
      name: finalChatRoomName,
      isGroup: isGroupChat,
      members: allMembers,
      messageId: [],
      createdBy: currentUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Creating chat room with data:', newChatRoom);

    const createdRoom = await addChatRoom(newChatRoom);

    console.log('Chat room created successfully:', createdRoom);

    Alert.alert(
      'Thành công',
      `Đã tạo ${isGroupChat ? 'nhóm chat' : 'cuộc trò chuyện'} "${finalChatRoomName}" với ${members.length} thành viên`,
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );

  } catch (error) {
    console.error('Error creating chat room:', error);
    Alert.alert('Lỗi', 'Không thể tạo chat room. Vui lòng thử lại.');
  } finally {
    setLoading(false);
  }
};


  // Render user item with better key and optimization
  const renderUserItem = useCallback(({ item }: { item: User }) => {
    const isSelected = isMemberSelected(item);
    
    return (
      <TouchableOpacity
        style={[
          styles.userItem,
          isSelected && styles.selectedUserItem
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
              {item.name || 'Unknown'}
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
          name={isSelected ? "checkmark-circle" : "ellipse-outline"}
          size={24}
          color={isSelected ? "#4A90E2" : "#ccc"}
        />
      </TouchableOpacity>
    );
  }, [isMemberSelected, toggleMemberSelection]);

  // Remove selected member
  const removeSelectedMember = useCallback((member: User) => {
    console.log('Removing member:', member.name);
    setSelectedMembers(prev => prev.filter(m => m.id !== member.id));
  }, []);

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
          
          {/* Display selected members */}
          {selectedMembers.length > 0 && (
            <View style={styles.selectedMembersContainer}>
              {selectedMembers.map((member) => (
                <View key={member.id} style={styles.selectedMemberChip}>
                  <Text style={styles.selectedMemberText}>
                    {member.name || 'Unknown'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeSelectedMember(member)}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                  >
                    <Ionicons name="close-circle" size={16} color="#fff" />
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
                  {isGroup ? `Nhóm chat (${selectedMembers.length + 1} thành viên)` : 'Chat cá nhân'}
                </Text>
              </View>
              
              <View style={styles.previewRow}>
                <Ionicons name="list" size={20} color="#666" />
                <Text style={styles.previewText}>
                  Thành viên: {selectedMembers.map(m => m.name || 'Unknown').join(', ')}
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
            extraData={selectedMembers} // Important: This ensures FlatList re-renders when selectedMembers changes
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
    marginLeft: -32,
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