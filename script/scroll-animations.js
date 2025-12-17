/**
 * Scroll Animations & Resume WebGL Background
 * Smooth reveal animations and subtle wave effect
 */

// ============================================
// SCROLL ANIMATIONS
// ============================================

class ScrollAnimations {
    constructor() {
        this.animatedElements = [];
        this.init();
    }

    init() {
        this.setupAnimatedElements();
        this.createObserver();
        this.addScrollProgress();
    }

    setupAnimatedElements() {
        // Add animation classes to elements
        const selectors = [
            '.about-me',
            '.langage-skills',
            '.hobbies-interests',
            '.skills-habilities',
            '.education-jobs',
            '.award',
            '.project-item',
            '.timeline-event',
            '.skills-bar'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach((el, index) => {
                el.classList.add('scroll-animate');
                el.style.setProperty('--animation-delay', `${index * 0.1}s`);
                this.animatedElements.push(el);
            });
        });

        // Special stagger for grid items
        document.querySelectorAll('.project-items .project-item').forEach((el, index) => {
            el.style.setProperty('--animation-delay', `${index * 0.15}s`);
        });

        document.querySelectorAll('.timeline-event').forEach((el, index) => {
            el.style.setProperty('--animation-delay', `${index * 0.1}s`);
        });
    }

    createObserver() {
        const options = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    // Optional: unobserve after animation
                    // this.observer.unobserve(entry.target);
                }
            });
        }, options);

        this.animatedElements.forEach(el => this.observer.observe(el));
    }

    addScrollProgress() {
        // Create scroll progress indicator
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = `${progress}%`;
        }, { passive: true });
    }
}


// ============================================
// COUNTER ANIMATIONS
// ============================================

class CounterAnimation {
    constructor() {
        this.init();
    }

    init() {
        // Animate skill bar percentages
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bar = entry.target.querySelector('span');
                    if (bar) {
                        bar.style.width = bar.parentElement.classList.contains('pharo') ||
                                         bar.parentElement.classList.contains('mysql') ||
                                         bar.parentElement.classList.contains('ci') ||
                                         bar.parentElement.classList.contains('french') ? '95%' :
                                         bar.parentElement.classList.contains('analysis') ? '85%' :
                                         bar.parentElement.classList.contains('java') ||
                                         bar.parentElement.classList.contains('english') ? '80%' :
                                         bar.parentElement.classList.contains('html') ? '70%' :
                                         bar.parentElement.classList.contains('angular') ||
                                         bar.parentElement.classList.contains('flutter') ? '60%' :
                                         bar.parentElement.classList.contains('docker') ? '40%' : '0%';
                    }
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.progressbar-line').forEach(el => {
            const span = el.querySelector('span');
            if (span) {
                span.style.width = '0%';
                span.style.transition = 'width 1s ease-out';
            }
            observer.observe(el);
        });
    }
}


// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize scroll animations
    new ScrollAnimations();

    // Resume WebGL background désactivé (nettoyage)

    // Initialize counter animations
    new CounterAnimation();

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // =============================
    // Projects demos: Lightbox vidéo
    // =============================
    const lightbox = document.getElementById('video-lightbox');
    const videoContainer = document.getElementById('lightbox-video-container');
    const closeEls = lightbox ? lightbox.querySelectorAll('[data-close]') : [];

    function parseTimeToSeconds(t) {
        if (!t) return 0;
        // Supporte formats: 457s, 7m37s, 1h2m3s, ou entier secondes
        if (/^\d+$/.test(t)) return parseInt(t, 10);
        const re = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
        const m = t.match(re);
        if (!m) return 0;
        const h = parseInt(m[1] || '0', 10);
        const min = parseInt(m[2] || '0', 10);
        const s = parseInt(m[3] || '0', 10);
        return h * 3600 + min * 60 + s;
    }

    function toYouTubeEmbed(urlStr) {
        try {
            const url = new URL(urlStr);
            let id = '';
            let start = 0;
            if (url.hostname.includes('youtube.com')) {
                if (url.pathname === '/watch') {
                    id = url.searchParams.get('v') || '';
                    start = parseTimeToSeconds(url.searchParams.get('t'));
                } else if (url.pathname.startsWith('/embed/')) {
                    id = url.pathname.split('/').pop();
                    start = parseTimeToSeconds(url.searchParams.get('start'));
                }
            } else if (url.hostname === 'youtu.be') {
                id = url.pathname.replace('/', '');
                start = parseTimeToSeconds(url.searchParams.get('t'));
            }
            if (!id) return urlStr;
            const params = new URLSearchParams({ autoplay: '1', rel: '0' });
            if (start > 0) params.set('start', String(start));
            return `https://www.youtube.com/embed/${id}?${params.toString()}`;
        } catch (_) {
            return urlStr;
        }
    }

    function openLightbox(embedUrl) {
        if (!lightbox || !videoContainer) return;
        videoContainer.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.src = embedUrl;
        videoContainer.appendChild(iframe);
        lightbox.classList.remove('hidden');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightbox || !videoContainer) return;
        videoContainer.innerHTML = '';
        lightbox.classList.add('hidden');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Comportement demandé: ouvrir directement YouTube dans un nouvel onglet (pas de lightbox)
    // On n'intercepte plus le clic sur les boutons "Watch" afin de laisser le lien s'ouvrir normalement.
    // On s'assure simplement que l'attribut target est bien _blank.
    document.querySelectorAll('.projects-demos .btn.watch').forEach(btn => {
        if (!btn.getAttribute('target')) {
            btn.setAttribute('target', '_blank');
            btn.setAttribute('rel', 'noopener');
        }
    });

    // Fermer lightbox (clic backdrop / bouton)
    closeEls.forEach(el => el.addEventListener('click', closeLightbox));
    // Fermer sur Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });
});