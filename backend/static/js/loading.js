let __globalLoadingTimeout = null;

function showLoading(message = 'در حال بارگذاری') {
    // اگر قبلاً لودینگ باز بوده، ببند
    hideLoading();

    const loadingHTML = `
        <div class="loading-overlay" id="pageLoading">
            <div class="loading-container">
                <div class="loading-circle">
                    <div class="loading-lightning">
                        <div class="lightning-bolt"></div>
                        <div class="lightning-bolt"></div>
                        <div class="lightning-bolt"></div>
                        <div class="lightning-bolt"></div>
                    </div>
                </div>
                <div class="loading-text">
                    ${message}<span class="loading-dots"></span>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingHTML);

    // فِیل‌سیف: اگر به هر دلیل hideLoading صدا نشد، بعد از ۱۵ ثانیه خودش بسته شود
    if (__globalLoadingTimeout) {
        clearTimeout(__globalLoadingTimeout);
    }
    __globalLoadingTimeout = setTimeout(() => {
        hideLoading();
    }, 15000);
}

function hideLoading() {
    const loading = document.getElementById('pageLoading');
    if (loading) {
        loading.classList.add('hide');
        setTimeout(() => {
            loading.remove();
        }, 300);
    }

    if (__globalLoadingTimeout) {
        clearTimeout(__globalLoadingTimeout);
        __globalLoadingTimeout = null;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // فقط اگر لودینگی از قبل باقی مانده، آن را مخفی کن
    hideLoading();

    // یک‌بار دیگر با تاخیر کوتاه برای اطمینان
    setTimeout(() => {
        hideLoading();
    }, 100);
});

window.addEventListener('load', function() {
    hideLoading();
});

