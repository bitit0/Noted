import React, { useEffect, useState } from "react";
import { AvatarGroup, Avatar, Tooltip } from "@mui/material";
import { getUserProfile } from "../utils/getUserProfile";

/**
 * Small stacked avatars of everyone with access to a note (owner first).
 * Resolves profiles lazily and caches them for the component's lifetime.
 */
export default function CollaboratorAvatars({ ownerId, collaborators = [] }) {
  const [people, setPeople] = useState([]);
  const ids = [ownerId, ...collaborators].filter(Boolean);
  const key = ids.join(",");

  useEffect(() => {
    let active = true;
    Promise.all(ids.map((uid) => getUserProfile(uid).then((p) => ({ uid, ...(p || {}) }))))
      .then((res) => active && setPeople(res))
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (ids.length <= 1) return null;

  return (
    <AvatarGroup
      max={4}
      sx={{
        "& .MuiAvatar-root": {
          width: 24,
          height: 24,
          fontSize: 11,
          fontWeight: 600,
          borderRadius: "4px",
          border: "1px solid",
          borderColor: "background.paper",
        },
      }}
    >
      {people.map((p) => {
        const label = p.displayName || p.email || "User";
        return (
          <Tooltip key={p.uid} title={label}>
            <Avatar
              variant="square"
              src={p.photoURL || undefined}
              sx={{ bgcolor: "primary.main", color: "#fff" }}
            >
              {label.charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
        );
      })}
    </AvatarGroup>
  );
}
