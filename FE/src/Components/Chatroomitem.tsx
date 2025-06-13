import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatRoom } from '@/models/types';

interface ChatRoomItemProps {
  chatRoom: ChatRoom;
  onPress: () => void;
  onDelete: () => void;
  isSelected?: boolean;
}

const ChatRoomItem: React.FC<ChatRoomItemProps> = ({
  chatRoom,
  onPress,
  onDelete,
  isSelected = false,
}) => {
  const formatDate = (date: any) => {
    try {
      const dateObj = date instanceof Date ? date : date?.toDate?.();
      return dateObj?.toLocaleDateString('vi-VN') ?? '';
    } catch {
      return '';
    }
  };

  const getLastMessagePreview = () => {
    if (chatRoom.messageId?.length > 0) {
      return `${chatRoom.messageId.length} tin nhắn`;
    }
    return 'Chưa có tin nhắn';
  };

  const getMemberCount = () => {
    return chatRoom.members?.length ?? 0;
  };

  const getDefaultAvatarIcon = () => {
    return chatRoom.isGroup ? 'people' : 'person';
  };

  const getRoomDisplayName = () => {
    return chatRoom.name || (chatRoom.isGroup ? 'Nhóm chat' : 'Chat riêng tư');
  };

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.defaultAvatar}>
          <Ionicons
            name={getDefaultAvatarIcon()}
            size={24}
            color="#666"
          />
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.roomName} numberOfLines={1}>
            {getRoomDisplayName()}
          </Text>
          <Text style={styles.date}>
            {formatDate(chatRoom.updatedAt || chatRoom.createdAt)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {getLastMessagePreview()}
          </Text>
          <View style={styles.memberInfo}>
            <Ionicons name="people" size={14} color="#666" />
            <Text style={styles.memberCount}>{getMemberCount()}</Text>
          </View>
        </View>

        <View style={styles.typeRow}>
          <Text style={styles.roomType}>
            {chatRoom.isGroup ? 'Nhóm' : 'Riêng tư'}
          </Text>
          <Text style={styles.roomId} numberOfLines={1}>
            ID: {chatRoom.id}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Ionicons name="trash" size={20} color="#ff4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedContainer: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  avatarContainer: {
    marginRight: 12,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomType: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  roomId: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default ChatRoomItem;
