export const KEYMAPS = [
  { left: 'KeyA', right: 'KeyD', jump: 'KeyW', down: 'KeyS', shove: 'KeyQ', label: 'A D · W zıpla · S çakıl · Q it' },
  { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', down: 'ArrowDown', shove: 'ShiftRight', label: '← → · ↑ zıpla · ↓ çakıl · Sağ Shift it' },
  { left: 'KeyJ', right: 'KeyL', jump: 'KeyI', down: 'KeyK', shove: 'KeyU', label: 'J L · I zıpla · K çakıl · U it' },
  { left: 'Numpad4', right: 'Numpad6', jump: 'Numpad8', down: 'Numpad5', shove: 'Numpad7', label: 'Num 4 6 · 8 zıpla · 5 çakıl · 7 it' },
];

const ACTIONS = ['left', 'right', 'jump', 'down', 'shove'];

export function createKeyboard(target = window) {
  const down = new Set();
  const tapped = new Set();
  const gameKeys = new Set(KEYMAPS.flatMap((m) => ACTIONS.map((a) => m[a])));
  target.addEventListener('keydown', (e) => {
    if (gameKeys.has(e.code) && !e.target.closest?.('input, textarea')) e.preventDefault();
    if (!down.has(e.code)) tapped.add(e.code);
    down.add(e.code);
  });
  target.addEventListener('keyup', (e) => down.delete(e.code));
  target.addEventListener('blur', () => down.clear());
  return {
    isDown: (code) => down.has(code) || tapped.has(code),
    endStep: () => tapped.clear(),
  };
}

export function emptyInput() {
  return { left: false, right: false, jump: false, down: false, shove: false };
}

export function readKeys(kb, map) {
  const r = emptyInput();
  for (const a of ACTIONS) r[a] = kb.isDown(map[a]);
  return r;
}

export function readGamepad(index) {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = pads && pads[index];
  const r = emptyInput();
  if (!gp) return r;
  const ax = gp.axes[0] || 0;
  const ay = gp.axes[1] || 0;
  const b = (i) => !!gp.buttons[i]?.pressed;
  r.left = ax < -0.4 || b(14);
  r.right = ax > 0.4 || b(15);
  r.jump = b(0) || b(12);
  r.down = ay > 0.6 || b(13) || b(1);
  r.shove = b(2) || b(3) || b(5) || b(7);
  return r;
}

export function mergeInputs(a, b) {
  const r = emptyInput();
  for (const k of ACTIONS) r[k] = a[k] || b[k];
  return r;
}

export function withEdges(cur, prev) {
  return {
    ...cur,
    jumpPressed: cur.jump && !prev.jump,
    downPressed: cur.down && !prev.down,
    shovePressed: cur.shove && !prev.shove,
  };
}

export function createTouch(root) {
  const state = emptyInput();
  const tapped = emptyInput();
  for (const btn of root.querySelectorAll('[data-act]')) {
    const act = btn.dataset.act;
    const on = (e) => {
      e.preventDefault();
      if (!state[act]) tapped[act] = true;
      state[act] = true;
      btn.classList.add('on');
    };
    const off = (e) => {
      e.preventDefault();
      state[act] = false;
      btn.classList.remove('on');
    };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointercancel', off);
    btn.addEventListener('pointerleave', off);
  }
  return {
    read() {
      const r = emptyInput();
      for (const k of ACTIONS) r[k] = state[k] || tapped[k];
      return r;
    },
    endStep() {
      for (const k of ACTIONS) tapped[k] = false;
    },
  };
}
