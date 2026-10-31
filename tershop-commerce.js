/* Tershop Online VE - motor de tienda y carrito v1.0
   Arquitectura modular: catálogo, variantes, precios, carrito y cierre por WhatsApp.
   Sin backend: los pedidos se envían al WhatsApp Business configurado.
*/
(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const money = n => '$' + Number(n || 0).toFixed(2);
  const WA_NUMBER = '584242674477';
  const WA_LINK = 'https://wa.me/message/OONJORDXA2NYA1';
  // Confirmado por el negocio: 4 unidades combinadas en el carrito.
  // Se suman todas las líneas aunque cambien género, talla, color o modalidad de estampado.
  const WHOLESALE_MIN = Number(window.TERSHOP_WHOLESALE_MIN || 4);
  const COLORS = [
    ['Blanco','#ffffff'],['Beige','#fffdcf'],['Blanco Perlado','#f8f6f1'],['Amarillo Pastel','#fefa9b'],['Amarillo','#f6e82c'],['Verde Menta','#77ffaa'],['Melón','#ffd3ac'],['Pistacho','#d5e0a4'],['Azul Claro','#9de5ff'],['Rosado Bebé','#ffb1cb'],['Rosa Vieja','#e9b8bb'],['Coral Claro','#f1abb0'],['Crema','#c1b698'],['Turquesa','#1cd6ea'],['Verde','#3ebb9d'],['Gris Claro','#90979d'],['Mora Lila','#b979cf'],['Menta','#00adaf'],['Mostaza','#bd8603'],['Azul','#2e96ef'],['Fucsia Claro','#f160af'],['Fucsia','#eb009b'],['Rojo','#cb0000'],['Azul Rey','#0019de'],['Vinotinto','#590303'],['Negro','#000000']
  ].map(([name,hex])=>({name,hex}));
  const KIDS = ['2','4','6','8','10','12','14','16'];
  const ADULT = ['S','M','L','XL','2XL','3XL','4XL','5XL','6XL'];
  const TARGETS = [
    {id:'dama',name:'Dama',img:'PRODUCTOS/FRANELA-DAMA.webp'},
    {id:'caballero',name:'Caballero',img:'PRODUCTOS/FRANELA-CABALLERO.webp'},
    {id:'ninos',name:'Niños / Niñas',img:'PRODUCTOS/FRANELA-NINAS-NINOS.webp'}
  ];
  const MODES = {
    unicolor:{label:'Unicolor',std:{retail:5,wholesale:2.96},plus:{retail:6,wholesale:5.5}},
    catalogo:{label:'Sublimado de catálogo',std:{retail:6,wholesale:4.2},plus:{retail:7,wholesale:5.9}},
    personalizado:{label:'Sublimado personalizado',std:{retail:6.5,wholesale:4.9},plus:{retail:8,wholesale:6.8}}
  };
  let cart = loadCart();
  let current = {target:'dama',mode:'unicolor',size:'S',color:COLORS[0],qty:1,mainDesign:null,additionalCatalogDesigns:[],pendingDesign:null,extraCount:0,extraAreas:'',catalogFolder:''};
  let editIndex = null;
  let selectedDesigns = [];

  function loadCart(){
    try {
      const v=JSON.parse(localStorage.getItem('lp_cart')||'[]');
      if(!Array.isArray(v)) return [];
      return v.map(it=>{
        if(it && it.product && it.mode && it.targetLabel) return it;
        // Migración conservadora de líneas del carrito anterior, conservando cantidad, talla y color.
        const legacyMode=it?.designType==='personalizado'?'personalizado':it?.designType==='sublimada'?'catalogo':'unicolor';
        const rawGender=String(it?.gen||it?.target||'dama').toLowerCase();
        const target=rawGender.includes('cab')?'caballero':(rawGender.includes('niñ')||rawGender.includes('nin'))?'ninos':'dama';
        const oldLocs=Object.entries(it?.locations||{});
        const extraDesigns=legacyMode==='catalogo'?oldLocs.slice(1).map(([loc,d])=>({code:d.code||'DISEÑO',name:d.nm||'Diseño anterior',src:d.src||''})):[];
        return {id:it?.id||`migrated-${Date.now()}-${Math.random().toString(16).slice(2)}`,product:'Franela de microdurazno',target,targetLabel:targetLabel(target),mode:legacyMode,modeLabel:modeLabel(legacyMode),size:String(it?.size||'S'),color:it?.color&&typeof it.color==='object'?it.color:{...COLORS[0]},qty:Math.max(1,Number(it?.qty||1)),baseRetail:unitBase(legacyMode,String(it?.size||'S'),false),baseWholesale:unitBase(legacyMode,String(it?.size||'S'),true),extraCount:legacyMode==='catalogo'?extraDesigns.length:0,extraUnit:legacyMode==='catalogo' ? 0.60 : legacyMode==='personalizado' ? 0.75 : 0,extraAreas:oldLocs.map(([loc])=>loc.replaceAll('_',' ')).join(', '),mainDesign:oldLocs[0]?{code:oldLocs[0][1].code||'DISEÑO',name:oldLocs[0][1].nm||'Diseño anterior',src:oldLocs[0][1].src||''}:null,additionalDesigns:extraDesigns,img:it?.img?.d||it?.img||productImage(target),legacyMigrated:true};
      });
    } catch { return []; }
  }
  function saveCart(){ try { localStorage.setItem('lp_cart',JSON.stringify(cart)); } catch(e){ console.warn('No se pudo guardar el carrito',e); } }
  function productImage(target){ return TARGETS.find(t=>t.id===target)?.img || TARGETS[0].img; }
  function sizesFor(target){ return target==='ninos'?KIDS:ADULT; }
  function sizeTier(size){ if(['2XL','3XL'].includes(String(size))) return 'plus'; if(['4XL','5XL','6XL'].includes(String(size))) return 'special'; return 'std'; }
  function unitBase(mode,size,wholesale){ const tier=sizeTier(size); if(tier==='special') return null; const p=MODES[mode][tier]; return wholesale?p.wholesale:p.retail; }
  function totalQty(){ return cart.reduce((n,i)=>n+Number(i.qty||0),0); }
  function isWholesale(){ return totalQty()>=WHOLESALE_MIN; }
  function extrasUnit(it){ return Number(it.extraCount||0) * (it.mode==='catalogo' ? .60 : it.mode==='personalizado' ? .75 : 0); }
  function itemUnit(it,wholesale=isWholesale()){ const base=unitBase(it.mode,it.size,wholesale); return base===null?null:base+extrasUnit(it); }
  function itemSubtotal(it,wholesale=isWholesale()){ const u=itemUnit(it,wholesale); return u===null?null:u*Number(it.qty||1); }
  function escapeHTML(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function targetLabel(id){return TARGETS.find(t=>t.id===id)?.name||id;}
  function modeLabel(id){return MODES[id]?.label||id;}
  function designsData(){ const published=Array.isArray(window.TERSHOP_DESIGNS)?window.TERSHOP_DESIGNS:[]; if(published.length)return published; return Array.isArray(window.DB_DESIGNS)?window.DB_DESIGNS:[]; }
  function allFolders(){ const ds=designsData(); return [...new Set(ds.map(d=>d.folder||d.coleccion||'GENERAL'))].sort(); }
  function flattenFolder(folder){
    const out=[]; let n=0;
    designsData().filter(d=>(d.folder||d.coleccion||'GENERAL')===folder).forEach(d=>{
      const imgs=Array.isArray(d.imagenes)&&d.imagenes.length?d.imagenes:(d.img?[d.img]:[]);
      imgs.forEach(src=>{n++;out.push({src,code:`${String(folder).slice(0,3).toUpperCase()}-${String(n).padStart(3,'0')}`,name:d.nm||d.nombre||folder});});
    }); return out;
  }
  function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}
  function updateBadge(){const b=$('#cartCnt');if(b)b.textContent=totalQty();}

  function renderProducts(){
    const grid=$('#pGrid')||$('#productos-container')||$('.pgrid'); if(!grid)return;
    grid.innerHTML=TARGETS.map(t=>`<article class="pcard" style="cursor:pointer" onclick="SHOP.openModal('${t.id}')">
      <div class="pmw"><img src="${t.img}" alt="Franelas de microdurazno para ${t.name}" loading="lazy" onerror="this.style.display='none'"></div>
      <div class="pinfo"><h3 class="pn">Franelas de microdurazno · ${t.name}</h3><p class="pd">Elige color, talla y tipo de estampado. Compra al detal o al mayor.</p>
      <div class="ppr"><span class="pp">Desde $5.00</span><span class="ppo">Mayor desde $2.96</span></div>
      <button class="btn-buy" type="button" onclick="event.stopPropagation();SHOP.openModal('${t.id}')">VER OPCIONES</button></div></article>`).join('');
    window.SHOP?.initScrollAnim?.();
  }
  function openModal(targetOrIndex){
    const target=typeof targetOrIndex==='string'?targetOrIndex:(TARGETS[targetOrIndex]?.id||'dama');
    current={target,mode:'unicolor',size:sizesFor(target)[0],color:COLORS[0],qty:1,mainDesign:null,additionalCatalogDesigns:[],pendingDesign:null,extraCount:0,extraAreas:'',catalogFolder:''};
    editIndex=null; selectedDesigns=[];
    setText('mNm',`Franela de microdurazno · ${targetLabel(target)}`);if($('#mGender'))$('#mGender').value=target;
    const main=$('#mMain'); if(main)main.innerHTML=`<img src="${productImage(target)}" alt="Franela ${targetLabel(target)}" style="width:100%;height:100%;object-fit:contain;background:#111;border-radius:12px">`;
    const thumbs=$('#mThs');if(thumbs)thumbs.innerHTML='';
    const colors=$('#mColors'); if(colors)colors.innerHTML=COLORS.map((c,i)=>`<button type="button" class="sel-color ${i===0?'on':''}" title="${c.name}" aria-label="${c.name}" onclick="SHOP.selColor(this,${i})" style="background:${c.hex};border:2px solid ${i===0?'#3B82F6':'#777'};width:30px;height:30px;border-radius:50%;margin:4px;cursor:pointer"></button>`).join('');
    const sizes=$('#mSizes');if(sizes)sizes.innerHTML=sizesFor(target).map((s,i)=>`<button type="button" class="sel-size ${i===0?'on':''}" onclick="SHOP.selSize(this,'${s}')">${s}</button>`).join('');
    $$('.sdt-btn').forEach(b=>{b.classList.toggle('on',b.dataset.dt==='lisa');});
    const folder=$('#mFolderSelect');if(folder)folder.innerHTML='<option value="">Selecciona una colección</option>'+allFolders().map(f=>`<option value="${escapeHTML(f)}">${escapeHTML(f)}</option>`).join('');
    ['mDesignFlow','mDesignCustom','mStepImages','mStepPreview','mStepLocation'].forEach(id=>{const e=$('#'+id);if(e)e.style.display='none';});
    const qty=$('#qV');if(qty)qty.value=1;
    const custom=$('#mDesignCustom'); if(custom)custom.innerHTML=`<div class="ters-extra-panel"><strong>Diseño principal personalizado incluido</strong><p>Envía tu diseño principal por WhatsApp al finalizar. Puedes añadir diseños pequeños en otras zonas.</p><label>¿Cuántos diseños adicionales deseas? (+$0.75 c/u por franela)</label><div class="ters-stepper"><button type="button" onclick="SHOP.changeExtra(-1)">−</button><input id="customExtraCount" type="number" min="0" max="20" value="0" onchange="SHOP.setExtra(this.value)"><button type="button" onclick="SHOP.changeExtra(1)">+</button></div><label>Ubicación de los diseños adicionales</label><input id="customExtraAreas" type="text" placeholder="Ej.: espalda y manga izquierda" oninput="SHOP.setAreas(this.value)"></div>`;
    const flow=$('#mDesignFlow'); if(flow){
      flow.innerHTML=`<div class="ters-extra-panel"><label for="mFolderSelect">Colección del catálogo</label><select id="mFolderSelect" onchange="SHOP.onFolderSelect()"><option value="">Selecciona una colección</option>${allFolders().map(f=>`<option value="${escapeHTML(f)}">${escapeHTML(f)}</option>`).join('')}</select><div id="mStepImages" style="display:none"><label>Elige el diseño principal (incluido)</label><div id="mImageGrid" class="ters-design-grid"></div></div><div id="mStepPreview" style="display:none"><p id="mDesignPreviewCode"></p><img id="mDesignPreviewImg" alt="Diseño elegido" style="max-width:110px;max-height:110px;object-fit:contain"></div><div id="tersExtraCatalogPanel" class="ters-extra-panel"><strong>Diseños adicionales (+$0.60 cada uno por franela)</strong><p>Selecciona el diseño principal incluido. Luego elige otra imagen y pulsa “Agregar como adicional”.</p><button type="button" id="btnAddCatalogExtra" class="ters-continue" onclick="SHOP.addCatalogExtra()" disabled>＋ Agregar diseño seleccionado como adicional</button><div id="tersCatalogExtras" class="ters-help">Aún no hay diseños adicionales.</div><label>Ubicación de los diseños adicionales</label><input id="catalogExtraAreas" type="text" placeholder="Ej.: espalda y manga derecha" oninput="SHOP.setAreas(this.value)"></div></div>`;
    }
    setText('mPr',money(unitBase('unicolor',current.size,false)));
    setText('mMayP',money(unitBase('unicolor',current.size,true)));
    this.updateModalPrice();
    $('#mOv')?.classList.add('on');document.body.style.overflow='hidden';
  }
  function setMode(elOrMode){const mode=typeof elOrMode==='string'?elOrMode:elOrMode?.dataset?.dt; if(!MODES[mode])return;current.mode=mode;$$('.sdt-btn').forEach(b=>b.classList.toggle('on',b.dataset.dt===mode));$('#mDesignFlow').style.display=mode==='catalogo'?'block':'none';$('#mDesignCustom').style.display=mode==='personalizado'?'block':'none';current.mainDesign=null;current.additionalCatalogDesigns=[];current.pendingDesign=null;selectedDesigns=[];current.extraCount=0;current.extraAreas='';this.updateModalPrice();}
  function selectColor(el,index){current.color=COLORS[index];$$('.sel-color').forEach(x=>x.classList.remove('on'));el.classList.add('on');}
  function selectSize(el,size){current.size=String(size);$$('.sel-size').forEach(x=>x.classList.remove('on'));el.classList.add('on');this.updateModalPrice();}
  function onFolderSelect(){const folder=$('#mFolderSelect')?.value||'';current.catalogFolder=folder;current.mainDesign=null;current.additionalCatalogDesigns=[];current.extraCount=0;current.pendingDesign=null;selectedDesigns=[];renderCatalogExtras();const imgs=flattenFolder(folder);const step=$('#mStepImages');if(!folder||!imgs.length){if(step)step.style.display='block';const g=$('#mImageGrid');if(g)g.innerHTML='<p class="ters-help">Esta colección todavía no tiene imágenes cargadas. Cuando compartas las carpetas del catálogo, se conectarán aquí.</p>';return;}step.style.display='block';$('#mImageGrid').innerHTML=imgs.map((d,i)=>`<button type="button" class="ters-design-option" onclick="SHOP.onImageSelect(${i})"><img src="${d.src}" alt="${escapeHTML(d.name)}" loading="lazy"><small>${escapeHTML(d.code)}</small></button>`).join('');this._folderImgs=imgs;}
  function onImageSelect(index){
    const d=this._folderImgs?.[index];if(!d)return;
    if(!current.mainDesign){current.mainDesign=d;current.pendingDesign=null;setText('mDesignPreviewCode',`${d.code} · ${d.name} (diseño principal incluido)`);}
    else {current.pendingDesign=d;setText('mDesignPreviewCode',`${d.code} · ${d.name} (listo para agregar)`);}
    $('#mStepPreview').style.display='block';$('#mDesignPreviewImg').src=d.src;
    $$('.ters-design-option').forEach((el,i)=>el.classList.toggle('selected',i===index));
    const addBtn=$('#btnAddCatalogExtra');if(addBtn)addBtn.disabled=!current.pendingDesign;
    this.renderCatalogExtras();this.updateModalPrice();
  }
  function renderCatalogExtras(){const box=$('#tersCatalogExtras');if(!box)return;box.innerHTML=current.additionalCatalogDesigns.length?current.additionalCatalogDesigns.map((d,i)=>`<div class="ters-extra-chip"><span>${i+1}. ${escapeHTML(d.code)} · ${escapeHTML(d.name)}</span><button type="button" onclick="SHOP.removeCatalogExtra(${i})" aria-label="Eliminar diseño adicional">Quitar</button></div>`).join(''):'Aún no hay diseños adicionales.';}
  function addCatalogExtra(){if(!current.pendingDesign){alert('Selecciona primero la imagen del diseño adicional.');return;}current.additionalCatalogDesigns.push({code:current.pendingDesign.code,name:current.pendingDesign.name,src:current.pendingDesign.src});current.extraCount=current.additionalCatalogDesigns.length;current.pendingDesign=null;const btn=$('#btnAddCatalogExtra');if(btn)btn.disabled=true;renderCatalogExtras();this.updateModalPrice();}
  function removeCatalogExtra(i){current.additionalCatalogDesigns.splice(i,1);current.extraCount=current.additionalCatalogDesigns.length;renderCatalogExtras();this.updateModalPrice();}

  function setExtra(v){current.extraCount=Math.max(0,Math.min(20,parseInt(v,10)||0));['customExtraCount','catalogExtraCount'].forEach(id=>{const el=$('#'+id);if(el)el.value=current.extraCount;});this.updateModalPrice();}
  function changeExtra(d){this.setExtra(current.extraCount+d);}
  function setAreas(v){current.extraAreas=v;}
  function updateModalPrice(){const size=current.size;const retail=unitBase(current.mode,size,false);const wholesale=unitBase(current.mode,size,true);if(retail===null){setText('mPr','Consultar');setText('mMayP','Pedidos >100');}else{const extra=current.extraCount*(current.mode==='catalogo' ? 0.60 : current.mode==='personalizado' ? 0.75 : 0);setText('mPr',money(retail+extra));setText('mMayP',money(wholesale+extra));}const q=Math.max(1,parseInt($('#qV')?.value||1));const btn=$('#mAdd');if(btn)btn.textContent=retail===null?'CONSULTAR DISPONIBILIDAD POR WHATSAPP':`AÑADIR AL CARRITO · ${retail===null?'Consultar':money((retail+current.extraCount*(current.mode==='catalogo' ? 0.60 : current.mode==='personalizado' ? 0.75 : 0))*q)}`;}
  function addToCart(){
    if(current.mode==='catalogo'&&!current.mainDesign){alert('Selecciona el diseño principal del catálogo.');return;}
    const qty=Math.max(1,parseInt($('#qV')?.value||1));
    if(sizeTier(current.size)==='special' && totalQty()+qty<=100){alert('Las tallas 4XL, 5XL y 6XL se cotizan únicamente en pedidos superiores a 100 unidades. Aumenta el pedido o consulta por WhatsApp.');return;}
    const item={id:`micro-${current.target}-${current.mode}-${Date.now()}`,product:'Franela de microdurazno',target:current.target,targetLabel:targetLabel(current.target),mode:current.mode,modeLabel:modeLabel(current.mode),size:current.size,color:{...current.color},qty,baseRetail:unitBase(current.mode,current.size,false),baseWholesale:unitBase(current.mode,current.size,true),extraCount:current.extraCount,extraUnit:current.mode==='catalogo' ? 0.60 : current.mode==='personalizado' ? 0.75 : 0,extraAreas:current.extraAreas||'',mainDesign:current.mainDesign?{code:current.mainDesign.code,name:current.mainDesign.name,src:current.mainDesign.src}:null,additionalDesigns:current.mode==='catalogo'?current.additionalCatalogDesigns.map(d=>({...d})):[],img:productImage(current.target)};
    if(editIndex!==null){cart[editIndex]=item;editIndex=null;}else cart.push(item);
    saveCart();updateBadge();this.closeModal();this.openCart();
  }
  function closeModal(){ $('#mOv')?.classList.remove('on');document.body.style.overflow=''; }
  function renderCart(){
    const body=$('#cartBody'),foot=$('#cartFoot');if(!body||!foot)return;
    if(!cart.length){body.innerHTML='<div class="cart-empty"><div class="ce-ico">🛒</div><p>Tu carrito está vacío</p><a href="#productos" class="lnk" onclick="SHOP.closeCart()">Seguir explorando productos</a></div>';foot.innerHTML='';updateBadge();return;}
    const may=isWholesale(),qty=totalQty();
    body.innerHTML=cart.map((it,i)=>{const unit=itemUnit(it,may);const special=unit===null;const base=it.mainDesign?`<div class="ters-item-design">Diseño principal: ${escapeHTML(it.mainDesign.code)} · ${escapeHTML(it.mainDesign.name)}</div>`:'';return `<article class="cart-item"><div class="ci-img"><img src="${it.img}" alt="${escapeHTML(it.product)}"></div><div class="ci-info"><div class="ci-name">${escapeHTML(it.product)} · ${escapeHTML(it.targetLabel)}</div><div class="ci-details">${escapeHTML(it.modeLabel)} · Talla ${escapeHTML(it.size)} · ${escapeHTML(it.color.name)}</div>${base}<div class="ters-item-design">Diseños adicionales: ${it.extraCount} × ${money(it.extraUnit)}${it.additionalDesigns?.length?` · ${it.additionalDesigns.map(d=>escapeHTML(d.code)).join(', ')}`:''}${it.extraAreas?` · ${escapeHTML(it.extraAreas)}`:''}</div><div class="ci-price">${special?'Precio por cotizar':`${money(unit)} × ${it.qty} = ${money(unit*it.qty)}`}</div><div class="ci-actions"><div class="ci-qty"><button class="ci-qb" onclick="SHOP.cartQty(${i},-1)">−</button><span class="ci-qv">${it.qty}</span><button class="ci-qb" onclick="SHOP.cartQty(${i},1)">+</button></div><button class="ci-rm" onclick="SHOP.cartRm(${i})">Eliminar</button></div></div></article>`;}).join('');
    const priced=cart.reduce((s,it)=>s+(itemSubtotal(it,may)||0),0);const hasSpecial=cart.some(it=>itemUnit(it,may)===null);
    window.totalCarritoUSD=priced;
    foot.innerHTML=`<div class="cart-mayor-msg">${may?`Precio mayorista activado (${qty} unidades combinadas)`:`Precio detal · Puedes combinar tallas, colores, géneros y estampados. Faltan ${Math.max(0,WHOLESALE_MIN-qty)} unidades para precio mayorista`}</div>${hasSpecial?'<p class="ters-warning">Incluyes tallas especiales 4XL–6XL: su precio y disponibilidad se confirmarán por WhatsApp. Solo pedidos superiores a 100 unidades.</p>':''}<div class="cart-total-row"><span>Subtotal calculado</span><strong>${money(priced)}${hasSpecial?' + cotización especial':''}</strong></div><div class="cart-total-row" style="font-size:12px;opacity:.8"><span>Moneda</span><span>USD</span></div><button class="btn-checkout" onclick="SHOP.openCheckout()">CONTINUAR AL PEDIDO →</button><button type="button" class="ters-continue" onclick="SHOP.closeCart();document.querySelector('#productos')?.scrollIntoView({behavior:'smooth'})">＋ Seguir explorando</button>`;
    updateBadge();
  }
  function openCart(){renderCart();$('#cartOv')?.classList.add('on');$('#cartDr')?.classList.add('on');document.body.style.overflow='hidden';}
  function closeCart(){$('#cartOv')?.classList.remove('on');$('#cartDr')?.classList.remove('on');document.body.style.overflow='';}
  function cartQty(i,d){if(!cart[i])return;cart[i].qty=Math.max(1,Number(cart[i].qty||1)+d);saveCart();renderCart();}
  function cartRm(i){cart.splice(i,1);saveCart();renderCart();}
  function openCheckout(){if(!cart.length)return;closeCart();const sum=$('#ckSum');if(sum){const may=isWholesale();sum.innerHTML=cart.map(it=>`<div class="ck-summary-item"><span>${it.qty} × ${escapeHTML(it.product)} (${escapeHTML(it.targetLabel)}, ${escapeHTML(it.size)}, ${escapeHTML(it.color.name)})<small>${escapeHTML(it.modeLabel)} · ${it.extraCount} adicionales</small></span><strong>${itemUnit(it,may)===null?'Cotizar':money(itemSubtotal(it,may))}</strong></div>`).join('')+`<div class="ck-summary-total"><span>Subtotal estimado</span><strong>${money(cart.reduce((s,it)=>s+(itemSubtotal(it,may)||0),0))}</strong></div>`;}
    $('#ckOv')?.classList.add('on');document.body.style.overflow='hidden';}
  function closeCheckout(){$('#ckOv')?.classList.remove('on');document.body.style.overflow='';}
  function sendWA(){
    const name=$('#ckNm')?.value.trim()||'';const phone=$('#ckPh')?.value.trim()||'';const state=$('#ckState')?.value||'';const other=$('#ckOtherState')?.value||'';
    if(name.length<3){alert('Escribe tu nombre completo.');return;}if(phone.replace(/\D/g,'').length<7){alert('Verifica tu número telefónico.');return;}if(!state){alert('Selecciona dónde te encuentras.');return;}if(state==='Otros estados'&&!other){alert('Selecciona tu estado.');return;}
    const may=isWholesale();let lines=[];let subtotal=0;let hasSpecial=false;
    cart.forEach((it,i)=>{const u=itemUnit(it,may);const loc=it.extraAreas?` · Ubicaciones adicionales: ${it.extraAreas}`:'';lines.push(`\n${i+1}. ${it.qty} × ${it.product} — ${it.targetLabel}\n   Modalidad: ${it.modeLabel}\n   Talla: ${it.size} | Color: ${it.color.name}\n   Diseño principal: ${it.mainDesign?`${it.mainDesign.code} (${it.mainDesign.name})`:it.mode==='personalizado'?'Personalizado (lo enviaré por WhatsApp)':'Sin diseño'}\n   Diseños adicionales: ${it.extraCount} × ${money(it.extraUnit)}${it.additionalDesigns?.length?' · Códigos: '+it.additionalDesigns.map(d=>d.code).join(', '):''}${loc}\n   Precio unitario: ${u===null?'POR COTIZAR':money(u)}\n   Subtotal: ${u===null?'POR COTIZAR':money(u*it.qty)}`);if(u===null)hasSpecial=true;else subtotal+=u*it.qty;});
    const location=state==='Otros estados'?other:state;
    const msg=`¡Hola Tershop Online VE! Quiero confirmar este pedido.\n\nDATOS DEL CLIENTE\nNombre: ${name}\nTeléfono: ${phone}\nUbicación: ${location}, Venezuela\n\nDETALLE DEL PEDIDO${lines.join('\n')}\n\nRESUMEN\nSubtotal calculado: ${money(subtotal)}${hasSpecial?'\nTallas especiales: pendiente de cotización':''}\nCondición: ${may?'Precio mayorista':'Precio detal'}\n\nPor favor, confirmen disponibilidad, costo de envío y datos de pago. Gracias.`;
    const url=`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    const win=window.open(url,'_blank');if(!win){window.location.href=url;}
    // Se limpia al iniciar el envío; el resumen ya viaja en el enlace de WhatsApp.
    cart=[];saveCart();updateBadge();closeCheckout();renderCart();
    ['ckNm','ckPh','ckState','ckOtherState'].forEach(id=>{const el=$('#'+id);if(el)el.value='';});
  }
  function applyCfg(){const nm='Tershop Online VE';setText('fLogo',nm);setText('heroT','TERSHOP ONLINE VE');setText('mainSlogan','Si buscas precio/calidad, ¡somos tu proveedor indicado!');const logo=$('#nLogo img');if(logo)logo.alt=nm;document.title='Tershop Online VE | Franelas al mayor y detal en Venezuela';const wa=$('#flWA');if(wa)wa.href=WA_LINK;}
  function renderDesigns(){const grid=$('#dGrid')||$('#disenos-container');if(!grid)return;const folders=allFolders();grid.innerHTML=folders.length?folders.map(f=>`<button class="ters-folder" onclick="SHOP.openModal('dama');SHOP.selDesignType('catalogo');document.querySelector('#mFolderSelect').value=${JSON.stringify(f)};SHOP.onFolderSelect()">${escapeHTML(f)}</button>`).join(''):'<p class="ters-help">Estamos preparando las colecciones del catálogo. Las imágenes se integrarán cuando compartas las carpetas de diseños.</p>';}
  function updateModalPriceFromQty(){this.updateModalPrice();}
  function selectGender(el,g){current.target=g;const sz=sizesFor(g);current.size=sz[0];const list=$('#mSizes');if(list)list.innerHTML=sz.map((v,i)=>`<button type="button" class="sel-size ${i===0?'on':''}" onclick="SHOP.selSize(this,'${v}')">${v}</button>`).join('');const img=$('#mMain img');if(img)img.src=productImage(g);setText('mNm',`Franela de microdurazno · ${targetLabel(g)}`);this.updateModalPrice();}
  const app=Object.assign(window.SHOP || {}, {
    getMayMin:()=>WHOLESALE_MIN,isMayor:isWholesale,renderProds:renderProducts,renderDesigns,applyCfg,
    openModal,closeModal,selColor:selectColor,selSize:selectSize,selGen:selectGender,selDesignType:setMode,
    onFolderSelect,onImageSelect,updateModalPrice,addToCart,updCartBadge:updateBadge,
    openCart,closeCart,renderCart,cartQty,cartRm,openCheckout,closeCheckout,sendWA,
    changeExtra,setExtra,setAreas,addCatalogExtra,removeCatalogExtra,renderCatalogExtras,openSizeGuide(){const el=$('#sizeGuideModal');if(el)el.style.display='flex';else alert('Consulta la guía de tallas con nuestro equipo por WhatsApp.');},
    closeSizeGuide(){ const el=$('#sizeGuideModal');if(el)el.style.display='none'; },
    contactCustom(){window.open(`${WA_LINK}?text=${encodeURIComponent('Hola, quiero consultar por un diseño personalizado.')}`,'_blank');},
    openRelCom(){const e=$('#relComOv');if(e)e.style.display='flex';},
    openShare(){if(navigator.share)navigator.share({title:'Tershop Online VE',url:location.href}).catch(()=>{});else navigator.clipboard?.writeText(location.href);},
    selectCardColor(){},init(){renderProducts();renderDesigns();updateBadge();}
  });
  // Evita mostrar testimonios o métricas ficticias del prototipo anterior.
  try { if (typeof ADM !== 'undefined') ADM.loadTestimonials = () => { const g=$('.tgrid'); if(g) g.innerHTML='<div class="tc2"><div class="tph">01</div><div class="tnm">Unicolor</div><p class="ttx">Prendas lisas en los colores disponibles.</p></div><div class="tc2"><div class="tph">02</div><div class="tnm">Catálogo</div><p class="ttx">Elige un diseño y agrega otros estampados.</p></div><div class="tc2"><div class="tph">03</div><div class="tnm">Personalizado</div><p class="ttx">Envía tu propio diseño por WhatsApp.</p></div>'; }; } catch(e) {}
  window.SHOP=app;
  window.TERSHOP_COMMERCE={get cart(){return cart;},getWholesaleMinimum:()=>WHOLESALE_MIN,prices:MODES,calculateUnit:(mode,size,wholesale,extras=0)=>{const b=unitBase(mode,size,wholesale);return b===null?null:b+Number(extras)*(mode==='catalogo' ? 0.60 : mode==='personalizado' ? 0.75 : 0);}};
  window.TERSHOP_CATALOG_SCHEMA={categories:['franelas','tazas','gorras','pantalones','zapatos','uniformes','otras_prendas'],productFields:['id','name','category','material','gender','sizes','colors','priceRules','designModes','media','active'],variantFields:['size','color','sku','stock','priceOverride']};
  // La inicialización heredada llama a estos métodos en DOMContentLoaded.
  // Solo sincronizamos el selector de estados; no duplicamos eventos del carrito.
  document.addEventListener('DOMContentLoaded',()=>{
    renderProducts();renderDesigns();updateBadge();
    const region=$('#ckState'),other=$('#ckOtherState');
    region?.addEventListener('change',()=>{if(other){other.style.display=region.value==='Otros estados'?'block':'none';if(region.value!=='Otros estados')other.value='';}});
  });
})();
