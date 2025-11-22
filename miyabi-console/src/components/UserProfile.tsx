import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  User
} from '@heroui/react';
import { useAuth } from '../contexts/AuthContext';

export default function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <User
          as="button"
          avatarProps={{
            src: user.avatar_url,
            size: 'sm',
          }}
          className="transition-transform hover:scale-105 cursor-pointer"
          description={`@${user.username}`}
          name={user.username}
        />
      </DropdownTrigger>
      <DropdownMenu aria-label="User Actions" variant="flat">
        <DropdownItem key="profile" className="h-14 gap-2">
          <p className="font-semibold">Logged in as</p>
          <p className="font-semibold">{user.email || user.username}</p>
        </DropdownItem>
        <DropdownItem key="settings">
          Settings
        </DropdownItem>
        <DropdownItem key="activity">
          Activity Log
        </DropdownItem>
        <DropdownItem key="logout" color="danger" onClick={logout}>
          Log Out
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
