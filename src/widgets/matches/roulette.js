// Each lap contains every allowed map once; lap boundaries never repeat.
export function rouletteCards(pool, winner) {
  const unique = [...new Set(pool)];
  if (unique.length === 1) return {cards: unique, target: 0};
  const cards = [];
  while (cards.length < 60) {
    const lap = [...unique];
    for (let i = lap.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lap[i], lap[j]] = [lap[j], lap[i]];
    }
    if (lap[0] === cards.at(-1)) [lap[0], lap[1]] = [lap[1], lap[0]];
    cards.push(...lap);
  }
  return {cards, target: cards.indexOf(winner, 30)};
}
