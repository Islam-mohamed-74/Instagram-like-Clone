import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useSignOutAccount } from "@/lib/react-quary/quriesAndMutations";
import { useUserContext } from "@/context/AuthContext";

export default function Topbar() {
  const { mutate: signOut, isSuccess } = useSignOutAccount();
  const navigate = useNavigate();
  const { user } = useUserContext();

  useEffect(() => {
    if (isSuccess) {
      navigate(0);
    }
  }, [isSuccess]);

  return (
    <section className="topbar">
      <div className="flex-between py-4 px-5">
        <Link to="/" className="flex gap-3 items-center">
          <img
            src="/assets/images/logo.svg"
            alt="logo"
            width={130}
            height={325}
            // className="w-8 h-8 object-contain"
          />
        </Link>
        <div className="flex  gap-4">
          <Button
            variant="ghost"
            className="sha-button_ghost"
            onClick={() => signOut()}
          >
            <img src="/assets/icons/logout.svg" alt="logout" />
          </Button>
          <Link to={`/profile/${user?.id}`} className="flex-center gap-3">
            <img
              src={user?.imageUrl || "/assets/images/profile-placeholder.svg"}
              alt="profile"
              className="w-8 h-8 object-contain rounded-full"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
