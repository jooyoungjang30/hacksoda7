// Render smoke tests: tsc passing does not prove a component renders.
// Server-renders every route and fails on any throw, NaN, or undefined leaking
// into the DOM.
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createElement as h } from 'react';
import App from './App';

const render = (path: string) =>
  renderToString(h(MemoryRouter, { initialEntries: [path] }, h(App)));

describe('SMOKE: every route renders without throwing', () => {
  it('1.1 dashboard', () => {
    const html = render('/kudos');
    expect(html).toContain('Kudos Gift Tracker');
    expect(html).toContain('Engineering');
    expect(html).toContain('Priya Raman');   // leaderboard
    expect(html).toMatch(/\$2,121|2,121/);   // company given
    expect(html.length).toBeGreaterThan(5000);
  });

  it('1.2 team drill-down', () => {
    const html = render('/kudos/team/engineering');
    expect(html).toContain('Engineering');
    for (const n of ['Priya Raman','Jonas Kerr','Ravi Menon','Wei Chen','Marcus Bell'])
      expect(html).toContain(n);
    // whole team minus anyone at 100% — Engineering is 14 members, Priya at $80
    expect(html).toMatch(/Nudge team[^<]*13/);
  });

  it('1.2 unknown team redirects rather than crashing', () => {
    expect(() => render('/kudos/team/does-not-exist')).not.toThrow();
  });

  it('1.4 network map renders an SVG with nodes and edges', () => {
    const html = render('/kudos/network');
    expect(html).toContain('<svg');
    const circles = (html.match(/<circle/g) ?? []).length;
    const lines = (html.match(/<line|<path/g) ?? []).length;
    console.log(`\nNETWORK MAP: ${circles} circles, ${lines} edges rendered`);
    expect(circles).toBeGreaterThan(15);
    expect(lines).toBeGreaterThan(15);
    // d3-force must have produced finite coordinates
    expect(html).not.toMatch(/(cx|cy)="(NaN|undefined|Infinity)"/);
  });

  it('all routes free of NaN / undefined / $NaN leaking into the DOM', () => {
    for (const p of ['/kudos','/kudos/team/engineering','/kudos/team/sales','/kudos/network']) {
      const html = render(p);
      expect(html, `NaN in ${p}`).not.toMatch(/\$NaN|>NaN<|>undefined<|>null</);
    }
  });
});
