// src/(chat)/ChatInfoScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mainStyles from '@/src/styles/mainStyle';
import { ChatRoom, User } from '@/models/types';
import { getChatRoomById, addMemberToChatRoom, removeMemberFromChatRoom } from '@/QuanLyTaiChinh-backend/chatroomServices';
import { getUserById, getAllUsers } from '@/QuanLyTaiChinh-backend/userServices';

type RootStackParamList = {
  ChatInfoScreen: { chatRoomId: string; chatRoom?: ChatRoom };
};

type ChatInfoScreenRouteProp = RouteProp<RootStackParamList, 'ChatInfoScreen'>;
type ChatInfoScreenNavigationProp = NavigationProp<RootStackParamList>;

interface Member {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

const ChatInfoScreen: React.FC = () => {
  const navigation = useNavigation<ChatInfoScreenNavigationProp>();
  const route = useRoute<ChatInfoScreenRouteProp>();

  const [loading, setLoading] = useState<boolean>(true);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState<boolean>(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);

  // Modal states
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [searchUserQuery, setSearchUserQuery] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [addMemberLoading, setAddMemberLoading] = useState<boolean>(false);
  const [removeMemberLoading, setRemoveMemberLoading] = useState<string | null>(null);

  useEffect(() => {
    initializeChatRoomId();
  }, []);

  useEffect(() => {
    if (chatRoomId) {
      loadData();
    }
  }, [chatRoomId]);

  useEffect(() => {
    if (!searchUserQuery.trim()) {
      setFilteredUsers(availableUsers);
    } else {
      const filtered = availableUsers.filter(user => 
        user.name?.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchUserQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchUserQuery, availableUsers]);

  const initializeChatRoomId = async () => {
    try {
      let roomId: string | null = route.params?.chatRoomId || null;
      if (!roomId) {
        roomId = await AsyncStorage.getItem('currentChatRoomId');
      }
      
      if (!roomId) {
        Alert.alert('Lỗi', 'Không tìm thấy ID phòng chat');
        navigation.goBack();
        return;
      }
      
      setChatRoomId(roomId);
    } catch (error) {
      console.error('Error getting chatRoomId:', error);
      Alert.alert('Lỗi', 'Không thể lấy thông tin phòng chat');
      navigation.goBack();
    }
  };

  const loadData = async () => {
    if (!chatRoomId) return;

    try {
      setLoading(true);
      
      // Lấy user hiện tại
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
        return;
      }
      setCurrentUserId(userId);

      // Lấy thông tin chatroom
      const chatRoomData = await getChatRoomById(chatRoomId);
      if (!chatRoomData) {
        Alert.alert('Lỗi', 'Không tìm thấy phòng chat');
        navigation.goBack();
        return;
      }
      setChatRoom(chatRoomData);

      // Kiểm tra members array có tồn tại không
      const memberIds = chatRoomData.members || [];
      console.log("Số lượng thành viên là: " + memberIds.length);
      console.log("Member IDs:", memberIds); // DEBUG: Xem danh sách memberIds

      // Kiểm tra nếu không có members
      if (memberIds.length === 0) {
        console.log("Không có members trong chatRoom");
        setMembers([]);
        setIsCurrentUserAdmin(chatRoomData.createdBy === userId);
        return;
      }

      // Load members với Promise.allSettled để tránh lỗi một user ảnh hưởng toàn bộ
      const memberPromises = memberIds
        .filter((memberId): memberId is string => {
          const isValid = memberId != null && memberId.trim() !== '';
          if (!isValid) {
            console.log("Invalid member ID:", memberId); // DEBUG
          }
          return isValid;
        })
        .map(async (memberId: string): Promise<Member | null> => {
          try {
            console.log("Loading user:", memberId); // DEBUG
            const user = await getUserById(memberId);
            console.log("User data:", user); // DEBUG
            
            
              const member = {
                id: user.id,
                name: user.name || 'Không có tên',
                email: user.email || '',
                isAdmin: chatRoomData.createdBy === user.id,
              };
              console.log("Created member:", member); // DEBUG
              return member;
           
          } catch (error) {
            console.error('Error getting user:', memberId, error);
            return null;
          }
        });

      console.log("Total member promises:", memberPromises.length); // DEBUG

      const memberResults = await Promise.allSettled(memberPromises);
      console.log("Promise results:", memberResults); // DEBUG
      
      // Xử lý kết quả từ Promise.allSettled
      const membersData: Member[] = [];
      for (const result of memberResults) {
        if (result.status === 'fulfilled' && result.value !== null) {
          membersData.push(result.value);
        } else if (result.status === 'rejected') {
          console.log("Promise rejected:", result.reason); // DEBUG
        }
      }

      console.log("Final members count:", membersData.length); // DEBUG
      console.log("Final members data:", membersData); // DEBUG

      // Nếu không có member nào được load thành công, thử tạo fallback
      if (membersData.length === 0 && memberIds.length > 0) {
        console.log("WARNING: Không có member nào được load thành công!");
        // Tạo fallback members để hiển thị
        const fallbackMembers = memberIds.map(id => ({
          id,
          name: 'Người dùng không xác định',
          email: '',
          isAdmin: chatRoomData.createdBy === id,
        }));
        setMembers(fallbackMembers);
      } else {
        setMembers(membersData);
      }

      // Kiểm tra quyền admin
      setIsCurrentUserAdmin(chatRoomData.createdBy === userId);

      // Load available users để thêm (song song với load members)
      try {
        const users = await getAllUsers();
        if (Array.isArray(users)) {
          const available = users.filter(user => 
            user && 
            user.id && 
            user.id.trim() !== '' && 
            !memberIds.includes(user.id)
          );
          setAvailableUsers(available);
          setFilteredUsers(available);
        } else {
          console.warn('getAllUsers không trả về array:', users);
          setAvailableUsers([]);
          setFilteredUsers([]);
        }
      } catch (error) {
        console.error('Error loading available users:', error);
        // Không block toàn bộ UI nếu load available users thất bại
        setAvailableUsers([]);
        setFilteredUsers([]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin chat');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (!chatRoomId || selectedUsers.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một thành viên');
      return;
    }

    try {
      setAddMemberLoading(true);
      
      let successCount = 0;
      for (const userId of selectedUsers) {
        try {
          await addMemberToChatRoom(chatRoomId, userId);
          successCount++;
        } catch (error) {
          console.error('Error adding user:', userId, error);
        }
      }

      await loadData(); // Reload data
      setSelectedUsers([]);
      setSearchUserQuery('');
      setShowAddMemberModal(false);
      
      if (successCount > 0) {
        Alert.alert('Thành công', `Đã thêm ${successCount} thành viên mới`);
      } else {
        Alert.alert('Lỗi', 'Không thể thêm thành viên nào');
      }
    } catch (error) {
      console.error('Error adding members:', error);
      Alert.alert('Lỗi', 'Không thể thêm thành viên');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleRemoveMember = (member: Member) => {
    // Không cho phép xóa admin
    if (member.isAdmin) {
      Alert.alert('Không thể xóa', 'Không thể xóa quản trị viên khỏi nhóm');
      return;
    }

    // Không cho phép xóa chính mình
    if (member.id === currentUserId) {
      Alert.alert('Không thể xóa', 'Bạn không thể xóa chính mình khỏi nhóm');
      return;
    }

    Alert.alert(
      'Xác nhận xóa thành viên',
      `Bạn có chắc chắn muốn xóa ${member.name} khỏi nhóm?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => confirmRemoveMember(member.id),
        },
      ]
    );
  };

  const confirmRemoveMember = async (memberId: string) => {
    if (!chatRoomId) return;

    try {
      setRemoveMemberLoading(memberId);
      
      await removeMemberFromChatRoom(chatRoomId, memberId);
      await loadData(); // Reload data
      
      Alert.alert('Thành công', 'Đã xóa thành viên khỏi nhóm');
    } catch (error) {
      console.error('Error removing member:', error);
      Alert.alert('Lỗi', 'Không thể xóa thành viên');
    } finally {
      setRemoveMemberLoading(null);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const renderMemberItem = ({ item }: { item: Member }) => (
    <View style={styles.memberItem}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberEmail}>{item.email}</Text>
        {item.isAdmin && (
          <Text style={styles.adminBadge}>Quản trị viên</Text>
        )}
      </View>
      
      {/* Nút xóa thành viên (chỉ hiển thị cho admin và không phải admin/chính mình) */}
      {isCurrentUserAdmin && !item.isAdmin && item.id !== currentUserId && (
        <TouchableOpacity
          style={styles.removeMemberButton}
          onPress={() => handleRemoveMember(item)}
          disabled={removeMemberLoading === item.id}
        >
          {removeMemberLoading === item.id ? (
            <ActivityIndicator size="small" color="#ff4444" />
          ) : (
            <Ionicons name="remove-circle" size={20} color="#ff4444" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAvailableUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[
        styles.availableUserItem,
        selectedUsers.includes(item.id) && styles.selectedUserItem
      ]}
      onPress={() => toggleUserSelection(item.id)}
    >
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>
          {item.name ? item.name.charAt(0).toUpperCase() : '?'}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name || 'Không có tên'}</Text>
        <Text style={styles.memberEmail}>{item.email || ''}</Text>
      </View>
      {selectedUsers.includes(item.id) && (
        <Ionicons name="checkmark-circle" size={24} color="#4A90E2" />
      )}
    </TouchableOpacity>
  );

  if (!chatRoomId || loading) {
    return (
      <SafeAreaView style={[mainStyles.container, styles.container]}>
        <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      <SafeAreaView style={[mainStyles.container, styles.container]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Thành viên ({members.length})
          </Text>
          {isCurrentUserAdmin && (
            <TouchableOpacity onPress={() => setShowAddMemberModal(true)}>
              <Ionicons name="person-add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Members List */}
        <FlatList
          data={members}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.id}
          style={styles.membersList}
          showsVerticalScrollIndicator={false}
        />

        {/* Add Member Modal */}
        <Modal
          visible={showAddMemberModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddMemberModal(false);
                  setSelectedUsers([]);
                  setSearchUserQuery('');
                }}
              >
                <Text style={styles.modalCancelButton}>Hủy</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Thêm thành viên</Text>
              <TouchableOpacity 
                onPress={handleAddMembers}
                disabled={selectedUsers.length === 0 || addMemberLoading}
              >
                {addMemberLoading ? (
                  <ActivityIndicator size="small" color="#4A90E2" />
                ) : (
                  <Text style={[
                    styles.modalSaveButton,
                    selectedUsers.length === 0 && styles.disabledButton
                  ]}>
                    Thêm ({selectedUsers.length})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm kiếm người dùng..."
                  value={searchUserQuery}
                  onChangeText={setSearchUserQuery}
                  placeholderTextColor="#999"
                />
              </View>

              {/* User List */}
              <FlatList
                data={filteredUsers}
                renderItem={renderAvailableUserItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="people" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>
                      {searchUserQuery 
                        ? 'Không tìm thấy người dùng nào'
                        : 'Không có người dùng nào để thêm'
                      }
                    </Text>
                  </View>
                }
              />
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  membersList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  adminBadge: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
    marginTop: 2,
  },
  removeMemberButton: {
    padding: 8,
    marginLeft: 8,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalSaveButton: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  disabledButton: {
    color: '#ccc',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  availableUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedUserItem: {
    backgroundColor: '#E8F2FF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default ChatInfoScreen;