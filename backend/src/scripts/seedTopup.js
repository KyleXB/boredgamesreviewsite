/**
 * seedTopup.js
 *
 * Counts how many games are already in the DB, then continues scanning
 * BGG IDs from where the main seeder left off until the target is reached.
 *
 *   node src/scripts/seedTopup.js
 *
 * Uses SEED_COUNT from .env (default 2500) as the target total.
 */

require('dotenv').config()
const { XMLParser } = require('fast-xml-parser')
const prisma = require('../prismaClient')
const gameRepository = require('../repositories/gameRepository')

const BGG_API_TOKEN = process.env.BGG_API_TOKEN || ''
const TARGET_COUNT  = parseInt(process.env.SEED_COUNT || '2500', 10)
const BATCH_SIZE    = 20
const DELAY_MS      = 3000
const START_ID      = 2501   // Pick up where the main seeder stopped
const MAX_ID        = 500000 // Safety ceiling

const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function fetchThingsBatch(bggIds) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggIds.join(',')}&stats=1`
  const headers = {
    'User-Agent': 'BoredGamesReviewApp/1.0 (University of Southern Denmark Exam Project)'
  }
  if (BGG_API_TOKEN) headers['Authorization'] = `Bearer ${BGG_API_TOKEN}`

  const response = await fetch(url, { headers })

  if (response.status === 429 || response.status === 503) {
    console.warn(`  [BGG] Throttled (${response.status}). Waiting 10s...`)
    await sleep(10000)
    return fetchThingsBatch(bggIds)
  }
  if (!response.ok) throw new Error(`BGG API HTTP ${response.status}`)

  const xml = await response.text()
  const parsed = xmlParser.parse(xml)
  if (!parsed.items || !parsed.items.item) return []
  return Array.isArray(parsed.items.item) ? parsed.items.item : [parsed.items.item]
}

function transformBggItem(item) {
  const bggId      = parseInt(item['@_id'], 10)
  const isExpansion = item['@_type'] === 'boardgameexpansion'

  let title = 'Untitled Game'
  if (Array.isArray(item.name)) {
    const primary = item.name.find(n => n['@_type'] === 'primary')
    title = primary ? primary['@_value'] : item.name[0]['@_value']
  } else if (item.name) {
    title = item.name['@_value'] || title
  }

  const description  = item.description ? String(item.description).replace(/&#10;/g, '\n').replace(/&quot;/g, '"') : ''
  const yearPublished = item.yearpublished ? parseInt(item.yearpublished['@_value'], 10) || null : null
  const minPlayers   = item.minplayers   ? parseInt(item.minplayers['@_value'],   10) || null : null
  const maxPlayers   = item.maxplayers   ? parseInt(item.maxplayers['@_value'],   10) || null : null
  const minPlaytime  = item.minplaytime  ? parseInt(item.minplaytime['@_value'],  10) || null : null
  const maxPlaytime  = item.maxplaytime  ? parseInt(item.maxplaytime['@_value'],  10) || null : null
  const minAge       = item.minage       ? parseInt(item.minage['@_value'],       10) || 0    : 0
  const thumbnail    = item.thumbnail || null
  const image        = item.image || null

  let complexity = 0.0
  if (item.statistics?.ratings?.averageweight) {
    complexity = parseFloat(item.statistics.ratings.averageweight['@_value']) || 0.0
  }

  const genres = [], mechanics = [], themes = []
  let publisher = null

  if (item.link) {
    const links = Array.isArray(item.link) ? item.link : [item.link]
    for (const link of links) {
      const type = link['@_type'], value = link['@_value']
      if (!value) continue
      if (type === 'boardgamecategory')  genres.push(value.trim())
      else if (type === 'boardgamemechanic') mechanics.push(value.trim())
      else if (type === 'boardgamefamily') {
        if (!value.startsWith('Components:') && !value.startsWith('Digital:') && !value.startsWith('Crowdfunding:'))
          themes.push(value.trim())
      } else if (type === 'boardgamepublisher' && !publisher) {
        publisher = value.trim()
      }
    }
  }

  return { bggId, title, description, yearPublished, minPlayers, maxPlayers,
           minPlaytime, maxPlaytime, minAge, complexity, thumbnail, image,
           publisher, isExpansion, genres, mechanics, themes }
}

async function main() {
  const currentCount = await prisma.game.count()
  const needed = TARGET_COUNT - currentCount

  console.log('====================================================')
  console.log('🔁 BGG Seed Top-up')
  console.log(`   Current DB count : ${currentCount}`)
  console.log(`   Target           : ${TARGET_COUNT}`)
  console.log(`   Need to add      : ${needed}`)
  console.log('====================================================')

  if (needed <= 0) {
    console.log('✅ Already at or above target. Nothing to do.')
    return
  }

  let added = 0
  let currentId = START_ID
  let batchIndex = 0

  while (added < needed && currentId <= MAX_ID) {
    batchIndex++
    const chunk = []
    for (let i = 0; i < BATCH_SIZE && currentId <= MAX_ID; i++, currentId++) {
      chunk.push(currentId)
    }

    try {
      const rawItems = await fetchThingsBatch(chunk)

      for (const item of rawItems) {
        if (item['@_type'] !== 'boardgame' && item['@_type'] !== 'boardgameexpansion') continue
        const gameData = transformBggItem(item)
        await gameRepository.upsertGame(gameData)
        added++
        if (added >= needed) break
      }

      console.log(`  ✓ Batch ${batchIndex} | Added ${added} / ${needed} (IDs scanned up to ${currentId - 1})`)
    } catch (err) {
      console.error(`  ✗ Batch ${batchIndex} error:`, err.message)
    }

    if (added < needed) await sleep(DELAY_MS)
  }

  const finalCount = await prisma.game.count()
  console.log('\n====================================================')
  console.log(`🎉 Top-up complete! DB now has ${finalCount} games.`)
  console.log('====================================================')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
