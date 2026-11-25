// Extend the core study views while keeping the saved quiz available after refresh.
try { quiz=JSON.parse(sessionStorage.getItem('activeQuiz')||'null'); } catch (_) { quiz=null; }
const originalRender=render;
render=function(){
  if(location.pathname==='/upload') history.replaceState({},'', '/modules');
  originalRender();
  if(location.pathname==='/'){
    let intro=app.querySelector('.hero p'); if(intro) intro.textContent='Explore your lessons, conquer quizzes, and master every module. One step closer to the summit!';
  }
  app.querySelectorAll('.stat span').forEach(el=>{if(el.textContent==='Uploaded modules') el.textContent='Available modules';});
  app.querySelectorAll('a[href="/upload"]').forEach(el=>{el.replaceWith(document.createTextNode('Your lesson files are not available. Check the local project folder.'));});
  if(!state.modules.length){app.querySelectorAll('p, .stack').forEach(el=>{if(el.textContent.trim()==='Upload lessons to begin.'||el.textContent.trim()==='Upload lessons to get started.') el.textContent='No lessons are available. Check the local project folder.';});}
  if(quiz) sessionStorage.setItem('activeQuiz',JSON.stringify(quiz));
  if(location.pathname==='/quiz/setup'){
    let loading=document.querySelector('#loading');
    if(loading){let extra=document.createElement('div');extra.innerHTML=`<label class="form-label"><input type="checkbox" id="online" ${state.searchConfigured?'':'disabled'}> Include online research ${state.searchConfigured?'':'(unavailable: configure search key)'}</label><label class="form-label"><input type="checkbox" id="shuffle" checked> Shuffle questions</label>`;loading.before(extra);}
  }
  if(location.pathname==='/quiz/play' && quiz){
    let a=quiz.answers[quiz.index],q=quiz.questions[quiz.index],feedback=document.querySelector('.feedback');
    if(a && feedback && !a.correct && Array.isArray(q.incorrectAnswerExplanations) && q.incorrectAnswerExplanations[a.selected]){let p=document.createElement('p');p.textContent='Your choice: '+q.incorrectAnswerExplanations[a.selected];feedback.append(p);}
    if(feedback && q.sourceReference){let p=document.createElement('p');p.className='small muted';p.textContent='Source: '+q.sourceReference;feedback.append(p);}
    if(quiz.index>0){let b=document.createElement('button');b.className='button secondary';b.textContent='← PREVIOUS ANSWER';b.onclick=()=>{quiz.index--;render()};app.append(b)}
  }
  if(location.pathname.startsWith('/reviewer') && document.querySelector('#reviewContent')){
    let content=document.querySelector('#reviewContent'), controls=document.createElement('div');controls.className='row no-print';controls.innerHTML='<input id="reviewSearch" placeholder="Search this reviewer" aria-label="Search reviewer" style="max-width:260px"><button class="button secondary" id="downloadNotes">DOWNLOAD NOTES</button><a class="button secondary" href="/quiz/setup">QUIZ THIS MODULE</a>';content.before(controls);
    let selectedId=decodeURIComponent(location.pathname.split('/')[2]||state.modules[0]?.id||'');
    controls.querySelector('a').onclick=(e)=>{e.preventDefault();go('/quiz/setup');document.querySelectorAll('.modcheck').forEach(x=>x.checked=x.value===selectedId);};
    controls.querySelector('#reviewSearch').oninput=e=>{let term=e.target.value.toLowerCase();content.querySelectorAll('details').forEach(d=>d.hidden=term&&!d.textContent.toLowerCase().includes(term));};
    controls.querySelector('#downloadNotes').onclick=()=>{let blob=new Blob([content.innerText],{type:'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='reviewer-notes.txt';a.click();URL.revokeObjectURL(url)};
  }
};
startQuiz=async function(){
  let ids=[...document.querySelectorAll('.modcheck:checked')].map(x=>x.value),count=+document.querySelector('#count').value,loading=document.querySelector('#loading');
  loading.textContent='Generating questions. This may take a moment…';
  try{let r=await api('quiz',{ids,count,difficulty:document.querySelector('#difficulty').value,kind:document.querySelector('#kind').value,online:document.querySelector('#online').checked});
    if(!r.questions.length)throw Error('No valid new questions were generated. Try again or add more lesson material.');
    if(document.querySelector('#shuffle').checked)for(let i=r.questions.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[r.questions[i],r.questions[j]]=[r.questions[j],r.questions[i]]}
    quiz={id:crypto.randomUUID(),started:Math.floor(Date.now()/1000),questions:r.questions,answers:[],index:0};
    if(r.questions.length<count)toast(`Generated ${r.questions.length} distinct questions; fewer than requested.`);go('/quiz/play');
  }catch(e){loading.textContent=e.message;}
};
