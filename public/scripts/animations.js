const gsap = window.gsap;

// Custom Cursor Effect (same as dashboard)
document.addEventListener('DOMContentLoaded', function() {
  const cursor = document.querySelector('.cursor');
  const cursorFollower = document.querySelector('.cursor-follower');
  const body = document.body;

  if (cursor && cursorFollower) {
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let followerX = 0;
    let followerY = 0;

    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function updateCursor() {
      cursorX += (mouseX - cursorX) * 0.1;
      cursorY += (mouseY - cursorY) * 0.1;
      followerX += (mouseX - followerX) * 0.05;
      followerY += (mouseY - followerY) * 0.05;

      gsap.set(cursor, {
        x: cursorX - 10,
        y: cursorY - 10
      });

      gsap.set(cursorFollower, {
        x: followerX - 20,
        y: followerY - 20
      });

      requestAnimationFrame(updateCursor);
    }

    updateCursor();

    const hoverElements = document.querySelectorAll('a, button, .cta-primary, .cta-secondary, .service-card, .work-item, .showcase-item');
    hoverElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        body.classList.add('cursor-hover');
      });
      el.addEventListener('mouseleave', () => {
        body.classList.remove('cursor-hover');
      });
    });

    document.addEventListener('mousedown', () => {
      body.classList.add('cursor-click');
    });
    document.addEventListener('mouseup', () => {
      body.classList.remove('cursor-click');
    });
  }

  // Hero animations
  gsap.from('.hero-line', {
    duration: 0.8,
    y: 30,
    opacity: 0,
    stagger: 0.2,
    ease: 'power2.out'
  });

  gsap.from('.hero-subtitle', {
    duration: 0.8,
    y: 20,
    opacity: 0,
    delay: 0.6,
    ease: 'power2.out'
  });

  gsap.from('.hero-actions', {
    duration: 0.8,
    y: 20,
    opacity: 0,
    delay: 0.8,
    ease: 'power2.out'
  });

  gsap.from('.hero-showcase', {
    duration: 1,
    scale: 0.8,
    opacity: 0,
    delay: 0.4,
    ease: 'back.out(1.7)'
  });
});