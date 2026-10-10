import fs from 'node:fs';
const configs = [
  {n:75, yt:'T6i7ycD2wHI', folder:'75 Friday Sermon 5 Nov 1982', date:'1982-11-05', legacy:'30', author:'Dean Majul; Dr. Rashad Khalifa', title:'Quranic Interpretation, Adam and Eve, and Salvation (Dean Majul & Rashad)', description:'Dean Majul presents a method for interpreting the Quran through its own verses, warning against overreliance on Biblical accounts and Hadith. He applies this method to Adam and Eve, their garments, and the garment of righteousness, then discusses Sura 95 in relation to Sura 3:33. A discussion follows on translation and allegory. Dr. Rashad Khalifa then leads a study of Sura 2:62 and 3:113–115, discussing salvation, belief in God alone, and righteous Jews and Christians.', chapters:[[1.664,'Call to prayer'],[33.327,'Dean Majul: interpreting the Quran through the Quran'],[331,'Biblical accounts and the limits of comparison'],[614.242,'Hadith, clear verses, and allegories'],[790.427,'Adam and Eve: nakedness and the garden'],[1213.256,'The garment of righteousness in Sura 7:26'],[1676.934,'Sura 95 and the messengers in Sura 3:33'],[2140,'Closing supplications'],[2172.224,'Discussion of garments, allegory, and translation'],[2617.079,'Sura 2:62: minimum requirements for salvation'],[2751.136,'Belief in God alone and Christian beliefs'],[2968.885,'Righteous Jews and Christians: Sura 3:113–115']]},
  {n:76, yt:'NENqO1HkG-I', folder:'76 Friday Sermon 7 Jan 1983', date:'1983-01-07', legacy:'31', author:'Dr. Rashad Khalifa', title:'Marriage, Dowry, Divorce, and Reconciliation (Rashad)', description:'An unidentified man opens with remarks on Satan, division among believers, and the scriptures’ call to worship one God. The recording then shifts to Dr. Rashad Khalifa answering questions on dowry, pregnancy after divorce, verbal declarations of divorce, reconciliation, and waiting periods. Diana asks about Sura 2:228, and Abdullah asks about repeated divorce and remarriage. Khalifa discusses dowry practices and concludes by urging sincere observance of Quranic commandments rather than attempts to evade them.', chapters:[[0,'Satan, division, and the scriptures'],[117.427,'Dowry before marriage'],[148.935,'Diana asks about pregnancy and reconciliation: Sura 2:228'],[204.132,'Verbal divorce and Abdullah’s question'],[290.513,'Waiting periods and physical separation'],[379,'Widows and mourning'],[408.126,'Dowry: value, agreement, and regional practices'],[632.27,'Questions about widows'],[674.867,'Repeated divorce and remarriage'],[811.525,'Waiting periods after a spouse’s death'],[880.311,'Following commandments with conviction']]}
];
const stamp = seconds => {const ms=Math.round(seconds*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`;};
const quote = x => `"${String(x??'').replaceAll('"','""')}"`;
const catalog=JSON.parse(fs.readFileSync('data/catalog/audios.json','utf8'));
for(const c of configs){
 const info=JSON.parse(fs.readFileSync(`output/messenger-75-76/${c.yt}.info.json`));
 const raw=JSON.parse(fs.readFileSync(`output/messenger-75-76/${c.yt}.en-US.json3`));
 let speaker='';
 const cues=raw.events.filter(e=>e.segs).map(e=>{
  const text=e.segs.map(s=>s.utf8).join('');
  const m=/^(Dean Majul|Dr\. Khalifa|A man|A woman|Audience|Maryam|Diana|Abdullah):/.exec(text);
  if(m) speaker=m[1];
  // The sermon resumes immediately after Khalifa's brief "Yes".
  if(c.n===75 && e.tStartMs>=2016907 && e.tStartMs<2156825) speaker='Dean Majul';
  let assigned=speaker;
  // Keep generic source labels; "Debbie's question" identifies a question,
  // but does not establish every female voice throughout the exchange.
  return {start:e.tStartMs/1000,end:(e.tStartMs+e.dDurationMs)/1000,text,speaker:assigned};
 });
 const chapters=c.chapters.map(([target,title])=>{const cue=cues.reduce((a,b)=>Math.abs(b.start-target)<Math.abs(a.start-target)?b:a); return {cue,title};});
 const csv=[['Video Title','Link','Start Time','End Time','Text','Speaker','Description','TOC Time','TOC Title'].map(quote).join(',')];
 cues.forEach((cue,i)=>{const chapter=chapters.find(ch=>ch.cue===cue);csv.push([`MA ${c.n} - Friday Sermon (${c.date})`,`https://www.youtube.com/watch?v=${c.yt}`,stamp(cue.start),stamp(cue.end),cue.text,cue.speaker,i===0?c.description:'',chapter?stamp(cue.start):'',chapter?.title??''].map(quote).join(','));});
 fs.writeFileSync(`data/sources/playlists/audio-transcripts/MA ${c.n} - Messenger Audio.csv`,csv.join('\n')+'\n');
 fs.writeFileSync(`public/content/audios/messenger-audios/MA${c.n}.en-US.vtt`,'WEBVTT\n\n'+cues.map((cue,i)=>`${i+1}\n${stamp(cue.start)} --> ${stamp(cue.end)}\n${cue.text}\n`).join('\n'));
 const title=`Messenger Audio ${c.n} — Friday Sermon — ${c.title}`;
 const item={id:`messenger-audio/${c.folder}`,title,displayTitle:title,type:'messenger-audio',author:c.author,thumbnailOverride:'/content/audios/messenger-audios/default.jpg',folder:c.folder,vttFile:`MA${c.n}.en-US.vtt`,primaryNumber:c.n,alternateNumbers:[c.legacy],alternateNumberLabel:`Legacy ${c.legacy}`,youtubeId:c.yt,youtubeUrl:`https://www.youtube.com/watch?v=${c.yt}`,youtubeStartTime:0,duration_seconds:info.duration,description:c.description,fullDate:c.date,year:Number(c.date.slice(0,4)),date:`${c.date.slice(5,7)}/${c.date.slice(8)}/${c.date.slice(0,4)}`,chapters:chapters.map((ch,i)=>({id:i+1,startTime:ch.cue.start,...(chapters[i+1]?{endTime:chapters[i+1].cue.start}:{}),title:ch.title,speaker:ch.cue.speaker}))};
 const idx=catalog.findIndex(x=>x.youtubeId===c.yt);if(idx>=0)catalog[idx]=item;else catalog.push(item);
 console.log(`MA${c.n}: ${cues.length} cues, ${chapters.length} chapters, speakers: ${[...new Set(cues.map(x=>x.speaker))].join(', ')}`);
}
fs.writeFileSync('data/catalog/audios.json',JSON.stringify(catalog,null,2)+'\n');
