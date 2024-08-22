const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log(`Server Started At 3000 Port`)
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// 1 GET

app.get('/states/', async (request, response) => {
  const getStatesQuery = `
  SELECT 
  *
  FROM 
  state
  ORDER BY 
  state_id
  `

  const statesArray = await db.all(getStatesQuery)
  response.send(
    statesArray.map(state => ({
      stateId: state.state_id,
      stateName: state.state_name,
      population: state.population,
    })),
  )
})

// 2

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  SELECT 
  *
  FROM
   state
  WHERE
   state_id = ${stateId}
  `

  const state = await db.get(getStateQuery)

  const resultState = {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  }

  response.send(resultState)
})

// 3

app.post('/districts/', async (request, response) => {
  const districtDetails = request.body

  const {districtName, stateId, cases, cured, active, deaths} = districtDetails

  const postDistricInfoQuery = `
  INSERT INTO 
   district (district_name,state_id,cases,cured,active,deaths)
    VALUES (
      '${districtName}',
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths}
    ) 
  `

  await db.run(postDistricInfoQuery)
  response.send('District Successfully Added')
})

// 4

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
  SELECT 
  *
  FROM
   district
  WHERE
   district_id = ${districtId};
   
  `

  const districtObj = await db.get(getDistrictQuery)
  const district = {
    districtId: districtObj.district_id,
    districtName: districtObj.district_name,
    stateId: districtObj.state_id,
    cases: districtObj.cases,
    cured: districtObj.cured,
    active: districtObj.active,
    deaths: districtObj.deaths,
  }

  response.send(district)
})

// 5

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
  DELETE
   FROM
    district
  WHERE
   district_id = ${districtId} `

  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

// 6

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params

  const districtDetails = request.body

  const {districtName, stateId, cases, cured, active, deaths} = districtDetails

  const updateDistrictQuery = `
  UPDATE 
   district
  SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
  WHERE
   district_id = ${districtId}
  `

  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

// 7

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params

  const getStateStatsQuery = `
  SELECT 
   SUM(cases),
   SUM(cured),
   SUM(active),
   SUM(deaths)
  FROM 
    district
  WHERE 
     state_id = ${stateId};
  `
  const stats = await db.get(getStateStatsQuery)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

// 8

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params

  const getStateidQuery = `
  SELECT 
  state_id
  FROM
  district
  WHERE
  district_id = ${districtId}`

  const sid = await db.get(getStateidQuery)
  console.log(sid)

  const getStateNameQuery = `
  SELECT 
   state_name
  FROM
  state
  WHERE
state_id = ${sid.state_id};`

  const stateName = await db.get(getStateNameQuery)

  response.send({
    stateName: stateName.state_name,
  })
})

module.exports = app
