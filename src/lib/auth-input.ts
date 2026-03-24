/** 注册、忘记密码等接口共用的输入边界（无 zod 依赖） */

export const EMAIL_MAX_LEN = 254;
export const PASSWORD_MIN_LEN = 6;
export const PASSWORD_MAX_LEN = 128;
export const USER_NAME_MAX_LEN = 120;

export function isReasonableEmail(email: string): boolean {
  if (!email || email.length > EMAIL_MAX_LEN) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  return true;
}
