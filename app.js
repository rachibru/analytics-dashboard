document.addEventListener('DOMContentLoaded', () => {
  // 1. Inizializzazione Mappa Scura
  const map = L.map('world-map').setView([20, 0], 2);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Esempio punti di calore/connessione sulla mappa
  const sampleLocations = [
    { name: "Roma", lat: 41.9028, lng: 12.4964, views: 1240 },
    { name: "Milano", lat: 45.4642, lng: 9.1900, views: 890 },
    { name: "New York", lat: 40.7128, lng: -74.0060, views: 310 },
    { name: "Londra", lat: 51.5074, lng: -0.1278, views: 220 }
  ];

  sampleLocations.forEach(loc => {
    L.circleMarker([loc.lat, loc.lng], {
      radius: Math.min(loc.views / 50, 20),
      fillColor: '#00e5ff',
      color: '#00e5ff',
      weight: 1,
      opacity: 0.8,
      fillOpacity: 0.4
    }).addTo(map).bindPopup(`<b>${loc.name}</b><br>${loc.views} visualizzazioni`);
  });

  // 2. Grafico di prova
  const ctx = document.getElementById('trafficChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['1 Nov', '2 Nov', '3 Nov', '4 Nov', '5 Nov', '6 Nov'],
      datasets: [{
        label: 'Visite',
        data: [420, 580, 750, 620, 890, 1100],
        borderColor: '#00e5ff',
        backgroundColor: 'rgba(0, 229, 255, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#1f242d' }, ticks: { color: '#8b949e' } },
        y: { grid: { color: '#1f242d' }, ticks: { color: '#8b949e' } }
      }
    }
  });
});
