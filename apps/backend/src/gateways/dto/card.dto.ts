import { IsIn, IsString, Matches } from 'class-validator';
import { RANKS, SUITS, type Rank, type Suit } from '@durak/shared';

export class CardDto {
  @IsIn(SUITS as unknown as readonly string[])
  suit!: Suit;

  @IsIn(RANKS as unknown as readonly string[])
  rank!: Rank;

  /** Server-assigned id like "8-hearts" — we still validate the shape. */
  @IsString()
  @Matches(/^(2|3|4|5|6|7|8|9|10|J|Q|K|A)-(hearts|diamonds|spades|clubs)$/)
  id!: string;
}
