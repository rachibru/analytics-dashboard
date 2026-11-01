document.addEventListener('DOMContentLoaded', () => {
  // 1. Inizializzazione Mappa Mondiale Scura (CARTO Dark Matter)
  const map = L.map('world-map').setView([20, 0], 2);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  // 2. Caricamento dati dinamici da stats-data.json
  fetch('stats-data.json')
    .then(response => {
      if (!response.ok) {
        throw new Error("Impossibile caricare stats-data.json");
      }
      return response.json();
    })
    .then(data => {
      // Aggiornamento KPI Cards
      document.getElementById('total-views').innerText = data.kpis.total_views.toLocaleString('it-IT');
      document.getElementById('google-clicks').innerText = data.kpis.total_clicks.toLocaleString('it-IT');
      document.getElementById('google-impressions').innerText = data.kpis.total_impressions.toLocaleString('it-IT');
      document.getElementById('avg-position').innerText = data.kpis.avg_position;

      // Popolamento Mappa con le città dei lettori
      if (data.geo_data && data.geo_data.length > 0) {
        data.geo_data.forEach(item => {
          // Geocoding approssimativo tramite API gratuita OpenStreetMap Nominatim
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(item.city + ', ' + item.country)}`)
            .then(res => res.json())
            .then(geoRes => {
              if (geoRes && geoRes.length > 0) {
                const lat = parseFloat(geoRes[0].lat);
                const lon = parseFloat(geoRes[0].lon);
                
                L.circleMarker([lat, lon], {
                  radius: Math.min(Math.max(item.users * 2, 6), 25),
                  fillColor: '#00e5ff',
                  color: '#00e5ff',
                  weight: 1,
                  opacity: 0.9,
                  fillOpacity: 0.5
                }).addTo(map).bindPopup(`<b>${item.city} (${item.country})</b><br>${item.users} utenti attivi`);
              }
            })
            .catch(() => {});
        });
      }

      // Popolamento Tabella Top Query (Search Console)
      const queriesTbody = document.getElementById('queries-table-body');
      queriesTbody.innerHTML = '';
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

      // Popolamento Tabella Articoli Più Letti
      const postsTbody = document.getElementById('top-posts-body');
      postsTbody.innerHTML = '';
      data.top_posts.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><a href="${p.url}" target="_blank" style="color: #00e5ff; text-decoration: none;">${p.title}</a></td>
          <td><b>${p.views.toLocaleString('it-IT')}</b></td>
          <td>${p.avg_time}</td>
        `;
        postsTbody.appendChild(tr);
      });
    })
    .catch(error => {
      console.error("Errore caricamento dati:", error);
    });
});
