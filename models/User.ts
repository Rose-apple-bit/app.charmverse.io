import type { DiscordUser, FavoritePage, Role as RoleMembership, SpaceRole, SpaceRoleToRole, TelegramUser, User, UserNotificationState } from '@prisma/client';

export { FavoritePage, SpaceRole, User };

export interface Contributor extends Omit<User, 'addresses'> {
  isAdmin: boolean;
  joinDate: string;
  hasNftAvatar?: boolean;
}

interface NestedMemberships {
  spaceRoleToRole: (SpaceRoleToRole & { role: RoleMembership })[]
}

export interface LoggedInUser extends User {
  favorites: { pageId: string }[];
  spaceRoles: (SpaceRole & NestedMemberships)[]
  ensName?: string;
  discordUser?: DiscordUser | null
  telegramUser?: TelegramUser | null
  notificationState?: UserNotificationState | null
}

export const IDENTITY_TYPES = ['Wallet', 'Discord', 'Telegram', 'RandomName'] as const;
export type IdentityType = typeof IDENTITY_TYPES[number];
