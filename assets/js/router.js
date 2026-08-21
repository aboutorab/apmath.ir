class Router {
    constructor(){this.cp=1;this.ct=null;this.cpo=null;this.cps=null;this.cs=null;this.cf=null;this.cfp=1;this.jsn=null;this.se=new SearchEngine();this.as=[];this.ass=[];this.init()}
    init(){this.parseURL();this.handleRoute();window.addEventListener('popstate',()=>{this.parseURL();this.handleRoute()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('reader-mode'))this.exitReaderMode()})}
    parseURL(){const p=new URLSearchParams(window.location.search);this.cp=parseInt(p.get('page'))||1;this.ct=p.get('tag')||null;this.cpo=p.get('post')||null;this.cps=p.get('page_slug')||null;this.cs=p.get('search')||null;this.cf=p.get('favorites')||null;this.cfp=parseInt(p.get('favpage'))||1;this.jsn=p.get('jsn')||null}
    navigate(qs){const nu=qs?`index.html${qs}`:'index.html';window.history.pushState({},'',nu);this.parseURL();this.handleRoute()}
    showJSNError(mc){mc.innerHTML=`<div class="error-message" style="text-align:center;padding:40px"><p style="font-size:1.5rem;margin-bottom:15px">⚠️ پارامتر jsn اجباری است</p><p style="color:#666;margin-bottom:20px">برای نمایش این محتوا، پارامتر <code>jsn</code> باید در آدرس مرورگر مشخص شده باشد.<br>مثلاً: <code>index.html?post=plot&jsn=1405</code></p><a href="index.html" style="display:inline-block;background:#0d9488;color:white;border:none;padding:10px 25px;border-radius:8px;cursor:pointer;font-family:Vazirmatn;font-size:.95rem;text-decoration:none" onmouseenter="this.style.background='#0f766e'" onmouseleave="this.style.background='#0d9488'">🏠 بازگشت به صفحه اصلی</a></div>`}
    async handleRoute(){
        const mc=document.getElementById('mainContent');mc.innerHTML='<div class="loading">در حال بارگذاری...</div>';this.cleanupPostCode();BlogEngine.loadExternalScripts();
        if(this.cf==='all')await this.loadFavoritesPage();
        else if(this.cpo){if(!this.jsn){this.showJSNError(mc);return}await this.loadFullPost(this.cpo,this.jsn)}
        else if(this.cps&&this.cps!=='home'){if(!this.jsn){this.showJSNError(mc);return}await this.loadStaticPage(this.cps,this.jsn)}
        else if(this.cs)await this.loadSearchResults(this.cs);
        else if(this.ct)await this.loadPostsByTag(this.ct);
        else await this.loadHomepage();
    }
    cleanupPostCode(){this.as.forEach(el=>el?.remove());this.as=[];this.ass.forEach(el=>el?.remove());this.ass=[]}
    extractCodeFromContent(hc,pm){const scripts=[],styles=[];let clean=hc;const sre=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;let sm;while((sm=sre.exec(hc))!==null){const srcM=sm[1].match(/src=["']([^"']+)["']/i);scripts.push({type:srcM?'external':'inline',src:srcM?srcM[1]:null,content:sm[2].trim()});clean=clean.replace(sm[0],'')}const cre=/<style\b[^>]*>([\s\S]*?)<\/style>/gi;let stm;while((stm=cre.exec(hc))!==null){styles.push({type:'inline',content:stm[1].trim()});clean=clean.replace(stm[0],'')}if(pm?.file){const bfn=pm.file.replace(/\.html$/i,'');scripts.push({type:'external-file',src:this.getExternalFilePath(pm,`${bfn}.js`),content:null});styles.push({type:'external-file',src:this.getExternalFilePath(pm,`${bfn}.css`)})}return{cleanHtml:clean,scripts,styles}}
    getExternalFilePath(pm,fn){const sd=pm._postSubdir||pm._batchSubdir||'';return sd?`posts/${sd}/${fn}`:`posts/${fn}`}
    executeScripts(scripts,slug){for(const s of scripts){if(s.type==='inline'&&s.content){const se=document.createElement('script');se.textContent=s.content;se.dataset.postSlug=slug;document.body.appendChild(se);this.as.push(se)}else if(s.src){const se=document.createElement('script');se.src=s.src;se.dataset.postSlug=slug;document.body.appendChild(se);this.as.push(se)}}}
    applyStyles(styles,slug){for(const s of styles){if(s.src){const le=document.createElement('link');le.rel='stylesheet';le.href=s.src;le.dataset.postSlug=slug;document.head.appendChild(le);this.ass.push(le)}else if(s.content){const se=document.createElement('style');se.textContent=s.content;se.dataset.postSlug=slug;document.head.appendChild(se);this.ass.push(se)}}}

    async loadHomepage(){const mc=document.getElementById('mainContent');this.updateActiveMenu('home');try{const pp=await BlogEngine.loadPostsForPage(this.cp,10);if(pp.length===0&&this.cp>1){this.navigate('');return}if(pp.length===0&&this.cp===1){mc.innerHTML='<p class="no-posts">هیچ مطلبی نیست.</p>';document.getElementById('pagination').innerHTML='';return}await BlogEngine.resolvePostTitles(pp);await this.renderPostCards(pp);const pag=new Pagination(await BlogEngine.getTotalPostCount(),10);document.getElementById('pagination').style.display='flex';pag.render(this.cp,pg=>{const pm=new URLSearchParams();pm.set('page',pg);if(this.ct)pm.set('tag',this.ct);this.navigate(`?${pm.toString()}`)});await MenuBuilder.buildSidebarMenu();await MenuBuilder.buildTagsCloud()}catch(e){mc.innerHTML='<div class="error-message" style="text-align:center;padding:40px"><p style="font-size:1.5rem;margin-bottom:15px">⚠️ خطا در بارگذاری مطالب</p><button onclick="location.reload()" style="background:#0d9488;color:white;border:none;padding:10px 25px;border-radius:8px;cursor:pointer;font-family:Vazirmatn;font-size:.95rem">🔄 بارگذاری مجدد صفحه</button></div>'}}
    async loadPostsByTag(tag){const mc=document.getElementById('mainContent');mc.innerHTML=`<div class="loading">در حال بارگذاری پست‌های "${tag}"...</div>`;this.updateActiveMenu(null);try{const sp=BlogEngine.sortPosts(BlogEngine.getPostsByTag(await BlogEngine.loadAllPosts(),tag));if(!sp.length){mc.innerHTML='<p class="no-posts">هیچ مطلبی با این برچسب یافت نشد.</p>';document.getElementById('pagination').innerHTML='';return}const pag=new Pagination(sp.length,10);const pp=pag.getPageItems(sp,this.cp);await BlogEngine.resolvePostTitles(pp);await this.renderPostCards(pp);document.getElementById('pagination').style.display='flex';pag.render(this.cp,pg=>{this.navigate(`?page=${pg}&tag=${encodeURIComponent(tag)}`)})}catch(e){mc.innerHTML='<div class="error-message" style="text-align:center;padding:40px"><p style="font-size:1.5rem;margin-bottom:15px">⚠️ خطا در بارگذاری پست‌ها</p><button onclick="location.reload()" style="background:#0d9488;color:white;border:none;padding:10px 25px;border-radius:8px;cursor:pointer;font-family:Vazirmatn;font-size:.95rem">🔄 بارگذاری مجدد صفحه</button></div>'}}

    async loadFavoritesPage(){
        const mc=document.getElementById('mainContent');mc.innerHTML='<div class="loading">در حال بارگذاری...</div>';this.updateActiveMenu(null);
        try{
            const r=await fetch('data/favorite.json');if(!r.ok){mc.innerHTML='<p class="no-posts">خطا.</p>';return}
            const favs=await r.json();if(!favs?.length){mc.innerHTML='<p class="no-posts">هیچ مطلب منتخبی یافت نشد.</p>';document.getElementById('pagination').style.display='none';return}
            const sorted=favs.sort((a,b)=>b.id-a.id);
            const fp=this.cfp||1,per=10,totalPages=Math.ceil(sorted.length/per);
            const items=sorted.slice((fp-1)*per,fp*per);
            if(!items.length){this.navigate('?favorites=all');return}
            const posts=items.map(p=>({...p,slug:p.slug||BlogEngine.getSlugFromFile(p.file),_postSubdir:p.subdir||null,_batchSubdir:'',_hasPreviewFile:p.previewfile==='yes',date:p.date||'',time:p.time||''}));
            await BlogEngine.resolvePostTitles(posts);
            const results=await Promise.all(posts.map(async p=>{try{let ex,hm,dt;if(p._hasPreviewFile){const pc=await BlogEngine.loadPreviewContent(p);if(pc)return{p,ex:pc,hm:true,dt:p._previewTitle||BlogEngine.getDisplayTitle(p)}}const pd=await BlogEngine.loadPostContentByPost(p);if(!pd)return null;const ext=BlogEngine.extractExcerptAndFull(pd.content);return{p,ex:ext.excerpt,hm:ext.hasMore,dt:BlogEngine.getDisplayTitle(p)}}catch(e){return null}}));
            let html='';for(const r of results){if(r)html+=this.buildPostCardHTML(r.p,r.ex,r.hm,r.dt,true)}
            mc.innerHTML=html||'<p class="no-posts">هیچ مطلب منتخبی یافت نشد.</p>';
            if(totalPages>1){document.getElementById('pagination').style.display='flex';new Pagination(sorted.length,10).render(fp,pg=>this.navigate(`?favorites=all&favpage=${pg}`))}
            else document.getElementById('pagination').style.display='none';
            this.attachPostCardEvents();
        }catch(e){mc.innerHTML='<div class="error-message" style="text-align:center;padding:40px"><p style="font-size:1.5rem;margin-bottom:15px">⚠️ خطا در بارگذاری مطالب منتخب</p><button onclick="location.reload()" style="background:#0d9488;color:white;border:none;padding:10px 25px;border-radius:8px;cursor:pointer;font-family:Vazirmatn;font-size:.95rem">🔄 بارگذاری مجدد صفحه</button></div>'}
    }

    buildPostCardHTML(post,ex,hm,dt,isFav=false){
        const jsn=post._batchSubdir||post._postSubdir||'';
        const pu=`?post=${encodeURIComponent(post.slug)}${jsn?`&jsn=${encodeURIComponent(jsn)}`:''}`;
        const rt=BlogEngine.estimateReadingTime(ex||'');
        const dth=(()=>{const dp=post.date?DateConverter.toJalali(post.date):'';const tp=BlogEngine.formatTime(post.time);if(dp&&tp)return`<span class="post-date">${dp} - ${tp}</span>`;if(dp)return`<span class="post-date">${dp}</span>`;if(tp)return`<span class="post-date">${tp}</span>`;return''})();
        const badge=isFav?'<span class="fixed-badge" style="background:#f59e0b">⭐ منتخب</span>':(post.fixed==='yes'?'<span class="fixed-badge">📌 پست ثابت</span>':'');
        let imgHtml='';
        if(post.image){const ip=BlogEngine.getImagePath(post);if(ip.fallback){imgHtml=`<img src="${ip.primary}" alt="${post.alt||dt}" class="post-image" loading="lazy" onerror="if(!this.dataset.tried){this.dataset.tried='1';this.src='${ip.fallback}'}">`}else{imgHtml=`<img src="${ip.primary}" alt="${post.alt||dt}" class="post-image" loading="lazy">`}}
        return`<article class="post-card ${!isFav&&post.fixed==='yes'?'fixed-post':''}"><div class="post-meta"><div class="post-meta-left">${dth}${dth?' | ':''}<span class="reading-time">⏱️ ${rt}</span>${badge}</div>${isFav?'':this.createPostToolbar(post.slug)}</div><div class="post-title-row"><h2 class="post-title"><a href="${pu}" class="post-title-link" data-post-slug="${post.slug}" data-jsn="${jsn}">${dt}</a></h2></div>${imgHtml}<div class="post-excerpt" data-post-slug="${post.slug}">${ex}</div>${hm?`<a href="${pu}" class="read-more" data-post-slug="${post.slug}" data-jsn="${jsn}">ادامه مطلب</a>`:''}${post.tags?.length?`<div class="tags">${post.tags.map(t=>`<a href="?tag=${encodeURIComponent(t)}" class="tag" data-tag="${t}">${t}</a>`).join('')}</div>`:''}</article>`;
    }

    createPostToolbar(slug){return`<div class="post-toolbar" data-post-slug="${slug}"><button class="font-increase" title="افزایش فونت" data-action="font-increase">A⁺</button><button class="font-reset" title="بازنشانی فونت" data-action="font-reset">↺</button><button class="font-decrease" title="کاهش فونت" data-action="font-decrease">A⁻</button><button class="print-pdf" title="پرینت PDF" data-action="print-pdf">🖨️</button><button class="reader-mode-btn" title="نمایش کتابی" data-action="reader-mode">📖</button></div>`}
    adjustFontSize(slug,action){const ce=document.querySelector(`.post-content[data-post-slug="${slug}"]`)||document.querySelector(`.post-excerpt[data-post-slug="${slug}"]`);const ft=ce?.closest('.post-card, .full-post')?.querySelector('.post-title, .post-title-link, h1, h2')||document.querySelector(`.post-title-link[data-post-slug="${slug}"]`);if(ce){const cs=parseFloat(getComputedStyle(ce).fontSize);if(action==='font-increase')ce.style.fontSize=(cs+1)+'px';else if(action==='font-decrease'&&cs>10)ce.style.fontSize=(cs-1)+'px';else if(action==='font-reset')ce.style.fontSize=''}if(ft){const ts=parseFloat(getComputedStyle(ft).fontSize);if(action==='font-increase')ft.style.fontSize=(ts+1)+'px';else if(action==='font-decrease'&&ts>12)ft.style.fontSize=(ts-1)+'px';else if(action==='font-reset')ft.style.fontSize=''}}
    
    async printPDF(slug){
        const ce=document.querySelector(`.post-content[data-post-slug="${slug}"]`)||document.querySelector(`.post-excerpt[data-post-slug="${slug}"]`);
        if(!ce)return;
        try{
            const pc=ce.closest('.post-card, .full-post');
            const te=pc?pc.querySelector('.post-title, .post-title-link, h1, h2'):null;
            const pt=te?te.textContent.trim():'بدون عنوان';
            const td=document.createElement('div');
            td.style.cssText='padding:20px;background:#fff;font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl;text-align:right';
            const tc=document.createElement('h1');tc.textContent=pt;
            tc.style.cssText='font-size:24px;color:#0f766e;margin-bottom:20px;text-align:right;border-bottom:2px solid #0d9488;padding-bottom:10px';
            td.appendChild(tc);td.appendChild(ce.cloneNode(true));
            td.style.position='absolute';td.style.left='-9999px';td.style.top='0';td.style.width='700px';
            document.body.appendChild(td);
            const{jsPDF}=window.jspdf;const doc=new jsPDF('p','mm','a4');
            const canvas=await html2canvas(td,{scale:2,useCORS:true,allowTaint:true,backgroundColor:'#ffffff'});
            document.body.removeChild(td);
            const imgData=canvas.toDataURL('image/jpeg',0.95);
            const iw=190,ph=277,ih=(canvas.height*iw)/canvas.width;
            let hl=ih,pos=10;
            doc.addImage(imgData,'JPEG',10,pos,iw,ih);
            while((hl-=ph)>0){pos=hl-ih;doc.addPage();doc.addImage(imgData,'JPEG',10,pos,iw,ih)}
            doc.save(`post-${slug}.pdf`);
        }catch(e){alert('خطا در تولید PDF.')}
    }
    
    enterReaderMode(){document.body.classList.add('reader-mode');if(!document.querySelector('.reader-mode-exit')){const eb=document.createElement('button');eb.className='reader-mode-exit';eb.innerHTML='&times;';eb.title='خروج از حالت کتابی';eb.addEventListener('click',()=>this.exitReaderMode());document.body.appendChild(eb)}}
    exitReaderMode(){document.body.classList.remove('reader-mode');document.querySelector('.reader-mode-exit')?.remove()}
    toggleReaderMode(){document.body.classList.contains('reader-mode')?this.exitReaderMode():this.enterReaderMode()}
    attachToolbarEvents(){document.querySelectorAll('.post-toolbar button').forEach(btn=>{btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const a=btn.dataset.action,s=btn.closest('.post-toolbar').dataset.postSlug;if(a.startsWith('font-'))this.adjustFontSize(s,a);else if(a==='print-pdf')this.printPDF(s);else if(a==='reader-mode')this.toggleReaderMode()})})}

    async renderPostCards(posts){const mc=document.getElementById('mainContent');if(!posts?.length){mc.innerHTML='<p class="no-posts">هیچ مطلبی یافت نشد.</p>';return}const results=await Promise.all(posts.map(async p=>{try{let ex,hm,dt;if(p._hasPreviewFile){const pc=await BlogEngine.loadPreviewContent(p);if(pc)return{p,ex:pc,hm:true,dt:p._previewTitle||BlogEngine.getDisplayTitle(p)}}const pd=await BlogEngine.loadPostContentByPost(p);if(!pd)return null;const ext=BlogEngine.extractExcerptAndFull(pd.content);return{p,ex:ext.excerpt,hm:ext.hasMore,dt:BlogEngine.getDisplayTitle(p)}}catch(e){return null}}));let html='';for(const r of results){if(r)html+=this.buildPostCardHTML(r.p,r.ex,r.hm,r.dt)}mc.innerHTML=html;this.attachPostCardEvents();this.attachToolbarEvents();setTimeout(()=>BlogEngine.rerenderExternalScripts(),200)}
    attachPostCardEvents(){document.querySelectorAll('.post-title-link').forEach(l=>l.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(l.dataset.postSlug){const jsn=l.dataset.jsn||'';this.navigate(`?post=${encodeURIComponent(l.dataset.postSlug)}${jsn?`&jsn=${encodeURIComponent(jsn)}`:''}`);window.scrollTo({top:0,behavior:'smooth'})}}));document.querySelectorAll('.read-more').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(b.dataset.postSlug){const jsn=b.dataset.jsn||'';this.navigate(`?post=${encodeURIComponent(b.dataset.postSlug)}${jsn?`&jsn=${encodeURIComponent(jsn)}`:''}`);window.scrollTo({top:0,behavior:'smooth'})}}));document.querySelectorAll('.tag[data-tag]').forEach(t=>t.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(t.dataset.tag)this.navigate(`?tag=${encodeURIComponent(t.dataset.tag)}`) }))}
    
    async loadFullPost(slug,jsnFileName){
        const mc=document.getElementById('mainContent');mc.innerHTML='<div class="loading">در حال بارگذاری...</div>';this.updateActiveMenu(null);this.cleanupPostCode();
        try{
            const pd=await BlogEngine.loadPostContentFromJSON(slug,jsnFileName);
            if(!pd){mc.innerHTML=`<div class="error-message" style="text-align:center;padding:40px"><p style="font-size:1.5rem;margin-bottom:15px">⚠️ پست یافت نشد</p><p style="color:#666;margin-bottom:20px">پست "${slug}" در فایل "${jsnFileName}.json" یافت نشد.</p><a href="index.html" style="display:inline-block;background:#0d9488;color:white;border:none;padding:10px 25px;border-radius:8px;cursor:pointer;font-family:Vazirmatn;font-size:.95rem;text-decoration:none">🏠 بازگشت به صفحه اصلی</a></div>`;return}
            const{full}=BlogEngine.extractExcerptAndFull(pd.content);
            const dt=BlogEngine.getDisplayTitle(pd.meta);
            const rt=BlogEngine.estimateReadingTime(full);
            const dth=(()=>{const dp=pd.meta.date?DateConverter.toJalali(pd.meta.date):'';const tp=BlogEngine.formatTime(pd.meta.time);return(dp&&tp)?`<span class="post-date">${dp} - ${tp}</span>`:dp?`<span class="post-date">${dp}</span>`:tp?`<span class="post-date">${tp}</span>`:''})();
            const{cleanHtml,scripts,styles}=this.extractCodeFromContent(BlogEngine.removeMoreTag(full),pd.meta);
            let imgHtml='';
            if(pd.meta.image){const ip=BlogEngine.getImagePath(pd.meta);if(ip.fallback){imgHtml=`<img src="${ip.primary}" alt="${pd.meta.alt||dt}" class="post-image" loading="lazy" onerror="if(!this.dataset.tried){this.dataset.tried='1';this.src='${ip.fallback}'}">`}else{imgHtml=`<img src="${ip.primary}" alt="${pd.meta.alt||dt}" class="post-image" loading="lazy">`}}
            let html=`<article class="full-post"><div class="post-meta"><div class="post-meta-left">${dth}${dth?' | ':''}<span class="reading-time">⏱️ ${rt}</span>${pd.meta.fixed==='yes'?'<span class="fixed-badge">📌 پست ثابت</span>':''}</div>${this.createPostToolbar(slug)}</div><div class="post-title-row"><h1 class="post-title">${dt}</h1></div>${imgHtml}<div class="post-content" data-post-slug="${slug}">${cleanHtml}</div>${pd.meta.tags?.length?`<div class="tags">${pd.meta.tags.map(t=>`<a href="?tag=${encodeURIComponent(t)}" class="tag" data-tag="${t}">${t}</a>`).join('')}</div>`:''}<div class="back-to-home"><a href="index.html" class="back-link">← بازگشت به صفحه اصلی</a></div></article>`;
            mc.innerHTML=html;document.getElementById('pagination').style.display='none';
            if(styles.length)this.applyStyles(styles,slug);
            if(scripts.length)setTimeout(()=>this.executeScripts(scripts,slug),100);
            this.attachToolbarEvents();setTimeout(()=>BlogEngine.rerenderExternalScripts(),300);
        }catch(e){mc.innerHTML='<div class="error-message" style="text-align:center;padding:40px"><p style="font-size:1.5rem;margin-bottom:15px">⚠️ خطا در بارگذاری مطلب</p><a href="index.html" style="display:inline-block;background:#0d9488;color:white;border:none;padding:10px 25px;border-radius:8px;cursor:pointer;font-family:Vazirmatn;font-size:.95rem;text-decoration:none">🏠 بازگشت به صفحه اصلی</a></div>'}
    }
    
    async loadStaticPage(slug,jsnFileName){
        const mc=document.getElementById('mainContent');mc.innerHTML='<div class="loading">در حال بارگذاری...</div>';this.updateActiveMenu(slug);
        try{
            const pd=await BlogEngine.loadPageContentFromJSON(slug,jsnFileName);
            if(!pd){mc.innerHTML=`<div class="error-message" style="text-align:center;padding:40px"><p style="font-size:1.5rem;margin-bottom:15px">⚠️ صفحه یافت نشد</p><p style="color:#666;margin-bottom:20px">صفحه "${slug}" در فایل "${jsnFileName}.json" یافت نشد.</p><a href="index.html" style="display:inline-block;background:#0d9488;color:white;border:none;padding:10px 25px;border-radius:8px;cursor:pointer;font-family:Vazirmatn;font-size:.95rem;text-decoration:none">🏠 بازگشت به صفحه اصلی</a></div>`;return}
            mc.innerHTML=`<article class="full-post"><div class="post-meta"><div class="post-meta-left"></div>${this.createPostToolbar(slug)}</div><div class="post-title-row"><h1 class="post-title">${pd.meta.title}</h1></div><div class="post-content" data-post-slug="${slug}">${pd.content}</div><div class="back-to-home"><a href="index.html" class="back-link">← بازگشت به صفحه اصلی</a></div></article>`;
            document.getElementById('pagination').style.display='none';
            this.attachToolbarEvents();setTimeout(()=>BlogEngine.rerenderExternalScripts(),300);
        }catch(e){mc.innerHTML='<div class="error-message" style="text-align:center;padding:40px"><p style="font-size:1.5rem;margin-bottom:15px">⚠️ خطا در بارگذاری صفحه</p><a href="index.html" style="display:inline-block;background:#0d9488;color:white;border:none;padding:10px 25px;border-radius:8px;cursor:pointer;font-family:Vazirmatn;font-size:.95rem;text-decoration:none">🏠 بازگشت به صفحه اصلی</a></div>'}
    }
    
    async loadSearchResults(query){const mc=document.getElementById('mainContent');mc.innerHTML='<div class="loading">در حال جستجو...</div>';this.updateActiveMenu(null);document.getElementById('pagination').style.display='none';try{const{results,total}=await this.se.performFullSearch(query);if(!results.length){mc.innerHTML=`<div class="search-results-main"><div class="search-header"><h2>جستجو برای: <span class="search-query">"${this.escHtml(query)}"</span></h2></div><p class="no-posts">نتیجه‌ای یافت نشد.</p></div>`;return}let html=`<div class="search-results-main"><div class="search-header"><h2>نتایج: <span class="search-query">"${this.escHtml(query)}"</span></h2><p>${total} نتیجه</p></div>`;results.forEach(r=>{html+=`<div class="search-result-card"><span class="result-type-badge ${r.type}">${r.type==='post'?'مطلب':r.type==='page'?'صفحه':'برچسب'}</span><h3><a href="${r.url}" class="post-title-link">${this.se.highlightText(r.title,query)}</a></h3><p>${this.se.highlightText(r.excerpt,query)}</p></div>`});html+='</div>';mc.innerHTML=html}catch(e){mc.innerHTML='<div class="error-message" style="text-align:center;padding:40px"><p style="font-size:1.5rem;margin-bottom:15px">⚠️ خطا در جستجو</p><button onclick="location.reload()" style="background:#0d9488;color:white;border:none;padding:10px 25px;border-radius:8px;cursor:pointer;font-family:Vazirmatn;font-size:.95rem">🔄 بارگذاری مجدد صفحه</button></div>'}}
    escHtml(t){const m={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'};return t.replace(/[&<>"']/g,c=>m[c])}
    updateActiveMenu(slug){document.querySelectorAll('.horizontal-menu a').forEach(a=>a.classList.remove('active'));if(slug==='home'){const hl=document.querySelector('.horizontal-menu a[href="index.html"]');if(hl)hl.classList.add('active')}else if(slug){const ml=document.querySelector(`.horizontal-menu a[href="?page_slug=${slug}"]`);if(ml)ml.classList.add('active')}}
}