import { ERROR_CODES } from '@durak/shared';
import {
  GameRuleError,
  endTurn,
  initGame,
  pendingConfirmationIds,
  playAttack,
  playDefense,
  redirectAttack,
  takeCards,
} from './game.engine';
import { c, state } from './_test-helpers';

describe('initGame — first attacker', () => {
  it('picks the player holding the lowest trump card', () => {
    // Arrange — 3 players, hearts is trump (bottom of deck).
    // p2's hand contains the 6♥ — the lowest trump that will be dealt.
    const deck = [
      // First 18 cards dealt round-robin (6 each): designed so p2 gets 6♥.
      // Round 1
      c('Ks'), c('Qd'), c('6h'), // p0=Ks, p1=Qd, p2=6h
      // Round 2
      c('Ad'), c('Jc'), c('7c'),
      // Round 3
      c('9s'), c('10d'), c('8s'),
      // Round 4
      c('9c'), c('Js'), c('7s'),
      // Round 5
      c('Qc'), c('Kd'), c('Qs'),
      // Round 6
      c('Ac'), c('10s'), c('8d'),
      // Remaining → trump at bottom
      c('Jh'),
    ];

    // Act
    const result = initGame({
      roomId: 'r1',
      players: [
        { id: 'p0', name: 'P0' },
        { id: 'p1', name: 'P1' },
        { id: 'p2', name: 'P2' },
      ],
      deck,
      dealerIdx: 0,
      now: 1,
    });

    // Assert
    expect(result.trumpSuit).toBe('hearts');
    expect(result.attackerIdx).toBe(2); // p2 holds the only trump dealt → goes first
    expect(result.defenderIdx).toBe(0);
  });

  it('falls back to the player after the dealer when no trump was dealt', () => {
    // Arrange — only one card in the deck (the trump itself); no trumps in hands.
    const deck = [
      c('Ks'), c('Qd'), c('Ac'), c('Jc'), // hands (2 each for two players)
      c('Kd'), c('Qs'),
      c('9s'), c('10d'),
      c('Jd'), c('Qc'),
      c('9d'), c('10s'),
      c('Ad'), c('8d'),
      c('Jh'), // bottom = trump
    ];

    // Act
    const result = initGame({
      roomId: 'r1',
      players: [
        { id: 'p0', name: 'P0' },
        { id: 'p1', name: 'P1' },
      ],
      deck,
      dealerIdx: 0,
      now: 1,
    });

    // Assert
    expect(result.trumpSuit).toBe('hearts');
    // Neither hand has a heart (only the bottom trump card is hearts)
    const handsHaveHearts = result.players.some((p) => p.hand.some((c2) => c2.suit === 'hearts'));
    expect(handsHaveHearts).toBe(false);
    expect(result.attackerIdx).toBe(1); // dealerIdx + 1
  });
});

describe('playAttack', () => {
  it('places the card on the table and switches phase to defending', () => {
    // Arrange
    const s = state({
      players: [{ id: 'p0', hand: ['7s', '9d'] }, { id: 'p1', hand: ['Jh', 'Ad'] }],
      trumpSuit: 'hearts',
    });

    // Act
    const next = playAttack(s, 'p0', c('7s'));

    // Assert
    expect(next.table).toEqual([{ attack: c('7s'), defense: null }]);
    expect(next.phase).toBe('defending');
    expect(next.players[0]!.hand).toEqual([c('9d')]);
  });

  it('rejects an attack from the defender', () => {
    // Arrange
    const s = state({
      players: [{ id: 'p0', hand: ['7s'] }, { id: 'p1', hand: ['Jh'] }],
      trumpSuit: 'hearts',
    });

    // Act + Assert
    expect(() => playAttack(s, 'p1', c('Jh'))).toThrow(GameRuleError);
    try {
      playAttack(s, 'p1', c('Jh'));
    } catch (err) {
      expect((err as GameRuleError).code).toBe(ERROR_CODES.NOT_YOUR_TURN);
    }
  });

  it('rejects a pile-on whose rank is not on the table', () => {
    // Arrange
    const s = state({
      players: [
        { id: 'p0', hand: ['9s'] },
        { id: 'p1', hand: ['Jh', 'Ad'] },
      ],
      trumpSuit: 'hearts',
      table: [{ attack: '7s' }],
      phase: 'defending',
    });

    // Act + Assert
    expect(() => playAttack(s, 'p0', c('9s'))).toThrow('Rank not on table');
  });

  it('accepts a pile-on whose rank matches a defense card on the table', () => {
    // Arrange — table has 7♠ defended with J♥; 7 OR J are now pile-on-able.
    // Defender holds Q♣ (beats J♣) so auto-take does NOT fire and we can
    // observe the pile-on sitting on the table.
    const s = state({
      players: [
        { id: 'p0', hand: ['Jc'] },
        { id: 'p1', hand: ['Qc', '8d', 'Kh'] },
      ],
      trumpSuit: 'hearts',
      table: [{ attack: '7s', defense: 'Jh' }],
      phase: 'attacking',
    });

    // Act
    const next = playAttack(s, 'p0', c('Jc'));

    // Assert
    expect(next.table).toHaveLength(2);
    expect(next.table[1]).toEqual({ attack: c('Jc'), defense: null });
  });

  it('rejects a pile-on if the defender has no hand capacity', () => {
    // Arrange — defender has 1 card, table already has 1 undefended attack
    const s = state({
      players: [
        { id: 'p0', hand: ['7c', '7s'] },
        { id: 'p1', hand: ['Ad'] },
      ],
      trumpSuit: 'hearts',
      table: [{ attack: '7s' }],
      phase: 'defending',
    });

    // Act + Assert
    expect(() => playAttack(s, 'p0', c('7c'))).toThrow('Defender has no hand capacity');
  });
});

describe('playDefense', () => {
  it('marks the attack as defended and stays in defending phase if undefended attacks remain', () => {
    // Arrange
    const s = state({
      players: [
        { id: 'p0', hand: ['7s', '8s'] },
        { id: 'p1', hand: ['Jh', 'Qh'] },
      ],
      trumpSuit: 'hearts',
      table: [{ attack: '7s' }, { attack: '8s' }],
      phase: 'defending',
    });

    // Act
    const next = playDefense(s, 'p1', c('7s').id, c('Jh'));

    // Assert
    expect(next.table[0]).toEqual({ attack: c('7s'), defense: c('Jh') });
    expect(next.table[1]).toEqual({ attack: c('8s'), defense: null });
    expect(next.phase).toBe('defending');
    expect(next.players[1]!.hand).toEqual([c('Qh')]);
  });

  it('refuses a defense card that does not beat the attack', () => {
    // Arrange
    const s = state({
      players: [
        { id: 'p0', hand: [] },
        { id: 'p1', hand: ['6s'] },
      ],
      trumpSuit: 'hearts',
      table: [{ attack: '7s' }],
      phase: 'defending',
    });

    // Act + Assert
    expect(() => playDefense(s, 'p1', c('7s').id, c('6s'))).toThrow('Defense does not beat attack');
  });

  it('auto-commits the round when the last defense lands and no one can pile on', () => {
    // Arrange — defender keeps a card after defending so the GAME doesn't end;
    // attacker holds only a non-rank-matching card (no pile-on possible).
    const s = state({
      players: [
        { id: 'p0', hand: ['Kd'] }, // can't pile on (no 7 or J)
        { id: 'p1', hand: ['Jh', '5c'] }, // defends with Jh, keeps 5c
      ],
      trumpSuit: 'hearts',
      table: [{ attack: '7s' }],
      phase: 'defending',
      deck: [],
    });

    // Act
    const next = playDefense(s, 'p1', c('7s').id, c('Jh'));

    // Assert — round committed: table empty, cards in discard, defender becomes new attacker
    expect(next.table).toEqual([]);
    expect(next.discard).toEqual([c('7s'), c('Jh')]);
    expect(next.attackerIdx).toBe(1); // defender → next attacker
    expect(next.defenderIdx).toBe(0);
    expect(next.phase).toBe('attacking');
  });
});

describe('redirectAttack (Weiterschieben)', () => {
  it('rotates the defender and pushes the redirected card onto the table', () => {
    // Arrange — 3 players; p1 redirects 3♠ to p2 with 3♣
    const s = state({
      players: [
        { id: 'p0', hand: ['Ad'] },
        { id: 'p1', hand: ['3c', 'Kh'] },
        { id: 'p2', hand: ['Qh', 'Jh'] }, // new defender; needs ≥ 2 cards for 2 attacks
      ],
      trumpSuit: 'hearts',
      attackerIdx: 0,
      defenderIdx: 1,
      table: [{ attack: '3s' }],
      phase: 'defending',
    });

    // Act
    const next = redirectAttack(s, 'p1', c('3c'));

    // Assert
    expect(next.table).toHaveLength(2);
    expect(next.table.map((p) => p.attack.id)).toEqual([c('3s').id, c('3c').id]);
    expect(next.attackerIdx).toBe(1); // old defender becomes attacker
    expect(next.defenderIdx).toBe(2); // next active player
    expect(next.players[1]!.hand).toEqual([c('Kh')]);
  });

  it('rejects redirect when the new defender has too few cards', () => {
    // Arrange
    const s = state({
      players: [
        { id: 'p0', hand: ['Ad'] },
        { id: 'p1', hand: ['3c', 'Kh'] },
        { id: 'p2', hand: ['Qh'] }, // only 1 card; can't cover 2 attacks
      ],
      trumpSuit: 'hearts',
      attackerIdx: 0,
      defenderIdx: 1,
      table: [{ attack: '3s' }],
      phase: 'defending',
    });

    // Act + Assert
    expect(() => redirectAttack(s, 'p1', c('3c'))).toThrow('Next player has too few cards');
  });

  it('refuses redirect with the defender\'s last card', () => {
    // Arrange
    const s = state({
      players: [
        { id: 'p0', hand: ['Ad'] },
        { id: 'p1', hand: ['3c'] }, // last card
        { id: 'p2', hand: ['Qh', 'Jh'] },
      ],
      trumpSuit: 'hearts',
      table: [{ attack: '3s' }],
      phase: 'defending',
    });

    // Act + Assert
    expect(() => redirectAttack(s, 'p1', c('3c'))).toThrow('Cannot pass on with your last card');
  });
});

describe('endTurn — Bito confirmation', () => {
  it('does not commit when an eligible attacker still has a pile-on-capable card', () => {
    // Arrange — 3 players. p0 attacks with 7, p2 (neighbor) holds another 7.
    // After defense, both p0 and p2 can pile on 7.
    const s = state({
      players: [
        { id: 'p0', hand: ['7c'] }, // can pile on
        { id: 'p1', hand: ['Ad'] }, // defender
        { id: 'p2', hand: ['7d', 'Kh'] }, // can pile on
      ],
      trumpSuit: 'hearts',
      attackerIdx: 0,
      defenderIdx: 1,
      table: [{ attack: '7s', defense: 'Jh' }],
      phase: 'attacking',
    });

    // Act — main attacker (p0) confirms first
    const next = endTurn(s, 'p0');

    // Assert — round NOT yet committed; p2 still in pending
    expect(next.table).toHaveLength(1);
    expect(next.passConfirmations.has(0)).toBe(true);
    const pending = pendingConfirmationIds(next);
    expect(pending).toContain('p2');
    expect(pending).not.toContain('p0');
  });

  it('commits the round once the last needed confirmation arrives', () => {
    // Arrange — same setup, but p0 already in passConfirmations
    const s = state({
      players: [
        { id: 'p0', hand: ['7c'] },
        { id: 'p1', hand: ['Ad'] },
        { id: 'p2', hand: ['7d', 'Kh'] },
      ],
      trumpSuit: 'hearts',
      attackerIdx: 0,
      defenderIdx: 1,
      table: [{ attack: '7s', defense: 'Jh' }],
      phase: 'attacking',
      passConfirmations: [0],
    });

    // Act — p2 confirms
    const next = endTurn(s, 'p2');

    // Assert — committed
    expect(next.table).toEqual([]);
    expect(next.discard).toContainEqual(c('7s'));
    expect(next.discard).toContainEqual(c('Jh'));
  });

  it('refuses Bito from the defender', () => {
    // Arrange
    const s = state({
      players: [
        { id: 'p0', hand: ['Kd'] },
        { id: 'p1', hand: ['Qd'] },
      ],
      trumpSuit: 'hearts',
      table: [{ attack: '7s', defense: 'Jh' }],
      phase: 'attacking',
    });

    // Act + Assert
    expect(() => endTurn(s, 'p1')).toThrow();
  });

  it('refuses Bito when the table is not fully defended', () => {
    // Arrange
    const s = state({
      players: [
        { id: 'p0', hand: ['Kd'] },
        { id: 'p1', hand: ['Qd'] },
      ],
      trumpSuit: 'hearts',
      table: [{ attack: '7s' }],
      phase: 'defending',
    });

    // Act + Assert
    expect(() => endTurn(s, 'p0')).toThrow('Table not fully defended');
  });
});

describe('tryAutoTake (via playAttack)', () => {
  it('auto-takes when defender cannot beat the attack and no one can pile on', () => {
    // Arrange — 2-player game. p0 attacks with K♠, p1 has only 6♣ (no beat).
    // p0 has no other matching-rank card to pile on.
    const s = state({
      players: [
        { id: 'p0', hand: ['Ks', '7d'] },
        { id: 'p1', hand: ['6c', '8d'] },
      ],
      trumpSuit: 'hearts',
      deck: ['Js', 'Qs', '9d'],
      attackerIdx: 0,
      defenderIdx: 1,
      phase: 'attacking',
    });

    // Act
    const next = playAttack(s, 'p0', c('Ks'));

    // Assert — auto-took: p1 has the K♠ in hand, table empty, rotation past defender
    expect(next.table).toEqual([]);
    expect(next.players[1]!.hand).toEqual(expect.arrayContaining([c('Ks')]));
    expect(next.attackerIdx).toBe(0); // skip defender (p1), next active is p0
    expect(next.defenderIdx).toBe(1);
  });

  it('does not auto-take if the defender can beat the attack', () => {
    // Arrange — defender has a beating card; they get to choose.
    const s = state({
      players: [
        { id: 'p0', hand: ['7s', '9d'] },
        { id: 'p1', hand: ['Js', 'Kh'] }, // J♠ beats 7♠
      ],
      trumpSuit: 'hearts',
      deck: [],
      attackerIdx: 0,
      defenderIdx: 1,
      phase: 'attacking',
    });

    // Act
    const next = playAttack(s, 'p0', c('7s'));

    // Assert — table still has the attack, defender hasn't auto-taken
    expect(next.table).toHaveLength(1);
    expect(next.phase).toBe('defending');
  });

  it('waits to auto-take when an attacker still has a pile-on card', () => {
    // Arrange — 3 players. p2 (neighbor) holds another 7 — could pile on.
    const s = state({
      players: [
        { id: 'p0', hand: ['7s'] },
        { id: 'p1', hand: ['6c'] }, // defender; can't beat 7♠
        { id: 'p2', hand: ['7d', 'Kh'] }, // neighbor with 7 to pile on
      ],
      trumpSuit: 'hearts',
      deck: [],
      attackerIdx: 0,
      defenderIdx: 1,
      phase: 'attacking',
    });

    // Act — p0 attacks; p1 can't beat it but p2 still might pile on
    const next = playAttack(s, 'p0', c('7s'));

    // Assert — table still holds the attack; auto-take waits for p2 to confirm
    expect(next.table).toHaveLength(1);
  });
});

describe('refill clears trumpCard when the deck runs out', () => {
  it('draws the trump card into a hand and nulls out state.trumpCard when the deck empties', () => {
    // Arrange — 2 players, deck has exactly one card left (the trump itself).
    // Round ends → refill should draw the trump into the attacker's hand and
    // null out trumpCard (trumpSuit stays).
    const s = state({
      players: [
        { id: 'p0', hand: ['7s', '9d', '10c', 'Qc', 'Ks'] }, // attacker, 5 cards
        { id: 'p1', hand: ['Js', '8c', 'Ad', '6s', '3c', 'Kh'] }, // defender, 6
      ],
      trump: 'Jh', // hearts is trump, J♥ is the bottom card
      trumpSuit: 'hearts',
      deck: ['Jh'], // only the trump left
      attackerIdx: 0,
      defenderIdx: 1,
      table: [{ attack: '7s', defense: 'Jh' }],
      phase: 'attacking',
      passConfirmations: [0], // pre-confirmed so endTurn commits immediately
    });

    // Act
    const next = endTurn(s, 'p0');

    // Assert — round committed: deck empty, trumpCard nulled, trumpSuit intact,
    // attacker now holds the J♥ in their hand (they refill first).
    expect(next.deck.length).toBe(0);
    expect(next.trumpCard).toBeNull();
    expect(next.trumpSuit).toBe('hearts');
    expect(next.players[0]!.hand).toEqual(expect.arrayContaining([c('Jh')]));
  });

  it('leaves trumpCard intact while the deck still has other cards', () => {
    // Arrange — deck has trump plus another card; only 5-card hands need a top-up.
    const s = state({
      players: [
        { id: 'p0', hand: ['7s', '9d', '10c', 'Qc', 'Ks'] },
        { id: 'p1', hand: ['Js', '8c', 'Ad', '6s', '3c', 'Kh'] },
      ],
      trump: 'Jh',
      trumpSuit: 'hearts',
      deck: ['As', 'Jh'], // attacker draws A♠, trump stays in deck
      attackerIdx: 0,
      defenderIdx: 1,
      table: [{ attack: '7s', defense: 'Jh' }],
      phase: 'attacking',
      passConfirmations: [0],
    });

    // Act
    const next = endTurn(s, 'p0');

    // Assert
    expect(next.trumpCard).toEqual(c('Jh'));
    expect(next.deck.length).toBe(1); // trump still down there
  });
});

describe('takeCards', () => {
  it('moves every attack and defense card to the defender hand', () => {
    // Arrange
    const s = state({
      players: [
        { id: 'p0', hand: [] },
        { id: 'p1', hand: ['Kh'] },
      ],
      trumpSuit: 'hearts',
      table: [
        { attack: '7s', defense: 'Jh' },
        { attack: '9d' },
        { attack: '6c' },
      ],
      phase: 'defending',
    });

    // Act
    const next = takeCards(s, 'p1');

    // Assert
    expect(next.table).toEqual([]);
    expect(next.players[1]!.hand).toEqual([c('Kh'), c('7s'), c('Jh'), c('9d'), c('6c')]);
  });

  it('skips the defender on rotation (defender does not attack next round)', () => {
    // Arrange — 3 players
    const s = state({
      players: [
        { id: 'p0', hand: ['9d'] },
        { id: 'p1', hand: ['Kh'] }, // defender; will take
        { id: 'p2', hand: ['Qh'] },
      ],
      trumpSuit: 'hearts',
      attackerIdx: 0,
      defenderIdx: 1,
      table: [{ attack: '7s' }],
      phase: 'defending',
    });

    // Act
    const next = takeCards(s, 'p1');

    // Assert — next attacker is the player after the defender (p2)
    expect(next.attackerIdx).toBe(2);
    expect(next.defenderIdx).toBe(0);
  });
});

describe('pendingConfirmationIds', () => {
  it('returns empty when the table is not fully defended', () => {
    // Arrange
    const s = state({
      players: [{ id: 'p0', hand: ['7c'] }, { id: 'p1', hand: ['Ad'] }],
      trumpSuit: 'hearts',
      table: [{ attack: '7s' }],
      phase: 'defending',
    });

    // Act
    const result = pendingConfirmationIds(s);

    // Assert
    expect(result).toEqual([]);
  });

  it('returns empty when the table is at MAX_TABLE_PAIRS', () => {
    // Arrange — 6 fully-defended pairs; no more pile-on possible
    const s = state({
      players: [{ id: 'p0', hand: ['7c'] }, { id: 'p1', hand: ['Ad'] }],
      trumpSuit: 'hearts',
      table: Array.from({ length: 6 }, (_, i) => ({
        attack: `${(i % 9) + 6}s` as string,
        defense: 'Ah',
      })),
      phase: 'attacking',
    });

    // Act
    const result = pendingConfirmationIds(s);

    // Assert
    expect(result).toEqual([]);
  });

  it('auto-passes attackers with no rank match in hand', () => {
    // Arrange — main attacker holds a 7 (matches), neighbor holds only K
    const s = state({
      players: [
        { id: 'p0', hand: ['7c'] }, // matches table rank
        { id: 'p1', hand: ['Ad'] }, // defender
        { id: 'p2', hand: ['Kh'] }, // does NOT match — should auto-pass
      ],
      trumpSuit: 'hearts',
      attackerIdx: 0,
      defenderIdx: 1,
      table: [{ attack: '7s', defense: 'Jh' }],
      phase: 'attacking',
    });

    // Act
    const result = pendingConfirmationIds(s);

    // Assert
    expect(result).toEqual(['p0']);
  });
});
