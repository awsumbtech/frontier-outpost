import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ClassBadge from '../shared/ClassBadge';
import StatDiff from '../shared/StatDiff';
import UnitTile from '../combat/UnitTile';
import { createOperative, getEffectiveStats } from '../../engine/operatives';

describe('ClassBadge', () => {
  it('renders ANY for null classKey', () => {
    const { container } = render(<ClassBadge classKey={null} />);
    expect(container.textContent).toContain('ANY');
  });

  it('renders class name and icon for valid classKey', () => {
    const { container } = render(<ClassBadge classKey="VANGUARD" />);
    expect(container.textContent).toContain('Vanguard');
  });

  it('returns null for invalid classKey', () => {
    const { container } = render(<ClassBadge classKey="INVALID" />);
    expect(container.innerHTML).toBe('');
  });
});

describe('StatDiff', () => {
  it('returns null when newGear is null', () => {
    const { container } = render(<StatDiff currentGear={null} newGear={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows stat values for new gear with no current gear', () => {
    const { container } = render(
      <StatDiff currentGear={null} newGear={{ stats: { damage: 10, crit: 5 } }} />
    );
    expect(container.textContent).toContain('damage');
    expect(container.textContent).toContain('crit');
  });

  it('shows positive diff in green', () => {
    const { container } = render(
      <StatDiff
        currentGear={{ stats: { damage: 5 } }}
        newGear={{ stats: { damage: 10 } }}
      />
    );
    const posEl = container.querySelector('.stat-diff-pos');
    expect(posEl).toBeTruthy();
    expect(posEl.textContent).toContain('+5');
  });

  it('shows negative diff in red', () => {
    const { container } = render(
      <StatDiff
        currentGear={{ stats: { damage: 10 } }}
        newGear={{ stats: { damage: 5 } }}
      />
    );
    const negEl = container.querySelector('.stat-diff-neg');
    expect(negEl).toBeTruthy();
    expect(negEl.textContent).toContain('-5');
  });
});

describe('UnitTile (ally)', () => {
  it('renders operative name and level', () => {
    const op = createOperative('VANGUARD', 'Test Tank');
    const stats = getEffectiveStats(op);
    const { container } = render(<UnitTile unit={op} isAlly stats={stats} />);
    expect(container.textContent).toContain('Test');
    expect(container.textContent).toContain('L1');
  });

  it('shows dead overlay when not alive', () => {
    const op = createOperative('RECON', 'Dead Scout');
    op.alive = false;
    const stats = getEffectiveStats(op);
    const { container } = render(<UnitTile unit={op} isAlly stats={stats} />);
    expect(container.querySelector('.unit-dead')).toBeTruthy();
    expect(container.querySelector('.unit-tile-dead-overlay')).toBeTruthy();
  });

  it('shows HP bar', () => {
    const op = createOperative('MEDIC', 'Healer');
    const stats = getEffectiveStats(op);
    const { container } = render(<UnitTile unit={op} isAlly stats={stats} />);
    expect(container.querySelector('.bar-fill')).toBeTruthy();
  });

  it('shows DEF status when defending', () => {
    const op = createOperative('VANGUARD', 'Tank');
    op.defending = true;
    const stats = getEffectiveStats(op);
    const { container } = render(<UnitTile unit={op} isAlly stats={stats} defending />);
    expect(container.textContent).toContain('DEF');
    expect(container.querySelector('.unit-defending')).toBeTruthy();
  });
});

describe('UnitTile (enemy)', () => {
  it('renders enemy name and HP bar', () => {
    const enemy = { id: 'e1', name: 'Test Bot', hp: 50, maxHp: 100, damage: 10, armor: 5, speed: 8, alive: true, stunned: false };
    const { container } = render(<UnitTile unit={enemy} isAlly={false} />);
    expect(container.textContent).toContain('Test Bot');
    expect(container.querySelector('.bar-fill')).toBeTruthy();
  });

  it('shows STUN status when stunned', () => {
    const enemy = { id: 'e2', name: 'Stunned Bot', hp: 50, maxHp: 100, damage: 10, armor: 5, speed: 8, alive: true, stunned: true };
    const { container } = render(<UnitTile unit={enemy} isAlly={false} />);
    expect(container.textContent).toContain('STUN');
  });

  it('applies selectable class when selectable', () => {
    const enemy = { id: 'e3', name: 'Target', hp: 50, maxHp: 100, damage: 10, armor: 5, speed: 8, alive: true, stunned: false };
    const { container } = render(<UnitTile unit={enemy} isAlly={false} selectable onClick={() => {}} />);
    expect(container.querySelector('.unit-selectable')).toBeTruthy();
  });
});
