import "server-only";

export const SHIPPING_NAME_MIN = 2;
export const SHIPPING_NAME_MAX = 120;
export const SHIPPING_PHONE_MIN = 7;
export const SHIPPING_PHONE_MAX = 32;
export const SHIPPING_ADDRESS_MIN = 10;
export const SHIPPING_ADDRESS_MAX = 600;

/** 禁止明显控制字符，避免日志/邮件异常 */
function hasIllegalChars(s: string): boolean {
  return /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(s);
}

/**
 * 校验结账收货信息；通过返回 `null`，否则返回错误文案（英文，与现有 API 一致）
 */
export function validateShippingFields(
  shippingName: unknown,
  shippingPhone: unknown,
  shippingAddress: unknown,
): string | null {
  const name = String(shippingName ?? "").trim();
  const phone = String(shippingPhone ?? "").trim();
  const address = String(shippingAddress ?? "").trim();

  if (name.length < SHIPPING_NAME_MIN || name.length > SHIPPING_NAME_MAX) {
    return `Shipping name must be between ${SHIPPING_NAME_MIN} and ${SHIPPING_NAME_MAX} characters.`;
  }
  if (hasIllegalChars(name)) return "Shipping name contains invalid characters.";

  if (phone.length < SHIPPING_PHONE_MIN || phone.length > SHIPPING_PHONE_MAX) {
    return `Phone must be between ${SHIPPING_PHONE_MIN} and ${SHIPPING_PHONE_MAX} characters.`;
  }
  if (hasIllegalChars(phone)) return "Phone contains invalid characters.";
  if (!/^[\d\s\-+().a-zA-Z]{7,}$/.test(phone)) {
    return "Phone number format is invalid.";
  }

  if (address.length < SHIPPING_ADDRESS_MIN || address.length > SHIPPING_ADDRESS_MAX) {
    return `Shipping address must be between ${SHIPPING_ADDRESS_MIN} and ${SHIPPING_ADDRESS_MAX} characters.`;
  }
  if (hasIllegalChars(address)) return "Shipping address contains invalid characters.";

  return null;
}
