import Loader from "@/components/shared/Loader";
import PostCard from "@/components/shared/PostCard";
import { useUserContext } from "@/context/AuthContext";
import { useGetRecentPosts } from "@/lib/react-quary/quriesAndMutations";
import { useGetSavedPosts } from "@/lib/react-quary/quriesAndMutations";
import type { Models } from "appwrite";

export default function Saved() {
  const { user } = useUserContext();

  // كل البوستات
  const {
    data: posts,
    isPending: isPostsLoading,
    isError: isErrorPosts,
  } = useGetRecentPosts();

  // البوستات اللي اليوزر عاملها Save
  const {
    data: savedPosts,
    isPending: isSavedLoading,
    isError: isErrorSaved,
  } = useGetSavedPosts(user.id);

  if (isErrorPosts || isErrorSaved) return <div>Something went wrong</div>;

  // IDs البوستات اللي اليوزر حفظها
  const savedPostIds = savedPosts?.map((item) => item.postId) || [];

  // فلترة البوستات بناءً على الـ saved IDs
  const filteredPosts =
    posts?.filter((post: Models.Document) => savedPostIds.includes(post.$id)) ||
    [];

  const isLoading = isPostsLoading || isSavedLoading;

  return (
    <div className="flex flex-1">
      <div className="home-container">
        <div className="home-posts">
          <h2 className="h3-bold md:h2-bold text-left w-full">Saved Posts</h2>

          {isLoading && !posts ? (
            <Loader />
          ) : filteredPosts.length > 0 ? (
            <ul className="flex flex-col flex-1 gap-9 w-full ">
              {filteredPosts.map((post: Models.Document) => (
                <PostCard
                  key={post.$id}
                  post={
                    post as Models.Document & {
                      creatorData: Models.Document;
                      creator: string;
                      location?: string;
                      caption?: string;
                      tags: string[];
                      imageUrl?: string;
                      $createdAt: string;
                      likedUsers: Models.Document[];
                    }
                  }
                />
              ))}
            </ul>
          ) : (
            <p className="text-light-3 text-center mt-10">
              You haven’t saved any posts yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
