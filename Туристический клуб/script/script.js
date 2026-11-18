'use strict';

/* =========================================================
   Утилита: объявление для скринридера (aria-live)
   ========================================================= */
const srAnnouncer = document.getElementById('srAnnouncer');

function announce(message) {
    if (!srAnnouncer) return;
    // Очищаем и ставим с задержкой, чтобы скринридер озвучил повторно
    srAnnouncer.textContent = '';
    setTimeout(() => {
        srAnnouncer.textContent = message;
    }, 100);
}

/* =========================================================
   1. ТЕМА
   ========================================================= */
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme');

function applyTheme(isDark) {
    document.body.classList.toggle('dark', isDark);
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute(
        'aria-label',
        isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'
    );
    themeToggle.firstElementChild.textContent = isDark ? '☀️' : '🌙';
}

applyTheme(savedTheme === 'dark');

themeToggle.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark');
    applyTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    announce(isDark ? 'Включена тёмная тема' : 'Включена светлая тема');
});

/* =========================================================
   2. БУРГЕР-МЕНЮ
   ========================================================= */
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

burger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
});

document.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Открыть меню');
    });
});

/* Закрытие по Escape */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
    }
});

/* =========================================================
   3. ФИЛЬТР ТУРОВ
   ========================================================= */
const filterBtns = document.querySelectorAll('.filter__btn');
const cards = document.querySelectorAll('.card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        const filter = btn.dataset.filter;
        let visibleCount = 0;

        cards.forEach(card => {
            const match = filter === 'all' || card.dataset.category === filter;
            card.classList.toggle('hidden', !match);
            if (match) visibleCount++;
        });

        const label = btn.textContent.trim();
        announce(
            filter === 'all'
                ? `Показаны все туры: ${visibleCount}`
                : `Категория «${label}»: найдено туров — ${visibleCount}`
        );
    });
});

/* =========================================================
   4. АНИМИРОВАННЫЙ СЧЁТЧИК
   ========================================================= */
const counters = document.querySelectorAll('.stat__num');
let countersStarted = false;

function animateCounters() {
    counters.forEach(counter => {
        const target = +counter.dataset.count;
        const duration = 1500;
        const start = performance.now();

        function update(now) {
            const progress = Math.min((now - start) / duration, 1);
            counter.textContent = Math.floor(progress * target);
            if (progress < 1) requestAnimationFrame(update);
            else counter.textContent = target;
        }
        requestAnimationFrame(update);
    });
    announce('Статистика клуба: 15 лет опыта, 500 походов, 3000 туристов');
}

const statsSection = document.querySelector('.about__stats');
if (statsSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersStarted) {
                countersStarted = true;
                animateCounters();
            }
        });
    }, { threshold: 0.4 });
    observer.observe(statsSection);
}

/* =========================================================
   5. ВАЛИДАЦИЯ ФОРМ
   ========================================================= */
const form = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

function setError(field, message) {
    const errorEl = document.getElementById(field.getAttribute('aria-describedby'));
    if (errorEl) errorEl.textContent = message;
    field.classList.toggle('invalid', Boolean(message));
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function validatePhone(value) {
    return /^\+?\d[\d\s\-()]{9,}$/.test(value.trim());
}
function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let valid = true;
        let firstInvalid = null;

        const name = document.getElementById('name');
        const phone = document.getElementById('phone');
        const email = document.getElementById('email');

        if (name.value.trim().length < 2) {
            setError(name, 'Введите имя, минимум 2 символа');
            valid = false;
            firstInvalid = firstInvalid || name;
        } else setError(name, '');

        if (!validatePhone(phone.value)) {
            setError(phone, 'Введите корректный номер телефона');
            valid = false;
            firstInvalid = firstInvalid || phone;
        } else setError(phone, '');

        if (!validateEmail(email.value)) {
            setError(email, 'Введите корректный email, например mail@example.com');
            valid = false;
            firstInvalid = firstInvalid || email;
        } else setError(email, '');

        if (valid) {
            form.reset();
            formSuccess.classList.add('show');
            announce('Заявка отправлена. Спасибо!');
            setTimeout(() => formSuccess.classList.remove('show'), 5000);
        } else {
            announce('Форма содержит ошибки. Проверьте поля.');
            if (firstInvalid) firstInvalid.focus();
        }
    });

    ['name', 'phone', 'email'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('input', () => setError(el, ''));
    });
}

/* =========================================================
   6. МОДАЛЬНОЕ ОКНО + ФОКУС-ЛОВУШКА
   ========================================================= */
const modal = document.getElementById('modal');
const openModalBtn = document.getElementById('openModal');
const closeEls = modal.querySelectorAll('[data-close]');
let lastFocused = null;

const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
].join(',');

function openModal() {
    lastFocused = document.activeElement;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const focusable = modal.querySelectorAll(FOCUSABLE);
    if (focusable.length) focusable[0].focus();
    announce('Открыто диалоговое окно «Заказать звонок»');
}

function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocused) lastFocused.focus();
    announce('Диалоговое окно закрыто');
}

openModalBtn.addEventListener('click', openModal);
closeEls.forEach(el => el.addEventListener('click', closeModal));

/* Escape + фокус-ловушка внутри модалки */
document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;

    if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
    }

    if (e.key === 'Tab') {
        const focusable = Array.from(modal.querySelectorAll(FOCUSABLE))
            .filter(el => el.offsetParent !== null);
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
});

/* =========================================================
   7. ФОРМА В МОДАЛКЕ
   ========================================================= */
const modalForm = document.getElementById('modalForm');
const modalPhone = document.getElementById('modalPhone');

modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('modalPhone-error');

    if (!validatePhone(modalPhone.value)) {
        errorEl.textContent = 'Введите корректный номер телефона';
        modalPhone.classList.add('invalid');
        modalPhone.setAttribute('aria-invalid', 'true');
        modalPhone.focus();
        return;
    }

    errorEl.textContent = '';
    modalPhone.classList.remove('invalid');
    modalPhone.setAttribute('aria-invalid', 'false');
    modalPhone.value = '';
    closeModal();
    showToast('Спасибо! Мы скоро перезвоним.');
});

modalPhone.addEventListener('input', () => {
    const errorEl = document.getElementById('modalPhone-error');
    errorEl.textContent = '';
    modalPhone.classList.remove('invalid');
    modalPhone.setAttribute('aria-invalid', 'false');
});

/* =========================================================
   8. TOAST-уведомление (aria-live, не alert)
   ========================================================= */
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%) translateY(100px)',
        background: '#2e7d32',
        color: '#fff',
        padding: '14px 28px',
        borderRadius: '50px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        zIndex: '999',
        fontWeight: '600',
        transition: 'transform 0.4s ease, opacity 0.4s ease',
        opacity: '0',
        maxWidth: '90%'
    });
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
    });

    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

/* =========================================================
   9. КНОПКИ "ПОДРОБНЕЕ"
   ========================================================= */
document.querySelectorAll('.card__btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const card = btn.closest('.card');
        const title = card.querySelector('.card__title').textContent;
        announce(`Открывается форма заявки для тура «${title}»`);
        openModal();
    });
});
/* =========================================================
   10. МАСШТАБ ТЕКСТА (A− / A+ / ↺)
   ========================================================= */
const fontSteps = ['small', 'normal', 'large', 'xlarge', 'xxlarge'];
const fontLabels = {
    small:   'маленький',
    normal:  'обычный',
    large:   'большой',
    xlarge:  'очень большой',
    xxlarge: 'максимальный'
};

const htmlEl = document.documentElement;
const fontIncrease = document.getElementById('fontIncrease');
const fontDecrease = document.getElementById('fontDecrease');
const fontReset = document.getElementById('fontReset');

let currentFontIndex = fontSteps.indexOf('normal');

function applyFontSize(index) {
    currentFontIndex = Math.max(0, Math.min(fontSteps.length - 1, index));
    const size = fontSteps[currentFontIndex];
    htmlEl.setAttribute('data-font-size', size);
    localStorage.setItem('fontSize', size);

    if (fontDecrease) fontDecrease.disabled = currentFontIndex === 0;
    if (fontIncrease) fontIncrease.disabled = currentFontIndex === fontSteps.length - 1;

    announce(`Размер текста: ${fontLabels[size]}`);
}

const savedFont = localStorage.getItem('fontSize');
if (savedFont && fontSteps.includes(savedFont)) {
    applyFontSize(fontSteps.indexOf(savedFont));
} else {
    applyFontSize(fontSteps.indexOf('normal'));
}

if (fontIncrease) fontIncrease.addEventListener('click', () => applyFontSize(currentFontIndex + 1));
if (fontDecrease) fontDecrease.addEventListener('click', () => applyFontSize(currentFontIndex - 1));
if (fontReset)    fontReset.addEventListener('click', () => applyFontSize(fontSteps.indexOf('normal')));

/* =========================================================
   11. ОЗВУЧИВАНИЕ СТРАНИЦЫ НА РУССКОМ (Web Speech API)
   ========================================================= */
const speakBtn = document.getElementById('speakBtn');
const synth = window.speechSynthesis;
const speechSupported = 'speechSynthesis' in window;

if (!speechSupported && speakBtn) {
    speakBtn.disabled = true;
    speakBtn.setAttribute('aria-label', 'Озвучивание не поддерживается вашим браузером');
    speakBtn.title = 'Ваш браузер не поддерживает озвучивание';
}

let russianVoice = null;

function pickRussianVoice() {
    if (!speechSupported) return;
    const voices = synth.getVoices();
    russianVoice =
        voices.find(v => v.lang === 'ru-RU') ||
        voices.find(v => v.lang && v.lang.startsWith('ru')) ||
        null;
}

if (speechSupported) {
    pickRussianVoice();
    if (typeof synth.onvoiceschanged !== 'undefined') {
        synth.onvoiceschanged = pickRussianVoice;
    }
}

function collectPageText() {
    const parts = [];
    parts.push(document.title);

    const heroTitle = document.querySelector('.hero__title');
    const heroSubtitle = document.querySelector('.hero__subtitle');
    if (heroTitle) parts.push(heroTitle.textContent.trim());
    if (heroSubtitle) parts.push(heroSubtitle.textContent.trim());

    document.querySelectorAll('.section__title').forEach(h => {
        parts.push(h.textContent.trim());
    });

    document.querySelectorAll('.card').forEach(card => {
        const title = card.querySelector('.card__title')?.textContent.trim();
        const desc  = card.querySelector('.card__desc')?.textContent.trim();
        const price = card.querySelector('.card__price')?.textContent.trim();
        if (title) parts.push(title);
        if (desc)  parts.push(desc);
        if (price) parts.push(price.replace(/\s+/g, ' '));
    });

    document.querySelectorAll('.about__text p').forEach(p => {
        parts.push(p.textContent.trim());
    });

    const stats = [];
    document.querySelectorAll('.stat').forEach(stat => {
        const num = stat.querySelector('.stat__num')?.textContent.trim();
        const label = stat.querySelector('.stat__label')?.textContent.trim();
        if (num && label) stats.push(`${num} ${label}`);
    });
    if (stats.length) parts.push('Статистика клуба: ' + stats.join(', '));

    const footerContacts = document.querySelectorAll('.footer__col:nth-child(2) p');
    if (footerContacts.length) {
        parts.push('Контакты');
        footerContacts.forEach(p => parts.push(p.textContent.trim()));
    }

    return parts
        .map(t => t.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('. ');
}

let isSpeaking = false;
let currentUtterance = null;

function stopSpeaking() {
    if (!speechSupported || !speakBtn) return;
    synth.cancel();
    isSpeaking = false;
    speakBtn.setAttribute('aria-pressed', 'false');
    speakBtn.setAttribute('aria-label', 'Озвучить текст страницы');
    speakBtn.classList.remove('active');
    announce('Озвучивание остановлено');
}

function startSpeaking() {
    if (!speechSupported || !speakBtn) return;

    if (isSpeaking) { stopSpeaking(); return; }

    synth.cancel();

    const text = collectPageText();
    if (!text) { announce('Не найден текст для озвучивания'); return; }

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = 'ru-RU';
    currentUtterance.rate = 0.95;
    currentUtterance.pitch = 1;
    currentUtterance.volume = 1;

    if (russianVoice) currentUtterance.voice = russianVoice;

    currentUtterance.onstart = () => {
        isSpeaking = true;
        speakBtn.setAttribute('aria-pressed', 'true');
        speakBtn.setAttribute('aria-label', 'Остановить озвучивание');
        speakBtn.classList.add('active');
        announce('Начато озвучивание страницы на русском языке');
    };

    currentUtterance.onend = () => {
        isSpeaking = false;
        speakBtn.setAttribute('aria-pressed', 'false');
        speakBtn.setAttribute('aria-label', 'Озвучить текст страницы');
        speakBtn.classList.remove('active');
        announce('Озвучивание завершено');
    };

    currentUtterance.onerror = (e) => {
        if (e.error !== 'interrupted') announce('Ошибка озвучивания: ' + e.error);
        isSpeaking = false;
        speakBtn.setAttribute('aria-pressed', 'false');
        speakBtn.setAttribute('aria-label', 'Озвучить текст страницы');
        speakBtn.classList.remove('active');
    };

    synth.speak(currentUtterance);
}

if (speakBtn) speakBtn.addEventListener('click', startSpeaking);

window.addEventListener('beforeunload', () => {
    if (speechSupported) synth.cancel();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isSpeaking) stopSpeaking();
});

/* =========================================================
   12. ОТПРАВКА ФОРМЫ НА ПОЧТУ (FormSubmit)
   =========================================================
   ВАЖНО: в index.html в теге <form action="...">
   замените email на свой.
   При первой отправке FormSubmit попросит подтвердить email
   (придёт письмо — нажмите «Activate Form»).
   ========================================================= */
(function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const successMsg = document.getElementById('formSuccess');
    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Валидация
        const name = document.getElementById('name');
        const phone = document.getElementById('phone');
        const email = document.getElementById('email');
        let valid = true;
        let firstInvalid = null;

        if (name.value.trim().length < 2) {
            setError(name, 'Введите имя, минимум 2 символа');
            valid = false;
            firstInvalid = firstInvalid || name;
        } else setError(name, '');

        if (!validatePhone(phone.value)) {
            setError(phone, 'Введите корректный номер телефона');
            valid = false;
            firstInvalid = firstInvalid || phone;
        } else setError(phone, '');

        if (!validateEmail(email.value)) {
            setError(email, 'Введите корректный email');
            valid = false;
            firstInvalid = firstInvalid || email;
        } else setError(email, '');

        if (!valid) {
            announce('Форма содержит ошибки. Проверьте поля.');
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        // Отправка через FormSubmit (AJAX)
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправка...';

        try {
            const formData = new FormData(contactForm);
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                contactForm.reset();
                if (successMsg) {
                    successMsg.classList.add('show');
                    setTimeout(() => successMsg.classList.remove('show'), 5000);
                }
                announce('Заявка отправлена. Спасибо!');
                showToast('Спасибо! Заявка отправлена на почту.');
            } else {
                throw new Error('Ошибка сервера');
            }
        } catch (err) {
            announce('Не удалось отправить заявку');
            showToast('Ошибка отправки. Попробуйте позже.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
})();