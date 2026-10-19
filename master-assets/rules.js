/* Règles de score indépendantes de l’affichage. */
(function(root){
  'use strict';
  const DURATION=20;
  const timePoints=seconds=>Math.round(10000-250*Math.min(DURATION,Math.max(0,seconds)));
  function score(guess,target,seconds,bricks){
    if(guess===null)return {time:0,penalty:0,gap:null,proximity:0,exact:0,total:0};
    const gap=Math.abs(guess-target),time=timePoints(seconds),penalty=bricks*200;
    const proximity=gap>0&&gap<=20?5000-gap*250:0,exact=gap===0?5000:0;
    return {time,penalty,gap,proximity,exact,total:Math.max(0,time-penalty+proximity+exact)};
  }
  function parseNames(text){
    const names=text.split(/[\n,;]+/).map(n=>n.trim()).filter(Boolean);
    if(names.length<1||names.length>8||new Set(names.map(n=>n.toLocaleLowerCase('fr'))).size!==names.length)return null;
    return names;
  }
  const yearText=year=>year<0?`${-year} av. J.-C.`:String(year);
  const rules={DURATION,timePoints,score,parseNames,yearText};
  if(typeof module!=='undefined'&&module.exports)module.exports=rules;
  else root.MasterRules=rules;
})(typeof window!=='undefined'?window:globalThis);
