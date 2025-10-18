/**
 * GO CAMP INTERNATIONAL - MASTER JAVASCRIPT
 * Version: 2.0
 * Last Updated: October 2025
 *
 * This file handles all interactive functionality for the website
 * including: forms, modals, navigation, filtering, and animations
 */

(function () {
  "use strict";

  // ============================================
  // 1. CONFIGURATION & CONSTANTS
  // ============================================
  const CONFIG = {
    API_ENDPOINTS: {
      LEAD_FORM: "/api/submit-lead.php",
      CONTACT_FORM: "/api/submit-contact.php",
      NEWSLETTER: "/api/subscribe-newsletter.php",
    },
    ANIMATION: {
      DURATION: 300,
      SCROLL_OFFSET: 100,
    },
    FORM: {
      SUCCESS_MESSAGE: "Thank you! We will contact you soon.",
      ERROR_MESSAGE: "Something went wrong. Please try again.",
      VALIDATION_DELAY: 300,
    },
  };

  // ============================================
  // 2. UTILITY FUNCTIONS
  // ============================================
  const Utils = {
    /**
     * Debounce function to limit rate of function calls
     */
    debounce: function (func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Throttle function to limit function execution
     */
    throttle: function (func, limit) {
      let inThrottle;
      return function (...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
        }
      };
    },

    /**
     * Smooth scroll to element
     */
    smoothScrollTo: function (target, offset = CONFIG.ANIMATION.SCROLL_OFFSET) {
      const element = document.querySelector(target);
      if (element) {
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    },

    /**
     * Show element with fade animation
     */
    fadeIn: function (element, duration = CONFIG.ANIMATION.DURATION) {
      element.style.opacity = 0;
      element.style.display = "block";

      let opacity = 0;
      const interval = 50;
      const gap = interval / duration;

      const func = setInterval(() => {
        opacity += gap;
        element.style.opacity = opacity;

        if (opacity >= 1) {
          clearInterval(func);
        }
      }, interval);
    },

    /**
     * Hide element with fade animation
     */
    fadeOut: function (element, duration = CONFIG.ANIMATION.DURATION) {
      let opacity = 1;
      const interval = 50;
      const gap = interval / duration;

      const func = setInterval(() => {
        opacity -= gap;
        element.style.opacity = opacity;

        if (opacity <= 0) {
          clearInterval(func);
          element.style.display = "none";
        }
      }, interval);
    },

    /**
     * Validate email format
     */
    isValidEmail: function (email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(String(email).toLowerCase());
    },

    /**
     * Validate phone number (international format)
     */
    isValidPhone: function (phone) {
      const re =
        /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      return re.test(String(phone));
    },

    /**
     * Sanitize HTML to prevent XSS
     */
    sanitizeHTML: function (str) {
      const temp = document.createElement("div");
      temp.textContent = str;
      return temp.innerHTML;
    },

    /**
     * Get form data as object
     */
    getFormData: function (form) {
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      return data;
    },

    /**
     * Show toast notification
     */
    showToast: function (message, type = "info", duration = 3000) {
      const toast = document.createElement("div");
      toast.className = `toast-notification toast-${type}`;
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        top: 120px;
        right: 20px;
        padding: 15px 25px;
        background: ${
          type === "success"
            ? "#28a745"
            : type === "error"
            ? "#dc3545"
            : "#17a2b8"
        };
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideInRight 0.3s ease-out;
        font-weight: 600;
      `;

      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = "slideOutRight 0.3s ease-out";
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },
  };

  // ============================================
  // 3. NAVIGATION HANDLERS
  // ============================================
  const Navigation = {
    init: function () {
      this.handleSmoothScroll();
      this.handleNavbarScroll();
      this.handleMobileMenu();
      this.handleDropdowns();
    },

    /**
     * Handle smooth scrolling for anchor links
     */
    handleSmoothScroll: function () {
      document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
          const href = this.getAttribute("href");
          if (href !== "#" && href.length > 1) {
            e.preventDefault();
            Utils.smoothScrollTo(href);
          }
        });
      });
    },

    /**
     * Handle navbar behavior on scroll
     */
    handleNavbarScroll: function () {
      const navbar = document.querySelector(".navbar");
      let lastScroll = 0;

      window.addEventListener(
        "scroll",
        Utils.throttle(() => {
          const currentScroll = window.pageYOffset;

          if (currentScroll > 100) {
            navbar.classList.add("navbar-scrolled");
          } else {
            navbar.classList.remove("navbar-scrolled");
          }

          lastScroll = currentScroll;
        }, 100)
      );
    },

    /**
     * Handle mobile menu interactions
     */
    handleMobileMenu: function () {
      const navbarToggler = document.querySelector(".navbar-toggler");
      const navbarCollapse = document.querySelector(".navbar-collapse");

      if (navbarToggler && navbarCollapse) {
        // Close menu when clicking outside
        document.addEventListener("click", (e) => {
          const isClickInsideNav =
            navbarCollapse.contains(e.target) ||
            navbarToggler.contains(e.target);
          if (!isClickInsideNav && navbarCollapse.classList.contains("show")) {
            navbarToggler.click();
          }
        });

        // Close menu when clicking on a link (mobile)
        navbarCollapse
          .querySelectorAll(".nav-link:not(.dropdown-toggle)")
          .forEach((link) => {
            link.addEventListener("click", () => {
              if (
                window.innerWidth < 992 &&
                navbarCollapse.classList.contains("show")
              ) {
                navbarToggler.click();
              }
            });
          });
      }
    },

    /**
     * Enhance dropdown behavior
     */
    handleDropdowns: function () {
      // On desktop, open dropdown on hover
      if (window.innerWidth >= 992) {
        document.querySelectorAll(".nav-item.dropdown").forEach((dropdown) => {
          let timeout;

          dropdown.addEventListener("mouseenter", function () {
            clearTimeout(timeout);
            const dropdownMenu = this.querySelector(".dropdown-menu");
            if (dropdownMenu && !dropdownMenu.classList.contains("show")) {
              this.querySelector(".dropdown-toggle").click();
            }
          });

          dropdown.addEventListener("mouseleave", function () {
            timeout = setTimeout(() => {
              const dropdownMenu = this.querySelector(".dropdown-menu");
              if (dropdownMenu && dropdownMenu.classList.contains("show")) {
                this.querySelector(".dropdown-toggle").click();
              }
            }, 300);
          });
        });
      }
    },
  };

  // ============================================
  // 4. FORM HANDLING
  // ============================================
  const FormHandler = {
    init: function () {
      this.handleLeadForm();
      this.handleContactForms();
      this.handleNewsletterForm();
      this.setupFormValidation();
    },

    /**
     * Handle lead form submission (modal)
     */
    handleLeadForm: function () {
      const leadForm = document.getElementById("leadForm");
      if (!leadForm) return;

      leadForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Validate form
        if (!this.validateForm(leadForm)) {
          return;
        }

        const submitButton = leadForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        const statusMessage = document.querySelector(".status-message");

        // Disable submit button
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
        statusMessage.innerHTML = "";

        try {
          const formData = Utils.getFormData(leadForm);

          // Simulate API call (replace with actual endpoint)
          const response = await fetch(CONFIG.API_ENDPOINTS.LEAD_FORM, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          });

          if (response.ok) {
            statusMessage.innerHTML = `<div class="alert alert-success">${CONFIG.FORM.SUCCESS_MESSAGE}</div>`;
            leadForm.reset();
            Utils.showToast("Form submitted successfully!", "success");

            // Close modal after 2 seconds
            setTimeout(() => {
              const modal = bootstrap.Modal.getInstance(
                document.getElementById("ctaModal")
              );
              if (modal) modal.hide();
            }, 2000);
          } else {
            throw new Error("Submission failed");
          }
        } catch (error) {
          console.error("Form submission error:", error);
          statusMessage.innerHTML = `<div class="alert alert-danger">${CONFIG.FORM.ERROR_MESSAGE}</div>`;
          Utils.showToast("Submission failed. Please try again.", "error");
        } finally {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
      });
    },

    /**
     * Handle contact forms
     */
    handleContactForms: function () {
      document
        .querySelectorAll('form[data-form-type="contact"]')
        .forEach((form) => {
          form.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!this.validateForm(form)) {
              return;
            }

            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;

            submitButton.disabled = true;
            submitButton.textContent = "Sending...";

            try {
              const formData = Utils.getFormData(form);

              const response = await fetch(CONFIG.API_ENDPOINTS.CONTACT_FORM, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
              });

              if (response.ok) {
                form.reset();
                Utils.showToast("Message sent successfully!", "success");
              } else {
                throw new Error("Submission failed");
              }
            } catch (error) {
              console.error("Contact form error:", error);
              Utils.showToast(
                "Failed to send message. Please try again.",
                "error"
              );
            } finally {
              submitButton.disabled = false;
              submitButton.textContent = originalText;
            }
          });
        });
    },

    /**
     * Handle newsletter subscription
     */
    handleNewsletterForm: function () {
      document
        .querySelectorAll('form[data-form-type="newsletter"]')
        .forEach((form) => {
          form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const emailInput = form.querySelector('input[type="email"]');
            if (!Utils.isValidEmail(emailInput.value)) {
              Utils.showToast("Please enter a valid email address", "error");
              return;
            }

            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;

            try {
              const response = await fetch(CONFIG.API_ENDPOINTS.NEWSLETTER, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: emailInput.value }),
              });

              if (response.ok) {
                form.reset();
                Utils.showToast(
                  "Successfully subscribed to newsletter!",
                  "success"
                );
              } else {
                throw new Error("Subscription failed");
              }
            } catch (error) {
              console.error("Newsletter subscription error:", error);
              Utils.showToast(
                "Subscription failed. Please try again.",
                "error"
              );
            } finally {
              submitButton.disabled = false;
            }
          });
        });
    },

    /**
     * Setup real-time form validation
     */
    setupFormValidation: function () {
      document
        .querySelectorAll(
          "input[required], select[required], textarea[required]"
        )
        .forEach((field) => {
          // Validation on blur
          field.addEventListener("blur", () => {
            this.validateField(field);
          });

          // Clear error on input
          field.addEventListener(
            "input",
            Utils.debounce(() => {
              if (field.classList.contains("is-invalid")) {
                this.validateField(field);
              }
            }, CONFIG.FORM.VALIDATION_DELAY)
          );
        });
    },

    /**
     * Validate individual field
     */
    validateField: function (field) {
      let isValid = true;
      let errorMessage = "";

      // Check if required field is empty
      if (field.hasAttribute("required") && !field.value.trim()) {
        isValid = false;
        errorMessage = "This field is required";
      }

      // Email validation
      if (
        field.type === "email" &&
        field.value &&
        !Utils.isValidEmail(field.value)
      ) {
        isValid = false;
        errorMessage = "Please enter a valid email address";
      }

      // Phone validation
      if (
        field.type === "tel" &&
        field.value &&
        !Utils.isValidPhone(field.value)
      ) {
        isValid = false;
        errorMessage = "Please enter a valid phone number";
      }

      // Update field state
      if (isValid) {
        field.classList.remove("is-invalid");
        field.classList.add("is-valid");
        const feedback = field.nextElementSibling;
        if (feedback && feedback.classList.contains("invalid-feedback")) {
          feedback.remove();
        }
      } else {
        field.classList.remove("is-valid");
        field.classList.add("is-invalid");

        // Add or update error message
        let feedback = field.nextElementSibling;
        if (!feedback || !feedback.classList.contains("invalid-feedback")) {
          feedback = document.createElement("div");
          feedback.className = "invalid-feedback";
          field.parentNode.insertBefore(feedback, field.nextSibling);
        }
        feedback.textContent = errorMessage;
      }

      return isValid;
    },

    /**
     * Validate entire form
     */
    validateForm: function (form) {
      let isValid = true;
      const fields = form.querySelectorAll(
        "input[required], select[required], textarea[required]"
      );

      fields.forEach((field) => {
        if (!this.validateField(field)) {
          isValid = false;
        }
      });

      return isValid;
    },
  };

  // ============================================
  // 5. PROGRAM FILTERING
  // ============================================
  const ProgramFilter = {
    init: function () {
      this.setupFilters();
      this.setupSearch();
    },

    /**
     * Setup filter buttons
     */
    setupFilters: function () {
      const filterButtons = document.querySelectorAll("[data-filter]");
      const programCards = document.querySelectorAll("[data-program-type]");

      filterButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const filterValue = this.getAttribute("data-filter");

          // Update active button
          filterButtons.forEach((btn) => btn.classList.remove("active"));
          this.classList.add("active");

          // Filter programs
          programCards.forEach((card) => {
            if (
              filterValue === "all" ||
              card.getAttribute("data-program-type") === filterValue
            ) {
              card.style.display = "block";
              card.style.animation = "fadeInUp 0.5s ease-out";
            } else {
              card.style.display = "none";
            }
          });
        });
      });
    },

    /**
     * Setup search functionality
     */
    setupSearch: function () {
      const searchInput = document.querySelector('[data-search="programs"]');
      if (!searchInput) return;

      const programCards = document.querySelectorAll("[data-program-name]");

      searchInput.addEventListener(
        "input",
        Utils.debounce((e) => {
          const searchTerm = e.target.value.toLowerCase();

          programCards.forEach((card) => {
            const programName = card
              .getAttribute("data-program-name")
              .toLowerCase();
            const programDescription =
              card.getAttribute("data-program-description")?.toLowerCase() ||
              "";

            if (
              programName.includes(searchTerm) ||
              programDescription.includes(searchTerm)
            ) {
              card.style.display = "block";
            } else {
              card.style.display = "none";
            }
          });
        }, 300)
      );
    },
  };

  // ============================================
  // 6. MODAL HANDLERS
  // ============================================
  const ModalHandler = {
    init: function () {
      this.handleProgramModals();
      this.handleCTAModal();
    },

    /**
     * Handle program detail modals
     */
    handleProgramModals: function () {
      document
        .querySelectorAll('[data-bs-toggle="modal"][data-program-id]')
        .forEach((trigger) => {
          trigger.addEventListener("click", function () {
            const programId = this.getAttribute("data-program-id");
            const modalId = this.getAttribute("data-bs-target");

            // You can load program details dynamically here
            console.log(`Loading program details for ID: ${programId}`);
          });
        });
    },

    /**
     * Handle CTA modal
     */
    handleCTAModal: function () {
      const ctaModal = document.getElementById("ctaModal");
      if (!ctaModal) return;

      // Track modal source
      document
        .querySelectorAll(
          '[data-bs-toggle="modal"][data-bs-target="#ctaModal"]'
        )
        .forEach((trigger) => {
          trigger.addEventListener("click", function () {
            const source = this.getAttribute("data-source") || "Unknown";
            const sourceInput = ctaModal.querySelector('input[name="source"]');
            if (sourceInput) {
              sourceInput.value = source;
            }
          });
        });

      // Reset form when modal is hidden
      ctaModal.addEventListener("hidden.bs.modal", function () {
        const form = this.querySelector("form");
        if (form) {
          form.reset();
          form.querySelectorAll(".is-valid, .is-invalid").forEach((field) => {
            field.classList.remove("is-valid", "is-invalid");
          });
          form.querySelectorAll(".invalid-feedback").forEach((feedback) => {
            feedback.remove();
          });
        }
        const statusMessage = this.querySelector(".status-message");
        if (statusMessage) {
          statusMessage.innerHTML = "";
        }
      });
    },
  };

  // ============================================
  // 7. IMAGE LAZY LOADING
  // ============================================
  const LazyLoad = {
    init: function () {
      if ("IntersectionObserver" in window) {
        this.observeImages();
      } else {
        // Fallback for older browsers
        this.loadAllImages();
      }
    },

    /**
     * Observe images for lazy loading
     */
    observeImages: function () {
      const images = document.querySelectorAll("img[data-src]");

      const imageObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.getAttribute("data-src");
              img.removeAttribute("data-src");
              img.classList.add("loaded");
              observer.unobserve(img);
            }
          });
        },
        {
          rootMargin: "50px 0px",
          threshold: 0.01,
        }
      );

      images.forEach((img) => imageObserver.observe(img));
    },

    /**
     * Load all images immediately (fallback)
     */
    loadAllImages: function () {
      document.querySelectorAll("img[data-src]").forEach((img) => {
        img.src = img.getAttribute("data-src");
        img.removeAttribute("data-src");
      });
    },
  };

  // ============================================
  // 8. ANIMATIONS ON SCROLL
  // ============================================
  const ScrollAnimations = {
    init: function () {
      if ("IntersectionObserver" in window) {
        this.observeElements();
      }
    },

    /**
     * Observe elements for scroll animations
     */
    observeElements: function () {
      const elements = document.querySelectorAll("[data-animate]");

      const animationObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target;
              const animation = element.getAttribute("data-animate");
              const delay = element.getAttribute("data-animate-delay") || 0;

              setTimeout(() => {
                element.classList.add("animated", animation);
              }, delay);

              animationObserver.unobserve(element);
            }
          });
        },
        {
          threshold: 0.1,
        }
      );

      elements.forEach((el) => animationObserver.observe(el));
    },
  };

  // ============================================
  // 9. CAROUSEL ENHANCEMENTS
  // ============================================
  const CarouselHandler = {
    init: function () {
      this.enhanceCarousels();
    },

    /**
     * Add enhancements to Bootstrap carousels
     */
    enhanceCarousels: function () {
      document.querySelectorAll(".carousel").forEach((carousel) => {
        // Pause carousel on hover
        carousel.addEventListener("mouseenter", function () {
          bootstrap.Carousel.getInstance(this)?.pause();
        });

        carousel.addEventListener("mouseleave", function () {
          bootstrap.Carousel.getInstance(this)?.cycle();
        });

        // Add keyboard navigation
        carousel.addEventListener("keydown", function (e) {
          const instance = bootstrap.Carousel.getInstance(this);
          if (!instance) return;

          if (e.key === "ArrowLeft") {
            instance.prev();
          } else if (e.key === "ArrowRight") {
            instance.next();
          }
        });
      });
    },
  };

  // ============================================
  // 10. PERFORMANCE MONITORING
  // ============================================
  const Performance = {
    init: function () {
      this.logPageLoadTime();
      this.monitorLongTasks();
    },

    /**
     * Log page load time
     */
    logPageLoadTime: function () {
      window.addEventListener("load", () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`Page load time: ${pageLoadTime}ms`);
      });
    },

    /**
     * Monitor long tasks that might affect performance
     */
    monitorLongTasks: function () {
      if ("PerformanceObserver" in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              console.warn("Long task detected:", entry);
            }
          });
          observer.observe({ entryTypes: ["longtask"] });
        } catch (e) {
          // Long task API not supported
        }
      }
    },
  };

  // ============================================
  // 11. INITIALIZATION
  // ============================================
  const App = {
    init: function () {
      // Wait for DOM to be fully loaded
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () =>
          this.initializeModules()
        );
      } else {
        this.initializeModules();
      }
    },

    /**
     * Initialize all modules
     */
    initializeModules: function () {
      console.log("🚀 Initializing Go Camp International...");

      // Initialize modules in order
      Navigation.init();
      FormHandler.init();
      ProgramFilter.init();
      ModalHandler.init();
      LazyLoad.init();
      ScrollAnimations.init();
      CarouselHandler.init();
      Performance.init();

      // Add loaded class to body
      document.body.classList.add("page-loaded");

      console.log("✅ All modules initialized successfully");
    },
  };

  // Start the application
  App.init();

  // Export for external use if needed
  window.GoCampApp = {
    Utils,
    Navigation,
    FormHandler,
    ProgramFilter,
    ModalHandler,
  };
})();

// ============================================
// 12. ADDITIONAL ANIMATIONS KEYFRAMES
// ============================================
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .page-loaded {
    animation: fadeIn 0.3s ease-out;
  }
`;
document.head.appendChild(style);
