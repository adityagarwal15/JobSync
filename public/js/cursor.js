// Custom Cursor Animation with Tracing Effects - Optimized
class CustomCursor {
  constructor() {
    this.cursor = null;
    this.trails = [];
    this.isVisible = false;
    this.isMobile = window.innerWidth <= 768;
    this.mouseX = 0;
    this.mouseY = 0;
    this.trailCount = 3; // Reduced for better performance
    this.trailPositions = [];
    this.animationId = null;
    
    this.init();
  }

  init() {
    if (this.isMobile) return;
    
    this.createCursor();
    this.createTrails();
    this.bindEvents();
    this.hideDefaultCursor();
    this.startAnimation();
  }

  createCursor() {
    this.cursor = document.createElement('div');
    this.cursor.className = 'custom-cursor';
    document.body.appendChild(this.cursor);
  }

  createTrails() {
    for (let i = 0; i < this.trailCount; i++) {
      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      document.body.appendChild(trail);
      this.trails.push(trail);
      this.trailPositions.push({ x: 0, y: 0 });
    }
  }

  bindEvents() {
    // Mouse move with throttling
    let ticking = false;
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      
      if (!ticking) {
        requestAnimationFrame(() => {
          this.updateCursor();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Mouse enter
    document.addEventListener('mouseenter', () => {
      this.showCursor();
    });

    // Mouse leave
    document.addEventListener('mouseleave', () => {
      this.hideCursor();
    });

    // Click events
    document.addEventListener('mousedown', () => {
      if (this.cursor) {
        this.cursor.classList.add('click');
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.cursor) {
        this.cursor.classList.remove('click');
      }
    });

    // Hover effects for interactive elements
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, [role="button"]');
    
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        if (this.cursor) {
          this.cursor.classList.add('hover');
        }
      });
      
      element.addEventListener('mouseleave', () => {
        if (this.cursor) {
          this.cursor.classList.remove('hover');
        }
      });
    });

    // Text selection
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (this.cursor) {
        if (selection.toString().length > 0) {
          this.cursor.classList.add('text-select');
        } else {
          this.cursor.classList.remove('text-select');
        }
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
      if (this.isMobile) {
        this.hideCursor();
      } else {
        this.showCursor();
      }
    });
  }

  updateCursor() {
    if (!this.cursor || !this.isVisible) return;
    
    this.cursor.style.left = `${this.mouseX}px`;
    this.cursor.style.top = `${this.mouseY}px`;
  }

  startAnimation() {
    const animate = () => {
      if (this.isVisible) {
        this.updateTrails();
      }
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  updateTrails() {
    // Update trail positions with smooth following
    for (let i = 0; i < this.trailCount; i++) {
      const trail = this.trails[i];
      const currentPos = this.trailPositions[i];
      
      // Calculate target position with delay
      const delay = (i + 1) * 0.1;
      const targetX = this.mouseX;
      const targetY = this.mouseY;
      
      // Smooth interpolation
      currentPos.x += (targetX - currentPos.x) * delay;
      currentPos.y += (targetY - currentPos.y) * delay;
      
      // Update trail position
      trail.style.left = `${currentPos.x}px`;
      trail.style.top = `${currentPos.y}px`;
    }
  }

  showCursor() {
    if (this.isMobile) return;
    
    this.isVisible = true;
    if (this.cursor) {
      this.cursor.style.opacity = '1';
    }
    this.trails.forEach(trail => {
      trail.style.opacity = '0.6';
    });
  }

  hideCursor() {
    this.isVisible = false;
    if (this.cursor) {
      this.cursor.style.opacity = '0';
    }
    this.trails.forEach(trail => {
      trail.style.opacity = '0';
    });
  }

  hideDefaultCursor() {
    document.body.style.cursor = 'none';
    
    // Keep default cursor for interactive elements on mobile
    if (!this.isMobile) {
      const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, [role="button"]');
      interactiveElements.forEach(element => {
        element.style.cursor = 'none';
      });
    }
  }

  // Public method to destroy cursor (useful for cleanup)
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.cursor) {
      this.cursor.remove();
    }
    this.trails.forEach(trail => trail.remove());
    this.trails = [];
    document.body.style.cursor = 'auto';
  }
}

// Initialize cursor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.customCursor = new CustomCursor();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (window.customCursor) {
      window.customCursor.hideCursor();
    }
  } else {
    if (window.customCursor) {
      window.customCursor.showCursor();
    }
  }
}); 