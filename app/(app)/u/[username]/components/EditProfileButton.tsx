"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { ProfileEditModal } from "./ProfileEditModal";

interface EditProfileButtonProps {
  userId: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
}

export function EditProfileButton({
  userId,
  username,
  bio,
  avatarUrl,
}: EditProfileButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Edit profile
      </Button>

      <ProfileEditModal
        open={open}
        onClose={() => setOpen(false)}
        userId={userId}
        username={username}
        bio={bio}
        avatarUrl={avatarUrl}
      />
    </>
  );
}
