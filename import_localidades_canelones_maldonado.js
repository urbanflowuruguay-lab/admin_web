const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://eyfgkopaamnkprzpwocz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Zmdrb3BhYW1ua3ByenB3b2N6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODYxOTQ4MywiZXhwIjoyMDk0MTk1NDgzfQ.GIEEonN5-YGK1hBLloSun9WX-almQfnQW-0LdGOHmCk';

const canelonesTowns = [
  "Aeropuerto Internacional De Carrasco","Aguas Corrientes","Altos De La Tahona","Araminda","Arenal",
  "Argentino","Atlantida","B.h.u.","Barra De Carrasco","Barra De La Pedrera","Barra Del Tala",
  "Barrancas Coloradas","Barrío Artigas","Barrío Benzo","Barrío Copola","Barrío Del Libertador",
  "Barrío La Lucha","Barrío Los Panoramas","Barrío Obrero","Barrío Pretti","Barrío Remanso",
  "Barrío San Cristobal","Barrío Santa Rita","Barrío Traverso","Barrío Villa Murcia","Barros Blancos",
  "Bello Horizonte","Biarritz","Blanco","Bolivar","Camino De La Cadena","Camino Dodera","Camino Lloveras",
  "Campo Militar","Cañada Cardozo","Cañada De Montaño","Cañada Grande","Cañada Prudencio",
  "Canelon Chico","Canelon Chico Al Centro","Canelon Chico De Progreso","Canelon Grande",
  "Canelon Grande De Pacheco","Canelon Grande Norte","Canelones","Capilla De Cella","Carmel",
  "Carrasco Del Sauce","Casarino","Castellanos","Cerrillos","Cerrillos Al Oeste","Cerrillos Al Sur",
  "City Golf","Ciudad De La Costa","Cochengo","Colinas De Carrasco","Colinas De Solymar",
  "Colonia Nicolich","Colorado Chico","Colorado Y Brujas","Costa Azul","Costa De Pando",
  "Costa De Pando Olmos","Costa De Pando San Bautista","Costa De Pando San Jacinto","Costa Del Sauce",
  "Costa Del Tala Este","Costa Del Tala Norte","Costa Y Guillamon","Costas De Pedernal",
  "Costas De Santa Lucia","Costas De Solís","Costas Del Colorado","Costas Del Colorado Este",
  "Costas Del Tala","Cruz De Los Caminos","Cuchilla Alta","Cuchilla Cabo De Hornos",
  "Cuchilla De Machin","Cuchilla De Rocha","Cuchilla De Sierra","Cuchilla De Zeballos",
  "Cuchilla Verde","Cueva Del Tigre","Cumbres De Carrasco","Dr. Francisco Soca","Echevarria",
  "El Bosque","El Bosque De Solymar","El Colorado","El Colorado De Migues","El Colorado San Bautista",
  "El Cuadro","El Dorado","El Galeón","El Pinar","Empalme Dogliotti","Empalme Nicolich",
  "Empalme Olmos","Empalme Sauce","Esquina Gonzalez","Estación Atlantida","Estación La Floresta",
  "Estación Migues","Estación Pedrera","Estación Piedras De Afilar","Estación Tapia",
  "Estanque De Pando","Feliciano","Fortin De Santa Rosa","Fracc Sobre Ruta 74",
  "Fracc. Cno. Andaluz Y R.84","Fracc. Progreso","Guazuvira","Guazuvira Nuevo","Haras Del Lago",
  "Instituto Adventista","Jardínes De Pando","Jaureguiberry","Joaquín Suarez","Juanico",
  "La Asuncion","La Chinchilla","La Floresta","La Montañesa","La Palmita","La Paloma","La Paz",
  "La Totora","La Tuna","Lago Jardín Del Bosque","Lagomar","Las Brujas","Las Higueritas",
  "Las Piedras","Las Ranas","Las Toscas","Las Vegas","Las Violetas","Lomas De Carrasco",
  "Lomas De Solymar","Lomas De Toledo","Los Ceibos","Los Hornos","Los Titanes","Macana","Margat",
  "Marindia","Mata Siete","Mataojo","Medanos De Solymar","Melgarejo","Melilla","Migues","Montes",
  "Montes De Solymar","Murialdo","Nataly","Neptunia","Nutrias","Olmos","Pando","Pantanoso",
  "Pantanoso Del Sauce","Parada Cabrera","Parador Tajes","Parque Carrasco","Parque De Solymar",
  "Parque Del Plata","Parque Miramar","Paso Arbelo","Paso Carrasco","Paso De Cuello",
  "Paso De La Cadena","Paso De La Paloma","Paso De La Salamanca","Paso De Las Toscas",
  "Paso De Los Alamos","Paso De Los Difuntos","Paso De Los Francos","Paso De Pache",
  "Paso Del Bote","Paso Del Colorado","Paso Del Sordo","Paso Espinosa","Paso Palomeque",
  "Paso Rivero De Vejigas","Pedernal","Pedernal Chico","Pedernal Grande","Piedra Del Toro",
  "Piedra Sola","Piedras De Afilar","Piedritas","Piedritas De Suarez","Pinamar",
  "Pinares De Solymar","Pine Park","Ponce Mata Siete","Poquitos","Progreso","Puente De Brujas",
  "Puntas De Brujas","Puntas De Cañada Cardozo","Puntas De Cañada Grande","Puntas De Canelon Chico",
  "Puntas De Cochengo","Puntas De Las Violetas","Puntas De Mata Siete","Puntas De Pantanoso",
  "Puntas De Pantanoso Este","Puntas De Pedrera","Puntas De Vejigas","Puntas Del Arenal",
  "Quinta Los Horneros","Quintas Del Bosque","Rancheríos De Ponce","Rincón De Pando",
  "Rincón De Portezuelo","Rincón De Velazquez","Rincón De Vidal","Rincón Del Colorado",
  "Rincón Del Conde","Rincón Del Gigante","Salinas","San Andres","San Antonio","San Bautista",
  "San Jacinto","San José De Carrasco","San Luis","San Pedro","San Ramón","Santa Ana",
  "Santa Lucia","Santa Lucia Del Este","Santa Rosa","Santa Teresita","Santos Lugares",
  "Sarandí De Migues","Sauce","Sauce De Solís","Sauce Solo","Sauce Solo De Migues",
  "Sauce Solo De Montes","Seis Hermanos","Shangrila","Sofia Santos","Solís Chico",
  "Solís Chico De Migues","Solymar","Sosa Diaz","Tala","Talita","Toledo","Totoral Del Sauce",
  "Vejigas","Vejigas De San Ramón","Vejigas De Tala","Viejo Molino San Bernardo","Villa Aeroparque",
  "Villa Arejo","Villa Argentina","Villa Crespo","Villa El Tato","Villa Encantada","Villa Felicidad",
  "Villa Foresti","Villa Fortuna","Villa Hadita","Villa Huertos De Toledo","Villa Juana",
  "Villa Juanita","Villa Los Alpes","Villa Marina","Villa Molfino","Villa Nueva","Villa Paz S.a.",
  "Villa Prados De Toledo","Villa San Cono","Villa San Felipe","Villa San José","Villa Valverde",
  "Vista Linda"
];

const maldonadoTowns = [
  "Abra De Castellanos","Abra De Perdomo","Aiguá","Alfaro","Alferez","Arenas De José Ignacio",
  "Arroyito De Medina","Balnearío Buenos Aires","Barra De Portezuelo","Barra Del Sauce","Bella Vista",
  "Buenos Aires","Cañada Bellaca","Cañada De La Cruz","Canteras De Marelli","Carape","Carlos Cal",
  "Cerro Pelado","Cerros Azules","Chihuahua","Colonia J. Suarez","Coronilla","Corte De La Leña",
  "Costas De José Ignacio","Eden Rock","El Chorro","El Eden","El Quijote","El Tesoro",
  "Faro José Ignacio","Faro José Ignacio Norte","Garzon","Gerona","Gregorío Aznarez",
  "Guardia Vieja","José Ignacio","La Barra","La Capuera","La Falda","La Juanita","La Sierra",
  "La Sonrisa","Lago De Los Cisnes","Laguna Blanca","Laguna Del Sauce","Las Cañas","Las Cumbres",
  "Las Flores","Las Flores - Estación","Los Aromos","Los Ceibos","Los Corchos","Los Talas",
  "Maldonado","Manantiales","Mataojo","Molles De Garzon","Nueva Carrara","Ocean Park",
  "Pago De La Paja","Pan De Azucar","Parque Medina","Partido Norte","Partido Oeste",
  "Paso De La Cantera","Paso De Los Talas","Pinares - Las Delicias","Piriapolis","Playa Grande",
  "Playa Hermosa","Playa Verde","Portezuelo","Pueblo Solís","Punta Ballena","Punta Colorada",
  "Punta Del Este","Punta Fria","Punta Negra","Puntas De José Ignacio","Puntas De La Sierra",
  "Puntas De Mataojo","Puntas De Pan De Azucar","Puntas Del Campanera","Rincón De Aparicio",
  "Rincón De Los Sosa","Rincón Del Indio","Ruta 37 Y 9","Salamanca","San Carlos",
  "San Juan Del Este","San Rafael El Placer","San Vicente","Santa Monica","Sarandí De Aigua",
  "Sarandí Del Mataojo","Sauce De Aigua","Sauce De Portezuelo","Solís","Valdivia","Villa Delia",
  "Zanja Del Tigre"
];

async function geocode(name, dept) {
  const query = encodeURIComponent(name + ', ' + dept + ', Uruguay');
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=uy`;
  
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'UrbanFlowApp/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const arr = JSON.parse(data);
          if (arr.length > 0) {
            resolve({ lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon), found: true });
          } else {
            resolve({ lat: 0, lng: 0, found: false });
          }
        } catch { resolve({ lat: 0, lng: 0, found: false }); }
      });
    }).on('error', () => resolve({ lat: 0, lng: 0, found: false }));
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function insertBatch(rows) {
  if (rows.length === 0) return;
  const body = JSON.stringify(rows);
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/neighborhoods`);
    const req = https.request({
      method: 'POST', hostname: url.hostname, path: url.pathname,
      headers: {
        'Content-Type': 'application/json', 'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'return=minimal'
      }
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { if (res.statusCode < 300) resolve(); else { console.error(`Batch error ${res.statusCode}:`, d); reject(new Error(d)); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  // First, delete existing Canelones and Maldonado barrios
  console.log('Deleting existing barrios...');
  for (const dept of ['Canelones', 'Maldonado']) {
    await new Promise((resolve, reject) => {
      const url = new URL(`${SUPABASE_URL}/rest/v1/neighborhoods?department=eq.${dept}&country=eq.UY`);
      const req = https.request({
        method: 'DELETE', hostname: url.hostname, path: url.pathname,
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      }, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>resolve()); });
      req.on('error', reject); req.end();
    });
  }
  console.log('Done deleting.\n');

  const towns = [
    ...canelonesTowns.map(t => ({ name: t, dept: 'Canelones' })),
    ...maldonadoTowns.map(t => ({ name: t, dept: 'Maldonado' }))
  ];

  console.log(`Geocoding ${towns.length} towns...`);
  const rows = [];
  let found = 0, notFound = 0;

  for (let i = 0; i < towns.length; i++) {
    const t = towns[i];
    const geo = await geocode(t.name, t.dept);
    
    if (geo.found) {
      found++;
      rows.push({
        name: t.name, department: t.dept, country: 'UY',
        geometry: { type: 'Point', coordinates: [geo.lng, geo.lat] },
        center_lat: geo.lat, center_lng: geo.lng
      });
    } else {
      notFound++;
    }
    
    if ((i + 1) % 10 === 0) console.log(`  ${i + 1}/${towns.length} done (found: ${found}, not found: ${notFound})`);
    
    // Rate limit: 1 req/sec for Nominatim
    await sleep(1100);
    
    // Batch insert every 50 rows
    if (rows.length >= 50) {
      try { await insertBatch(rows); } catch(e) { console.error('Insert error:', e.message); }
      rows.length = 0;
    }
  }

  // Insert remaining
  if (rows.length > 0) {
    try { await insertBatch(rows); } catch(e) { console.error('Insert error:', e.message); }
  }

  console.log(`\nDone! Found: ${found}, Not found: ${notFound}`);
}

main();
