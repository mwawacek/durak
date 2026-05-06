import { Body, Controller, Post } from '@nestjs/common';
import { IsString, Length } from 'class-validator';

class RegisterDto {
  @IsString()
  @Length(2, 32)
  name!: string;
}

/**
 * Minimal REST auth — name-based for now (no passwords/JWT yet).
 * Extend to full OAuth or JWT in a later iteration; socket identity
 * is established on handshake via `joinLobby`.
 */
@Controller('auth')
export class AuthController {
  @Post('register')
  register(@Body() dto: RegisterDto): { name: string } {
    return { name: dto.name };
  }
}
