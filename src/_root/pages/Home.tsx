import Loader from "@/components/shared/Loader";
import PostCard from "@/components/shared/PostCard";
import { useGetRecentPosts } from "@/lib/react-quary/quriesAndMutations";
import type { Models } from "appwrite";

export default function Home() {
  const {
    data: posts,
    isPending: isPostsLoading,
    isError: isErrorPosts,
  } = useGetRecentPosts();

  if (isErrorPosts) return <div>Something went wrong</div>;

  return (
    <div className="flex flex-1">
      <div className="home-container">
        <div className="home-posts">
          <h2 className="h3-bold md:h2-bold text-left w-full">Home Feed</h2>
          {isPostsLoading && !posts ? (
            <Loader />
          ) : (
            <ul className="flex flex-col flex-1 gap-9 w-full ">
              {posts?.map((post: Models.Document) => (
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
          )}
        </div>
      </div>
    </div>
  );
}
