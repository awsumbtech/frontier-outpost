import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ClassBadge from '../shared/ClassBadge';
import StatDiff from '../shared/StatDiff';
import CombatAlly from '../combat/CombatAlly';
import CombatEnemy from '../combat/CombatEnemy';
import { createOperative } from '../../engine/operatives';

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

describe('CombatAlly', () => {
  it('renders operative name and stats', () => {
    const op = createOperative('VANGUARD', 'Test Tank');
    const { container } = render(<CombatAlly op={op} />);
    expect(container.textContent).toContain('Test');
    expect(container.textContent).toContain('L1');
  });

  it('shows dead class when not alive', () => {
    const op = createOperative('RECON', 'Dead Scout');
    op.alive = false;
    const { container } = render(<CombatAlly op={op} />);
    expect(container.querySelector('.dead')).toBeTruthy();
  });

  it('shows HP bar', () => {
    const op = createOperative('MEDIC', 'Healer');
    const { container } = render(<CombatAlly op={op} />);
    expect(container.querySelector('.bar-fill')).toBeTruthy();
    expect(container.textContent).toContain(`${op.currentHp}/`);
  });
});

describe('CombatEnemy', () => {
  it('renders enemy name and HP', () => {
    const enemy = { name: 'Test Bot', hp: 50, maxHp: 100, damage: 10, armor: 5, speed: 8, stunned: false };
    const { container } = render(<CombatEnemy e={enemy} />);
    expect(container.textContent).toContain('Test Bot');
    expect(container.textContent).toContain('50/100');
  });

  it('shows STN badge when stunned', () => {
    const enemy = { name: 'Stunned Bot', hp: 50, maxHp: 100, damage: 10, armor: 5, speed: 8, stunned: true };
    const { container } = render(<CombatEnemy e={enemy} />);
    expect(container.textContent).toContain('STUNNED');
  });
});
