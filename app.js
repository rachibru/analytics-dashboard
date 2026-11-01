document.addEventListener('DOMContentLoaded', () => {
  // 1. Inizializzazione Mappa Scura GRATUITA (Esri Dark Gray - Nessuna API Key richiesta!)
  const map = L.map('world-map').setView([20, 0], 2);

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
  }).addTo(map);

  // Cache/Dizionario per le coordinate delle città
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

  // Funzione per disegnare i pallini luminosi sulla mappa
  function addMarker(lat, lon, city, country, users) {
    L.circleMarker([lat, lon], {
      radius: Math.min(Math.max(users * 4, 8), 28),
      fillColor: '#00e5ff',
      color: '#00e5ff',
      weight: 1.5,
      opacity: 0.9,
      fillOpacity: 0.4
    }).addTo(map).bindPopup(`<b>${city} (${country})</b><br>${users} lettori`);
  }

  // 2. Caricamento dati dinamici
  fetch(`stats-data.json?t=${new Date().getTime()}`)
    .then(response => {
      if (!response.ok) throw new Error("File stats-data.json non trovato");
      return response.json();
    })
    .then(data => {
      // KPI Cards
      if (data.kpis) {
        document.getElementById('total-views').innerText = (data.kpis.total_views || 0).toLocaleString('it-IT');
        document.getElementById('google-clicks').innerText = (data.kpis.total_clicks || 0).toLocaleString('it-IT');
        document.getElementById('google-impressions').innerText = (data.kpis.total_impressions || 0).toLocaleString('it-IT');
        document.getElementById('avg-position').innerText = data.kpis.avg_position || '0';
      }

      // Grafico del traffico
      if (data.chart && data.chart.labels && data.chart.labels.length > 0) {
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
              x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#8b949e' } },
              y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#8b949e' } }
            }
          }
        });
      }

      // Mappa Geografica utenti
      if (data.geo_data && data.geo_data.length > 0) {
        data.geo_data.forEach(item => {
          if (cityCoords[item.city]) {
            const [lat, lon] = cityCoords[item.city];
            addMarker(lat, lon, item.city, item.country, item.users);
          } else {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(item.city + ', ' + item.country)}`)
              .then(res => res.json())
              .then(geoRes => {
                if (geoRes && geoRes.length > 0) {
                  const lat = parseFloat(geoRes[0].lat);
                  const lon = parseFloat(geoRes[0].lon);
                  addMarker(lat, lon, item.city, item.country, item.users);
                }
              })
              .catch(() => {});
          }
        });
      }

      // Tabella Search Queries
      const queriesTbody = document.getElementById('queries-table-body');
      if (queriesTbody) {
        queriesTbody.innerHTML = '';
        if (data.search_queries && data.search_queries.length > 0) {
          data.search_queries.forEach(q => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><b>${q.query}</b></td>
              <td>${q.clicks}</td>
              <td>${q.position}</td>
            `;
            queriesTbody.appendChild(tr);
          });
        } else {
          queriesTbody.innerHTML = '<tr><td colspan="3">Nessun dato disponibile</td></tr>';
        }
      }

      // Tabella Articoli Più Letti
      const postsTbody = document.getElementById('top-posts-body');
      if (postsTbody) {
        postsTbody.innerHTML = '';
        if (data.top_posts && data.top_posts.length > 0) {
          data.top_posts.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><a href="${p.url}" target="_blank" style="color: #00e5ff; text-decoration: none;">${p.title}</a></td>
              <td><b>${p.views.toLocaleString('it-IT')}</b></td>
            `;
            postsTbody.appendChild(tr);
          });
        } else {
          postsTbody.innerHTML = '<tr><td colspan="2">Nessun articolo trovato</td></tr>';
        }
      }
    })
    .catch(err => {
      console.error("Errore nel caricamento dei dati:", err);
    });
});
