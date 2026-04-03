import { SPRITE_MAP } from './index';

const STATE_CLASSES = {
  idle: '',
  damage: 'sprite-damage',
  dead: 'sprite-dead',
  stunned: 'sprite-stunned',
  defending: 'sprite-defending',
};

export default function SpriteIcon({ spriteId, size = 28, state = 'idle', color, className = '', style, ...rest }) {
  const SpriteComponent = SPRITE_MAP[spriteId];
  const stateCls = STATE_CLASSES[state] || '';
  const cls = ['sprite-icon', stateCls, className].filter(Boolean).join(' ');

  const mergedStyle = {
    width: size,
    height: size,
    flexShrink: 0,
    ...(color ? { '--sprite-primary': color } : {}),
    ...style,
  };

  if (!SpriteComponent) {
    return <span className={cls} style={mergedStyle} {...rest}>{spriteId?.[0] || '?'}</span>;
  }

  return (
    <span className={cls} style={mergedStyle} {...rest}>
      <SpriteComponent className="sprite-svg" />
    </span>
  );
}
