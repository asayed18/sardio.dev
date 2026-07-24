(() => {
  const page = document.getElementById('v13Page');
  const hero = document.getElementById('hero');
  const rig = document.getElementById('v13Rig');
  const lamp = document.getElementById('v13Lamp');
  const veil = document.getElementById('v13AmbientVeil');
  const relief = document.querySelector('.v13-relief');
  const reliefGrid = document.getElementById('v13ReliefGrid');
  if (!page || !hero || !rig || !lamp || !veil || !relief || !reliefGrid || lamp.dataset.ready) return;
  lamp.dataset.ready = 'true';

  const reliefConfig = {"x":712,"y":142,"cols":13,"rows":9,"cell":56,"tiles":[[2,0,4],[7,0,8],[0,1,4],[2,1,8],[3,1,4],[7,1,16],[10,1,8],[11,1,4],[0,2,8],[1,2,4],[3,2,16],[4,2,8],[7,2,8],[8,2,4],[11,2,16],[0,3,4],[2,3,8],[3,3,16],[4,3,16],[5,3,8],[8,3,8],[10,3,4],[12,3,8],[1,4,4],[2,4,16],[4,4,8],[5,4,16],[7,4,4],[10,4,16],[11,4,8],[0,5,4],[2,5,8],[3,5,16],[6,5,8],[7,5,16],[11,5,4],[1,6,8],[3,6,4],[6,6,16],[9,6,8],[2,7,4],[5,7,8],[9,7,4],[5,8,4]]};
  const projectShadow = (height, axisX, axisY, coneStrength) => { const exposure = Math.min(1, Math.max(0, coneStrength)); const contact = height === 0 ? 0 : 1 + height * .06; const reach = height === 0 ? 0 : (2 + height * .72) * exposure; return { x: axisX * reach, y: contact + axisY * reach }; };
  const rotateCssDownVector = (radians, distance) => ({ x: -Math.sin(radians) * distance, y: Math.cos(radians) * distance });
  const computeFixedLightGeometry = (anchorX, anchorY, radians) => { const axis = rotateCssDownVector(radians, 1); return { lightX: anchorX, lightY: anchorY, axisX: axis.x, axisY: axis.y }; };
  const computeViewportLightGeometry = (lampRect, heroRect, scaleX, scaleY, radians) => { const axis = rotateCssDownVector(radians, 1); return { lightX: (lampRect.left + lampRect.width / 2 - heroRect.left) * scaleX, lightY: (lampRect.top + lampRect.height / 2 - heroRect.top) * scaleY, axisX: axis.x, axisY: axis.y }; };
  const mapCssAxisToScene = (axisX, axisY, scaleX, scaleY) => { const scaledX = axisX * scaleX; const scaledY = axisY * scaleY; const length = Math.hypot(scaledX, scaledY) || 1; return { x: scaledX / length, y: scaledY / length }; };
  const computeConeStrength = (pointX, pointY, lightX, lightY, axisX, axisY, coneEdge) => { const dx = pointX - lightX; const dy = pointY - lightY; const distance = Math.hypot(dx, dy) || 1; const coneDot = (dx * axisX + dy * axisY) / distance; return Math.min(1, Math.max(0, (coneDot - coneEdge) / (1 - coneEdge))); };
  const computeBeamRotation = (axisX, axisY) => axisX === 0 ? 0 : Math.atan2(-axisX, axisY) * 180 / Math.PI;
  const projectTextShadow = (centerX, centerY, lightX, lightY, exposure) => ({ x: (centerX - lightX) / (Math.hypot(centerX - lightX, centerY - lightY) || 1) * (6 + exposure * 12), y: (centerY - lightY) / (Math.hypot(centerX - lightX, centerY - lightY) || 1) * (6 + exposure * 12) });
  const computeRectConeStrength = (left, top, width, height, lightX, lightY, axisX, axisY, coneEdge) => Math.max(...[.12, .5, .88].map((fraction) => computeConeStrength(left + width * fraction, top + height / 2, lightX, lightY, axisX, axisY, coneEdge)));
  const computeTextReach = (distance) => Math.min(1, Math.max(.48, 1 - Math.max(0, distance - 80) / 980));
  const computeShadowOpacity = (height, _distance) => Math.min(.72, .28 + height * .018);
  const resolveGestureOutcome = (moved, pull, cancelled) => cancelled ? { activate: false, suppressClick: false } : pull > 27 ? { activate: true, suppressClick: true } : { activate: false, suppressClick: moved };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const svgNS = 'http://www.w3.org/2000/svg';
  const swingMin = -15;
  const swingMax = 75;
  const swingCenter = 30;
  const swingAmplitude = 45;
  const tileNodes = [];
  const beamTextTargets = [...page.querySelectorAll('[data-beam-text]')].map((node) => ({
    node,
    response: Number(node.dataset.beamResponse || .4)
  }));
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let dragStartAngle = swingCenter;
  let angle = swingCenter;
  let pull = 0;
  let phase = 0;
  let lastTime = performance.now();
  let suppressClick = false;

  const createSvg = (name, className, attributes) => {
    const node = document.createElementNS(svgNS, name);
    node.setAttribute('class', className);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };

  const reliefLayers = new Map([4, 8, 16].map(height => {
    const shadowGroup = createSvg('g', `relief-shadow-layer relief-shadow-layer-${height}`, {'data-layer': height});
    const faceGroup = createSvg('g', `relief-face-layer relief-face-layer-${height}`, {'data-layer': height});
    reliefGrid.append(shadowGroup, faceGroup);
    return [height, {shadowGroup, faceGroup}];
  }));

  reliefConfig.tiles.forEach(([column, row, height]) => {
    const x = reliefConfig.x + column * reliefConfig.cell;
    const y = reliefConfig.y + row * reliefConfig.cell;
    const group = createSvg('g', 'relief-tile', {'data-height': height});
    const shadow = createSvg('rect', 'relief-shadow', {x: x + 1.5, y: y + 1.5, width: reliefConfig.cell - 3, height: reliefConfig.cell - 3, rx: 1});
    const face = createSvg('rect', 'relief-face', {x: x + .5, y: y + .5, width: reliefConfig.cell - 1, height: reliefConfig.cell - 1, rx: .75});
    const warmth = createSvg('rect', 'relief-warmth', {x: x + 1, y: y + 1, width: reliefConfig.cell - 2, height: reliefConfig.cell - 2, rx: .75});
    const highlight = createSvg('line', 'relief-highlight', {x1: x + 2, y1: y + 2, x2: x + reliefConfig.cell - 2, y2: y + 2});
    const layer = reliefLayers.get(height);
    group.append(face, warmth, highlight);
    layer.shadowGroup.append(shadow);
    layer.faceGroup.append(group);
    tileNodes.push({x, y, height, shadow, warmth, highlight});
  });

  const setLit = (lit) => {
    page.classList.toggle('is-lit', lit);
    lamp.setAttribute('aria-checked', String(lit));
    lamp.setAttribute('aria-label', lit ? 'Drag light control to turn off light theme' : 'Drag light control to turn on light theme');
  };
  const toggle = () => setLit(!page.classList.contains('is-lit'));

  const updateBeamGlyphLighting = (lightX, lightY, cssAxisX, cssAxisY, sceneAxisX, sceneAxisY, coneEdge, scaleX, scaleY, isLit) => {
    const pageRect = hero.getBoundingClientRect();
    const beamRotation = computeBeamRotation(cssAxisX, cssAxisY);
    beamTextTargets.forEach(({node, response}) => {
      const rect = node.getBoundingClientRect();
      const domLeft = rect.left - pageRect.left;
      const domTop = rect.top - pageRect.top;
      const left = domLeft * scaleX;
      const top = domTop * scaleY;
      const width = rect.width * scaleX;
      const height = rect.height * scaleY;
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const distance = Math.hypot(centerX - lightX, centerY - lightY);
      const angularStrength = computeRectConeStrength(left, top, width, height, lightX, lightY, sceneAxisX, sceneAxisY, coneEdge);
      const exposure = isLit ? 0 : angularStrength * computeTextReach(distance) * response;
      const shadow = projectTextShadow(centerX, centerY, lightX, lightY, exposure);
      node.style.setProperty('--beam-origin-x', `${(lightX / scaleX - domLeft).toFixed(2)}px`);
      node.style.setProperty('--beam-origin-y', `${(lightY / scaleY - domTop).toFixed(2)}px`);
      node.style.setProperty('--beam-rotation', `${beamRotation.toFixed(2)}deg`);
      node.style.setProperty('--beam-overlay-opacity', Math.min(1, exposure * 1.4).toFixed(3));
      node.style.setProperty('--beam-shadow-x', `${(shadow.x / scaleX).toFixed(2)}px`);
      node.style.setProperty('--beam-shadow-y', `${(shadow.y / scaleY).toFixed(2)}px`);
      node.style.setProperty('--beam-shadow-alpha', Math.min(.92, .58 + exposure * .36).toFixed(3));
    });
  };

  const updateReliefLighting = () => {
    const lampRect = lamp.getBoundingClientRect();
    const reliefRect = relief.getBoundingClientRect();
    const scaleX = 1440 / reliefRect.width;
    const scaleY = 690 / reliefRect.height;
    const radians = angle * Math.PI / 180;
    const geometry = computeViewportLightGeometry(lampRect, reliefRect, scaleX, scaleY, radians);
    const {lightX, lightY, axisX: cssAxisX, axisY: cssAxisY} = geometry;
    const sceneAxis = mapCssAxisToScene(cssAxisX, cssAxisY, scaleX, scaleY);
    const isLit = page.classList.contains('is-lit');
    const coneEdge = Math.cos((isLit ? 16 : 34) * Math.PI / 180);

    tileNodes.forEach(({x, y, height, shadow, warmth, highlight}) => {
      const centerX = x + reliefConfig.cell / 2;
      const centerY = y + reliefConfig.cell / 2;
      const distance = Math.hypot(centerX - lightX, centerY - lightY) || 1;
      const coneStrength = computeConeStrength(centerX, centerY, lightX, lightY, sceneAxis.x, sceneAxis.y, coneEdge);
      const projected = projectShadow(height, sceneAxis.x, sceneAxis.y, coneStrength);
      const blur = .8 + height * .16 + coneStrength * (isLit ? 2.4 : 1.3);
      const shadowOpacity = computeShadowOpacity(height, distance) * (isLit ? (.32 + coneStrength * .48) : (.45 + coneStrength * .55));

      shadow.setAttribute('transform', `translate(${projected.x.toFixed(2)} ${projected.y.toFixed(2)})`);
      shadow.style.filter = `blur(${blur.toFixed(2)}px)`;
      shadow.style.opacity = shadowOpacity.toFixed(2);
      warmth.style.opacity = (coneStrength * (isLit ? .18 : .13) * (height / 16)).toFixed(3);

      const towardX = lightX - centerX;
      const towardY = lightY - centerY;
      if (Math.abs(towardX) > Math.abs(towardY)) {
        const edgeX = towardX > 0 ? x + reliefConfig.cell - 2 : x + 2;
        highlight.setAttribute('x1', edgeX);
        highlight.setAttribute('y1', y + 2);
        highlight.setAttribute('x2', edgeX);
        highlight.setAttribute('y2', y + reliefConfig.cell - 2);
      } else {
        const edgeY = towardY > 0 ? y + reliefConfig.cell - 2 : y + 2;
        highlight.setAttribute('x1', x + 2);
        highlight.setAttribute('y1', edgeY);
        highlight.setAttribute('x2', x + reliefConfig.cell - 2);
        highlight.setAttribute('y2', edgeY);
      }
      highlight.style.opacity = (coneStrength * (isLit ? .7 : .34) + .08).toFixed(2);
    });
    const pageRect = page.getBoundingClientRect();
    const textLightX = lampRect.left + lampRect.width / 2 - pageRect.left;
    const textLightY = lampRect.top + lampRect.height / 2 - pageRect.top;
    updateBeamGlyphLighting(textLightX, textLightY, cssAxisX, cssAxisY, cssAxisX, cssAxisY, coneEdge, 1, 1, isLit);
  };

  function syncRigToLamp() {
    const rect = lamp.getBoundingClientRect();
    rig.style.left = `${rect.left + rect.width / 2 - 100}px`;
    rig.style.top = `${rect.top + rect.height / 2}px`;
    rig.style.right = 'auto';
    veil.style.setProperty('--veil-x', `${rect.left + rect.width / 2}px`);
    veil.style.setProperty('--veil-y', `${rect.top + rect.height / 2}px`);
    veil.style.setProperty('--veil-angle', `${angle}deg`);
  }

  const render = (time) => {
    const delta = Math.min(40, time - lastTime);
    lastTime = time;
    if (!dragging) {
      phase += delta * .00028;
      const target = swingCenter + Math.sin(phase) * swingAmplitude;
      angle += (target - angle) * .035;
      pull += (0 - pull) * .08;
    }
    syncRigToLamp();
    rig.style.transform = `rotate(${angle}deg)`;
    const shadowX = clamp(-angle * .62, -28, 28);
    page.style.setProperty('--shadow-x', `${shadowX}px`);
    page.style.setProperty('--shadow-wide', `${shadowX * 1.7}px`);
    updateReliefLighting();
    requestAnimationFrame(render);
  };

  lamp.addEventListener('pointerdown', (event) => {
    dragging = true;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;
    dragStartAngle = angle;
    lamp.setPointerCapture(event.pointerId);
  });
  lamp.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    angle = clamp(dragStartAngle + dx / 3.5, swingMin, swingMax);
    pull = clamp(dy, 0, 48);
    moved = moved || Math.abs(dx) > 4 || Math.abs(dy) > 4;
  });
  const finishGesture = (event, cancelled) => {
    if (!dragging) return;
    dragging = false;
    if (lamp.hasPointerCapture(event.pointerId)) lamp.releasePointerCapture(event.pointerId);
    const outcome = resolveGestureOutcome(moved, pull, cancelled);
    if (outcome.suppressClick) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
    }
    if (outcome.activate) toggle();
    phase = Math.asin(clamp((angle - swingCenter) / swingAmplitude, -1, 1));
  };
  lamp.addEventListener('pointerup', (event) => {
    finishGesture(event, false);
  });
  lamp.addEventListener('pointercancel', (event) => {
    finishGesture(event, true);
  });
  lamp.addEventListener('lostpointercapture', (event) => {
    finishGesture(event, true);
  });
  lamp.addEventListener('click', () => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    toggle();
  });
  requestAnimationFrame(render);
})();

(() => {
  const menuButton = document.getElementById('v13MenuButton');
  const menu = document.getElementById('v13SiteMenu');
  const navLinks = [...document.querySelectorAll('[data-nav-link]')];
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const form = document.getElementById('waitlistForm');
  const status = document.getElementById('waitlistStatus');
  const year = document.getElementById('v13Year');
  if (year) year.textContent = String(new Date().getFullYear());

  function setActiveSection(id) {
    navLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function setMenuOpen(open) {
    if (!menu || !menuButton) return;
    menu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }

  navLinks.forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));
  menuButton?.addEventListener('click', () => setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenuOpen(false);
      menuButton?.focus();
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (menu?.classList.contains('is-open') && !menu.contains(event.target) && !menuButton?.contains(event.target)) setMenuOpen(false);
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, {rootMargin: '-22% 0px -62% 0px', threshold: [0, .15, .4]});
    sections.forEach((section) => observer.observe(section));
  }

  function handleWaitlistSubmit(event) {
    event.preventDefault();
    if (!form || !status) return;
    if (!form.checkValidity()) {
      status.textContent = 'Please enter a valid email address.';
      form.reportValidity();
      return;
    }
    const email = document.getElementById('waitlistEmail')?.value.trim();
    status.textContent = `Thank you${email ? `, ${email}` : ''}. Your interest is saved only in this page preview; connect a backend before launch.`;
    form.reset();
  }

  form?.addEventListener('submit', handleWaitlistSubmit);
})();
