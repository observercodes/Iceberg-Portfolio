// Shared scripts for every page (carousel drag, auto-scrolling logos, image enlarge).

// The "Finger-style" Mouse Drag
const sliders = document.querySelectorAll('.c-container:not(#BWC)');
let isDown = false;
let startX;
let scrollLeft;

sliders.forEach(slider => {
    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
        slider.style.scrollSnapType = 'none'; // Disable snap while dragging
    });
    slider.addEventListener('mouseleave', () => {
        isDown = false;
    });
    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.style.scrollSnapType = 'x mandatory'; // Re-enable snap
    });
    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX); 
        slider.scrollLeft = scrollLeft - walk;
    });
});

(function () {
    const container = document.getElementById('BWC');
    const track = container ? container.querySelector('.c-track') : null;
    if (!container || !track) return;

    const speed = 0.021; // px per ms (~0.35px/frame at 60fps)

    let pos = 0;
    let lastTimestamp = null;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartPos = 0;
    let wheelResumeTimeout = null;

    function getLoopWidth() {
        const w = track.scrollWidth / 2;
        return w > 0 ? w : 0;
    }

    function wrap(value, max) {
        if (max <= 0) return 0;
        return ((value % max) + max) % max;
    }

    function render() {
        track.style.transform = `translate3d(${-pos}px, 0, 0)`;
    }

    function tick(timestamp) {
        if (lastTimestamp === null) lastTimestamp = timestamp;
        const dt = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        if (!isDragging) {
            const loopWidth = getLoopWidth();
            pos = wrap(pos + speed * dt, loopWidth);
            render();
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    function onPointerMove(e) {
        const loopWidth = getLoopWidth();
        const dx = e.clientX - dragStartX;
        pos = wrap(dragStartPos - dx, loopWidth);
        render();
    }

    function endDrag() {
        isDragging = false;
        container.style.cursor = 'grab';
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', endDrag);
        window.removeEventListener('pointercancel', endDrag);
    }

    container.addEventListener('pointerdown', (e) => {
        isDragging = true;
        clearTimeout(wheelResumeTimeout);
        dragStartX = e.clientX;
        dragStartPos = pos;
        container.style.cursor = 'grabbing';
        // Attach to window, not the container — guarantees we catch the
        // release even if the finger/cursor leaves the carousel first.
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
    });

    // Trackpad / mouse wheel horizontal support
    container.addEventListener('wheel', (e) => {
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (delta === 0) return;
        e.preventDefault();
        isDragging = true;
        clearTimeout(wheelResumeTimeout);
        pos = wrap(pos + delta, getLoopWidth());
        render();
        wheelResumeTimeout = setTimeout(() => { isDragging = false; }, 400);
    }, { passive: false });
})();

/* ══ This is for image enlargment on click feature, IMAGE LIGHTBOX 
   Any picture that doesn't navigate somewhere gets
   tap-to-enlarge. Delegated, so new images work with
   no extra wiring.                                     */
document.addEventListener('DOMContentLoaded', function () {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if (!lightbox || !lightboxImg) return;

    // "This goes somewhere" → never enlarge.
    const NAVIGATES = 'a, button, [onclick], .no-zoom, .HeaderContainer, .Footer';

    // Where to look for the picture when the click lands on a wrapper
    // instead of the <img> (your .c-image has pointer-events: none).
    const WRAPPERS = '.c-item, .AboutPhotoWrapper, .zoomable';

    // ── Tap vs. drag ──────────────────────────────────
    let pressed = false, dragged = false, downX = 0, downY = 0;

    document.addEventListener('pointerdown', e => {
        pressed = true;
        dragged = false;
        downX = e.clientX;
        downY = e.clientY;
    }, true);

    document.addEventListener('pointermove', e => {
        if (!pressed) return;
        if (Math.abs(e.clientX - downX) > 6 ||
            Math.abs(e.clientY - downY) > 6) dragged = true;
    }, true);

    document.addEventListener('pointerup',     () => { pressed = false; }, true);
    document.addEventListener('pointercancel', () => { pressed = false; dragged = true; }, true);

    // ── Open ──────────────────────────────────────────
    document.addEventListener('click', e => {
        if (dragged) return;
        if (lightbox.contains(e.target)) return;
        if (e.target.closest(NAVIGATES)) return;

        const img = e.target.tagName === 'IMG'
            ? e.target
            : e.target.closest(WRAPPERS)?.querySelector('img');

        if (!img || !img.src) return;

        lightboxImg.src = img.currentSrc || img.src;
        lightboxImg.alt = img.alt || '';
        lightbox.classList.add('active');
        document.body.classList.add('lb-open');
    });

    // ── Close ─────────────────────────────────────────
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.classList.remove('lb-open');
        lightboxImg.src = '';
    }

    lightbox.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
    });
});
