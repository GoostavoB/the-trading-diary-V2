import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/types/social";
import { FollowButton } from "./FollowButton";

interface UserCardProps {
  profile: UserProfile;
  showFollowButton?: boolean;
}

export const UserCard = ({ profile, showFollowButton = true }: UserCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback>
            {profile.full_name?.[0] || profile.email?.[0] || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">
            {profile.full_name || "Anonymous"}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            @{profile.username || "user"}
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
            <span>{profile.followers_count} followers</span>
            <span>{profile.following_count} following</span>
          </div>
        </div>

        {showFollowButton && (
          <FollowButton userId={profile.id} />
        )}
      </div>

      {profile.bio && (
        <p className="text-sm mt-3 text-muted-foreground">{profile.bio}</p>
      )}
    </Card>
  );
};
