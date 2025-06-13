import { Category } from '../models/types';
import { deleteAccount } from './accountServices';
import { addDocument,
        deleteDocument,
        updateDocument,
        queryDocuments,
        getCollection,
        listenDocument,
        getDocument
} from './firestoreservices';
import { RealtimeListenerService  } from './RealtimeListenerService';
const COLLECTION_NAME = 'Category';
// Hàm lấy trường cho Category
export const getCategoryField = async <K extends keyof Category>(
    categoryId: string,
    field: K
  ): Promise<Category[K] | null> => {
    try {
      const COLLECTION_NAME = 'Category';
      const category = await getDocument<Category>(COLLECTION_NAME, categoryId);
      if (!category) {
        return null;
      }
      return category[field];
    } catch (error) {
      console.error(`Lỗi khi lấy trường ${String(field)} từ danh mục ${categoryId}:`, error);
      throw error;
    }
  };
// thêm loại
export const addCategory = async ( categoryData: Omit<Category, 'Id' | 'createdAt'| 'updatedAt'> )
:Promise<string> =>{
    return await addDocument(COLLECTION_NAME, categoryData);
};
//lấy loại bằng Id
export const getCategoryById = async ( categoryId: string): 
Promise<Category | null> => {
    return await getDocument(COLLECTION_NAME, categoryId);
};
//lấy loại bằng Id gia đình
export const getCategoryByFamilyId = async ( familyId: string)
:Promise<Category[] | null> =>{
    return queryDocuments<Category>(COLLECTION_NAME,[{
        field: 'familyId', operator: '==', value: familyId
    }])
};
//lấy loại bằng type
export const getCategoryByType = async (familyId:string, type: 'income' | 'expense')
:Promise<Category[]> =>{
  return await queryDocuments<Category>(COLLECTION_NAME,[{
    field:'familyId', operator: '==', value:familyId
  },{
    field:'type', operator: '==', value: type
  }]);
};
//lấy hết data
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    return await getCollection<Category>(COLLECTION_NAME);
  } catch (error) {
    console.error('Lỗi khi lấy tất cả Category:', error);
    throw error;
  }
};
//cập nhật loại
export const updateCategory = async( categoryId: string, categoryData: Partial<Category>)
:Promise<void> =>{
    return await updateDocument(COLLECTION_NAME, categoryId, categoryData);
}
// xóa loại
export const deleteCategory = async ( categoryId:string)
:Promise<void> => {
    return await deleteDocument(COLLECTION_NAME,categoryId);
}
//lắng nghe thay đổi
export const listenToFamily = async(userId: string,callback: (user: Category | null) => void ) =>
{ 
  const realtimeService = new RealtimeListenerService()
  return realtimeService.listenToDocument<Category>(COLLECTION_NAME, userId, callback);
}
export const getCategoryByName = async (name: string): Promise<Category[] | null> =>{
    return queryDocuments<Category>(COLLECTION_NAME,[{
        field: 'name', operator: '==', value: name
    }])
};