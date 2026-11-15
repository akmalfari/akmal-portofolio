/*!
* Start Bootstrap - Personal v1.0.1 (https://startbootstrap.com/template-overviews/personal)
* Copyright 2013-2026 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-personal/blob/master/LICENSE)
*/
// Kirim form kontak tanpa pindah halaman, lalu tampilkan pesan berhasil/gagal.
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    const submitButton = document.getElementById('submitButton');
    const successMessage = document.getElementById('submitSuccess');
    const errorMessage = document.getElementById('submitError');

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        successMessage.classList.add('d-none');
        errorMessage.classList.add('d-none');
        submitButton.disabled = true;
        submitButton.textContent = 'Mengirim...';

        try {
            const response = await fetch(contactForm.dataset.ajaxUrl, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: new FormData(contactForm),
            });
            const result = await response.json();

            if (response.ok && String(result.success) === 'true') {
                contactForm.reset();
                successMessage.classList.remove('d-none');
            } else {
                throw new Error(result.message || 'Gagal mengirim');
            }
        } catch (error) {
            errorMessage.classList.remove('d-none');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit';
        }
    });
}

const mainNav = document.getElementById('mainNav');

if (mainNav) {
    const pageName = (window.location.pathname.split('/').pop() || 'index.html').replace('.html', '');
    const activeLink = mainNav.querySelector(`[data-page="${pageName}"]`);
    activeLink?.classList.add('is-active');
    activeLink?.setAttribute('aria-current', 'page');

    let frameId;
    const updateNav = () => {
        const isDesktop = window.innerWidth >= 768;
        mainNav.classList.toggle('is-scrolled', window.scrollY > 0);

        if (isDesktop && window.scrollY > 0) {
            const progress = Math.min(window.scrollY / 1000, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            const maximum = Math.min(window.innerWidth * .8, 1024);
            const minimum = 528;
            mainNav.style.width = `${maximum - (maximum - minimum) * eased}px`;
        } else {
            mainNav.style.removeProperty('width');
        }
        frameId = null;
    };

    const requestNavUpdate = () => {
        if (!frameId) frameId = requestAnimationFrame(updateNav);
    };

    updateNav();
    window.addEventListener('scroll', requestNavUpdate, { passive: true });
    window.addEventListener('resize', requestNavUpdate);
}
