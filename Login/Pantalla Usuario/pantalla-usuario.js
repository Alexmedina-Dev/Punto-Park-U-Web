let state={activeReservation:null,vehicles:[{id:'1',plate:'ABC-123',type:'Carro',brand:'Chevrolet Spark',color:'Rojo',year:'2020'},{id:'2',plate:'XYZ-789',type:'Moto',brand:'Yamaha FZ',color:'Negro',year:'2021'}],currentEdit:null,selectedType:'Carro'};

window.onload=function(){renderVehicles();renderActiveReservation();populateReserveSelect();};

function showTab(tab){
  document.querySelectorAll('.tab-section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.querySelectorAll('.bottom-tab').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  const nav=document.getElementById('nav-'+tab); if(nav) nav.classList.add('active');
  const btab=document.getElementById('btab-'+tab); if(btab) btab.classList.add('active');
  closeNotifDropdown(); window.scrollTo({top:0,behavior:'smooth'});
}

function toggleNotifDropdown(){document.getElementById('notifDropdown').classList.toggle('active');}
function closeNotifDropdown(){document.getElementById('notifDropdown').classList.remove('active');}
document.addEventListener('click',function(e){
  const d=document.getElementById('notifDropdown');
  if(!d.contains(e.target)&&!e.target.closest('[onclick="toggleNotifDropdown()"]')&&!e.target.closest('#notifBtnMobile')) closeNotifDropdown();
});

function renderActiveReservation(){
  const cont=document.getElementById('activeReservationContainer');
  if(!state.activeReservation){
    cont.innerHTML=`<div class="reservation-card" style="text-align:center;padding:26px;"><div class="no-res-icon"><span class="material-symbols-outlined" style="font-size:48px;">directions_car</span></div><div class="no-res-title">No tienes reservas activas</div><button class="btn btn-primary" onclick="showTab('reserve')"><span class="material-symbols-outlined icon-sm">event_seat</span> Hacer Reserva</button></div>`;
  } else {
    const isPaid=state.activeReservation==='paid';
    cont.innerHTML=`<div class="reservation-card"><div class="res-header"><div class="res-label"><div class="pulse-dot"></div> Reserva Activa</div><span class="status-badge ${isPaid?'status-paid':'status-unpaid'}"><span class="material-symbols-outlined" style="font-size:12px;">${isPaid?'check_circle':'warning'}</span>${isPaid?'PAGADO':'SIN PAGAR'}</span></div><div class="plate-big">ABC-123</div><div class="res-meta">Chevrolet Spark · Rojo</div><div class="res-info-grid"><div class="res-info-item"><div class="res-info-icon"><span class="material-symbols-outlined icon-sm">local_parking</span></div><div><div class="res-info-label">Espacio</div><div class="res-info-value">A5</div></div></div><div class="res-info-item"><div class="res-info-icon"><span class="material-symbols-outlined icon-sm">schedule</span></div><div><div class="res-info-label">Tiempo Rest.</div><div class="res-info-value danger">15:42</div></div></div></div><div class="btn-group"><button class="btn btn-primary"><span class="material-symbols-outlined icon-sm">credit_card</span> Pagar Extra</button><button class="btn btn-danger" onclick="cancelReservation()" ${isPaid?'disabled style="opacity:0.35;cursor:not-allowed;"':''}><span class="material-symbols-outlined icon-sm">close</span> Cancelar</button></div></div>`;
  }
}

function renderVehicles(){
  const list=document.getElementById('vehiclesList'); list.innerHTML='';
  state.vehicles.forEach(v=>{
    const icon=v.type==='Moto'?'two_wheeler':v.type==='Bicicleta'?'pedal_bike':'directions_car';
    const card=document.createElement('div'); card.className='vehicle-card';
    card.innerHTML=`<div class="vc-header"><div class="vc-plate">${v.plate}</div><div class="vc-type-badge">${v.type}</div></div><div class="vc-details">${v.brand} · ${v.color} · ${v.year}</div><button class="btn btn-secondary btn-sm" onclick="openEditModal('${v.id}')"><span class="material-symbols-outlined icon-sm">edit</span> Editar</button>`;
    list.appendChild(card);
  });
}

function populateReserveSelect(){
  const sel=document.getElementById('reserveVehicle'); sel.innerHTML='';
  state.vehicles.forEach(v=>{const opt=document.createElement('option');opt.value=v.id;opt.textContent=`${v.plate} (${v.type})`;sel.appendChild(opt);});
}

function openEditModal(id){
  const v=state.vehicles.find(v=>v.id===id); if(!v) return;
  state.currentEdit=id;
  document.getElementById('editPlate').value=v.plate;
  document.getElementById('editBrand').value=v.brand;
  document.getElementById('editColor').value=v.color;
  document.getElementById('editYear').value=v.year;
  openModal('editModal');
}

function saveEdit(){
  const brand=document.getElementById('editBrand').value.trim();
  const color=document.getElementById('editColor').value.trim();
  const year=document.getElementById('editYear').value.trim();
  if(!brand||!color||!year){showToast('Completa todos los campos');return;}
  const idx=state.vehicles.findIndex(v=>v.id===state.currentEdit);
  if(idx!==-1){state.vehicles[idx].brand=brand;state.vehicles[idx].color=color;state.vehicles[idx].year=year;}
  closeModal('editModal'); renderVehicles(); populateReserveSelect(); showToast('Vehículo actualizado');
}

function deleteVehicle(){
  if(!confirm('¿Eliminar este vehículo?')) return;
  state.vehicles=state.vehicles.filter(v=>v.id!==state.currentEdit);
  closeModal('editModal'); renderVehicles(); populateReserveSelect(); showToast('Vehículo eliminado');
}

function openAddModal(){
  selectType('Carro');
  ['addPlate','addBrand','addColor','addYear'].forEach(id=>document.getElementById(id).value='');
  openModal('addModal');
}

function selectType(type){
  state.selectedType=type;
  ['Carro','Moto','Bicicleta'].forEach(t=>{const btn=document.getElementById('type'+t);if(btn)btn.classList.toggle('selected',t===type);});
  const isBici=type==='Bicicleta';
  document.getElementById('fieldPlacaLabel').textContent=isBici?'Número de Serie / Marco':'Placa';
  document.getElementById('addPlate').placeholder=isBici?'Ej: SER-2023-001':'Ej: ABC-123';
  document.getElementById('fieldYearGroup').style.display=isBici?'none':'block';
}

function saveNewVehicle(){
  const plate=document.getElementById('addPlate').value.trim();
  const brand=document.getElementById('addBrand').value.trim();
  const color=document.getElementById('addColor').value.trim();
  const year=document.getElementById('addYear').value.trim();
  const isBici=state.selectedType==='Bicicleta';
  if(!plate||!brand||!color){showToast('Completa todos los campos');return;}
  if(!isBici&&!year){showToast('Ingresa el año');return;}
  if(state.vehicles.find(v=>v.plate.toUpperCase()===plate.toUpperCase())){showToast('Ese vehículo ya está registrado');return;}
  state.vehicles.push({id:Date.now().toString(),plate:plate.toUpperCase(),type:state.selectedType,brand,color,year:isBici?'N/A':year});
  closeModal('addModal'); renderVehicles(); populateReserveSelect();
  showToast(isBici?'Bicicleta registrada · Valida con el operador al ingresar':'Vehículo registrado · La cámara IA lo reconocerá');
}

function makeReservation(){
  const vehicleId=document.getElementById('reserveVehicle').value;
  const payment=document.getElementById('reservePayment').value;
  const vehicle=state.vehicles.find(v=>v.id===vehicleId);
  if(!vehicle){showToast('Registra un vehículo primero');return;}
  if(state.activeReservation){showToast('Ya tienes una reserva activa');return;}
  if(payment==='prepaid'){
    if(confirm(`Pagar por PSE\n\nVehículo: ${vehicle.plate}\nMonto: $3.000\n\n¿Confirmar pago?`)){
      showToast('Procesando pago...');
      setTimeout(()=>{state.activeReservation='paid';renderActiveReservation();showTab('home');showToast('Pago confirmado · Reserva activa');},1500);
    }
  } else {
    state.activeReservation='unpaid'; renderActiveReservation(); showTab('home');
    showToast('Reserva confirmada · La cámara IA te reconocerá al ingresar');
  }
}

function cancelReservation(){
  if(state.activeReservation==='paid'){showToast('No puedes cancelar una reserva pagada');return;}
  if(confirm('¿Cancelar la reserva?')){state.activeReservation=null;renderActiveReservation();showToast('Reserva cancelada');}
}

function toggleProfileForm(show){
  document.getElementById('profileDisplay').style.display=show?'none':'block';
  document.getElementById('profileForm').style.display=show?'block':'none';
}

function saveProfile(){
  const name=document.getElementById('profileName').value.trim();
  const email=document.getElementById('profileEmail').value.trim();
  const phone=document.getElementById('profilePhone').value.trim();
  if(!name||!email||!phone){showToast('Completa todos los campos');return;}
  document.getElementById('displayName').textContent=name;
  document.getElementById('displayEmail').textContent=email;
  document.getElementById('displayPhone').textContent=phone;
  document.getElementById('sidebarName').textContent=name;
  toggleProfileForm(false); showToast('Datos actualizados');
}

function changePassword(){
  const oldP=document.getElementById('passOld').value;
  const newP=document.getElementById('passNew').value;
  const conP=document.getElementById('passConfirm').value;
  if(!oldP||!newP||!conP){showToast('Completa todos los campos');return;}
  if(newP.length<6){showToast('Mínimo 6 caracteres');return;}
  if(newP!==conP){showToast('Las contraseñas no coinciden');return;}
  ['passOld','passNew','passConfirm'].forEach(id=>document.getElementById(id).value='');
  closeModal('passwordModal'); showToast('Contraseña actualizada');
}

function saveNotificationSettings(){
  const settings={sms:document.getElementById('notifSMS').checked,whatsapp:document.getElementById('notifWhatsApp').checked,push:document.getElementById('notifPush').checked,ingreso:document.getElementById('notifIngreso').checked,tiempo:document.getElementById('notifTiempo').checked,vencido:document.getElementById('notifVencido').checked,pago:document.getElementById('notifPago').checked,nivel:document.getElementById('notifNivel').checked,promo:document.getElementById('notifPromo').checked};
  localStorage.setItem('notificationSettings',JSON.stringify(settings));
  closeModal('notifModal'); showToast('Preferencias de notificación guardadas');
}

function showMembershipInfo(){
  alert('Membresía · 24 visitas\n\nDescuento del 10% en todas las reservas.\n6 visitas para el siguiente beneficio.\n\nSigue usando el servicio para desbloquear tarifas especiales.');
}

function openGoogleMaps(){window.open('https://www.google.com/maps/dir/?api=1&destination=4.6674,-74.0561','_blank');}
function openWaze(){window.open('https://waze.com/ul?ll=4.6674,-74.0561&navigate=yes','_blank');}
function logout(){if(confirm('¿Cerrar sesión?')) window.location.href='../index.html';}
function openModal(id){document.getElementById(id).classList.add('active');}
function closeModal(id){document.getElementById(id).classList.remove('active');}
document.addEventListener('click',function(e){if(e.target.classList.contains('modal-overlay')) e.target.classList.remove('active');});

function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),3000);
}