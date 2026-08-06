// Improved game logic: board-based minions and attack interactions
(function(){
  const STORAGE_KEY = 'ncg_v1';
  const defaultPlayer = {name:'Spieler',hp:30,credits:50};

  const CARD_POOL = [
    {id:'c1',name:'Schläger',rarity:'common',cost:1,power:2,health:1,desc:'Ein schneller Angreifer.'},
    {id:'c2',name:'Scharfschütze',rarity:'uncommon',cost:2,power:3,health:1,desc:'Hoher Schaden.'},
    {id:'c3',name:'Bodyguard',rarity:'common',cost:1,power:1,health:3,desc:'Einrobuster Verteidiger.'},
    {id:'c4',name:'Bande-Anführer',rarity:'rare',cost:3,power:5,health:4,desc:'Stark und teuer.'},
    {id:'c5',name:'Dealer',rarity:'uncommon',cost:2,power:2,health:2,desc:'Ausgewogen.'}
  ];

  function $(id){return document.getElementById(id)}
  function toast(msg,timeout=2000){const t=$('toast');t.textContent=msg;t.style.display='block';setTimeout(()=>t.style.display='none',timeout)}

  let state = {
    player:Object.assign({deck:[],hand:[],board:[],maxMana:0,mana:0,hp:30,credits:0},defaultPlayer),
    ai:{deck:[],hand:[],board:[],maxMana:0,mana:0,hp:30},
    collection:{},
    cardPool:CARD_POOL
  };

  function load(){
    try{const raw=localStorage.getItem(STORAGE_KEY); if(raw){state=JSON.parse(raw);console.log('Loaded state');return}}catch(e){console.warn('Load failed',e)}
    state.collection={}; CARD_POOL.forEach(c=>state.collection[c.id]=(state.collection[c.id]||0)+2);
    state.player.deck = ['c1','c1','c2','c2','c3','c3','c5','c1']; state.player.credits=50; state.player.hp=30; state.player.maxMana=0; state.player.mana=0; state.player.hand=[]; state.player.board=[];
    state.ai.deck = ['c1','c2','c3','c1','c2','c5','c1','c3']; state.ai.hp=30; state.ai.maxMana=0; state.ai.mana=0; state.ai.hand=[]; state.ai.board=[];
    save();
  }
  function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}}

  function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id).classList.add('active')}
  function openOverlay(title,contentHTML){$('overlay-title').textContent=title;$('overlay-body').innerHTML=contentHTML;$('overlay').classList.add('active')}
  function closeOverlay(){ $('overlay').classList.remove('active'); }

  // Render helpers
  function cardById(id){return CARD_POOL.find(c=>c.id===id)}
  function renderCardHtml(card){
    return `<div class="tc-card" draggable="true" data-id="${card.id}"><div class="name">${card.name}</div><div class="meta">Kosten ${card.cost} • ATK ${card.power} • HP ${card.health}</div><div class="desc">${card.desc}</div></div>`;
  }

  // Deckbuilder with drag & click
  function showDeckbuilder(){
    let html=`<h3>Deckbuilder</h3><p>Ziehe Karten in das Deck oder klicke, um hinzuzufügen/entfernen.</p>`;
    html+=`<div style="display:flex;gap:12px;align-items:flex-start"><div style="flex:1"><h4>Deck (${state.player.deck.length} Karten)</h4><div id="db-deck" class="card-grid">`;
    state.player.deck.forEach((cid)=>{const c = cardById(cid); if(c) html+=renderCardHtml(c)});
    html+='</div></div>';
    html+=`<div style="flex:1"><h4>Sammlung</h4><div id="db-collection" class="card-grid">`;
    CARD_POOL.forEach(c=>{const count = state.collection[c.id]||0; if(count>0) html+=renderCardHtml(c)});
    html+='</div></div></div>';
    html+=`<div style="margin-top:12px;"><button id="db-shuffle" class="pill-btn">Deck mischen</button> <button id="db-save" class="pill-btn primary">Speichern</button></div>`;
    openOverlay('Deckbuilder',html);

    // enable drag on collection cards
    document.querySelectorAll('#db-collection .tc-card, #db-deck .tc-card').forEach(el=>{
      el.addEventListener('dragstart',dragStart);
      el.addEventListener('click',clickCard);
    });
    const deckEl = $('db-deck'); deckEl.addEventListener('dragover',ev=>ev.preventDefault()); deckEl.addEventListener('drop',onDropToDeck);
    function dragStart(e){e.dataTransfer.setData('text/plain', e.target.dataset.id)}
    function onDropToDeck(e){e.preventDefault(); const id=e.dataTransfer.getData('text/plain'); if(id && (state.collection[id]||0)>0){state.player.deck.push(id); state.collection[id]--; refresh()}}
    function clickCard(e){const id=e.currentTarget.dataset.id; if(!id) return; // if clicked in collection -> add, if in deck -> remove
      if(e.currentTarget.parentElement.id==='db-collection'){ if((state.collection[id]||0)<=0){toast('Nicht genug Karten');return} state.player.deck.push(id); state.collection[id]--; } else { const idx = state.player.deck.indexOf(id); if(idx>=0){ state.player.deck.splice(idx,1); state.collection[id]=(state.collection[id]||0)+1 } } refresh(); }
    $('db-shuffle').addEventListener('click',()=>{shuffle(state.player.deck);refresh();toast('Deck gemischt')});
    $('db-save').addEventListener('click',()=>{save();toast('Deck gespeichert'); closeOverlay();});
    function refresh(){ const deckEl=$('db-deck'); const colEl=$('db-collection'); deckEl.innerHTML=''; colEl.innerHTML=''; state.player.deck.forEach(cid=>{const c=cardById(cid); if(c) deckEl.insertAdjacentHTML('beforeend',renderCardHtml(c))}); CARD_POOL.forEach(c=>{const count=state.collection[c.id]||0; if(count>0) colEl.insertAdjacentHTML('beforeend',renderCardHtml(c))});
      // rebind
      document.querySelectorAll('#db-collection .tc-card, #db-deck .tc-card').forEach(el=>{el.addEventListener('dragstart',dragStart); el.addEventListener('click',clickCard);}); }
  }

  function showShop(){
    let html=`<h3>Shop</h3><p>Kaufe Karten mit Credits. Preis ist abhängig von Seltenheit.</p><div class="card-grid">`;
    CARD_POOL.forEach(c=>{const price = c.rarity==='rare'?20: c.rarity==='uncommon'?10:5; html+=`<div class="tc-card" data-id="${c.id}"><div class="name">${c.name}</div><div class="meta">Preis ${price} • ${c.rarity}</div></div>`});
    html+='</div><div style="margin-top:12px;"><button id="shop-close" class="pill-btn">Fertig</button></div>';
    openOverlay('Shop',html);
    document.querySelectorAll('.overlay .tc-card').forEach(el=>el.addEventListener('click',ev=>{
      const id=el.dataset.id; const c=cardById(id); const price=c.rarity==='rare'?20: c.rarity==='uncommon'?10:5;
      if(state.player.credits<price){toast('Nicht genug Credits');return}
      state.player.credits-=price; state.collection[id]=(state.collection[id]||0)+1; save(); toast(`Gekauft: ${c.name}`); renderHud();
    }));
    $('shop-close').addEventListener('click',closeOverlay);
  }

  function showCollection(){
    let html=`<h3>Sammlung</h3><div class="card-grid">`;
    CARD_POOL.forEach(c=>{const count=state.collection[c.id]||0; if(count>0) html+=`<div class="tc-card"><div class="name">${c.name} (${count})</div><div class="meta">ATK ${c.power} • HP ${c.health}</div></div>`});
    html+='</div><div style="margin-top:12px;"><button id="col-close" class="pill-btn">Schließen</button></div>';
    openOverlay('Sammlung',html);
    $('col-close').addEventListener('click',closeOverlay);
  }

  // Battle engine
  let selectedUnit = null; // {side:'player'|'ai', idx}
  function startBattle(){
    state.player.hp=30; state.ai.hp=30; state.player.hand=[]; state.ai.hand=[]; state.player.board=[]; state.ai.board=[]; state.player.mana=0; state.player.maxMana=0; state.ai.mana=0; state.ai.maxMana=0;
    state.player.deck = state.player.deck.slice(); state.ai.deck = state.ai.deck.slice(); shuffle(state.player.deck); shuffle(state.ai.deck);
    for(let i=0;i<3;i++){draw(state.player); draw(state.ai)}
    save(); renderBattle(); showScreen('screen-battle'); log('Kampf begonnen');
  }

  function draw(who){ if(who.deck.length===0){log((who===state.player? 'Spieler':'KI')+ ' kann nicht ziehen.'); return;} who.hand.push(who.deck.shift()); }

  function renderHud(){ $('player-hp').textContent=state.player.hp; $('player-mana').textContent=state.player.mana; $('player-maxmana').textContent=state.player.maxMana; $('player-credits').textContent=state.player.credits; $('ai-hp').textContent=state.ai.hp; $('ai-mana').textContent=state.ai.mana; $('ai-maxmana').textContent=state.ai.maxMana; }

  function renderBattle(){ renderHud(); const ph=$('player-hand'); ph.innerHTML=''; state.player.hand.forEach((cid,idx)=>{const c=cardById(cid); if(!c) return; const el=document.createElement('div'); el.className='tc-card'; el.dataset.id=c.id; el.innerHTML=`<div class="name">${c.name}</div><div class="meta">Kosten ${c.cost} • ATK ${c.power} • HP ${c.health}</div>`; el.addEventListener('click',()=>playCard(idx)); ph.appendChild(el)});
    // boards
    const pboard=$('player-board'); const aboard=$('ai-board'); pboard.innerHTML=''; aboard.innerHTML='';
    state.player.board.forEach((unit,idx)=>{const c=cardById(unit.card); const el=document.createElement('div'); el.className='unit'+(unit.canAttack? ' can-attack':''); el.dataset.side='player'; el.dataset.idx=idx; el.innerHTML=`<div class="name">${c.name}</div><div class="meta">ATK ${unit.atk} • HP ${unit.hp}</div>`; el.addEventListener('click',onUnitClick); pboard.appendChild(el)});
    state.ai.board.forEach((unit,idx)=>{const c=cardById(unit.card); const el=document.createElement('div'); el.className='unit'; el.dataset.side='ai'; el.dataset.idx=idx; el.innerHTML=`<div class="name">${c.name}</div><div class="meta">ATK ${unit.atk} • HP ${unit.hp}</div>`; el.addEventListener('click',onUnitClick); aboard.appendChild(el)});
    $('ai-hand').innerHTML = `<div style="padding:8px;color:var(--muted)">Gegner hat ${state.ai.hand.length} Karten</div>`;
  }

  function onUnitClick(e){ const side=e.currentTarget.dataset.side; const idx=Number(e.currentTarget.dataset.idx);
    if(selectedUnit){ // attempt attack
      if(selectedUnit.side==='player' && side==='ai'){ // player's unit attacks ai unit
        unitAttack('player',selectedUnit.idx,'ai',idx);
        selectedUnit=null; renderBattle(); save(); return;
      }
      // deselect if clicking same unit
      selectedUnit=null; renderBattle(); return;
    } else {
      // select only player's units that can attack
      if(side==='player' && state.player.board[idx] && state.player.board[idx].canAttack){ selectedUnit={side:'player',idx}; toast('Einheit ausgewählt'); } else if(side==='ai'){ // maybe show info
        toast('Gegner-Einheit'); }
      renderBattle(); return;
    }
  }

  function unitAttack(attSide,attIdx,defSide,defIdx){ const attacker = (attSide==='player'? state.player.board[attIdx]: state.ai.board[attIdx]); if(!attacker || !attacker.canAttack) {toast('Diese Einheit kann nicht angreifen'); return}
    const defender = (defSide==='player'? state.player.board[defIdx]: state.ai.board[defIdx]); if(!defender){toast('Ziel nicht gefunden'); return}
    // Combat: simultaneous
    defender.hp -= attacker.atk; attacker.hp -= defender.atk; attacker.canAttack=false; log(`${attSide==='player'?'Spieler':'KI'}'s ${cardById(attacker.card).name} greift ${cardById(defender.card).name} an`);
    // remove dead
    cleanupBoard(); checkEnd(); renderBattle(); save();
  }

  function cleanupBoard(){ state.player.board = state.player.board.filter(u=>u.hp>0); state.ai.board = state.ai.board.filter(u=>u.hp>0); }

  function playCard(handIndex){ const cid = state.player.hand[handIndex]; if(!cid){return} const card = cardById(cid); if(!card){return}
    if(state.player.mana < card.cost){toast('Nicht genug Mana');return}
    if(state.player.board.length>=5){toast('Board voll');return}
    state.player.mana -= card.cost; // remove from hand
    state.player.hand.splice(handIndex,1);
    // create unit instance
    const unit = {card:card.id,atk:card.power,hp:card.health,canAttack:false,owner:'player'};
    state.player.board.push(unit); log(`Du spielst ${card.name}`); renderBattle(); save(); }

  function checkEnd(){ if(state.ai.hp<=0){toast('Du hast gewonnen!'); log('Spieler gewinnt!'); state.player.credits += 20; save(); setTimeout(()=>{showScreen('screen-menu');},900); }
    if(state.player.hp<=0){toast('Verloren'); log('KI gewinnt'); save(); setTimeout(()=>{showScreen('screen-menu');},900);} }

  function endTurn(){ // player's turn ends: AI takes its full turn
    // AI turn
    aiTurn();
    // after AI turn, start next player turn
    playerStartTurn(); renderBattle(); save(); }

  function playerStartTurn(){ state.player.maxMana = Math.min(10, state.player.maxMana+1); state.player.mana = state.player.maxMana; state.player.board.forEach(u=>u.canAttack=true); draw(state.player); log('Dein Zug beginnt'); save(); }

  function aiTurn(){ state.ai.maxMana = Math.min(10, state.ai.maxMana+1); state.ai.mana = state.ai.maxMana; state.ai.board.forEach(u=>u.canAttack=true); draw(state.ai); log('Gegner ist am Zug');
    // play phase: play highest power cards until mana exhausted and board not full
    state.ai.hand.sort((a,b)=>{const ca=cardById(a), cb=cardById(b); return (cb.power - ca.power)});
    for(let i=0;i<state.ai.hand.length && state.ai.board.length<5;i++){
      const id = state.ai.hand[i]; const card=cardById(id); if(card.cost<=state.ai.mana){ state.ai.mana -= card.cost; state.ai.board.push({card:card.id,atk:card.power,hp:card.health,canAttack:false}); state.ai.hand.splice(i,1); i--; log(`KI spielt ${card.name}`); }
    }
    // attack phase: each ai unit that can attack will attack a random player unit or player directly
    for(let i=0;i<state.ai.board.length;i++){ const u = state.ai.board[i]; if(!u.canAttack) continue; if(state.player.board.length>0){ // choose lowest hp
      let targetIdx=0; let low = state.player.board[0].hp; for(let j=1;j<state.player.board.length;j++){ if(state.player.board[j].hp < low){low=state.player.board[j].hp; targetIdx=j}} // perform attack
      // simultaneous
      const defender = state.player.board[targetIdx]; defender.hp -= u.atk; u.hp -= defender.atk; u.canAttack=false; log(`KI's ${cardById(u.card).name} greift ${cardById(defender.card).name} an`); cleanupBoard(); if(state.player.hp<=0) break;
    } else { // attack player directly
      state.player.hp -= u.atk; u.canAttack=false; log(`KI's ${cardById(u.card).name} greift dich direkt (-${u.atk})`); checkEnd(); if(state.player.hp<=0) break; }
    }
    // after ai attacks allow ai units to attack next turn only
    state.ai.board.forEach(u=>u.canAttack=false);
    save(); }

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

  function log(msg){const l=$('game-log'); const time=new Date().toLocaleTimeString(); l.innerHTML = `<div>[${time}] ${msg}</div>` + l.innerHTML; }

  load(); bind(); renderHud();
  window.__ncg__ = {state,save,load,startBattle};
})();
