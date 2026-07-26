// Tailwind Configuration
tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {console.dir(first)
            "colors": {
                    "surface-container-high": "#e2e8f8",
                    "surface-container": "#e7eefe",
                    "secondary-container": "#adedd3",
                    "tertiary-fixed-dim": "#bdcac1",
                    "on-tertiary-fixed-variant": "#3e4943",
                    "tertiary-container": "#99a69e",
                    "secondary-fixed": "#b0f0d6",
                    "on-tertiary-fixed": "#131e19",
                    "background": "#f9f9ff",
                    "on-secondary": "#ffffff",
                    "on-secondary-fixed": "#002117",
                    "surface": "#f9f9ff",
                    "tertiary": "#55615a",
                    "on-surface-variant": "#3c4a42",
                    "on-primary-fixed-variant": "#005236",
                    "surface-container-low": "#f0f3ff",
                    "on-surface": "#151c27",
                    "on-background": "#151c27",
                    "error": "#ba1a1a",
                    "on-primary-fixed": "#002113",
                    "surface-tint": "#006c49",
                    "on-error": "#ffffff",
                    "on-secondary-fixed-variant": "#0b513d",
                    "inverse-surface": "#2a313d",
                    "primary": "#006c49",
                    "surface-variant": "#dce2f3",
                    "primary-fixed": "#6ffbbe",
                    "tertiary-fixed": "#d9e6dd",
                    "secondary": "#2b6954",
                    "error-container": "#ffdad6",
                    "on-primary": "#ffffff",
                    "on-primary-container": "#00422b",
                    "surface-bright": "#f9f9ff",
                    "primary-fixed-dim": "#4edea3",
                    "on-secondary-container": "#306d58",
                    "surface-container-highest": "#dce2f3",
                    "primary-container": "#10b981",
                    "outline-variant": "#bbcabf",
                    "surface-container-lowest": "#ffffff",
                    "inverse-primary": "#4edea3",
                    "secondary-fixed-dim": "#95d3ba",
                    "outline": "#6c7a71",
                    "on-error-container": "#93000a",
                    "surface-dim": "#d3daea",
                    "inverse-on-surface": "#ebf1ff",
                    "on-tertiary": "#ffffff",
                    "on-tertiary-container": "#303c36"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "2xl": "1.5rem",
                    "full": "9999px"
            },
            "spacing": {
                    "container-max": "1440px",
                    "gutter": "24px",
                    "margin-mobile": "16px",
                    "unit": "4px",
                    "margin-desktop": "40px"
            },
            "fontFamily": {
                    "headline-xl": ["Inter"],
                    "label-sm": ["Inter"],
                    "body-md": ["Inter"],
                    "label-md": ["Inter"],
                    "body-lg": ["Inter"],
                    "body-sm": ["Inter"],
                    "headline-lg": ["Inter"],
                    "headline-md": ["Inter"],
                    "headline-lg-mobile": ["Inter"]
            },
            "fontSize": {
                    "headline-xl": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "label-sm": ["12px", {"lineHeight": "16px", "fontWeight": "500"}],
                    "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "label-md": ["14px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
                    "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                    "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                    "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                    "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                    "headline-lg-mobile": ["24px", {"lineHeight": "32px", "fontWeight": "600"}]
            }
          },
        },
      }

// Interactive UI Scripts
// Micro-interaction: Simulated Login
        const form = document.querySelector('form');
        const feedback = document.getElementById('login-feedback');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            feedback.classList.remove('opacity-0', 'pointer-events-none');
            feedback.querySelector('div').classList.remove('scale-90');
            feedback.querySelector('div').classList.add('scale-100');
            
            // Simulation of redirect
            setTimeout(() => {
                feedback.querySelector('h3').textContent = "Success";
                feedback.querySelector('p').textContent = "Redirecting to Dashboard...";
            }, 1500);
        });

        // Toggle Password Visibility logic
        const toggleBtn = document.querySelector('button[type="button"]');
        const passInput = document.getElementById('password');
        toggleBtn.addEventListener('click', () => {
            const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passInput.setAttribute('type', type);
            toggleBtn.querySelector('span').textContent = type === 'password' ? 'visibility' : 'visibility_off';
        });