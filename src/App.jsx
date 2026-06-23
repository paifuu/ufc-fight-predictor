import React, { useState, useEffect, useRef } from "react";
import FIGHTER_DB_RAW from "./data/fighters.json";
import EVENTS_DATA from "./data/events.json";

// ─── FIGHTER DATABASE ──────────────────────────────────────────────────────
// Data lives in src/data/fighters.json — auto-updated by scripts/update_ufc_data.py

// Auto-derive styleMatchups from a fighter's stats when none are hand-curated.
// Returns a map of { style: bonus } where positive = advantage, negative = disadvantage.
function deriveStyleMatchups(s) {
  if (!s) return {};
  const isStriker   = s.slpm  >= 4.5 && s.tdavg < 1.5;
  const isWrestler  = s.tdavg >= 2.0;
  const isGrappler  = s.subavg >= 0.8 || s.tdavg >= 1.5;
  const isDefensive = s.strdef >= 60 && s.tddef >= 65;

  const matchups = {};
  if (isStriker) {
    // Strikers do well vs Wrestlers (keep distance) but struggle vs BJJ (taken down)
    matchups["Wrestler"]     = -6;
    matchups["BJJ"]          = -4;
    matchups["Striker"]      =  0;
    matchups["Kickboxer"]    =  2;
    matchups["Boxer"]        =  3;
    matchups["Grappler"]     = -5;
    matchups["Mixed"]        =  2;
  } else if (isWrestler) {
    matchups["Striker"]      =  7;
    matchups["Kickboxer"]    =  6;
    matchups["Boxer"]        =  5;
    matchups["BJJ"]          = -3;
    matchups["Grappler"]     = -2;
    matchups["Wrestler"]     =  0;
    matchups["Mixed"]        =  3;
  } else if (isGrappler) {
    matchups["Striker"]      =  5;
    matchups["Kickboxer"]    =  4;
    matchups["Boxer"]        =  4;
    matchups["Wrestler"]     =  2;
    matchups["BJJ"]          =  0;
    matchups["Grappler"]     =  0;
    matchups["Mixed"]        =  2;
  } else {
    // Balanced/Mixed — slight edge vs pure specialists
    matchups["Striker"]      =  1;
    matchups["Kickboxer"]    =  1;
    matchups["Boxer"]        =  1;
    matchups["Wrestler"]     =  1;
    matchups["BJJ"]          =  1;
    matchups["Grappler"]     =  1;
    matchups["Mixed"]        =  0;
  }
  // Defensive fighters get a small bonus across all matchups
  if (isDefensive) Object.keys(matchups).forEach(k => { matchups[k] += 2; });
  return matchups;
}

// Build past-matchup index from events data: { "Fighter A||Fighter B": winnerName|null }
const PAST_MATCHUP_INDEX = (() => {
  const idx = {};
  const allEvents = [
    ...(EVENTS_DATA.past || []),
    ...(EVENTS_DATA.upcoming || []),
  ];
  for (const evt of allEvents) {
    for (const fight of (evt.fights || [])) {
      const { f1, f2, actualWinner } = fight;
      if (!f1 || !f2 || !actualWinner) continue;
      const key = [f1, f2].sort().join("||");
      const w = actualWinner.toLowerCase();
      idx[key] = (w === "draw" || w === "no contest") ? null : actualWinner;
    }
  }
  return idx;
})();

function getPastMatchupMod(name1, name2) {
  const key = [name1, name2].sort().join("||");
  const winner = PAST_MATCHUP_INDEX[key];
  if (winner === undefined) return 0;
  if (winner === null) return 0; // draw/NC
  if (winner === name1) return 10;   // f1 won previously
  if (winner === name2) return -12;  // f2 won previously
  return 0;
}

const FIGHTER_DB = Object.fromEntries(
  Object.entries(FIGHTER_DB_RAW).map(([k, f]) => {
    if (f.styleMatchups && Object.keys(f.styleMatchups).length > 0) return [k, f];
    return [k, { ...f, styleMatchups: deriveStyleMatchups(f.stats) }];
  })
);
const FIGHTER_NAMES = Object.keys(FIGHTER_DB).sort();

// Height / stance / nationality not in the scoring DB — kept separate so scoring logic stays clean
const FIGHTER_EXTRAS = {
  "Ilia Topuria":          { height:'5\'10"', stance:"Orthodox",  nationality:"Georgia" },
  "Justin Gaethje":        { height:'5\'11"', stance:"Orthodox",  nationality:"USA" },
  "Alex Pereira":          { height:'6\'4"',  stance:"Orthodox",  nationality:"Brazil" },
  "Ciryl Gane":            { height:'6\'6"',  stance:"Orthodox",  nationality:"France" },
  "Sean O'Malley":         { height:'5\'11"', stance:"Southpaw",  nationality:"USA" },
  "Aiemann Zahabi":        { height:'5\'7"',  stance:"Orthodox",  nationality:"Canada" },
  "Mauricio Ruffy":        { height:'5\'10"', stance:"Southpaw",  nationality:"Brazil" },
  "Michael Chandler":      { height:'5\'8"',  stance:"Orthodox",  nationality:"USA" },
  "Bo Nickal":             { height:'6\'1"',  stance:"Orthodox",  nationality:"USA" },
  "Diego Lopes":           { height:'5\'10"', stance:"Orthodox",  nationality:"Brazil" },
  "Conor McGregor":        { height:'5\'9"',  stance:"Southpaw",  nationality:"Ireland" },
  "Max Holloway":          { height:'5\'11"', stance:"Orthodox",  nationality:"USA" },
  "Paddy Pimblett":        { height:'5\'10"', stance:"Orthodox",  nationality:"England" },
  "Benoit Saint Denis":    { height:'5\'10"', stance:"Orthodox",  nationality:"France" },
  "Cory Sandhagen":        { height:'6\'0"',  stance:"Southpaw",  nationality:"USA" },
  "Mario Bautista":        { height:'5\'8"',  stance:"Orthodox",  nationality:"USA" },
  "Gable Steveson":        { height:'5\'10"', stance:"Orthodox",  nationality:"USA" },
  "Elisha Ellison":        { height:'6\'3"',  stance:"Orthodox",  nationality:"USA" },
  "Brandon Royval":        { height:'5\'6"',  stance:"Orthodox",  nationality:"USA" },
  "Lone\'er Kavanagh":     { height:'5\'5"',  stance:"Orthodox",  nationality:"England" },
  "Manel Kape":            { height:'5\'5"',  stance:"Southpaw",  nationality:"Angola" },
  "Kyoji Horiguchi":       { height:'5\'4"',  stance:"Orthodox",  nationality:"Japan" },
  "Kai Kara-France":       { height:'5\'7"',  stance:"Orthodox",  nationality:"New Zealand" },
  "Rafael Fiziev":         { height:'5\'10"', stance:"Orthodox",  nationality:"Kazakhstan" },
  "Renato Moicano":        { height:'5\'11"', stance:"Orthodox",  nationality:"Brazil" },
  "Magomed Ankalaev":      { height:'6\'3"',  stance:"Orthodox",  nationality:"Russia" },
  "Khalil Rountree Jr.":   { height:'6\'2"',  stance:"Southpaw",  nationality:"USA" },
  "Kevin Holland":         { height:'6\'3"',  stance:"Southpaw",  nationality:"USA" },
  "Umar Nurmagomedov":     { height:'5\'9"',  stance:"Orthodox",  nationality:"Russia" },
  "David Martinez":        { height:'5\'8"',  stance:"Orthodox",  nationality:"Spain" },
  "Shara Magomedov":       { height:'6\'1"',  stance:"Orthodox",  nationality:"Russia" },
  "Manuel Torres":         { height:'5\'9"',  stance:"Orthodox",  nationality:"Mexico" },
  "Michel Pereira":        { height:'6\'0"',  stance:"Southpaw",  nationality:"Brazil" },
  "Leon Edwards":          { height:'6\'0"',  stance:"Southpaw",  nationality:"England" },
  "Daniel Rodriguez":      { height:'5\'9"',  stance:"Orthodox",  nationality:"USA" },
  "Jon Jones":             { height:'6\'4"',  stance:"Orthodox",  nationality:"USA" },
  "Islam Makhachev":       { height:'5\'10"', stance:"Orthodox",  nationality:"Russia" },
  "Charles Oliveira":      { height:'5\'10"', stance:"Orthodox",  nationality:"Brazil" },
  "Dricus Du Plessis":     { height:'6\'0"',  stance:"Orthodox",  nationality:"South Africa" },
  "Belal Muhammad":        { height:'5\'11"', stance:"Southpaw",  nationality:"USA" },
  "Song Yadong":           { height:'5\'7"',  stance:"Orthodox",  nationality:"China" },
  "Deiveson Figueiredo":   { height:'5\'5"',  stance:"Orthodox",  nationality:"Brazil" },
  "Uros Medic":            { height:'6\'0"',  stance:"Orthodox",  nationality:"Serbia" },
  "Zhang Weili":           { height:'5\'4"',  stance:"Orthodox",  nationality:"China" },
  "Rose Namajunas":        { height:'5\'5"',  stance:"Southpaw",  nationality:"USA" },
  "Yan Xiaonan":           { height:'5\'5"',  stance:"Southpaw",  nationality:"China" },
  "Tatiana Suarez":        { height:'5\'4"',  stance:"Orthodox",  nationality:"USA" },
  "Mackenzie Dern":        { height:'5\'5"',  stance:"Orthodox",  nationality:"USA" },
  "Luana Santos":          { height:'5\'6"',  stance:"Orthodox",  nationality:"Brazil" },
  "Virna Jandiroba":       { height:'5\'5"',  stance:"Orthodox",  nationality:"Brazil" },
  "Marina Rodriguez":      { height:'5\'7"',  stance:"Southpaw",  nationality:"Brazil" },
  "Amanda Lemos":          { height:'5\'5"',  stance:"Southpaw",  nationality:"Brazil" },
  "Alexa Grasso":          { height:'5\'4"',  stance:"Orthodox",  nationality:"Mexico" },
  "Valentina Shevchenko":  { height:'5\'5"',  stance:"Southpaw",  nationality:"Kyrgyzstan" },
  "Erin Blanchfield":      { height:'5\'6"',  stance:"Orthodox",  nationality:"USA" },
  "Manon Fiorot":          { height:'5\'6"',  stance:"Orthodox",  nationality:"France" },
  "Natalia Silva":         { height:'5\'3"',  stance:"Orthodox",  nationality:"Brazil" },
  "Alexandre Pantoja":     { height:'5\'5"',  stance:"Orthodox",  nationality:"Brazil" },
  "Brandon Moreno":        { height:'5\'7"',  stance:"Orthodox",  nationality:"Mexico" },
  "Amir Albazi":           { height:'5\'6"',  stance:"Orthodox",  nationality:"Iraq" },
  "Steve Erceg":           { height:'5\'8"',  stance:"Orthodox",  nationality:"Australia" },
  "Muhammad Mokaev":       { height:'5\'6"',  stance:"Orthodox",  nationality:"England" },
  "Matheus Nicolau":       { height:'5\'8"',  stance:"Orthodox",  nationality:"Brazil" },
  "Merab Dvalishvili":     { height:'5\'7"',  stance:"Orthodox",  nationality:"Georgia" },
  "Henry Cejudo":          { height:'5\'4"',  stance:"Orthodox",  nationality:"USA" },
  "Petr Yan":              { height:'5\'7"',  stance:"Orthodox",  nationality:"Russia" },
  "Marlon Vera":           { height:'5\'7"',  stance:"Orthodox",  nationality:"Ecuador" },
  "Rob Font":              { height:'5\'9"',  stance:"Orthodox",  nationality:"USA" },
  "Jose Aldo":             { height:'5\'7"',  stance:"Orthodox",  nationality:"Brazil" },
  "Dominick Cruz":         { height:'5\'8"',  stance:"Orthodox",  nationality:"USA" },
  "Raquel Pennington":     { height:'5\'5"',  stance:"Orthodox",  nationality:"USA" },
  "Julianna Pena":         { height:'5\'6"',  stance:"Orthodox",  nationality:"USA" },
  "Holly Holm":            { height:'5\'8"',  stance:"Orthodox",  nationality:"USA" },
  "Mayra Bueno Silva":     { height:'5\'5"',  stance:"Orthodox",  nationality:"Brazil" },
  "Alexander Volkanovski": { height:'5\'6"',  stance:"Orthodox",  nationality:"Australia" },
  "Brian Ortega":          { height:'5\'8"',  stance:"Orthodox",  nationality:"USA" },
  "Arnold Allen":          { height:'5\'9"',  stance:"Orthodox",  nationality:"England" },
  "Giga Chikadze":         { height:'5\'11"', stance:"Southpaw",  nationality:"Georgia" },
  "Yair Rodriguez":        { height:'5\'11"', stance:"Orthodox",  nationality:"Mexico" },
  "Josh Emmett":           { height:'5\'6"',  stance:"Orthodox",  nationality:"USA" },
  "Movsar Evloev":         { height:'5\'11"', stance:"Orthodox",  nationality:"Russia" },
  "Dustin Poirier":        { height:'5\'9"',  stance:"Southpaw",  nationality:"USA" },
  "Beneil Dariush":        { height:'5\'11"', stance:"Orthodox",  nationality:"USA" },
  "Arman Tsarukyan":       { height:'5\'9"',  stance:"Southpaw",  nationality:"Armenia" },
  "Mateusz Gamrot":        { height:'5\'10"', stance:"Orthodox",  nationality:"Poland" },
  "Dan Hooker":            { height:'6\'0"',  stance:"Southpaw",  nationality:"New Zealand" },
  "Jalin Turner":          { height:'6\'2"',  stance:"Orthodox",  nationality:"USA" },
  "Colby Covington":       { height:'5\'11"', stance:"Orthodox",  nationality:"USA" },
  "Kamaru Usman":          { height:'6\'0"',  stance:"Orthodox",  nationality:"Nigeria" },
  "Gilbert Burns":         { height:'5\'10"', stance:"Orthodox",  nationality:"Brazil" },
  "Khamzat Chimaev":       { height:'6\'0"',  stance:"Orthodox",  nationality:"Sweden" },
  "Sean Brady":            { height:'6\'0"',  stance:"Orthodox",  nationality:"USA" },
  "Vicente Luque":         { height:'6\'0"',  stance:"Orthodox",  nationality:"Brazil" },
  "Geoff Neal":            { height:'6\'0"',  stance:"Orthodox",  nationality:"USA" },
  "Ian Garry":             { height:'6\'3"',  stance:"Southpaw",  nationality:"Ireland" },
  "Jack Della Maddalena":  { height:'6\'1"',  stance:"Orthodox",  nationality:"Australia" },
  "Sean Strickland":       { height:'6\'1"',  stance:"Orthodox",  nationality:"USA" },
  "Israel Adesanya":       { height:'6\'4"',  stance:"Southpaw",  nationality:"Nigeria" },
  "Robert Whittaker":      { height:'6\'0"',  stance:"Orthodox",  nationality:"Australia" },
  "Paulo Costa":           { height:'6\'0"',  stance:"Orthodox",  nationality:"Brazil" },
  "Marvin Vettori":        { height:'6\'0"',  stance:"Southpaw",  nationality:"Italy" },
  "Reinier de Ridder":     { height:'6\'5"',  stance:"Orthodox",  nationality:"Netherlands" },
  "Gregory Rodrigues":     { height:'6\'1"',  stance:"Orthodox",  nationality:"Brazil" },
  "Jiri Prochazka":        { height:'6\'4"',  stance:"Southpaw",  nationality:"Czech Republic" },
  "Jan Blachowicz":        { height:'6\'2"',  stance:"Orthodox",  nationality:"Poland" },
  "Jamahal Hill":          { height:'6\'4"',  stance:"Orthodox",  nationality:"USA" },
  "Aleksandar Rakic":      { height:'6\'3"',  stance:"Southpaw",  nationality:"Austria" },
  "Johnny Walker":         { height:'6\'5"',  stance:"Orthodox",  nationality:"Brazil" },
  "Tom Aspinall":          { height:'6\'5"',  stance:"Orthodox",  nationality:"England" },
  "Stipe Miocic":          { height:'6\'4"',  stance:"Orthodox",  nationality:"USA" },
  "Sergei Pavlovich":      { height:'6\'4"',  stance:"Orthodox",  nationality:"Russia" },
  "Curtis Blaydes":        { height:'6\'4"',  stance:"Orthodox",  nationality:"USA" },
  "Alexander Volkov":      { height:'6\'7"',  stance:"Orthodox",  nationality:"Russia" },
  "Tai Tuivasa":           { height:'6\'2"',  stance:"Orthodox",  nationality:"Australia" },
  "Jailton Almeida":       { height:'6\'2"',  stance:"Orthodox",  nationality:"Brazil" },
};

// ─── PAST RESULTS & UPCOMING EVENTS — loaded from src/data/events.json ─────────
const PAST_EVENTS = EVENTS_DATA.past;
const UPCOMING_EVENTS = EVENTS_DATA.upcoming;


// ─── SCORING ENGINE ─────────────────────────────────────────────────────────
function scoreFight(fighter1, fighter2) {
  const s1 = fighter1.stats, s2 = fighter2.stats;

  // 1. STRIKING
  const strikeOff1 = s1.slpm*(s1.stracc/100), strikeOff2 = s2.slpm*(s2.stracc/100);
  const rawStrike = (strikeOff1-strikeOff2)*8 + (s1.strdef-s2.strdef)*0.5;
  const striking = 50+Math.max(-42,Math.min(42,rawStrike));

  // 2. GRAPPLING — includes wrestler resilience: how they react after a failed TD
  const tdEff1 = s1.tdavg*(s1.tdacc/100), tdEff2 = s2.tdavg*(s2.tdacc/100);
  const wrestleResilBonus = ((fighter1.wrestlerResilience||5)-(fighter2.wrestlerResilience||5))*0.8;
  const rawGrapple = (tdEff1-tdEff2)*13 + (s1.tddef-s2.tddef)*0.6 + (s1.subavg-s2.subavg)*10 + wrestleResilBonus;
  const grappling = 50+Math.max(-44,Math.min(44,rawGrapple));

  // 3. CARDIO
  const ageScore = a => a<=29?2:a<=32?0:a<=35?-5:a<=37?-11:-18;
  const rawCardio = (ageScore(fighter1.age)-ageScore(fighter2.age)) + (s2.sapm-s1.sapm)*3.5;
  const cardio = 50+Math.max(-40,Math.min(40,rawCardio));

  // 4. POWER
  const rawPower = (s1.finishRate-s2.finishRate)*0.5+(s1.slpm-s2.slpm)*2.5;
  const power = 50+Math.max(-40,Math.min(40,rawPower));

  // 5. EXPERIENCE & OPPONENT QUALITY (light factor — recent form & style matter far more)
  // Moreno lost to Kavanagh, Figueiredo lost to rookies — experience alone doesn't win fights
  const rawExp = ((fighter1.opponentQuality??65)-(fighter2.opponentQuality??65))*0.25
               + (s1.winStreak-s2.winStreak)*1.2
               + (parseInt(fighter1.record)||0-(parseInt(fighter2.record)||0))*0.08;
  const experience = 50+Math.max(-18,Math.min(18,rawExp));  // hard cap ±18 so it can't dominate

  // 5b. RING RUST — penalises inactivity heavily; compounds with years out
  //     0-6mo = no penalty, 1yr = -4, 2yr = -9, 3yr+ = -15, 5yr = -22
  const rustPenalty = yi => {
    if (!yi || yi < 0.5) return 0;
    if (yi < 1)  return -3;
    if (yi < 2)  return -7;
    if (yi < 3)  return -12;
    if (yi < 4)  return -17;
    return -22;
  };
  const rust1 = rustPenalty(fighter1.yearsInactive ?? 0);
  const rust2 = rustPenalty(fighter2.yearsInactive ?? 0);
  const ringRustNet = rust1 - rust2; // negative = f1 more rusty

  // 5c. RECENT FORM — 0-10 scale, 5 = average. Weighted heavily.
  //     Elite current form (9-10) vs declining (2-3) = big swing
  const form1 = fighter1.recentForm ?? 5;
  const form2 = fighter2.recentForm ?? 5;
  const recentFormNet = (form1 - form2) * 2.2; // positive = f1 in better form

  // 6. STYLE MATCHUP — amplified; both directions
  const styleBonus1 = fighter1.styleMatchups?.[fighter2.style]??0;
  const styleBonus2 = fighter2.styleMatchups?.[fighter1.style]??0;
  const styleNet = (styleBonus1-styleBonus2)*1.7;

  // 7. SIZE — nonlinear; each weight class matters more than the last
  const nwd = (fighter1.naturalWeight??0)-(fighter2.naturalWeight??0);
  const rd = (fighter1.reach??70)-(fighter2.reach??70);
  const weightBonus = Math.sign(nwd)*Math.pow(Math.abs(nwd)/15,1.5)*6;
  const reachBonus = rd*0.4
    + ((fighter1.reachDisadvantageHandling??5)-(fighter2.reachDisadvantageHandling??5))*0.5;
  const sizeBonus = weightBonus+reachBonus;

  // 8. PAST MATCHUP — check events data first, fall back to hand-curated pastMatchups
  let pastMod = getPastMatchupMod(fighter1.name, fighter2.name);
  if (pastMod === 0) {
    if(fighter1.pastMatchups?.[fighter2.name]==="W") pastMod=10;
    if(fighter1.pastMatchups?.[fighter2.name]==="L") pastMod=-12;
    if(fighter2.pastMatchups?.[fighter1.name]==="W") pastMod=-10;
    if(fighter2.pastMatchups?.[fighter1.name]==="L") pastMod=12;
  }

  // 9. SPEED / HANDS HANDLING
  const speedHandsBonus = ((fighter1.speedVsHandsHandling??5)-(fighter2.speedVsHandsHandling??5))*0.6;

  // COMPOSITE — no hard cap; allow extreme mismatches to show through
  // Core category weights — style, striking, grappling and power dominate
  // Experience is a small tiebreaker only, recent form handled as direct modifier
  const core = striking*0.26+grappling*0.24+cardio*0.15+power*0.16+experience*0.07+(50+styleNet)*0.12;
  const raw = core+sizeBonus+pastMod+speedHandsBonus+ringRustNet+(recentFormNet*0.12);

  // Logistic squeeze so extreme values approach 0.5%/99.5% but never reach it
  // Center on 50, then apply sigmoid-like compression only at the extremes
  const deviation = raw-50;
  let f1WinPct;
  if(Math.abs(deviation)>30){
    // Beyond 30pt deviation, use strong compression toward 99.5/0.5
    const sign = Math.sign(deviation);
    const compressed = 30+Math.min(18,(Math.abs(deviation)-30)*0.55);
    f1WinPct = Math.round(50+sign*compressed);
  } else {
    f1WinPct = Math.round(raw);
  }
  f1WinPct = Math.min(99,Math.max(1,Math.round(f1WinPct)));
  const f2WinPct = 100 - f1WinPct;

  const cats={striking,grappling,cardio,power,experience};
  const catLabel=s=>{const d=Math.abs(s-50);return d<6?"even":d<15?"slight":d<28?"moderate":"significant";};

  // METHOD
  function predictMethod(){
    const ws=f1WinPct>=50?s1:s2, ls=f1WinPct>=50?s2:s1;
    const margin=Math.abs(f1WinPct-50);
    if(ws.subavg>1.0&&ls.tddef<68&&grappling>68) return{method:"Submission",round:"2"};
    if(ws.finishRate>75&&ls.strdef<57&&margin>15) return{method:"KO/TKO",round:ws.slpm>5.5?"1":"2"};
    if(ws.finishRate>58&&margin>10) return{method:"KO/TKO",round:"3"};
    return{method:"Decision",round:"Decision"};
  }
  const{method,round}=predictMethod();
  const winner=f1WinPct>=50?fighter1.name:fighter2.name;
  const confidence=Math.min(99,Math.round(50+Math.abs(f1WinPct-50)*1.05));

  // Notes
  const sw=styleNet>2?fighter1.name:styleNet<-2?fighter2.name:null;
  const styleNote=!sw?"Styles are relatively neutral — no glaring matchup edge."
    :`${sw}'s style creates a ${Math.abs(styleNet)>14?"severe":Math.abs(styleNet)>7?"significant":"mild"} matchup problem — this is a bad draw for the opponent.`;
  const sizeNote=Math.abs(nwd)>=15
    ?`${nwd>0?fighter1.name:fighter2.name} has a ~${Math.abs(nwd)}lb natural weight advantage (${(Math.abs(nwd)/15).toFixed(1)} weight classes) — a serious physical mismatch.`
    :Math.abs(rd)>=4
    ?`${rd>0?fighter1.name:fighter2.name} holds a ${Math.abs(rd)}" reach advantage, setting the terms of engagement.`
    :"Size and reach are closely matched.";
  const pastNote=pastMod!==0
    ?`Prior meeting: ${pastMod>0?fighter1.name:fighter2.name} won — both a psychological edge and a tactical blueprint.`
    :"No prior meeting between these fighters.";

  const rustNote=(() => {
    const yi1=fighter1.yearsInactive??0, yi2=fighter2.yearsInactive??0;
    if(yi1>=2&&yi2<0.5) return `${fighter1.name} has been out for ~${yi1} year${yi1!==1?"s":""} — ring rust is a serious factor. Timing, sharpness, and chin durability are all question marks.`;
    if(yi2>=2&&yi1<0.5) return `${fighter2.name} has been out for ~${yi2} year${yi2!==1?"s":""} — ring rust is a serious factor. Timing, sharpness, and chin durability are all question marks.`;
    if(yi1>=1&&yi2<0.5) return `${fighter1.name} has had a ~${yi1}yr layoff — some rust expected, especially in early rounds.`;
    if(yi2>=1&&yi1<0.5) return `${fighter2.name} has had a ~${yi2}yr layoff — some rust expected, especially in early rounds.`;
    return null;
  })();

  const formNote=(() => {
    const f1f=fighter1.recentForm??5, f2f=fighter2.recentForm??5;
    const diff=f1f-f2f;
    if(Math.abs(diff)<2) return null;
    const better=diff>0?fighter1.name:fighter2.name;
    const worse=diff>0?fighter2.name:fighter1.name;
    const betterForm=diff>0?f1f:f2f;
    const worseForm=diff>0?f2f:f1f;
    const label=Math.abs(diff)>4?"dramatically better recent form":Math.abs(diff)>2?"noticeably better recent form":"slightly better recent form";
    return `${better} (form: ${betterForm}/10) has ${label} than ${worse} (${worseForm}/10) — recent results carry heavy weight.`;
  })();

  const wrestleNote=(() => {
    const r1=fighter1.wrestlerResilience??5, r2=fighter2.wrestlerResilience??5;
    if(r1>7&&r2<5) return `${fighter1.name} is relentless after failed takedowns (${r1}/10) — ${fighter2.name} cannot rely on surviving one TD attempt to stop the wrestling.`;
    if(r2>7&&r1<5) return `${fighter2.name} will keep shooting even after failed TDs (${r2}/10) — their persistence is a major factor if ${fighter1.name} can't stop the takedowns.`;
    if(r1>7&&r2>7) return `Both fighters show high resilience after failed takedowns — grappling exchanges will be relentless.`;
    return null;
  })();

  return{
    f1WinPct,f2WinPct,winner,method,round,confidence,
    upsetChance:Math.max(1,100-confidence),
    cats,catLabel,styleNote,sizeNote,pastNote,wrestleNote,rustNote,formNote,
    styleNet,sizeBonus,pastMod,
    modifiers:[
      {label:"Style Matchup",      value:Math.round(styleNet),                                                 icon:"🥋"},
      {label:"Size / Reach",       value:Math.round(sizeBonus),                                                icon:"📏"},
      {label:"Recent Form",        value:Math.round(recentFormNet),                                            icon:"📈"},
      {label:"Ring Rust",          value:Math.round(-ringRustNet),                                             icon:"⏳"},
      {label:"Past Matchups",      value:pastMod,                                                              icon:"📜"},
      {label:"Opp. Quality Edge",  value:Math.round(((fighter1.opponentQuality??65)-(fighter2.opponentQuality??65))*0.8),  icon:"🏆"},
    ],
  };
}

const CAT_META=[
  {key:"striking",label:"Striking",icon:"👊"},
  {key:"grappling",label:"Grappling + Resilience",icon:"🤼"},
  {key:"cardio",label:"Cardio / Pace",icon:"🫁"},
  {key:"power",label:"Finishing Power",icon:"💥"},
  {key:"experience",label:"Exp. & Opp. Quality",icon:"🧠"},
];

function getCatNote(key,score,f1,f2){
  const w=score>50?f1:f2,l=score>50?f2:f1;
  const d=Math.abs(score-50);
  if(d<6) return"Both fighters are comparable here.";
  const n={
    striking:`${w.name} lands more clean strikes/min (${w.stats.slpm} SLpM, ${w.stats.stracc}% acc) with better defensive numbers.`,
    grappling:`${w.name} dominates grappling — ${w.stats.tdavg} TDs/15min at ${w.stats.tdacc}% acc, TD def ${w.stats.tddef}%. Wrestler resilience: ${w.wrestlerResilience??5}/10.`,
    cardio:`${w.name} has better late-round output — age ${w.age} vs ${l.age}, absorbs ${w.stats.sapm} vs ${l.stats.sapm} SApM.`,
    power:`${w.name} finishes ${w.stats.finishRate}% of wins vs ${l.stats.finishRate}% — significantly more dangerous.`,
    experience:`${w.name} has faced higher-caliber opponents (${w.opponentQuality}/100) and carries stronger momentum.`,
  };
  return n[key]||"";
}

// ─── COMPONENTS ────────────────────────────────────────────────────────────
function StatSlider({label,value,min,max,step,onChange,color}){
  return(
    <div style={{marginBottom:9}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
        <span style={{fontSize:10,color:"#7a6a5a",letterSpacing:1}}>{label}</span>
        <span style={{fontSize:11,color:color||"#d4a843",fontWeight:700}}>{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step||0.1} value={value}
        onChange={e=>onChange(parseFloat(e.target.value))}
        style={{width:"100%",accentColor:color||"#d4a843",cursor:"pointer"}}/>
    </div>
  );
}

// Animated percentage reveal
function AnimatedPct({target,color,size}){
  const[val,setVal]=useState(target);
  const ref=useRef(null);
  useEffect(()=>{
    setVal(target); // reset immediately so no flash
    let start=null;
    const duration=900;
    const from=50;
    const to=Math.round(target); // ensure integer target
    const step=ts=>{
      if(!start)start=ts;
      const p=Math.min((ts-start)/duration,1);
      const ease=p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
      const next=p>=1?to:Math.round(from+(to-from)*ease);
      setVal(next);
      if(p<1)ref.current=requestAnimationFrame(step);
    };
    ref.current=requestAnimationFrame(step);
    return()=>cancelAnimationFrame(ref.current);
  },[target]);
  return <span style={{fontSize:size||22,fontWeight:700,color}}>{Math.round(val)}%</span>;
}

// Shareable card
function ShareCard({pred,f1,f2,onClose}){
  const [dataUrl, setDataUrl]     = useState(null);
  const [imgStatus, setImgStatus] = useState("loading");

  async function fetchFighterImage(name){
    try {
      const res  = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&format=json&pithumbsize=400&origin=*`
      );
      const data = await res.json();
      const pages = data.query.pages;
      const page  = pages[Object.keys(pages)[0]];
      return page?.thumbnail?.source || null;
    } catch { return null; }
  }

  function loadImg(src){
    return new Promise(res=>{
      if(!src){ res(null); return; }
      const img = new Image();
      img.crossOrigin="anonymous";
      img.onload=()=>res(img);
      img.onerror=()=>res(null);
      img.src=src;
    });
  }

  function rRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }
  function rRectL(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w,y); ctx.lineTo(x+w,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  }
  function rRectR(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x,y); ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x,y+h); ctx.closePath();
  }

  function drawSilhouette(ctx,cx,cy,color,flip){
    ctx.save(); ctx.translate(cx,cy); if(flip)ctx.scale(-1,1);
    ctx.fillStyle=color; ctx.globalAlpha=0.55;
    const s=1.15;
    ctx.beginPath(); ctx.arc(0,-88*s,16*s,0,Math.PI*2); ctx.fill();
    ctx.fillRect(-5,-72*s,10,12*s);
    ctx.beginPath();
    ctx.moveTo(-22*s,-60*s); ctx.lineTo(22*s,-60*s);
    ctx.lineTo(18*s,-10*s); ctx.lineTo(-18*s,-10*s); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-22*s,-55*s); ctx.lineTo(30*s,-42*s);
    ctx.lineTo(26*s,-50*s); ctx.lineTo(-16*s,-60*s); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(22*s,-55*s); ctx.lineTo(10*s,-18*s);
    ctx.lineTo(12*s,-38*s); ctx.lineTo(16*s,-60*s); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-18*s,-10*s); ctx.lineTo(-6*s,65*s);
    ctx.lineTo(-4*s,30*s); ctx.lineTo(-8*s,-10*s); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8*s,-10*s); ctx.lineTo(30*s,65*s);
    ctx.lineTo(26*s,28*s); ctx.lineTo(18*s,-10*s); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(30*s,-46*s,10*s,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1; ctx.restore();
  }

  async function buildDataUrl(img1,img2){
    const W=640, H=760;
    const canvas=document.createElement("canvas");
    canvas.width=W; canvas.height=H;
    const ctx=canvas.getContext("2d");

    // Background
    const bg=ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,"#0c0a12"); bg.addColorStop(0.45,"#12080a"); bg.addColorStop(1,"#080c14");
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    // Hex texture
    ctx.strokeStyle="rgba(212,168,67,0.05)"; ctx.lineWidth=1;
    for(let row=0;row<H+60;row+=52){
      for(let col=0;col<W+60;col+=60){
        const ox=row%104<52?0:30;
        ctx.beginPath();
        for(let k=0;k<6;k++){
          const a=Math.PI/3*k-Math.PI/6;
          k===0?ctx.moveTo(col+ox+24*Math.cos(a),row+24*Math.sin(a))
               :ctx.lineTo(col+ox+24*Math.cos(a),row+24*Math.sin(a));
        }
        ctx.closePath(); ctx.stroke();
      }
    }

    // Gold border
    ctx.strokeStyle="#d4a843"; ctx.lineWidth=2.5;
    rRect(ctx,10,10,W-20,H-20,16); ctx.stroke();
    ctx.strokeStyle="rgba(212,168,67,0.2)"; ctx.lineWidth=1;
    rRect(ctx,16,16,W-32,H-32,13); ctx.stroke();

    // Header
    ctx.fillStyle="#d4a843"; ctx.font="bold 11px monospace";
    ctx.textAlign="center";
    ctx.fillText("⚡  UFC FIGHT PREDICTOR  ⚡",W/2,46);

    // Fighter image slots
    const IW=210, IH=235, IY=58;
    function drawSlot(img,x,y,w,h,color,flip){
      // panel bg
      ctx.save();
      rRect(ctx,x,y,w,h,10);
      const pg=ctx.createLinearGradient(x,y,x+w,y+h);
      pg.addColorStop(0,flip?"rgba(0,0,0,0)":"rgba(212,168,67,0.07)");
      pg.addColorStop(1,flip?"rgba(106,138,212,0.07)":"rgba(0,0,0,0)");
      ctx.fillStyle=pg; ctx.fill();
      ctx.clip();
      if(img){
        const sc=Math.max(w/img.width,h/img.height)*0.96;
        const dw=img.width*sc, dh=img.height*sc;
        ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
        // colour tint
        ctx.fillStyle=flip?"rgba(106,138,212,0.14)":"rgba(212,168,67,0.14)";
        ctx.fillRect(x,y,w,h);
      } else {
        ctx.fillStyle="rgba(255,255,255,0.02)"; ctx.fillRect(x,y,w,h);
        drawSilhouette(ctx,x+w/2,y+h*0.58,color,flip);
      }
      // bottom fade
      const fade=ctx.createLinearGradient(x,y+h*0.5,x,y+h);
      fade.addColorStop(0,"rgba(10,10,18,0)"); fade.addColorStop(1,"rgba(10,10,18,0.95)");
      ctx.fillStyle=fade; ctx.fillRect(x,y,w,h);
      ctx.restore();
      // side accent
      ctx.strokeStyle=color; ctx.lineWidth=2.5;
      ctx.beginPath();
      if(!flip){ctx.moveTo(x,y+14); ctx.lineTo(x,y+h-14);}
      else      {ctx.moveTo(x+w,y+14); ctx.lineTo(x+w,y+h-14);}
      ctx.stroke();
    }
    drawSlot(img1,30,IY,IW,IH,"#d4a843",false);
    drawSlot(img2,W-30-IW,IY,IW,IH,"#6a8ad4",true);

    // Names under images
    function namePlate(cx,name,record,color){
      ctx.fillStyle=color; ctx.font="bold 15px Georgia";
      ctx.textAlign="center"; ctx.fillText(name,cx,IY+IH+20);
      ctx.fillStyle="rgba(255,255,255,0.28)"; ctx.font="11px Georgia";
      ctx.fillText(record,cx,IY+IH+36);
    }
    namePlate(30+IW/2,f1.name,f1.record,"#d4a843");
    namePlate(W-30-IW/2,f2.name,f2.record,"#6a8ad4");

    // VS badge
    const vx=W/2, vy=IY+IH/2+8;
    ctx.fillStyle="rgba(8,8,14,0.88)";
    ctx.beginPath(); ctx.arc(vx,vy,32,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#d4a843"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(vx,vy,32,0,Math.PI*2); ctx.stroke();
    const vg=ctx.createLinearGradient(vx-18,vy-18,vx+18,vy+18);
    vg.addColorStop(0,"#d4a843"); vg.addColorStop(1,"#fff5cc");
    ctx.fillStyle=vg; ctx.font="bold 26px Georgia";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("VS",vx,vy); ctx.textBaseline="alphabetic";

    // Win bar
    const bY=IY+IH+56, bX=40, bW=W-80, bH=44;
    ctx.fillStyle="#111"; rRect(ctx,bX,bY,bW,bH,10); ctx.fill();
    const f1px=Math.round(bW*pred.f1WinPct/100);
    const g1=ctx.createLinearGradient(bX,0,bX+f1px,0);
    g1.addColorStop(0,"#d4a843"); g1.addColorStop(1,"#b07828");
    ctx.fillStyle=g1; rRectL(ctx,bX,bY,f1px,bH,10); ctx.fill();
    const g2=ctx.createLinearGradient(bX+f1px,0,bX+bW,0);
    g2.addColorStop(0,"#3a4a9a"); g2.addColorStop(1,"#6a8ad4");
    ctx.fillStyle=g2; rRectR(ctx,bX+f1px,bY,bW-f1px,bH,10); ctx.fill();
    ctx.fillStyle="#fff"; ctx.font="bold 17px Georgia";
    ctx.textAlign="left";  ctx.fillText(pred.f1WinPct+"%",bX+12,bY+bH/2+6);
    ctx.textAlign="right"; ctx.fillText((100-pred.f1WinPct)+"%",bX+bW-12,bY+bH/2+6);

    // Divider
    const dY=bY+bH+16;
    ctx.strokeStyle="rgba(212,168,67,0.18)"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(40,dY); ctx.lineTo(W-40,dY); ctx.stroke();

    // Winner box
    const wY=dY+10, wH=68;
    ctx.fillStyle="rgba(26,16,0,0.78)"; rRect(ctx,40,wY,W-80,wH,8); ctx.fill();
    ctx.strokeStyle="rgba(212,168,67,0.35)"; ctx.lineWidth=1;
    rRect(ctx,40,wY,W-80,wH,8); ctx.stroke();
    ctx.fillStyle="#5a4a3a"; ctx.font="bold 9px monospace";
    ctx.textAlign="center"; ctx.fillText("PREDICTED WINNER",W/2,wY+18);
    ctx.fillStyle="#d4a843"; ctx.font="bold 22px Georgia";
    ctx.fillText(pred.winner,W/2,wY+42);
    ctx.fillStyle="#7a6a5a"; ctx.font="13px Georgia";
    ctx.fillText("by "+pred.method+(pred.round!=="Decision"?" in Round "+pred.round:""),W/2,wY+60);

    // Category bars
    const cats=[
      {label:"Striking 👊",key:"striking"},
      {label:"Grappling 🤼",key:"grappling"},
      {label:"Cardio 🫁",key:"cardio"},
      {label:"Power 💥",key:"power"},
      {label:"Experience 🧠",key:"experience"},
    ];
    const cY=wY+wH+14, cSp=28, cLW=110, cBW=W-80-cLW-14, cBH=11;
    cats.forEach(({label,key},idx)=>{
      const score=pred.cats[key]||50, f1w=score>50;
      const y=cY+idx*cSp;
      ctx.fillStyle="#6a5a4a"; ctx.font="11px Georgia";
      ctx.textAlign="right"; ctx.fillText(label,40+cLW,y+cBH/2+4);
      const bx=40+cLW+14;
      ctx.fillStyle="#1a1a1a"; rRect(ctx,bx,y,cBW,cBH,4); ctx.fill();
      const pct=Math.abs(score-50)/50;
      const fil=Math.round(cBW*0.5+(f1w?1:-1)*cBW*0.5*pct*0.88);
      if(f1w){
        const g=ctx.createLinearGradient(bx,0,bx+fil,0);
        g.addColorStop(0,"#d4a843"); g.addColorStop(1,"#a87820");
        ctx.fillStyle=g; rRectL(ctx,bx,y,fil,cBH,4); ctx.fill();
      } else {
        const g=ctx.createLinearGradient(bx+fil,0,bx+cBW,0);
        g.addColorStop(0,"#3a4a9a"); g.addColorStop(1,"#6a8ad4");
        ctx.fillStyle=g; rRectR(ctx,bx+fil,y,cBW-fil,cBH,4); ctx.fill();
      }
    });

    // Footer
    ctx.fillStyle="rgba(212,168,67,0.22)"; ctx.font="9px monospace";
    ctx.textAlign="center";
    ctx.fillText("UFC FIGHT PREDICTOR  •  AI-POWERED ANALYSIS",W/2,H-22);

    return canvas.toDataURL("image/png");
  }

  useEffect(()=>{
    setDataUrl(null); setImgStatus("loading");
    async function go(){
      const [u1,u2]=await Promise.all([fetchFighterImage(f1.name),fetchFighterImage(f2.name)]);
      const [img1,img2]=await Promise.all([loadImg(u1),loadImg(u2)]);
      setImgStatus(img1||img2?"ready":"fallback");
      const url=await buildDataUrl(img1,img2);
      setDataUrl(url);
    }
    go();
  },[f1.name,f2.name,pred]);

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}}>
      <div style={{background:"#0d0d0d",border:"1px solid #d4a843",borderRadius:14,padding:20,
        maxWidth:480,width:"100%",position:"relative"}}>
        <div style={{position:"absolute",top:12,right:12,cursor:"pointer",color:"#5a4a3a",fontSize:18}}
          onClick={onClose}>✕</div>
        <div style={{fontSize:9,color:"#d4a843",letterSpacing:3,textTransform:"uppercase",
          marginBottom:12,textAlign:"center"}}>📤 Share Card</div>

        {!dataUrl
          ? <div style={{textAlign:"center",color:"#3a3a3a",padding:"30px 0",fontSize:12}}>
              ⏳ Building image...
            </div>
          : <>
              <img src={dataUrl} alt="Fight prediction card"
                style={{width:"100%",borderRadius:10,marginBottom:12,display:"block"}}/>
              <div style={{fontSize:10,color:"#5a4a3a",marginBottom:8,textAlign:"center"}}>
                💡 <strong style={{color:"#7a6a4a"}}>Right-click the image → "Save Image As"</strong> to save it
              </div>
              <a href={dataUrl} download="ufc-prediction.png"
                style={{display:"block",width:"100%",padding:"11px",borderRadius:7,
                  border:"1px solid #d4a843",background:"linear-gradient(135deg,#d4a843,#a87820)",
                  color:"#0a0a0f",fontSize:12,fontWeight:700,letterSpacing:1,
                  textTransform:"uppercase",textAlign:"center",textDecoration:"none",
                  boxSizing:"border-box"}}>
                📥 Download PNG
              </a>
            </>
        }
      </div>
    </div>
  );
}

// Result panel with animated reveal
function ResultPanel({pred,f1,f2,onShare,odds}){
  const[phase,setPhase]=useState(0);
  useEffect(()=>{
    setPhase(0);
    const t1=setTimeout(()=>setPhase(1),100);
    const t2=setTimeout(()=>setPhase(2),600);
    const t3=setTimeout(()=>setPhase(3),1100);
    const t4=setTimeout(()=>setPhase(4),1500);
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);clearTimeout(t4);};
  },[pred]);

  const bw=s=>{const d=Math.abs(s-50);return d<6?"52%":d<15?"62%":d<28?"75%":"87%";};

  return(
    <div>
      {/* Winner reveal */}
      <div style={{background:"linear-gradient(135deg,#1a1000,#0d1a00)",border:"1px solid #d4a843",borderRadius:10,padding:20,marginBottom:16,textAlign:"center",
        opacity:phase>=1?1:0,transform:phase>=1?"translateY(0)":"translateY(16px)",transition:"all 0.5s ease"}}>
        <div style={{fontSize:9,color:"#5a4a3a",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Predicted Winner</div>
        <div style={{fontSize:26,fontWeight:700,color:"#d4a843",marginBottom:3}}>{pred.winner}</div>
        <div style={{fontSize:12,color:"#a8a09a",marginBottom:14}}>by {pred.method}{pred.round!=="Decision"?` in Round ${pred.round}`:""}</div>
        <div style={{display:"flex",justifyContent:"center",gap:36}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:700,color:"#d4a843"}}>{pred.f1WinPct}%</div>
            <div style={{fontSize:9,color:"#4a3a2a",letterSpacing:1,textTransform:"uppercase",marginTop:2}}>{f1.name}</div>
          </div>
          <div style={{fontSize:24,fontWeight:300,color:"#3a3a3a",alignSelf:"center"}}>|</div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:700,color:"#6a8ad4"}}>{100-pred.f1WinPct}%</div>
            <div style={{fontSize:9,color:"#3a3a5a",letterSpacing:1,textTransform:"uppercase",marginTop:2}}>{f2.name}</div>
          </div>
        </div>
      </div>

      {/* Probability bar animated */}
      <div style={{background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:10,padding:16,marginBottom:16,
        opacity:phase>=2?1:0,transition:"opacity 0.5s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontSize:11,color:"#d4a843",fontWeight:600}}>{f1.name}</span>
          <span style={{fontSize:11,color:"#6a8ad4",fontWeight:600}}>{f2.name}</span>
        </div>
        <div style={{height:12,background:"#1a1a1a",borderRadius:6,overflow:"hidden",display:"flex"}}>
          <div style={{width:phase>=2?`${pred.f1WinPct}%`:"50%",background:"linear-gradient(90deg,#d4a843,#a87820)",transition:"width 1s cubic-bezier(0.34,1.56,0.64,1)"}}/>
          <div style={{width:phase>=2?`${100-pred.f1WinPct}%`:"50%",background:"linear-gradient(90deg,#4a5aaa,#6a8ad4)",transition:"width 1s cubic-bezier(0.34,1.56,0.64,1)"}}/>
        </div>
      </div>

      {/* Market odds comparison */}
      {odds&&(
        <div style={{background:"#0d0d0d",border:"1px solid #2a2a1a",borderRadius:10,padding:16,marginBottom:16,
          opacity:phase>=2?1:0,transition:"opacity 0.5s ease"}}>
          <div style={{fontSize:9,color:"#5a4a3a",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>📊 Market Odds vs AI</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:700,color:"#d4a843"}}>{odds.f1Pct}%</div>
              <div style={{fontSize:8,color:"#5a4a3a",letterSpacing:1,textTransform:"uppercase",marginTop:2}}>Market</div>
              <div style={{fontSize:10,color:"#888",marginTop:1}}>{odds.f1Odds>0?"+":""}{odds.f1Odds}</div>
            </div>
            <div style={{textAlign:"center",fontSize:8,color:"#3a3a3a"}}>
              <div style={{color:pred.f1WinPct>odds.f1Pct?"#4a8a4a":pred.f1WinPct<odds.f1Pct?"#8a4a4a":"#5a5a5a",fontSize:11,fontWeight:700}}>
                {pred.f1WinPct>odds.f1Pct?"AI favors "+f1.name:pred.f1WinPct<odds.f1Pct?"AI favors "+f2.name:"AI agrees"}
              </div>
              <div style={{fontSize:8,color:"#3a3a3a",marginTop:3}}>vs betting line</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:700,color:"#6a8ad4"}}>{odds.f2Pct}%</div>
              <div style={{fontSize:8,color:"#3a3a5a",letterSpacing:1,textTransform:"uppercase",marginTop:2}}>Market</div>
              <div style={{fontSize:10,color:"#888",marginTop:1}}>{odds.f2Odds>0?"+":""}{odds.f2Odds}</div>
            </div>
          </div>
          <div style={{height:8,background:"#1a1a1a",borderRadius:4,overflow:"hidden",display:"flex"}}>
            <div style={{width:`${odds.f1Pct}%`,background:"rgba(212,168,67,0.4)",transition:"width 1s ease"}}/>
            <div style={{width:`${odds.f2Pct}%`,background:"rgba(106,138,212,0.4)",transition:"width 1s ease"}}/>
          </div>
        </div>
      )}

      {/* Advanced modifiers */}
      <div style={{background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:10,padding:16,marginBottom:16,
        opacity:phase>=3?1:0,transform:phase>=3?"translateY(0)":"translateY(12px)",transition:"all 0.5s ease"}}>
        <div style={{fontSize:9,color:"#4a3a2a",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Advanced Factors</div>
        {pred.modifiers.map(mod=>{
          const neutral=mod.value===0, f1fav=mod.value>0, abs=Math.abs(mod.value);
          return(
            <div key={mod.label} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:11,color:"#a8a09a"}}>{mod.icon} {mod.label}</span>
                <span style={{fontSize:9,padding:"2px 8px",borderRadius:3,
                  background:neutral?"#1a1a1a":f1fav?"#1a1000":"#00001a",
                  color:neutral?"#4a4a4a":f1fav?"#d4a843":"#6a8ad4",
                  border:`1px solid ${neutral?"#2a2a2a":f1fav?"#2a1a00":"#0a0a2a"}`,letterSpacing:1}}>
                  {neutral?"Neutral":`${f1fav?"":"-"}${abs>0?"+":""}${abs} → ${f1fav?f1.name:f2.name}`}
                </span>
              </div>
              <div style={{height:4,background:"#1a1a1a",borderRadius:2,position:"relative"}}>
                <div style={{position:"absolute",left:"50%",top:0,height:"100%",width:1,background:"#2a2a2a"}}/>
                {!neutral&&<div style={{position:"absolute",[f1fav?"right":"left"]:"50%",top:0,height:"100%",
                  width:`${Math.min(48,abs*2.5)}%`,background:f1fav?"#d4a843":"#6a8ad4",borderRadius:2}}/>}
              </div>
            </div>
          );
        })}
        <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:6}}>
          {[pred.styleNote,pred.sizeNote,pred.pastNote,pred.rustNote,pred.formNote,pred.wrestleNote].filter(Boolean).map((note,i)=>(
            <div key={i} style={{fontSize:10,color:"#5a5a5a",background:"#111",borderRadius:5,padding:"7px 10px",lineHeight:1.5}}>{note}</div>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      <div style={{background:"#0d0d0d",border:"1px solid #1a1a1a",borderRadius:10,padding:16,marginBottom:16,
        opacity:phase>=4?1:0,transform:phase>=4?"translateY(0)":"translateY(12px)",transition:"all 0.5s ease"}}>
        <div style={{fontSize:9,color:"#4a3a2a",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Category Breakdown</div>
        {CAT_META.map(({key,label,icon})=>{
          const score=pred.cats[key],f1w=score>50,adv=pred.catLabel(score),note=getCatNote(key,score,f1,f2);
          return(
            <div key={key} style={{marginBottom:13}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:11,color:"#a8a09a"}}>{icon} {label}</span>
                <span style={{fontSize:9,padding:"2px 8px",borderRadius:3,
                  background:adv==="even"?"#1a1a1a":f1w?"#1a1000":"#00001a",
                  color:adv==="even"?"#4a4a4a":f1w?"#d4a843":"#6a8ad4",
                  border:`1px solid ${adv==="even"?"#2a2a2a":f1w?"#2a1a00":"#0a0a2a"}`,letterSpacing:1}}>
                  {adv==="even"?"Even":`${f1w?f1.name:f2.name} (${adv})`}
                </span>
              </div>
              <div style={{height:5,background:"#1a1a1a",borderRadius:3,position:"relative"}}>
                {adv==="even"
                  ?<div style={{position:"absolute",left:"25%",height:"100%",width:"50%",background:"#2a2a2a",borderRadius:3}}/>
                  :f1w
                  ?<div style={{position:"absolute",left:0,height:"100%",width:bw(score),background:"#d4a843",borderRadius:3}}/>
                  :<div style={{position:"absolute",right:0,height:"100%",width:bw(score),background:"#6a8ad4",borderRadius:3}}/>}
              </div>
              <div style={{fontSize:9,color:"#3a3a3a",marginTop:3}}>{note}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ACCURACY TRACKER ──────────────────────────────────────────────────────
const INIT_RESULTS={};

function ResultsTab(){
  const allFights = PAST_EVENTS.flatMap(evt =>
    evt.fights.map(f => ({...f, event:evt.event, date:evt.date}))
  );

  const [preds] = React.useState(() => {
    const results = {};
    allFights.forEach(f => {
      const key = f.f1 + "||" + f.f2;
      const a = FIGHTER_DB[f.f1], b = FIGHTER_DB[f.f2];
      // Use frozen prediction from events.json if available (prevents stat updates changing history)
      if (f.predictedWinner) {
        results[key] = { predicted: f.predictedWinner, pct: f.predictedPct || 55, method: f.predictedMethod || "Decision", round: f.predictedRound || "3", actual: f.actualWinner };
      } else if (a && b) {
        const sc = scoreFight(a, b);
        const pct = sc.winner === a.name ? sc.f1WinPct : sc.f2WinPct;
        results[key] = { predicted: sc.winner, pct, method: sc.method, round: sc.round, actual: f.actualWinner };
      }
    });
    return results;
  });

  const entries = Object.entries(preds);
  const resolved = entries.filter(([,v]) => v.actual);
  const correct = resolved.filter(([,v]) => v.predicted === v.actual).length;
  const acc = resolved.length ? Math.round(correct / resolved.length * 100) : null;

  return (
    <div style={{width:"100%", padding:"20px 20px", boxSizing:"border-box"}}>
      {/* Accuracy header */}
      {resolved.length > 0 && (
        <div style={{background:"linear-gradient(135deg,#1a1000,#0d1a00)", border:"1px solid #d4a843", borderRadius:10, padding:"16px 20px", marginBottom:24, textAlign:"center"}}>
          <div style={{fontSize:9, color:"#5a4a3a", letterSpacing:2, textTransform:"uppercase", marginBottom:6}}>AI Prediction Accuracy</div>
          <div style={{fontSize:52, fontWeight:700, color:"#d4a843", lineHeight:1}}>{acc}%</div>
          <div style={{fontSize:11, color:"#5a4a3a", marginTop:4}}>{correct} correct of {resolved.length} fights</div>
          <div style={{marginTop:12, height:6, background:"#1a1a1a", borderRadius:3, overflow:"hidden"}}>
            <div style={{height:"100%", width:`${acc}%`, background:"linear-gradient(90deg,#d4a843,#a87820)", borderRadius:3, transition:"width 1s ease"}}/>
          </div>
        </div>
      )}

      {/* Group by event — newest first */}
      {[...PAST_EVENTS].reverse().map(evt => {
        const evtFights = evt.fights.filter(f => FIGHTER_DB[f.f1] && FIGHTER_DB[f.f2]);
        if (!evtFights.length) return null;
        return (
          <div key={evt.event} style={{marginBottom:28}}>
            <div style={{fontSize:9, color:"#d4a843", letterSpacing:2, textTransform:"uppercase", marginBottom:12, paddingBottom:8, borderBottom:"1px solid #1e1e1e"}}>
              {evt.event} · {evt.date}
            </div>
            {evtFights.map(f => {
              const key = f.f1 + "||" + f.f2;
              const v = preds[key];
              if (!v) return null;
              const isCorrect = v.actual && v.predicted === v.actual;
              const isWrong = v.actual && v.predicted !== v.actual;
              return (
                <div key={key} style={{
                  background:"#0d0d0d",
                  border:`1px solid ${isCorrect?"#1a3a1a":isWrong?"#3a1a1a":"#1a1a1a"}`,
                  borderRadius:10, padding:"14px 16px", marginBottom:10,
                  display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"center"
                }}>
                  {/* Left: fight info + AI pick */}
                  <div>
                    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
                      {f.isMain && <span style={{fontSize:8, color:"#d4a843", letterSpacing:2, textTransform:"uppercase", border:"1px solid #3a2a00", padding:"1px 6px", borderRadius:3}}>★ MAIN</span>}
                      <span style={{fontSize:13, color:"#e8e0d4", fontWeight:700}}>{f.f1} vs {f.f2}</span>
                    </div>
                    <div style={{fontSize:10, color:"#4a4a4a", marginBottom:8}}>{f.weightClass}</div>
                    <div style={{display:"flex", gap:16, flexWrap:"wrap"}}>
                      <div style={{background:"#111", borderRadius:6, padding:"6px 12px"}}>
                        <div style={{fontSize:8, color:"#5a4a3a", letterSpacing:1, textTransform:"uppercase", marginBottom:3}}>AI Picked</div>
                        <div style={{fontSize:12, color:"#d4a843", fontWeight:700}}>{v.predicted}</div>
                        <div style={{fontSize:10, color:"#5a4a3a"}}>{v.method} · {v.round === "Decision" ? "Dec" : `R${v.round}`} · {v.pct}%</div>
                      </div>
                      {v.actual && (
                        <div style={{background:"#111", borderRadius:6, padding:"6px 12px"}}>
                          <div style={{fontSize:8, color:"#5a4a3a", letterSpacing:1, textTransform:"uppercase", marginBottom:3}}>Actual Result</div>
                          <div style={{fontSize:12, color: isCorrect ? "#5ad45a" : "#d45a5a", fontWeight:700}}>{v.actual}</div>
                          <div style={{fontSize:10, color:"#5a4a3a"}}>{f.method} · R{f.round}{f.time ? ` ${f.time}` : ""}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Right: correct/wrong badge */}
                  {v.actual && (
                    <div style={{
                      fontSize:11, fontWeight:700, padding:"8px 14px", borderRadius:6, textAlign:"center", flexShrink:0,
                      background: isCorrect ? "#0a1a0a" : "#1a0a0a",
                      color: isCorrect ? "#5ad45a" : "#d45a5a",
                      border: `1px solid ${isCorrect ? "#1a3a1a" : "#3a1a1a"}`
                    }}>
                      {isCorrect ? "✓" : "✗"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}


// ─── MAIN APP ───────────────────────────────────────────────────────────────
const BLANK={name:"",record:"0-0",rank:"Unranked",country:"🌍",age:28,weightClass:"Welterweight",
  naturalWeight:170,reach:72,style:"Striker",tendencies:[],strengths:[],weaknesses:[],
  styleMatchups:{},opponentQuality:65,wrestlerResilience:5,reachDisadvantageHandling:5,speedVsHandsHandling:5,
  stats:{slpm:4,stracc:45,sapm:4,strdef:55,tdavg:1,tdacc:40,tddef:65,subavg:0.5,winStreak:0,finishRate:50},
  pastMatchups:{}};
const STYLES=["Striker","Kickboxer","Power Striker","Counter Striker","Pressure Boxer","Pressure Fighter","Brawler","Wrestler","Grappler","BJJ Specialist","BJJ / Submission Hunter","Sambo / Wrestler","Complete Fighter","Flashy Striker","Counter Striker / Grappler","Wrestler / Grappler"];

const FIGHTER_PHOTOS = {
  "David Martinez":       "/fighters/davidmartinez.png",
  "Umar Nurmagomedov":    "/fighters/umar.png",
  "Khalil Rountree Jr.":  "/fighters/rountree.png",
  "Magomed Ankalaev":     "/fighters/ankalaev.png",
  "Elisha Ellison":       "/fighters/elisha.png",
  "Benoit Saint Denis":   "/fighters/benoit.png",
  "Michel Pereira":       "/fighters/michelpereira.png",
  "Max Holloway":         "/fighters/maxholloway.png",
  "Paddy Pimblett":       "/fighters/paddypimblett.png",
  "Conor McGregor":       "/fighters/conormcgregor.png",
  "Shara Magomedov":      "/fighters/sharaputdin.png",
  "Rafael Fiziev":        "/fighters/fiziev.png",
  "Manuel Torres":        "/fighters/manueltorres.png",
  "Kyoji Horiguchi":      "/fighters/horiguchi.png",
  "Manel Kape":           "/fighters/manelkape.png",
  "Gable Steveson":       "/fighters/gable.png",
  "Lone'er Kavanagh":     "/fighters/kavanagh.png",
  "Brandon Royval":       "/fighters/royval.png",
  "Mario Bautista":       "/fighters/mario.png",
  "Cory Sandhagen":       "/fighters/corysandhagen.png",
};

// Wikipedia page title overrides for fighters whose name doesn't exactly match their Wikipedia article
const WIKI_TITLES = {
  "Conor McGregor":       "Conor McGregor",
  "Max Holloway":         "Max Holloway",
  "Ilia Topuria":         "Ilia Topuria",
  "Justin Gaethje":       "Justin Gaethje",
  "Alex Pereira":         "Alex Pereira (fighter)",
  "Ciryl Gane":           "Ciryl Gane",
  "Sean O'Malley":        "Sean O'Malley (fighter)",
  "Manel Kape":           "Manel Kape",
  "Kyoji Horiguchi":      "Kyoji Horiguchi",
  "Rafael Fiziev":        "Rafael Fiziev",
  "Magomed Ankalaev":     "Magomed Ankalaev",
  "Khalil Rountree Jr.":  "Khalil Rountree Jr.",
  "Umar Nurmagomedov":    "Umar Nurmagomedov",
  "Paddy Pimblett":       "Paddy Pimblett",
  "Cory Sandhagen":       "Cory Sandhagen",
  "Shara Magomedov":      "Shara Magomedov",
  "Michel Pereira":       "Michel Pereira (fighter)",
  "Benoit Saint Denis":   "Benoît Saint Denis",
  "Mario Bautista":       "Mario Bautista (fighter)",
  "Brandon Royval":       "Brandon Royval",
  "Mauricio Ruffy":       "Mauricio Ruffy",
  "Michael Chandler":     "Michael Chandler (fighter)",
  "Derrick Lewis":        "Derrick Lewis (fighter)",
  "Bo Nickal":            "Bo Nickal",
  "Diego Lopes":          "Diego Lopes (MMA fighter)",
  "Belal Muhammad":       "Belal Muhammad",
  "Song Yadong":          "Song Yadong",
  "Deiveson Figueiredo":  "Deiveson Figueiredo",
  "Gable Steveson":       "Gable Steveson",
  "David Martinez":       "David Martínez (MMA fighter)",
};

// ─── UFC-STYLE MATCHUP CARD ──────────────────────────────────────────────────
function UFCMatchupCard({ f1, f2, fightMeta }) {
  // Each entry: { primary: url, fallback: url|null }
  const [imgs, setImgs] = useState([null, null]);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  const GOLD = "#d4a843", BLUE = "#6a8ad4";

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = e => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function wikiPhotoByTitle(title) {
      const r = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=600&origin=*`);
      const d = await r.json();
      return Object.values(d.query.pages)[0]?.thumbnail?.source || null;
    }

    async function getWikiImg(name) {
      try {
        // 1. Known title override
        const known = WIKI_TITLES[name];
        if (known) {
          const img = await wikiPhotoByTitle(known);
          if (img) return img;
        }
        // 2. Exact name
        const direct = await wikiPhotoByTitle(name);
        if (direct) return direct;
        // 3. Search Wikipedia for "Name MMA fighter"
        const sr = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name+' MMA fighter')}&srlimit=3&format=json&origin=*`);
        const sd = await sr.json();
        for (const result of (sd.query?.search || [])) {
          const img = await wikiPhotoByTitle(result.title);
          if (img) return img;
        }
        return null;
      } catch { return null; }
    }

    async function getImgPair(name) {
      if (FIGHTER_PHOTOS[name]) return { primary: FIGHTER_PHOTOS[name], fallback: null };
      const wiki = await getWikiImg(name);
      return { primary: wiki, fallback: null };
    }

    Promise.all([getImgPair(f1.name), getImgPair(f2.name)]).then(r => { if (!cancelled) setImgs(r); });
    return () => { cancelled = true; };
  }, [f1.name, f2.name]);

  const e1 = FIGHTER_EXTRAS[f1.name] || {};
  const e2 = FIGHTER_EXTRAS[f2.name] || {};

  const rows = [
    { label:"HEIGHT",      v1:e1.height||"--",           v2:e2.height||"--" },
    { label:"WEIGHT",      v1:`${f1.naturalWeight} lbs`,  v2:`${f2.naturalWeight} lbs`,  n1:f1.naturalWeight,   n2:f2.naturalWeight },
    { label:"AGE",         v1:f1.age,                     v2:f2.age,                     n1:f2.age,             n2:f1.age },
    { label:"REACH",       v1:`${f1.reach}"`,             v2:`${f2.reach}"`,             n1:f1.reach,           n2:f2.reach },
    { label:"STANCE",      v1:e1.stance||"--",            v2:e2.stance||"--" },
    { label:"SIG STR LpM", v1:f1.stats.slpm,              v2:f2.stats.slpm,              n1:f1.stats.slpm,      n2:f2.stats.slpm },
    { label:"SIG STR ACC", v1:`${f1.stats.stracc}%`,      v2:`${f2.stats.stracc}%`,      n1:f1.stats.stracc,    n2:f2.stats.stracc },
    { label:"TD AVG",      v1:f1.stats.tdavg,             v2:f2.stats.tdavg,             n1:f1.stats.tdavg,     n2:f2.stats.tdavg },
    { label:"TD ACC",      v1:`${f1.stats.tdacc}%`,       v2:`${f2.stats.tdacc}%`,       n1:f1.stats.tdacc,     n2:f2.stats.tdacc },
    { label:"SUB AVG",     v1:f1.stats.subavg,            v2:f2.stats.subavg,            n1:f1.stats.subavg,    n2:f2.stats.subavg },
  ];

  function Silhouette({ color }) {
    return (
      <svg viewBox="0 0 100 200" style={{height:"90%",opacity:0.18}} fill={color}>
        <ellipse cx="50" cy="22" rx="14" ry="16"/>
        <rect x="44" y="36" width="12" height="10"/>
        <path d="M28 46 L72 46 L68 110 L32 110 Z"/>
        <path d="M28 50 L8 90 L14 94 L35 58 Z"/>
        <path d="M72 50 L92 90 L86 94 L65 58 Z"/>
        <ellipse cx="11" cy="96" rx="8" ry="6"/>
        <ellipse cx="89" cy="96" rx="8" ry="6"/>
        <path d="M32 110 L24 180 L38 180 L44 120 Z"/>
        <path d="M68 110 L76 180 L62 180 L56 120 Z"/>
        <ellipse cx="30" cy="180" rx="11" ry="6"/>
        <ellipse cx="70" cy="180" rx="11" ry="6"/>
      </svg>
    );
  }

  // Fixed photo box — identical for every fighter regardless of source image dimensions
  const PHOTO_W = 160, PHOTO_H = 210;
  const photoBox = { width:PHOTO_W, height:PHOTO_H, flexShrink:0,
    borderRadius:8, overflow:"hidden", filter:"drop-shadow(0 6px 20px rgba(0,0,0,0.85))" };
  const imgStyle = { width:"100%", height:"100%", objectFit:"cover", objectPosition:"top center" };

  return (
    <div style={{background:"#0d0d14",border:"1px solid #1e1e26",borderRadius:14,overflow:"hidden",marginBottom:14}}>

      {/* Top bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 16px",
        borderBottom:"1px solid #1a1a22",background:"#0a0a10"}}>
        <span style={{fontSize:9,color:"#5a5a6a",letterSpacing:2,textTransform:"uppercase"}}>UFC</span>
        <div style={{width:4,height:4,borderRadius:"50%",background:GOLD}}/>
        <span style={{fontSize:9,color:GOLD,letterSpacing:2,textTransform:"uppercase"}}>{fightMeta.weightClass}</span>
        {fightMeta.isMain&&<span style={{fontSize:8,padding:"2px 8px",borderRadius:3,
          background:"#1a1000",border:"1px solid #2a1a00",color:GOLD,letterSpacing:1,textTransform:"uppercase"}}>Main Event</span>}
      </div>

      {/* Full-bleed split: each half is a photo panel with text overlay */}
      <div style={{display:"flex",position:"relative",height:240,overflow:"hidden"}}>

        {/* LEFT half */}
        <div style={{width:"50%",position:"relative",overflow:"hidden",background:"#0d0d14"}}>
          {imgs[0]?.primary
            ? <img src={imgs[0].primary} alt={f1.name}
                style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:isDesktop?"contain":"cover",objectPosition:isDesktop?"top center":"center 30%",mixBlendMode:"screen"}}
                onError={e=>{ e.target.style.display='none'; }}/>
            : <div style={{position:"absolute",inset:0,display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:8}}>
                <Silhouette color={GOLD}/>
              </div>
          }
          {/* dark gradient so text is readable */}
          <div style={{position:"absolute",inset:0,
            background:"linear-gradient(to right, rgba(10,10,15,0.55) 0%, rgba(10,10,15,0.1) 60%, transparent 100%)"}}/>
          <div style={{position:"absolute",inset:0,
            background:"linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 55%)"}}/>
          {/* text pinned to bottom-left */}
          <div style={{position:"absolute",bottom:12,left:12,right:4}}>
            <div style={{fontSize:8,color:"#888",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>
              {f1.country} {e1.nationality||""}
            </div>
            <div style={{fontSize:17,fontWeight:800,color:"#fff",lineHeight:1.1,marginBottom:3,textShadow:"0 2px 8px rgba(0,0,0,0.8)"}}>{f1.name}</div>
            <div style={{fontSize:10,color:"#888",marginBottom:2}}>{f1.record}</div>
            <div style={{fontSize:8,color:GOLD,letterSpacing:1,textTransform:"uppercase"}}>{f1.rank}</div>
          </div>
        </div>

        {/* RIGHT half */}
        <div style={{width:"50%",position:"relative",overflow:"hidden",background:"#0d0d14"}}>
          {imgs[1]?.primary
            ? <img src={imgs[1].primary} alt={f2.name}
                style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:isDesktop?"contain":"cover",objectPosition:isDesktop?"top center":"center 30%",transform:"scaleX(-1)",mixBlendMode:"screen"}}
                onError={e=>{ e.target.style.display='none'; }}/>
            : <div style={{position:"absolute",inset:0,display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:8}}>
                <Silhouette color={BLUE}/>
              </div>
          }
          <div style={{position:"absolute",inset:0,
            background:"linear-gradient(to left, rgba(10,10,15,0.55) 0%, rgba(10,10,15,0.1) 60%, transparent 100%)"}}/>
          <div style={{position:"absolute",inset:0,
            background:"linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 55%)"}}/>
          {/* text pinned to bottom-right */}
          <div style={{position:"absolute",bottom:12,right:12,left:4,textAlign:"right"}}>
            <div style={{fontSize:8,color:"#888",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>
              {f2.country} {e2.nationality||""}
            </div>
            <div style={{fontSize:17,fontWeight:800,color:"#fff",lineHeight:1.1,marginBottom:3,textShadow:"0 2px 8px rgba(0,0,0,0.8)"}}>{f2.name}</div>
            <div style={{fontSize:10,color:"#888",marginBottom:2}}>{f2.record}</div>
            <div style={{fontSize:8,color:BLUE,letterSpacing:1,textTransform:"uppercase"}}>{f2.rank}</div>
          </div>
        </div>

        {/* VS badge at center seam */}
        <div style={{position:"absolute",left:"50%",top:"44%",transform:"translate(-50%,-50%)",zIndex:10}}>
          <div style={{width:38,height:38,borderRadius:"50%",background:"rgba(10,10,15,0.85)",border:`2px solid ${GOLD}`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:10,fontWeight:700,color:GOLD,letterSpacing:1}}>VS</div>
        </div>

        {/* Thin center divider line */}
        <div style={{position:"absolute",left:"50%",top:0,width:1,height:"100%",background:"rgba(212,168,67,0.25)",zIndex:5}}/>
      </div>

      {/* Stats comparison */}
      <div style={{borderTop:"1px solid #1a1a22"}}>
        {rows.map(({label,v1,v2,n1,n2})=>{
          const has = n1!=null && n2!=null && n1!==n2;
          const f1w = has && n1>n2, f2w = has && n2>n1;
          return(
            <div key={label} style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",
              padding:"9px 20px",borderBottom:"1px solid #0f0f18"}}>
              <span style={{fontSize:13,fontWeight:f1w?700:400,color:f1w?"#e8e0d4":"#555566"}}>{v1}</span>
              <span style={{fontSize:8,color:"#282838",letterSpacing:2,textTransform:"uppercase",
                padding:"0 10px",whiteSpace:"nowrap"}}>{label}</span>
              <span style={{fontSize:13,fontWeight:f2w?700:400,color:f2w?"#e8e0d4":"#555566",textAlign:"right"}}>{v2}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FighterSearchBox({label,query,setQuery,results,loading,selected,setFighter,setResults,onSelect,accent,bg,bdr}){
  return(
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:9,color:accent,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{label}</div>
      <input value={query} onChange={e=>{setQuery(e.target.value);setFighter(null);onSelect();}}
        placeholder="Search any UFC fighter..."
        style={{width:"100%",boxSizing:"border-box",background:"#0a0a0a",border:`1px solid ${selected?"#d4a843":"#2a2a2a"}`,
          borderRadius:6,padding:"10px 12px",color:"#e8e0d4",fontSize:13,outline:"none"}}/>
      {results.length>0&&(
        <div style={{background:"#12121a",border:"1px solid #2a2a2a",borderRadius:6,overflow:"hidden",marginTop:2}}>
          {results.map(a=>(
            <button key={a.id} onClick={()=>onSelect(a)}
              style={{display:"block",width:"100%",padding:"9px 12px",background:"transparent",border:"none",
                borderBottom:"1px solid #1a1a1a",color:"#e8e0d4",fontSize:12,textAlign:"left",cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.background="#1a1a2a"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{fontWeight:700}}>{a.displayName}</span>
              {a.weightClass&&<span style={{fontSize:10,color:"#5a5a7a",marginLeft:8}}>{a.weightClass}</span>}
            </button>
          ))}
        </div>
      )}
      {selected&&(
        <div style={{marginTop:8,background:bg,border:`1px solid ${bdr}`,borderRadius:8,padding:10}}>
          <div style={{fontSize:13,fontWeight:700,color:"#e8e0d4"}}>{selected.name}</div>
          <div style={{fontSize:10,color:accent,marginBottom:6}}>{selected.record} · {selected.rank} · {selected.weightClass}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3}}>
            {[["SLpM",selected.stats.slpm],["Str%",selected.stats.stracc+"%"],["TDavg",selected.stats.tdavg],["Fin%",selected.stats.finishRate+"%"]].map(([k,v])=>(
              <div key={k} style={{background:"#0a0a0a",borderRadius:4,padding:"4px",textAlign:"center"}}>
                <div style={{fontSize:7,color:"#3a3a4a",textTransform:"uppercase"}}>{k}</div>
                <div style={{fontSize:11,fontWeight:700,color:accent}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App(){
  const[mode,setMode]=useState("scheduled");
  const[menuOpen,setMenuOpen]=useState(false);
  const[isMobile,setIsMobile]=useState(()=>window.innerWidth<768);
  useEffect(()=>{
    const mq=window.matchMedia("(max-width:767px)");
    const h=e=>setIsMobile(e.matches);
    mq.addEventListener("change",h);
    return()=>mq.removeEventListener("change",h);
  },[]);
  const[selEvt,setSelEvt]=useState(0); // default to first upcoming card
  const[selFight,setSelFight]=useState(0);
  const[pred,setPred]=useState(null);
  const[fantasyF1,setFF1]=useState({...BLANK,name:"Fighter 1"});
  const[fantasyF2,setFF2]=useState({...BLANK,name:"Fighter 2"});
  const[f1src,setF1src]=useState("custom");
  const[f2src,setF2src]=useState("custom");
  const[fantasyPred,setFantasyPred]=useState(null);
  const[editingF1,setEditF1]=useState(true);
  const[showShare,setShowShare]=useState(false);
  const[savedPreds,setSavedPreds]=useState({});
  const[oddsData,setOddsData]=useState([]); // [{f1,f2,f1Pct,f2Pct,f1Odds,f2Odds}]

  useEffect(()=>{
    const key=import.meta.env.VITE_ODDS_API_KEY;
    if(!key) return;
    fetch(`https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds/?apiKey=${key}&regions=us&markets=h2h&oddsFormat=american`)
      .then(r=>r.json())
      .then(data=>{
        if(!Array.isArray(data)) return;
        const parsed=data.map(event=>{
          const book=event.bookmakers?.[0];
          if(!book) return null;
          const market=book.markets?.find(m=>m.key==="h2h");
          if(!market) return null;
          const [a,b]=market.outcomes;
          if(!a||!b) return null;
          function toProb(american){
            return american<0
              ? Math.round((-american)/(-american+100)*100)
              : Math.round(100/(american+100)*100);
          }
          const aP=toProb(a.price), bP=toProb(b.price);
          const total=aP+bP;
          return {f1:a.name,f2:b.name,f1Odds:a.price,f2Odds:b.price,
                  f1Pct:Math.round(aP/total*100),f2Pct:Math.round(bP/total*100)};
        }).filter(Boolean);
        console.log("[OddsAPI] fights available:", parsed.map(o=>`${o.f1} vs ${o.f2}`));
        setOddsData(parsed);
      })
      .catch(e=>console.error("[OddsAPI] error:",e));
  },[]);

  // ── Fighter Search state ────────────────────────────────────────────────
  const[srchQ1,setSrchQ1]=useState("");
  const[srchQ2,setSrchQ2]=useState("");
  const[srchRes1,setSrchRes1]=useState([]);
  const[srchRes2,setSrchRes2]=useState([]);
  const[srchF1,setSrchF1]=useState(null);
  const[srchF2,setSrchF2]=useState(null);
  const[srchPred,setSrchPred]=useState(null);

  function localSearch(q,setResults){
    if(!q||q.length<2){setResults([]);return;}
    const norm=s=>s.toLowerCase().replace(/[^a-z]/g,"");
    const nq=norm(q);
    const matches=FIGHTER_NAMES.filter(n=>norm(n).includes(nq)).slice(0,8);
    return matches.map(n=>({id:n,displayName:n,weightClass:FIGHTER_DB[n]?.weightClass,isLocal:true}));
  }

  async function combinedSearch(q,setResults){
    if(!q||q.length<2){setResults([]);return;}
    const local=localSearch(q,setResults);
    setResults(local);
    try{
      const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/mma/ufc/athletes?limit=10&search=${encodeURIComponent(q)}`);
      const d=await r.json();
      const espnItems=(d.items||d.athletes||[]).slice(0,8);
      const localNames=new Set(local.map(f=>f.displayName.toLowerCase()));
      const espnNew=espnItems
        .filter(a=>{
          const name=(a.displayName||a.fullName||"").toLowerCase();
          return name&&!localNames.has(name);
        })
        .map(a=>({id:a.id,displayName:a.displayName||a.fullName,weightClass:a.weightClass?.displayName||a.weightClass,isLocal:false,espnData:a}));
      setResults([...local,...espnNew]);
    }catch(e){}
  }

  async function selectFighter(item,setFighter,setResults,setQ){
    setResults([]);
    setQ(item.displayName);
    setSrchPred(null);
    if(item.isLocal){
      setFighter(FIGHTER_DB[item.displayName]);
      return;
    }
    // ESPN fighter — fetch their stats
    try{
      const r=await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/mma/ufc/athletes/${item.id}/stats`);
      const d=await r.json();
      const cats=d.splits?.categories||[];
      function getStat(cat,stat){
        const c=cats.find(c=>c.name===cat||c.displayName===cat);
        if(!c)return null;
        const s=c.stats?.find(s=>s.name===stat||s.displayName===stat);
        return s?parseFloat(s.value):null;
      }
      const slpm  =getStat("Striking","strikesLandedPerMinute")??getStat("striking","SLpM")??3.5;
      const stracc=getStat("Striking","strikingAccuracy")??getStat("striking","strAcc")??45;
      const sapm  =getStat("Striking","strikesAbsorbedPerMinute")??getStat("striking","SApM")??3.0;
      const strdef=getStat("Striking","strikingDefense")??getStat("striking","strDef")??55;
      const tdavg =getStat("Grappling","takedownAverage")??getStat("grappling","TDAvg")??0.8;
      const tdacc =getStat("Grappling","takedownAccuracy")??getStat("grappling","TDAcc")??40;
      const tddef =getStat("Grappling","takedownDefense")??getStat("grappling","TDDef")??60;
      const subavg=getStat("Grappling","submissionAverage")??getStat("grappling","subAvg")??0.3;
      const bio=item.espnData||{};
      const rec=bio.record;
      setFighter({
        name:item.displayName,
        record:rec?`${rec.wins||0}-${rec.losses||0}`:"?-?",
        rank:"NR",country:"🌍",
        age:bio.age?parseInt(bio.age):28,
        weightClass:item.weightClass||"Unknown",
        naturalWeight:155,reach:70,style:"Mixed",
        wrestlerResilience:5,reachDisadvantageHandling:5,speedVsHandsHandling:5,
        tendencies:[],
        stats:{
          slpm,stracc:stracc>1?stracc:Math.round(stracc*100),
          sapm,strdef:strdef>1?strdef:Math.round(strdef*100),
          tdavg,tdacc:tdacc>1?tdacc:Math.round(tdacc*100),
          tddef:tddef>1?tddef:Math.round(tddef*100),
          subavg,winStreak:0,finishRate:50
        }
      });
    }catch(e){
      // stats fetch failed, set minimal fighter so predict button still appears
      setFighter({
        name:item.displayName,record:"?-?",rank:"NR",country:"🌍",
        age:28,weightClass:item.weightClass||"Unknown",naturalWeight:155,reach:70,style:"Mixed",
        wrestlerResilience:5,reachDisadvantageHandling:5,speedVsHandsHandling:5,tendencies:[],
        stats:{slpm:3.5,stracc:45,sapm:3.0,strdef:55,tdavg:0.8,tdacc:40,tddef:60,subavg:0.3,winStreak:0,finishRate:50}
      });
    }
  }

  useEffect(()=>{
    const t=setTimeout(()=>combinedSearch(srchQ1,setSrchRes1),300);
    return()=>clearTimeout(t);
  },[srchQ1]);

  useEffect(()=>{
    const t=setTimeout(()=>combinedSearch(srchQ2,setSrchRes2),300);
    return()=>clearTimeout(t);
  },[srchQ2]);

  const evtMeta=UPCOMING_EVENTS[selEvt];
  const fightMeta=evtMeta.fights[selFight];
  const f1=FIGHTER_DB[fightMeta.f1];
  const f2=FIGHTER_DB[fightMeta.f2];

  function findOdds(name1,name2){
    const norm=s=>s.toLowerCase().replace(/[^a-z]/g,"");
    const n1=norm(name1),n2=norm(name2);
    const match=oddsData.find(o=>{
      const of1=norm(o.f1),of2=norm(o.f2);
      return (of1.includes(n1.slice(0,5))||n1.includes(of1.slice(0,5)))&&
             (of2.includes(n2.slice(0,5))||n2.includes(of2.slice(0,5)));
    });
    if(match) return match;
    // try reversed order and swap so f1Pct always corresponds to name1
    const rev=oddsData.find(o=>{
      const of1=norm(o.f1),of2=norm(o.f2);
      return (of1.includes(n2.slice(0,5))||n2.includes(of1.slice(0,5)))&&
             (of2.includes(n1.slice(0,5))||n1.includes(of2.slice(0,5)));
    });
    if(!rev) return null;
    return {f1:rev.f2,f2:rev.f1,f1Odds:rev.f2Odds,f2Odds:rev.f1Odds,f1Pct:rev.f2Pct,f2Pct:rev.f1Pct};
  }

  function analyze(){
    const r=scoreFight(f1,f2);
    setPred(r);
    setSavedPreds(prev=>({...prev,[`${f1.name}||${f2.name}`]:{predicted:r.winner,pct:r.f1WinPct,actual:prev[`${f1.name}||${f2.name}`]?.actual||null}}));
  }

  function analyzeFantasy(){
    if(!fantasyF1.name||!fantasyF2.name)return;
    setFantasyPred(scoreFight(fantasyF1,fantasyF2));
  }

  function loadDB(which,name){
    const db=FIGHTER_DB[name];if(!db)return;
    if(which===1){setFF1({...db});setF1src(name);}
    else{setFF2({...db});setF2src(name);}
    setFantasyPred(null);
  }

  function updF1(path,val){setFF1(p=>{const n={...p,stats:{...p.stats}};if(path.startsWith("stats."))n.stats[path.slice(6)]=val;else n[path]=val;return n;});setFantasyPred(null);}
  function updF2(path,val){setFF2(p=>{const n={...p,stats:{...p.stats}};if(path.startsWith("stats."))n.stats[path.slice(6)]=val;else n[path]=val;return n;});setFantasyPred(null);}

  function FighterCard({fighter,idx}){
    const gold=idx===0;
    const accent=gold?"#d4a843":"#6a8ad4";
    const bg=gold?"linear-gradient(135deg,#1a1000,#110800)":"linear-gradient(135deg,#00001a,#08001a)";
    const bdr=gold?"#2a1a0a":"#0a0a2a";
    const ibg=gold?"#0d0800":"#080013";
    return(
      <div style={{background:bg,border:`1px solid ${bdr}`,borderRadius:10,padding:18}}>
        <div style={{fontSize:22,marginBottom:5}}>{fighter.country}</div>
        <div style={{fontSize:17,fontWeight:700,color:"#e8e0d4",marginBottom:2}}>{fighter.name}</div>
        <div style={{fontSize:11,color:accent,marginBottom:10}}>{fighter.record} · {fighter.rank}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:8}}>
          {[["Style",fighter.style],["Reach",fighter.reach+'"'],["Age",fighter.age],["Finish%",fighter.stats.finishRate+"%"]].map(([k,v])=>(
            <div key={k} style={{background:ibg,borderRadius:4,padding:"5px 7px"}}>
              <div style={{fontSize:8,color:gold?"#4a3a2a":"#2a2a4a",letterSpacing:1,textTransform:"uppercase"}}>{k}</div>
              <div style={{fontSize:11,color:"#e8e0d4",marginTop:1}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:8}}>
          {(fighter.tendencies||[]).slice(0,4).map(t=>(
            <span key={t} style={{fontSize:9,background:ibg,border:`1px solid ${bdr}`,borderRadius:3,padding:"2px 5px",color:"#6a5a4a"}}>{t}</span>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
          {[["SLpM",fighter.stats.slpm],["Str%",fighter.stats.stracc+"%"],["TDdef",fighter.stats.tddef+"%"],["TDavg",fighter.stats.tdavg],["Sub",fighter.stats.subavg],["WR",fighter.wrestlerResilience+"/10"]].map(([k,v])=>(
            <div key={k} style={{background:ibg,borderRadius:4,padding:"4px",textAlign:"center"}}>
              <div style={{fontSize:8,color:gold?"#3a2a1a":"#1a1a3a",textTransform:"uppercase",letterSpacing:1}}>{k}</div>
              <div style={{fontSize:11,fontWeight:700,color:accent}}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function FighterEditor({fighter,color,update,label}){
    const gold=color==="gold";const accent=gold?"#d4a843":"#6a8ad4";const bg=gold?"#1a1000":"#00001a";const bdr=gold?"#2a1a0a":"#0a0a2a";
    return(
      <div style={{background:bg,border:`1px solid ${bdr}`,borderRadius:10,padding:16}}>
        <div style={{fontSize:9,color:accent,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>{label}</div>
        <input value={fighter.name} onChange={e=>update("name",e.target.value)} placeholder="Fighter Name"
          style={{width:"100%",background:"#0a0a0a",border:`1px solid ${bdr}`,borderRadius:5,padding:"8px 10px",color:"#e8e0d4",fontSize:14,fontWeight:700,marginBottom:8,boxSizing:"border-box"}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
          {[["Age","age",18,50,1],["Reach (in)","reach",58,88,1],["Nat. Wt (lbs)","naturalWeight",105,275,5],["Opp. Quality","opponentQuality",30,100,1]].map(([lbl,key,mn,mx,stp])=>(
            <div key={key} style={{background:"#080808",borderRadius:5,padding:"6px 8px"}}>
              <div style={{fontSize:9,color:"#3a3a3a",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{lbl}</div>
              <input type="number" min={mn} max={mx} step={stp} value={fighter[key]}
                onChange={e=>update(key,parseFloat(e.target.value))}
                style={{width:"100%",background:"transparent",border:"none",color:accent,fontSize:14,fontWeight:700,outline:"none"}}/>
            </div>
          ))}
        </div>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:9,color:"#3a3a3a",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Fighting Style</div>
          <select value={fighter.style} onChange={e=>update("style",e.target.value)}
            style={{width:"100%",background:"#0a0a0a",border:`1px solid ${bdr}`,borderRadius:5,padding:"7px 8px",color:"#e8e0d4",fontSize:12}}>
            {STYLES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{fontSize:9,color:"#3a3a3a",letterSpacing:1,textTransform:"uppercase",marginBottom:8,marginTop:10}}>Resilience Factors</div>
        <StatSlider label="Wrestler Resilience (after failed TD)" value={fighter.wrestlerResilience||5} min={1} max={10} step={1} onChange={v=>update("wrestlerResilience",v)} color={accent}/>
        <StatSlider label="Reach Disadvantage Handling" value={fighter.reachDisadvantageHandling||5} min={1} max={10} step={1} onChange={v=>update("reachDisadvantageHandling",v)} color={accent}/>
        <StatSlider label="Speed vs Hands Handling" value={fighter.speedVsHandsHandling||5} min={1} max={10} step={1} onChange={v=>update("speedVsHandsHandling",v)} color={accent}/>
        <div style={{fontSize:9,color:"#3a3a3a",letterSpacing:1,textTransform:"uppercase",marginBottom:8,marginTop:10}}>Performance Stats</div>
        <StatSlider label="Strikes Landed/min" value={fighter.stats.slpm} min={1} max={10} step={0.1} onChange={v=>update("stats.slpm",v)} color={accent}/>
        <StatSlider label="Strike Accuracy %" value={fighter.stats.stracc} min={25} max={75} step={1} onChange={v=>update("stats.stracc",v)} color={accent}/>
        <StatSlider label="Strikes Absorbed/min" value={fighter.stats.sapm} min={0.5} max={9} step={0.1} onChange={v=>update("stats.sapm",v)} color="#e05555"/>
        <StatSlider label="Strike Defense %" value={fighter.stats.strdef} min={30} max={80} step={1} onChange={v=>update("stats.strdef",v)} color={accent}/>
        <StatSlider label="Takedowns/15min" value={fighter.stats.tdavg} min={0} max={7} step={0.1} onChange={v=>update("stats.tdavg",v)} color={accent}/>
        <StatSlider label="TD Accuracy %" value={fighter.stats.tdacc} min={15} max={75} step={1} onChange={v=>update("stats.tdacc",v)} color={accent}/>
        <StatSlider label="TD Defense %" value={fighter.stats.tddef} min={30} max={99} step={1} onChange={v=>update("stats.tddef",v)} color={accent}/>
        <StatSlider label="Submission Avg/15min" value={fighter.stats.subavg} min={0} max={3} step={0.1} onChange={v=>update("stats.subavg",v)} color={accent}/>
        <StatSlider label="Win Streak" value={fighter.stats.winStreak} min={0} max={20} step={1} onChange={v=>update("stats.winStreak",v)} color={accent}/>
        <StatSlider label="Finish Rate %" value={fighter.stats.finishRate} min={0} max={100} step={1} onChange={v=>update("stats.finishRate",v)} color={accent}/>
      </div>
    );
  }

  const tabs=[["scheduled","📅 Upcoming"],["search","🔍 Search"],["fantasy","⚗️ Fantasy"],["accuracy","🏆 Results"]];

  return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",fontFamily:"Georgia,serif",color:"#e8e0d4"}}>
      {/* HEADER */}
      <div style={{background:"linear-gradient(135deg,#1a0a00,#0a0a0f 50%,#00001a)",borderBottom:"1px solid #1a1a1a",padding:"12px 16px",display:"flex",alignItems:"center",gap:10,position:"relative"}}>
        <div style={{fontSize:22}}>🥊</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,letterSpacing:2,color:"#d4a843",textTransform:"uppercase"}}>UFC Fight Predictor</div>
        </div>
        {/* Desktop nav */}
        {!isMobile&&(
          <div style={{display:"flex",gap:4,flexShrink:0}}>
            {tabs.map(([m,lbl])=>(
              <button key={m} onClick={()=>setMode(m)} style={{padding:"7px 10px",borderRadius:5,border:"1px solid",cursor:"pointer",fontSize:10,fontWeight:700,letterSpacing:0,textTransform:"uppercase",whiteSpace:"nowrap",
                borderColor:mode===m?"#d4a843":"#2a2a2a",background:mode===m?"#d4a843":"transparent",color:mode===m?"#0a0a0f":"#5a4a3a"}}>
                {lbl}
              </button>
            ))}
          </div>
        )}
        {/* Mobile hamburger */}
        {isMobile&&(
          <button onClick={()=>setMenuOpen(o=>!o)} style={{background:"transparent",border:"1px solid #2a2a2a",borderRadius:5,padding:"7px 10px",cursor:"pointer",display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
            <span style={{display:"block",width:18,height:2,background:"#d4a843",borderRadius:1}}/>
            <span style={{display:"block",width:18,height:2,background:"#d4a843",borderRadius:1}}/>
            <span style={{display:"block",width:18,height:2,background:"#d4a843",borderRadius:1}}/>
          </button>
        )}
        {/* Mobile dropdown menu */}
        {isMobile&&menuOpen&&(
          <div style={{position:"absolute",top:"100%",right:0,zIndex:100,background:"#12121a",border:"1px solid #2a2a2a",borderRadius:5,overflow:"hidden",minWidth:160}}>
            {tabs.map(([m,lbl])=>(
              <button key={m} onClick={()=>{setMode(m);setMenuOpen(false);}} style={{display:"block",width:"100%",padding:"12px 16px",background:mode===m?"#d4a843":"transparent",color:mode===m?"#0a0a0f":"#e8e0d4",border:"none",borderBottom:"1px solid #1a1a1a",cursor:"pointer",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",textAlign:"left"}}>
                {lbl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RESULTS TAB */}
      {mode==="accuracy"&&<div style={{height:"calc(100vh - 57px)",overflowY:"auto",width:"100%"}}><ResultsTab/></div>}

      {/* SCHEDULED TAB */}
      {mode==="scheduled"&&(
        <div style={{height:"calc(100vh - 57px)",overflowY:"auto"}}>
          {/* Fight selector — horizontal scroll on mobile */}
          <div style={{overflowX:"auto",borderBottom:"1px solid #1a1a1a",padding:"8px 12px",display:"flex",gap:6,WebkitOverflowScrolling:"touch"}}>
            {UPCOMING_EVENTS.map((evt,ei)=>
              evt.fights.map((f,fi)=>{
                const act=selEvt===ei&&selFight===fi;
                return(
                  <button key={ei+"-"+fi} onClick={()=>{setSelEvt(ei);setSelFight(fi);setPred(null);}}
                    style={{flexShrink:0,padding:"7px 12px",borderRadius:6,border:`1px solid ${act?"#d4a843":"#2a2a2a"}`,
                      background:act?"#1a1000":"transparent",cursor:"pointer",textAlign:"left",minWidth:140}}>
                    {f.isMain&&<div style={{fontSize:7,color:"#d4a843",letterSpacing:1,textTransform:"uppercase",marginBottom:1}}>★ MAIN</div>}
                    <div style={{fontSize:10,color:"#e8e0d4",fontWeight:600,lineHeight:1.3}}>{f.f1}<br/>vs {f.f2}</div>
                    <div style={{fontSize:8,color:"#4a3a2a",marginTop:2}}>{evt.event.split(":")[0].split("—")[0].trim()}</div>
                  </button>
                );
              })
            )}
          </div>
          {/* Fight detail */}
          <div style={{padding:"16px 16px"}}>
            <div style={{marginBottom:10,fontSize:9,color:"#3a2a1a",letterSpacing:1,textTransform:"uppercase"}}>
              {evtMeta.date} · {evtMeta.venue}
            </div>
            <UFCMatchupCard f1={f1} f2={f2} fightMeta={fightMeta}/>
            <div style={{background:"#0d0d13",border:"1px solid #1a1a2a",borderRadius:7,padding:"10px 12px",marginBottom:16,fontSize:11,color:"#6a6a8a",lineHeight:1.6}}>
              📋 {fightMeta.context}
            </div>
            {!pred?(
              <div style={{textAlign:"center",marginBottom:20}}>
                <button onClick={analyze} style={{padding:"13px 0",width:"100%",maxWidth:340,background:"linear-gradient(135deg,#d4a843,#a87820)",border:"none",borderRadius:7,color:"#0a0a0f",fontSize:14,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",boxShadow:"0 4px 20px rgba(212,168,67,0.25)"}}>
                  ⚡ Analyze & Predict
                </button>
              </div>
            ):(
              <>
                <ResultPanel pred={pred} f1={f1} f2={f2} odds={findOdds(f1.name,f2.name)}/>
                <div style={{textAlign:"center",marginTop:12,paddingBottom:20}}>
                  <button onClick={()=>setPred(null)} style={{padding:"10px 28px",background:"transparent",border:"1px solid #2a2a2a",borderRadius:5,color:"#4a3a2a",fontSize:10,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>↺ Reset</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SEARCH TAB */}
      {mode==="search"&&(
        <div style={{height:"calc(100vh - 57px)",overflowY:"auto",padding:"16px 16px"}}>
          <div style={{fontSize:9,color:"#5a4a3a",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>🔍 Search Any Fighter Matchup</div>
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            <FighterSearchBox
              label="🔴 Fighter 1" query={srchQ1} setQuery={setSrchQ1}
              results={srchRes1} loading={false}
              selected={srchF1} setFighter={setSrchF1} setResults={setSrchRes1}
              onSelect={a=>a?selectFighter(a,setSrchF1,setSrchRes1,setSrchQ1):setSrchPred(null)}
              accent="#d4a843" bg="linear-gradient(135deg,#1a1000,#110800)" bdr="#2a1a0a"/>
            <FighterSearchBox
              label="🔵 Fighter 2" query={srchQ2} setQuery={setSrchQ2}
              results={srchRes2} loading={false}
              selected={srchF2} setFighter={setSrchF2} setResults={setSrchRes2}
              onSelect={a=>a?selectFighter(a,setSrchF2,setSrchRes2,setSrchQ2):setSrchPred(null)}
              accent="#6a8ad4" bg="linear-gradient(135deg,#00001a,#08001a)" bdr="#0a0a2a"/>
          </div>
          {srchF1&&srchF2&&!srchPred&&(
            <div style={{textAlign:"center",marginBottom:16}}>
              <button onClick={()=>setSrchPred(scoreFight(srchF1,srchF2))}
                style={{padding:"13px 0",width:"100%",maxWidth:340,background:"linear-gradient(135deg,#d4a843,#a87820)",
                  border:"none",borderRadius:7,color:"#0a0a0f",fontSize:14,fontWeight:700,letterSpacing:2,
                  textTransform:"uppercase",cursor:"pointer",boxShadow:"0 4px 20px rgba(212,168,67,0.25)"}}>
                ⚡ Predict This Fight
              </button>
            </div>
          )}
          {srchPred&&srchF1&&srchF2&&(
            <>
              <ResultPanel pred={srchPred} f1={srchF1} f2={srchF2}/>
              <div style={{textAlign:"center",marginTop:12,paddingBottom:20}}>
                <button onClick={()=>setSrchPred(null)}
                  style={{padding:"10px 28px",background:"transparent",border:"1px solid #2a2a2a",
                    borderRadius:5,color:"#4a3a2a",fontSize:10,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>
                  ↺ New Search
                </button>
              </div>
            </>
          )}
          {!srchF1&&!srchF2&&(
            <div style={{textAlign:"center",padding:"40px 20px",color:"#3a3a4a",fontSize:12}}>
              Search any two UFC fighters above to simulate a matchup
            </div>
          )}
        </div>
      )}

      {/* FANTASY TAB */}
      {mode==="fantasy"&&(
        <div style={{height:"calc(100vh - 57px)",overflowY:"auto",padding:"14px 16px"}}>
          <div style={{fontSize:9,color:"#5a4a3a",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>⚗️ Build Your Fantasy Matchup</div>
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            {[["red","🔴 Fighter 1",true],["blue","🔵 Fighter 2",false]].map(([col,lbl,isF1])=>(
              <button key={col} onClick={()=>setEditF1(isF1)} style={{flex:1,padding:"10px",borderRadius:5,border:"1px solid",
                borderColor:(isF1?editingF1:!editingF1)?(isF1?"#d4a843":"#6a8ad4"):"#2a2a2a",
                background:(isF1?editingF1:!editingF1)?(isF1?"#1a1000":"#00001a"):"transparent",
                color:(isF1?editingF1:!editingF1)?(isF1?"#d4a843":"#6a8ad4"):"#4a4a4a",cursor:"pointer",fontSize:11,fontWeight:700}}>
                {lbl}
              </button>
            ))}
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:9,color:"#3a3a3a",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Load a real fighter</div>
            <select value={editingF1?f1src:f2src} onChange={e=>loadDB(editingF1?1:2,e.target.value)}
              style={{width:"100%",background:"#0a0a0a",border:"1px solid #2a2a2a",borderRadius:5,padding:"10px 8px",color:"#e8e0d4",fontSize:14}}>
              <option value="custom">— Custom Fighter —</option>
              {FIGHTER_NAMES.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {editingF1
            ?<FighterEditor fighter={fantasyF1} color="gold" update={updF1} label="🔴 Fighter 1"/>
            :<FighterEditor fighter={fantasyF2} color="blue" update={updF2} label="🔵 Fighter 2"/>}
          {/* Preview cards */}
          <div style={{marginTop:16}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 32px 1fr",gap:8,alignItems:"center",marginBottom:14}}>
              {[fantasyF1,fantasyF2].map((fighter,idx)=>(
                <React.Fragment key={idx}>
                  {idx===1&&<div style={{textAlign:"center",fontSize:16,fontWeight:900,color:"#d4a843"}}>VS</div>}
                  <div style={{background:idx===0?"linear-gradient(135deg,#1a1000,#110800)":"linear-gradient(135deg,#00001a,#08001a)",
                    border:`1px solid ${idx===0?"#2a1a0a":"#0a0a2a"}`,borderRadius:10,padding:12}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#e8e0d4",marginBottom:2}}>{fighter.name||`Fighter ${idx+1}`}</div>
                    <div style={{fontSize:9,color:idx===0?"#d4a843":"#6a8ad4",marginBottom:6}}>{fighter.style} · {fighter.reach}" · Age {fighter.age}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:3}}>
                      {[["SLpM",fighter.stats.slpm],["Fin%",fighter.stats.finishRate+"%"],["TDavg",fighter.stats.tdavg],["Str%",fighter.stats.stracc+"%"],["TDdef",fighter.stats.tddef+"%"],["Sub",fighter.stats.subavg]].map(([k,v])=>(
                        <div key={k} style={{background:idx===0?"#0d0800":"#080013",borderRadius:4,padding:"3px 5px",textAlign:"center"}}>
                          <div style={{fontSize:7,color:idx===0?"#3a2a1a":"#1a1a3a",textTransform:"uppercase"}}>{k}</div>
                          <div style={{fontSize:10,fontWeight:700,color:idx===0?"#d4a843":"#6a8ad4"}}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
            {!fantasyPred?(
              <div style={{textAlign:"center",marginBottom:20}}>
                <button onClick={analyzeFantasy} disabled={!fantasyF1.name||!fantasyF2.name}
                  style={{padding:"13px 0",width:"100%",background:"linear-gradient(135deg,#d4a843,#a87820)",border:"none",borderRadius:7,color:"#0a0a0f",fontSize:14,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",
                    boxShadow:"0 4px 20px rgba(212,168,67,0.25)",opacity:(!fantasyF1.name||!fantasyF2.name)?0.4:1}}>
                  ⚡ Run Fantasy Prediction
                </button>
              </div>
            ):(
              <>
                <ResultPanel pred={fantasyPred} f1={fantasyF1} f2={fantasyF2}/>
                <div style={{textAlign:"center",marginTop:12,display:"flex",gap:8,justifyContent:"center",paddingBottom:20}}>
                  <button onClick={()=>setFantasyPred(null)} style={{padding:"10px 22px",background:"transparent",border:"1px solid #2a2a2a",borderRadius:5,color:"#4a3a2a",fontSize:10,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>↺ Reset</button>
                  <button onClick={()=>setShowShare(true)} style={{padding:"10px 22px",background:"#1a1000",border:"1px solid #d4a843",borderRadius:5,color:"#d4a843",fontSize:10,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>📤 Share</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showShare&&fantasyPred&&<ShareCard pred={fantasyPred} f1={fantasyF1} f2={fantasyF2} onClose={()=>setShowShare(false)}/>}

      <style>{`*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:#0a0a0f}::-webkit-scrollbar-thumb{background:#2a1a0a;border-radius:3px}input[type=range]{height:4px}select option{background:#111}@media(min-width:700px){.desktop-only{display:block!important}}`}</style>
    </div>
  );
}
