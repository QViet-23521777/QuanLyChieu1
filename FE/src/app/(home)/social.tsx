import { SafeAreaView } from "react-native-safe-area-context";
import {
    View,
    FlatList,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Modal,
    ScrollView,
} from "react-native";
import mainStyles from "@/src/styles/mainStyle";
import { useRouter } from "expo-router";
import { useCategory } from "@/src/context/categoryContext";
import React, { useState, useEffect } from "react";
import { User, SocialPost, Comment } from "@/models/types";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPostByFamilyId, likePost, unlikePost, addSocialPost } from '@/QuanLyTaiChinh-backend/socialPost';
import { getUserById } from '@/QuanLyTaiChinh-backend/userServices';
import { 
    getCommentById, 
    getCommentsByPostId, 
    addComment, 
    updateComment, 
    deleteComment 
} from '@/QuanLyTaiChinh-backend/commentServices';
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Thêm type để xử lý Timestamp từ Firebase
interface FirebaseTimestamp {
    toDate(): Date;
    seconds: number;
    nanoseconds: number;
}

interface PostWithComments extends SocialPost {
    comments: Comment[];
    isLikedByUser: boolean;
}

// Component để thêm bài viết mới
const AddPostModal = ({ 
    visible, 
    onClose, 
    currentUser, 
    onPostAdded 
}: {
    visible: boolean;
    onClose: () => void;
    currentUser: User;
    onPostAdded: () => void;
}) => {
    const [postContent, setPostContent] = useState('');
    const [postType, setPostType] = useState<'photo' | 'expense' | 'achievement'>('photo');
    const [isPublic, setIsPublic] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        const fetchUserId = async () => {
            const id = await AsyncStorage.getItem("userId");
            setUserId(id);
        };
        fetchUserId();
    }, []);
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
    const handleSubmitPost = async () => {
        if (!postContent.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập nội dung bài viết');
            return;
        }

        if (!userId || !currentUser.familyId) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng hoặc gia đình');
            return;
        }

        setIsSubmitting(true);
        try {
            // Tạo bài viết mới
            const postData: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'> = {
            content: postContent.trim(),
            type: '',
            isPublic: isPublic,
            createdBy: userId,
            createdByName: user?.name || 'Người dùng',
            familyId: user?.familyId || '',
            likes: [],
            numlike: 0,
            numcom: 0,
            commentsId: [],
            photoId: [],
            transactionId: []
        };

        const newPost = await addSocialPost(postData);

            // Gọi API để tạo bài viết (bạn cần import và implement hàm này)
            // await createPost(newPost);
            Alert.alert('Thành công', 'Đã đăng bài viết');
            setPostContent('');
            setPostType('photo');
            setIsPublic(true);
            onPostAdded();
            onClose();
        } catch (error) {
            console.error('Error creating post:', error);
            Alert.alert('Lỗi', 'Không thể đăng bài viết. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onClose}>
                        <MaterialCommunityIcons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Tạo bài viết</Text>
                    <TouchableOpacity
                        style={[
                            styles.postButton,
                            (!postContent.trim() || isSubmitting) && styles.postButtonDisabled
                        ]}
                        onPress={handleSubmitPost}
                        disabled={!postContent.trim() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.postButtonText}>Đăng</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{currentUser.name}</Text>
                        <TouchableOpacity
                            style={styles.privacyButton}
                            onPress={() => setIsPublic(!isPublic)}
                        >
                            <MaterialCommunityIcons
                                name={isPublic ? "earth" : "account-group"}
                                size={16}
                                color="#666"
                            />
                            <Text style={styles.privacyText}>
                                {isPublic ? "Công khai" : "Gia đình"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.contentInput}
                        placeholder="Bạn đang nghĩ gì?"
                        value={postContent}
                        onChangeText={setPostContent}
                        multiline
                        textAlignVertical="top"
                        maxLength={1000}
                    />

                    <View style={styles.postTypeSection}>
                        <Text style={styles.sectionTitle}>Loại bài viết</Text>
                        <View style={styles.postTypeButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    postType === 'photo' && styles.typeButtonActive
                                ]}
                                onPress={() => setPostType('photo')}
                            >
                                <MaterialCommunityIcons
                                    name="camera"
                                    size={20}
                                    color={postType === 'photo' ? '#007AFF' : '#666'}
                                />
                                <Text style={[
                                    styles.typeButtonText,
                                    postType === 'photo' && styles.typeButtonTextActive
                                ]}>
                                    Ảnh
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    postType === 'expense' && styles.typeButtonActive
                                ]}
                                onPress={() => setPostType('expense')}
                            >
                                <MaterialCommunityIcons
                                    name="cash"
                                    size={20}
                                    color={postType === 'expense' ? '#007AFF' : '#666'}
                                />
                                <Text style={[
                                    styles.typeButtonText,
                                    postType === 'expense' && styles.typeButtonTextActive
                                ]}>
                                    Chi tiêu
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    postType === 'achievement' && styles.typeButtonActive
                                ]}
                                onPress={() => setPostType('achievement')}
                            >
                                <MaterialCommunityIcons
                                    name="trophy"
                                    size={20}
                                    color={postType === 'achievement' ? '#007AFF' : '#666'}
                                />
                                <Text style={[
                                    styles.typeButtonText,
                                    postType === 'achievement' && styles.typeButtonTextActive
                                ]}>
                                    Thành tích
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.characterCount}>
                        <Text style={styles.characterCountText}>
                            {postContent.length}/1000
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

// Component để render từng comment với chức năng edit/delete
const CommentItem = ({ 
    comment, 
    currentUserId, 
    onEdit, 
    onDelete 
}: { 
    comment: Comment;
    currentUserId: string;
    onEdit: (comment: Comment) => void;
    onDelete: (commentId: string) => void;
}) => {
    const formatDate = (date: Date | FirebaseTimestamp | string | number) => {
        if (!date) return "";

        let d: Date;

        if (typeof date === "object" && "toDate" in date) {
            d = (date as FirebaseTimestamp).toDate();
        } else if (date instanceof Date) {
            d = date;
        } else {
            d = new Date(date);
        }

        return (
            d.toLocaleDateString("vi-VN") +
            " " +
            d.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
            })
        );
    };

    const isMyComment = comment.userId === currentUserId;

    return (
        <View style={styles.commentContainer}>
            <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{comment.userName}</Text>
                <View style={styles.commentActions}>
                    <Text style={styles.commentDate}>
                        {formatDate(comment.createdAt)}
                    </Text>
                    {isMyComment && (
                        <View style={styles.commentButtonGroup}>
                            <TouchableOpacity
                                style={styles.commentActionButton}
                                onPress={() => onEdit(comment)}
                            >
                                <MaterialCommunityIcons
                                    name="pencil"
                                    size={16}
                                    color="#007AFF"
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.commentActionButton}
                                onPress={() => onDelete(comment.id)}
                            >
                                <MaterialCommunityIcons
                                    name="delete"
                                    size={16}
                                    color="#FF3B30"
                                />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
            <Text style={styles.commentText}>{comment.text}</Text>
        </View>
    );
};

// Component để thêm/chỉnh sửa comment
const CommentInput = ({ 
    postId, 
    currentUser, 
    onCommentAdded, 
    editingComment,
    onCancelEdit
}: {
    postId: string;
    currentUser: User;
    onCommentAdded: () => void;
    editingComment?: Comment;
    onCancelEdit?: () => void;
}) => {
    const [commentText, setCommentText] = useState(editingComment?.text || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        const fetchUserId = async () => {
            const id = await AsyncStorage.getItem("userId");
            console.log("Fetched userId:", id); // Thêm dòng này
            setUserId(id);
        };
        fetchUserId();
    }, []);
    useEffect(() => {
        setCommentText(editingComment?.text || '');
    }, [editingComment]);

    const handleSubmitComment = async () => {
        if (!commentText.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập nội dung bình luận');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingComment) {
                // Chỉnh sửa comment
                await updateComment(editingComment.id, {
                    text: commentText.trim(),
                    updatedAt: new Date()
                });
                Alert.alert('Thành công', 'Đã cập nhật bình luận');
                onCancelEdit?.();
            } else {
                // Thêm comment mới
                await addComment({
                    text: commentText.trim(),
                    userId: userId || '',
                    userName: currentUser.name,
                    socialPostId: postId,
                });
            }
            
            setCommentText('');
            onCommentAdded();
        } catch (error) {
            console.error('Error submitting comment:', error);
            Alert.alert('Lỗi', 'Không thể gửi bình luận. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.commentInputContainer}>
            {editingComment && (
                <View style={styles.editingHeader}>
                    <Text style={styles.editingText}>Đang chỉnh sửa bình luận</Text>
                    <TouchableOpacity onPress={onCancelEdit}>
                        <MaterialCommunityIcons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.commentInputRow}>
                <TextInput
                    style={styles.commentInput}
                    placeholder="Viết bình luận..."
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[
                        styles.commentSubmitButton,
                        (!commentText.trim() || isSubmitting) && styles.commentSubmitButtonDisabled
                    ]}
                    onPress={handleSubmitComment}
                    disabled={!commentText.trim() || isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <MaterialCommunityIcons
                            name="send"
                            size={20}
                            color="#fff"
                        />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Component để render từng post với thông tin chi tiết
const PostItem = ({ 
    post, 
    comments, 
    currentUser,
    onRefresh 
}: { 
    post: SocialPost;
    comments: Comment[];
    currentUser: User;
    onRefresh: () => void;
}) => {
    const [showComments, setShowComments] = useState(false);
    const [liked, setLiked] = useState(post.likes?.includes(currentUser.id) || false);
    const [likeCount, setLikeCount] = useState(post.numlike || 0);
    const [isLiking, setIsLiking] = useState(false);
    const [editingComment, setEditingComment] = useState<Comment | undefined>();
    const [userId, setUserId] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        const fetchUserId = async () => {
            const id = await AsyncStorage.getItem("userId");
            console.log("Fetched userId:", id); // Thêm dòng này
            setUserId(id);
        };
        fetchUserId();
    }, []);
    const handleLikePress = async () => {
        if (isLiking) return;
        
        setIsLiking(true);
        const newLikedState = !liked;
        const newLikeCount = newLikedState ? likeCount + 1 : likeCount - 1;
        
        // Optimistic update
        setLiked(newLikedState);
        setLikeCount(newLikeCount);
        if(!userId)
        {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
            setIsLiking(false);
            return;
        }
        try {
            if (newLikedState) {
                await likePost(post.id, userId);
            } else {
                await unlikePost(post.id, userId);
            }
        } catch (error) {
            // Revert on error
            setLiked(!newLikedState);
            setLikeCount(newLikedState ? likeCount : likeCount + 1);
            console.error('Error updating like:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật lượt thích. Vui lòng thử lại.');
        } finally {
            setIsLiking(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa bình luận này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteComment(commentId);
                            onRefresh();
                            Alert.alert('Thành công', 'Đã xóa bình luận');
                        } catch (error) {
                            console.error('Error deleting comment:', error);
                            Alert.alert('Lỗi', 'Không thể xóa bình luận');
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (date: Date | FirebaseTimestamp | string | number) => {
        let d: Date;
        
        if (typeof date === 'object' && 'toDate' in date) {
            d = (date as FirebaseTimestamp).toDate();
        } else if (date instanceof Date) {
            d = date;
        } else {
            d = new Date(date);
        }
        
        return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const getPostTypeText = (type: string) => {
        switch (type) {
            case "photo":
                return "Ảnh";
            case "expense":
                return "Chi tiêu";
            case "achievement":
                return "Thành tích";
            default:
                return type;
        }
    };

    return (
        <View style={styles.postContainer}>
            {/* Header của post */}
            <View style={styles.postHeader}>
                <View style={styles.postHeaderLeft}>
                    <Text style={styles.postAuthor}>{post.createdByName}</Text>
                    <View style={styles.postMeta}>
                        <Text style={styles.postType}>
                            {getPostTypeText(post.type)}
                        </Text>
                        <Text style={styles.postDate}>
                            {formatDate(post.createdAt)}
                        </Text>
                    </View>
                </View>
                <View style={styles.postHeaderRight}>
                    <Text style={styles.postVisibility}>
                        {post.isPublic ? "Công khai" : "Riêng tư"}
                    </Text>
                </View>
            </View>

            {/* Nội dung post */}
            <Text style={styles.postContent}>{post.content}</Text>

            {/* Thông tin về photos và transactions nếu có */}
            {post.photoId && post.photoId.length > 0 && (
                <View style={styles.postInfo}>
                    <Text style={styles.postInfoText}>
                        📷 {post.photoId.length} ảnh
                    </Text>
                </View>
            )}

            {post.transactionId && post.transactionId.length > 0 && (
                <View style={styles.postInfo}>
                    <Text style={styles.postInfoText}>
                        💰 {post.transactionId.length} giao dịch
                    </Text>
                </View>
            )}

            {/* Thống kê likes và comments */}
            <View style={styles.postStats}>
                <TouchableOpacity
                    style={styles.statButton}
                    onPress={handleLikePress}
                    disabled={isLiking}
                >
                    <MaterialCommunityIcons
                        name={liked ? 'cards-heart' : 'cards-heart-outline'}
                        size={24}
                        color={liked ? 'red' : '#666'}
                    />
                    <Text style={[styles.postStatsText, liked && styles.likedText]}>
                        {likeCount}
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={styles.statButton}
                    onPress={() => setShowComments(!showComments)}
                >
                    <MaterialCommunityIcons
                        name="comment-outline"
                        size={24}
                        color="#666"
                    />
                    <Text style={styles.postStatsText}>
                        {comments.length}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Nút hiển thị/ẩn comments */}
            {comments.length > 0 && (
                <TouchableOpacity
                    style={styles.showCommentsButton}
                    onPress={() => setShowComments(!showComments)}>
                    <Text style={styles.showCommentsText}>
                        {showComments
                            ? "Ẩn bình luận"
                            : `Xem ${comments.length} bình luận`}
                    </Text>
                </TouchableOpacity>
            )}

            {/* Form thêm comment */}
            <CommentInput
                postId={post.id}
                currentUser={currentUser}
                onCommentAdded={onRefresh}
                editingComment={editingComment}
                onCancelEdit={() => setEditingComment(undefined)}
            />

            {/* Danh sách comments */}
            {showComments && comments.length > 0 && (
                <View style={styles.commentsSection}>
                    {comments.map((comment) => (
                        <CommentItem 
                            key={comment.id} 
                            comment={comment}
                            currentUserId={currentUser.id}
                            onEdit={setEditingComment}
                            onDelete={handleDeleteComment}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const SocialScreen = () => {
    const [userId, setUserId] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [postsWithComments, setPostsWithComments] = useState<PostWithComments[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [showAddPost, setShowAddPost] = useState(false);
    
    useEffect(() => {
        const fetchUserId = async () => {
            const id = await AsyncStorage.getItem("userId");
            console.log("Fetched userId:", id);
            setUserId(id);
        };
        fetchUserId();
    }, []);

    const fetchPostsAndComments = async (showLoading = true) => {
        if (!userId) return;
        
        if (showLoading) setLoading(true);
        else setRefreshing(true);

        try {
            const u = await getUserById(userId);
            console.log("Fetched user:", u);
            setUser(u);

            if (!u) {
                console.error("User not found");
                return;
            }

            if (!u.familyId) {
                console.log("User does not belong to any family");
                return;
            }

            const posts = await getPostByFamilyId(u.familyId);
            console.log("Fetched posts:", posts);

            if (!posts || posts.length === 0) {
                console.log("No posts found for this family");
                setPostsWithComments([]);
                return;
            }

            // Lấy comments cho từng post và kết hợp
            const postsWithCommentsData = await Promise.all(
                posts.map(async (post) => {
                    try {
                        console.log(`Fetching comments for post ${post.id}`);
                        const comments = await getCommentsByPostId(post.id);
                        console.log(`Comments for post ${post.id}:`, comments);
                        return {
                            ...post,
                            comments: comments || [],
                            isLikedByUser: post.likes?.includes(userId) || false,
                        };
                    } catch (error) {
                        console.error(`Error fetching comments for post ${post.id}:`, error);
                        return {
                            ...post,
                            comments: [],
                            isLikedByUser: post.likes?.includes(userId) || false,
                        };
                    }
                })
            );

            console.log("Posts with comments:", postsWithCommentsData);
            // Sắp xếp posts theo thời gian mới nhất
            const sortedPosts = postsWithCommentsData.sort((a, b) => {
                const getTime = (date: Date | FirebaseTimestamp | string | number): number => {
                    if (typeof date === "object" && "toDate" in date) {
                        return (date as FirebaseTimestamp).toDate().getTime();
                    } else if (date instanceof Date) {
                        return date.getTime();
                    } else {
                        return new Date(date).getTime();
                    }
                };

                return getTime(b.createdAt) - getTime(a.createdAt);
            });
            setPostsWithComments(sortedPosts);
        } catch (error) {
            console.error("Error fetching posts and comments:", error);
            Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPostsAndComments();
    }, [userId]);

    const handleRefresh = () => {
        fetchPostsAndComments(false);
    };

    if (!user) {
        return (
            <SafeAreaView style={mainStyles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text>Đang tải thông tin người dùng...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={mainStyles.container}>
            <SafeAreaView style={[mainStyles.topSheet, { padding: 0 }]} />
            <KeyboardAvoidingView 
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={[mainStyles.bottomeSheet, { backgroundColor: "transparent", padding: 0, flex: 1 }]}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text>Đang tải...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={postsWithComments}
                            keyExtractor={(item, index) => item.id || index.toString()}
                            renderItem={({ item }) => (
                                <PostItem 
                                    post={item} 
                                    comments={item.comments} 
                                    currentUser={user}
                                    onRefresh={handleRefresh}
                                />
                            )}
                            contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons
                                        name="post-outline"
                                        size={48}
                                        color="#ccc"
                                    />
                                    <Text style={styles.emptyText}>Chưa có bài đăng nào</Text>
                                </View>
                            )}
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
                
                <TouchableOpacity
                    style={styles.fabButton}
                    onPress={() => setShowAddPost(true)}
                >
                    <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                </TouchableOpacity>

                <AddPostModal
                    visible={showAddPost}
                    onClose={() => setShowAddPost(false)}
                    currentUser={user}
                    onPostAdded={handleRefresh}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    postContainer: {
        backgroundColor: 'white',
        marginHorizontal: 15,
        marginVertical: 8,
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    postHeaderLeft: {
        flex: 1,
    },
    postHeaderRight: {
        alignItems: 'flex-end',
    },
    postAuthor: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    postMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    postType: {
        fontSize: 12,
        color: '#007AFF',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        fontWeight: '500',
    },
    postDate: {
        fontSize: 12,
        color: '#666',
    },
    postVisibility: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    postContent: {
        fontSize: 16,
        lineHeight: 22,
        color: '#333',
        marginBottom: 12,
    },
    postInfo: {
        backgroundColor: '#F5F5F5',
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    postInfoText: {
        fontSize: 14,
        color: '#666',
    },
    postStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        marginTop: 8,
    },
    statButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    postStatsText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    likedText: {
        color: 'red',
    },
    showCommentsButton: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    showCommentsText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    commentsSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
    commentContainer: {
        marginBottom: 12,
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 8,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    commentAuthor: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    commentDate: {
        fontSize: 12,
        color: '#666',
    },
    commentButtonGroup: {
        flexDirection: 'row',
        gap: 4,
    },
    commentActionButton: {
        padding: 4,
    },
    commentText: {
        fontSize: 14,
        lineHeight: 18,
        color: '#333',
    },
    commentInputContainer: {
        marginTop: 12,
    },
    editingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF3CD',
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    editingText: {
        fontSize: 14,
        color: '#856404',
        fontWeight: '500',
    },
    commentInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 14,
        backgroundColor: '#F8F9FA',
    },
    commentSubmitButton: {
        backgroundColor: '#007AFF',
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    commentSubmitButtonDisabled: {
        backgroundColor: '#CCC',
        opacity: 0.6,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
    fabButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    postButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 60,
        alignItems: 'center',
    },
    postButtonDisabled: {
        backgroundColor: '#CCC',
        opacity: 0.6,
    },
    postButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    userInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    privacyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 15,
    },
    privacyText: {
        fontSize: 14,
        color: '#666',
    },
    contentInput: {
        fontSize: 16,
        lineHeight: 22,
        color: '#333',
        textAlignVertical: 'top',
        minHeight: 120,
        marginBottom: 20,
    },
    postTypeSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    postTypeButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        backgroundColor: '#F8F9FA',
    },
    typeButtonActive: {
        borderColor: '#007AFF',
        backgroundColor: '#E3F2FD',
    },
    typeButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    typeButtonTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    characterCount: {
        alignItems: 'flex-end',
        marginTop: 10,
    },
    characterCountText: {
        fontSize: 12,
        color: '#999',
    },
});

export default SocialScreen;