import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configuration, AppConfig } from './config/configuration';
import { PlayerModule } from './player/player.module';
import { RoomModule } from './room/room.module';
import { GameModule } from './game/game.module';
import { GameGateway } from './gateways/game.gateway';
import { HealthController } from './health.controller';

// Postgres is strictly optional — game logic is in-memory.
// Enable by setting DB_ENABLED=true in the environment (docker-compose does this).
const dbImports: DynamicModule[] =
  process.env.DB_ENABLED === 'true'
    ? [
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService<AppConfig, true>) => ({
            type: 'postgres',
            host: config.get('db.host', { infer: true }),
            port: config.get('db.port', { infer: true }),
            username: config.get('db.user', { infer: true }),
            password: config.get('db.password', { infer: true }),
            database: config.get('db.database', { infer: true }),
            autoLoadEntities: true,
            synchronize: config.get('db.sync', { infer: true }),
            retryAttempts: 5,
            retryDelay: 3000,
          }),
        }),
      ]
    : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ...dbImports,
    PlayerModule,
    RoomModule,
    GameModule,
  ],
  controllers: [HealthController],
  providers: [GameGateway],
})
export class AppModule {}
