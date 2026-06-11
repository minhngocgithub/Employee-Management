/**
 * Chuyển họ tên tiếng Việt thành email công ty: {ten}.{ho}@domain
 * Ví dụ: "Nguyễn Văn Nam" → "nam.nguyen@company.com"
 */
export function generateCompanyEmail(
  fullName: string,
  domain = 'company.com',
): string {
  const unsigned = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');

  const parts = unsigned.split(' ').filter(Boolean);
  if (parts.length === 0) {
    return `user@${domain}`;
  }
  if (parts.length === 1) {
    return `${parts[0]}@${domain}`;
  }

  const firstName = parts[parts.length - 1];
  const lastName = parts[0];

  return `${firstName}.${lastName}@${domain}`;
}
