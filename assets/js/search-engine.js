class SearchEngine {
    constructor(){this.st=null;this.minSL=2;this.maxR=10}
    async search(q){
        if(!q||q.trim().length<this.minSL)return{results:[],total:0};
        const st=q.trim().toLowerCase();const results=[];
        try{
            const posts=await BlogEngine.loadAllPosts();
            for(const p of posts){
                let rel=0;const mf=[];
                const dt=BlogEngine.getDisplayTitle(p);
                if(dt.toLowerCase().includes(st)){rel+=10;mf.push('عنوان')}
                if(p.title&&p.title.toLowerCase().includes(st)){rel+=5;if(!mf.includes('عنوان'))mf.push('عنوان')}
                if(p.tags&&p.tags.some(t=>t.toLowerCase().includes(st))){rel+=8;mf.push('برچسب');if(p.tags.some(t=>t.toLowerCase()===st))rel+=5}
                try{const pd=await BlogEngine.loadPostContentByPost(p);if(pd?.content){const tc=this.stripHtml(pd.content).toLowerCase();if(tc.includes(st)){rel+=5;mf.push('محتوا');rel+=Math.min((tc.match(new RegExp(this.escRe(st),'g'))||[]).length,5)}}}catch(e){}
                if(rel>0){
                    const jsn=p._batchSubdir||p._postSubdir||'';
                    const url=`?post=${encodeURIComponent(p.slug)}${jsn?`&jsn=${encodeURIComponent(jsn)}`:''}`;
                    results.push({type:'post',title:dt,slug:p.slug,url,excerpt:p.date?`تاریخ انتشار: ${DateConverter.toJalali(p.date)}`:'',relevance:rel,matchedFields:mf,date:p.date,tags:p.tags||[]});
                }
            }
            const pages=await BlogEngine.loadPagesData();
            for(const pg of pages){
                let rel=0;const mf=[];
                if(pg.title.toLowerCase().includes(st)){rel+=10;mf.push('عنوان')}
                try{const pd=await BlogEngine.loadPageContent(pg.slug);if(pd?.content){const tc=this.stripHtml(pd.content).toLowerCase();if(tc.includes(st)){rel+=5;mf.push('محتوا');rel+=Math.min((tc.match(new RegExp(this.escRe(st),'g'))||[]).length,5)}}}catch(e){}
                if(rel>0)results.push({type:'page',title:pg.title,slug:pg.slug,url:`?page_slug=${encodeURIComponent(pg.slug)}&jsn=pages`,excerpt:`صفحه "${pg.title}"`,relevance:rel,matchedFields:mf});
            }
            const allTags=BlogEngine.getAllTags(posts);
            for(const t of allTags.filter(x=>x.toLowerCase().includes(st))){const tp=BlogEngine.getPostsByTag(posts,t);results.push({type:'tag',title:`برچسب: ${t}`,slug:t,url:`?tag=${encodeURIComponent(t)}`,excerpt:`${tp.length} پست با این برچسب`,relevance:st===t.toLowerCase()?15:7,matchedFields:['برچسب'],postCount:tp.length})}
            results.sort((a,b)=>b.relevance-a.relevance);
            const uniq=[];const seen=new Set();
            for(const r of results){if(!seen.has(r.url)){seen.add(r.url);uniq.push(r)}}
            return{results:uniq.slice(0,this.maxR),total:uniq.length};
        }catch(e){return{results:[],total:0,error:true}}
    }
    stripHtml(h){if(!h)return'';const d=document.createElement('div');d.innerHTML=h;return d.textContent||d.innerText||''}
    highlightText(t,s){if(!s||!t)return t||'';return t.replace(new RegExp(`(${this.escRe(s)})`,'gi'),'<span class="search-highlight">$1</span>')}
    escRe(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
    renderSidebarResults(results,total,st){
        const rc=document.getElementById('searchResults');if(!rc)return;
        if(!results?.length){rc.innerHTML='<div class="no-results">نتیجه‌ای یافت نشد.</div>';rc.style.display='block';return}
        let html='';
        results.forEach(r=>{const tl=r.type==='post'?'📝 مطلب':r.type==='page'?'📄 صفحه':'🏷️ برچسب';html+=`<div class="search-result-item"><a href="${r.url}" data-search-result="${r.url}"><div class="result-title">${this.highlightText(r.title,st)}</div><span class="result-type">${tl}</span>${r.type!=='tag'?`<div class="result-excerpt">${this.highlightText(r.excerpt,st)}</div>`:''}</a></div>`});
        if(total>this.maxR)html+=`<div class="search-result-item" style="text-align:center;"><a href="?search=${encodeURIComponent(st)}" data-full-search="true">مشاهده همه ${total} نتیجه</a></div>`;
        rc.innerHTML=html;rc.style.display='block';this.attachResultEvents(rc);
    }
    attachResultEvents(c){
        c.querySelectorAll('[data-search-result]').forEach(l=>{l.addEventListener('click',()=>{document.getElementById('searchResults').style.display='none';document.getElementById('searchInput').value=''})});
        c.querySelectorAll('[data-full-search]').forEach(l=>{l.addEventListener('click',e=>{e.preventDefault();const q=new URL(l.href).searchParams.get('search');if(q)window.location.href=`?search=${encodeURIComponent(q)}`})});
    }
    async performFullSearch(q){return await this.search(q)}
}