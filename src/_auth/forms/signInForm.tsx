import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SigninValidation } from "@/lib/validation";
import Loader from "@/components/shared/Loader";
import { Link, useNavigate } from "react-router-dom";
import { useSignInAccount } from "@/lib/react-quary/quriesAndMutations";
import { useUserContext } from "@/context/AuthContext";
import { toast } from "react-toastify";

export default function SignInForm() {
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();
  const navigate = useNavigate();

  const { mutateAsync: signInAccount } = useSignInAccount();

  // 1. Define your form.
  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof SigninValidation>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.

    const session = await signInAccount({
      email: values.email,
      password: values.password,
    });

    if (!session) {
      toast.error("Something went wrong, please try again.");
    }

    const isLoggedIn = await checkAuthUser();
    if (isLoggedIn) {
      form.reset();
      navigate("/");
      toast.success("Account created successfully.");
    } else {
      return toast.error("Something went wrong, please try again.");
    }
  }
  return (
    <Form {...form}>
      <div className="sm:w-420 flex-center flex-col">
        <img src="/assets/images/logo.svg" alt="logo" />
        <h2 className="h3-bold md:h2-bold pt-5 sm:pt-12">
          Login to your account
        </h2>
        <p className="text-light-3 small-medium md:base-regular mt-2">
          welcome back ! , please enter your details
        </p>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5 w-full mt-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="shad-button_primary">
            {isUserLoading ? (
              <div className="flex-center gap-2">
                <Loader /> Loading...
              </div>
            ) : (
              "Sign in"
            )}
          </Button>
          <p className="text-light-3 text-center  small-medium md:base-regular mt-2">
            or create an account
            <Link
              to="/sign-up"
              className="text-primary-500 text-small-semibold  ml-2 hover:underline cursor-pointer"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
}
