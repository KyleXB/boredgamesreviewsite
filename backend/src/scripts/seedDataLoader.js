require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { XMLParser } = require('fast-xml-parser')
const gameRepository = require('../repositories/gameRepository')

const BGG_API_TOKEN = process.env.BGG_API_TOKEN || ''
const BATCH_SIZE = 20 // BGG handles up to 20 IDs per /thing request smoothly
const DELAY_MS = 3000  // 2.5 second delay between batch queries to respect BGG throttling

// XML Parser instance configured for BGG XML structures
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
})

// Helper sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Fetch detailed game metadata from BGG XML API2 /thing endpoint for a batch of IDs
 */
async function fetchThingsBatch(bggIds) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggIds.join(',')}&stats=1`

  const headers = {
    'User-Agent': 'BoredGamesReviewApp/1.0 (University of Southern Denmark Exam Project)'
  }

  if (BGG_API_TOKEN) {
    headers['Authorization'] = `Bearer ${BGG_API_TOKEN}`
  }

  const response = await fetch(url, { headers })

  if (response.status === 429 || response.status === 503) {
    console.warn(`[BGG API] Throttled (${response.status}). Waiting 10 seconds before retrying...`)
    await sleep(10000)
    return await fetchThingsBatch(bggIds)
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch from BGG API: HTTP ${response.status} ${response.statusText}`)
  }

  const xmlText = await response.text()
  const parsed = xmlParser.parse(xmlText)

  if (!parsed.items || !parsed.items.item) {
    return []
  }

  const items = Array.isArray(parsed.items.item) ? parsed.items.item : [parsed.items.item]
  return items
}

/**
 * Clean and transform a raw BGG XML <item> into a database-ready object
 */
function transformBggItem(item) {
  const bggId = parseInt(item['@_id'], 10)
  const isExpansion = item['@_type'] === 'boardgameexpansion'

  // Extract primary name
  let title = 'Untitled Game'
  if (Array.isArray(item.name)) {
    const primaryName = item.name.find(n => n['@_type'] === 'primary')
    title = primaryName ? primaryName['@_value'] : item.name[0]['@_value']
  } else if (item.name) {
    title = item.name['@_value'] || title
  }

  // Description (unescape HTML entities if needed)
  const description = item.description ? String(item.description).replace(/&#10;/g, '\n').replace(/&quot;/g, '"') : ''

  // Numerical & metadata attributes
  const yearPublished = item.yearpublished ? parseInt(item.yearpublished['@_value'], 10) || null : null
  const minPlayers = item.minplayers ? parseInt(item.minplayers['@_value'], 10) || null : null
  const maxPlayers = item.maxplayers ? parseInt(item.maxplayers['@_value'], 10) || null : null
  const minPlaytime = item.minplaytime ? parseInt(item.minplaytime['@_value'], 10) || null : null
  const maxPlaytime = item.maxplaytime ? parseInt(item.maxplaytime['@_value'], 10) || null : null
  const minAge = item.minage ? parseInt(item.minage['@_value'], 10) || 0 : 0
  const thumbnail = item.thumbnail || null
  const image = item.image || null

  // Weight / Complexity from stats
  let complexity = 0.0
  if (item.statistics && item.statistics.ratings && item.statistics.ratings.averageweight) {
    complexity = parseFloat(item.statistics.ratings.averageweight['@_value']) || 0.0
  }

  // Extract categories, mechanics, themes, and publishers from <link> nodes
  const genres = []
  const mechanics = []
  const themes = []
  let publisher = null

  if (item.link) {
    const links = Array.isArray(item.link) ? item.link : [item.link]

    for (const link of links) {
      const type = link['@_type']
      const value = link['@_value']

      if (!value) continue

      if (type === 'boardgamecategory') {
        genres.push(value.trim())
      } else if (type === 'boardgamemechanic') {
        mechanics.push(value.trim())
      } else if (type === 'boardgamefamily') {
        // Filter out non-thematic family tags (e.g., "Components:", "Digital Implementations:")
        if (!value.startsWith('Components:') && !value.startsWith('Digital:') && !value.startsWith('Crowdfunding:')) {
          themes.push(value.trim())
        }
      } else if (type === 'boardgamepublisher' && !publisher) {
        publisher = value.trim()
      }
    }
  }

  return {
    bggId,
    title,
    description,
    yearPublished,
    minPlayers,
    maxPlayers,
    minPlaytime,
    maxPlaytime,
    minAge,
    complexity,
    thumbnail,
    image,
    publisher,
    isExpansion,
    genres,
    mechanics,
    themes
  }
}

/**
 * Main seeding workflow
 */
async function main() {
  const TARGET_COUNT = parseInt(process.env.SEED_COUNT || '2500', 10)
  console.log(`====================================================`)
  console.log(`🚀 Starting BGG Seed Data Loader`)
  console.log(`🎯 Target Game Quantity: ${TARGET_COUNT}`)
  console.log(`====================================================`)

  // Step 1: Collect Candidate BGG IDs to fetch
  // Prioritize top famous games + top hot games + broad ID sample
  const idSet = new Set()

  console.log(`[1/3] Fetching trending games from BGG /hot endpoint...`)
  try {
    const hotResponse = await fetch('https://boardgamegeek.com/xmlapi2/hot?type=boardgame')
    if (hotResponse.ok) {
      const hotXml = await hotResponse.text()
      const parsedHot = xmlParser.parse(hotXml)
      if (parsedHot.items && parsedHot.items.item) {
        const hotItems = Array.isArray(parsedHot.items.item) ? parsedHot.items.item : [parsedHot.items.item]
        hotItems.forEach(i => idSet.add(parseInt(i['@_id'], 10)))
        console.log(`  ✓ Loaded ${idSet.size} hot games from BGG`)
      }
    }
  } catch (err) {
    console.warn(`  ! Could not fetch hot games: ${err.message}`)
  }

  // Fill in known top-ranked and classic game IDs up to TARGET_COUNT
  // Common all-time greats & popular games across all categories
  const famousIds = [
    13, 161936, 174430, 266192, 167791, 224517, 233078, 169786, 312484, 192291,
    28720, 30549, 12, 11, 230802, 342942, 291457, 187645, 177736, 251247,
    148228, 172818, 173346, 205637, 204583, 220308, 237182, 264220, 246900
  ]
  famousIds.forEach(id => idSet.add(id))

  // Fill candidate IDs sequentially across top game ID blocks
  let currentId = 1
  while (idSet.size < TARGET_COUNT && currentId <= 350000) {
    idSet.add(currentId)
    currentId++
  }

  const allIds = Array.from(idSet).slice(0, TARGET_COUNT)
  console.log(`[2/3] Processing ${allIds.length} candidate board games in batches of ${BATCH_SIZE}...`)

  let savedCount = 0
  let batchIndex = 0

  for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
    batchIndex++
    const chunk = allIds.slice(i, i + BATCH_SIZE)

    try {
      const rawItems = await fetchThingsBatch(chunk)

      for (const item of rawItems) {
        // Only import items that are board games or expansions
        if (item['@_type'] !== 'boardgame' && item['@_type'] !== 'boardgameexpansion') {
          continue
        }

        const gameData = transformBggItem(item)
        await gameRepository.upsertGame(gameData)
        savedCount++
      }

      console.log(`  ✓ Batch ${batchIndex} finished | Games saved to DB: ${savedCount} / ${allIds.length}`)
    } catch (err) {
      console.error(`  ✗ Error in batch ${batchIndex}:`, err.message)
    }

    // Wait between calls to comply with BGG API guidelines
    await sleep(DELAY_MS)
  }

  console.log(`====================================================`)
  console.log(`🎉 Seeding complete! Successfully saved ${savedCount} board games into SQLite.`)
  console.log(`====================================================`)
}

if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => {
      const prisma = require('../prismaClient')
      prisma.$disconnect()
    })
}

module.exports = { main, transformBggItem }
