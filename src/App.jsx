import React, { useState, useEffect, useRef } from "react";

// ─── FIGHTER DATABASE ──────────────────────────────────────────────────────
const FIGHTER_DB = {
  "Ilia Topuria": {
    name:"Ilia Topuria",record:"16-0",rank:"LW Champion",country:"🇬🇪",age:29,
    weightClass:"Lightweight",naturalWeight:155,reach:71,style:"Power Boxer / BJJ",
    tendencies:["patient setup","overhand right","body-head combos","BJJ as backup","elite head movement"],
    strengths:["elite power","precision","undefeated","finishing ability","composure"],
    weaknesses:["reach disadvantage vs tall LWs","small sample at LW"],
    wrestlerResilience:7, reachDisadvantageHandling:8, speedVsHandsHandling:8, yearsInactive:0, recentForm:10,
    styleMatchups:{"Pressure Fighter":9,"Brawler":8,"Kickboxer":5,"Counter Striker":6,"Wrestler":0,"Grappler":2,"BJJ Specialist":2,"Sambo / Wrestler":-1,"Complete Fighter":-2,"Power Striker":5,"Striker":4,"Flashy Striker":5},
    opponentQuality:91,
    stats:{slpm:5.6,stracc:57,sapm:2.8,strdef:68,tdavg:1.2,tdacc:46,tddef:75,subavg:0.9,winStreak:16,finishRate:94},
    pastMatchups:{},
  },
  "Justin Gaethje": {
    name:"Justin Gaethje",record:"25-5",rank:"LW Interim Champion",country:"🇺🇸",age:37,
    weightClass:"Lightweight",naturalWeight:155,reach:70,style:"Pressure Fighter",
    tendencies:["walks forward constantly","leg kick specialist","brawls in pocket","all-or-nothing"],
    strengths:["pressure","leg kicks","cardio","toughness","power"],
    weaknesses:["absorbs heavy damage","chin tested multiple times","technical boxing gaps"],
    wrestlerResilience:7, reachDisadvantageHandling:5, speedVsHandsHandling:6, yearsInactive:0, recentForm:8,
    styleMatchups:{"Counter Striker":-3,"Power Boxer / BJJ":-4,"BJJ Specialist":-2,"Pressure Fighter":0,"Kickboxer":2,"Wrestler":4,"Grappler":3,"Sambo / Wrestler":3,"Flashy Striker":5,"Striker":4,"Complete Fighter":-3},
    opponentQuality:93,
    stats:{slpm:6.3,stracc:49,sapm:5.9,strdef:53,tdavg:1.1,tdacc:35,tddef:68,subavg:0.2,winStreak:2,finishRate:84},
    pastMatchups:{},
  },
  "Alex Pereira": {
    name:"Alex Pereira",record:"13-3",rank:"LHW Champ (moving to HW)",country:"🇧🇷",age:38,
    weightClass:"Heavyweight",naturalWeight:225,reach:79,style:"Kickboxer",
    tendencies:["left hook to body then head","patient then explosive","uses reach masterfully","elite KO power"],
    strengths:["KO power","reach","kickboxing pedigree","clutch","size"],
    weaknesses:["submission vulnerability","limited grappling offense","can be rocked"],
    wrestlerResilience:5, reachDisadvantageHandling:9, speedVsHandsHandling:7, yearsInactive:0, recentForm:9,
    styleMatchups:{"Wrestler":-5,"Grappler":-7,"BJJ Specialist":-9,"Sambo / Wrestler":-6,"Striker":5,"Kickboxer":4,"Power Striker":3,"Counter Striker":6,"Pressure Fighter":4,"Brawler":5,"Complete Fighter":2},
    opponentQuality:90,
    stats:{slpm:4.5,stracc:53,sapm:3.1,strdef:60,tdavg:0.4,tdacc:30,tddef:65,subavg:0.2,winStreak:3,finishRate:83},
    pastMatchups:{},
  },
  "Ciryl Gane": {
    name:"Ciryl Gane",record:"13-2",rank:"#1 HW",country:"🇫🇷",age:36,
    weightClass:"Heavyweight",naturalWeight:248,reach:81,style:"Kickboxer",
    tendencies:["technical movement","long jab","teep kicks","avoids brawling","fights at range"],
    strengths:["reach","footwork","technical striking","cardio for HW","submission ability"],
    weaknesses:["power KOs (lost to Jones, Ngannou)","can be slow starter","chin vs elite power"],
    wrestlerResilience:6, reachDisadvantageHandling:9, speedVsHandsHandling:7,
    styleMatchups:{"Power Striker":-3,"Brawler":5,"Pressure Fighter":4,"Wrestler":-2,"Grappler":2,"BJJ Specialist":-1,"Kickboxer":0,"Counter Striker":3,"Striker":4,"Complete Fighter":-3},
    opponentQuality:88,
    stats:{slpm:4.8,stracc:54,sapm:3.4,strdef:62,tdavg:1.1,tdacc:38,tddef:68,subavg:0.7,winStreak:2,finishRate:62},
    pastMatchups:{"Jon Jones":"L"},
  },
  "Sean O'Malley": {
    name:"Sean O'Malley",record:"19-3",rank:"BW Champion",country:"🇺🇸",age:31,
    weightClass:"Bantamweight",naturalWeight:135,reach:72,style:"Flashy Striker",
    tendencies:["southpaw stance","long jab","switch kicks","counterpunching","avoids wrestling at all costs"],
    strengths:["unorthodox striking","range control","power","timing","entertainment"],
    weaknesses:["takedown defense (55%)","grappling when taken down","nullified by wrestling","chin has been tested"],
    wrestlerResilience:3, reachDisadvantageHandling:6, speedVsHandsHandling:7, yearsInactive:0, recentForm:7,
    styleMatchups:{"Wrestler":-15,"Grappler":-12,"BJJ Specialist":-14,"Sambo / Wrestler":-15,"Striker":5,"Kickboxer":3,"Pressure Boxer":2,"Counter Striker":2,"Power Striker":-1,"Flashy Striker":1,"Pressure Fighter":-4,"Complete Fighter":-6},
    opponentQuality:82,
    stats:{slpm:5.9,stracc:56,sapm:3.2,strdef:63,tdavg:0.3,tdacc:22,tddef:55,subavg:0.1,winStreak:2,finishRate:67},
    pastMatchups:{},
  },
  "Aiemann Zahabi": {
    name:"Aiemann Zahabi",record:"14-2",rank:"#6 BW",country:"🇨🇦",age:38,
    weightClass:"Bantamweight",naturalWeight:135,reach:68,style:"BJJ Specialist",
    tendencies:["patient ground game","submission hunting","Tristar boxing fundamentals","clinch work"],
    strengths:["BJJ (black belt)","grappling IQ","experience","fundamentals"],
    weaknesses:["age (38)","reach disadvantage vs O'Malley","pure striking at range","power"],
    wrestlerResilience:8, reachDisadvantageHandling:5, speedVsHandsHandling:5,
    styleMatchups:{"Flashy Striker":8,"Striker":6,"Kickboxer":5,"Counter Striker":4,"Pressure Boxer":3,"Wrestler":-2,"Grappler":0,"BJJ Specialist":-1,"Power Striker":2,"Brawler":3},
    opponentQuality:72,
    stats:{slpm:3.4,stracc:46,sapm:2.9,strdef:62,tdavg:2.1,tdacc:46,tddef:74,subavg:1.6,winStreak:3,finishRate:57},
    pastMatchups:{},
  },
  "Mauricio Ruffy": {
    name:"Mauricio Ruffy",record:"13-2",rank:"#12 LW",country:"🇧🇷",age:26,
    weightClass:"Lightweight",naturalWeight:155,reach:74,style:"Power Striker",
    tendencies:["explosive combinations","southpaw aggression","looking for the big finish","high output"],
    strengths:["power","finishing rate","youth","athleticism","fast hands"],
    weaknesses:["grappling defense","experience at top level","chin untested by elite"],
    wrestlerResilience:4, reachDisadvantageHandling:6, speedVsHandsHandling:7, yearsInactive:0, recentForm:8,
    styleMatchups:{"Wrestler":-7,"Grappler":-5,"BJJ Specialist":-8,"Pressure Fighter":3,"Kickboxer":2,"Striker":2,"Counter Striker":4,"Brawler":1,"Complete Fighter":-3},
    opponentQuality:68,
    stats:{slpm:5.9,stracc:54,sapm:4.2,strdef:55,tdavg:0.5,tdacc:30,tddef:60,subavg:0.2,winStreak:4,finishRate:85},
    pastMatchups:{},
  },
  "Michael Chandler": {
    name:"Michael Chandler",record:"23-10",rank:"Unranked LW",country:"🇺🇸",age:36,
    weightClass:"Lightweight",naturalWeight:155,reach:69,style:"Pressure Fighter",
    tendencies:["explosive first-round pressure","clinch trips","body work","heart never quits"],
    strengths:["explosiveness","heart","grappling","experience","big fight mentality"],
    weaknesses:["age (36)","recent losses","reach disadvantage","can be outclassed by elites"],
    wrestlerResilience:8, reachDisadvantageHandling:7, speedVsHandsHandling:6, yearsInactive:0, recentForm:8, yearsInactive:1.5, recentForm:4,
    styleMatchups:{"Counter Striker":3,"Flashy Striker":2,"Kickboxer":2,"Striker":2,"Power Striker":-1,"Wrestler":0,"Grappler":-1,"BJJ Specialist":-3,"Pressure Fighter":0,"Complete Fighter":-3},
    opponentQuality:88,
    stats:{slpm:5.1,stracc:48,sapm:4.8,strdef:52,tdavg:2.2,tdacc:44,tddef:65,subavg:0.5,winStreak:0,finishRate:71},
    pastMatchups:{},
  },
  "Bo Nickal": {
    name:"Bo Nickal",record:"8-1",rank:"#9 MW",country:"🇺🇸",age:30,
    weightClass:"Middleweight",naturalWeight:185,reach:76,style:"Wrestler",
    tendencies:["dominant wrestling","body lock pressure","relentless if TD fails","ground and pound","improving striking"],
    strengths:["elite wrestling (3x NCAA champion)","athlete","TD defense","finishing off top","relentlessness"],
    weaknesses:["striking polish","chin vs elite","experience"],
    wrestlerResilience:10, reachDisadvantageHandling:7, speedVsHandsHandling:6, yearsInactive:0, recentForm:9,
    styleMatchups:{"Striker":10,"Kickboxer":9,"Flashy Striker":10,"Power Striker":8,"Counter Striker":8,"Pressure Fighter":4,"Brawler":5,"Grappler":1,"BJJ Specialist":-1,"Wrestler":0,"Sambo / Wrestler":-1,"Complete Fighter":2},
    opponentQuality:60,
    stats:{slpm:3.8,stracc:50,sapm:2.2,strdef:66,tdavg:4.5,tdacc:58,tddef:88,subavg:0.6,winStreak:7,finishRate:75},
    pastMatchups:{},
  },
  "Kyle Daukaus": {
    name:"Kyle Daukaus",record:"17-4",rank:"Unranked MW",country:"🇺🇸",age:30,
    weightClass:"Middleweight",naturalWeight:185,reach:75,style:"Grappler",
    tendencies:["submission hunting","Catch wrestling style","scrambles","durable"],
    strengths:["grappling","submissions","toughness","conditioning"],
    weaknesses:["striking disadvantage vs elite","speed","power"],
    wrestlerResilience:8, reachDisadvantageHandling:6, speedVsHandsHandling:5,
    styleMatchups:{"Striker":5,"Kickboxer":4,"Power Striker":3,"Flashy Striker":4,"Counter Striker":3,"Pressure Fighter":1,"Wrestler":-2,"BJJ Specialist":-3,"Grappler":-1,"Complete Fighter":-4},
    opponentQuality:65,
    stats:{slpm:2.9,stracc:43,sapm:3.1,strdef:58,tdavg:2.8,tdacc:48,tddef:72,subavg:1.2,winStreak:1,finishRate:53},
    pastMatchups:{},
  },
  "Diego Lopes": {
    name:"Diego Lopes",record:"27-8",rank:"#4 FW",country:"🇧🇷",age:30,
    weightClass:"Featherweight",naturalWeight:145,reach:74,style:"BJJ Specialist",
    tendencies:["submission hunting from anywhere","aggressive scrambles","dangerous off back","high output"],
    strengths:["submissions","scrambles","cardio","chin","aggression"],
    weaknesses:["elite wrestling (taken down consistently)","power striking gaps"],
    wrestlerResilience:6, reachDisadvantageHandling:7, speedVsHandsHandling:6, yearsInactive:0, recentForm:7,
    styleMatchups:{"Striker":7,"Kickboxer":6,"Counter Striker":5,"Flashy Striker":8,"Power Striker":4,"Pressure Fighter":2,"Wrestler":-4,"Grappler":0,"BJJ Specialist":-2,"Complete Fighter":-1},
    opponentQuality:78,
    stats:{slpm:4.4,stracc:50,sapm:4.0,strdef:57,tdavg:2.3,tdacc:43,tddef:65,subavg:1.8,winStreak:3,finishRate:74},
    pastMatchups:{},
  },
  "Steve Garcia": {
    name:"Steve Garcia",record:"17-9",rank:"Unranked FW",country:"🇺🇸",age:32,
    weightClass:"Featherweight",naturalWeight:145,reach:72,style:"Striker",
    tendencies:["boxing-heavy","durable","pressure style","tough chin"],
    strengths:["boxing","durability","experience"],
    weaknesses:["grappling","ranked opponents record","submission defense"],
    wrestlerResilience:5, reachDisadvantageHandling:5, speedVsHandsHandling:6,
    styleMatchups:{"BJJ Specialist":-4,"Grappler":-3,"Wrestler":-6,"Kickboxer":0,"Counter Striker":-1,"Power Striker":-1,"Flashy Striker":-2,"Striker":0},
    opponentQuality:60,
    stats:{slpm:4.1,stracc:44,sapm:4.5,strdef:53,tdavg:0.6,tdacc:32,tddef:62,subavg:0.2,winStreak:1,finishRate:53},
    pastMatchups:{},
  },
  "Derrick Lewis": {
    name:"Derrick Lewis",record:"27-11",rank:"Unranked HW",country:"🇺🇸",age:40,
    weightClass:"Heavyweight",naturalWeight:265,reach:79,style:"Power Striker",
    tendencies:["patient then explosive","one-punch KO threat always","low activity","late round surges"],
    strengths:["one-punch KO power (UFC HW KO record)","durability","chin","danger at all times"],
    weaknesses:["age (40)","grappling","cardio","technical striking gaps","losses vs elite grapplers"],
    wrestlerResilience:4, reachDisadvantageHandling:6, speedVsHandsHandling:5, yearsInactive:0, recentForm:3,
    styleMatchups:{"Wrestler":-8,"Grappler":-9,"BJJ Specialist":-10,"Sambo / Wrestler":-9,"Striker":3,"Kickboxer":4,"Pressure Fighter":2,"Brawler":1,"Counter Striker":2,"Complete Fighter":-5},
    opponentQuality:82,
    stats:{slpm:4.0,stracc:48,sapm:4.6,strdef:55,tdavg:0.3,tdacc:22,tddef:72,subavg:0.1,winStreak:0,finishRate:85},
    pastMatchups:{"Ciryl Gane":"L"},
  },
  "Josh Hokit": {
    name:"Josh Hokit",record:"12-2",rank:"Unranked HW",country:"🇺🇸",age:30,
    weightClass:"Heavyweight",naturalWeight:255,reach:77,style:"Wrestler",
    tendencies:["wrestling-first approach","ground and pound","physical pressure","durable"],
    strengths:["wrestling","size","toughness","improving striking"],
    weaknesses:["elite striker matchups","elite finishing ability","limited UFC experience"],
    wrestlerResilience:8, reachDisadvantageHandling:6, speedVsHandsHandling:5,
    styleMatchups:{"Power Striker":-3,"Kickboxer":-2,"Striker":-1,"Counter Striker":-2,"Brawler":0,"Pressure Fighter":2,"Wrestler":0,"Grappler":1,"BJJ Specialist":-1,"Complete Fighter":-4},
    opponentQuality:62,
    stats:{slpm:3.2,stracc:44,sapm:3.4,strdef:60,tdavg:3.1,tdacc:50,tddef:70,subavg:0.5,winStreak:3,finishRate:67},
    pastMatchups:{},
  },
  // UFC 329 fighters
  "Conor McGregor": {
    name:"Conor McGregor",record:"22-6",rank:"Former 2x Champion",country:"🇮🇪",age:37,
    weightClass:"Welterweight",naturalWeight:155,reach:74,style:"Counter Striker",
    tendencies:["left hand specialist","southpaw precision","mind games","fights best early","long layoff rust"],
    strengths:["left hand power","movement","timing","mental game","star power"],
    weaknesses:["grappling","chin (KO losses)","late rounds","5yr layoff","leg kick vulnerability"],
    wrestlerResilience:3, reachDisadvantageHandling:7, speedVsHandsHandling:8, yearsInactive:5, recentForm:2,
    styleMatchups:{"Wrestler":-12,"Grappler":-10,"BJJ Specialist":-14,"Sambo / Wrestler":-13,"Pressure Fighter":-4,"Striker":4,"Kickboxer":3,"Counter Striker":0,"Power Striker":-2,"Flashy Striker":3,"Brawler":-2,"Complete Fighter":-5},
    opponentQuality:90,
    stats:{slpm:5.4,stracc:51,sapm:4.7,strdef:55,tdavg:0.5,tdacc:28,tddef:62,subavg:0.1,winStreak:0,finishRate:77},
    pastMatchups:{"Khabib Nurmagomedov":"L","Max Holloway":"W"},
  },
  "Max Holloway": {
    name:"Max Holloway",record:"27-9",rank:"BMF Champion / Former FW Champ",country:"🇺🇸",age:34,
    weightClass:"Welterweight",naturalWeight:155,reach:69,style:"Pressure Boxer",
    tendencies:["relentless volume","combination boxing","improves every round","never stops throwing","elite cardio"],
    strengths:["volume","cardio","chin","heart","late round surges","accuracy"],
    weaknesses:["reach disadvantage vs bigger WW","power at WW","early round can be slower"],
    wrestlerResilience:7, reachDisadvantageHandling:6, speedVsHandsHandling:9, yearsInactive:0, recentForm:9,
    styleMatchups:{"Counter Striker":7,"Flashy Striker":6,"Power Striker":5,"Brawler":6,"Striker":5,"Kickboxer":4,"Pressure Fighter":2,"Wrestler":-3,"Grappler":-2,"BJJ Specialist":-4,"Sambo / Wrestler":-4,"Complete Fighter":1},
    opponentQuality:92,
    stats:{slpm:6.9,stracc:56,sapm:3.9,strdef:60,tdavg:0.2,tdacc:53,tddef:72,subavg:0.3,winStreak:2,finishRate:59},
    pastMatchups:{"Conor McGregor":"L"},
  },
  "Paddy Pimblett": {
    name:"Paddy Pimblett",record:"23-4",rank:"#8 LW",country:"🇬🇧",age:31,
    weightClass:"Lightweight",naturalWeight:155,reach:73,style:"BJJ Specialist",
    tendencies:["submission hunting","dangerous off his back","charismatic pressure","late finisher","crowd favorite"],
    strengths:["BJJ","submissions","chin","crowd support","resilience"],
    weaknesses:["lost to Gaethje","elite wrestler matchups","conditioning doubts","weight management"],
    wrestlerResilience:5, reachDisadvantageHandling:6, speedVsHandsHandling:6, yearsInactive:0, recentForm:6,
    styleMatchups:{"Striker":5,"Kickboxer":5,"Counter Striker":4,"Power Striker":3,"Pressure Fighter":-1,"Flashy Striker":5,"Wrestler":-5,"Grappler":-3,"BJJ Specialist":-2,"Sambo / Wrestler":-6,"Complete Fighter":-2},
    opponentQuality:78,
    stats:{slpm:4.2,stracc:47,sapm:3.8,strdef:57,tdavg:2.3,tdacc:45,tddef:68,subavg:1.9,winStreak:0,finishRate:74},
    pastMatchups:{},
  },
  "Benoit Saint Denis": {
    name:"Benoit Saint Denis",record:"17-3",rank:"#10 LW",country:"🇫🇷",age:28,
    weightClass:"Lightweight",naturalWeight:155,reach:74,style:"Sambo / Wrestler",
    tendencies:["explosive takedowns","sambo trips","dangerous ground game","improving striking","relentless pace"],
    strengths:["grappling","athletic","submissions","cardio","youth"],
    weaknesses:["chin (stopped twice)","elite striker danger","ring rust"],
    wrestlerResilience:9, reachDisadvantageHandling:7, speedVsHandsHandling:6, yearsInactive:0, recentForm:7,
    styleMatchups:{"Striker":8,"Kickboxer":7,"Counter Striker":6,"Flashy Striker":8,"Power Striker":6,"Pressure Boxer":4,"BJJ Specialist":-2,"Grappler":1,"Wrestler":-1,"Sambo / Wrestler":0,"Pressure Fighter":2,"Complete Fighter":-1},
    opponentQuality:72,
    stats:{slpm:3.9,stracc:48,sapm:3.4,strdef:58,tdavg:3.8,tdacc:52,tddef:76,subavg:1.3,winStreak:2,finishRate:76},
    pastMatchups:{},
  },
  "Cory Sandhagen": {
    name:"Cory Sandhagen",record:"18-6",rank:"#3 BW",country:"🇺🇸",age:33,
    weightClass:"Bantamweight",naturalWeight:135,reach:70,style:"Kickboxer",
    tendencies:["spinning attacks","unorthodox timing","head movement","dangerous off cage","creative striker"],
    strengths:["striking creativity","reach for BW","cardio","clinch striking","unpredictability"],
    weaknesses:["grappling when opponent commits","elite wrestler matchups","inconsistent finishes"],
    wrestlerResilience:6, reachDisadvantageHandling:8, speedVsHandsHandling:7, yearsInactive:0, recentForm:7,
    styleMatchups:{"Wrestler":-5,"Grappler":-4,"BJJ Specialist":-6,"Sambo / Wrestler":-5,"Striker":5,"Kickboxer":2,"Counter Striker":4,"Flashy Striker":5,"Power Striker":3,"Pressure Boxer":4,"Brawler":5,"Pressure Fighter":2,"Complete Fighter":0},
    opponentQuality:84,
    stats:{slpm:5.3,stracc:52,sapm:3.8,strdef:59,tdavg:0.9,tdacc:35,tddef:67,subavg:0.2,winStreak:2,finishRate:61},
    pastMatchups:{},
  },
  "Mario Bautista": {
    name:"Mario Bautista",record:"17-3",rank:"#6 BW",country:"🇺🇸",age:32,
    weightClass:"Bantamweight",naturalWeight:135,reach:71,style:"Wrestler",
    tendencies:["wrestling-first","relentless TD attempts","recovers after failed TDs","ground and pound","improving striking"],
    strengths:["wrestling","top control","cardio","chin","relentlessness after failed TDs"],
    weaknesses:["striking at range","finished by elite power","outclassed vs top 3"],
    wrestlerResilience:9, reachDisadvantageHandling:6, speedVsHandsHandling:6, yearsInactive:0, recentForm:8,
    styleMatchups:{"Striker":8,"Kickboxer":7,"Counter Striker":6,"Flashy Striker":9,"Power Striker":5,"Pressure Boxer":4,"BJJ Specialist":-2,"Grappler":1,"Wrestler":-1,"Sambo / Wrestler":-2,"Pressure Fighter":3,"Complete Fighter":0},
    opponentQuality:72,
    stats:{slpm:3.5,stracc:47,sapm:2.8,strdef:62,tdavg:3.9,tdacc:55,tddef:74,subavg:0.4,winStreak:3,finishRate:65},
    pastMatchups:{"Cory Sandhagen":"L"},
  },
  "Gable Steveson": {
    name:"Gable Steveson",record:"3-0",rank:"Unranked HW",country:"🇺🇸",age:26,
    weightClass:"Heavyweight",naturalWeight:275,reach:76,style:"Wrestler",
    tendencies:["dominant wrestling","Olympic-level takedowns","physical domination","relentless after failed TDs","limited MMA striking"],
    strengths:["elite wrestling (2x NCAA champion, Olympic gold)","athleticism","size","relentlessness"],
    weaknesses:["only 3 MMA fights","striking underdeveloped","untested chin vs elite power","limited submission defense"],
    wrestlerResilience:10, reachDisadvantageHandling:6, speedVsHandsHandling:5, yearsInactive:0, recentForm:6,
    styleMatchups:{"Striker":12,"Kickboxer":11,"Power Striker":10,"Flashy Striker":12,"Counter Striker":9,"Brawler":6,"Pressure Fighter":4,"Grappler":1,"BJJ Specialist":-1,"Wrestler":0,"Sambo / Wrestler":-2,"Complete Fighter":3},
    opponentQuality:35,
    stats:{slpm:3.0,stracc:42,sapm:1.8,strdef:65,tdavg:5.8,tdacc:65,tddef:90,subavg:0.3,winStreak:3,finishRate:100},
    pastMatchups:{},
  },
  "Elisha Ellison": {
    name:"Elisha Ellison",record:"5-2",rank:"Unranked HW",country:"🇺🇸",age:30,
    weightClass:"Heavyweight",naturalWeight:255,reach:77,style:"Brawler",
    tendencies:["aggressive first round","power-first","limited technique","tough chin","KO losses on record"],
    strengths:["finishing ability","power","durability"],
    weaknesses:["grappling (0-1 in UFC)","technique gaps","KO'd in UFC debut","untested vs elite wrestlers"],
    wrestlerResilience:4, reachDisadvantageHandling:5, speedVsHandsHandling:5,
    styleMatchups:{"Wrestler":-8,"Grappler":-6,"Sambo / Wrestler":-9,"Kickboxer":1,"Counter Striker":0,"Striker":0,"Power Striker":0},
    opponentQuality:40,
    stats:{slpm:4.5,stracc:46,sapm:4.8,strdef:50,tdavg:0.4,tdacc:28,tddef:48,subavg:0.1,winStreak:1,finishRate:80},
    pastMatchups:{},
  },
  "Brandon Royval": {
    name:"Brandon Royval",record:"17-9",rank:"#5 FLW",country:"🇺🇸",age:33,
    weightClass:"Flyweight",naturalWeight:125,reach:68,style:"BJJ Specialist",
    tendencies:["submission from anywhere","dangerous off his back","wild scrambles","aggressive guard work"],
    strengths:["submissions","grappling scrambles","durability","finishing ability"],
    weaknesses:["elite wrestlers take him down at will","chin (KO losses)","inconsistency"],
    wrestlerResilience:5, reachDisadvantageHandling:6, speedVsHandsHandling:6, yearsInactive:0, recentForm:6,
    styleMatchups:{"Striker":6,"Kickboxer":5,"Counter Striker":4,"Power Striker":3,"Pressure Boxer":3,"Flashy Striker":5,"Wrestler":-5,"Grappler":-2,"BJJ Specialist":-2,"Sambo / Wrestler":-5,"Pressure Fighter":1,"Complete Fighter":-1},
    opponentQuality:76,
    stats:{slpm:4.0,stracc:46,sapm:4.2,strdef:55,tdavg:2.5,tdacc:40,tddef:65,subavg:2.2,winStreak:1,finishRate:76},
    pastMatchups:{},
  },
  "Lone'er Kavanagh": {
    name:"Lone'er Kavanagh",record:"10-1",rank:"#7 FLW",country:"🇩🇰",age:27,
    weightClass:"Flyweight",naturalWeight:125,reach:67,style:"Striker",
    tendencies:["explosive hands","power punching","pressures opponents","upset specialist"],
    strengths:["power (for FLW)","chin","aggression","surprised Moreno"],
    weaknesses:["limited UFC experience","grappling depth","style matchup vs elite grapplers"],
    wrestlerResilience:5, reachDisadvantageHandling:5, speedVsHandsHandling:7,
    styleMatchups:{"BJJ Specialist":-3,"Grappler":-2,"Wrestler":-4,"Sambo / Wrestler":-4,"Kickboxer":1,"Counter Striker":0,"Pressure Boxer":-1,"Striker":2,"Power Striker":1,"Complete Fighter":-2},
    opponentQuality:65,
    stats:{slpm:4.8,stracc:50,sapm:3.5,strdef:59,tdavg:0.8,tdacc:36,tddef:65,subavg:0.3,winStreak:2,finishRate:70},
    pastMatchups:{},
  },
  // Also keep existing fighters
  "Song Yadong": {
    name:"Song Yadong",record:"22-9-1",rank:"#7 BW",country:"🇨🇳",age:27,
    weightClass:"Bantamweight",naturalWeight:135,reach:72,style:"Pressure Boxer",
    tendencies:["high volume","forward pressure","left hook specialist","improves late in fights"],
    strengths:["striking volume","pace","chin","late round surges"],
    weaknesses:["submission defense","struggles vs elite wrestlers"],
    wrestlerResilience:4, reachDisadvantageHandling:6, speedVsHandsHandling:7, yearsInactive:0, recentForm:8,
    styleMatchups:{"Wrestler":-8,"Grappler":-6,"BJJ Specialist":-10,"Pressure Boxer":0,"Counter Striker":4,"Kickboxer":2,"Power Striker":-2,"Sambo / Wrestler":-9,"Flashy Striker":3,"Complete Fighter":-3},
    opponentQuality:72,
    stats:{slpm:5.8,stracc:52,sapm:4.1,strdef:57,tdavg:0.8,tdacc:38,tddef:72,subavg:0.4,winStreak:3,finishRate:48},
    pastMatchups:{},
  },
  "Deiveson Figueiredo": {
    name:"Deiveson Figueiredo",record:"25-6-1",rank:"#9 BW",country:"🇧🇷",age:38,
    weightClass:"Flyweight",naturalWeight:125,reach:71,style:"Counter Striker / Grappler",
    tendencies:["dangerous in early rounds","guillotine threat","counter puncher","slows late"],
    strengths:["finishing power","guillotine","counter timing","championship experience"],
    weaknesses:["cardio after round 3","size at higher weight","chin concerns lately"],
    wrestlerResilience:6, reachDisadvantageHandling:6, speedVsHandsHandling:6, yearsInactive:0, recentForm:5,
    styleMatchups:{"Pressure Boxer":-4,"Wrestler":2,"Grappler":0,"BJJ Specialist":-2,"Counter Striker":0,"Kickboxer":3,"Power Striker":-3,"Flashy Striker":-2,"Pressure Fighter":-1,"Complete Fighter":-1},
    opponentQuality:85,
    stats:{slpm:4.9,stracc:48,sapm:4.8,strdef:51,tdavg:2.1,tdacc:44,tddef:58,subavg:1.8,winStreak:1,finishRate:72},
    pastMatchups:{},
  },
  "Belal Muhammad": {
    name:"Belal Muhammad",record:"24-4",rank:"#2 WW",country:"🇺🇸",age:37,
    weightClass:"Welterweight",naturalWeight:170,reach:74,style:"Wrestler / Grappler",
    tendencies:["cage control","dirty boxing","high volume takedowns","smothers opponents"],
    strengths:["elite wrestling","takedown defense","pace","body work"],
    weaknesses:["finishing ability","power","can be outstruck by elites"],
    wrestlerResilience:9, reachDisadvantageHandling:7, speedVsHandsHandling:5,
    styleMatchups:{"Striker":8,"Kickboxer":6,"Power Striker":4,"Counter Striker":5,"Pressure Boxer":3,"Wrestler":-2,"Grappler":-3,"BJJ Specialist":-5,"Flashy Striker":7,"Pressure Fighter":2,"Complete Fighter":-1},
    opponentQuality:88,
    stats:{slpm:3.8,stracc:46,sapm:2.9,strdef:65,tdavg:3.4,tdacc:48,tddef:81,subavg:0.6,winStreak:2,finishRate:38},
    pastMatchups:{},
  },
  "Gabriel Bonfim": {
    name:"Gabriel Bonfim",record:"18-1",rank:"#9 WW",country:"🇧🇷",age:26,
    weightClass:"Welterweight",naturalWeight:170,reach:73,style:"BJJ Specialist",
    tendencies:["submission hunter","fast starter","looks for the neck","aggressive scrambles"],
    strengths:["submissions","top pressure","scrambles","finishing instinct"],
    weaknesses:["takedown defense vs elite wrestlers","untested vs top 5"],
    wrestlerResilience:5, reachDisadvantageHandling:6, speedVsHandsHandling:6, yearsInactive:0, recentForm:6,
    styleMatchups:{"Wrestler":-6,"Grappler":2,"BJJ Specialist":0,"Striker":7,"Kickboxer":6,"Power Striker":4,"Counter Striker":5,"Pressure Boxer":3,"Flashy Striker":6,"Pressure Fighter":1,"Complete Fighter":-2},
    opponentQuality:70,
    stats:{slpm:4.3,stracc:51,sapm:3.7,strdef:56,tdavg:1.9,tdacc:42,tddef:62,subavg:1.4,winStreak:5,finishRate:83},
    pastMatchups:{},
  },
  "Jon Jones": {
    name:"Jon Jones",record:"27-1-1",rank:"HW Champion",country:"🇺🇸",age:38,
    weightClass:"Heavyweight",naturalWeight:250,reach:84,style:"Complete Fighter",
    tendencies:["oblique kicks","unpredictable combos","dirty boxing in clinch","elite IQ","adapts mid-fight"],
    strengths:["reach (84\")","wrestling","striking IQ","clinch","adaptability","IQ"],
    weaknesses:["inactivity (2+ yrs)","age","untested chin at HW"],
    wrestlerResilience:10, reachDisadvantageHandling:10, speedVsHandsHandling:9, yearsInactive:2, recentForm:6,
    styleMatchups:{"Striker":6,"Kickboxer":7,"Power Striker":4,"Pressure Fighter":5,"Wrestler":3,"Grappler":4,"BJJ Specialist":4,"Counter Striker":4,"Flashy Striker":7,"Brawler":6,"Pressure Boxer":5,"Sambo / Wrestler":2},
    opponentQuality:97,
    stats:{slpm:4.2,stracc:55,sapm:2.1,strdef:64,tdavg:2.2,tdacc:43,tddef:95,subavg:0.3,winStreak:4,finishRate:59},
    pastMatchups:{},
  },
  "Islam Makhachev": {
    name:"Islam Makhachev",record:"27-1",rank:"LW Champion",country:"🇷🇺",age:34,
    weightClass:"Lightweight",naturalWeight:170,reach:70,style:"Sambo / Wrestler",
    tendencies:["body lock takedowns","ground and pound","submission setups","suffocating top control"],
    strengths:["elite wrestling","submissions","top control","fight IQ"],
    weaknesses:["pure boxing at distance"],
    wrestlerResilience:10, reachDisadvantageHandling:8, speedVsHandsHandling:7, yearsInactive:0, recentForm:10,
    styleMatchups:{"Striker":11,"Kickboxer":10,"Power Striker":8,"Counter Striker":7,"Pressure Fighter":6,"Flashy Striker":11,"Pressure Boxer":6,"Wrestler":-1,"Grappler":1,"BJJ Specialist":-2,"Complete Fighter":-1},
    opponentQuality:95,
    stats:{slpm:3.9,stracc:51,sapm:2.4,strdef:70,tdavg:4.1,tdacc:54,tddef:88,subavg:1.1,winStreak:12,finishRate:63},
    pastMatchups:{},
  },
  "Khabib Nurmagomedov": {
    name:"Khabib Nurmagomedov",record:"29-0",rank:"Retired (LW GOAT)",country:"🇷🇺",age:37,
    weightClass:"Lightweight",naturalWeight:155,reach:70,style:"Sambo / Wrestler",
    tendencies:["relentless cage wrestling","ground and pound","smothers opponents","mental warfare"],
    strengths:["wrestling","top control","pressure","never been stopped","mental fortitude"],
    weaknesses:["limited striking variety","untested chin"],
    wrestlerResilience:10, reachDisadvantageHandling:8, speedVsHandsHandling:7, yearsInactive:5, recentForm:7, yearsInactive:0, recentForm:10,
    styleMatchups:{"Striker":14,"Kickboxer":12,"Power Striker":10,"Counter Striker":9,"Flashy Striker":13,"Pressure Fighter":7,"Pressure Boxer":6,"Wrestler":1,"Grappler":2,"BJJ Specialist":-1,"Complete Fighter":0},
    opponentQuality:97,
    stats:{slpm:4.1,stracc:49,sapm:1.8,strdef:71,tdavg:5.3,tdacc:48,tddef:92,subavg:1.5,winStreak:13,finishRate:59},
    pastMatchups:{"Conor McGregor":"W"},
  },
  "Charles Oliveira": {
    name:"Charles Oliveira",record:"34-10",rank:"#3 LW",country:"🇧🇷",age:36,
    weightClass:"Lightweight",naturalWeight:155,reach:74,style:"BJJ / Submission Hunter",
    tendencies:["choke specialist","dangerous off his back","slow starter","finishes dramatically"],
    strengths:["submissions","resilience","BJJ","heart","finishing ability"],
    weaknesses:["early round vulnerability","can be hurt on feet","weight cut issues"],
    wrestlerResilience:6, reachDisadvantageHandling:7, speedVsHandsHandling:6, yearsInactive:0, recentForm:7,
    styleMatchups:{"Striker":5,"Kickboxer":4,"Power Striker":3,"Pressure Fighter":2,"Wrestler":-2,"Grappler":-1,"BJJ Specialist":-3,"Counter Striker":4,"Flashy Striker":5,"Pressure Boxer":3,"Complete Fighter":-1},
    opponentQuality:92,
    stats:{slpm:3.6,stracc:47,sapm:3.9,strdef:58,tdavg:2.8,tdacc:42,tddef:72,subavg:2.1,winStreak:2,finishRate:88},
    pastMatchups:{"Islam Makhachev":"L"},
  },
  "Dricus Du Plessis": {
    name:"Dricus Du Plessis",record:"22-2",rank:"MW Champion",country:"🇿🇦",age:32,
    weightClass:"Middleweight",naturalWeight:185,reach:76,style:"Brawler / Grappler",
    tendencies:["relentless pressure","body attacks","scrambles for submissions","iron chin"],
    strengths:["durability","pressure","grappling scrambles","heart"],
    weaknesses:["technical striking gaps","can be outstruck by disciplined boxers"],
    wrestlerResilience:8, reachDisadvantageHandling:7, speedVsHandsHandling:6, yearsInactive:0, recentForm:8, yearsInactive:1.5, recentForm:4,
    styleMatchups:{"Striker":-1,"Kickboxer":-1,"Counter Striker":-2,"Pressure Fighter":3,"Wrestler":3,"Grappler":4,"BJJ Specialist":2,"Brawler":1,"Flashy Striker":3,"Pressure Boxer":2,"Complete Fighter":-1},
    opponentQuality:87,
    stats:{slpm:5.1,stracc:48,sapm:4.3,strdef:56,tdavg:1.8,tdacc:40,tddef:70,subavg:0.8,winStreak:4,finishRate:68},
    pastMatchups:{},
  },
  // ── New fighters for upcoming cards ────────────────────────────────────
  "Leon Edwards": {
    name:"Leon Edwards",record:"22-4",rank:"#2 WW",country:"🇬🇧",age:33,
    weightClass:"Welterweight",naturalWeight:170,reach:74,style:"Counter Striker",
    tendencies:["southpaw stance","jab-heavy","lateral movement","composure under pressure","clutch moments"],
    strengths:["elite boxing","footwork","composure","cardio","late-fight finishes"],
    weaknesses:["slow starter","can be out-pressured early","ground-and-pound when taken down"],
    wrestlerResilience:7, reachDisadvantageHandling:7, speedVsHandsHandling:8, yearsInactive:0, recentForm:7,
    styleMatchups:{"Pressure Fighter":5,"Brawler":6,"Kickboxer":4,"Power Striker":3,"Wrestler":-3,"Grappler":-2,"BJJ Specialist":-4,"Sambo / Wrestler":-3,"Flashy Striker":4,"Complete Fighter":-1,"Striker":3,"Counter Striker":0},
    opponentQuality:91,
    stats:{slpm:4.7,stracc:52,sapm:3.1,strdef:62,tdavg:1.1,tdacc:36,tddef:74,subavg:0.2,winStreak:1,finishRate:55},
    pastMatchups:{},
  },
  "Daniel Rodriguez": {
    name:"Daniel Rodriguez",record:"18-4",rank:"#6 WW",country:"🇺🇸",age:35,
    weightClass:"Welterweight",naturalWeight:170,reach:75,style:"Pressure Fighter",
    tendencies:["walks opponents down","heavy body work","durable chin","late-fight surges"],
    strengths:["durability","pressure","body work","heart","toughness"],
    weaknesses:["elite wrestling and grappling","can be outboxed at range","limited submission offense"],
    wrestlerResilience:6, reachDisadvantageHandling:6, speedVsHandsHandling:6, yearsInactive:0, recentForm:7,
    styleMatchups:{"Counter Striker":4,"Flashy Striker":5,"Kickboxer":3,"Striker":3,"Power Striker":1,"Wrestler":-2,"Grappler":-3,"BJJ Specialist":-4,"Sambo / Wrestler":-3,"Pressure Fighter":0,"Complete Fighter":-2},
    opponentQuality:82,
    stats:{slpm:5.3,stracc:47,sapm:4.6,strdef:55,tdavg:0.8,tdacc:32,tddef:66,subavg:0.1,winStreak:2,finishRate:67},
    pastMatchups:{},
  },
  "Manel Kape": {
    name:"Manel Kape",record:"20-7",rank:"#5 FLW",country:"🇦🇴",age:30,
    weightClass:"Flyweight",naturalWeight:125,reach:66,style:"Power Striker",
    tendencies:["highlight-reel knockouts","southpaw bombs","explosive first round","flashy combos"],
    strengths:["power for flyweight","finishing ability","athleticism","explosiveness"],
    weaknesses:["grappling","takedown defense (54%)","can be outworked over full fight"],
    wrestlerResilience:4, reachDisadvantageHandling:5, speedVsHandsHandling:7, yearsInactive:0, recentForm:7,
    styleMatchups:{"Wrestler":-6,"Grappler":-5,"BJJ Specialist":-7,"Sambo / Wrestler":-6,"Pressure Fighter":2,"Striker":3,"Kickboxer":2,"Counter Striker":3,"Flashy Striker":1,"Brawler":2,"Complete Fighter":-3},
    opponentQuality:78,
    stats:{slpm:5.8,stracc:50,sapm:4.5,strdef:53,tdavg:0.4,tdacc:28,tddef:54,subavg:0.3,winStreak:1,finishRate:80},
    pastMatchups:{},
  },
  "Kai Kara-France": {
    name:"Kai Kara-France",record:"25-10",rank:"#8 FLW",country:"🇳🇿",age:33,
    weightClass:"Flyweight",naturalWeight:125,reach:67,style:"Kickboxer",
    tendencies:["technical kickboxing","teep kicks","body shots","patient setup","front kick to face"],
    strengths:["kickboxing base","footwork","body work","composure"],
    weaknesses:["grappling when on bottom","submission defense","can be worn down by wrestlers"],
    wrestlerResilience:5, reachDisadvantageHandling:6, speedVsHandsHandling:7, yearsInactive:0, recentForm:6,
    styleMatchups:{"Wrestler":-4,"Grappler":-4,"BJJ Specialist":-6,"Pressure Fighter":3,"Striker":3,"Power Striker":1,"Counter Striker":2,"Flashy Striker":2,"Brawler":3,"Complete Fighter":-2},
    opponentQuality:80,
    stats:{slpm:4.9,stracc:51,sapm:4.1,strdef:56,tdavg:0.5,tdacc:30,tddef:62,subavg:0.2,winStreak:1,finishRate:60},
    pastMatchups:{},
  },
  "Rafael Fiziev": {
    name:"Rafael Fiziev",record:"14-3",rank:"#7 LW",country:"🇰🇿",age:31,
    weightClass:"Lightweight",naturalWeight:155,reach:72,style:"Kickboxer",
    tendencies:["unorthodox striking angles","spinning attacks","southpaw-to-orthodox switches","explosive knockouts"],
    strengths:["power","unorthodox style","finishing ability","athleticism","spinning techniques"],
    weaknesses:["wrestling defense (60%)","grappling when taken down","can be predictable with big shots"],
    wrestlerResilience:5, reachDisadvantageHandling:6, speedVsHandsHandling:8, yearsInactive:0, recentForm:7,
    styleMatchups:{"Wrestler":-5,"Grappler":-4,"BJJ Specialist":-6,"Pressure Fighter":4,"Striker":3,"Counter Striker":3,"Power Striker":2,"Flashy Striker":3,"Kickboxer":1,"Complete Fighter":-2,"Sambo / Wrestler":-5},
    opponentQuality:82,
    stats:{slpm:5.4,stracc:49,sapm:3.8,strdef:59,tdavg:0.3,tdacc:25,tddef:60,subavg:0.1,winStreak:1,finishRate:79},
    pastMatchups:{},
  },
  "Renato Moicano": {
    name:"Renato Moicano",record:"20-7-1",rank:"#11 LW",country:"🇧🇷",age:34,
    weightClass:"Lightweight",naturalWeight:155,reach:72,style:"BJJ Specialist",
    tendencies:["submission hunting","dirty boxing in clinch","tough chin","never gives up"],
    strengths:["submissions","heart","BJJ","clinch work","grappling IQ"],
    weaknesses:["elite striking at range","takedown defense inconsistency","power vs elites"],
    wrestlerResilience:7, reachDisadvantageHandling:6, speedVsHandsHandling:5, yearsInactive:0, recentForm:7,
    styleMatchups:{"Striker":5,"Kickboxer":4,"Power Striker":3,"Pressure Fighter":2,"Counter Striker":3,"Flashy Striker":5,"Wrestler":-2,"Grappler":-1,"BJJ Specialist":-3,"Complete Fighter":-2},
    opponentQuality:80,
    stats:{slpm:3.8,stracc:46,sapm:3.4,strdef:59,tdavg:1.9,tdacc:40,tddef:71,subavg:1.5,winStreak:2,finishRate:65},
    pastMatchups:{},
  },
  "Magomed Ankalaev": {
    name:"Magomed Ankalaev",record:"20-1-1",rank:"#1 LHW",country:"🇷🇺",age:32,
    weightClass:"Light Heavyweight",naturalWeight:205,reach:75,style:"Sambo / Wrestler",
    tendencies:["pressure wrestling","ground and pound","heavy hands on feet","body lock takedowns"],
    strengths:["elite wrestling","ground and pound","durability","power","top control"],
    weaknesses:["can be slow to start","occasionally passive on feet","submission defense off back"],
    wrestlerResilience:9, reachDisadvantageHandling:7, speedVsHandsHandling:6, yearsInactive:0, recentForm:9,
    styleMatchups:{"Striker":10,"Kickboxer":9,"Power Striker":7,"Counter Striker":6,"Flashy Striker":10,"Pressure Fighter":5,"Brawler":4,"Wrestler":0,"Grappler":1,"BJJ Specialist":-1,"Complete Fighter":0},
    opponentQuality:86,
    stats:{slpm:3.6,stracc:49,sapm:2.9,strdef:62,tdavg:2.8,tdacc:47,tddef:84,subavg:0.3,winStreak:6,finishRate:55},
    pastMatchups:{},
  },
  "Khalil Rountree Jr.": {
    name:"Khalil Rountree Jr.",record:"14-5-1",rank:"#5 LHW",country:"🇺🇸",age:35,
    weightClass:"Light Heavyweight",naturalWeight:205,reach:75,style:"Power Striker",
    tendencies:["powerful low kicks","southpaw stance","explosive right cross","brawls in pocket"],
    strengths:["power","low kicks","toughness","athleticism"],
    weaknesses:["wrestling defense","grappling when taken down","can be outboxed at range"],
    wrestlerResilience:5, reachDisadvantageHandling:5, speedVsHandsHandling:7, yearsInactive:0, recentForm:8,
    styleMatchups:{"Wrestler":-6,"Grappler":-5,"BJJ Specialist":-7,"Sambo / Wrestler":-7,"Pressure Fighter":2,"Striker":2,"Kickboxer":2,"Counter Striker":2,"Flashy Striker":3,"Brawler":1,"Complete Fighter":-3},
    opponentQuality:78,
    stats:{slpm:5.6,stracc:48,sapm:4.2,strdef:55,tdavg:0.3,tdacc:24,tddef:58,subavg:0.1,winStreak:3,finishRate:86},
    pastMatchups:{},
  },
  "Kevin Holland": {
    name:"Kevin Holland",record:"27-11",rank:"#15 WW",country:"🇺🇸",age:32,
    weightClass:"Welterweight",naturalWeight:170,reach:80,style:"Flashy Striker",
    tendencies:["wild unorthodox combos","trash talk mid-fight","submission scrambles","huge reach advantage"],
    strengths:["reach (80\")" ,"unorthodox movement","submissions","entertainment factor","power"],
    weaknesses:["gets hit a lot","wrestling defense","inconsistency","can be outboxed by disciplined fighters"],
    wrestlerResilience:6, reachDisadvantageHandling:9, speedVsHandsHandling:7, yearsInactive:0, recentForm:6,
    styleMatchups:{"Wrestler":-4,"Grappler":-3,"BJJ Specialist":-5,"Sambo / Wrestler":-4,"Counter Striker":3,"Pressure Fighter":2,"Striker":2,"Kickboxer":2,"Power Striker":1,"Brawler":3,"Flashy Striker":1,"Complete Fighter":-2},
    opponentQuality:84,
    stats:{slpm:6.1,stracc:44,sapm:5.8,strdef:50,tdavg:0.6,tdacc:28,tddef:58,subavg:0.8,winStreak:1,finishRate:70},
    pastMatchups:{},
  },
  "Kyoji Horiguchi": {
    name:"Kyoji Horiguchi",record:"30-6",rank:"#2 FLW",country:"🇯🇵",age:34,
    weightClass:"Flyweight",naturalWeight:125,reach:66,style:"Kickboxer",
    tendencies:["fast combinations","in-and-out movement","body kicks","accurate jab","scrambles"],
    strengths:["speed","striking accuracy","cardio","fight IQ","experience"],
    weaknesses:["power vs elite heavyweights of flyweight","can be caught by power punchers"],
    wrestlerResilience:6, reachDisadvantageHandling:6, speedVsHandsHandling:8, yearsInactive:0, recentForm:8,
    styleMatchups:{"Wrestler":-3,"Grappler":-3,"BJJ Specialist":-5,"Sambo / Wrestler":-4,"Pressure Fighter":3,"Striker":3,"Power Striker":2,"Counter Striker":2,"Flashy Striker":2,"Brawler":3,"Complete Fighter":-1},
    opponentQuality:83,
    stats:{slpm:5.2,stracc:53,sapm:3.6,strdef:60,tdavg:0.6,tdacc:32,tddef:68,subavg:0.3,winStreak:2,finishRate:57},
    pastMatchups:{"Manel Kape":"W"},
  },
};
const FIGHTER_NAMES = Object.keys(FIGHTER_DB).sort();

// ─── PAST RESULTS (fights already happened) ──────────────────────────────────
const PAST_EVENTS = [
  {
    event:"UFC Freedom 250 — The White House",
    date:"June 14, 2026",venue:"South Lawn, White House, Washington D.C.",
    fights:[
      {f1:"Ilia Topuria",f2:"Justin Gaethje",weightClass:"Lightweight (Title Unification)",isMain:true,
        actualWinner:"Justin Gaethje",method:"TKO (Corner Stoppage)",round:4,time:"5:00"},
      {f1:"Ciryl Gane",f2:"Alex Pereira",weightClass:"Heavyweight (Interim Title)",isMain:false,
        actualWinner:"Ciryl Gane",method:"TKO (Punches)",round:2,time:"1:27"},
      {f1:"Sean O'Malley",f2:"Aiemann Zahabi",weightClass:"Bantamweight",isMain:false,
        actualWinner:"Sean O'Malley",method:"TKO (Punches)",round:2,time:"4:02"},
      {f1:"Josh Hokit",f2:"Derrick Lewis",weightClass:"Heavyweight",isMain:false,
        actualWinner:"Josh Hokit",method:"TKO (Punches)",round:2,time:"4:09"},
      {f1:"Mauricio Ruffy",f2:"Michael Chandler",weightClass:"Lightweight",isMain:false,
        actualWinner:"Mauricio Ruffy",method:"TKO (Spinning Wheel Kick & Punches)",round:1,time:"4:29"},
      {f1:"Bo Nickal",f2:"Kyle Daukaus",weightClass:"Middleweight",isMain:false,
        actualWinner:"Bo Nickal",method:"TKO (Punches)",round:1,time:"4:34"},
      {f1:"Diego Lopes",f2:"Steve Garcia",weightClass:"Featherweight",isMain:false,
        actualWinner:"Diego Lopes",method:"KO (Punches)",round:2,time:"2:43"},
    ],
  },
];

// ─── UPCOMING EVENTS ──────────────────────────────────────────────────────────
const UPCOMING_EVENTS = [
  {
    event:"UFC Fight Night 279: Kape vs. Horiguchi 2",
    date:"June 20, 2026",venue:"Meta Apex (UFC Apex), Las Vegas, NV",
    fights:[
      {f1:"Manel Kape",f2:"Kyoji Horiguchi",weightClass:"Flyweight",isMain:true,
        context:"Rematch — Horiguchi beat Kape in 2017 via arm-triangle at Rizin. Kape has been on a tear in the UFC with brutal KO power. Horiguchi returns with back-to-back wins. Winner likely gets the next flyweight title shot."},
    ],
  },
  {
    event:"UFC Fight Night 280: Fiziev vs. Torres",
    date:"June 27, 2026",venue:"National Gymnastics Arena, Baku, Azerbaijan",
    fights:[
      {f1:"Rafael Fiziev",f2:"Renato Moicano",weightClass:"Lightweight",isMain:true,
        context:"Fiziev fights in front of his home crowd in Azerbaijan looking to rebound. Torres is a pressure-heavy finisher from Mexico — exactly the kind of opponent that could nullify Fiziev's flashy kickboxing if he can close the distance."},
      {f1:"Rafael Fiziev",f2:"Renato Moicano",weightClass:"Middleweight (co-main)",isMain:false,
        context:"Michel Pereira's unorthodox wild movement vs Shara Magomedov's knockout power. Both men are known for spectacular, unpredictable fighting styles. Could be fight of the night."},
    ],
  },
  {
    event:"UFC 329: McGregor vs. Holloway 2",
    date:"July 11, 2026",venue:"T-Mobile Arena, Las Vegas, NV",
    fights:[
      {f1:"Conor McGregor",f2:"Max Holloway",weightClass:"Welterweight",isMain:true,
        context:"The long-awaited rematch 13 years after McGregor beat Holloway at featherweight. McGregor returns after a 5-year layoff — massive questions about his chin, conditioning and ring rust vs a prime Max Holloway."},
      {f1:"Paddy Pimblett",f2:"Benoit Saint Denis",weightClass:"Lightweight",isMain:false,
        context:"Pimblett bounces back after the Gaethje loss. Saint Denis is an explosive sambo grappler — a stylistic nightmare for Pimblett if he can get the fight to the ground."},
      {f1:"Cory Sandhagen",f2:"Mario Bautista",weightClass:"Bantamweight",isMain:false,
        context:"Sandhagen vs Bautista 2 — Bautista won the first meeting. Sandhagen's unorthodox striking vs Bautista's relentless wrestling pressure."},
      {f1:"Brandon Royval",f2:"Lone'er Kavanagh",weightClass:"Flyweight",isMain:false,
        context:"Royval's elite submission game vs Kavanagh the upset specialist. Royval needs a statement win to stay relevant in the title picture."},
      {f1:"Gable Steveson",f2:"Elisha Ellison",weightClass:"Heavyweight",isMain:false,
        context:"Olympic gold medalist and 2x NCAA wrestling champion Steveson makes his long-awaited UFC debut. A massive mismatch on paper against the 0-1 Ellison."},
    ],
  },
  {
    event:"UFC Fight Night 282: Ankalaev vs. Rountree Jr.",
    date:"July 25, 2026",venue:"Etihad Arena, Abu Dhabi, UAE",
    fights:[
      {f1:"Magomed Ankalaev",f2:"Khalil Rountree Jr.",weightClass:"Light Heavyweight",isMain:true,
        context:"The #1 ranked contender Ankalaev — dominant wrestler and GnP specialist — vs the hard-hitting southpaw Rountree. Ankalaev's elite wrestling is the ultimate equalizer against Rountree's massive one-punch KO power."},
    ],
  },
  {
    event:"UFC 330: Philadelphia",
    date:"August 15, 2026",venue:"Xfinity Mobile Arena, Philadelphia, PA",
    fights:[
      {f1:"Manel Kape",f2:"Kai Kara-France",weightClass:"Flyweight",isMain:true,
        context:"Full card still being announced for the UFC's return to Philly for the first time in 15 years."},
    ],
  },
];

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
  const rawExp = (fighter1.opponentQuality-fighter2.opponentQuality)*0.25
               + (s1.winStreak-s2.winStreak)*1.2
               + (parseInt(fighter1.record)-parseInt(fighter2.record))*0.08;
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
  const rd = fighter1.reach-fighter2.reach;
  const weightBonus = Math.sign(nwd)*Math.pow(Math.abs(nwd)/15,1.5)*6;
  const reachBonus = rd*0.4
    + ((fighter1.reachDisadvantageHandling??5)-(fighter2.reachDisadvantageHandling??5))*0.5;
  const sizeBonus = weightBonus+reachBonus;

  // 8. PAST MATCHUP
  let pastMod = 0;
  if(fighter1.pastMatchups?.[fighter2.name]==="W") pastMod=10;
  if(fighter1.pastMatchups?.[fighter2.name]==="L") pastMod=-12;
  if(fighter2.pastMatchups?.[fighter1.name]==="W") pastMod=-10;
  if(fighter2.pastMatchups?.[fighter1.name]==="L") pastMod=12;

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
      {label:"Opp. Quality Edge",  value:Math.round((fighter1.opponentQuality-fighter2.opponentQuality)*0.8),  icon:"🏆"},
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
function ResultPanel({pred,f1,f2,onShare}){
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

  const [preds, setPreds] = React.useState(() => {
    // Auto-predict all past fights using the scoring engine
    const results = {};
    allFights.forEach(f => {
      const key = f.f1 + "||" + f.f2;
      const a = FIGHTER_DB[f.f1], b = FIGHTER_DB[f.f2];
      if (a && b) {
        const sc = scoreFight(a, b);
        const pct = sc.winner === a.name ? sc.f1WinPct : sc.f2WinPct;
        results[key] = { predicted: sc.winner, pct, actual: f.actualWinner };
      }
    });
    return results;
  });

  const entries = Object.entries(preds);
  const resolved = entries.filter(([,v]) => v.actual);
  const correct = resolved.filter(([,v]) => v.predicted === v.actual).length;
  const acc = resolved.length ? Math.round(correct / resolved.length * 100) : null;

  return (
    <div style={{padding:"20px 24px", maxWidth:700}}>
      {/* Accuracy header */}
      {resolved.length > 0 && (
        <div style={{background:"linear-gradient(135deg,#1a1000,#0d1a00)", border:"1px solid #d4a843", borderRadius:10, padding:16, marginBottom:20, textAlign:"center"}}>
          <div style={{fontSize:9, color:"#5a4a3a", letterSpacing:2, textTransform:"uppercase", marginBottom:6}}>AI Prediction Accuracy</div>
          <div style={{fontSize:48, fontWeight:700, color:"#d4a843", lineHeight:1}}>{acc}%</div>
          <div style={{fontSize:11, color:"#5a4a3a", marginTop:4}}>{correct} correct of {resolved.length} fights</div>
          <div style={{marginTop:12, height:6, background:"#1a1a1a", borderRadius:3, overflow:"hidden"}}>
            <div style={{height:"100%", width:`${acc}%`, background:"linear-gradient(90deg,#d4a843,#a87820)", borderRadius:3, transition:"width 1s ease"}}/>
          </div>
        </div>
      )}

      {/* Group by event */}
      {PAST_EVENTS.map(evt => {
        const evtFights = evt.fights.filter(f => FIGHTER_DB[f.f1] && FIGHTER_DB[f.f2]);
        if (!evtFights.length) return null;
        return (
          <div key={evt.event} style={{marginBottom:24}}>
            <div style={{fontSize:9, color:"#d4a843", letterSpacing:2, textTransform:"uppercase", marginBottom:10, paddingBottom:6, borderBottom:"1px solid #1a1a1a"}}>
              {evt.event} · {evt.date}
            </div>
            {evtFights.map(f => {
              const key = f.f1 + "||" + f.f2;
              const v = preds[key];
              if (!v) return null;
              const isCorrect = v.actual && v.predicted === v.actual;
              const isWrong = v.actual && v.predicted !== v.actual;
              return (
                <div key={key} style={{background:"#0d0d0d", border:`1px solid ${isCorrect?"#1a3a1a":isWrong?"#3a1a1a":"#1a1a1a"}`,
                  borderRadius:9, padding:14, marginBottom:10}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12, color:"#e8e0d4", fontWeight:600}}>{f.f1} vs {f.f2}</div>
                      <div style={{fontSize:10, color:"#5a4a3a", marginTop:2}}>{f.weightClass}{f.isMain?" · ★ Main Event":""}</div>
                      <div style={{fontSize:10, color:"#d4a843", marginTop:4}}>
                        AI picked: <strong>{v.predicted}</strong> ({v.pct}% confidence)
                      </div>
                    </div>
                    <div style={{textAlign:"right", flexShrink:0}}>
                      {v.actual && (
                        <>
                          <div style={{fontSize:10, padding:"4px 10px", borderRadius:4, marginBottom:4,
                            background:isCorrect?"#0a1a0a":"#1a0a0a",
                            color:isCorrect?"#5ad45a":"#d45a5a",
                            border:`1px solid ${isCorrect?"#1a3a1a":"#3a1a1a"}`}}>
                            {isCorrect ? "✓ Correct" : "✗ Wrong"}
                          </div>
                          <div style={{fontSize:10, color:"#5a4a3a"}}>
                            {v.actual} won<br/>
                            <span style={{fontSize:9}}>{f.method} R{f.round} {f.time}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
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

export default function App(){
  const[mode,setMode]=useState("scheduled");
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

  const evtMeta=UPCOMING_EVENTS[selEvt];
  const fightMeta=evtMeta.fights[selFight];
  const f1=FIGHTER_DB[fightMeta.f1];
  const f2=FIGHTER_DB[fightMeta.f2];

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

  const tabs=[["scheduled","📅 Upcoming"],["fantasy","⚗️ Fantasy"],["accuracy","🏆 Results"]];

  return(
    <div style={{minHeight:"100vh",background:"#0a0a0f",fontFamily:"Georgia,serif",color:"#e8e0d4"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1a0a00,#0a0a0f 50%,#00001a)",borderBottom:"1px solid #1a1a1a",padding:"14px 22px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{fontSize:26}}>🥊</div>
        <div>
          <div style={{fontSize:17,fontWeight:700,letterSpacing:3,color:"#d4a843",textTransform:"uppercase"}}>UFC Fight Predictor</div>
          <div style={{fontSize:9,color:"#5a4a3a",letterSpacing:2,textTransform:"uppercase"}}>Style · Size · History · Wrestler Resilience · Opp. Quality · Speed</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:7}}>
          {tabs.map(([m,lbl])=>(
            <button key={m} onClick={()=>setMode(m)} style={{padding:"6px 14px",borderRadius:5,border:"1px solid",cursor:"pointer",fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",
              borderColor:mode===m?"#d4a843":"#2a2a2a",background:mode===m?"#d4a843":"transparent",color:mode===m?"#0a0a0f":"#5a4a3a"}}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* ACCURACY TAB */}
      {mode==="accuracy"&&<ResultsTab/>}

      {/* SCHEDULED TAB */}
      {mode==="scheduled"&&(
        <div style={{display:"flex",height:"calc(100vh - 65px)"}}>
          <div style={{width:255,flexShrink:0,borderRight:"1px solid #1a1a1a",overflowY:"auto",padding:"10px 0"}}>
            {UPCOMING_EVENTS.map((evt,ei)=>(
              <div key={ei}>
                <div style={{padding:"5px 12px",fontSize:9,color:"#d4a843",fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{evt.event.split(":")[0].split("—")[0].trim()}</div>
                <div style={{padding:"0 12px 7px",fontSize:9,color:"#3a2a1a"}}>{evt.date}</div>
                {evt.fights.map((f,fi)=>{
                  const act=selEvt===ei&&selFight===fi;
                  return(
                    <button key={fi} onClick={()=>{setSelEvt(ei);setSelFight(fi);setPred(null);}}
                      style={{width:"100%",padding:"8px 12px",background:act?"#15100a":"transparent",border:"none",borderLeft:`3px solid ${act?"#d4a843":"transparent"}`,cursor:"pointer",textAlign:"left"}}>
                      {f.isMain&&<div style={{fontSize:8,color:"#d4a843",letterSpacing:2,textTransform:"uppercase",marginBottom:1}}>★ Main Event</div>}
                      <div style={{fontSize:11,color:"#e8e0d4",fontWeight:600}}>{f.f1} vs {f.f2}</div>
                      <div style={{fontSize:9,color:"#4a3a2a",marginTop:1}}>{f.weightClass}</div>
                    </button>
                  );
                })}
                {ei<UPCOMING_EVENTS.length-1&&<div style={{margin:"6px 12px",borderTop:"1px solid #181818"}}/>}
              </div>
            ))}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"22px 22px"}}>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:"#d4a843",letterSpacing:2,textTransform:"uppercase",marginBottom:2}}>
                {fightMeta.isMain?"★ Main Event · ":""}{fightMeta.weightClass}
              </div>
              <div style={{fontSize:10,color:"#3a2a1a"}}>{evtMeta.date} · {evtMeta.venue}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 40px 1fr",gap:12,alignItems:"start",marginBottom:16}}>
              <FighterCard fighter={f1} idx={0}/>
              <div style={{textAlign:"center",fontSize:20,fontWeight:900,color:"#d4a843",paddingTop:24}}>VS</div>
              <FighterCard fighter={f2} idx={1}/>
            </div>
            <div style={{background:"#0d0d13",border:"1px solid #1a1a2a",borderRadius:7,padding:"10px 14px",marginBottom:18,fontSize:11,color:"#6a6a8a",lineHeight:1.6}}>
              📋 {fightMeta.context}
            </div>
            {!pred?(
              <div style={{textAlign:"center",marginBottom:24}}>
                <button onClick={analyze} style={{padding:"12px 38px",background:"linear-gradient(135deg,#d4a843,#a87820)",border:"none",borderRadius:7,color:"#0a0a0f",fontSize:13,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",boxShadow:"0 4px 20px rgba(212,168,67,0.25)"}}>
                  ⚡ Analyze & Predict
                </button>
              </div>
            ):(
              <>
                <ResultPanel pred={pred} f1={f1} f2={f2}/>
                <div style={{textAlign:"center",marginTop:12,display:"flex",gap:8,justifyContent:"center"}}>
                  <button onClick={()=>setPred(null)} style={{padding:"7px 22px",background:"transparent",border:"1px solid #2a2a2a",borderRadius:5,color:"#4a3a2a",fontSize:10,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>↺ Reset</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* FANTASY TAB */}
      {mode==="fantasy"&&(
        <div style={{display:"flex",height:"calc(100vh - 65px)"}}>
          <div style={{width:400,flexShrink:0,borderRight:"1px solid #1a1a1a",overflowY:"auto",padding:14}}>
            <div style={{fontSize:9,color:"#5a4a3a",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>⚗️ Build Your Fantasy Matchup</div>
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {[["red","🔴 Fighter 1",true],["blue","🔵 Fighter 2",false]].map(([col,lbl,isF1])=>(
                <button key={col} onClick={()=>setEditF1(isF1)} style={{flex:1,padding:"7px",borderRadius:5,border:"1px solid",
                  borderColor:(isF1?editingF1:!editingF1)?(isF1?"#d4a843":"#6a8ad4"):"#2a2a2a",
                  background:(isF1?editingF1:!editingF1)?(isF1?"#1a1000":"#00001a"):"transparent",
                  color:(isF1?editingF1:!editingF1)?(isF1?"#d4a843":"#6a8ad4"):"#4a4a4a",cursor:"pointer",fontSize:10,fontWeight:700}}>
                  {lbl}
                </button>
              ))}
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:9,color:"#3a3a3a",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Load a real fighter</div>
              <select value={editingF1?f1src:f2src} onChange={e=>loadDB(editingF1?1:2,e.target.value)}
                style={{width:"100%",background:"#0a0a0a",border:"1px solid #2a2a2a",borderRadius:5,padding:"7px 8px",color:"#e8e0d4",fontSize:12}}>
                <option value="custom">— Custom Fighter —</option>
                {FIGHTER_NAMES.map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {editingF1
              ?<FighterEditor fighter={fantasyF1} color="gold" update={updF1} label="🔴 Fighter 1"/>
              :<FighterEditor fighter={fantasyF2} color="blue" update={updF2} label="🔵 Fighter 2"/>}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"22px 22px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 40px 1fr",gap:12,alignItems:"center",marginBottom:16}}>
              {[fantasyF1,fantasyF2].map((fighter,idx)=>(
                <React.Fragment key={idx}>
                  {idx===1&&<div style={{textAlign:"center",fontSize:20,fontWeight:900,color:"#d4a843"}}>VS</div>}
                  <div style={{background:idx===0?"linear-gradient(135deg,#1a1000,#110800)":"linear-gradient(135deg,#00001a,#08001a)",
                    border:`1px solid ${idx===0?"#2a1a0a":"#0a0a2a"}`,borderRadius:10,padding:16}}>
                    <div style={{fontSize:15,fontWeight:700,color:"#e8e0d4",marginBottom:2}}>{fighter.name||`Fighter ${idx+1}`}</div>
                    <div style={{fontSize:10,color:idx===0?"#d4a843":"#6a8ad4",marginBottom:8}}>{fighter.style} · {fighter.reach}" · Age {fighter.age} · {fighter.naturalWeight}lbs</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
                      {[["SLpM",fighter.stats.slpm],["Fin%",fighter.stats.finishRate+"%"],["TDavg",fighter.stats.tdavg],["Str%",fighter.stats.stracc+"%"],["TDdef",fighter.stats.tddef+"%"],["Sub",fighter.stats.subavg]].map(([k,v])=>(
                        <div key={k} style={{background:idx===0?"#0d0800":"#080013",borderRadius:4,padding:"4px 6px",textAlign:"center"}}>
                          <div style={{fontSize:8,color:idx===0?"#3a2a1a":"#1a1a3a",textTransform:"uppercase",letterSpacing:1}}>{k}</div>
                          <div style={{fontSize:11,fontWeight:700,color:idx===0?"#d4a843":"#6a8ad4"}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:7,fontSize:10,color:"#3a3a3a"}}>
                      WR: {fighter.wrestlerResilience}/10 · Opp.Q: {fighter.opponentQuality}/100
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
            {!fantasyPred?(
              <div style={{textAlign:"center",marginBottom:24}}>
                <button onClick={analyzeFantasy} disabled={!fantasyF1.name||!fantasyF2.name}
                  style={{padding:"12px 38px",background:"linear-gradient(135deg,#d4a843,#a87820)",border:"none",borderRadius:7,color:"#0a0a0f",fontSize:13,fontWeight:700,letterSpacing:2,textTransform:"uppercase",cursor:"pointer",
                    boxShadow:"0 4px 20px rgba(212,168,67,0.25)",opacity:(!fantasyF1.name||!fantasyF2.name)?0.4:1}}>
                  ⚡ Run Fantasy Prediction
                </button>
                <div style={{marginTop:7,fontSize:10,color:"#2a2a2a"}}>Considers style · size · reach · wrestler resilience · opp. quality · speed handling</div>
              </div>
            ):(
              <>
                <ResultPanel pred={fantasyPred} f1={fantasyF1} f2={fantasyF2}/>
                <div style={{textAlign:"center",marginTop:12,display:"flex",gap:8,justifyContent:"center"}}>
                  <button onClick={()=>setFantasyPred(null)} style={{padding:"7px 22px",background:"transparent",border:"1px solid #2a2a2a",borderRadius:5,color:"#4a3a2a",fontSize:10,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>↺ Reset</button>
                  <button onClick={()=>setShowShare(true)} style={{padding:"7px 22px",background:"#1a1000",border:"1px solid #d4a843",borderRadius:5,color:"#d4a843",fontSize:10,letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>📤 Share Card</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showShare&&fantasyPred&&<ShareCard pred={fantasyPred} f1={fantasyF1} f2={fantasyF2} onClose={()=>setShowShare(false)}/>}

      <style>{`::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0a0a0f}::-webkit-scrollbar-thumb{background:#2a1a0a;border-radius:3px}input[type=range]{height:4px}select option{background:#111}`}</style>
    </div>
  );
}
