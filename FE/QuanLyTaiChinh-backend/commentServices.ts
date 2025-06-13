import { Comment, Message } from '../models/types';
import {
    addDocument,
    deleteDocument,
    setDocument,
    updateDocument,
    queryDocuments,
    getDocument,
    listenDocument
} from './firestoreservices';
import { RealtimeListenerService  } from './RealtimeListenerService';
const COLLECTION_NAME = 'Comment';
// Hàm lấy trường cho Comment
export const getCommentField = async <K extends keyof Comment>(
    commentId: string,
    field: K
  ): Promise<Comment[K] | null> => {
    try {
      const COLLECTION_NAME = 'Comment';
      const comment = await getDocument<Comment>(COLLECTION_NAME, commentId);
      if (!comment) {
        return null;
      }
      return comment[field];
    } catch (error) {
      console.error(`Lỗi khi lấy trường ${String(field)} từ bình luận ${commentId}:`, error);
      throw error;
    }
  };
//tạo comment
export const addComment = async (commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>)
:Promise<string> => {
    return await addDocument(COLLECTION_NAME, commentData);
}
//lấy comment bằng Id
export const getCommentById = async ( commentId: string)
:Promise<Comment | null> => {
    return await getDocument(COLLECTION_NAME, commentId);
}
//lấy comment bằng Id người dùng
export const getCommentByUserId = async (userId: string)
:Promise<Comment[]> =>{
    return await queryDocuments<Comment>(COLLECTION_NAME,[{
        field: 'userId', operator: '==', value: userId
    }])
};
//lấy comment bằng tên người dùng
export const getCommentByUserName = async (userName: string)
:Promise<Comment[]> =>{
    return await queryDocuments<Comment>(COLLECTION_NAME,[{
        field: 'userName', operator: '==', value: userName
    }])
};

//cập nhật thông tin comment
export const updateComment = async ( commentid: string, commentData: Partial<Comment>)
:Promise<void> =>{
    return await updateDocument(COLLECTION_NAME,commentid, commentData);
};
// xóa commnet
export const deleteComment = async ( commentId: string)
:Promise<void> =>{
    return await deleteDocument(COLLECTION_NAME,commentId);
}
//lắng nghe thay đổi
export const listenToFamily = async(userId: string,callback: (user: Comment | null) => void ) =>
{ 
  const realtimeService = new RealtimeListenerService()
  return realtimeService.listenToDocument<Comment>(COLLECTION_NAME, userId, callback);
}
export const getCommentsByPostId = async (postId: string): Promise<Comment[]> => {
  return await queryDocuments<Comment>(
    'Comment',
    [{ field: 'socialPostId', operator: '==', value: postId }],
    'createdAt',
    'asc'
  );
};
