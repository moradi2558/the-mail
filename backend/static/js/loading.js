function showLoading(message = 'در حال بارگذاری') {
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
}

function hideLoading() {
    const loading = document.getElementById('pageLoading');
    if (loading) {
        loading.classList.add('hide');
        setTimeout(() => {
            loading.remove();
        }, 300);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    hideLoading();
    
    setTimeout(() => {
        hideLoading();
    }, 100);
    
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !this.hasAttribute('target') && !href.includes('#')) {
                const targetUrl = new URL(href, window.location.origin);
                const currentUrl = new URL(window.location.href);
                if (targetUrl.pathname !== currentUrl.pathname) {
                    showLoading('در حال انتقال');
                }
            }
        });
    });
    
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            if (!form.id || form.id !== 'composeForm') {
                showLoading('در حال ارسال');
            }
        });
    });
});

window.addEventListener('load', function() {
    hideLoading();
});

