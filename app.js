document.addEventListener('DOMContentLoaded', () => {
  // 1. Inizializzazione Mappa Scura
  const map = L.map('world-map').setView([20, 0], 2);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // Coordinate di emergenza/frequenti per evitare il blocco CORS di Nominatim
  const cityCoords = {
    "Rome": [41.9028, 12.4964],
    "Milan": [45.4642, 9.1900],
    "Naples": [40.8518, 14.2681],
    "Turin": [45.0703, 7.6869],
    "Palermo": [38.1157, 13.3615],
    "Bologna": [44.4949, 11.3426],
    "Florence": [43.7696, 11.2558],
    "London": [51.5074, -0.1278],
    "New York": [40.7128, -74.0060],
    "Paris": [48.8566, 2.3522],
    "Madrid": [40.4168, -3.7038]
  };

  // Caricamento dati con parametro casuale per bypassare la cache del browser
  fetch(`stats-data.json?t=${new Date().getTime()}`)
    .then(response => {
      if (!response.ok) throw new Error("File stats-data.json non trovato");
      return response.json();
    })
    .then(data => {
      // 1. Aggiornamento KPI Cards
      document.getElementById('total-views').innerText = (data.kpis.total_views || 0).toLocaleString('it-IT');
      document.getElementById('google-clicks').innerText = (data.kpis.total_clicks || 0).toLocaleString('it-IT');
      document.getElementById('google-impressions').innerText = (data.kpis.total_impressions || 0).toLocaleString('it-IT');
      document.getElementById('avg-position').innerText = data.kpis.avg_position || '0';

      // 2. Grafico del traffico reale
      if (data.chart && data.chart.labels) {
        const ctx = document.getElementById('trafficChart').getContext('2d');
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.chart.labels,
            datasets: [{
              label: 'Visualizzazioni',
              data: data.chart.data,
              borderColor: '#00e5ff',
              backgroundColor: 'rgba(0, 229, 255, 0.1)',
              fill: true,
              tension: 0.3
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
      }

      // 3. Mappa Mondo
      if (data.geo_data) {
        data.geo_data.forEach(item => {
          let coords = cityCoords[item.city];
          if (coords) {
            L.circleMarker(coords, {
              radius: Math.min(Math.max(item.users * 3, 6), 20),
              fillColor: '#00e5ff',
              color: '#00e5ff',
              weight: 1,
              opacity: 0.9,
              fillOpacity: 0.5
            }).addTo(map).bindPopup(`<b>${item.city} (${item.country})</b><br>${item.users} utenti attivi`);
          }
        });
      }

      // 4. Tabella Search Queries
      const queriesTbody = document.getElementById('queries-table-body');
      queriesTbody.innerHTML = '';
      if (data.search_queries && data.search_queries.length > 0) {
        data.search_queries.forEach(q => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><b>${q.query}</b></td>
            <td>${q.clicks}</td>
            <td>${q.impressions}</td>
            <td>${q.position}</td>
          `;
          queriesTbody.appendChild(tr);
        });
      } else {
        queriesTbody.innerHTML = '<tr><td colspan="4">Nessun dato Search Console disponibile</td></tr>';
      }

      // 5. Tabella Articoli Più Letti
      const postsTbody = document.getElementById('top-posts-body');
      postsTbody.innerHTML = '';
      if (data.top_posts && data.top_posts.length > 0) {
        data.top_posts.forEach(p => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><a href="${p.url}" target="_blank" style="color: #00e5ff; text-decoration: none;">${p.title}</a></td>
            <td><b>${p.views.toLocaleString('it-IT')}</b></td>
            <td>${p.avg_time}</td>
          `;
          postsTbody.appendChild(tr);
        });
      } else {
        postsTbody.innerHTML = '<tr><td colspan="3">Nessun articolo trovato</td></tr>';
      }
    })
    .catch(err => {
      console.error("Errore nel caricamento dei dati:", err);
    });
});
