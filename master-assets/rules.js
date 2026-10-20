/* Règles de score indépendantes de l’affichage. */
(function(root){
  'use strict';
  const DURATION=65;
  const timePoints=seconds=>Math.round(Math.max(2000,20000-300*Math.max(0,seconds-5)));
  const THRESHOLDS=[{gap:100,seconds:3},{gap:20,seconds:4},{gap:5,seconds:5}];
  function score(guess,target,seconds,bricks){
    if(guess===null)return {time:0,penalty:0,gap:null,proximity:0,exact:0,total:0};
    const gap=Math.abs(guess-target),time=timePoints(seconds),penalty=bricks*500;
    const proximity=gap>0&&gap<=10?5000-gap*500:0,exact=gap===0?6000:0;
    return {time,penalty,gap,proximity,exact,total:Math.max(0,time-penalty+proximity+exact)};
  }
  function parseNames(text){
    const names=text.split(/[\n,;]+/).map(n=>n.trim()).filter(Boolean);
    if(names.length<1||names.length>8||new Set(names.map(n=>n.toLocaleLowerCase('fr'))).size!==names.length)return null;
    return names;
  }
  const yearText=year=>year<0?`${-year} av. J.-C.`:String(year);
  const rules={DURATION,THRESHOLDS,timePoints,score,parseNames,yearText};
  if(typeof module!=='undefined'&&module.exports)module.exports=rules;
  else root.MasterRules=rules;
})(typeof window!=='undefined'?window:globalThis);
