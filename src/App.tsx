import { Route, Routes } from "react-router-dom";
import "./globals.css";
import SignInForm from "./_auth/forms/signInForm";
import {
  AllUsers,
  CreatePost,
  EditPost,
  Explore,
  Home,
  PostDetails,
  Profile,
  Saved,
  UpdateProfile,
} from "./_root/pages";
import SignupForm from "./_auth/forms/signupForm";
import AuthLayout from "./_auth/AuthLayout";
import RootLayout from "./_root/RootLayout";
import { ToastContainer } from "react-toastify";

export default function App() {
  return (
    <main className="flex h-screen debug-screens ">
      <ToastContainer theme="dark" />

      <Routes>
        {/* public router  */}
        <Route element={<AuthLayout />}>
          <Route path="/sign-in" element={<SignInForm />} />
          <Route path="/sign-up" element={<SignupForm />} />
        </Route>
        {/* private router */}
        <Route element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/all-users" element={<AllUsers />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/update-post/:id" element={<EditPost />} />
          <Route path="/post/:id" element={<PostDetails />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/update-profile/:id" element={<UpdateProfile />} />
        </Route>
      </Routes>
    </main>
  );
}
