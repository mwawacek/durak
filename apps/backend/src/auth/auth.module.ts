import { Module } from '@nestjs/common';
import { PlayerModule } from '../player/player.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [PlayerModule],
  controllers: [AuthController],
})
export class AuthModule {}
