import { getCurrentUser } from "@/lib/appwrite/api";
import type { IContextType, IUser } from "@/types";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const INITIAL_USER = {
  id: "",
  name: "",
  username: "",
  email: "",
  imageUrl: "",
  bio: "",
};

const INITIAL_STATE = {
  user: INITIAL_USER,
  isLoading: false,
  isAuthenticated: false,
  setUser: () => {},
  setIsAuthenticated: () => {},
  checkAuthUser: async () => false as boolean,
};

const AuthContext = createContext<IContextType>(INITIAL_STATE);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<IUser>(INITIAL_USER);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const navigate = useNavigate();

  const checkAuthUser = async () => {
    setIsLoading(true);
    try {
      // فحص وجود جلسة أولاً لتجنب خطأ 401
      const cookieFallback = localStorage.getItem("cookieFallback");
      if (
        !cookieFallback ||
        cookieFallback === "[]" ||
        cookieFallback === "null"
      ) {
        setIsAuthenticated(false);
        setUser(INITIAL_USER);
        return false;
      }

      const currentAccount = await getCurrentUser();
      if (currentAccount) {
        setUser({
          id: currentAccount.$id,
          name: currentAccount.name,
          username: currentAccount.username,
          email: currentAccount.email,
          imageUrl: currentAccount.imageUrl,
          bio: currentAccount.bio,
        });
        setIsAuthenticated(true);

        return true;
      }

      return false;
    } catch (error) {
      console.error(error);
      setIsAuthenticated(false);
      setUser(INITIAL_USER);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // localStorage.getItem("cookieFallback") === null
    if (localStorage.getItem("cookieFallback") === "[]") {
      navigate("/sign-in");
    }

    checkAuthUser();
  }, []);

  const value = {
    user,
    setUser,
    isLoading,
    setIsLoading,
    isAuthenticated,
    setIsAuthenticated,
    checkAuthUser,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useUserContext = () => useContext(AuthContext);

// 📌 الخلاصة:

// AuthProvider = بيغلف الابلكيشن ويخزن حالة تسجيل الدخول واليوزر.

// checkAuthUser = بيجيب المستخدم الحالي من Appwrite.

// useUserContext = hook علشان تجيب user وحالة auth في أي component.
