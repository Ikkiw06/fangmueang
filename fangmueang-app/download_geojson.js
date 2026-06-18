// Run once: node download_geojson.js
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const OUT = path.join(__dirname, 'public', 'bangkok_districts.geojson')

// Overpass API query - get all Bangkok district (khet) boundaries from OSM
const query = `[out:json][timeout:60];
area["name:en"="Bangkok"]["admin_level"="4"]->.bkk;
rel(area.bkk)["admin_level"="6"]["boundary"="administrative"];
out geom;`

const postData = `data=${encodeURIComponent(query)}`

const options = {
  hostname: 'overpass-api.de',
  path: '/api/interpreter',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'FangMueang/1.0'
  }
}

console.log('Fetching Bangkok districts from OpenStreetMap...')
console.log('(อาจใช้เวลา 20-30 วินาที)')

const req = https.request(options, (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    try {
      const osm = JSON.parse(data)
      const elements = osm.elements || []
      console.log(`✅ Got ${elements.length} Bangkok district relations`)

      // Convert OSM relations to GeoJSON
      const features = elements.map((rel, i) => {
        const tags = rel.tags || {}
        const name = tags['name'] || tags['name:th'] || `เขต${i+1}`

        // Get outer ring coordinates from members
        const outerMembers = rel.members?.filter(m => m.type === 'way' && m.role === 'outer') || []

        // Collect all coordinates in order
        let coords = []
        for (const member of outerMembers) {
          const wayCoords = (member.geometry || []).map(pt => [pt.lon, pt.lat])
          if (coords.length === 0) {
            coords = wayCoords
          } else {
            // Connect ways
            const last = coords[coords.length - 1]
            const first = wayCoords[0]
            const firstRev = wayCoords[wayCoords.length - 1]
            if (Math.abs(last[0]-first[0]) < 0.001 && Math.abs(last[1]-first[1]) < 0.001) {
              coords = coords.concat(wayCoords.slice(1))
            } else if (Math.abs(last[0]-firstRev[0]) < 0.001 && Math.abs(last[1]-firstRev[1]) < 0.001) {
              coords = coords.concat(wayCoords.slice(0,-1).reverse())
            } else {
              coords = coords.concat(wayCoords)
            }
          }
        }

        // Close polygon
        if (coords.length > 0 && (coords[0][0] !== coords[coords.length-1][0] || coords[0][1] !== coords[coords.length-1][1])) {
          coords.push(coords[0])
        }

        return {
          type: 'Feature',
          properties: { dname: name, name: name, id: i+1, osm_id: rel.id },
          geometry: { type: 'Polygon', coordinates: [coords] }
        }
      }).filter(f => f.geometry.coordinates[0].length >= 4)

      console.log(`✅ Converted ${features.length} districts to GeoJSON`)
      features.forEach(f => console.log(`   ${f.properties.name} (${f.geometry.coordinates[0].length} pts)`))

      const geojson = { type: 'FeatureCollection', features }
      fs.writeFileSync(OUT, JSON.stringify(geojson, null, 2), 'utf8')
      console.log(`\n✅ Saved! Now refresh localhost:5173`)
    } catch(e) {
      console.error('❌ Parse error:', e.message)
      console.error('Response:', data.slice(0, 200))
    }
  })
})

req.on('error', e => console.error('❌ Error:', e.message))
req.write(postData)
req.end()
