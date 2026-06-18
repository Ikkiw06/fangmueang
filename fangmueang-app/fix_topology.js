// node fix_topology.js
// Fixes overlapping/imprecise Bangkok district boundaries using TopoJSON
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GEO = path.join(__dirname, 'public', 'bangkok_districts.geojson')

// Install topojson if needed
try {
  await import('topojson-server')
} catch {
  console.log('Installing topojson packages...')
  execSync('npm install topojson-server topojson-client --save-dev', { stdio: 'inherit', cwd: __dirname })
}

const { topology } = await import('topojson-server')
const { feature } = await import('topojson-client')

const raw = fs.readFileSync(GEO, 'utf8')
const geo = JSON.parse(raw)
console.log(`Input: ${geo.features.length} features`)

// Round coordinates to reduce noise (6 decimal places = ~11cm precision)
function roundCoords(geo) {
  function roundArr(coords) {
    if (Array.isArray(coords[0])) return coords.map(roundArr)
    return [Math.round(coords[0] * 1e5) / 1e5, Math.round(coords[1] * 1e5) / 1e5]
  }
  return {
    ...geo,
    features: geo.features.map(f => ({
      ...f,
      geometry: {
        ...f.geometry,
        coordinates: f.geometry.coordinates.map(ring =>
          Array.isArray(ring[0][0]) ? ring.map(r => r.map(roundArr)) : ring.map(roundArr)
        )
      }
    }))
  }
}

const rounded = roundCoords(geo)

// Convert to TopoJSON (quantization=1e6 merges shared boundaries)
const topo = topology({ districts: rounded }, 1e6)

// Simplify topology (removes tiny jogs, false overlaps)
// Convert back to GeoJSON
const fixed = feature(topo, topo.objects.districts)

// Restore original properties (topojson preserves them)
fixed.features = fixed.features.map((f, i) => ({
  ...f,
  properties: geo.features[i]?.properties || f.properties
}))

fs.writeFileSync(GEO, JSON.stringify(fixed, null, 2), 'utf8')
console.log(`✅ Topology fixed! ${fixed.features.length} clean districts saved.`)
console.log('Refresh localhost:5173 🎉')
