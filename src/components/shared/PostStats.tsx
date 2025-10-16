import {
  useDeleteSavedPost,
  useGetSavedPosts,
  useLikePost,
  useSavePost,
} from "@/lib/react-quary/quriesAndMutations";
import { checkIsLiked } from "@/lib/utils";
import type { Models } from "appwrite";
import React, { useEffect, useState } from "react";
import Loader from "./Loader";

type PostStatsProps = {
  post: Models.Document;
  userId: string;
  likedUsers: Models.Document[];
};

export default function PostStats({
  post,
  userId,
  likedUsers,
}: PostStatsProps) {
  const likesList = likedUsers.map((user: Models.Document) => user?.$id);

  const [likes, setLikes] = useState(likesList || []);
  const [isSaved, setIsSaved] = useState(false);

  const { mutate: likePost } = useLikePost();

  const { mutate: savePost, isPending: isSaving } = useSavePost();
  const { mutate: deleteSavedPost, isPending: isDeleting } =
    useDeleteSavedPost();

  const { data: savedPosts } = useGetSavedPosts(userId);

  const savedRecord = savedPosts?.find(
    (savedPost) => savedPost.postId === post.$id
  );

  useEffect(() => {
    setIsSaved(!!savedRecord);
  }, [savedRecord]);

  const hanleLikePost = (e: React.MouseEvent) => {
    e.stopPropagation();

    let newLikes = [...likes];

    const haslikes = newLikes.includes(userId);

    if (haslikes) {
      newLikes = newLikes.filter((id) => id !== userId);
    } else {
      newLikes.push(userId);
    }

    setLikes(newLikes);
    likePost({ postId: post.$id, LikedUsers: newLikes });
  };

  const handleSavePost = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (savedRecord) {
      setIsSaved(false);
      deleteSavedPost(savedRecord.$id);
    } else {
      setIsSaved(true);
      savePost({ postId: post.$id, userId });
    }
  };

  return (
    <div className="flex justify-between itsms-center z-20">
      <div className="flex gap-2 mr-5">
        <img
          src={`${
            checkIsLiked(likes || [], userId)
              ? `/assets/icons/liked.svg`
              : `/assets/icons/like.svg`
          }`}
          alt="like"
          width={20}
          height={20}
          onClick={hanleLikePost}
          className="cursor-pointer"
        />
        <p className="small-medium lg:base-medium">{likes.length}</p>
      </div>
      <div className="flex gap-2 mr-5">
        {isSaving || isDeleting ? (
          <Loader />
        ) : (
          <img
            src={`${
              isSaved ? `/assets/icons/saved.svg` : `/assets/icons/save.svg`
            }`}
            alt="like"
            width={20}
            height={20}
            onClick={handleSavePost}
            className="cursor-pointer"
          />
        )}
      </div>
    </div>
  );
}
