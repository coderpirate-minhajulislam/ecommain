export type UserRole = 'super_admin' | 'admin' | 'manager' | 'user';

export type User = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    is_active: boolean;
    avatar?: string;
    profile_image?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
