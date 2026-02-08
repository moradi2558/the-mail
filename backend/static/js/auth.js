const API_BASE_URL = '/api/account';

document.addEventListener('DOMContentLoaded', function() {
    const loginTab = document.querySelector('[data-tab="login"]');
    const registerTab = document.querySelector('[data-tab="register"]');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginFormElement = document.getElementById('loginFormElement');
    const registerFormElement = document.getElementById('registerFormElement');
    const closeBtn = document.getElementById('closeBtn');

    function switchTab(tab) {
        if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        } else {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        }
        clearErrors();
    }

    loginTab.addEventListener('click', () => switchTab('login'));
    registerTab.addEventListener('click', () => switchTab('register'));

    function showError(formId, message) {
        const errorDiv = document.getElementById(`${formId}Error`);
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 5000);
    }

    function clearErrors() {
        document.getElementById('loginError').classList.remove('show');
        document.getElementById('registerError').classList.remove('show');
    }

    function saveToken(accessToken, refreshToken) {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
    }

    function redirectToHome() {
        window.location.href = '/inbox/';
    }

    loginFormElement.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        const submitBtn = loginFormElement.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'در حال ورود...';

        try {
            const response = await fetch(`${API_BASE_URL}/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.data && data.data.tokens) {
                    saveToken(data.data.tokens.access, data.data.tokens.refresh);
                    if (rememberMe) {
                        localStorage.setItem('remember_me', 'true');
                    }
                    showSuccess('ورود با موفقیت انجام شد');
                    setTimeout(() => {
                        redirectToHome();
                    }, 1000);
                } else {
                    showError('login', 'خطا در دریافت توکن');
                }
            } else {
                let errorMessage = 'خطا در ورود';
                if (data.error) {
                    errorMessage = data.error;
                } else if (data.email) {
                    errorMessage = data.email[0];
                } else if (data.password) {
                    errorMessage = data.password[0];
                } else if (data.non_field_errors) {
                    errorMessage = data.non_field_errors[0];
                }
                showError('login', errorMessage);
            }
        } catch (error) {
            console.error('Error:', error);
            showError('login', 'خطا در ارتباط با سرور');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'ورود';
        }
    });

    registerFormElement.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();

        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

        if (password !== passwordConfirm) {
            showError('register', 'رمزهای عبور مطابقت ندارند');
            return;
        }

        if (password.length < 8) {
            showError('register', 'رمز عبور باید حداقل 8 کاراکتر باشد');
            return;
        }

        const submitBtn = registerFormElement.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'در حال ثبت‌نام...';

        try {
            const response = await fetch(`${API_BASE_URL}/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    password_confirm: passwordConfirm
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (data.data && data.data.tokens) {
                    saveToken(data.data.tokens.access, data.data.tokens.refresh);
                    showSuccess('ثبت‌نام با موفقیت انجام شد');
                    setTimeout(() => {
                        window.location.href = '/login/';
                    }, 1500);
                } else {
                    showError('register', 'خطا در دریافت توکن');
                }
            } else {
                let errorMessage = 'خطا در ثبت‌نام';
                if (data.error) {
                    errorMessage = data.error;
                } else if (data.email) {
                    errorMessage = data.email[0];
                } else if (data.password) {
                    errorMessage = data.password[0];
                } else if (data.non_field_errors) {
                    errorMessage = data.non_field_errors[0];
                }
                showError('register', errorMessage);
            }
        } catch (error) {
            console.error('Error:', error);
            showError('register', 'خطا در ارتباط با سرور');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'ثبت‌نام';
        }
    });

    function showSuccess(message) {
        const loginError = document.getElementById('loginError');
        const registerError = document.getElementById('registerError');
        const activeError = loginForm.classList.contains('active') ? loginError : registerError;
        
        activeError.textContent = message;
        activeError.style.background = 'rgba(83, 52, 131, 0.3)';
        activeError.style.borderColor = 'var(--arcane-purple)';
        activeError.classList.add('show');
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            window.location.href = '/';
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'register') {
        switchTab('register');
    }
});

