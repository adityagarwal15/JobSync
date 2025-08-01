// Custom Cursor Animation with Advanced Effects & Smooth Animations
class CustomCursor {
  constructor() {
    this.cursor = null;
    this.trails = [];
    this.isVisible = false;
    this.isMobile = window.innerWidth <= 768;
    this.mouseX = 0;
    this.mouseY = 0;
    this.trailCount = 5; // Increased for more trails
    this.trailPositions = [];
    this.animationId = null;
    this.isMenuOpen = false;
    this.isInitialized = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    
    this.init();
  }

  init() {
    if (this.isMobile) {
      console.log('CustomCursor: Mobile device detected, cursor disabled');
      return;
    }
    
    try {
      this.createCursor();
      this.createTrails();
      this.bindEvents();
      this.hideDefaultCursor();
      this.startAnimation();
      this.isInitialized = true;
      console.log('CustomCursor: Initialized successfully');
      
      // Force show cursor after initialization
      setTimeout(() => {
        this.showCursor();
      }, 100);
    } catch (error) {
      console.error('CustomCursor: Initialization error:', error);
    }
  }

  createCursor() {
    this.cursor = document.createElement('div');
    this.cursor.className = 'custom-cursor';
    
    // Set inline styles to ensure visibility
    this.cursor.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 20px;
      height: 20px;
      background: radial-gradient(circle, rgba(64, 156, 255, 0.95) 0%, rgba(64, 156, 255, 0.8) 50%, rgba(64, 156, 255, 0.6) 100%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 2147483647;
      transform: translate(-50%, -50%);
      box-shadow: 
        0 0 20px rgba(64, 156, 255, 0.8),
        0 0 40px rgba(64, 156, 255, 0.6),
        0 0 60px rgba(64, 156, 255, 0.4);
      will-change: transform, width, height, background, border-radius, box-shadow;
      transition: all 0.2s ease-out;
      opacity: 0;
      display: block;
    `;
    
    // Append to the very end of body to ensure it's on top
    document.body.appendChild(this.cursor);
  }

  createTrails() {
    for (let i = 0; i < this.trailCount; i++) {
      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      
      // Calculate descending sizes starting from cursor size (20px)
      const baseSize = 20;
      const size = baseSize - (i * 4); // 20, 16, 12, 8, 4
      
      // Set inline styles for trails with descending sizes
      trail.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, rgba(64, 156, 255, 0.9) 0%, rgba(64, 156, 255, 0.7) 60%, transparent 100%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 2147483646;
        opacity: 0;
        transform: translate(-50%, -50%);
        will-change: transform, opacity, width, height;
        transition: all 0.2s ease-out;
        display: block;
      `;
      
      // Append to the very end of body to ensure it's on top
      document.body.appendChild(trail);
      this.trails.push(trail);
      this.trailPositions.push({ x: 0, y: 0 });
    }
  }

  bindEvents() {
    // Mouse move with velocity calculation
    let ticking = false;
    document.addEventListener('mousemove', (e) => {
      this.lastMouseX = this.mouseX;
      this.lastMouseY = this.mouseY;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      
      // Calculate velocity
      this.velocity.x = this.mouseX - this.lastMouseX;
      this.velocity.y = this.mouseY - this.lastMouseY;
      
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

    // Click events with enhanced effects
    document.addEventListener('mousedown', () => {
      if (this.cursor) {
        this.cursor.classList.add('click');
        this.addClickRipple();
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.cursor) {
        this.cursor.classList.remove('click');
      }
    });

    // Hover effects for interactive elements
    this.setupHoverEffects();

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

    // Menu state monitoring
    this.monitorMenuState();
  }

  addClickRipple() {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: fixed;
      top: ${this.mouseY}px;
      left: ${this.mouseX}px;
      width: 0;
      height: 0;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 2147483645;
      transform: translate(-50%, -50%);
      animation: rippleExpand 0.6s ease-out forwards;
    `;
    
    document.body.appendChild(ripple);
    
    // Add ripple animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes rippleExpand {
        0% {
          width: 0;
          height: 0;
          opacity: 1;
        }
        100% {
          width: 100px;
          height: 100px;
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  setupHoverEffects() {
    // Setup hover effects for existing elements with enhanced detection
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, [role="button"], .menu-item, .auth-button, .contact, .menu, .sound');
    
    interactiveElements.forEach(element => {
      element.addEventListener('mouseenter', (e) => {
        if (this.cursor) {
          this.cursor.classList.add('hover');
          
          // Add specific classes based on element type
          if (element.tagName === 'A') {
            this.cursor.classList.add('link-hover');
          } else if (element.tagName === 'BUTTON') {
            this.cursor.classList.add('button-hover');
          } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
            this.cursor.classList.add('input-hover');
          } else if (element.classList.contains('menu-item')) {
            this.cursor.classList.add('menu-hover');
          }
          
          // Add pulse effect for menu items
          if (element.classList.contains('menu-item')) {
            this.cursor.classList.add('pulse');
          }
        }
      });
      
      element.addEventListener('mouseleave', (e) => {
        if (this.cursor) {
          this.cursor.classList.remove('hover', 'link-hover', 'button-hover', 'input-hover', 'menu-hover', 'pulse');
        }
      });
    });

    // Monitor for new elements being added
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const newElements = node.querySelectorAll ? node.querySelectorAll('a, button, input, textarea, select, [role="button"], .menu-item, .auth-button, .contact, .menu, .sound') : [];
              newElements.forEach(element => {
                element.addEventListener('mouseenter', () => {
                  if (this.cursor) {
                    this.cursor.classList.add('hover');
                    if (element.tagName === 'A') {
                      this.cursor.classList.add('link-hover');
                    } else if (element.tagName === 'BUTTON') {
                      this.cursor.classList.add('button-hover');
                    } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                      this.cursor.classList.add('input-hover');
                    } else if (element.classList.contains('menu-item')) {
                      this.cursor.classList.add('menu-hover', 'pulse');
                    }
                  }
                });
                
                element.addEventListener('mouseleave', () => {
                  if (this.cursor) {
                    this.cursor.classList.remove('hover', 'link-hover', 'button-hover', 'input-hover', 'menu-hover', 'pulse');
                  }
                });
              });
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  monitorMenuState() {
    // Monitor menu toggle button for state changes
    const menuToggleBtn = document.querySelector('.menu');
    if (menuToggleBtn) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            this.isMenuOpen = menuToggleBtn.classList.contains('active');
            this.handleMenuStateChange();
          }
        });
      });
      
      observer.observe(menuToggleBtn, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    // Also monitor menu container visibility
    const menuContainer = document.querySelector('.menu-container');
    if (menuContainer) {
      const menuObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            this.handleMenuStateChange();
          }
        });
      });
      
      menuObserver.observe(menuContainer, {
        attributes: true,
        attributeFilter: ['style']
      });
    }
  }

  handleMenuStateChange() {
    if (this.isMenuOpen) {
      // Ensure cursor is visible when menu is open
      this.showCursor();
      
      // Update interactive elements for menu items
      setTimeout(() => {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
          if (item.style.pointerEvents === 'all') {
            item.addEventListener('mouseenter', () => {
              if (this.cursor) {
                this.cursor.classList.add('hover', 'menu-hover', 'pulse');
              }
            });
            
            item.addEventListener('mouseleave', () => {
              if (this.cursor) {
                this.cursor.classList.remove('hover', 'menu-hover', 'pulse');
              }
            });
          }
        });
      }, 100);
    }
  }

  updateCursor() {
    if (!this.cursor || !this.isVisible) return;
    
    // More precise cursor movement with less interpolation
    const smoothFactor = 0.6; // Increased for more precise movement
    const currentX = parseFloat(this.cursor.style.left) || this.mouseX;
    const currentY = parseFloat(this.cursor.style.top) || this.mouseY;
    
    const newX = currentX + (this.mouseX - currentX) * smoothFactor;
    const newY = currentY + (this.mouseY - currentY) * smoothFactor;
    
    this.cursor.style.left = `${newX}px`;
    this.cursor.style.top = `${newY}px`;
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
    // Fixed trail positions to follow behind the cursor
    for (let i = 0; i < this.trailCount; i++) {
      const trail = this.trails[i];
      const currentPos = this.trailPositions[i];
      
      // Calculate delay based on trail position (further trails have more delay)
      const delay = (i + 1) * 0.08; // Reduced delay for more precise following
      const targetX = this.mouseX;
      const targetY = this.mouseY;
      
      // Smooth interpolation with proper following
      currentPos.x += (targetX - currentPos.x) * delay;
      currentPos.y += (targetY - currentPos.y) * delay;
      
      // Update trail position
      trail.style.left = `${currentPos.x}px`;
      trail.style.top = `${currentPos.y}px`;
      
      // Calculate movement speed
      const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
      
      // Show trails only when moving and fade them when stopped
      if (speed > 2) {
        // Trail opacity based on speed and position
        const baseOpacity = Math.min(speed / 15, 0.9);
        const trailOpacity = baseOpacity * (1 - i * 0.15); // Fade out for each trail
        trail.style.opacity = Math.max(trailOpacity, 0.1);
        trail.classList.add('active');
      } else {
        // When stopped, fade out all trails quickly
        trail.style.opacity = 0;
        trail.classList.remove('active');
      }
    }
  }

  showCursor() {
    if (this.isMobile || !this.isInitialized) return;
    
    this.isVisible = true;
    if (this.cursor) {
      this.cursor.style.opacity = '1';
      this.cursor.style.display = 'block';
      this.cursor.style.pointerEvents = 'none';
    }
    this.trails.forEach(trail => {
      trail.style.opacity = '0.6';
      trail.style.display = 'block';
      trail.style.pointerEvents = 'none';
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