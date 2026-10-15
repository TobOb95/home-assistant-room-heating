/* Room Heating visual weekly scheduler card v2.1.0 */
class RoomHeatingCard extends HTMLElement {
  setConfig(config) {
    if (!config.entry_id) throw new Error("Bitte entry_id der Room-Heating-Integration angeben.");
    this.config = {title:"Raumheizung", comfort_temperature:21, eco_temperature:17, vacation_temperature:16, ...config};
    this._schedule = JSON.parse(JSON.stringify(this.config.schedule || Object.fromEntries([0,1,2,3,4,5,6].map(d=>[String(d), d<5?[{start:"06:30",end:"08:30",temperature:21},{start:"17:00",end:"22:30",temperature:21}]:[{start:"08:00",end:"22:30",temperature:21}]))));
    this._selectedDay = "0"; this._selectedPeriod = null; this._drag = null;
  }
  set hass(hass) { this._hass=hass; this.render(); }
  getCardSize(){return 7;}
  esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  async call(service,data){await this._hass.callService("room_heating",service,{entry_id:this.config.entry_id,...data});}
  minutes(s){const [h,m]=s.split(":").map(Number);return h*60+m;}
  time(m){m=Math.max(0,Math.min(1439,Math.round(m/15)*15));return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");}
  getPeriods(day){return (this._schedule[String(day)]||[]).slice().sort((a,b)=>this.minutes(a.start)-this.minutes(b.start));}
  render(){
    if(!this._hass||!this.config)return;
    const cfg=this.config, climate=cfg.climate_entity||"", st=climate?this._hass.states[climate]:null;
    const days=["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];
    const day=Number(this._selectedDay), periods=this.getPeriods(day);
    const hourLabels=Array.from({length:13},(_,i)=>`<span>${String(i*2).padStart(2,"0")}:00</span>`).join("");
    const blocks=periods.map((p,i)=>{
      const start=this.minutes(p.start),end=this.minutes(p.end),left=start/1440*100,width=(end-start)/1440*100;
      return `<div class="period" data-index="${i}" style="left:${left}%;width:${width}%" tabindex="0" title="${this.esc(p.start)}–${this.esc(p.end)} · ${p.temperature} °C">
        <div class="block-main"><b>${this.esc(p.start)}–${this.esc(p.end)}</b><span>${this.esc(p.temperature)} °C</span></div>
        <button class="resize start" data-index="${i}" aria-label="Start verschieben">⋮</button><button class="resize end" data-index="${i}" aria-label="Ende verschieben">⋮</button>
      </div>`;
    }).join("");
    this.innerHTML=`<ha-card><div class="head"><div><h2>${this.esc(cfg.title)}</h2><div class="sub">${this.esc(climate||"Kein Thermostat konfiguriert")}</div></div><div class="readings"><span>Ist <b>${this.esc(st?.attributes?.current_temperature??"–")} °C</b></span><span>Soll <b>${this.esc(st?.attributes?.temperature??"–")} °C</b></span></div></div>
      <div class="content">
        <div class="top-controls">
          <label>Raumthermostat <input id="climate" value="${this.esc(climate)}" placeholder="climate.wohnzimmer"></label>
          <label>Komfort °C <input id="comfort" type="number" min="5" max="30" step=".5" value="${Number(cfg.comfort_temperature)}"></label>
          <label>Absenkung °C <input id="eco" type="number" min="5" max="30" step=".5" value="${Number(cfg.eco_temperature)}"></label>
          <label>Urlaub °C <input id="vacation" type="number" min="5" max="25" step=".5" value="${Number(cfg.vacation_temperature)}"></label>
        </div>
        <div class="day-tabs">${days.map((d,i)=>`<button class="day ${String(i)===this._selectedDay?"active":""}" data-day="${i}">${d.slice(0,2)}<span>${d}</span></button>`).join("")}</div>
        <div class="plan-toolbar"><div><strong>${days[day]}</strong><div class="sub">Zeitblöcke anklicken zum Bearbeiten · ziehen zum Verschieben · Kanten ziehen zum Ändern</div></div><button id="add">＋ Zeitblock</button></div>
        <div class="timeline"><div class="hour-labels">${hourLabels}</div><div class="track" id="track"><div class="grid-lines">${Array.from({length:13},(_,i)=>`<i style="left:${i/12*100}%"></i>`).join("")}</div>${blocks}</div></div>
        <div class="period-list">${periods.length?periods.map((p,i)=>`<button class="period-row ${this._selectedPeriod===i?"chosen":""}" data-edit="${i}"><span class="dot"></span><b>${this.esc(p.start)}–${this.esc(p.end)}</b><span>${p.temperature} °C</span><span class="muted">Bearbeiten</span></button>`).join(""):`<div class="empty">Keine Komfortphase. Der Raum nutzt die Absenktemperatur.</div>`}</div>
        <div id="editor" class="editor" hidden><h3>Zeitblock bearbeiten</h3><div class="edit-grid">
          <label>Start <input id="pstart" type="time" step="900"></label><label>Ende <input id="pend" type="time" step="900"></label>
          <label>Zieltemperatur °C <input id="ptemp" type="number" min="5" max="30" step=".5"></label>
        </div><div class="actions"><button id="apply">Übernehmen</button><button id="delete" class="secondary">Zeitblock löschen</button><button id="cancel" class="secondary">Abbrechen</button></div></div>
        <div class="actions bottom"><button id="save">Änderungen speichern</button><button id="vac-on" class="secondary">Urlaub an</button><button id="vac-off" class="secondary">Urlaub aus</button></div><div id="message" role="status" class="sub"></div>
      </div></ha-card>`;
    this.insertStyle();
    this.querySelectorAll("[data-day]").forEach(b=>b.onclick=()=>{this._selectedDay=b.dataset.day;this._selectedPeriod=null;this.render();});
    this.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>this.openEditor(Number(b.dataset.edit)));
    this.querySelectorAll(".period").forEach(b=>b.onclick=e=>{if(e.target.closest(".resize"))return;this.openEditor(Number(b.dataset.index));});
    this.querySelector("#add").onclick=()=>{const arr=this._schedule[this._selectedDay]||[];let start="12:00",end="13:00";for(let m=360;m<1320;m+=60){const a=this.time(m),z=this.time(m+60);if(!arr.some(p=>a<p.end&&z>p.start)){start=a;end=z;break;}}arr.push({start,end,temperature:Number(this.querySelector("#comfort").value||21)});this._schedule[this._selectedDay]=arr.sort((a,b)=>this.minutes(a.start)-this.minutes(b.start));this.openEditor(this._schedule[this._selectedDay].indexOf(arr[arr.length-1]));this.render();this.openEditor(this.getPeriods(this._selectedDay).findIndex(p=>p.start===start&&p.end===end));};
    this.querySelector("#apply").onclick=()=>{const i=this._selectedPeriod,arr=this.getPeriods(this._selectedDay);if(i==null||!arr[i])return;const p={start:this.querySelector("#pstart").value,end:this.querySelector("#pend").value,temperature:Number(this.querySelector("#ptemp").value)};if(!p.start||!p.end||p.start>=p.end||p.temperature<5||p.temperature>30){this.message("Ungültige Zeit oder Temperatur (5–30 °C).");return;}arr[i]=p;arr.sort((a,b)=>this.minutes(a.start)-this.minutes(b.start));if(arr.some((x,j)=>j>0&&x.start<arr[j-1].end)){this.message("Zeitblöcke dürfen sich nicht überschneiden.");return;}this._schedule[this._selectedDay]=arr;this._selectedPeriod=null;this.render();this.message("Zeitblock geändert. Noch nicht gespeichert.");};
    this.querySelector("#delete").onclick=()=>{let arr=this.getPeriods(this._selectedDay);arr.splice(this._selectedPeriod,1);this._schedule[this._selectedDay]=arr;this._selectedPeriod=null;this.render();this.message("Zeitblock entfernt. Noch nicht gespeichert.");};
    this.querySelector("#cancel").onclick=()=>{this._selectedPeriod=null;this.querySelector("#editor").hidden=true;};
    this.querySelector("#save").onclick=async()=>{try{
      for(let d=0;d<7;d++){const a=this.getPeriods(d);for(let i=1;i<a.length;i++)if(a[i].start<a[i-1].end)throw new Error(days[d]+": Zeitblöcke überschneiden sich.");}
      await this.call("set_schedule",{schedule:this._schedule});
      await this.call("set_temperatures",{comfort_temperature:Number(this.querySelector("#comfort").value),eco_temperature:Number(this.querySelector("#eco").value),vacation_temperature:Number(this.querySelector("#vacation").value)});
      this.config.climate_entity=this.querySelector("#climate").value;this.message("Zeitplan und Temperaturen gespeichert.");
    }catch(e){this.message("Fehler: "+e.message);}};
    this.querySelector("#vac-on").onclick=async()=>{try{await this.call("set_vacation",{enabled:true});this.message("Urlaubsmodus aktiviert.");}catch(e){this.message("Fehler: "+e.message);}};
    this.querySelector("#vac-off").onclick=async()=>{try{await this.call("set_vacation",{enabled:false});this.message("Urlaubsmodus deaktiviert.");}catch(e){this.message("Fehler: "+e.message);}};
    this.enableDrag();
  }
  openEditor(i){const arr=this.getPeriods(this._selectedDay),p=arr[i];if(!p)return;this._selectedPeriod=i;const ed=this.querySelector("#editor");ed.hidden=false;this.querySelector("#pstart").value=p.start;this.querySelector("#pend").value=p.end;this.querySelector("#ptemp").value=p.temperature;this.querySelectorAll("[data-edit]").forEach(b=>b.classList.toggle("chosen",Number(b.dataset.edit)===i));}
  message(text){const m=this.querySelector("#message");if(m)m.textContent=text;}
  enableDrag(){
    const track=this.querySelector("#track");if(!track)return;
    track.querySelectorAll(".period").forEach(block=>{
      const idx=Number(block.dataset.index);
      block.querySelectorAll(".resize").forEach(handle=>handle.onpointerdown=e=>{
        e.preventDefault();e.stopPropagation();const arr=this.getPeriods(this._selectedDay),p=arr[idx],mode=handle.classList.contains("start")?"start":"end",x0=e.clientX,orig=this.minutes(p[mode]),rect=track.getBoundingClientRect();
        const move=ev=>{let m=this.minutes(p[mode]);m=this.minutes(this.time(orig+(ev.clientX-x0)/rect.width*1440));if(mode==="start")m=Math.min(m,this.minutes(p.end)-15);else m=Math.max(m,this.minutes(p.start)+15);p[mode]=this.time(m);block.style.left=this.minutes(p.start)/1440*100+"%";block.style.width=(this.minutes(p.end)-this.minutes(p.start))/1440*100+"%";block.querySelector(".block-main").innerHTML=`<b>${p.start}–${p.end}</b><span>${p.temperature} °C</span>`;};
        const up=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up);this._schedule[this._selectedDay]=arr;};window.addEventListener("pointermove",move);window.addEventListener("pointerup",up);
      });
      block.onpointerdown=e=>{if(e.target.closest(".resize"))return;e.preventDefault();const arr=this.getPeriods(this._selectedDay),p=arr[idx],x0=e.clientX,s=this.minutes(p.start),en=this.minutes(p.end),rect=track.getBoundingClientRect();
        const move=ev=>{const delta=Math.round((ev.clientX-x0)/rect.width*1440/15)*15;let ns=Math.max(0,Math.min(1439-(en-s),s+delta));p.start=this.time(ns);p.end=this.time(Math.min(1439,ns+(en-s)));block.style.left=this.minutes(p.start)/1440*100+"%";block.querySelector(".block-main").innerHTML=`<b>${p.start}–${p.end}</b><span>${p.temperature} °C</span>`;};
        const up=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up);this._schedule[this._selectedDay]=arr;};window.addEventListener("pointermove",move);window.addEventListener("pointerup",up);
      };
    });
  }
  insertStyle(){
    if(this._styled)return;this._styled=true;
    const s=document.createElement("style");s.textContent=`
    room-heating-card .head{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:18px 18px 12px}
    room-heating-card h2{font-size:1.25rem;margin:0 0 5px}room-heating-card .sub,room-heating-card .muted{color:var(--secondary-text-color);font-size:.84rem}
    room-heating-card .readings{display:flex;gap:14px;flex-wrap:wrap;font-size:.9rem}room-heating-card .readings span{display:grid;gap:3px}
    room-heating-card .content{padding:0 18px 18px}room-heating-card .top-controls{display:grid;grid-template-columns:2fr repeat(3,minmax(85px,1fr));gap:10px}
    room-heating-card label{display:flex;flex-direction:column;gap:5px;font-size:.85rem;margin:8px 0}
    room-heating-card input{box-sizing:border-box;min-width:0;width:100%;padding:9px;border:1px solid var(--divider-color);border-radius:7px;background:var(--card-background-color);color:var(--primary-text-color);font:inherit}
    room-heating-card .day-tabs{display:flex;gap:5px;margin:18px 0 14px;overflow-x:auto}
    room-heating-card button{cursor:pointer;border:0;border-radius:7px;padding:9px 12px;background:var(--primary-color);color:var(--text-primary-color);font:inherit}
    room-heating-card button.secondary,room-heating-card .day{background:var(--secondary-background-color);color:var(--primary-text-color)}
    room-heating-card .day{min-width:42px;display:flex;flex-direction:column;align-items:center;gap:2px}
    room-heating-card .day span{font-size:.65rem}room-heating-card .day.active{background:var(--primary-color);color:var(--text-primary-color)}
    room-heating-card .plan-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}
    room-heating-card .timeline{overflow-x:auto;padding-top:3px}room-heating-card .hour-labels{display:flex;margin-left:0;justify-content:space-between;font-size:.67rem;color:var(--secondary-text-color);padding-bottom:5px;min-width:560px}
    room-heating-card .track{position:relative;height:74px;min-width:560px;background:var(--secondary-background-color);border-radius:8px;overflow:hidden;touch-action:pan-y}
    room-heating-card .grid-lines{position:absolute;inset:0;pointer-events:none}room-heating-card .grid-lines i{position:absolute;top:0;bottom:0;border-left:1px solid var(--divider-color)}
    room-heating-card .period{position:absolute;top:12px;height:50px;border-radius:7px;background:var(--primary-color);color:var(--text-primary-color);min-width:18px;box-sizing:border-box;overflow:hidden;cursor:grab;touch-action:none;user-select:none}
    room-heating-card .block-main{height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;font-size:clamp(9px,.8vw,12px);white-space:nowrap;pointer-events:none}
    room-heating-card .resize{position:absolute;top:0;bottom:0;padding:0 2px;background:rgba(0,0,0,.15);font-size:12px;border-radius:0;touch-action:none}
    room-heating-card .resize.start{left:0}room-heating-card .resize.end{right:0}
    room-heating-card .period-list{display:grid;gap:5px;margin-top:12px}
    room-heating-card .period-row{display:flex;gap:10px;align-items:center;text-align:left;background:transparent;color:var(--primary-text-color);border:1px solid var(--divider-color)}
    room-heating-card .period-row .muted{margin-left:auto}room-heating-card .period-row.chosen{border-color:var(--primary-color)}
    room-heating-card .dot{width:9px;height:9px;border-radius:50%;background:var(--primary-color)}
    room-heating-card .empty{padding:14px;color:var(--secondary-text-color)}
    room-heating-card .editor{border-top:1px solid var(--divider-color);margin-top:14px;padding-top:12px}
    room-heating-card .editor h3{margin:0}room-heating-card .edit-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
    room-heating-card .actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}room-heating-card .bottom{border-top:1px solid var(--divider-color);padding-top:14px}
    room-heating-card #message{margin-top:10px;min-height:1.2em}
    @media(max-width:600px){room-heating-card .head{align-items:flex-start;flex-direction:column}room-heating-card .top-controls{grid-template-columns:repeat(2,minmax(0,1fr))}room-heating-card .edit-grid{grid-template-columns:1fr}room-heating-card .day span{display:none}}
    `;this.appendChild(s);
  }
}
customElements.define("room-heating-card",RoomHeatingCard);
window.customCards=window.customCards||[];
window.customCards.push({type:"room-heating-card",name:"Room Heating Scheduler",description:"Visueller Wochenplan mit verschiebbaren Zeitblöcken, Temperaturbearbeitung und Urlaubsmodus."});
