import { card, pair } from './_test-helpers';
import {
  beats,
  canRedirectWith,
  ranksOnTable,
  tableFullyDefended,
  tableIsUniformRank,
} from './rules';

describe('beats', () => {
  it('beats with same suit higher rank', () => {
    // Arrange
    const attack = card('7', 'spades');
    const defense = card('J', 'spades');

    // Act
    const result = beats(attack, defense, null);

    // Assert
    expect(result).toBe(true);
  });

  it('refuses same suit equal rank', () => {
    // Arrange
    const attack = card('9', 'clubs');
    const defense = card('9', 'clubs');

    // Act
    const result = beats(attack, defense, null);

    // Assert
    expect(result).toBe(false);
  });

  it('refuses same suit lower rank', () => {
    // Arrange
    const attack = card('K', 'diamonds');
    const defense = card('Q', 'diamonds');

    // Act
    const result = beats(attack, defense, null);

    // Assert
    expect(result).toBe(false);
  });

  it('beats non-trump with any trump', () => {
    // Arrange
    const attack = card('A', 'spades');
    const defense = card('6', 'hearts'); // hearts is trump

    // Act
    const result = beats(attack, defense, 'hearts');

    // Assert
    expect(result).toBe(true);
  });

  it('refuses trump-on-trump with lower rank', () => {
    // Arrange
    const attack = card('Q', 'hearts');
    const defense = card('J', 'hearts');

    // Act
    const result = beats(attack, defense, 'hearts');

    // Assert
    expect(result).toBe(false);
  });

  it('beats trump-on-trump with higher rank', () => {
    // Arrange
    const attack = card('Q', 'hearts');
    const defense = card('K', 'hearts');

    // Act
    const result = beats(attack, defense, 'hearts');

    // Assert
    expect(result).toBe(true);
  });

  it('refuses different non-trump suits regardless of rank', () => {
    // Arrange
    const attack = card('6', 'spades');
    const defense = card('A', 'clubs');

    // Act
    const result = beats(attack, defense, 'hearts');

    // Assert
    expect(result).toBe(false);
  });
});

describe('ranksOnTable', () => {
  it('includes both attack and defense ranks', () => {
    // Arrange
    const table = [pair('3s', '7h'), pair('3c', '8d'), pair('Js')];

    // Act
    const ranks = ranksOnTable(table);

    // Assert
    expect(ranks).toEqual(new Set(['3', '7', '8', 'J']));
  });

  it('returns an empty set for an empty table', () => {
    // Arrange
    const table: ReturnType<typeof pair>[] = [];

    // Act
    const ranks = ranksOnTable(table);

    // Assert
    expect(ranks.size).toBe(0);
  });
});

describe('tableFullyDefended', () => {
  it('is false for an empty table', () => {
    // Arrange
    const table: ReturnType<typeof pair>[] = [];

    // Act
    const result = tableFullyDefended(table);

    // Assert
    expect(result).toBe(false);
  });

  it('is true when every pair has a defense card', () => {
    // Arrange
    const table = [pair('7s', 'Jh'), pair('9c', 'Ad')];

    // Act
    const result = tableFullyDefended(table);

    // Assert
    expect(result).toBe(true);
  });

  it('is false when one pair is undefended', () => {
    // Arrange
    const table = [pair('7s', 'Jh'), pair('9c')];

    // Act
    const result = tableFullyDefended(table);

    // Assert
    expect(result).toBe(false);
  });
});

describe('tableIsUniformRank', () => {
  it('is true for a single-pair table', () => {
    // Arrange
    const table = [pair('7s')];

    // Act
    const result = tableIsUniformRank(table);

    // Assert
    expect(result).toBe(true);
  });

  it('is true when all attacks share a rank', () => {
    // Arrange
    const table = [pair('7s'), pair('7c'), pair('7d')];

    // Act
    const result = tableIsUniformRank(table);

    // Assert
    expect(result).toBe(true);
  });

  it('is false when ranks differ', () => {
    // Arrange
    const table = [pair('7s'), pair('8c')];

    // Act
    const result = tableIsUniformRank(table);

    // Assert
    expect(result).toBe(false);
  });

  it('is false for an empty table', () => {
    // Arrange
    const table: ReturnType<typeof pair>[] = [];

    // Act
    const result = tableIsUniformRank(table);

    // Assert
    expect(result).toBe(false);
  });
});

describe('canRedirectWith', () => {
  it('allows redirect when defender holds a same-rank card and conditions hold', () => {
    // Arrange
    const hand = [card('7', 'hearts'), card('K', 'spades')];
    const table = [pair('7s'), pair('7c')];

    // Act
    const result = canRedirectWith(hand, table);

    // Assert
    expect(result).toBe(true);
  });

  it('forbids redirect when defender has only one card', () => {
    // Arrange
    const hand = [card('7', 'hearts')];
    const table = [pair('7s')];

    // Act
    const result = canRedirectWith(hand, table);

    // Assert
    expect(result).toBe(false);
  });

  it('forbids redirect when ranks on the table differ', () => {
    // Arrange
    const hand = [card('7', 'hearts'), card('8', 'clubs'), card('K', 'spades')];
    const table = [pair('7s'), pair('8c')];

    // Act
    const result = canRedirectWith(hand, table);

    // Assert
    expect(result).toBe(false);
  });

  it('forbids redirect when defender already started defending', () => {
    // Arrange
    const hand = [card('7', 'hearts'), card('K', 'spades')];
    const table = [pair('7s', 'Jh'), pair('7c')];

    // Act
    const result = canRedirectWith(hand, table);

    // Assert
    expect(result).toBe(false);
  });

  it('forbids redirect when defender has no same-rank card', () => {
    // Arrange
    const hand = [card('K', 'spades'), card('J', 'diamonds')];
    const table = [pair('7s'), pair('7c')];

    // Act
    const result = canRedirectWith(hand, table);

    // Assert
    expect(result).toBe(false);
  });
});
