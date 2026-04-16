/**
 * Map markers: car image asset + status ring + rotation (front of SVG = north).
 */

const CAR_SRC = `${import.meta.env.BASE_URL}markers/car-top.svg`;

const STATUS = {
  moving: { fill: '#2563eb', glow: 'rgba(37, 99, 235, 0.45)' },
  idle: { fill: '#d97706', glow: 'rgba(217, 119, 6, 0.42)' },
  stopped: { fill: '#64748b', glow: 'rgba(100, 116, 139, 0.38)' },
  offline: { fill: '#475569', glow: 'rgba(71, 85, 105, 0.35)' },
  alert: { fill: '#dc2626', glow: 'rgba(220, 38, 38, 0.45)' },
  maintenance: { fill: '#94a3b8', glow: 'rgba(148, 163, 184, 0.35)' },
};

function ringShadow(selected) {
  return selected
    ? '0 0 0 3px rgba(37, 99, 235, 0.95), 0 4px 16px rgba(0,0,0,0.35)'
    : '0 2px 10px rgba(0,0,0,0.3)';
}

function resolveStatus(vehicle) {
  const s = vehicle?.status;
  return s && STATUS[s] ? s : 'stopped';
}

function labelInitial(name) {
  const s = name != null ? String(name) : '';
  return s.trim() ? s.trim().slice(0, 2).toUpperCase() : '?';
}

export function carInnerHtml(vehicle) {
  const initial = labelInitial(vehicle?.name);

  return `
    <div class="fleet-car-icon-wrap" style="
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
      pointer-events:none;
    ">
      <div class="fleet-car-img-shell" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
        <img
          src="${CAR_SRC}"
          width="44"
          height="44"
          alt=""
          draggable="false"
          style="width:44px;height:44px;object-fit:contain;display:block;user-select:none;-webkit-user-drag:none;"
        />
      </div>
      <span style="
        font-size:9px;font-weight:800;color:#0f172a;text-shadow:0 1px 0 #fff,0 0 6px rgba(255,255,255,0.9);
        letter-spacing:0.02em;font-family:system-ui,sans-serif;line-height:1;
      ">${initial}</span>
    </div>
  `;
}

export function createCarMarkerElement({ vehicle, selected, onClick }) {
  const status = resolveStatus(vehicle);
  const c = STATUS[status];
  const course = Number(vehicle?.course);
  const rot = Number.isFinite(course) ? course : 0;

  const root = document.createElement('div');
  root.className = 'fleet-map-marker-root';
  root.style.cssText = 'cursor:pointer;z-index:1;';
  root.dataset.selected = selected ? '1' : '0';

  const ring = document.createElement('div');
  ring.className = 'fleet-marker-ring';
  ring.style.cssText = `
    position:absolute;width:58px;height:58px;left:50%;top:50%;margin:-29px 0 0 -29px;
    border-radius:50%;
    background:radial-gradient(circle, ${c.glow} 0%, transparent 70%);
    opacity:${status === 'moving' ? 0.88 : 0.5};
    pointer-events:none;
    transition:opacity 0.2s;
  `;

  const inner = document.createElement('div');
  inner.className = 'fleet-car-marker';
  inner.style.cssText = `
    width:52px;min-height:56px;display:flex;align-items:center;justify-content:center;
    position:relative;transform:rotate(${rot}deg);
    filter:drop-shadow(${ringShadow(selected)});
  `;
  inner.innerHTML = carInnerHtml(vehicle);

  root.appendChild(ring);
  root.appendChild(inner);

  root.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick?.();
  });

  return root;
}

export function updateCarMarkerElement(root, vehicle, selected) {
  if (!root) return;
  const inner = root.querySelector('.fleet-car-marker');
  const ring = root.querySelector('.fleet-marker-ring');
  const status = resolveStatus(vehicle);
  const c = STATUS[status];
  const course = Number(vehicle?.course);
  const rot = Number.isFinite(course) ? course : 0;

  root.dataset.selected = selected ? '1' : '0';
  root.style.zIndex = selected ? '10' : '1';

  if (inner) {
    inner.style.transform = `rotate(${rot}deg)`;
    inner.style.filter = `drop-shadow(${ringShadow(selected)})`;
    inner.innerHTML = carInnerHtml(vehicle);
  }
  if (ring) {
    ring.style.background = `radial-gradient(circle, ${c.glow} 0%, transparent 70%)`;
    ring.style.opacity = status === 'moving' ? '0.88' : '0.5';
  }
}
