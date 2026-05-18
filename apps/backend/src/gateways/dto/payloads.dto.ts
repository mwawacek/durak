import { Type } from 'class-transformer';
import { IsInt, IsString, Length, Max, Min, ValidateNested } from 'class-validator';
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  NAME_MIN_LEN,
  PLAYER_NAME_MAX_LEN,
  ROOM_NAME_MAX_LEN,
} from '@durak/shared';
import { CardDto } from './card.dto';

export class JoinLobbyDto {
  @IsString()
  @Length(NAME_MIN_LEN, PLAYER_NAME_MAX_LEN)
  playerName!: string;
}

export class CreateRoomDto {
  @IsString()
  @Length(NAME_MIN_LEN, ROOM_NAME_MAX_LEN)
  name!: string;

  @IsInt()
  @Min(MIN_PLAYERS)
  @Max(MAX_PLAYERS)
  maxPlayers!: number;
}

export class RoomRefDto {
  @IsString()
  @Length(1, 128)
  roomId!: string;
}

export class PlayCardDto extends RoomRefDto {
  @ValidateNested()
  @Type(() => CardDto)
  card!: CardDto;
}

export class DefendCardDto extends RoomRefDto {
  @IsString()
  @Length(1, 32)
  attackCardId!: string;

  @ValidateNested()
  @Type(() => CardDto)
  defenseCard!: CardDto;
}

export class RedirectAttackDto extends RoomRefDto {
  @ValidateNested()
  @Type(() => CardDto)
  card!: CardDto;
}
