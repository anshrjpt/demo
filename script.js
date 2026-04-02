// ================================================================
// THREE.JS — Animated Particle Sphere + Connecting Lines
// ================================================================

const canvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

camera.position.z = 5;

// -- Particle Sphere --
const particleCount = 600;
const radius = 2.8;
const positions = new Float32Array(particleCount * 3);
const velocities = [];

for (let i = 0; i < particleCount; i++) {
    // Fibonacci sphere distribution
    const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    velocities.push({
        x: (Math.random() - 0.5) * 0.002,
        y: (Math.random() - 0.5) * 0.002,
        z: (Math.random() - 0.5) * 0.002
    });
}

const particleGeometry = new THREE.BufferGeometry();
particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particleMaterial = new THREE.PointsMaterial({
    color: 0xFF4500,
    size: 0.025,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const particleMesh = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleMesh);

// -- Connection Lines --
const lineGeometry = new THREE.BufferGeometry();
const maxLines = 1500;
const linePositions = new Float32Array(maxLines * 6);
const lineColors = new Float32Array(maxLines * 6);
lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
scene.add(lineMesh);

// -- Ambient Floating Particles (Background) --
const bgCount = 200;
const bgPositions = new Float32Array(bgCount * 3);
const bgVelocities = [];

for (let i = 0; i < bgCount; i++) {
    bgPositions[i * 3] = (Math.random() - 0.5) * 20;
    bgPositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    bgPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    bgVelocities.push({
        x: (Math.random() - 0.5) * 0.005,
        y: (Math.random() - 0.5) * 0.005,
        z: (Math.random() - 0.5) * 0.002
    });
}

const bgGeometry = new THREE.BufferGeometry();
bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));

const bgMaterial = new THREE.PointsMaterial({
    color: 0xFF4500,
    size: 0.015,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const bgMesh = new THREE.Points(bgGeometry, bgMaterial);
scene.add(bgMesh);

// -- Mouse interaction --
const mouse = { x: 0, y: 0 };
document.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// -- Animation Clock --
const clock = new THREE.Clock();

function updateLines() {
    const pos = particleGeometry.attributes.position.array;
    let lineIndex = 0;
    const maxDist = 0.9;

    for (let i = 0; i < particleCount && lineIndex < maxLines; i++) {
        for (let j = i + 1; j < particleCount && lineIndex < maxLines; j++) {
            const dx = pos[i * 3] - pos[j * 3];
            const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
            const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < maxDist) {
                const alpha = 1 - dist / maxDist;
                const idx = lineIndex * 6;

                linePositions[idx] = pos[i * 3];
                linePositions[idx + 1] = pos[i * 3 + 1];
                linePositions[idx + 2] = pos[i * 3 + 2];
                linePositions[idx + 3] = pos[j * 3];
                linePositions[idx + 4] = pos[j * 3 + 1];
                linePositions[idx + 5] = pos[j * 3 + 2];

                // Orange color with falloff
                lineColors[idx] = 1 * alpha;
                lineColors[idx + 1] = 0.27 * alpha;
                lineColors[idx + 2] = 0 * alpha;
                lineColors[idx + 3] = 1 * alpha;
                lineColors[idx + 4] = 0.27 * alpha;
                lineColors[idx + 5] = 0 * alpha;

                lineIndex++;
            }
        }
    }

    // Clear remaining
    for (let i = lineIndex * 6; i < maxLines * 6; i++) {
        linePositions[i] = 0;
        lineColors[i] = 0;
    }

    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.color.needsUpdate = true;
    lineGeometry.setDrawRange(0, lineIndex * 2);
}

function animate() {
    const elapsed = clock.getElapsedTime();
    const delta = clock.getDelta();

    // Rotate main sphere
    particleMesh.rotation.y = elapsed * 0.08;
    particleMesh.rotation.x = Math.sin(elapsed * 0.05) * 0.2;

    // Mouse influence
    particleMesh.rotation.y += mouse.x * 0.02;
    particleMesh.rotation.x += mouse.y * 0.02;

    // Breathe effect
    const breathe = 1 + Math.sin(elapsed * 0.5) * 0.05;
    particleMesh.scale.set(breathe, breathe, breathe);

    // Subtle individual drift
    const pos = particleGeometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        pos[i * 3] += velocities[i].x;
        pos[i * 3 + 1] += velocities[i].y;
        pos[i * 3 + 2] += velocities[i].z;

        // Pull back toward sphere surface
        const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
        const dist = Math.sqrt(x * x + y * y + z * z);
        const pull = 0.001;
        pos[i * 3] -= (x / dist) * (dist - radius) * pull;
        pos[i * 3 + 1] -= (y / dist) * (dist - radius) * pull;
        pos[i * 3 + 2] -= (z / dist) * (dist - radius) * pull;
    }
    particleGeometry.attributes.position.needsUpdate = true;

    // Update connections
    updateLines();
    lineMesh.rotation.copy(particleMesh.rotation);
    lineMesh.scale.copy(particleMesh.scale);

    // Background particles drift
    const bgPos = bgGeometry.attributes.position.array;
    for (let i = 0; i < bgCount; i++) {
        bgPos[i * 3] += bgVelocities[i].x;
        bgPos[i * 3 + 1] += bgVelocities[i].y;
        bgPos[i * 3 + 2] += bgVelocities[i].z;

        // Wrap around
        if (Math.abs(bgPos[i * 3]) > 10) bgPos[i * 3] *= -0.9;
        if (Math.abs(bgPos[i * 3 + 1]) > 10) bgPos[i * 3 + 1] *= -0.9;
    }
    bgGeometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ================================================================
// CUSTOM CURSOR
// ================================================================

const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
let curX = 0, curY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', (e) => {
    curX = e.clientX;
    curY = e.clientY;
    cursorDot.style.left = curX + 'px';
    cursorDot.style.top = curY + 'px';
});

function animateCursor() {
    ringX += (curX - ringX) * 0.15;
    ringY += (curY - ringY) * 0.15;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
    requestAnimationFrame(animateCursor);
}
animateCursor();

// Hover effect on interactive elements
document.querySelectorAll('a, button, .project-card-accent, .project-card-dark, .skill-card, .contact-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
});

// ================================================================
// REVEAL ON SCROLL (Intersection Observer)
// ================================================================

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ================================================================
// NAVBAR SCROLL
// ================================================================

const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
});

// ================================================================
// PARALLAX CARDS
// ================================================================

window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    document.querySelectorAll('.parallax-card-up').forEach(el => {
        el.style.setProperty('--scroll-offset-up', `${scrolled * -0.04}px`);
    });
    document.querySelectorAll('.parallax-card-down').forEach(el => {
        el.style.setProperty('--scroll-offset-down', `${scrolled * 0.04}px`);
    });
});

// ================================================================
// HERO PARALLAX
// ================================================================

const heroWrapper = document.getElementById('hero-content-wrapper');
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (scrolled < 1000) {
        heroWrapper.style.transform = `translateY(${scrolled * 0.35}px)`;
        heroWrapper.style.opacity = Math.max(0, 1 - scrolled / 700);
    }
});

// ================================================================
// ROLE CAROUSEL
// ================================================================

const roles = document.querySelectorAll('.role-item');
let currentRole = 0;

setInterval(() => {
    roles[currentRole].classList.remove('active');
    currentRole = (currentRole + 1) % roles.length;
    roles[currentRole].classList.add('active');
}, 2500);

// ================================================================
// ANIMATED STAT COUNTERS
// ================================================================

function animateCounters() {
    document.querySelectorAll('.stat-num').forEach(counter => {
        const target = parseInt(counter.dataset.count);
        const duration = 2000;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.floor(target * eased);
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            statsObserver.disconnect();
        }
    });
}, { threshold: 0.5 });

const statsEl = document.querySelector('.hero-stats');
if (statsEl) statsObserver.observe(statsEl);

// ================================================================
// LIVE CLOCK
// ================================================================

function updateTime() {
    const el = document.getElementById('current-time');
    if (!el) return;
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    el.textContent = `${hours}:${minutes} ${ampm}`;
}
setInterval(updateTime, 30000);
updateTime();

// ================================================================
// ACTIVE NAV LINK
// ================================================================

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const top = section.offsetTop - 200;
        if (scrollY >= top) current = section.getAttribute('id');
    });
    navLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === `#${current}`) {
            link.style.color = '#FF4500';
        }
    });
});

// ================================================================
// SMOKE BACKGROUND (WebGL2 Shader — ported from React component)
// ================================================================

const smokeFragmentShader = `#version 300 es
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec3 u_color;

#define FC gl_FragCoord.xy
#define R resolution
#define T (time+660.)

float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);return mix(mix(rnd(i),rnd(i+vec2(1,0)),u.x),mix(rnd(i+vec2(0,1)),rnd(i+1.),u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;for(int i=0;i<5;i++){t+=a*noise(p);p*=mat2(1,-1.2,.2,1.2)*2.;a*=.5;}return t;}

void main(){
  vec2 uv=(FC-.5*R)/R.y;
  vec3 col=vec3(1);
  uv.x+=.25;
  uv*=vec2(2,1);
  float n=fbm(uv*.28-vec2(T*.01,0));
  n=noise(uv*3.+n*2.);
  col.r-=fbm(uv+vec2(0,T*.015)+n);
  col.g-=fbm(uv*1.003+vec2(0,T*.015)+n+.003);
  col.b-=fbm(uv*1.006+vec2(0,T*.015)+n+.006);
  col=mix(col, u_color, dot(col,vec3(.21,.71,.07)));
  col=mix(vec3(.03),col,min(time*.1,1.));
  col=clamp(col,.03,1.);
  O=vec4(col,1);
}`;

const smokeVertexShader = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

class SmokeRenderer {
    constructor(canvas, hexColor) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl2');
        if (!this.gl) return;
        this.color = this.hexToRgb(hexColor);
        this.program = null;
        this.setup();
        this.init();
    }

    hexToRgb(hex) {
        const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return r ? [parseInt(r[1],16)/255, parseInt(r[2],16)/255, parseInt(r[3],16)/255] : [0.5,0.5,0.5];
    }

    compile(shader, source) {
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
    }

    setup() {
        const gl = this.gl;
        this.vs = gl.createShader(gl.VERTEX_SHADER);
        this.fs = gl.createShader(gl.FRAGMENT_SHADER);
        this.compile(this.vs, smokeVertexShader);
        this.compile(this.fs, smokeFragmentShader);
        this.program = gl.createProgram();
        gl.attachShader(this.program, this.vs);
        gl.attachShader(this.program, this.fs);
        gl.linkProgram(this.program);
    }

    init() {
        const gl = this.gl;
        const p = this.program;
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,-1,-1,1,1,1,-1]), gl.STATIC_DRAW);
        const pos = gl.getAttribLocation(p, 'position');
        gl.enableVertexAttribArray(pos);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
        this.uRes = gl.getUniformLocation(p, 'resolution');
        this.uTime = gl.getUniformLocation(p, 'time');
        this.uColor = gl.getUniformLocation(p, 'u_color');
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio, 1.5);
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    render(now) {
        const gl = this.gl;
        if (!this.program) return;
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.uniform2f(this.uRes, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.uTime, now * 1e-3);
        gl.uniform3fv(this.uColor, this.color);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    destroy() {
        const gl = this.gl;
        if (this.vs) { gl.detachShader(this.program, this.vs); gl.deleteShader(this.vs); }
        if (this.fs) { gl.detachShader(this.program, this.fs); gl.deleteShader(this.fs); }
        if (this.program) gl.deleteProgram(this.program);
    }
}

// Initialize smoke on all .smoke-canvas elements
const smokeRenderers = [];

document.querySelectorAll('.smoke-canvas').forEach(c => {
    const color = c.dataset.smokeColor || '#808080';
    const r = new SmokeRenderer(c, color);
    if (r.gl) {
        r.resize();
        smokeRenderers.push(r);
    }
});

window.addEventListener('resize', () => {
    smokeRenderers.forEach(r => r.resize());
});

// Only animate smoke canvases when they are near the viewport
function animateSmoke(now) {
    smokeRenderers.forEach(r => {
        const rect = r.canvas.getBoundingClientRect();
        // Render if section is anywhere near the viewport
        if (rect.bottom > -200 && rect.top < window.innerHeight + 200) {
            r.render(now);
        }
    });
    requestAnimationFrame(animateSmoke);
}
requestAnimationFrame(animateSmoke);
