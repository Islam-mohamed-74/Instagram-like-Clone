import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import FileUploader from "../shared/FileUploader";
import { PostValidation } from "@/lib/validation";
import type { Models } from "appwrite";
import {
  useCreatePost,
  useUpdatePost,
} from "@/lib/react-quary/quriesAndMutations";
import { useUserContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import Loader from "../shared/Loader";
import { toast } from "react-toastify";

type PostFormProps = {
  post?: Models.Document;
  action: "Create" | "Update";
};

export default function PostForm({ post, action }: PostFormProps) {
  const { mutateAsync: createPost, isPending: isLoadingCreate } =
    useCreatePost();

  const { mutateAsync: updatePost, isPending: isLoadingUpdate } =
    useUpdatePost();

  const { user } = useUserContext();
  const navigate = useNavigate();
  // 1. Define your form.
  const form = useForm<z.infer<typeof PostValidation>>({
    resolver: zodResolver(PostValidation),
    defaultValues: {
      caption: post?.caption || "",
      file: [],
      location: post?.location || "",
      tags: post?.tags.join(",") || "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof PostValidation>) {
    try {
      if (post && action === "Update") {
        const updatedPost = await updatePost({
          ...values,
          imageId: post.imageId,
          imageUrl: post.imageUrl,
          postId: post.$id,
        });

        if (!updatedPost)
          return toast.error("Something went wrong, please try again.");

        toast.success("Post updated successfully.");
        navigate(`/post/${post.$id}`);
        return; // ✅ ضروري
      }

      const newPost = await createPost({
        ...values,
        userId: user.id,
      });

      if (!newPost)
        return toast.error("Something went wrong, please try again.");

      toast.success("Post created successfully.");
      navigate("/");
    } catch (error) {
      console.error("Error submitting post:", error);
      toast.error("Unexpected error. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col w-full gap-9 max-w-5xl "
      >
        <FormField
          control={form.control}
          name="caption"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Caption</FormLabel>
              <FormControl>
                <Textarea
                  className="shad-textarea custom-scrollbar"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Add Photos</FormLabel>
              <FormControl>
                <FileUploader
                  fieldChange={field.onChange}
                  mediaUrl={post?.imageUrl}
                />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Add Location</FormLabel>
              <FormControl>
                <Input type="text" className="shad-input" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Add Tags (separated by comma " , " )</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  className="shad-input"
                  placeholder="JS, React, Next, Tailwind"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />
        <div className="flex gap-4 item-center justify-end">
          <Button type="button" className="shad-button_dark_4">
            Cancel
          </Button>
          <Button
            type="submit"
            className="shad-button_primary whitespace-nowrap"
            disabled={isLoadingCreate || isLoadingUpdate}
          >
            {isLoadingCreate || isLoadingUpdate ? <Loader /> : null}
            {action === "Create" ? "Create Post" : "Update Post"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
