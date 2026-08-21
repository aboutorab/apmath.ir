class MenuBuilder {
    static async buildMainMenu(){
        const ml=document.getElementById('mainMenuList');if(!ml)return;
        try{const r=await fetch(BlogEngine.acb('data/menu.json'));if(!r.ok){ml.innerHTML='<li><span class="loading-text">منو در دسترس نیست</span></li>';return}const items=await r.json();if(!items?.length){ml.innerHTML='';return}ml.innerHTML=await this.buildMenuTreeWithJSN(items,0)}catch(e){ml.innerHTML='<li><span class="loading-text">خطا در بارگذاری</span></li>'}
    }
    static async buildMobileMenu(){
        const mml=document.getElementById('mobileMenuList');if(!mml)return;
        try{const r=await fetch(BlogEngine.acb('data/menu.json'));if(!r.ok){mml.innerHTML='<li><span class="loading-text">منو در دسترس نیست</span></li>';return}const items=await r.json();if(!items?.length){mml.innerHTML='';return}mml.innerHTML=await this.buildMenuTreeWithJSN(items,0);this.attachMobileMenuEvents()}catch(e){mml.innerHTML='<li><span class="loading-text">خطا در بارگذاری</span></li>'}
    }
    static async buildMenuTreeWithJSN(items,level=0,allPosts=null){
        if(!items?.length)return'';
        if(allPosts===null&&JSON.stringify(items).includes('?post=')){allPosts=await BlogEngine.loadAllPosts()}
        let h='';
        for(const item of items){
            if(!item.title)continue;
            const hc=item.children&&item.children.length>0;
            const ta=item.target==='_blank'?' target="_blank" rel="noopener noreferrer"':'';
            if(hc&&level<3){
                h+=`<li class="has-submenu"><a href="#" data-menu-parent="true">${item.title}</a><ul class="submenu">`;
                h+=await this.buildMenuTreeWithJSN(item.children,level+1,allPosts);
                h+=`</ul></li>`;
            }else{
                let link=item.link||'#';
                if(link.includes('?post=')&&!link.includes('&jsn=')){
                    const slug=new URLSearchParams(link.split('?')[1]).get('post');
                    if(slug&&allPosts){const fp=allPosts.find(p=>p.slug===slug);if(fp){const jsn=fp._batchSubdir||fp._postSubdir||'';if(jsn)link+=`&jsn=${encodeURIComponent(jsn)}`}}
                }
                h+=`<li><a href="${link}"${ta}>${item.title}</a></li>`;
            }
        }
        return h;
    }
    static buildMenuTree(items,level=0){
        if(!items?.length)return'';let h='';
        items.forEach(item=>{
            if(!item.title)return;
            const hc=item.children&&item.children.length>0;
            const ta=item.target==='_blank'?' target="_blank" rel="noopener noreferrer"':'';
            if(hc&&level<3){h+=`<li class="has-submenu"><a href="#" data-menu-parent="true">${item.title}</a><ul class="submenu">`;h+=this.buildMenuTree(item.children,level+1);h+=`</ul></li>`}
            else{h+=`<li><a href="${item.link||'#'}"${ta}>${item.title}</a></li>`}
        });
        return h;
    }
    static attachMobileMenuEvents(){
        const mm=document.getElementById('mobileMenuList');if(!mm)return;
        mm.addEventListener('click',function(e){
            const tl=e.target.closest('a[data-menu-parent]');if(!tl)return;
            e.preventDefault();e.stopPropagation();
            const pl=tl.parentElement;const sm=pl.querySelector(':scope > .submenu');if(!sm)return;
            const pu=pl.parentElement;
            pu.querySelectorAll(':scope > li.has-submenu > .submenu').forEach(s=>{
                if(s!==sm){s.style.display='none';s.classList.remove('mobile-open');s.querySelectorAll('.submenu.mobile-open').forEach(i=>{i.style.display='none';i.classList.remove('mobile-open')});const sl=s.parentElement.querySelector('a[data-menu-parent]');if(sl)sl.classList.remove('open')}
            });
            if(sm.classList.contains('mobile-open')){
                sm.style.display='none';sm.classList.remove('mobile-open');tl.classList.remove('open');
                sm.querySelectorAll('.submenu.mobile-open').forEach(i=>{i.style.display='none';i.classList.remove('mobile-open')});
                sm.querySelectorAll('a[data-menu-parent].open').forEach(l=>l.classList.remove('open'));
            }else{sm.style.display='flex';sm.classList.add('mobile-open');tl.classList.add('open')}
        });
        mm.addEventListener('click',function(e){
            if(e.target.closest('a:not([data-menu-parent])')){
                mm.querySelectorAll('.submenu.mobile-open').forEach(s=>{s.style.display='none';s.classList.remove('mobile-open')});
                mm.querySelectorAll('a[data-menu-parent].open').forEach(l=>l.classList.remove('open'));
            }
        });
        document.addEventListener('click',function(e){
            if(!e.target.closest('#mobileMainMenu')&&!e.target.closest('#mobileMenuToggle')){
                document.querySelectorAll('#mobileMenuList .submenu.mobile-open').forEach(s=>{s.style.display='none';s.classList.remove('mobile-open')});
                document.querySelectorAll('#mobileMenuList a[data-menu-parent].open').forEach(l=>l.classList.remove('open'));
            }
        });
    }
    static setupMobileMenuToggle(){
        const tb=document.getElementById('mobileMenuToggle'),mcm=document.getElementById('mobileMainMenu');
        if(!tb||!mcm)return;
        tb.addEventListener('click',function(){if(mcm.classList.contains('open')){mcm.classList.remove('open');mcm.style.maxHeight='0';tb.classList.remove('open')}else{mcm.classList.add('open');mcm.style.maxHeight=mcm.scrollHeight+'px';tb.classList.add('open')}});
        document.addEventListener('click',function(e){if(!e.target.closest('#mobileMainMenu')&&!e.target.closest('#mobileMenuToggle')){mcm.classList.remove('open');mcm.style.maxHeight='0';tb.classList.remove('open')}});
    }
    static async buildTopMenu(){
        const ml=document.getElementById('topMenuList');if(!ml)return;
        try{
            const r=await fetch(BlogEngine.acb('data/topmenu.json'));if(!r.ok){ml.innerHTML='<li><span class="loading-text">منو در دسترس نیست</span></li>';return}
            const items=await r.json();if(!items?.length){ml.innerHTML='';return}
            let h='';
            items.forEach(item=>{
                const title=item.title||'',image=item.image||'',link=item.link||'',alt=item.alt||'';
                const target=item.target==='_blank'?' target="_blank" rel="noopener noreferrer"':'';
                if(!title&&!image)return;
                let imageSrc='';
                if(image){
                    const lower=image.toLowerCase();
                    if(/\.(jpg|jpeg|png|ico)$/i.test(lower)){imageSrc=image.startsWith('http://')||image.startsWith('https://')?image:`assets/images/${image}`}
                }
                let content='';const tooltip=alt||'';
                if(title&&imageSrc)content=`<img src="${imageSrc}" alt="${tooltip}" class="top-menu-icon" loading="lazy">${title}`;
                else if(!title&&imageSrc)content=`<img src="${imageSrc}" alt="${tooltip}" class="top-menu-icon" loading="lazy">`;
                else if(title&&!imageSrc)content=title;
                if(content&&link)h+=`<li><a href="${link}"${target}${tooltip?` title="${tooltip}"`:''}>${content}</a></li>`;
            });
            ml.innerHTML=h||'';
        }catch(e){ml.innerHTML='<li><span class="loading-text">خطا در بارگذاری</span></li>'}
    }
    static async buildToolbarScripts(){
        const widget=document.getElementById('toolbarScriptsWidget'),list=document.getElementById('toolbarScriptsList');
        if(!widget||!list)return;
        try{
            const r=await fetch(BlogEngine.acb('data/toolbar.script'));if(!r.ok){widget.style.display='none';return}
            const text=await r.text();
            const scripts=text.split(/\n\s*\n+/).map(s=>s.trim()).filter(s=>s.length>0);
            if(!scripts.length){widget.style.display='none';return}
            list.innerHTML='';
            scripts.forEach(script=>{
                const itemDiv=document.createElement('div');itemDiv.className='toolbar-script-item';
                if(/<script[\s\S]*?>/i.test(script)){itemDiv.appendChild(this.createIframeFromScript(script))}
                else{itemDiv.innerHTML=script}
                list.appendChild(itemDiv);
            });
            widget.style.display='block';
        }catch(e){widget.style.display='none'}
    }
    static createIframeFromScript(sc){
        const srcMatch=sc.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/i);
        const scriptSrc=srcMatch?srcMatch[1]:'';
        const htmlParts=sc.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<!--[\s\S]*?-->/g,'').trim();
        const iframe=document.createElement('iframe');
        iframe.style.cssText='width:100%;height:120px;border:none;overflow:hidden;display:block;background:transparent;';
        iframe.setAttribute('loading','lazy');iframe.setAttribute('scrolling','no');
        iframe.srcdoc=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Vazirmatn,Tahoma,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100px;background:transparent;overflow:hidden}img{max-width:100%;height:auto}</style></head><body>${htmlParts}${scriptSrc?`<script src="${scriptSrc}"></script>`:''}</body></html>`;
        iframe.addEventListener('load',function(){try{const d=iframe.contentDocument||iframe.contentWindow.document;const h=d.body.scrollHeight||100;iframe.style.height=Math.max(50,Math.min(h,300))+'px'}catch(e){iframe.style.height='120px'}});
        return iframe;
    }
    static async buildFavoriteMenu(){
        const fpl=document.getElementById('favoritePostsList');if(!fpl)return;
        try{
            const r=await fetch('data/favorite.json');if(!r.ok)return;
            const favs=await r.json();if(!favs?.length)return;
            const sorted=favs.sort((a,b)=>b.id-a.id).slice(0,10);
            const posts=sorted.map(p=>({...p,slug:p.slug||BlogEngine.getSlugFromFile(p.file),_postSubdir:p.subdir||null,_batchSubdir:'',title:p.title||'بدون عنوان'}));
            await BlogEngine.resolvePostTitles(posts);
            let h='';
            posts.forEach(p=>{const jsn=p.subdir||p._batchSubdir||'';const link=`?post=${encodeURIComponent(p.slug)}${jsn?`&jsn=${encodeURIComponent(jsn)}`:''}`;h+=`<li class="favorite-post"><a href="${link}" data-post="${p.slug}" data-jsn="${jsn}">${BlogEngine.getDisplayTitle(p)}</a></li>`});
            fpl.innerHTML=h;
        }catch(e){}
    }
    static async buildSidebarMenu(){
        try{
            const rpl=document.getElementById('recentPostsList');
            const sp=await BlogEngine.loadPostsForSidebar(10);
            let h='';
            sp.forEach(p=>{const isF=p.fixed==='yes';const jsn=p._batchSubdir||p._postSubdir||'';const link=`?post=${encodeURIComponent(p.slug)}${jsn?`&jsn=${encodeURIComponent(jsn)}`:''}`;h+=`<li class="${isF?'fixed-post':''}"><a href="${link}" data-post="${p.slug}" data-jsn="${jsn}">${BlogEngine.getDisplayTitle(p)}</a></li>`});
            rpl.innerHTML=h||'<li><a href="#">هیچ مطلبی نیست</a></li>';
        }catch(e){}
    }
    static async buildUsefulLinksMenu(){try{const ull=document.getElementById('usefulLinksList');if(!ull)return;const r=await fetch('data/links.json');if(!r.ok)return;const links=await r.json();let h='';if(links?.length)links.forEach(l=>{if(l.title&&l.link)h+=`<li><a href="${l.link}" target="_blank" rel="noopener noreferrer">${l.title}</a></li>`});ull.innerHTML=h||'<li><a href="#">هیچ لینکی نیست</a></li>'}catch(e){}}
    static async buildTagsCloud(){try{const cfg=await BlogEngine.loadPostFilesConfig();if(!cfg.length){document.getElementById('tagsCloud').innerHTML='<p>هیچ برچسبی یافت نشد.</p>';return}const fp=await BlogEngine.loadPostsFromBatch(0);let tp=[...fp];if(tp.length<3&&cfg.length>1)tp.push(...await BlogEngine.loadPostsFromBatch(1));const tags=BlogEngine.getAllTags(tp);const tce=document.getElementById('tagsCloud');if(!tags.length){tce.innerHTML='<p>هیچ برچسبی یافت نشد.</p>';return}tce.innerHTML=tags.map(t=>`<a href="?tag=${encodeURIComponent(t)}" class="tag" data-tag="${t}">${t}</a>`).join('')}catch(e){}}
}