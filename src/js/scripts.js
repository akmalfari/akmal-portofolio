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