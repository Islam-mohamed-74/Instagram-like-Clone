import type { INewPost, INewUser, IUpdatePost } from "@/types";
import { account, appwriteConfig, avatars, databases, storage } from "./config";
import { ID, Query, type Models } from "appwrite";

// ============================== USER AUTHENTICATION ==============================

/**
 * Create a new user account in Appwrite and save user data to database
 */
export async function createUserAccount(user: INewUser) {
  try {
    // Create account in Appwrite authentication
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    );

    if (!newAccount) throw new Error("Account not created");

    // Generate avatar initials
    const avatarUrl = avatars.getInitials(user.name);

    // Save user details to database
    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: user.name,
      username: user.username,
      email: user.email,
      imageUrl: avatarUrl,
    });
    return newUser;
  } catch (error) {
    console.log(error);
    return error;
  }
}

/**
 * Save user data to database collection
 */
export async function saveUserToDB(user: {
  accountId: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
}) {
  try {
    const newUser = await databases.createDocument(
      appwriteConfig.databasesId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      user
    );
    return newUser;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Sign in user with email and password
 */
export async function signInAccount(user: { email: string; password: string }) {
  try {
    const session = await account.createEmailPasswordSession(
      user.email,
      user.password
    );
    return session;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get current authenticated user data
 */
export async function getCurrentUser() {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) throw new Error("Account not found");
    const currentUser = await databases.listDocuments(
      appwriteConfig.databasesId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw new Error("User not found");
    return currentUser.documents[0];
  } catch (error) {
    console.log(error);
  }
}

/**
 * Sign out current user session
 */
export async function signOutAccount() {
  try {
    await account.deleteSession("current");
  } catch (error) {
    console.log(error);
  }
}

// ============================== POSTS CRUD ==============================

/**
 * Create a new post with image upload
 */
export async function createPost(post: INewPost) {
  try {
    // Upload image to storage
    const uploadedFile = await uploadFile(post.file[0]);

    if (!uploadedFile) throw Error;

    // Get file preview URL
    const fileUrl = await getFilePreview(uploadedFile.$id);
    if (!fileUrl) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }

    // Convert tags string into array
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    // Save post data to database
    const newPost = await databases.createDocument(
      appwriteConfig.databasesId,
      appwriteConfig.postCollectionId,
      ID.unique(),
      {
        creator: post.userId,
        caption: post.caption,
        location: post.location,
        imageId: uploadedFile.$id,
        imageUrl: fileUrl,
        tags,
      }
    );

    if (!newPost) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }
    return newPost;
  } catch (error) {
    console.log(error);
  }
}

// ============================== FILE MANAGEMENT ==============================

/**
 * Upload file to Appwrite storage
 */
export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file
    );

    return uploadedFile;
  } catch (error) {
    console.log("Upload file error:", error);
  }
}

/**
 * Get file preview/view URL from storage
 */
export async function getFilePreview(fileId: string) {
  try {
    const fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);

    return fileUrl;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(appwriteConfig.storageId, fileId);

    return { status: "ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================== POSTS RETRIEVAL ==============================

/**
 * Get recent posts with liked users data
 */
export async function getRecentPosts() {
  try {
    // Fetch all posts ordered by creation date (newest first)
    const postsResponse = await databases.listDocuments(
      appwriteConfig.databasesId,
      appwriteConfig.postCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(10)]
    );

    const posts = postsResponse.documents;

    // Get users who liked each post + add creator data
    const postsWithExtras = await Promise.all(
      posts.map(async (post) => {
        let likedUsers: Models.Document[] = [];
        let creatorData = null;

        // ✅ Fetch creator data
        try {
          const creatorResponse = await databases.listDocuments(
            appwriteConfig.databasesId,
            appwriteConfig.userCollectionId,
            [Query.equal("$id", post.creator)]
          );
          creatorData = creatorResponse.documents[0] || null;
        } catch (error) {
          console.error(`Error fetching creator for post ${post.$id}:`, error);
        }

        // ❤️ Fetch liked users if any
        if (post.likes?.length) {
          try {
            const likedUsersResponse = await databases.listDocuments(
              appwriteConfig.databasesId,
              appwriteConfig.userCollectionId,
              [Query.equal("$id", post.likes)]
            );
            likedUsers = likedUsersResponse.documents;
          } catch (error) {
            console.error(
              `Error fetching liked users for post ${post.$id}:`,
              error
            );
          }
        }

        return {
          ...post,
          creatorData, // 👈 added creator info here
          likedUsers,
        };
      })
    );

    if (postsWithExtras.length === 0) throw new Error("Posts not found");
    // console.log(postsWithExtras);

    return postsWithExtras;
  } catch (error) {
    console.error("Error fetching posts: ", error);
    return [];
  }
}

// ============================== SAVE/LIKE FUNCTIONALITY ==============================

/**
 * Save a post to user's saved collection
 */
export async function savePost(postId: string, userId: string) {
  try {
    const updatePost = await databases.createDocument(
      appwriteConfig.databasesId,
      appwriteConfig.saveCollectionId,
      ID.unique(),
      {
        userId,
        postId,
      }
    );

    if (!updatePost) throw new Error("Post not found");

    return updatePost;
  } catch (error) {
    console.log("savePost", error);
  }
}

/**
 * Get all saved posts for a specific user
 */
export async function getSavedPosts(userId: string) {
  const result = await databases.listDocuments(
    appwriteConfig.databasesId,
    appwriteConfig.saveCollectionId,
    [Query.equal("userId", userId)]
  );

  return result.documents.map((doc) => ({
    $id: doc.$id, // Save document ID
    postId: doc.postId, // ID of the saved post
  }));
}

/**
 * Like or unlike a post by updating the likes array
 */
export async function likePost(postId: string, likedUsers: string[]) {
  try {
    const updatePost = await databases.updateDocument(
      appwriteConfig.databasesId,
      appwriteConfig.postCollectionId,
      postId,
      {
        likes: likedUsers,
      }
    );

    if (!updatePost) throw new Error("Post not found");

    return updatePost;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Remove post from user's saved collection
 */
export async function deleteSavedPost(savedRecordId: string) {
  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databasesId,
      appwriteConfig.saveCollectionId,
      savedRecordId
    );

    if (!statusCode) throw new Error("Post not found");

    return { status: "ok" };
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get a specific post by ID with liked users data
 */

export async function getPostById(postId: string) {
  try {
    // 🔹 1. جلب البوست من قاعدة البيانات
    const post = await databases.getDocument(
      appwriteConfig.databasesId,
      appwriteConfig.postCollectionId,
      postId
    );

    let likedUsers: Models.Document[] = [];
    let creatorData: Models.Document | null = null;

    // 🔹 2. جلب بيانات صاحب البوست (creator)
    if (post.creator) {
      try {
        const creatorResponse = await databases.getDocument(
          appwriteConfig.databasesId,
          appwriteConfig.userCollectionId,
          post.creator
        );
        creatorData = creatorResponse;
      } catch (error) {
        console.error(`Error fetching creator for post ${post.$id}:`, error);
      }
    }

    // 🔹 3. جلب المستخدمين اللي عملوا لايك
    if (post.likes?.length > 0) {
      try {
        const likedUsersResponse = await databases.listDocuments(
          appwriteConfig.databasesId,
          appwriteConfig.userCollectionId,
          [Query.equal("$id", post.likes)]
        );
        likedUsers = likedUsersResponse.documents;
      } catch (error) {
        console.error(
          `Error fetching liked users for post ${post.$id}:`,
          error
        );
      }
    }

    // 🔹 4. إرجاع البيانات بشكل موحد
    return {
      ...post,
      creatorData,
      likedUsers,
    };
  } catch (error) {
    console.error("Error fetching post by ID: ", error);
    return null;
  }
}

/**
 * Update an existing post with optional new image
 */
export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file.length > 0;

  try {
    let image = {
      imageUrl: post.imageUrl,
      imageId: post.imageId,
    };

    if (hasFileToUpdate) {
      // Upload new file to storage
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw Error;

      // Get new file URL
      const fileUrl = await getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
    }

    // Convert tags string into array
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    // Update post in database
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databasesId,
      appwriteConfig.postCollectionId,
      post.postId,
      {
        caption: post.caption,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        location: post.location,
        tags: tags,
      }
    );

    // Handle update failure
    if (!updatedPost) {
      // Delete newly uploaded file if update failed
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }

      throw Error;
    }

    // Delete old file after successful update
    if (hasFileToUpdate) {
      await deleteFile(post.imageId);
    }

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Delete a post and its associated image from storage
 */
export async function deletePost(postId?: string, imageId?: string) {
  if (!postId || !imageId) return;

  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databasesId,
      appwriteConfig.postCollectionId,
      postId
    );

    if (!statusCode) throw Error;

    await deleteFile(imageId);

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get all posts created by a specific user
 */
export async function getUserPosts(userId?: string) {
  if (!userId) return;

  try {
    const post = await databases.listDocuments(
      appwriteConfig.databasesId,
      appwriteConfig.postCollectionId,
      [Query.equal("creator", userId), Query.orderDesc("$createdAt")]
    );

    console.log(post);

    if (!post) throw Error;

    return post;
  } catch (error) {
    console.log(error);
  }
}

export async function getInfinitePosts({ pageParam }: { pageParam?: string }) {
  const queries: any[] = [Query.orderDesc("$createdAt"), Query.limit(10)];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam));
  }

  try {
    // 1️⃣ - جلب البوستات
    const postsResponse = await databases.listDocuments(
      appwriteConfig.databasesId,
      appwriteConfig.postCollectionId,
      queries
    );

    const posts = postsResponse.documents;

    // 2️⃣ - تجهيز بوستات مع بيانات اللايكس والكرييتور
    const postsWithExtras = await Promise.all(
      posts.map(async (post: Models.Document) => {
        let creatorData = null;
        let likedUsers: Models.Document[] = [];

        // 🔹 جلب بيانات المستخدم اللي عمل البوست
        try {
          const creatorResponse = await databases.getDocument(
            appwriteConfig.databasesId,
            appwriteConfig.userCollectionId,
            post.creator
          );
          creatorData = creatorResponse;
        } catch (error) {
          console.error(`Error fetching creator for post ${post.$id}`, error);
        }

        // 🔹 جلب المستخدمين اللي عملوا لايك
        if (post.likes?.length > 0) {
          try {
            const likedUsersResponse = await databases.listDocuments(
              appwriteConfig.databasesId,
              appwriteConfig.userCollectionId,
              [Query.equal("$id", post.likes)]
            );
            likedUsers = likedUsersResponse.documents;
          } catch (error) {
            console.error(
              `Error fetching liked users for post ${post.$id}`,
              error
            );
          }
        }

        return {
          ...post,
          creatorData,
          likedUsers,
        };
      })
    );

    // 3️⃣ - النتيجة النهائية
    return {
      documents: postsWithExtras,
      total: postsResponse.total,
      cursor: postsResponse.documents.at(-1)?.$id || null,
    };
  } catch (error) {
    console.error("Error fetching infinite posts:", error);
    return { documents: [], total: 0, cursor: null };
  }
}

export async function searchPosts(searchTerm: string) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databasesId,
      appwriteConfig.postCollectionId,
      [Query.search("caption", searchTerm)]
    );
    if (!posts) throw Error;
    return posts;
  } catch (error) {
    console.log(error);
  }
}
