import { User } from '../models/types';
import {
    addDocument,
    getCollection,
    updateDocument,
    deleteDocument,
    queryDocuments,
    getDocument
} from './firestoreservices';
import { RealtimeListenerService  } from './RealtimeListenerService';
const COLLECTION_NAME = 'User';
// Hàm lấy trường cho User
export const getUserField = async <K extends keyof User>(
    userId: string,
    field: K
  ): Promise<User[K] | null> => {
    try {
      const COLLECTION_NAME = 'User';
      const user = await getDocument<User>(COLLECTION_NAME, userId);
      if (!user) {
        return null;
      }
      return user[field];
    } catch (error) {
      console.error(`Lỗi khi lấy trường ${String(field)} từ người dùng ${userId}:`, error);
      throw error;
    }
  };
//thêm user
export const addUser = async( userData: Omit<User,'id'| 'createdAt' | 'updatedAt'>)
:Promise<string> =>
{
    return await addDocument(COLLECTION_NAME, userData);
};
//lấy thông tin bằng id
export const getUserById = async(userId: string)
:Promise<User | null> =>{
    return await getDocument<User>(COLLECTION_NAME, userId);
};
//lấy thông tin bằng familyid
export const getUserByFamilyId = async(familyId: string)
:Promise<User[] | null> =>{
    return await queryDocuments<User>(COLLECTION_NAME,[
        { field: 'familyId', operator: '==', value: familyId}
    ]);
};
export const getUserByEmail = async (email: string)
:Promise<User[] | null> =>{
    return await queryDocuments<User>(COLLECTION_NAME,[
        { field: 'email', operator: '==', value: email}
    ]);
};
export const getAllUsers = async (): Promise<User[]> => {
  try {
    return await getCollection<User>(COLLECTION_NAME);
  } catch (error) {
    console.error('Lỗi khi lấy tất cả User:', error);
    throw error;
  }
};
//cập nhật người dùng
export const updateUser = async(userId: string, userData: Partial<User>):
Promise<void> =>{
    await updateDocument(COLLECTION_NAME,userId,userData);
}
//xóa người dùng
export const deleteUser = async(userId: string):
Promise<void> =>{
    await deleteDocument(COLLECTION_NAME, userId);
}
//lắng nghe thay đổi
export const listenToUser = async(userId: string,callback: (user: User | null) => void ) =>
{ 
  const realtimeService = new RealtimeListenerService()
  return realtimeService.listenToDocument<User>(COLLECTION_NAME, userId, callback);
}
// Xác thực user có email khớp không
export const verifyUserEmail = async (userId: string, email: string): Promise<boolean> => {
    try {
        const user = await getUserById(userId);
        if (!user) return false;
        return user.email === email;
    } catch (error) {
        console.error(`Lỗi khi xác thực email user ${userId}:`, error);
        return false;
    }
};
//đăng nhập
export const login = async ( email: string, password: string): Promise<string> =>
{
  try{
    const user = await getUserByEmail(email);
    console.log('user:', user);
    if(!user || user.length == 0 )
    {
      throw new Error('Email không tồn tại');
    }
    console.log('a');
    for(const u of user) {
  console.log('d');
  console.log(u.password," ", password);
  
  if(u.password && u.password == password) {
    console.log('e');
    return u.id;
  }
  console.log('c');
}
    console.log('b');
    throw new Error('Mật khẩu không chính xác');
  }catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        throw error;
    }
}
//đăng ký
export const register = async (
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
    try {
        const existingUsers = await getUserByEmail(userData.email);
        
        if (existingUsers && existingUsers.length > 0) {
            throw new Error('Email đã tồn tại');
        }
        
        const userId = await addUser(userData);
        return userId;
    } catch (error) {
        console.error('Lỗi khi đăng ký:', error);
        throw error;
    }
  }