/* ============================================================
 * Agent 学习机 · app.js
 * 交互式学习引擎：闯关地图 / 知识卡片 / 答题解锁 / 积分存档
 * 数据源：course.json（由 build_course.js 从19章markdown生成）
 * ============================================================ */
(function () {
  'use strict';

  var STORE_KEY = 'agentcraft_learn_v1';
  var PASS_RATE = 0.8;           // 闯关通过率（80% = 5题对4题）
  var PT_PASS = 20;              // 每章闯关通过基础积分
  var PT_PERFECT = 10;          // 满分额外奖励
  var PT_CARD = 1;              // 每读完一张卡片积分

  var course = null;
  var flatChapters = [];         // 扁平章节序列（含 partId）
  var state = null;
  var el = document.getElementById('view');

  // ---------- 存档 ----------
  function loadState() {
    var def = { done: {}, cardsRead: {}, points: 0, badges: [], streak: 0, lastDay: null, freeRoam: false };
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && typeof s === 'object') return Object.assign(def, s);
    } catch (e) {}
    return def;
  }
  function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function touchStreak() {
    var t = todayStr();
    if (state.lastDay === t) return;
    var y = new Date(); y.setDate(y.getDate() - 1);
    var ystr = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate();
    state.streak = (state.lastDay === ystr) ? (state.streak + 1) : 1;
    state.lastDay = t;
    saveState();
  }

  // ---------- 工具 ----------
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function chapterIndex(id){ for(var i=0;i<flatChapters.length;i++){ if(flatChapters[i].id===id) return i; } return -1; }
  function isDone(id){ return !!state.done[id]; }
  function isUnlocked(id){
    if (state.freeRoam) return true;
    var i = chapterIndex(id);
    if (i <= 0) return true;                 // 第一章永远解锁
    return isDone(flatChapters[i-1].id);     // 上一章通过则解锁
  }
  function partProgress(part){
    var done=0; part.chapters.forEach(function(c){ if(isDone(c.id)) done++; });
    return { done: done, total: part.chapters.length, pct: Math.round(done/part.chapters.length*100) };
  }
  function overallPct(){
    var d=0; flatChapters.forEach(function(c){ if(isDone(c.id)) d++; });
    return { done:d, total:flatChapters.length, pct: Math.round(d/flatChapters.length*100) };
  }

  // ---------- markdown 渲染（含 mermaid 修正）----------
  var mmId = 0;
  function renderMD(md){
    var html = marked.parse(md, { gfm:true, breaks:false });
    // 把 ```mermaid 代码块转成 div.mermaid
    var tmp = document.createElement('div'); tmp.innerHTML = html;
    tmp.querySelectorAll('code.language-mermaid').forEach(function(code){
      var pre = code.closest('pre');
      var div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = code.textContent;
      if (pre && pre.parentNode) pre.parentNode.replaceChild(div, pre);
    });
    // 任务清单样式
    tmp.querySelectorAll('li').forEach(function(li){
      if (li.querySelector('input[type=checkbox]')) li.classList.add('task-list-item');
    });
    return tmp.innerHTML;
  }
  function runMermaid(container){
    if (!window.mermaid) return;
    var nodes = container.querySelectorAll('.mermaid');
    if (!nodes.length) return;
    nodes.forEach(function(n){ n.id = 'mm-' + (++mmId); n.removeAttribute('data-processed'); });
    try { mermaid.run({ nodes: nodes }); } catch(e){ try{ mermaid.init(undefined, nodes); }catch(e2){} }
  }

  // ---------- 头部积分/连击 ----------
  function syncHeader(){
    document.querySelector('#pillPoints b').textContent = state.points;
    document.querySelector('#pillStreak b').textContent = state.streak;
  }

  // ---------- 提示 ----------
  var toastTimer=null;
  function toast(msg){
    var t=document.getElementById('toast'); t.innerHTML=msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer=setTimeout(function(){t.classList.remove('show');},2200);
  }
  function confetti(){
    var box=document.getElementById('confetti'); box.innerHTML='';
    var colors=['#5b6cf5','#a855f7','#34d399','#fbbf24','#f87171','#60a5fa'];
    for(var i=0;i<80;i++){
      var s=document.createElement('i');
      s.style.left=Math.random()*100+'vw';
      s.style.background=colors[i%colors.length];
      s.style.animationDuration=(1.6+Math.random()*1.6)+'s';
      s.style.animationDelay=(Math.random()*0.4)+'s';
      s.style.transform='rotate('+(Math.random()*360)+'deg)';
      if(Math.random()>.5) s.style.borderRadius='50%';
      box.appendChild(s);
    }
    setTimeout(function(){box.innerHTML='';},3600);
  }

  // ========================================================
  //  视图：首页（闯关地图）
  // ========================================================
  function renderHome(){
    var ov = overallPct();
    var badgeDefs = course.parts.map(function(p){ return { id:p.id, label:p.title.split('·')[1] ? p.title.split('·')[1].trim() : p.title }; });

    var html = ''
    + '<div class="view">'
    + '<div class="hero">'
    +   '<h1>'+esc(course.title)+'</h1>'
    +   '<p>'+esc(course.subtitle)+' —— 像学习机一样，一张卡一张卡地学，答题闯关解锁下一章。</p>'
    +   '<div class="author">'+esc(course.author)+'</div>'
    + '</div>'

    + '<div class="stats">'
    +   '<div class="statcard ringcard"><div class="ring" style="--p:'+ov.pct+'"><b>'+ov.pct+'%</b></div>'
    +     '<div><div class="k">总进度</div><div class="v">'+ov.done+'<small>/'+ov.total+' 章</small></div></div></div>'
    +   '<div class="statcard"><div><div class="k">学习积分</div><div class="v">'+state.points+'<small> ⭐</small></div></div></div>'
    +   '<div class="statcard"><div><div class="k">连续学习</div><div class="v">'+state.streak+'<small> 天 🔥</small></div></div></div>'
    +   '<div class="statcard"><div><div class="k">获得徽章</div><div class="v">'+state.badges.length+'<small>/'+course.parts.length+' 🏅</small></div></div></div>'
    + '</div>';

    // 徽章行
    html += '<div class="sec-title">成就徽章</div><div class="badges" style="margin-bottom:24px">';
    badgeDefs.forEach(function(b){
      var got = state.badges.indexOf(b.id)>=0;
      html += '<div class="bdg'+(got?' got':'')+'"><span class="bi">'+(got?'🏅':'🔒')+'</span>'+esc(b.label)+'</div>';
    });
    html += '</div>';

    html += '<div class="sec-title">课程闯关地图 · 5 个篇章 '+course.stats.chapters+' 章</div>';

    // 各 Part
    course.parts.forEach(function(p){
      var pr = partProgress(p);
      html += '<div class="part">'
        + '<div class="part-head">'
        +   '<img class="part-cover" src="'+esc(p.cover)+'" alt="" onerror="this.style.display=\'none\'"/>'
        +   '<div class="part-meta"><h3>'+esc(p.title)+'</h3><p>'+esc(p.tagline)+'</p>'
        +     '<div class="part-prog"><div class="bar"><i style="width:'+pr.pct+'%"></i></div><span>'+pr.done+'/'+pr.total+'</span></div>'
        +   '</div>'
        + '</div>'
        + '<div class="chapters">';
      p.chapters.forEach(function(c){
        var done=isDone(c.id), unlocked=isUnlocked(c.id);
        var cls = done?'done':(unlocked?(chapterIndex(c.id)===firstUndoneIndex()?'cur':''):'locked');
        var st = done?'✅':(unlocked?'▶':'🔒');
        var scoreTxt = done ? ('已通过 · '+state.done[c.id].score+'/'+c.quiz.length) : (c.quiz.length+' 卡 · '+c.quiz.length+' 题');
        var cardCnt = c.cards.length;
        html += '<button class="chip '+cls+'" data-ch="'+c.id+'"'+(unlocked?'':' disabled')+'>'
          + '<span class="num">'+esc(c.num)+'</span>'
          + '<span class="t"><b>'+esc(c.title)+'</b><small>'+cardCnt+' 张卡片 · '+c.quiz.length+' 道题'+(done?' · 已通过':'')+'</small></span>'
          + '<span class="st">'+st+'</span>'
          + '</button>';
      });
      html += '</div></div>';
    });

    // 设置：自由浏览
    html += '<div class="footnote">'
      + '<label style="cursor:pointer"><input type="checkbox" id="freeRoam" '+(state.freeRoam?'checked':'')+' style="accent-color:var(--brand);vertical-align:-2px"/> 自由浏览模式（关闭闯关解锁限制，任意章节都可直接学）</label><br/>'
      + '本学习机内容与 <a href="../book.html#/" >电子书</a> 完全同步 · <a href="#" id="resetBtn">重置学习进度</a>'
      + '</div>';

    html += '</div>';
    el.innerHTML = html;

    // 绑定
    el.querySelectorAll('.chip:not(.locked)').forEach(function(btn){
      btn.addEventListener('click', function(){ openChapter(btn.getAttribute('data-ch')); });
    });
    var fr = document.getElementById('freeRoam');
    if (fr) fr.addEventListener('change', function(){ state.freeRoam=fr.checked; saveState(); renderHome(); });
    var rb = document.getElementById('resetBtn');
    if (rb) rb.addEventListener('click', function(e){ e.preventDefault(); if(confirm('确定重置全部学习进度、积分和徽章？此操作不可撤销。')){ localStorage.removeItem(STORE_KEY); state=loadState(); syncHeader(); renderHome(); toast('已重置进度'); } });

    window.scrollTo(0,0);
  }

  function firstUndoneIndex(){
    for(var i=0;i<flatChapters.length;i++){ if(!isDone(flatChapters[i].id)) return i; }
    return -1;
  }

  // ========================================================
  //  视图：章节（知识卡片逐张学）
  // ========================================================
  var cur = null; // {chapter, idx}
  function openChapter(chId){
    var ch = flatChapters[chapterIndex(chId)];
    if (!ch) return;
    cur = { chapter: ch, idx: 0 };
    renderCard();
  }

  function renderCard(){
    var ch = cur.chapter, i = cur.idx, total = ch.cards.length;
    var card = ch.cards[i];
    var last = (i === total - 1);

    var html = ''
    + '<div class="view">'
    + '<div class="cbar">'
    +   '<button class="back" id="toHome">← 地图</button>'
    +   '<div class="ctitle">'+esc(ch.num)+' · '+esc(ch.title)+'</div>'
    +   '<div class="cidx">卡片 '+(i+1)+'/'+total+'</div>'
    + '</div>'
    + '<div class="pbar"><i style="width:'+((i+1)/total*100)+'%"></i></div>'
    + '<div class="card" id="cardBox">'
    +   '<div class="kicker">知识卡片 '+(i+1)+' / '+total+'</div>'
    +   (card.heading ? '<h2 class="chd">'+esc(card.heading)+'</h2>' : '')
    +   '<div class="md">'+renderMD(card.md)+'</div>'
    + '</div>'
    + '<div class="cnav">'
    +   '<button class="btn btn-ghost" id="prevBtn"'+(i===0?' disabled':'')+'>← 上一张</button>'
    +   (last
        ? '<button class="btn btn-primary" id="nextBtn">'+(ch.quiz.length?'开始闯关测验 🎯':'完成本章 ✅')+'</button>'
        : '<button class="btn btn-primary" id="nextBtn">下一张 →</button>')
    + '</div>'
    + '</div>';
    el.innerHTML = html;

    var box = document.getElementById('cardBox');
    runMermaid(box);

    // 记录读过的卡片（首次读 +积分）
    var readKey = ch.id + ':' + i;
    if (!state.cardsRead[readKey]) { state.cardsRead[readKey] = 1; state.points += PT_CARD; saveState(); syncHeader(); }

    document.getElementById('toHome').addEventListener('click', renderHome);
    document.getElementById('prevBtn').addEventListener('click', function(){ if(cur.idx>0){cur.idx--;renderCard();} });
    document.getElementById('nextBtn').addEventListener('click', function(){
      if (last) { if(ch.quiz.length) startQuiz(ch); else finishChapter(ch, 0, 0, true); }
      else { cur.idx++; renderCard(); }
    });
    window.scrollTo(0,0);
  }

  // ========================================================
  //  视图：闯关测验
  // ========================================================
  var quiz = null; // {chapter, qi, correct, chosen[]}
  function startQuiz(ch){
    quiz = { chapter: ch, qi: 0, correct: 0, chosen: [] };
    renderQuiz();
  }

  function renderQuiz(){
    var ch = quiz.chapter, q = ch.quiz[quiz.qi], total = ch.quiz.length;
    var html = ''
    + '<div class="view">'
    + '<div class="cbar"><button class="back" id="toHome2">← 地图</button>'
    +   '<div class="ctitle">🎯 闯关测验 · '+esc(ch.title)+'</div></div>'
    + '<div class="pbar"><i style="width:'+((quiz.qi)/total*100)+'%"></i></div>'
    + '<div class="qcard">'
    +   '<div class="qmeta"><span>第 '+(quiz.qi+1)+' / '+total+' 题</span><span>本章通过线：'+Math.ceil(total*PASS_RATE)+'/'+total+'</span></div>'
    +   '<div class="qtext">'+esc(q.q).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')+'</div>'
    +   '<div class="opts" id="opts">';
    q.options.forEach(function(o){
      html += '<button class="opt" data-k="'+o.key+'"><span class="key">'+o.key+'</span><span class="otext">'+esc(o.text)+'</span></button>';
    });
    html += '</div>'
    +   '<div class="feedback" id="fb"></div>'
    +   '<div class="cnav" id="qnav" style="display:none">'
    +     '<button class="btn btn-primary" id="qnext">'+(quiz.qi===total-1?'查看成绩 🏁':'下一题 →')+'</button>'
    +   '</div>'
    + '</div>'
    + '</div>';
    el.innerHTML = html;

    document.getElementById('toHome2').addEventListener('click', function(){
      if(confirm('退出后本次答题进度不保存，确定返回？')) renderHome();
    });

    var answered = false;
    el.querySelectorAll('.opt').forEach(function(btn){
      btn.addEventListener('click', function(){
        if (answered) return; answered = true;
        var k = btn.getAttribute('data-k');
        var right = q.answer;
        quiz.chosen.push(k);
        el.querySelectorAll('.opt').forEach(function(b){
          b.disabled = true;
          var bk=b.getAttribute('data-k');
          if (bk===right) b.classList.add('correct');
          if (bk===k && k!==right) b.classList.add('wrong');
        });
        var fb = document.getElementById('fb');
        if (k===right){ quiz.correct++; fb.className='feedback ok show'; fb.textContent='✅ 回答正确！'; }
        else { fb.className='feedback bad show'; fb.textContent='❌ 正确答案是 '+right+'。'; }
        document.getElementById('qnav').style.display='flex';
      });
    });
    document.getElementById('qnext') && document.getElementById('qnext').addEventListener('click', function(){
      if (quiz.qi === total-1) showResult();
      else { quiz.qi++; renderQuiz(); }
    });
    window.scrollTo(0,0);
  }

  function showResult(){
    var ch = quiz.chapter, total = ch.quiz.length, correct = quiz.correct;
    var pct = Math.round(correct/total*100);
    var pass = correct >= Math.ceil(total*PASS_RATE);
    var perfect = correct === total;

    // 计分/解锁（仅首次通过给分）
    var firstPass = pass && !isDone(ch.id);
    var gained = 0;
    if (firstPass){
      gained = PT_PASS + (perfect?PT_PERFECT:0);
      state.points += gained;
      finishChapter(ch, correct, total, false);
    } else if (pass && isDone(ch.id)){
      // 复习通过，更新最高分
      if (correct > state.done[ch.id].score){ state.done[ch.id].score = correct; saveState(); }
    }

    var emoji = perfect?'🏆':(pass?'🎉':'💪');
    var head = perfect?'满分通关！':(pass?'闯关成功！':'再接再厉');
    var msg = pass
      ? (perfect?'完美！这一章你已经完全掌握了。':'不错，达到通过线，下一章已为你解锁。')
      : ('还差一点，答对 '+Math.ceil(total*PASS_RATE)+' 题即可通过，回顾一下卡片再来试试。');

    var html = ''
    + '<div class="view"><div class="result">'
    +   '<div class="emoji">'+emoji+'</div>'
    +   '<h2>'+head+'</h2>'
    +   '<div class="score">'+correct+'/'+total+'</div>'
    +   '<p>正确率 '+pct+'%</p>'
    +   (firstPass?'<div class="reward">⭐ +'+gained+' 积分'+(perfect?'（含满分奖励）':'')+'</div>':'')
    +   '<div class="btns">';
    if (!pass){
      html += '<button class="btn btn-ghost" id="rHome">返回地图</button>'
        + '<button class="btn btn-primary" id="rRetry">🔄 重新闯关</button>';
    } else {
      var ni = chapterIndex(ch.id)+1;
      var nxt = flatChapters[ni];
      html += '<button class="btn btn-ghost" id="rHome">返回地图</button>';
      if (nxt) html += '<button class="btn btn-primary" id="rNext">下一章：'+esc(nxt.num)+' '+esc(nxt.title.slice(0,12))+(nxt.title.length>12?'…':'')+' →</button>';
      else html += '<button class="btn btn-primary" id="rHome2">🎓 全部完成，返回地图</button>';
    }
    html += '</div></div></div>';
    el.innerHTML = html;

    if (pass) confetti();
    if (firstPass){
      // Part 徽章检查
      checkBadges();
      toast('⭐ 获得 '+gained+' 积分');
    }

    var rHome=document.getElementById('rHome'); if(rHome) rHome.addEventListener('click',renderHome);
    var rHome2=document.getElementById('rHome2'); if(rHome2) rHome2.addEventListener('click',renderHome);
    var rRetry=document.getElementById('rRetry'); if(rRetry) rRetry.addEventListener('click',function(){startQuiz(ch);});
    var rNext=document.getElementById('rNext'); if(rNext) rNext.addEventListener('click',function(){ openChapter(flatChapters[chapterIndex(ch.id)+1].id); });
    syncHeader();
    window.scrollTo(0,0);
  }

  function finishChapter(ch, correct, total, noQuiz){
    state.done[ch.id] = { score: correct, total: total, ts: Date.now(), noQuiz: !!noQuiz };
    saveState();
    if (noQuiz){ toast('✅ 已完成本章'); checkBadges(); }
  }

  function checkBadges(){
    course.parts.forEach(function(p){
      if (state.badges.indexOf(p.id)>=0) return;
      var all = p.chapters.every(function(c){ return isDone(c.id); });
      if (all){
        state.badges.push(p.id); saveState();
        setTimeout(function(){ confetti(); toast('🏅 解锁徽章：'+p.title); }, 400);
      }
    });
  }

  // ---------- 键盘 ----------
  document.addEventListener('keydown', function(e){
    if (cur && el.querySelector('#cardBox')){
      if (e.key==='ArrowRight'){ var n=document.getElementById('nextBtn'); if(n) n.click(); }
      if (e.key==='ArrowLeft'){ var p=document.getElementById('prevBtn'); if(p&&!p.disabled) p.click(); }
    }
  });

  // ---------- 启动 ----------
  function boot(){
    state = loadState();
    touchStreak();
    syncHeader();
    document.getElementById('btnBook').addEventListener('click', function(){ location.href='../book.html#/'; });

    if (window.mermaid) mermaid.initialize({ startOnLoad:false, theme:'default', securityLevel:'loose', flowchart:{htmlLabels:true} });

    fetch('./course.json?t=' + Date.now()).then(function(r){ return r.json(); }).then(function(data){
      course = data;
      flatChapters = [];
      course.parts.forEach(function(p){ p.chapters.forEach(function(c){ c.partId=p.id; flatChapters.push(c); }); });
      renderHome();
    }).catch(function(err){
      el.innerHTML = '<div class="view"><div class="card"><h2 class="chd">课程数据加载失败</h2><div class="md"><p>请确认 <code>course.json</code> 与本页面在同一目录，并通过 http(s) 访问（本地直接双击打开可能因浏览器安全策略无法读取）。</p><p style="color:var(--bad)">'+esc(String(err))+'</p></div></div></div>';
    });
  }
  boot();
})();
