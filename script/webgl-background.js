/**
 * Modern WebGL Background - Neural Network / Mesh Gradient Effect
 * Creates an elegant, interactive background perfect for a tech portfolio
 */

class NeuralMeshBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.gl = this.canvas.getContext('webgl', { alpha: true, antialias: true })
            || this.canvas.getContext('experimental-webgl', { alpha: true, antialias: true });

        if (!this.gl) {
            console.warn('WebGL not supported, falling back to CSS gradient');
            this.canvas.style.background = 'linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #104041 100%)';
            return;
        }

        this.mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
        this.time = 0;
        this.nodeCount = 40; // Reduced from 80 for performance
        this.nodes = [];
        this.connections = [];
        this.isInitialized = false;
        this.isPaused = false;

        this.init();
    }

    init() {
        this.resize();
        this.createNodes();
        this.createShaders();
        this.setupBuffers();
        this.setupEventListeners();
        this.isInitialized = true;
        this.animate();
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio, 2);
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.aspect = this.canvas.width / this.canvas.height;
    }

    createNodes() {
        this.nodes = [];
        for (let i = 0; i < this.nodeCount; i++) {
            this.nodes.push({
                x: Math.random(),
                y: Math.random(),
                vx: (Math.random() - 0.5) * 0.0003,
                vy: (Math.random() - 0.5) * 0.0003,
                size: Math.random() * 3 + 1.5,
                phase: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.5 + 0.5
            });
        }
    }

    createShaders() {
        // Background gradient shader
        const bgVertexShader = `
            attribute vec2 a_position;
            varying vec2 v_uv;
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        const bgFragmentShader = `
            precision highp float;
            varying vec2 v_uv;
            uniform float u_time;
            uniform vec2 u_mouse;
            uniform vec2 u_resolution;

            // Simplex noise function
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                                   -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy));
                vec2 x0 = v - i + dot(i, C.xx);
                vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod289(i);
                vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                                        + i.x + vec3(0.0, i1.x, 1.0));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                                        dot(x12.zw,x12.zw)), 0.0);
                m = m*m;
                m = m*m;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                vec3 g;
                g.x = a0.x * x0.x + h.x * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            void main() {
                vec2 uv = v_uv;

                // Color palette - deep tech blues and teals
                vec3 color1 = vec3(0.039, 0.086, 0.157);  // Deep navy #0a1628
                vec3 color2 = vec3(0.063, 0.176, 0.290);  // Dark blue #102d4a
                vec3 color3 = vec3(0.063, 0.251, 0.255);  // Teal #104041
                vec3 color4 = vec3(0.106, 0.306, 0.365);  // Lighter teal #1b4e5d

                // Flowing noise for organic movement
                float noise1 = snoise(uv * 2.0 + u_time * 0.05);
                float noise2 = snoise(uv * 3.0 - u_time * 0.03 + 10.0);
                float noise3 = snoise(uv * 1.5 + u_time * 0.02 + vec2(noise1 * 0.5));

                // Mouse influence - subtle wave from cursor
                float mouseDist = length(uv - u_mouse);
                float mouseInfluence = smoothstep(0.5, 0.0, mouseDist) * 0.15;

                // Create flowing gradient
                float t = uv.y + noise1 * 0.2 + noise2 * 0.15 + mouseInfluence;
                t = clamp(t, 0.0, 1.0);

                // Multi-stop gradient
                vec3 color;
                if (t < 0.33) {
                    color = mix(color1, color2, t * 3.0);
                } else if (t < 0.66) {
                    color = mix(color2, color3, (t - 0.33) * 3.0);
                } else {
                    color = mix(color3, color4, (t - 0.66) * 3.0);
                }

                // Add subtle shimmer
                float shimmer = snoise(uv * 8.0 + u_time * 0.1) * 0.02;
                color += shimmer;

                // Vignette effect
                float vignette = 1.0 - smoothstep(0.4, 1.4, length(uv - 0.5) * 1.2);
                color *= 0.85 + vignette * 0.15;

                gl_FragColor = vec4(color, 1.0);
            }
        `;

        // Node/connection shader
        const nodeVertexShader = `
            attribute vec2 a_position;
            attribute float a_size;
            attribute float a_alpha;
            uniform vec2 u_resolution;
            varying float v_alpha;

            void main() {
                vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0.0, 1.0);
                gl_PointSize = a_size;
                v_alpha = a_alpha;
            }
        `;

        const nodeFragmentShader = `
            precision mediump float;
            varying float v_alpha;

            void main() {
                vec2 center = gl_PointCoord - 0.5;
                float dist = length(center);
                float alpha = smoothstep(0.5, 0.2, dist) * v_alpha;

                // Glowing core
                float glow = exp(-dist * 4.0) * 0.6;
                vec3 color = vec3(0.4, 0.8, 0.85); // Cyan-ish

                gl_FragColor = vec4(color, (alpha + glow * v_alpha) * 0.7);
            }
        `;

        // Line shader for connections
        const lineVertexShader = `
            attribute vec2 a_position;
            attribute float a_alpha;
            uniform vec2 u_resolution;
            varying float v_alpha;

            void main() {
                vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0.0, 1.0);
                v_alpha = a_alpha;
            }
        `;

        const lineFragmentShader = `
            precision mediump float;
            varying float v_alpha;

            void main() {
                vec3 color = vec3(0.3, 0.7, 0.75);
                gl_FragColor = vec4(color, v_alpha * 0.3);
            }
        `;

        this.bgProgram = this.createProgram(bgVertexShader, bgFragmentShader);
        this.nodeProgram = this.createProgram(nodeVertexShader, nodeFragmentShader);
        this.lineProgram = this.createProgram(lineVertexShader, lineFragmentShader);

        // Get locations
        this.bgLocations = {
            position: this.gl.getAttribLocation(this.bgProgram, 'a_position'),
            time: this.gl.getUniformLocation(this.bgProgram, 'u_time'),
            mouse: this.gl.getUniformLocation(this.bgProgram, 'u_mouse'),
            resolution: this.gl.getUniformLocation(this.bgProgram, 'u_resolution')
        };

        this.nodeLocations = {
            position: this.gl.getAttribLocation(this.nodeProgram, 'a_position'),
            size: this.gl.getAttribLocation(this.nodeProgram, 'a_size'),
            alpha: this.gl.getAttribLocation(this.nodeProgram, 'a_alpha'),
            resolution: this.gl.getUniformLocation(this.nodeProgram, 'u_resolution')
        };

        this.lineLocations = {
            position: this.gl.getAttribLocation(this.lineProgram, 'a_position'),
            alpha: this.gl.getAttribLocation(this.lineProgram, 'a_alpha'),
            resolution: this.gl.getUniformLocation(this.lineProgram, 'u_resolution')
        };
    }

    createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        return program;
    }

    setupBuffers() {
        const gl = this.gl;

        // Fullscreen quad for background
        this.bgBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bgBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1
        ]), gl.STATIC_DRAW);

        // Dynamic buffers for nodes
        this.nodePositionBuffer = gl.createBuffer();
        this.nodeSizeBuffer = gl.createBuffer();
        this.nodeAlphaBuffer = gl.createBuffer();

        // Dynamic buffer for lines
        this.linePositionBuffer = gl.createBuffer();
        this.lineAlphaBuffer = gl.createBuffer();
    }

    setupEventListeners() {
        document.addEventListener('mousemove', (e) => {
            this.mouse.targetX = e.clientX / window.innerWidth;
            this.mouse.targetY = e.clientY / window.innerHeight;
        });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouse.targetX = e.touches[0].clientX / window.innerWidth;
                this.mouse.targetY = e.touches[0].clientY / window.innerHeight;
            }
        }, { passive: true });

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resize();
            }, 150);
        });

        document.addEventListener('visibilitychange', () => {
            this.isPaused = document.hidden;
            if (!this.isPaused) this.animate();
        });
    }

    updateNodes() {
        const connectionDistance = 0.15;
        this.connections = [];

        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];

            // Gentle floating movement
            node.x += node.vx + Math.sin(this.time * node.speed + node.phase) * 0.0002;
            node.y += node.vy + Math.cos(this.time * node.speed * 0.7 + node.phase) * 0.0002;

            // Mouse attraction (subtle)
            const dx = this.mouse.x - node.x;
            const dy = this.mouse.y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.3) {
                const force = (0.3 - dist) * 0.0001;
                node.x += dx * force;
                node.y += dy * force;
            }

            // Wrap around edges
            if (node.x < -0.05) node.x = 1.05;
            if (node.x > 1.05) node.x = -0.05;
            if (node.y < -0.05) node.y = 1.05;
            if (node.y > 1.05) node.y = -0.05;

            // Find connections
            for (let j = i + 1; j < this.nodes.length; j++) {
                const other = this.nodes[j];
                const cdx = node.x - other.x;
                const cdy = node.y - other.y;
                const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

                if (cdist < connectionDistance) {
                    this.connections.push({
                        x1: node.x, y1: node.y,
                        x2: other.x, y2: other.y,
                        alpha: 1 - (cdist / connectionDistance)
                    });
                }
            }
        }
    }

    render() {
        const gl = this.gl;

        // Smooth mouse movement
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // 1. Draw background gradient
        gl.useProgram(this.bgProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bgBuffer);
        gl.enableVertexAttribArray(this.bgLocations.position);
        gl.vertexAttribPointer(this.bgLocations.position, 2, gl.FLOAT, false, 0, 0);
        gl.uniform1f(this.bgLocations.time, this.time);
        gl.uniform2f(this.bgLocations.mouse, this.mouse.x, this.mouse.y);
        gl.uniform2f(this.bgLocations.resolution, this.canvas.width, this.canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // 2. Draw connections
        if (this.connections.length > 0) {
            const linePositions = [];
            const lineAlphas = [];

            for (const conn of this.connections) {
                linePositions.push(
                    conn.x1 * this.canvas.width, conn.y1 * this.canvas.height,
                    conn.x2 * this.canvas.width, conn.y2 * this.canvas.height
                );
                lineAlphas.push(conn.alpha, conn.alpha);
            }

            gl.useProgram(this.lineProgram);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.linePositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(linePositions), gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(this.lineLocations.position);
            gl.vertexAttribPointer(this.lineLocations.position, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.lineAlphaBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineAlphas), gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(this.lineLocations.alpha);
            gl.vertexAttribPointer(this.lineLocations.alpha, 1, gl.FLOAT, false, 0, 0);

            gl.uniform2f(this.lineLocations.resolution, this.canvas.width, this.canvas.height);
            gl.drawArrays(gl.LINES, 0, this.connections.length * 2);
        }

        // 3. Draw nodes
        const positions = [];
        const sizes = [];
        const alphas = [];

        for (const node of this.nodes) {
            positions.push(node.x * this.canvas.width, node.y * this.canvas.height);

            // Pulsing size
            const pulse = Math.sin(this.time * 2 + node.phase) * 0.3 + 1;
            sizes.push(node.size * pulse * (window.devicePixelRatio || 1));

            // Distance from mouse affects brightness
            const mdx = this.mouse.x - node.x;
            const mdy = this.mouse.y - node.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            const brightness = 0.4 + Math.max(0, 0.6 - mdist * 2);
            alphas.push(brightness);
        }

        gl.useProgram(this.nodeProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.nodePositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.nodeLocations.position);
        gl.vertexAttribPointer(this.nodeLocations.position, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.nodeSizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.nodeLocations.size);
        gl.vertexAttribPointer(this.nodeLocations.size, 1, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.nodeAlphaBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.nodeLocations.alpha);
        gl.vertexAttribPointer(this.nodeLocations.alpha, 1, gl.FLOAT, false, 0, 0);

        gl.uniform2f(this.nodeLocations.resolution, this.canvas.width, this.canvas.height);
        gl.drawArrays(gl.POINTS, 0, this.nodes.length);
    }

    animate() {
        if (!this.isInitialized || this.isPaused) return;

        this.time += 0.016;
        this.updateNodes();
        this.render();

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        new NeuralMeshBackground('webgl-bg');
    }, 100);
});