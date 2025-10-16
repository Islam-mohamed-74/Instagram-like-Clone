import type { Models } from "appwrite";
import Loader from "./Loader";
import GridPostList from "./GridPostList";

type SearchResultsProps = {
  isSearchFetching: boolean;
  searchedPosts: Models.Document[];
};

export default function SearchResults({
  isSearchFetching,
  searchedPosts,
}: SearchResultsProps) {
  if (isSearchFetching) return <Loader />;
  if (searchedPosts && searchedPosts.documents.length > 0) {
    return <GridPostList posts={searchedPosts.documents} showStats={false} />;
  }
  return (
    <p className="text-light-4 mt-10 text-center w-full">No posts found</p>
  );
}
