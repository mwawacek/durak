import { Module } from '@nestjs/common';
import { DeckService } from './deck.service';
import { GameService } from './game.service';

@Module({
  providers: [DeckService, GameService],
  exports: [GameService, DeckService],
})
export class GameModule {}
