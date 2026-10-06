const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function encode(n: number): string {
  if (n === 0) return ALPHABET[0];
  let code = "";
  while (n > 0) {
    code = ALPHABET[n % 62] + code;
    n = Math.floor(n / 62);
  }
  return code;
}

export function decode(code: string): number {
  let n = 0;
  for (const ch of code) n = n * 62 + ALPHABET.indexOf(ch);
  return n;
}
