// Simple complete prototype game logic
(function(){
  const STORAGE_KEY = 'ncg_v1';
  const defaultPlayer = {name:'Spieler',hp:30,credits:50};

  // Basic card definitions
  const CARD_POOL = [
    {id:'c1',name:'Schläger',rarity:'common',cost:1,power:2,defense:1,desc:'Ein schneller Angreifer.'},
    {id:'c2',name:'Scharfschütze',rarity:'uncommon',cost:2,power:3,defense:1,desc:'Hoher Schaden.'},
    {id:'c3',name:'Bodyguard',rarity:'common',cost:1,power:1,defense:3,desc:'Verteidiger mit mehr LP.'},
    {id:'c4',name:'Bande-Anführer',rarity:'rare',cost:3,power:5,defense:4,desc:'Stark und teuer.'},
    {id:'c5',name:'Dealer',rarity:'uncommon',cost:2,power:2,defense:2,desc:'Ausgewogen.'}
  ];

  // Utilities
  function $(id){return document.getElementById(id)}
  function toast(msg,timeout=2000){const t=$('toast');t.textContent=msg;t.style.display='block';setTimeout(()=>t.style.display='none',timeout)}

  // Game state
  let state = {
    player:Object.assign({deck:[],hand:[],played:[],maxMana:0,mana:0,hp:30,credits:0},defaultPlayer),
    ai:{deck:[],hand:[],played:[],maxMana:0,mana:0,hp:30},
    collection:{},
    cardPool:CARD_POOL
  };

  // Initialize: load or create
  function load(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(raw){state=JSON.parse(raw);console.log('Loaded state');return}
    }catch(e){console.warn('Load failed',e)}
    // fresh start: give player collection and a starter deck
    state.collection={};
    CARD_POOL.forEach(c=>state.collection[c.id]=(state.collection[c.id]||0)+2);
    // starter deck: at least 8 cards
    state.player.deck = ['c1','c1','c2','c2','c3','c3','c5','c1'];
    state.player.credits=50;
    state.player.hp=30; state.player.maxMana=0; state.player.mana=0; state.player.hand=[]; state.player.played=[];
    // AI deck simple
    state.ai.deck = ['c1','c2','c3','c1','c2','c5','c1','c3'];
    state.ai.hp=30; state.ai.maxMana=0; state.ai.mana=0; state.ai.hand=[]; state.ai.played=[];
    save();
  }
  function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}

  // Shuffle helper
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}}

  // UI wiring
  function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id).classList.add('active')}

  function openOverlay(title,contentHTML){$('overlay-title').textContent=title;$('overlay-body').innerHTML=contentHTML;$('overlay').classList.add('active')}
  function closeOverlay(){ $('overlay').classList.remove('active'); }

  // Render collection/deck/shop
  function renderCardHtml(card){
    return `<div class="tc-card" data-id="${card.id}"><div class="name">${card.name}</div><div class="meta">Kosten ${card.cost} • ATK ${card.power} • DEF ${card.defense}</div><div class="desc">${card.desc}</div></div>`;
  }

  function showDeckbuilder(){
    // show collection and deck side-by-side
    let html=`<h3>Deckbuilder</h3><p>Ziehe oder klicke, um Karten zum Deck hinzuzufügen/zu entfernen.</p>`;
    html+=`<div style="display:flex;gap:12px;align-items:flex-start"><div style="flex:1"><h4>Deck (${state.player.deck.length} Karten)</h4><div id="db-deck" class="card-grid">`;
    state.player.deck.forEach((cid,i)=>{const c = CARD_POOL.find(x=>x.id===cid); if(c) html+=renderCardHtml(c)});
    html+='</div></div>';
    html+=`<div style="flex:1"><h4>Sammlung</h4><div id="db-collection" class="card-grid">`;
    CARD_POOL.forEach(c=>{const count = state.collection[c.id]||0; if(count>0) html+=renderCardHtml(c)});
    html+='</div></div></div>';
    html+=`<div style="margin-top:12px;"><button id="db-shuffle" class="pill-btn">Deck mischen</button> <button id="db-save" class="pill-btn primary">Speichern</button></div>`;
    openOverlay('Deckbuilder',html);

    // bind clicks: clicking a collection card adds to deck (if present) and reduces collection count
    document.querySelectorAll('#db-collection .tc-card').forEach(el=>el.addEventListener('click',ev=>{
      const id=el.dataset.id; if(!id) return; if((state.collection[id]||0)<=0){toast('Nicht genug Karten');return}
      state.player.deck.push(id); state.collection[id]--; renderCollectionAndDeck();
    }));
    document.querySelectorAll('#db-deck .tc-card').forEach(el=>el.addEventListener('click',ev=>{
      const id=el.dataset.id; if(!id) return; // remove first occurrence
      const idx = state.player.deck.indexOf(id); if(idx>=0){state.player.deck.splice(idx,1); state.collection[id]=(state.collection[id]||0)+1; renderCollectionAndDeck()}
    }));
    $('db-shuffle').addEventListener('click',()=>{shuffle(state.player.deck);renderCollectionAndDeck();toast('Deck gemischt')});
    $('db-save').addEventListener('click',()=>{save();toast('Deck gespeichert'); closeOverlay();});

    function renderCollectionAndDeck(){
      const deckEl=$('db-deck'); const colEl=$('db-collection'); deckEl.innerHTML=''; colEl.innerHTML='';
      state.player.deck.forEach(cid=>{const c=CARD_POOL.find(x=>x.id===cid); if(c) deckEl.insertAdjacentHTML('beforeend',renderCardHtml(c))});
      CARD_POOL.forEach(c=>{const count=state.collection[c.id]||0; if(count>0) colEl.insertAdjacentHTML('beforeend',renderCardHtml(c))});
      // rebind
      document.querySelectorAll('#db-collection .tc-card').forEach(el=>el.addEventListener('click',ev=>{const id=el.dataset.id; if(!id) return; if((state.collection[id]||0)<=0){toast('Nicht genug Karten');return} state.player.deck.push(id); state.collection[id]--; renderCollectionAndDeck();}));
      document.querySelectorAll('#db-deck .tc-card').forEach(el=>el.addEventListener('click',ev=>{const id=el.dataset.id; if(!id) return; const idx=state.player.deck.indexOf(id); if(idx>=0){state.player.deck.splice(idx,1); state.collection[id]=(state.collection[id]||0)+1; renderCollectionAndDeck()}}));
    }
  }

  function showShop(){
    let html=`<h3>Shop</h3><p>Kaufe Karten mit Credits. Preis ist abhängig von Seltenheit.</p><div class="card-grid">`;
    CARD_POOL.forEach(c=>{const price = c.rarity==='rare'?20: c.rarity==='uncommon'?10:5; html+=`<div class="tc-card" data-id="${c.id}"><div class="name">${c.name}</div><div class="meta">Preis ${price} • ${c.rarity}</div></div>`});
    html+='</div><div style="margin-top:12px;"><button id="shop-close" class="pill-btn">Fertig</button></div>';
    openOverlay('Shop',html);
    document.querySelectorAll('.overlay .tc-card').forEach(el=>el.addEventListener('click',ev=>{
      const id=el.dataset.id; const c=CARD_POOL.find(x=>x.id===id); const price=c.rarity==='rare'?20: c.rarity==='uncommon'?10:5;
      if(state.player.credits<price){toast('Nicht genug Credits');return}
      state.player.credits-=price; state.collection[id]=(state.collection[id]||0)+1; save(); toast(`Gekauft: ${c.name}`); renderHud();
    }));
    $('shop-close').addEventListener('click',closeOverlay);
  }

  function showCollection(){
    let html=`<h3>Sammlung</h3><div class="card-grid">`;
    CARD_POOL.forEach(c=>{const count=state.collection[c.id]||0; if(count>0) html+=`<div class="tc-card"><div class="name">${c.name} (${count})</div><div class="meta">ATK ${c.power} • DEF ${c.defense}</div></div>`});
    html+='</div><div style="margin-top:12px;"><button id="col-close" class="pill-btn">Schließen</button></div>';
    openOverlay('Sammlung',html);
    $('col-close').addEventListener('click',closeOverlay);
  }

  // Battle logic
  function startBattle(){
    // reset hp/mana/hand
    state.player.hp=30; state.ai.hp=30; state.player.hand=[]; state.ai.hand=[]; state.player.played=[]; state.ai.played=[];
    state.player.mana=0; state.player.maxMana=0; state.ai.mana=0; state.ai.maxMana=0;
    // clone deck arrays to avoid reference issues
    state.player.deck = state.player.deck.slice(); state.ai.deck = state.ai.deck.slice(); shuffle(state.player.deck); shuffle(state.ai.deck);
    // draw starting hands
    for(let i=0;i<3;i++){draw(state.player); draw(state.ai)}
    save(); renderBattle(); showScreen('screen-battle'); log('Kampf begonnen -- Viel Glück!');
  }

  function draw(side){const who = side===state.player?state.player:state.ai; if(who.deck.length===0) return; who.hand.push(who.deck.shift());}

  function renderHud(){ $('player-hp').textContent=state.player.hp; $('player-mana').textContent=state.player.mana; $('player-maxmana').textContent=state.player.maxMana; $('player-credits').textContent=state.player.credits; $('ai-hp').textContent=state.ai.hp; $('ai-mana').textContent=state.ai.mana; $('ai-maxmana').textContent=state.ai.maxMana; }

  function renderBattle(){ renderHud();
    const ph=$('player-hand'); ph.innerHTML=''; state.player.hand.forEach((cid,idx)=>{const c=CARD_POOL.find(x=>x.id===cid); if(!c) return; const el=document.createElement('div'); el.className='tc-card'; el.dataset.id=c.id; el.innerHTML=`<div class="name">${c.name}</div><div class="meta">Kosten ${c.cost} • ATK ${c.power}</div>`; el.addEventListener('click',()=>playCard(c)); ph.appendChild(el)});
    $('ai-hand').innerHTML = `<div style="padding:8px;color:var(--muted)">Gegner hat ${state.ai.hand.length} Karten</div>`;
  }

  function log(msg){const l=$('game-log'); const time=new Date().toLocaleTimeString(); l.innerHTML = `<div>[${time}] ${msg}</div>` + l.innerHTML;}

  function playCard(card){ if(state.player.mana < card.cost){toast('Nicht genug Mana');return} // consume mana
    state.player.mana -= card.cost; // remove one from hand (first match)
    const idx = state.player.hand.indexOf(card.id); if(idx>=0) state.player.hand.splice(idx,1);
    // immediate effect: deal power to AI
    state.ai.hp -= card.power; state.player.played.push(card.id); renderBattle(); log(`Du spielst ${card.name} (-${card.power} LP Gegner)`);
    checkEnd(); save();
  }

  function checkEnd(){ if(state.ai.hp<=0){toast('Du hast gewonnen!'); log('Spieler gewinnt!'); state.player.credits += 20; save(); setTimeout(()=>{showScreen('screen-menu');},800); }
    if(state.player.hp<=0){toast('Verloren'); log('KI gewinnt'); save(); setTimeout(()=>{showScreen('screen-menu');},800);} }

  function endTurn(){ // player's turn ends, resolve player's played -> already applied immediate damage
    // then AI turn
    aiTurn(); // after AI completes, increment mana and draw for player
    // next player turn: increment mana
    playerStartTurn(); renderBattle(); save();
  }

  function playerStartTurn(){ state.player.maxMana = Math.min(10, state.player.maxMana+1); state.player.mana = state.player.maxMana; draw(state.player); renderBattle(); log('Dein Zug beginnt'); }

  function aiTurn(){ // simple heuristic: increase mana, draw, play highest-power cards until mana depleted
    state.ai.maxMana = Math.min(10, state.ai.maxMana+1); state.ai.mana = state.ai.maxMana; draw(state.ai); log('Gegner ist am Zug');
    // sort ai hand by power desc
    const handCards = state.ai.hand.map(id=>CARD_POOL.find(c=>c.id===id)).filter(Boolean).sort((a,b)=>b.power-a.power);
    for(const c of handCards){ if(c.cost<=state.ai.mana){ state.ai.mana -= c.cost; state.ai.hand.splice(state.ai.hand.indexOf(c.id),1); state.ai.played.push(c.id); state.player.hp -= c.power; log(`KI spielt ${c.name} (-${c.power} LP)`) ; if(state.player.hp<=0) break; }}
    renderBattle(); checkEnd(); save();
  }

  // Event bindings
  function bind(){
    $('btn-play').addEventListener('click',()=>{startBattle()});
    $('menu-play').addEventListener('click',()=>startBattle());
    $('btn-deck').addEventListener('click',showDeckbuilder);
    $('menu-deck').addEventListener('click',showDeckbuilder);
    $('btn-shop').addEventListener('click',showShop);
    $('menu-shop').addEventListener('click',showShop);
    $('btn-collection').addEventListener('click',showCollection);
    $('overlay-close').addEventListener('click',closeOverlay);
    $('btn-reset').addEventListener('click',()=>{if(confirm('Alles zurücksetzen?')){localStorage.removeItem(STORAGE_KEY); load(); toast('Zurückgesetzt');}})
    $('btn-endturn').addEventListener('click',()=>{endTurn()});
    $('btn-surrender').addEventListener('click',()=>{if(confirm('Aufgeben?')){state.player.hp=0; checkEnd();}});
  }

  // Init
  load(); bind(); renderHud();
  // Expose some debug
  window.__ncg__ = {state,save,load,startBattle};
})();
