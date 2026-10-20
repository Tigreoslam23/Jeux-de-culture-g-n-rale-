(function(){
  'use strict';
  const $=id=>document.getElementById(id), R=MasterRules;
  const screens=['setup','ready','game','tally','round-result','final'];
  const fmt=n=>(Math.round(n)||0).toLocaleString('fr-FR');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let state='setup',players=[],deck=[],round=0,turn=0,answers=[];
  let playMode='solo';
  let entry='',era=1,last=null,bricks=0,startedAt=0,clock=null,expired=false;
  let epoch=0,pending=new Set(),soundOn=true,audio=null,audioBus=null;

  // A screen change invalidates all old animation callbacks and clocks.
  function clearWork(){epoch++;pending.forEach(clearTimeout);pending.clear();if(clock!==null)clearInterval(clock);clock=null;}
  function later(fn,ms){const token=epoch;const id=setTimeout(()=>{pending.delete(id);if(token===epoch)fn();},ms);pending.add(id);return id;}
  function show(name,focus){
    clearWork();screens.forEach(id=>$(id).hidden=id!==name);document.body.classList.toggle('in-game',name==='game');
    $('celebration').hidden=true;$('help').disabled=name==='game';
    window.scrollTo({top:0,behavior:'instant'});
    if(focus)$(focus).focus({preventScroll:true});
  }
  function shuffle(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function pickEvents(count){
    const groups=Array.from({length:6},()=>[]);
    EVENTS.forEach(e=>{const y=e.date[0];groups[y<1000?0:y<1500?1:y<1789?2:y<1816?3:y<1914?4:5].push(e);});
    groups.forEach((g,i)=>groups[i]=shuffle(g));
    const selected=[];
    while(selected.length<count){let added=false;for(const i of shuffle([0,1,2,3,4,5]))if(groups[i].length&&selected.length<count){selected.push(groups[i].pop());added=true;}if(!added)break;}
    return selected;
  }
  // Preserve the source bank, but do not print the answer inside its question.
  function questionTitle(event){return event.title.replace(/^Vers \d{3,4},\s*/i,'').replace(/l’automne 1947/,'l’automne, après la Libération').replace(/de Mai 68/,'des « événements de mai »');}
  function playTone(kind){
    if(!soundOn)return;
    try{
      if(!audio){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;audio=new Context();audioBus=audio.createGain();audioBus.gain.value=.45;audioBus.connect(audio.destination);}
      audio.resume().catch(()=>{});
      if(kind==='arrival'){
        // Bright harmonic brass, a tongued attack and a short ceremonial fanfare.
        const real=new Float32Array(13),imag=new Float32Array([0,1,.85,.65,.5,.35,.27,.18,.12,.08,.05,.03,.02]);
        const brass=audio.createPeriodicWave(real,imag);
        [[523.25,0,.12],[523.25,.16,.12],[659.25,.32,.14],[783.99,.52,.48]].forEach(([freq,offset,length])=>{
          [1,.5].forEach((octave,voice)=>{
            const at=audio.currentTime+offset,osc=audio.createOscillator(),gain=audio.createGain(),filter=audio.createBiquadFilter();
            osc.setPeriodicWave(brass);osc.frequency.setValueAtTime(freq*octave*.985,at);osc.frequency.exponentialRampToValueAtTime(freq*octave,at+.025);
            filter.type='lowpass';filter.frequency.setValueAtTime(1400,at);filter.frequency.linearRampToValueAtTime(4600,at+.035);filter.frequency.linearRampToValueAtTime(2200,at+length);filter.Q.value=.6;
            const volume=voice?.1:.23;gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(volume,at+.018);gain.gain.setValueAtTime(volume*.8,at+length*.75);gain.gain.exponentialRampToValueAtTime(.0001,at+length+.065);
            osc.connect(filter);filter.connect(gain);gain.connect(audioBus);osc.start(at);osc.stop(at+length+.08);
          });
        });
        return;
      }
      if(kind==='hit'){
        // Comic PAF: a low punch plus a short, filtered burst of noisy air.
        const at=audio.currentTime,thump=audio.createOscillator(),body=audio.createGain();
        thump.type='triangle';thump.frequency.setValueAtTime(190,at);thump.frequency.exponentialRampToValueAtTime(48,at+.13);
        body.gain.setValueAtTime(.0001,at);body.gain.exponentialRampToValueAtTime(.65,at+.005);body.gain.exponentialRampToValueAtTime(.0001,at+.19);
        thump.connect(body);body.connect(audioBus);thump.start(at);thump.stop(at+.2);
        const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*.18),audio.sampleRate),samples=buffer.getChannelData(0);
        for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
        const noise=audio.createBufferSource(),filter=audio.createBiquadFilter(),puff=audio.createGain();noise.buffer=buffer;filter.type='bandpass';filter.frequency.value=1100;filter.Q.value=.7;
        puff.gain.setValueAtTime(.8,at);puff.gain.exponentialRampToValueAtTime(.0001,at+.17);noise.connect(filter);filter.connect(puff);puff.connect(audioBus);noise.start(at);noise.stop(at+.18);
        return;
      }
      const notes=kind==='win'?[523,659,784,1047]:[420];
      notes.forEach((freq,i)=>{const osc=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime+i*.09;osc.type='sine';osc.frequency.setValueAtTime(freq,at);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.15,at+.01);gain.gain.exponentialRampToValueAtTime(.0001,at+.14);osc.connect(gain);gain.connect(audioBus);osc.start(at);osc.stop(at+.15);});
    }catch(_){/* Sound is optional: an audio error must never stop a turn. */}
  }
  function controls(){
    const active=state==='playing';
    document.querySelectorAll('#keypad button, .era-picker button').forEach(b=>b.disabled=!active);
    $('submit').disabled=!active||!validYear();$('keep').disabled=!active||last===null;
    document.querySelector('.keypad-panel').classList.toggle('locked',!active);
  }
  function validYear(){return /^\d{1,4}$/.test(entry)&&Number(entry)>0;}
  function renderEntry(){
    $('entry').textContent=entry||'— — — —';$('entry-era').textContent=era===1?'après J.-C.':'avant J.-C.';
    $('ce').setAttribute('aria-pressed',String(era===1));$('bce').setAttribute('aria-pressed',String(era===-1));controls();
  }
  function input(key){
    if(state!=='playing')return;
    if(elapsed()>=R.DURATION){tick();return;}
    if(key==='clear')entry='';else if(key==='back')entry=entry.slice(0,-1);else if(entry.length<4)entry+=key;
    $('input-status').textContent='Valide pour savoir si c’est plus ou moins.';renderEntry();
  }
  function ready(){
    state='ready';show('ready','ready-name');
    $('ready-progress').textContent=progressLabel();
    $('ready-name').textContent=`À toi, ${players[turn].name} !`;
    $('ready-instructions').textContent=playMode==='solo'?'Un événement, vingt secondes : à toi de viser juste !':'Les autres joueurs détournent le regard. Le même événement attend toute la troupe.';
  }
  function progressLabel(){return `Manche ${round+1} / ${deck.length} · ${playMode==='solo'?'Solo':`Joueur ${turn+1} / ${players.length}`}`;}
  function chooseMode(mode){
    if(state!=='setup')return;playMode=mode;const solo=mode==='solo';
    $('mode-solo').setAttribute('aria-pressed',String(solo));$('mode-multi').setAttribute('aria-pressed',String(!solo));
    $('solo-fields').hidden=!solo;$('multi-fields').hidden=solo;
    $('mode-description').textContent=solo?'Seul face à l’histoire : vise le meilleur score !':'Un même écran, chacun son tour. Que le meilleur gagne !';
    $('begin').textContent=solo?'Lancer mon défi ➜':'Lancer la partie ➜';$('setup-error').textContent='';
  }
  function launch(){
    if(state!=='ready')return;
    show('game');state='entering';last=null;bricks=0;entry='';era=1;expired=false;
    $('game-progress').textContent=progressLabel();
    $('game-player').textContent=players[turn].name;
    $('event-title').textContent=questionTitle(deck[round]);$('approx-note').hidden=!deck[round].approx;
    $('plus-bricks').replaceChildren();$('minus-bricks').replaceChildren();
    $('submitted-year').className='';$('submitted-year').textContent='?';$('guess-label').textContent='À TOI DE VISER';
    $('feedback').className='';$('feedback').textContent='L’histoire attend ta réponse.';
    $('hammer').classList.remove('hit');$('impact').classList.remove('hit');
    $('brick-cost').textContent='0 brique · 0 pt';$('saved-time').textContent='Aucune réponse enregistrée';
    $('time').textContent='20.0';$('live-points').textContent='20 000';$('time-fill').style.transform='scaleX(1)';
    $('time-progress').setAttribute('aria-valuenow','0');$('time-progress').classList.remove('urgent');$('watch').classList.remove('urgent');
    $('input-status').textContent='Prépare-toi…';renderEntry();
    $('event-card').classList.remove('entering');void $('event-card').offsetWidth;$('event-card').classList.add('entering');playTone('arrival');
    later(()=>{
      $('event-card').classList.remove('entering');state='playing';startedAt=performance.now();
      $('input-status').textContent='À toi ! Propose une année.';controls();
      tick();clock=setInterval(tick,40);
    },reduced?150:1400);
  }
  function elapsed(){return Math.min(R.DURATION,Math.max(0,(performance.now()-startedAt)/1000));}
  function tick(){
    if(state!=='playing'&&state!=='animating')return;
    const e=elapsed(),left=Math.max(0,R.DURATION-e);
    $('time').textContent=(Math.ceil(left*10)/10).toFixed(1);
    $('live-points').textContent=fmt(R.timePoints(e));$('time-fill').style.transform=`scaleX(${left/R.DURATION})`;
    $('time-progress').setAttribute('aria-valuenow',e.toFixed(1));
    $('watch').classList.toggle('urgent',left<=5);$('time-progress').classList.toggle('urgent',left<=5);
    if(left<=0){expired=true;if(clock!==null)clearInterval(clock);clock=null;if(state==='playing')finishTurn('timeout');}
  }
  function submit(){
    if(state!=='playing')return;
    const seconds=elapsed();
    if(seconds>=R.DURATION){tick();return;}
    if(!validYear()){$('input-status').textContent='Saisis une année de 1 à 9999 (sans année zéro).';return;}
    const year=Number(entry)*era;
    if(last&&last.year===year){$('input-status').textContent='Cette année est déjà enregistrée. Ajuste-la ou garde ta réponse.';return;}
    const target=deck[round].date[0],exact=year===target;
    last={year,seconds};state='animating';controls();
    $('guess-label').textContent='TA PROPOSITION';$('submitted-year').className='';
    $('submitted-year').textContent=String(Math.abs(year));
    if(year<0){const small=document.createElement('small');small.textContent='av. J.-C.';$('submitted-year').append(small);}
    void $('submitted-year').offsetWidth;$('submitted-year').className='pop';
    $('feedback').className='';$('feedback').textContent='';$('input-status').textContent='Le marteau rend son verdict…';
    $('saved-time').textContent=`Chrono retenu : ${fmt(R.timePoints(seconds))} pts`;
    playTone('key');
    // 300 ms pop, then 250 ms pause before the hammer / exact reveal.
    later(()=>{
      if(exact){finishTurn('exact');return;}
      $('hammer').classList.remove('hit');$('impact').classList.remove('hit');void $('hammer').offsetWidth;
      $('hammer').classList.add('hit');$('impact').classList.add('hit');$('submitted-year').className='squash';later(()=>playTone('hit'),reduced?0:180);
      later(()=>{
        const higher=year<target;bricks++;
        const brick=document.createElement('div');brick.className='brick';brick.textContent=String(Math.abs(year));
        const detail=document.createElement('small');detail.textContent=year<0?'av. J.-C. · −500':'−500 pts';brick.append(detail);
        brick.title=`${R.yearText(year)} : c’est ${higher?'plus':'moins'} ! −500 points`;
        $(higher?'plus-bricks':'minus-bricks').append(brick);$(higher?'plus-bricks':'minus-bricks').scrollTop=0;
        $('submitted-year').className='';$('submitted-year').textContent=higher?'↗':'↙';
        $('feedback').className=`hint ${higher?'plus':'minus'}`;$('feedback').textContent=higher?'C’EST PLUS !':'C’EST MOINS !';
        $('guess-label').textContent=`APRÈS ${R.yearText(year)}…`;
        $('brick-cost').textContent=`${bricks} brique${bricks>1?'s':''} · −${fmt(bricks*500)} pts`;
        entry='';state='playing';renderEntry();$('input-status').textContent='Un nouvel essai, ou garde ta réponse.';
        if(expired||elapsed()>=R.DURATION)finishTurn('timeout');
      },reduced?30:260);
    },reduced?50:550);
  }
  function finishTurn(reason){
    if(state==='finishing'||state==='tally'||state==='ready')return;
    state='finishing';if(clock!==null)clearInterval(clock);clock=null;controls();
    const result=R.score(last?last.year:null,deck[round].date[0],last?last.seconds:R.DURATION,bricks);
    const answer={player:turn,guess:last?last.year:null,seconds:last?last.seconds:R.DURATION,bricks,reason,...result};
    answers.push(answer);players[turn].score+=result.total;
    if(result.exact){
      $('feedback').textContent='TOUT PILE !';$('input-status').textContent='Exactement la bonne année !';
      $('celebration').querySelectorAll('.confetti').forEach(n=>n.remove());
      if(!reduced)for(let i=0;i<35;i++){const bit=document.createElement('i');bit.className='confetti';bit.style.setProperty('--x',`${Math.random()*100}%`);bit.style.setProperty('--c',['#ffcf4b','#3dd5bd','#ff896d','#fff5da'][i%4]);bit.style.setProperty('--delay',`${Math.random()*.3}s`);$('celebration').append(bit);}
      $('celebration').hidden=false;playTone('win');later(()=>showTally(answer),reduced?650:1600);
    }else showTally(answer);
  }
  function countTo(id,value,delay){
    $(id).textContent='0';
    later(()=>{const begin=performance.now();const animate=()=>{const p=reduced?1:Math.min(1,(performance.now()-begin)/260);$(id).textContent=(value>0?'+ ':'')+fmt(value*(1-Math.pow(1-p,3)));if(p<1)later(animate,20);};animate();},reduced?0:delay);
  }
  function showTally(a){
    state='tally';show('tally','tally-title');
    $('tally-privacy').hidden=playMode==='solo';
    $('tally-kicker').textContent=`${players[a.player].name} · Manche ${round+1}`;
    $('tally-title').textContent=a.exact?'Un coup de maître !':a.guess===null?'Le temps a filé !':a.reason==='keep'?'Réponse conservée !':'Temps écoulé !';
    $('tally-description').textContent=a.guess===null?'Aucune année validée : pas de points pour cette manche.':`Dernière proposition : ${R.yearText(a.guess)}. Voici tes points.`;
    $('elapsed-detail').textContent=a.guess===null?'Aucune validation':`figé à ${a.seconds.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} s`;
    $('bricks-detail').textContent=`${a.bricks} × −500 pts`;
    $('gap-detail').textContent=a.gap===null?'Aucune réponse':a.gap===0?'Année exacte : bonus ci-dessous':`${a.gap} an${a.gap>1?'s':''} d’écart${a.gap<=10?` · 5 000 − ${a.gap} × 500`:' · au-delà de 10 ans'}`;
    countTo('tally-time',a.time,0);countTo('tally-bricks',-a.penalty,220);countTo('tally-gap',a.proximity,440);countTo('tally-exact',a.exact,660);
    $('tally-total').textContent='0';later(()=>{const start=performance.now();const step=()=>{const p=reduced?1:Math.min(1,(performance.now()-start)/420);$('tally-total').textContent=fmt(a.total*(1-Math.pow(1-p,3)));if(p<1)later(step,20);};step();},reduced?0:920);
    $('tally-next').textContent=turn+1<players.length?'Passer au joueur suivant ➜':'Voir le verdict de la manche ➜';
  }
  function cell(row,text){const td=document.createElement('td');td.textContent=text;row.append(td);}
  function reveal(){
    state='round-result';show('round-result','reveal-heading');const event=deck[round];
    $('reveal-progress').textContent=`Manche ${round+1} / ${deck.length} · ${playMode==='solo'?'Ton résultat':'Tous les joueurs ont répondu'}`;
    $('reveal-event').textContent=event.title;$('reveal-year').textContent=(event.approx?'Vers ':'')+R.yearText(event.date[0]);
    $('event-source').href=event.url;$('event-source').textContent=`Consulter ${event.sourceLabel||'la source historique'} ↗`;
    $('round-body').replaceChildren();
    [...answers].sort((a,b)=>b.total-a.total).forEach(a=>{const tr=document.createElement('tr');cell(tr,players[a.player].name);cell(tr,a.guess===null?'—':R.yearText(a.guess));cell(tr,a.gap===null?'—':a.gap===0?'TOUT PILE !':`${a.gap} an${a.gap>1?'s':''}`);cell(tr,fmt(a.total));cell(tr,fmt(players[a.player].score));$('round-body').append(tr);});
    $('next-round').textContent=round+1===deck.length?(playMode==='solo'?'Mon bilan final ➜':'Le classement final ➜'):'Manche suivante ➜';
  }
  function final(){
    state='final';show('final','final-title');const order=[...players].sort((a,b)=>b.score-a.score),winners=order.filter(p=>p.score===order[0].score);
    $('final-kicker').textContent=playMode==='solo'?'TU AS ÉCRIT L’HISTOIRE':'LA TROUPE A ÉCRIT L’HISTOIRE';
    $('final-title').textContent=players.length===1?`${fmt(order[0].score)} points. Bien joué !`:winners.length>1?'Victoire partagée !':`${order[0].name}, quel panache !`;
    $('leaderboard').replaceChildren();let rank=1;
    order.forEach((p,i)=>{if(i===0||p.score!==order[i-1].score)rank=i+1;const row=document.createElement('div');row.className='leader';const place=document.createElement('b');place.textContent=String(rank).padStart(2,'0');const name=document.createElement('span');name.textContent=p.name;const points=document.createElement('strong');points.textContent=`${fmt(p.score)} pts`;row.append(place,name,points);$('leaderboard').append(row);});
  }
  $('begin').addEventListener('click',()=>{
    if(state!=='setup')return;
    const names=playMode==='solo'?[$('solo-name').value.trim()||'Joueur solo']:R.parseNames($('players').value);
    if(!names||(playMode==='multi'&&names.length<2)){$('setup-error').textContent='Indique de 2 à 8 noms différents, un par ligne.';return;}
    $('setup-error').textContent='';players=names.map(name=>({name,score:0}));deck=pickEvents(Number($('round-count').value));round=0;turn=0;answers=[];ready();
  });
  $('mode-solo').addEventListener('click',()=>chooseMode('solo'));
  $('mode-multi').addEventListener('click',()=>chooseMode('multi'));
  chooseMode('solo');
  $('launch').addEventListener('click',launch);
  $('keypad').addEventListener('click',e=>{const b=e.target.closest('button[data-key]');if(b)input(b.dataset.key);});
  $('ce').addEventListener('click',()=>{if(state==='playing'){era=1;renderEntry();}});
  $('bce').addEventListener('click',()=>{if(state==='playing'){era=-1;renderEntry();}});
  $('submit').addEventListener('click',submit);
  $('keep').addEventListener('click',()=>{if(state==='playing'&&last){if(elapsed()>=R.DURATION)tick();else finishTurn('keep');}});
  $('tally-next').addEventListener('click',()=>{if(state!=='tally')return;turn++;if(turn<players.length)ready();else reveal();});
  $('next-round').addEventListener('click',()=>{if(state!=='round-result')return;round++;turn=0;answers=[];if(round<deck.length)ready();else final();});
  $('again').addEventListener('click',()=>{if(state!=='final')return;state='setup';show('setup');$('begin').focus({preventScroll:true});});
  $('sound').addEventListener('click',()=>{soundOn=!soundOn;$('sound').textContent=`Son : ${soundOn?'ON':'OFF'}`;$('sound').setAttribute('aria-pressed',String(soundOn));$('sound').title=soundOn?'Désactiver les effets sonores':'Activer les effets sonores';if(audioBus)audioBus.gain.setTargetAtTime(soundOn?.45:0,audio.currentTime,.015);if(soundOn)playTone('key');});
  $('help').addEventListener('click',()=>$('rules-dialog').showModal());
  $('close-rules').addEventListener('click',()=>$('rules-dialog').close());
  $('rules-dialog').addEventListener('click',e=>{if(e.target===$('rules-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  document.addEventListener('keydown',e=>{
    if(state!=='playing'||$('rules-dialog').open||e.ctrlKey||e.altKey||e.metaKey)return;
    if(/^\d$/.test(e.key)){e.preventDefault();input(e.key);}
    else if(e.key==='Backspace'){e.preventDefault();input('back');}
    else if(e.key==='Escape'||e.key==='Delete'){e.preventDefault();input('clear');}
    else if(e.key==='Enter'){if(['keep','sound'].includes(e.target?.id))return;e.preventDefault();submit();}
    else if(e.key==='-'||e.key==='+'){e.preventDefault();era=e.key==='-'?-1:1;renderEntry();}
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
})();
