import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerService } from './player.service';
import { PlayerEntity } from './player.entity';

const imports: DynamicModule[] =
  process.env.DB_ENABLED === 'true' ? [TypeOrmModule.forFeature([PlayerEntity])] : [];

@Module({
  imports,
  providers: [PlayerService],
  exports: [PlayerService],
})
export class PlayerModule {}
