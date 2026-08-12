document.addEventListener('DOMContentLoaded', async () => {
    await MenuBuilder.buildTopMenu();
    await MenuBuilder.buildMainMenu();
    await MenuBuilder.buildMobileMenu();
    MenuBuilder.setupMobileMenuToggle();
    MenuBuilder.buildFavoriteMenu();
    await MenuBuilder.buildSidebarMenu();
    await MenuBuilder.buildUsefulLinksMenu();
    await MenuBuilder.buildTagsCloud();
    
    const R = new Router(), SE = new SearchEngine();
    const st = document.getElementById('sidebarToggle'), sb = document.getElementById('sidebar'), sc = document.getElementById('sidebarClose'), so = document.getElementById('sidebarOverlay');
    const sH = document.querySelector('.site-header'), tM = document.getElementById('topMenu'), mMM = document.getElementById('mobileMainMenu');
    
    const open = () => {
        sb.classList.add('active'); so.classList.add('active'); document.body.classList.add('sidebar-open'); st.classList.add('active');
        if (window.innerWidth <= 768) {
            if (sH) sH.style.display = 'none';
            if (tM) tM.style.display = 'none';
            if (mMM) { mMM.classList.remove('open'); mMM.style.maxHeight = '0'; const tb = document.getElementById('mobileMenuToggle'); if (tb) tb.classList.remove('open'); mMM.style.display = 'none'; }
        }
    };
    const close = () => {
        sb.classList.remove('active'); so.classList.remove('active'); document.body.classList.remove('sidebar-open'); st.classList.remove('active');
        if (window.innerWidth <= 768) {
            if (sH) sH.style.display = '';
            if (tM) tM.style.display = '';
            if (mMM) mMM.style.display = '';
        }
    };
    
    st?.addEventListener('click', () => sb.classList.contains('active') ? close() : open());
    sc?.addEventListener('click', close); so?.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sb.classList.contains('active')) close(); });
    sb.addEventListener('click', (e) => { if (e.target.closest('a[href]') && window.innerWidth <= 768) setTimeout(close, 200); });
    window.addEventListener('resize', () => { if (window.innerWidth > 768) { if (sH) sH.style.display = ''; if (tM) tM.style.display = ''; if (mMM) mMM.style.display = ''; } });
    
    const si = document.getElementById('searchInput'), sbtn = document.getElementById('searchButton'), sr = document.getElementById('searchResults');
    if (si) {
        si.addEventListener('input', () => {
            const q = si.value.trim();
            if (SE.searchTimeout) clearTimeout(SE.searchTimeout);
            if (q.length >= SE.minSearchLength) {
                SE.searchTimeout = setTimeout(async () => {
                    if (sr) { sr.innerHTML = '<div class="search-loading">در حال جستجو...</div>'; sr.style.display = 'block'; }
                    try { const { results, total } = await SE.search(q); SE.renderSidebarResults(results, total, q); } catch (e) { if (sr) { sr.innerHTML = '<div class="no-results">خطا</div>'; sr.style.display = 'block'; } }
                }, 300);
            } else { if (sr) { sr.style.display = 'none'; sr.innerHTML = ''; } }
        });
        si.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); const q = si.value.trim(); if (q.length >= SE.minSearchLength) { R.navigate(`?search=${encodeURIComponent(q)}`); if (sr) sr.style.display = 'none'; si.value = ''; if (window.innerWidth <= 768) close(); } } });
    }
    sbtn?.addEventListener('click', () => { const q = si.value.trim(); if (q.length >= SE.minSearchLength) { R.navigate(`?search=${encodeURIComponent(q)}`); if (sr) sr.style.display = 'none'; si.value = ''; if (window.innerWidth <= 768) close(); } });
    document.addEventListener('click', (e) => { if (!e.target.closest('.search-widget') && sr) sr.style.display = 'none'; });
    document.addEventListener('click', async (e) => {
        const t = e.target.closest('[data-page]'); if (t) { e.preventDefault(); const p = t.dataset.page; document.querySelectorAll('.horizontal-menu a').forEach(a => a.classList.remove('active')); t.classList.add('active'); if (p === 'home' || p === 'all-posts') R.navigate(''); else R.navigate(`?page_slug=${encodeURIComponent(p)}`); }
        const f = e.target.closest('[data-favorites]'); if (f) { e.preventDefault(); R.navigate('?favorites=all'); }
    });
    document.addEventListener('click', async (e) => { const pl = e.target.closest('[data-post]'); if (pl) { e.preventDefault(); const s = pl.dataset.post; if (s) { R.navigate(`?post=${encodeURIComponent(s)}`); window.scrollTo({ top: 0, behavior: 'smooth' }); if (window.innerWidth <= 768) close(); } } });
    document.querySelector('.site-title a')?.addEventListener('click', (e) => { e.preventDefault(); R.navigate(''); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    document.querySelector('.site-subtitle a')?.addEventListener('click', (e) => { e.preventDefault(); R.navigate(''); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    document.addEventListener('click', (e) => { const al = e.target.closest('.all-posts-link'); if (al) { e.preventDefault(); R.navigate(''); window.scrollTo({ top: 0, behavior: 'smooth' }); if (window.innerWidth <= 768) close(); } });

    const dmBtn = document.createElement('button');
    dmBtn.innerHTML = '🌓'; dmBtn.title = 'تغییر حالت تاریک/روشن';
    dmBtn.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:9999;width:45px;height:45px;border-radius:50%;border:none;background:#0d9488;color:white;font-size:1.3rem;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:all 0.3s;display:flex;align-items:center;justify-content:center';
    dmBtn.addEventListener('mouseenter', () => { dmBtn.style.transform = 'scale(1.1)'; });
    dmBtn.addEventListener('mouseleave', () => { dmBtn.style.transform = 'scale(1)'; });
    dmBtn.addEventListener('click', () => { document.body.classList.toggle('dark-mode'); const isDark = document.body.classList.contains('dark-mode'); localStorage.setItem('darkMode', isDark ? 'true' : 'false'); dmBtn.innerHTML = isDark ? '☀️' : '🌓'; });
    document.body.appendChild(dmBtn);
    if (localStorage.getItem('darkMode') === 'true') { document.body.classList.add('dark-mode'); dmBtn.innerHTML = '☀️'; }

    const stBtn = document.createElement('button');
    stBtn.innerHTML = '⬆️'; stBtn.title = 'بازگشت به بالا';
    stBtn.style.cssText = 'position:fixed;bottom:75px;left:20px;z-index:9999;width:45px;height:45px;border-radius:50%;border:none;background:#0d9488;color:white;font-size:1.3rem;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:all 0.3s;opacity:0;visibility:hidden;display:flex;align-items:center;justify-content:center';
    stBtn.addEventListener('mouseenter', () => { stBtn.style.transform = 'scale(1.1)'; });
    stBtn.addEventListener('mouseleave', () => { stBtn.style.transform = 'scale(1)'; });
    stBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    document.body.appendChild(stBtn);
    let stTimeout;
    window.addEventListener('scroll', () => {
        if (stTimeout) clearTimeout(stTimeout);
        stTimeout = setTimeout(() => {
            if (window.scrollY > 500) { stBtn.style.opacity = '1'; stBtn.style.visibility = 'visible'; }
            else { stBtn.style.opacity = '0'; stBtn.style.visibility = 'hidden'; }
        }, 100);
    });
});