/**
 * @file lib/utils/generatePassword.ts
 * @description Crypto-secure random password generator for new user account creation.
 * Excludes ambiguous characters (0, O, l, 1, I) to prevent confusion when read in welcome emails.
 */

import crypto from 'crypto';

const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluded I, O
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz'; // Excluded l
const DIGITS = '23456789'; // Excluded 0, 1
const SYMBOLS = '@#$%!*';

const ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS + SYMBOLS;

/**
 * Generates a crypto-secure 12-character random password.
 * Guarantees at least one uppercase, lowercase, digit, and symbol character.
 *
 * @returns 12-character random password string.
 */
export function generateRandomPassword(): string {
  // Ensure required character sets are represented
  const reqUpper = UPPERCASE[crypto.randomInt(0, UPPERCASE.length)];
  const reqLower = LOWERCASE[crypto.randomInt(0, LOWERCASE.length)];
  const reqDigit = DIGITS[crypto.randomInt(0, DIGITS.length)];
  const reqSymbol = SYMBOLS[crypto.randomInt(0, SYMBOLS.length)];

  const passwordChars = [reqUpper, reqLower, reqDigit, reqSymbol];

  // Fill remaining 8 characters randomly
  for (let i = 0; i < 8; i++) {
    const randomChar = ALL_CHARS[crypto.randomInt(0, ALL_CHARS.length)];
    passwordChars.push(randomChar);
  }

  // Shuffle using Fisher-Yates algorithm with crypto.randomBytes
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    const temp = passwordChars[i];
    passwordChars[i] = passwordChars[j];
    passwordChars[j] = temp;
  }

  return passwordChars.join('');
}
