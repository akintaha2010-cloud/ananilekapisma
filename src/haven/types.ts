export type HTheme = 'cankaya' | 'kizilay' | 'tunali' | 'frost' | 'glitch' | 'tower';
export type EnemyKind = 'bug' | 'glitch' | 'spammer' | 'firewall' | 'conflict';
export type BossKind = 'mert' | 'tuna' | 'ayaz' | 'gokoz' | 'buglord';
export type FoeKind = EnemyKind | BossKind;
export type WeaponKind = 'doner' | 'cay' | 'simit' | 'skewer' | 'keyboard';
export type PickupKind = 'coin' | 'heal' | WeaponKind;
export type ProjKind = 'doner' | 'cay' | 'simit' | 'err' | 'lavas' | 'ayran' | 'ice' | 'clock' | 'orb' | 'shock' | 'laser';
export type Team = 'hero' | 'foe';
export type ActKind =
  | 'none'
  | 'p1'
  | 'p2'
  | 'kick'
  | 'jkick'
  | 'slide'
  | 'throw'
  | 'swing'
  | 'special'
  | 'hurt'
  | 'down'
  | 'block'
  | 'windup'
  | 'attack'
  | 'cast'
  | 'dash'
  | 'slam'
  | 'spin'
  | 'vanish';

export interface Body {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  ground: boolean;
  hp: number;
  maxHp: number;
  act: ActKind;
  actT: number;
  actDur: number;
  hitDone: boolean;
  invT: number;
  flashT: number;
  dead: boolean;
  deadT: number;
  animT: number;
}

export interface Player extends Body {
  combo: number;
  comboT: number;
  weapon: WeaponKind | null;
  ammo: number;
  coins: number;
  lives: number;
  special: number;
  jumpBuf: number;
  coyote: number;
  slowT: number;
  lastSafeX: number;
  kills: number;
  deaths: number;
}

export interface Enemy extends Body {
  kind: FoeKind;
  boss: boolean;
  name: string;
  scale: number;
  aiT: number;
  atkCd: number;
  move: string;
  phase: number;
  armor: number;
  clone: boolean;
  dir: 1 | -1;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: ProjKind;
  team: Team;
  dmg: number;
  life: number;
  spin: number;
  grav: number;
  pierce: boolean;
  w: number;
  h: number;
  hit: number[];
  delay: number;
}

export interface Pickup {
  x: number;
  y: number;
  vy: number;
  kind: PickupKind;
  t: number;
}

export interface Crate {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  loot: PickupKind[];
  broken: boolean;
  shake: number;
}

export interface Solid {
  x: number;
  y: number;
  w: number;
  h: number;
  oneWay?: boolean;
  kind?: 'ground' | 'block' | 'awning' | 'scaffold';
}

export interface Encounter {
  x: number;
  waves: FoeKind[][];
  started: boolean;
  done: boolean;
  waveIdx: number;
  bus?: boolean;
  tip?: string;
}

export interface Decor {
  x: number;
  kind: string;
  text?: string;
}

export interface Npc {
  x: number;
  text: string;
  look: 'npc' | 'cat' | 'simitci' | 'devin_cay' | 'coder';
  said: boolean;
}

export interface Level {
  id: number;
  title: string;
  theme: HTheme;
  width: number;
  solids: Solid[];
  crates: Crate[];
  pickups: Pickup[];
  encounters: Encounter[];
  checkpoints: number[];
  decor: Decor[];
  npcs: Npc[];
  exitX: number;
  boss: BossKind | null;
}

export interface Fx {
  kind: 'spark' | 'dust' | 'ring' | 'num' | 'shard' | 'confetti' | 'code' | 'snow';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  text?: string;
}

export interface Bus {
  x: number;
  dir: 1 | -1;
  stopX: number;
  t: number;
  spawned: boolean;
}

export interface Helper extends Body {
  who: 'ozgur';
  atkCd: number;
}

export type SoundCue = 'hit' | 'heavy' | 'jump' | 'ko' | 'pickup' | 'boom' | 'throw' | 'hurt' | 'special' | 'win' | 'block';

export interface HavenInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  punch: boolean;
  kick: boolean;
  throw: boolean;
  special: boolean;
}

export interface HavenState {
  level: Level;
  t: number;
  player: Player;
  devin: { x: number; y: number; say: string; sayT: number; healCd: number; tipCd: number };
  helper: Helper | null;
  enemies: Enemy[];
  projs: Projectile[];
  pickups: Pickup[];
  fx: Fx[];
  bus: Bus | null;
  camX: number;
  lockX: number | null;
  checkpoint: number;
  phase: 'play' | 'dead' | 'won';
  endT: number;
  shake: number;
  hitstop: number;
  banner: { text: string; t: number };
  cues: SoundCue[];
  bossId: number | null;
  nextId: number;
  rngSeed: number;
}
