import pathlib, re

html = pathlib.Path('personaje.html').read_text(encoding='utf-8')

# Remove textarea and example buttons section
html = re.sub(r'<textarea[^>]*>.*?</textarea>', '', html, flags=re.DOTALL)
html = re.sub(r'<div class="example-audios">.*?</div>', '', html, flags=re.DOTALL)
html = re.sub(r'<label style="margin-top: 14px;">.*?</label>', '', html, flags=re.DOTALL)
html = html.replace("O escribí el texto (usa TTS del navegador):", "")

# Replace the entire script section
script_start = html.find('<script>')
script_end = html.find('</script>') + 9

new_script = """<script>
const SPACE='https://kevinwang676-sadtalker.hf.space';
let photoFile=null,audioFile=null;

const pi=document.getElementById('pi');
const pz=document.getElementById('pz');
const pp=document.getElementById('pp');
const pn=document.getElementById('pn');
pi.onchange=function(e){if(e.target.files[0])setPhoto(e.target.files[0])};
pz.ondragover=function(e){e.preventDefault();pz.classList.add('dragging')};
pz.ondragleave=function(){pz.classList.remove('dragging')};
pz.ondrop=function(e){e.preventDefault();pz.classList.remove('dragging');if(e.dataTransfer.files[0])setPhoto(e.dataTransfer.files[0])};
function setPhoto(f){photoFile=f;pn.textContent=f.name;pz.classList.add('ok');pp.src=URL.createObjectURL(f);pp.style.display='block'}

var ai=document.getElementById('ai');
var az=document.getElementById('az');
var ap=document.getElementById('ap');
var an=document.getElementById('an');
ai.onchange=function(e){if(e.target.files[0])setAudio(e.target.files[0])};
az.ondragover=function(e){e.preventDefault();az.classList.add('dragging')};
az.ondragleave=function(){az.classList.remove('dragging')};
az.ondrop=function(e){e.preventDefault();az.classList.remove('dragging');if(e.dataTransfer.files[0])setAudio(e.dataTransfer.files[0])};
function setAudio(f){audioFile=f;an.textContent=f.name;az.classList.add('ok');ap.src=URL.createObjectURL(f);ap.style.display='block'}

function show(msg,type){var s=document.getElementById('status');s.textContent=msg;s.className='st '+type;s.style.display='block'}

function b64(file){return new Promise(function(r){var reader=new FileReader();reader.onload=function(){r(reader.result.split(',')[1])};reader.readAsDataURL(file)})}

async function wakeSpace(){try{await fetch(SPACE,{mode:'no-cors'})}catch(e){}}

async function gen(){
  var btn=document.getElementById('btnGen');
  if(!photoFile){show('Subi una foto','err');return}
  if(!audioFile){show('Subi un audio','err');return}
  btn.disabled=true;
  show('Despertando Space...','run');
  await wakeSpace();
  await new Promise(function(r){setTimeout(r,3000)});
  show('Convirtiendo archivos...','run');
  try{
    var imgB64=await b64(photoFile);
    var audB64=await b64(audioFile);
    var prep=document.getElementById('sel_pre').value;
    var gfpg=document.getElementById('chk_gfpgan').checked;
    show('Enviando a SadTalker... (puede tardar 1-5 min)','run');
    var res=await fetch(SPACE+'/call/0',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({data:[
        'data:image/jpeg;base64,'+imgB64,
        {name:audioFile.name,data:'data:'+audioFile.type+';base64,'+audB64},
        prep,false,gfpg,2,'256',0
      ]})
    });
    if(!res.ok){var errText=await res.text();throw new Error('Server '+res.status+': '+errText)}
    var resp=await res.json();
    var event_id=resp.event_id;
    show('Procesando... ID: '+event_id,'run');
    var videoUrl=null;
    for(var i=0;i<120;i++){
      await new Promise(function(r){setTimeout(r,3000)});
      try{
        var r2=await fetch(SPACE+'/call/0/'+event_id);
        var txt=await r2.text();
        if(txt.indexOf('GENERATED')!==-1){
          var m=txt.match(/"url":"([^"]+)"/);
          if(m){videoUrl=m[1];break}
          var m2=txt.match(/"name":"([^"]+)"/);
          if(m2){videoUrl=SPACE+'/file='+m2[1];break}
        }
        if(i%5===0)show('Esperando... ('+((i+1)*3)+'s)','run');
      }catch(e){}
    }
    if(videoUrl){
      document.getElementById('result').src=videoUrl;
      document.getElementById('result').style.display='block';
      document.getElementById('dlink').href=videoUrl;
      document.getElementById('dlink').style.display='inline-block';
      show('Video listo!','ok');
      btn.textContent='Listo!';
    }else{
      show('Tiempo agotado. Intenta de nuevo.','err');
      btn.textContent='Generar Video';
    }
  }catch(e){
    show('Error: '+e.message,'err');
    btn.textContent='Generar Video';
  }
  btn.disabled=false;
}
</script>"""

html = html[:script_start] + new_script + html[script_end:]

pathlib.Path('personaje.html').write_text(html, encoding='utf-8')
print('Done, size:', len(html))
