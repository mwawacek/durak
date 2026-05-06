import { Injectable } from '@nestjs/common';
import { Card, SUITS, RANKS, cardId } from '@durak/shared';

@Injectable()
export class DeckService {
  buildDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank, id: cardId(suit, rank) });
      }
    }
    return deck;
  }

  /** Fisher-Yates shuffle using Math.random — replace with seeded RNG for reproducibility if needed. */
  shuffle<T>(input: T[]): T[] {
    const arr = [...input];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i]!;
      arr[i] = arr[j]!;
      arr[j] = tmp;
    }
    return arr;
  }
}
