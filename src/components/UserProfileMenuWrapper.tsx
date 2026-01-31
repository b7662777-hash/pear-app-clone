import { UserProfileMenu } from "./UserProfileMenu";
import { useAuth } from "@/hooks/useAuth";

export function UserProfileMenuWrapper() {
  const { user, profile } = useAuth();
  return <UserProfileMenu user={user} profile={profile} />;
}

export default UserProfileMenuWrapper;
