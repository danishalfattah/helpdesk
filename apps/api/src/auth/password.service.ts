import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  /**
   * Mengembalikan false untuk hash rusak, bukan melempar — hash yang tidak
   * terbaca artinya password tidak cocok, dan kegagalan login tidak boleh
   * bocor jadi error 500 yang membedakan akun ada atau tidak.
   */
  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}