class BlogEngine {
    static pfc=null; static bpc={}; static apc=null; static pcc={}; static pcct=0; static esl=false; static esc=null; static tpc=null;
    static gcb(){const t=10*60*1000;return Math.floor(Date.now()/t)}
    static acb(u){const s=u.includes('?')?'&':'?';return `${u}${s}_cb=${this.gcb()}`}
    static async loadPostFilesConfig(){if(this.pfc)return this.pfc;try{const u=this.acb('data/postfiles.json');const r=await fetch(u);if(!r.ok)throw new Error('');this.pfc=await r.json();return this.pfc}catch(e){return[]}}
    static getSubdirFromFilename(j){if(!j)return'';const c=this.pfc||[];const b=c.find(x=>x.filename.replace(/\.json$/i,'')===j);return b?.subdir||''}
    static getFilenameFromSubdir(s){if(!s)return'';const c=this.pfc||[];const b=c.find(x=>x.subdir===s);return b?.filename?.replace(/\.json$/i,'')||''}
    static async loadPostContentFromJSON(slug,jfn){
        try{
            const cfg=await this.loadPostFilesConfig();
            if(!cfg.some(bc=>bc.filename.replace(/\.json$/i,'')===jfn))return null;
            const sd=this.getSubdirFromFilename(jfn);
            const r=await fetch(this.acb(`data/${jfn}.json`));if(!r.ok)return null;
            const posts=await r.json();
            const p=posts.find(x=>((x.slug&&x.slug.trim())?x.slug.trim():this.getSlugFromFile(x.file))===slug);
            if(!p)return null;
            const pd=this.applyDefaults(p);
            const post={...pd,slug:this.getEffectiveSlug(pd),_batchSubdir:sd,_postSubdir:pd.subdir||null,_hasPreviewFile:this.hasPreviewFile(pd)};
            return await this.loadPostContentByPost(post);
        }catch(e){return null}
    }
    static async loadPageContentFromJSON(slug,jfn){
        try{const r=await fetch(this.acb(`data/${jfn}.json`));if(!r.ok)return null;const pages=await r.json();const p=pages.find(x=>x.slug===slug&&x.published==='yes');if(!p)return null;const fr=await fetch(this.acb(`pages/${p.file}`));if(!fr.ok)return null;return{meta:p,content:await fr.text()}}catch(e){return null}
    }
    static async loadExternalScripts(){
        if(this.esl)return;this.esl=true;
        try{const r=await fetch(this.acb('data/script.json'));if(!r.ok)return;const sc=await r.json();if(!sc?.length)return;this.esc=sc;for(const cfg of sc){await this.loadSingleExternalScript(cfg)}}catch(e){}
    }
    static async loadSingleExternalScript(cfg){
        const html=cfg.script.trim();const parser=new DOMParser();const doc=parser.parseFromString(html,'text/html');
        const els=[...doc.head.children,...doc.body.children];for(const el of els){await this.injectElementWithCacheBuster(el)}
    }
    static injectElementWithCacheBuster(el){
        return new Promise(res=>{
            const tag=el.tagName.toLowerCase();
            if(tag==='script'){
                if(el.src){const base=el.src.split('?')[0];if(document.querySelector(`script[src^="${base}"]`)){res();return}}
                if(el.id&&document.getElementById(el.id)){res();return}
                const s=document.createElement('script');
                for(const a of el.attributes){if(a.name==='src')continue;s.setAttribute(a.name,a.value)}
                if(el.textContent&&!el.src){s.textContent=el.textContent;document.head.appendChild(s);res();return}
                if(el.src){s.src=this.acb(el.src);s.onload=()=>res();s.onerror=()=>res();document.head.appendChild(s);setTimeout(()=>res(),5000);return}
                document.head.appendChild(s);res();
            }else if(tag==='link'){
                if(el.href&&document.querySelector(`link[href^="${el.href.split('?')[0]}"]`)){res();return}
                const l=document.createElement('link');
                for(const a of el.attributes){l.setAttribute(a.name,a.name==='href'&&el.href?this.acb(el.href):a.value)}
                document.head.appendChild(l);setTimeout(()=>res(),500);
            }else if(tag==='style'){
                const st=document.createElement('style');
                for(const a of el.attributes)st.setAttribute(a.name,a.value);
                st.textContent=el.textContent;document.head.appendChild(st);res();
            }else{document.head.appendChild(el.cloneNode(true));res()}
        })
    }
    static async rerenderExternalScripts(){
        if(!this.esc)return;await new Promise(r=>setTimeout(r,200));
        for(const cfg of this.esc){
            const parser=new DOMParser();const doc=parser.parseFromString(cfg.script.trim(),'text/html');
            for(const el of [...doc.head.children,...doc.body.children]){
                if(el.tagName.toLowerCase()==='script'&&!el.src&&el.textContent){try{new Function(el.textContent)()}catch(e){}}
            }
        }
        if(window.MathJax?.typesetPromise){try{await window.MathJax.typesetPromise()}catch(e){}}
        if(window.hljs?.highlightAll){try{window.hljs.highlightAll()}catch(e){}}
        if(window.Prism?.highlightAll){try{window.Prism.highlightAll()}catch(e){}}
    }
    static formatTime(ts){if(!ts||typeof ts!=='string')return'';return/^([01]\d|2[0-3]):([0-5]\d)$/.test(ts.trim())?`ساعت ${ts.trim()}`:''}
    static getSlugFromFile(fn){return fn?fn.replace(/\.html$/i,''):''}
    static getEffectiveSlug(p){return(p.slug&&p.slug.trim())?p.slug.trim():this.getSlugFromFile(p.file)}
    static hasPreviewFile(p){return p.previewfile==='yes'}
    static getPreviewFileName(fn){return fn?fn.replace(/\.html$/i,'-preview.html'):''}
    static applyDefaults(p){return{...p,published:p.published??'yes',fixed:p.fixed??'no',date:p.date??'',time:p.time??''}}
    static estimateReadingTime(hc){
        if(!hc)return'کمتر از ۱ دقیقه';
        const text=hc.replace(/<[^>]+>/g,'').replace(/&[a-z]+;/gi,' ').trim();
        const wc=text.split(/\s+/).filter(w=>w.length>0).length;
        if(wc===0)return'کمتر از ۱ دقیقه';
        const m=Math.ceil(wc/200);
        if(m===1)return'۱ دقیقه';if(m<60)return`${m} دقیقه`;
        const h=Math.floor(m/60),rm=m%60;return rm===0?`${h} ساعت`:`${h} ساعت و ${rm} دقیقه`;
    }
    static getImagePath(post){
        if(!post.image)return null;
        const imageName=post.image;let localDir='';
        if(post._postSubdir){localDir=`posts/${this.sanitizeSubdir(post._postSubdir)}`}
        else if(post._batchSubdir){localDir=`posts/${this.sanitizeSubdir(post._batchSubdir)}`}
        if(localDir)return{primary:`${localDir}/images/${imageName}`,fallback:`assets/images/${imageName}`};
        return{primary:`assets/images/${imageName}`,fallback:null};
    }
    static async loadPostsFromBatch(idx){
        if(this.bpc[idx])return this.bpc[idx];
        const cfg=await this.loadPostFilesConfig();if(!cfg||idx>=cfg.length)return[];
        const bc=cfg[idx];
        try{
            const r=await fetch(this.acb(`data/${bc.filename}`));if(!r.ok)throw new Error('');
            const posts=await r.json();
            const pw=posts.map(p=>this.applyDefaults(p)).filter(p=>p.published==='yes');
            const res=pw.map(p=>({...p,slug:this.getEffectiveSlug(p),_batchSubdir:bc.subdir||'',_postSubdir:p.subdir||null,_hasPreviewFile:this.hasPreviewFile(p)}));
            this.bpc[idx]=res;this.tpc=null;return res;
        }catch(e){return[]}
    }
    static async getTotalPostCount(){
        if(this.tpc!==null)return this.tpc;
        const cfg=await this.loadPostFilesConfig();
        const batches=await Promise.all([...Array(cfg.length).keys()].map(i=>this.loadPostsFromBatch(i)));
        this.tpc=batches.reduce((s,b)=>s+b.length,0);return this.tpc;
    }
    static async loadPostsForSidebar(max=10){
        const cfg=await this.loadPostFilesConfig();const all=[];
        for(let i=0;i<cfg.length;i++){all.push(...this.sortPosts([...await this.loadPostsFromBatch(i)]));if(all.length>=max)break}
        const limited=all.slice(0,max);await this.resolvePostTitles(limited);return limited;
    }
    static async loadPostsForPage(page,per=10){
        const si=(page-1)*per,ei=si+per;
        const cfg=await this.loadPostFilesConfig();const all=[];
        for(let i=0;i<cfg.length;i++){all.push(...this.sortPosts([...await this.loadPostsFromBatch(i)]));if(all.length>=ei)break}
        return all.slice(si,ei);
    }
    static async loadAllPosts(){
        if(this.apc)return this.apc;
        const cfg=await this.loadPostFilesConfig();
        const batches=await Promise.all([...Array(cfg.length).keys()].map(i=>this.loadPostsFromBatch(i)));
        this.apc=batches.flat();return this.apc;
    }
    static getPostContentPath(p){const fn=p.file;const sd=p._postSubdir||p._batchSubdir||'';return sd?`posts/${this.sanitizeSubdir(sd)}/${fn}`:`posts/${fn}`}
    static getPreviewContentPath(p){const pfn=this.getPreviewFileName(p.file);const sd=p._postSubdir||p._batchSubdir||'';return sd?`posts/${this.sanitizeSubdir(sd)}/${pfn}`:`posts/${pfn}`}
    static sanitizeSubdir(s){return s.replace(/\.\.\//g,'').replace(/\.\//g,'').replace(/^\/+/,'').replace(/\/+$/,'')}
    static removeEntryTitleTag(h){return h?h.replace(/<h1\s+class="entry-title"[^>]*>.*?<\/h1>\s*/gi,''):''}
    static removeMoreTag(h){return h?h.replace(/<hr\s+class="bs-post-more"\s*\/?>\s*/gi,''):''}
    static extractTitleFromContent(h,jt){if(!h)return jt||'بدون عنوان';const m=h.match(/<h1\s+class="entry-title"[^>]*>(.*?)<\/h1>/i);if(m&&m[1]){const t=m[1].replace(/<[^>]+>/g,'').trim();if(t)return t}return(jt&&jt.trim())?jt:'بدون عنوان'}
    static async fetchPreviewTitleOnly(p){try{const r=await fetch(this.acb(this.getPreviewContentPath(p)));if(!r.ok)return null;const m=(await r.text()).match(/<h1\s+class="entry-title"[^>]*>(.*?)<\/h1>/i);return(m&&m[1])?m[1].replace(/<[^>]+>/g,'').trim():null}catch(e){return null}}
    static async fetchTitleOnly(p){try{const r=await fetch(this.acb(this.getPostContentPath(p)));if(!r.ok)return null;const c=await r.text();p._cachedContent=c;const m=c.match(/<h1\s+class="entry-title"[^>]*>(.*?)<\/h1>/i);return(m&&m[1])?m[1].replace(/<[^>]+>/g,'').trim():null}catch(e){return null}}
    static async resolvePostTitles(posts){await Promise.all(posts.map(async p=>{if(p._resolvedTitle)return;if(p._hasPreviewFile){const pt=await this.fetchPreviewTitleOnly(p);if(pt){p._resolvedTitle=pt;return}}const et=await this.fetchTitleOnly(p);p._resolvedTitle=et||p.title||'بدون عنوان'}))}
    static getDisplayTitle(p){return p._resolvedTitle||p.title||'بدون عنوان'}
    static async loadPreviewContent(p){try{const r=await fetch(this.acb(this.getPreviewContentPath(p)));if(!r.ok)return null;const rc=await r.text();p._previewTitle=this.extractTitleFromContent(rc,p.title);return this.removeMoreTag(this.removeEntryTitleTag(rc)).trim()}catch(e){return null}}
    static async loadPostContentByPost(p){const ct=this.gcb();if(this.pcct!==ct){this.pcc={};this.pcct=ct}if(this.pcc[p.slug])return this.pcc[p.slug];try{const r=await fetch(this.acb(this.getPostContentPath(p)));if(!r.ok)throw new Error('');const rc=await r.text();p._cachedContent=rc;p._resolvedTitle=this.extractTitleFromContent(rc,p.title||'');const res={meta:{...p,title:p._resolvedTitle},content:this.removeEntryTitleTag(rc)};this.pcc[p.slug]=res;return res}catch(e){return null}}
    static async loadPostContent(slug){try{const cfg=await this.loadPostFilesConfig();for(let i=0;i<cfg.length;i++){const p=(await this.loadPostsFromBatch(i)).find(x=>x.slug===slug);if(p)return await this.loadPostContentByPost(p)}return null}catch(e){return null}}
    static async loadPagesData(){try{const r=await fetch(this.acb('data/pages.json'));if(!r.ok)throw new Error('');return(await r.json()).filter(x=>x.published==='yes')}catch(e){return[]}}
    static async loadPageContent(slug){try{const pd=await this.loadPagesData();const p=pd.find(x=>x.slug===slug);if(!p)return null;const r=await fetch(this.acb(`pages/${p.file}`));if(!r.ok)throw new Error('');return{meta:p,content:await r.text()}}catch(e){return null}}
    static extractExcerptAndFull(h){const m=h.match(/<hr\s+class="bs-post-more"\s*\/?>/gi);if(!m)return{excerpt:h.trim(),full:h.trim(),hasMore:false};const parts=h.split(/<hr\s+class="bs-post-more"\s*\/?>/gi);return{excerpt:parts[0].trim(),full:parts.join('').trim(),hasMore:true}}
    static getPostsByTag(posts,tag){return posts.filter(p=>p.tags&&p.tags.includes(tag))}
    static getAllTags(posts){const s=new Set();posts.forEach(p=>{if(p.tags)p.tags.forEach(t=>s.add(t))});return Array.from(s).sort()}
    static sortPosts(posts){return posts.sort((a,b)=>{if(a.fixed==='yes'&&b.fixed!=='yes')return-1;if(a.fixed!=='yes'&&b.fixed==='yes')return 1;return b.id-a.id})}
    static clearCache(){this.pfc=null;this.bpc={};this.apc=null;this.pcc={};this.pcct=0;this.tpc=null}
}